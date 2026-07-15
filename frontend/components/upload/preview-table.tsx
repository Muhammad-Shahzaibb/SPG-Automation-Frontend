"use client";

import { Fragment } from "react";
import type { ParseRecord } from "@/types";
import { TableSkeleton } from "@/components/common/loading-skeleton";
import { EmptyState } from "@/components/common/empty-state";
import { cn } from "@/lib/utils";

const IDENTITY_COLUMNS: { key: keyof ParseRecord | "file"; label: string }[] = [
  { key: "file", label: "File" },
  { key: "SpecNo", label: "Spec No" },
  { key: "Client", label: "Client" },
  { key: "Quality", label: "Quality" },
  { key: "Grade", label: "Grade" },
  { key: "MatCode", label: "Mat Code" },
  { key: "Color", label: "Color" },
  { key: "Ply", label: "Ply" },
];

interface PreviewTableProps {
  rows: ParseRecord[];
  selectedColumns: string[];
  isLoading?: boolean;
  className?: string;
}

function cell(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

export function PreviewTable({
  rows,
  selectedColumns,
  isLoading,
  className,
}: PreviewTableProps) {
  if (isLoading) {
    return <TableSkeleton rows={4} cols={6} />;
  }

  if (selectedColumns.length === 0) {
    return (
      <EmptyState
        title="Select at least one column"
        description="Choose physical parameters to preview Min / Tar / Max values."
      />
    );
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        title="No preview rows"
        description="No documents available for the current selection."
      />
    );
  }

  return (
    <div className={cn("overflow-hidden rounded-xl border", className)}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-max text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              {IDENTITY_COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className="h-10 whitespace-nowrap px-3 text-left font-medium text-muted-foreground"
                >
                  {col.label}
                </th>
              ))}
              {selectedColumns.map((col) => (
                <th
                  key={col}
                  colSpan={3}
                  className="h-10 whitespace-nowrap border-l px-3 text-center font-medium text-muted-foreground"
                >
                  {col}
                </th>
              ))}
            </tr>
            <tr className="border-b bg-muted/30">
              {IDENTITY_COLUMNS.map((col) => (
                <th key={`sub-${col.key}`} className="h-8 px-3" />
              ))}
              {selectedColumns.map((col) => (
                <Fragment key={`${col}-hdr`}>
                  <th className="h-8 whitespace-nowrap border-l px-2 text-center text-xs font-medium text-muted-foreground">
                    Min
                  </th>
                  <th className="h-8 whitespace-nowrap px-2 text-center text-xs font-medium text-muted-foreground">
                    Tar
                  </th>
                  <th className="h-8 whitespace-nowrap px-2 text-center text-xs font-medium text-muted-foreground">
                    Max
                  </th>
                </Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr
                key={`${row.file}-${rowIndex}`}
                className="border-b last:border-0 hover:bg-muted/40"
              >
                {IDENTITY_COLUMNS.map((col) => (
                  <td
                    key={`${rowIndex}-${col.key}`}
                    className="max-w-[160px] truncate whitespace-nowrap px-3 py-2"
                    title={cell(row[col.key])}
                  >
                    {cell(row[col.key])}
                  </td>
                ))}
                {selectedColumns.map((col) => {
                  const param = row.params?.[col];
                  return (
                    <Fragment key={`${rowIndex}-${col}`}>
                      <td
                        className="border-l px-2 py-2 text-center tabular-nums"
                        title={param?.Unit ? `Unit: ${param.Unit}` : undefined}
                      >
                        {cell(param?.Min)}
                      </td>
                      <td
                        className="px-2 py-2 text-center tabular-nums"
                        title={param?.Unit ? `Unit: ${param.Unit}` : undefined}
                      >
                        {cell(param?.Tar)}
                      </td>
                      <td
                        className="px-2 py-2 text-center tabular-nums"
                        title={param?.Unit ? `Unit: ${param.Unit}` : undefined}
                      >
                        {cell(param?.Max)}
                      </td>
                    </Fragment>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
