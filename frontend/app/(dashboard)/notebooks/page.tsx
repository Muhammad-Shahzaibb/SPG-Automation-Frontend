"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FileSpreadsheet,
  Download,
  RotateCcw,
  Loader2,
  AlertTriangle,
  X,
  FileCheck2,
  Layers,
  FileX2,
  ListFilter,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { notebookService } from "@/services";
import { extractErrorMessage } from "@/services/api-client";
import type { NotebookParseResponse } from "@/types";
import { PageHeader } from "@/components/layout/page-header";
import { NotebookUploadArea } from "@/components/notebooks/notebook-upload-area";
import { NotebookResultsTable } from "@/components/notebooks/notebook-results-table";
import { NotebookRunTimer } from "@/components/notebooks/notebook-run-timer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function NotebooksPage() {
  const queryClient = useQueryClient();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [parseResult, setParseResult] = useState<NotebookParseResponse | null>(null);
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());
  const [parseCreatedAt, setParseCreatedAt] = useState<number | null>(null);
  const [filename, setFilename] = useState("HardRoll_Combined");
  const [dismissErrors, setDismissErrors] = useState(false);

  // Mutation: Parse Notebooks
  const parseMutation = useMutation({
    mutationFn: notebookService.parse,
    onSuccess: async (data) => {
      setParseResult(data);
      setParseCreatedAt(Date.now());
      setDismissErrors(false);

      // Check all rows by default
      const allIds = new Set(data.rows.map((r) => r.row_id));
      setSelectedRowIds(allIds);

      toast.success(
        `Parsed ${data.files_ok} sheet(s) across ${data.files_total} file(s)`
      );

      if (data.errors && data.errors.length > 0) {
        toast.warning(
          `${data.errors.length} file(s) failed or had parsing warnings`
        );
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["dashboard-user"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-admin"] }),
      ]);
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error));
    },
  });

  // Mutation: Remove Rows
  const removeRowsMutation = useMutation({
    mutationFn: notebookService.removeRows,
    onSuccess: async (data, variables) => {
      const removedSet = new Set(variables.row_ids);

      setParseResult((prev) => {
        if (!prev) return null;
        const updatedRows = prev.rows.filter((r) => !removedSet.has(r.row_id));
        return {
          ...prev,
          files_ok: data.remaining_count ?? updatedRows.length,
          rows: updatedRows,
        };
      });

      setSelectedRowIds((prev) => {
        const next = new Set<string>();
        for (const id of prev) {
          if (!removedSet.has(id)) {
            next.add(id);
          }
        }
        return next;
      });

      toast.success(
        data.removed_count === 1
          ? "1 sheet removed from preview"
          : `${data.removed_count} sheets removed from preview`
      );
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error));
    },
  });

  // Mutation: Download Consolidated Excel
  const downloadMutation = useMutation({
    mutationFn: notebookService.downloadExcel,
    onSuccess: async () => {
      toast.success("Consolidated Excel downloaded successfully!");
      // Reset state for fresh upload as requested in the specification
      resetState();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["dashboard-user"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-admin"] }),
      ]);
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error));
    },
  });

  const handleParse = () => {
    if (selectedFiles.length === 0) {
      toast.error("Please select at least one .xlsx notebook file");
      return;
    }
    parseMutation.mutate(selectedFiles);
  };

  const handleToggleRow = (rowId: string) => {
    setSelectedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(rowId)) {
        next.delete(rowId);
      } else {
        next.add(rowId);
      }
      return next;
    });
  };

  const handleToggleAll = (selectAll: boolean) => {
    if (!parseResult) return;
    if (selectAll) {
      setSelectedRowIds(new Set(parseResult.rows.map((r) => r.row_id)));
    } else {
      setSelectedRowIds(new Set());
    }
  };

  const handleRemoveUnchecked = () => {
    if (!parseResult?.run_id) return;
    const uncheckedIds = parseResult.rows
      .filter((r) => !selectedRowIds.has(r.row_id))
      .map((r) => r.row_id);

    if (uncheckedIds.length === 0) {
      toast.info("All rows are currently selected. Uncheck rows first to remove them.");
      return;
    }

    removeRowsMutation.mutate({
      run_id: parseResult.run_id,
      row_ids: uncheckedIds,
    });
  };

  const handleRemoveSingleRow = (rowId: string) => {
    if (!parseResult?.run_id) return;
    removeRowsMutation.mutate({
      run_id: parseResult.run_id,
      row_ids: [rowId],
    });
  };

  const handleDownload = () => {
    if (!parseResult?.run_id) return;

    if (parseResult.rows.length === 0) {
      toast.error("No sheet records remain to export");
      return;
    }

    // If user has unchecked rows that haven't been removed yet, remind or auto-exclude
    const uncheckedCount = parseResult.rows.length - selectedRowIds.size;
    if (uncheckedCount > 0) {
      toast.warning(
        `Note: You have ${uncheckedCount} unchecked row(s). Click "Remove Unchecked" if you wish to exclude them from the export.`
      );
    }

    downloadMutation.mutate({
      run_id: parseResult.run_id,
      filename: filename.trim() ? filename.trim() : "HardRoll_Combined",
    });
  };

  const resetState = () => {
    setSelectedFiles([]);
    setParseResult(null);
    setSelectedRowIds(new Set());
    setParseCreatedAt(null);
    setFilename("HardRoll_Combined");
    setDismissErrors(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header with distinct teal styling badge */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Excel Notebook Extractor"
          description="Dedicated pipeline for .xlsx Hard Roll Test Result workbooks. Each sheet is converted into a structured record with target specifications and measurement statistics."
        />
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-500/30 bg-teal-50 dark:bg-teal-950/40 px-3 py-1 text-xs font-semibold text-teal-700 dark:text-teal-300 shadow-xs">
            <FileSpreadsheet className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
            Excel Hard Roll Engine
          </span>
        </div>
      </div>

      {/* STEP 1: Upload Section */}
      <Card className="border-teal-500/20 shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base text-foreground font-semibold flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                Upload .xlsx Workbooks
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Drop one or more Excel workbook files (.xlsx). Every usable sheet becomes an exportable row.
              </CardDescription>
            </div>
            {parseResult && (
              <Button
                variant="outline"
                size="sm"
                onClick={resetState}
                className="h-8 text-xs border-teal-500/30 text-teal-700 hover:bg-teal-50 dark:text-teal-300"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                New Upload
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <NotebookUploadArea
            files={selectedFiles}
            onFilesChange={setSelectedFiles}
            disabled={parseMutation.isPending || !!parseResult}
          />

          {!parseResult && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {selectedFiles.length > 0
                  ? `${selectedFiles.length} workbook(s) selected.`
                  : "No files selected yet."}
              </p>
              <Button
                onClick={handleParse}
                disabled={selectedFiles.length === 0 || parseMutation.isPending}
                className="bg-teal-600 hover:bg-teal-700 text-white font-medium shadow-sm transition-all"
              >
                {parseMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Parsing Notebooks...</span>
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="h-4 w-4" />
                    <span>Parse Notebooks</span>
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* STEP 2: Parsing Spinner State */}
      {parseMutation.isPending && (
        <Card className="border-teal-500/30 bg-teal-50/20 dark:bg-teal-950/20 shadow-xs">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="relative mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
            <h4 className="text-base font-semibold text-foreground">
              Extracting Workbooks & Worksheets
            </h4>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground">
              Reading headers, SPECS targets (TAR/MIN/MAX), measurement counts, and computing statistical distributions...
            </p>
          </CardContent>
        </Card>
      )}

      {/* STEP 3 & 4: Results, Warnings, Table, and Download */}
      {parseResult && (
        <div className="space-y-6">
          {/* Dismissible Errors Banner */}
          {parseResult.errors && parseResult.errors.length > 0 && !dismissErrors && (
            <div className="relative rounded-xl border border-amber-500/30 bg-amber-50/80 dark:bg-amber-950/30 p-4 text-sm text-amber-900 dark:text-amber-200 shadow-xs">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-xs sm:text-sm">
                      {parseResult.errors.length} file(s) had parsing issues or no usable sheets:
                    </p>
                    <button
                      type="button"
                      onClick={() => setDismissErrors(true)}
                      className="text-amber-700 hover:text-amber-950 dark:text-amber-300 dark:hover:text-amber-100 p-1"
                      aria-label="Dismiss warnings"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <ul className="mt-2 space-y-1 text-xs">
                    {parseResult.errors.map((err, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="font-mono font-medium text-amber-800 dark:text-amber-300">
                          {err.file}:
                        </span>
                        <span>{err.message}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Metric Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-border shadow-xs">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Files Processed</p>
                  <p className="text-2xl font-bold tracking-tight text-foreground">
                    {parseResult.files_total}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border shadow-xs">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Sheets Parsed OK</p>
                  <p className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                    {parseResult.files_ok}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Each sheet = 1 row</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border shadow-xs">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                  <FileX2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Files Failed</p>
                  <p className="text-2xl font-bold tracking-tight text-destructive">
                    {parseResult.files_failed}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border shadow-xs">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
                  <ListFilter className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Selected for Export</p>
                  <p className="text-2xl font-bold tracking-tight text-teal-700 dark:text-teal-300">
                    {selectedRowIds.size} / {parseResult.rows.length}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Active in download</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* STEP 4: Download & Session Controls Card */}
          <Card className="border-teal-500/30 bg-card shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-base text-foreground font-semibold flex items-center gap-2">
                    <Download className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                    Consolidated Download
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-0.5">
                    Generate the unified Hard Roll test specification workbook from all verified sheets.
                  </CardDescription>
                </div>

                {parseCreatedAt && parseResult.run_id && (
                  <NotebookRunTimer
                    runId={parseResult.run_id}
                    createdAt={parseCreatedAt}
                    onExpired={() => {
                      toast.error("Notebook run expired. Please re-upload your files.");
                    }}
                  />
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
                <div className="space-y-1.5">
                  <Label htmlFor="output-filename" className="text-xs font-medium">
                    Output File Name
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="output-filename"
                      value={filename}
                      onChange={(e) => setFilename(e.target.value)}
                      placeholder="HardRoll_Combined"
                      className="max-w-md h-9 text-xs sm:text-sm border-teal-500/30 focus-visible:ring-teal-500 font-mono"
                    />
                    <span className="text-xs font-mono text-muted-foreground">.xlsx</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-end gap-2">
                  <Button
                    onClick={handleDownload}
                    disabled={
                      parseResult.rows.length === 0 ||
                      downloadMutation.isPending ||
                      removeRowsMutation.isPending
                    }
                    className="h-9 bg-teal-600 hover:bg-teal-700 text-white font-medium shadow-sm transition-all"
                  >
                    {downloadMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Building Excel...</span>
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4" />
                        <span>Download Excel ({selectedRowIds.size} sheets)</span>
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={resetState}
                    disabled={downloadMutation.isPending}
                    className="h-9 border-border text-muted-foreground hover:text-foreground"
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span>Start Over</span>
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-teal-500/20 bg-teal-50/40 dark:bg-teal-950/20 px-3 py-2 text-xs">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span>Run ID:</span>
                  <span className="font-mono font-medium text-foreground">
                    {parseResult.run_id}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-teal-700 dark:text-teal-300 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Ready for export</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* STEP 3: Results Table & Controls */}
          <Card className="border-teal-500/20 shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base text-foreground font-semibold flex items-center gap-2">
                    <FileCheck2 className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                    Parsed Sheet Results
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-0.5">
                    Review extracted sheet rows, specs targets, and measurement statistics. Uncheck any unwanted sheets and remove them before download.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <NotebookResultsTable
                rows={parseResult.rows}
                selectedRowIds={selectedRowIds}
                onToggleRow={handleToggleRow}
                onToggleAll={handleToggleAll}
                onRemoveUnchecked={handleRemoveUnchecked}
                onRemoveSingleRow={handleRemoveSingleRow}
                isRemoving={removeRowsMutation.isPending}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
