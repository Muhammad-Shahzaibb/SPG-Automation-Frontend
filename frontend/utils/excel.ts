import { utils, writeFile } from "xlsx";
import type { ParseRecord } from "@/types";

const IDENTITY_COLUMNS: Array<{ key: keyof ParseRecord | "file"; label: string }> = [
  { key: "file", label: "File" },
  { key: "SpecNo", label: "Spec No" },
  { key: "Client", label: "Client" },
  { key: "Quality", label: "Quality" },
  { key: "Grade", label: "Grade" },
  { key: "MatCode", label: "Mat Code" },
  { key: "Color", label: "Color" },
  { key: "Ply", label: "Ply" },
];

function valueOrEmpty(value: unknown): string {
  if (value === null || value === undefined || value === "") return "";
  return String(value);
}

export function exportPreviewRowsToExcel(args: {
  rows: ParseRecord[];
  selectedColumns: string[];
  filename?: string;
}) {
  const { rows, selectedColumns } = args;
  let filename = args.filename?.trim() || "Specifications_Combined";
  if (!filename.endsWith(".xlsx")) filename = `${filename}.xlsx`;

  const flattened = rows.map((row) => {
    const base: Record<string, string> = {};

    for (const col of IDENTITY_COLUMNS) {
      base[col.label] = valueOrEmpty(row[col.key]);
    }

    for (const column of selectedColumns) {
      const param = row.params?.[column];
      base[`${column} Min`] = valueOrEmpty(param?.Min);
      base[`${column} Tar`] = valueOrEmpty(param?.Tar);
      base[`${column} Max`] = valueOrEmpty(param?.Max);
    }

    return base;
  });

  const worksheet = utils.json_to_sheet(flattened);
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, "Preview");
  writeFile(workbook, filename);
}
