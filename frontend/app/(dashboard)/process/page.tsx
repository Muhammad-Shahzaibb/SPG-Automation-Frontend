"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Download, FileText, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { extractService } from "@/services";
import { extractErrorMessage } from "@/services/api-client";
import type { ParseRecord, ParseResponse, PreviewResponse } from "@/types";
import { PageHeader } from "@/components/layout/page-header";
import { UploadArea } from "@/components/upload/upload-area";
import { PreviewTable } from "@/components/upload/preview-table";
import { SearchBar } from "@/components/common/search-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

function isRunExpiredError(error: unknown): boolean {
  if (axios.isAxiosError(error)) {
    return error.response?.status === 404;
  }
  const message = extractErrorMessage(error).toLowerCase();
  return message.includes("not found") || message.includes("expired");
}

export default function ProcessPage() {
  const queryClient = useQueryClient();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [parseResult, setParseResult] = useState<ParseResponse | null>(null);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [debouncedColumns, setDebouncedColumns] = useState<string[]>([]);
  const [columnSearch, setColumnSearch] = useState("");
  const [filename, setFilename] = useState("Specifications_Combined");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedColumns(selectedColumns);
    }, 250);
    return () => clearTimeout(timer);
  }, [selectedColumns]);

  const resetForExpiredRun = (message?: string) => {
    setParseResult(null);
    setSelectedColumns([]);
    setDebouncedColumns([]);
    toast.error(
      message || "Run expired or not found. Please upload and parse again."
    );
  };

  const parseMutation = useMutation({
    mutationFn: extractService.parse,
    onSuccess: async (data) => {
      setParseResult(data);
      setSelectedColumns(data.columns);
      setDebouncedColumns(data.columns);
      toast.success(`Parsed ${data.files_ok} of ${data.files_total} file(s)`);
      if (data.errors.length > 0) {
        toast.warning(`${data.errors.length} file(s) failed to parse`);
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["dashboard-user"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-admin"] }),
      ]);
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });

  const previewQuery = useQuery<PreviewResponse>({
    queryKey: ["extract-preview", parseResult?.run_id, debouncedColumns],
    queryFn: () =>
      extractService.preview({
        run_id: parseResult!.run_id,
        selected_columns: debouncedColumns,
      }),
    enabled: !!parseResult?.run_id && debouncedColumns.length > 0,
    retry: false,
  });

  useEffect(() => {
    if (!previewQuery.error) return;
    if (isRunExpiredError(previewQuery.error)) {
      resetForExpiredRun(extractErrorMessage(previewQuery.error));
      return;
    }
    toast.error(extractErrorMessage(previewQuery.error));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- toast only when error identity updates
  }, [previewQuery.errorUpdatedAt]);

  const previewRows = previewQuery.data?.rows ?? [];

  const removeRowsMutation = useMutation({
    mutationFn: extractService.removeRows,
    onSuccess: async (data) => {
      const remaining = data.remaining_rows ?? (data as any).remaining_count ?? 0;
      setParseResult((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          columns: data.columns ?? prev.columns,
          files_ok: remaining,
          files_total: remaining + prev.files_failed,
        };
      });

      if (data.columns) {
        setSelectedColumns((prev) =>
          prev.filter((col) => data.columns!.includes(col))
        );
        setDebouncedColumns((prev) =>
          prev.filter((col) => data.columns!.includes(col))
        );
      }

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["extract-preview", parseResult?.run_id],
        }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-user"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-admin"] }),
      ]);
      toast.success(
        data.removed_count === 1
          ? "Row removed from preview"
          : `${data.removed_count} rows removed from preview`
      );
    },
    onError: (error) => {
      if (isRunExpiredError(error)) {
        resetForExpiredRun(extractErrorMessage(error));
        return;
      }
      toast.error(extractErrorMessage(error));
    },
  });

  const excelMutation = useMutation({
    mutationFn: extractService.downloadExcel,
    onSuccess: async () => {
      toast.success("Excel downloaded");
      setParseResult(null);
      setSelectedFiles([]);
      setSelectedColumns([]);
      setDebouncedColumns([]);
      setColumnSearch("");
      setFilename("Specifications_Combined");
      queryClient.removeQueries({ queryKey: ["extract-preview"] });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["dashboard-user"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-admin"] }),
      ]);
    },
    onError: (error) => {
      if (isRunExpiredError(error)) {
        resetForExpiredRun(extractErrorMessage(error));
        return;
      }
      toast.error(extractErrorMessage(error));
    },
  });

  const filteredColumns = useMemo(() => {
    if (!parseResult) return [];
    const q = columnSearch.toLowerCase();
    return q
      ? parseResult.columns.filter((c) => c.toLowerCase().includes(q))
      : parseResult.columns;
  }, [parseResult, columnSearch]);

  const toggleColumn = (col: string) => {
    setSelectedColumns((prev) =>
      prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]
    );
  };

  const handleParse = () => {
    if (selectedFiles.length === 0) {
      toast.error("Select at least one .docx or .pdf file");
      return;
    }
    parseMutation.mutate(selectedFiles);
  };

  const handleRemoveRow = (row: ParseRecord) => {
    if (!parseResult?.run_id) return;
    if (!row.row_id) {
      toast.error("This row cannot be removed (missing row id)");
      return;
    }
    removeRowsMutation.mutate({
      run_id: parseResult.run_id,
      row_ids: [row.row_id],
    });
  };

  const handleDownload = () => {
    if (!parseResult) return;
    if (selectedColumns.length === 0) {
      toast.error("Select at least one column");
      return;
    }
    if (previewRows.length === 0) {
      toast.error("No preview rows left to export");
      return;
    }
    excelMutation.mutate({
      run_id: parseResult.run_id,
      selected_columns: selectedColumns,
      filename: filename || undefined,
    });
  };

  const reset = () => {
    setSelectedFiles([]);
    setParseResult(null);
    setSelectedColumns([]);
    setDebouncedColumns([]);
    setColumnSearch("");
    setFilename("Specifications_Combined");
    queryClient.removeQueries({ queryKey: ["extract-preview"] });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Extract Documents"
        description="Upload .docx or .pdf files, preview selected columns, remove unwanted rows, then download Excel."
      />

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Upload .docx or .pdf files</CardTitle>
        </CardHeader>
        <CardContent>
          <UploadArea
            files={selectedFiles}
            onFilesChange={setSelectedFiles}
            disabled={parseMutation.isPending || !!parseResult}
          />
          {!parseResult && (
            <div className="mt-4 flex justify-end">
              <Button
                onClick={handleParse}
                disabled={selectedFiles.length === 0 || parseMutation.isPending}
              >
                <FileText className="h-4 w-4" />
                {parseMutation.isPending ? "Parsing..." : "Parse Documents"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {parseResult && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Files total</p>
                <p className="text-2xl font-bold">{parseResult.files_total}</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Parsed OK</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {parseResult.files_ok}
                </p>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Failed</p>
                <p className="text-2xl font-bold text-destructive">
                  {parseResult.files_failed}
                </p>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Columns found</p>
                <p className="text-2xl font-bold">{parseResult.columns.length}</p>
              </CardContent>
            </Card>
          </div>

          {parseResult.errors.length > 0 && (
            <Card className="border-destructive/30 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base text-destructive">
                  Parse errors
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                {parseResult.errors.map((err, i) => (
                  <p key={i}>
                    <span className="font-medium">{err.file}:</span> {err.message}
                  </p>
                ))}
              </CardContent>
            </Card>
          )}

          <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Select columns</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <SearchBar
                  value={columnSearch}
                  onChange={setColumnSearch}
                  placeholder="Search columns..."
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedColumns(parseResult.columns)}
                  >
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedColumns([])}
                  >
                    Clear
                  </Button>
                </div>
                <ScrollArea className="h-[320px] rounded-lg border p-3">
                  <div className="space-y-2">
                    {filteredColumns.map((col) => (
                      <label
                        key={col}
                        className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50"
                      >
                        <Checkbox
                          checked={selectedColumns.includes(col)}
                          onCheckedChange={() => toggleColumn(col)}
                        />
                        <span className="text-sm">{col}</span>
                      </label>
                    ))}
                  </div>
                </ScrollArea>
                <p className="text-xs text-muted-foreground">
                  {selectedColumns.length} of {parseResult.columns.length} selected
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Download Excel</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="filename">Output file name</Label>
                  <Input
                    id="filename"
                    value={filename}
                    onChange={(e) => setFilename(e.target.value)}
                    placeholder="Specifications_Combined"
                  />
                </div>
                <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                  <p className="text-muted-foreground">
                    Run ID:{" "}
                    <span className="font-mono text-xs text-foreground">
                      {parseResult.run_id}
                    </span>
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    Preview rows:{" "}
                    <span className="text-foreground">
                      {previewQuery.data?.total_rows ?? previewRows.length}
                    </span>
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={handleDownload}
                    disabled={
                      selectedColumns.length === 0 ||
                      previewRows.length === 0 ||
                      excelMutation.isPending ||
                      removeRowsMutation.isPending
                    }
                  >
                    <Download className="h-4 w-4" />
                    {excelMutation.isPending ? "Downloading..." : "Download Excel"}
                  </Button>
                  <Button variant="outline" onClick={reset}>
                    <RotateCcw className="h-4 w-4" />
                    Start over
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Live preview</CardTitle>
            </CardHeader>
            <CardContent>
              <PreviewTable
                rows={previewRows}
                selectedColumns={debouncedColumns}
                isLoading={
                  debouncedColumns.length > 0 &&
                  (previewQuery.isLoading ||
                    previewQuery.isFetching ||
                    removeRowsMutation.isPending)
                }
                removing={removeRowsMutation.isPending}
                onRemoveRow={handleRemoveRow}
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
