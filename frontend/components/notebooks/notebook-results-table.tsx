"use client";

import { useMemo, useState } from "react";
import {
  Trash2,
  Search,
  FilterX,
  FileSpreadsheet,
  CheckSquare,
  Square,
  AlertCircle,
  Hash,
} from "lucide-react";
import type { NotebookRow, NotebookSpecTarget } from "@/types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface NotebookResultsTableProps {
  rows: NotebookRow[];
  selectedRowIds: Set<string>;
  onToggleRow: (rowId: string) => void;
  onToggleAll: (selectAll: boolean) => void;
  onRemoveUnchecked: () => void;
  onRemoveSingleRow?: (rowId: string) => void;
  isRemoving?: boolean;
  className?: string;
}

function getSpecByPattern(
  specs: Record<string, NotebookSpecTarget> | undefined,
  pattern: RegExp
): NotebookSpecTarget | undefined {
  if (!specs) return undefined;
  for (const [key, value] of Object.entries(specs)) {
    if (pattern.test(key)) {
      return value;
    }
  }
  return undefined;
}

function formatTargetVal(spec: NotebookSpecTarget | undefined): {
  target: string;
  range?: string;
} {
  if (!spec) return { target: "-" };
  const tar = spec.TAR !== undefined && spec.TAR !== null ? String(spec.TAR) : "-";
  const hasMin = spec.MIN !== undefined && spec.MIN !== null && spec.MIN !== "";
  const hasMax = spec.MAX !== undefined && spec.MAX !== null && spec.MAX !== "";

  let range: string | undefined = undefined;
  if (hasMin && hasMax) {
    range = `${spec.MIN} – ${spec.MAX}`;
  } else if (hasMin) {
    range = `≥ ${spec.MIN}`;
  } else if (hasMax) {
    range = `≤ ${spec.MAX}`;
  }

  return { target: tar, range };
}

