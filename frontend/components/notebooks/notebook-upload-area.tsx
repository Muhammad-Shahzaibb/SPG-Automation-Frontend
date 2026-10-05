"use client";

import { useCallback, useState } from "react";
import { FileSpreadsheet, Upload, X, AlertCircle, FileCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { formatBytes } from "@/utils/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const ACCEPTED_EXT = /\.xlsx$/i;
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB per workbook

interface NotebookUploadAreaProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  disabled?: boolean;
  className?: string;
}

export function NotebookUploadArea({
  files,
  onFilesChange,
  disabled,
  className,
}: NotebookUploadAreaProps) {
  const [isDragging, setIsDragging] = useState(false);

  const processFiles = useCallback(
    (fileList: FileList | File[]) => {
      const next: File[] = [...files];
      let invalidCount = 0;

      Array.from(fileList).forEach((file) => {
        if (!ACCEPTED_EXT.test(file.name)) {
          invalidCount++;
          toast.error(`${file.name}: only .xlsx Excel workbooks are allowed`);
          return;
        }
        if (file.size > MAX_FILE_SIZE) {
          toast.error(`${file.name}: must be under 50 MB`);
          return;
        }
        if (!next.some((f) => f.name === file.name && f.size === file.size)) {
          next.push(file);
        }
      });

      if (invalidCount === 0 && fileList.length > 0) {
        onFilesChange(next);
      } else if (next.length > files.length) {
        onFilesChange(next);
      }
    },
    [files, onFilesChange]
  );

  const removeFile = (index: number) => {
    onFilesChange(files.filter((_, i) => i !== index));
  };

  const clearAllFiles = () => {
    onFilesChange([]);
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (!disabled && e.dataTransfer.files.length > 0) {
            processFiles(e.dataTransfer.files);
          }
        }}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-all duration-200",
          disabled && "pointer-events-none opacity-60",
          isDragging
            ? "border-teal-500 bg-teal-500/10 shadow-inner"
            : "border-teal-600/30 bg-card hover:border-teal-500/60 hover:bg-teal-500/[0.02]"
        )}
      >
        <motion.div
          animate={{ scale: isDragging ? 1.03 : 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="flex flex-col items-center text-center"
        >
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-500/15 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400 shadow-sm ring-1 ring-teal-500/20">
            <FileSpreadsheet className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-semibold tracking-tight text-foreground">
            Upload Hard Roll Test Result Notebooks
          </h3>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            Drag and drop your Excel <span className="font-medium text-foreground">.xlsx</span> workbooks here, or browse files from your computer. Multiple files and multi-sheet workbooks supported.
          </p>

          <label className="mt-5">
            <input
              type="file"
              multiple
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="hidden"
              disabled={disabled}
              onChange={(e) => {
                if (e.target.files) {
                  processFiles(e.target.files);
                  e.target.value = "";
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              asChild
              disabled={disabled}
              className="border-teal-500/40 text-teal-700 hover:bg-teal-50 hover:text-teal-800 dark:text-teal-300 dark:hover:bg-teal-950/40 dark:hover:text-teal-200"
            >
              <span className="flex items-center gap-2 cursor-pointer font-medium">
                <Upload className="h-4 w-4" />
                Browse Excel Files (.xlsx)
              </span>
            </Button>
          </label>
        </motion.div>
      </div>

      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden rounded-xl border border-teal-500/20 bg-card shadow-sm"
          >
            <div className="flex items-center justify-between border-b border-border bg-teal-50/50 dark:bg-teal-950/30 px-4 py-2.5">
              <div className="flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                <span className="text-xs font-semibold text-teal-900 dark:text-teal-200">
                  {files.length} {files.length === 1 ? "file" : "files"} queued for parsing
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                disabled={disabled}
                onClick={clearAllFiles}
                className="h-7 text-xs text-muted-foreground hover:text-destructive"
              >
                Clear all
              </Button>
            </div>

            <div className="max-h-[260px] overflow-y-auto divide-y divide-border">
              {files.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="flex items-center justify-between px-4 py-2.5 text-sm hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
                      <FileSpreadsheet className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground max-w-[320px] sm:max-w-md">
                        {file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatBytes(file.size)}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={disabled}
                    onClick={() => removeFile(index)}
                    aria-label={`Remove ${file.name}`}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {files.length === 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <AlertCircle className="h-4 w-4 text-teal-600/70 shrink-0" />
          <span>Only Excel workbook files (.xlsx) are accepted. Every worksheet in each workbook will be parsed as one row.</span>
        </div>
      )}
    </div>
  );
}
