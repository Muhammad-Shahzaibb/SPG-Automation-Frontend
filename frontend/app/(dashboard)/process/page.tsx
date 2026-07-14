"use client";

import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Download, FileText, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { extractService } from "@/services";
import { extractErrorMessage } from "@/services/api-client";
import type { ParseResponse } from "@/types";
import { PageHeader } from "@/components/layout/page-header";
import { UploadArea } from "@/components/upload/upload-area";
import { SearchBar } from "@/components/common/search-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function ProcessPage() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [parseResult, setParseResult] = useState<ParseResponse | null>(null);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [columnSearch, setColumnSearch] = useState("");
  const [filename, setFilename] = useState("Specifications_Combined");

  const parseMutation = useMutation({
    mutationFn: extractService.parse,
    onSuccess: (data) => {
      setParseResult(data);
      setSelectedColumns(data.columns);
      toast.success(
        `Parsed ${data.files_ok} of ${data.files_total} file(s)`
      );
      if (data.errors.length > 0) {
        toast.warning(`${data.errors.length} file(s) failed to parse`);
      }
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  });

  const excelMutation = useMutation({
    mutationFn: extractService.downloadExcel,
    onSuccess: () => {
      toast.success("Excel downloaded");
      setParseResult(null);
      setSelectedFiles([]);
      setSelectedColumns([]);
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
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
      toast.error("Select at least one .docx file");
      return;
    }
    parseMutation.mutate(selectedFiles);
  };

  const handleDownload = () => {
    if (!parseResult) return;
    if (selectedColumns.length === 0) {
      toast.error("Select at least one column");
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
    setColumnSearch("");
    setFilename("Specifications_Combined");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Extract Documents"
        description="Upload .docx specification files, select physical parameters, and download Excel."
      />

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Upload .docx files</CardTitle>
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

          <div className="grid gap-6 lg:grid-cols-2">
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
                    Unselect All
                  </Button>
                </div>
                <ScrollArea className="h-[280px] rounded-lg border p-3">
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
                <CardTitle className="text-base">Generate Excel</CardTitle>
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
                  <p className="text-xs text-muted-foreground">
                    .xlsx is appended automatically if missing
                  </p>
                </div>

                <div className="rounded-lg border bg-muted/30 p-4 text-sm space-y-1">
                  <p>
                    <span className="text-muted-foreground">Run ID: </span>
                    <span className="font-mono text-xs">{parseResult.run_id}</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Records: </span>
                    {parseResult.records.length}
                  </p>
                </div>

                {parseResult.records.length > 0 && (
                  <ScrollArea className="h-[160px] rounded-lg border p-3">
                    <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                      Parsed files
                    </p>
                    {parseResult.records.map((rec, i) => (
                      <p key={i} className="text-sm py-0.5">
                        {rec.file}
                        {rec.SpecNo ? ` — ${rec.SpecNo}` : ""}
                      </p>
                    ))}
                  </ScrollArea>
                )}

                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={handleDownload}
                    disabled={
                      selectedColumns.length === 0 || excelMutation.isPending
                    }
                  >
                    <Download className="h-4 w-4" />
                    {excelMutation.isPending
                      ? "Generating..."
                      : "Download Excel"}
                  </Button>
                  <Button variant="outline" onClick={reset}>
                    <RotateCcw className="h-4 w-4" />
                    Start over
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