export function NotebookResultsTable({
  rows,
  selectedRowIds,
  onToggleRow,
  onToggleAll,
  onRemoveUnchecked,
  onRemoveSingleRow,
  isRemoving,
  className,
}: NotebookResultsTableProps) {
  const [search, setSearch] = useState("");

  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase().trim();
    return rows.filter((r) => {
      return (
        r.file.toLowerCase().includes(q) ||
        r.sheet.toLowerCase().includes(q) ||
        (r.customer && r.customer.toLowerCase().includes(q)) ||
        (r.grade_quality_ply && r.grade_quality_ply.toLowerCase().includes(q)) ||
        (r.sales_order && r.sales_order.toLowerCase().includes(q)) ||
        (r.rewinder && String(r.rewinder).toLowerCase().includes(q)) ||
        (r.shift && r.shift.toLowerCase().includes(q))
      );
    });
  }, [rows, search]);

  const uncheckedCount = rows.length - selectedRowIds.size;
  const allFilteredSelected =
    filteredRows.length > 0 &&
    filteredRows.every((r) => selectedRowIds.has(r.row_id));
  const someFilteredSelected =
    filteredRows.some((r) => selectedRowIds.has(r.row_id)) && !allFilteredSelected;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Table Actions Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search sheets, files, customers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs sm:text-sm border-teal-500/30 focus-visible:ring-teal-500"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-2.5 text-xs text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>
              Showing <span className="font-semibold text-foreground">{filteredRows.length}</span> of{" "}
              <span className="font-semibold text-foreground">{rows.length}</span> sheet records
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onToggleAll(true)}
            disabled={selectedRowIds.size === rows.length || rows.length === 0}
            className="h-8 text-xs border-teal-500/30 text-teal-700 hover:bg-teal-50 dark:text-teal-300 dark:hover:bg-teal-950/40"
          >
            <CheckSquare className="h-3.5 w-3.5" />
            Select All
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onToggleAll(false)}
            disabled={selectedRowIds.size === 0}
            className="h-8 text-xs border-border text-muted-foreground hover:text-foreground"
          >
            <Square className="h-3.5 w-3.5" />
            Deselect All
          </Button>

          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={onRemoveUnchecked}
            disabled={uncheckedCount === 0 || isRemoving}
            className="h-8 text-xs bg-red-600 hover:bg-red-700 text-white shadow-sm"
          >
            <FilterX className="h-3.5 w-3.5" />
            {isRemoving
              ? "Removing..."
              : `Remove Unchecked (${uncheckedCount})`}
          </Button>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="overflow-hidden rounded-xl border border-teal-500/25 bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-max text-sm">
            <thead>
              <tr className="border-b border-border bg-teal-50/70 dark:bg-teal-950/30">
                <th className="h-10 w-10 px-3 text-center">
                  <Checkbox
                    checked={allFilteredSelected ? true : someFilteredSelected ? "indeterminate" : false}
                    onCheckedChange={(checked) => {
                      onToggleAll(Boolean(checked));
                    }}
                    aria-label="Select all rows"
                    className="border-teal-600 data-[state=checked]:bg-teal-600 data-[state=checked]:text-white"
                  />
                </th>
                <th className="h-10 whitespace-nowrap px-3 text-left font-semibold text-xs uppercase tracking-wider text-teal-900 dark:text-teal-200">
                  #
                </th>
                <th className="h-10 whitespace-nowrap px-3 text-left font-semibold text-xs uppercase tracking-wider text-teal-900 dark:text-teal-200">
                  File
                </th>
                <th className="h-10 whitespace-nowrap px-3 text-left font-semibold text-xs uppercase tracking-wider text-teal-900 dark:text-teal-200">
                  Sheet
                </th>
                <th className="h-10 whitespace-nowrap px-3 text-left font-semibold text-xs uppercase tracking-wider text-teal-900 dark:text-teal-200">
                  Date
                </th>
                <th className="h-10 whitespace-nowrap px-3 text-left font-semibold text-xs uppercase tracking-wider text-teal-900 dark:text-teal-200">
                  Customer
                </th>
                <th className="h-10 whitespace-nowrap px-3 text-left font-semibold text-xs uppercase tracking-wider text-teal-900 dark:text-teal-200">
                  Rewinder
                </th>
                <th className="h-10 whitespace-nowrap px-3 text-left font-semibold text-xs uppercase tracking-wider text-teal-900 dark:text-teal-200">
                  Shift
                </th>
                <th className="h-10 whitespace-nowrap px-3 text-left font-semibold text-xs uppercase tracking-wider text-teal-900 dark:text-teal-200">
                  Grade / Ply
                </th>
                <th className="h-10 whitespace-nowrap px-3 text-center font-semibold text-xs uppercase tracking-wider text-teal-900 dark:text-teal-200">
                  Measurements
                </th>
                <th className="h-10 whitespace-nowrap px-3 text-center font-semibold text-xs uppercase tracking-wider text-teal-900 dark:text-teal-200">
                  GSM TAR
                </th>
                <th className="h-10 whitespace-nowrap px-3 text-center font-semibold text-xs uppercase tracking-wider text-teal-900 dark:text-teal-200">
                  Tensile MD TAR
                </th>
                <th className="h-10 whitespace-nowrap px-3 text-right font-semibold text-xs uppercase tracking-wider text-teal-900 dark:text-teal-200">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={13} className="px-6 py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle className="h-8 w-8 text-muted-foreground/60" />
                      <p className="font-medium text-foreground">No sheets match the search filter</p>
                      <p className="text-xs">Try adjusting your search terms or clearing the filter.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, index) => {
                  const isChecked = selectedRowIds.has(row.row_id);
                  const gsmSpec = getSpecByPattern(row.specs, /^gsm/i);
                  const tensileSpec = getSpecByPattern(row.specs, /tensile.*md/i);

                  const gsmTarget = formatTargetVal(gsmSpec);
                  const tensileTarget = formatTargetVal(tensileSpec);

                  // Extract mean stats chips
                  const statsMeanEntries = row.stats_mean
                    ? Object.entries(row.stats_mean)
                    : [];

                  return (
                    <tr
                      key={row.row_id}
                      className={cn(
                        "transition-colors hover:bg-muted/40",
                        !isChecked && "opacity-50 bg-muted/20"
                      )}
                    >
                      {/* Checkbox */}
                      <td className="px-3 py-3 text-center">
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => onToggleRow(row.row_id)}
                          aria-label={`Select sheet ${row.sheet}`}
                          className="border-teal-600 data-[state=checked]:bg-teal-600 data-[state=checked]:text-white"
                        />
                      </td>

                      {/* # Index */}
                      <td className="px-3 py-3 text-xs font-mono text-muted-foreground">
                        {index + 1}
                      </td>

                      {/* File */}
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2 max-w-[170px]" title={row.file}>
                          <FileSpreadsheet className="h-4 w-4 shrink-0 text-teal-600 dark:text-teal-400" />
                          <span className="truncate font-medium text-xs">{row.file}</span>
                        </div>
                      </td>

                      {/* Sheet Name */}
                      <td className="px-3 py-3">
                        <div className="max-w-[180px]">
                          <span className="font-semibold text-xs text-foreground block truncate" title={row.sheet}>
                            {row.sheet}
                          </span>
                          {/* Mean Stats Chips shown directly under Sheet / Grade */}
                          {statsMeanEntries.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {statsMeanEntries.map(([metricKey, val]) => (
                                <span
                                  key={metricKey}
                                  className="inline-flex items-center rounded-sm bg-teal-500/10 px-1.5 py-0.5 text-[10px] font-medium text-teal-700 dark:text-teal-300"
                                  title={`${metricKey} Mean: ${val}`}
                                >
                                  Mean {metricKey.replace(/\s*\(.*\)/, "")}: {val ?? "-"}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Date */}
                      <td className="whitespace-nowrap px-3 py-3 text-xs text-muted-foreground">
                        {row.date || "-"}
                      </td>

                      {/* Customer */}
                      <td className="px-3 py-3">
                        <span className="truncate max-w-[130px] block text-xs font-medium" title={row.customer || ""}>
                          {row.customer || "-"}
                        </span>
                        {row.sales_order && (
                          <span className="text-[10px] text-muted-foreground block truncate">
                            SO: {row.sales_order}
                          </span>
                        )}
                      </td>

                      {/* Rewinder */}
                      <td className="whitespace-nowrap px-3 py-3 text-xs text-center">
                        {row.rewinder ? (
                          <span className="inline-flex items-center justify-center rounded bg-secondary px-1.5 py-0.5 text-xs font-mono font-medium">
                            RW-{row.rewinder}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>

                      {/* Shift */}
                      <td className="whitespace-nowrap px-3 py-3 text-xs text-center">
                        {row.shift ? (
                          <Badge variant="outline" className="border-teal-500/30 font-semibold text-[11px]">
                            {row.shift}
                          </Badge>
                        ) : (
                          "-"
                        )}
                      </td>

                      {/* Grade / Ply */}
                      <td className="px-3 py-3">
                        <div className="max-w-[180px]">
                          <span className="text-xs truncate block font-medium" title={row.grade_quality_ply || ""}>
                            {row.grade_quality_ply || "-"}
                          </span>
                          {row.combination && (
                            <span className="text-[10px] text-muted-foreground block truncate" title={row.combination}>
                              {row.combination}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Measurements Count */}
                      <td className="whitespace-nowrap px-3 py-3 text-center">
                        <span className="inline-flex items-center gap-1 rounded-full bg-teal-500/10 px-2 py-0.5 text-xs font-semibold text-teal-700 dark:text-teal-300">
                          <Hash className="h-3 w-3" />
                          {row.measurement_count ?? 0}
                        </span>
                      </td>

                      {/* GSM TAR */}
                      <td className="whitespace-nowrap px-3 py-3 text-center">
                        <div>
                          <span className="font-semibold text-xs tabular-nums text-foreground">
                            {gsmTarget.target}
                          </span>
                          {gsmTarget.range && (
                            <span className="block text-[10px] text-muted-foreground">
                              {gsmTarget.range}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Tensile MD TAR */}
                      <td className="whitespace-nowrap px-3 py-3 text-center">
                        <div>
                          <span className="font-semibold text-xs tabular-nums text-foreground">
                            {tensileTarget.target}
                          </span>
                          {tensileTarget.range && (
                            <span className="block text-[10px] text-muted-foreground">
                              {tensileTarget.range}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Action (Individual Remove) */}
                      <td className="whitespace-nowrap px-3 py-3 text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => onRemoveSingleRow?.(row.row_id)}
                          disabled={isRemoving}
                          aria-label={`Remove sheet ${row.sheet}`}
                          className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
