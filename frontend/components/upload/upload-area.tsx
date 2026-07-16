"use client";

import { useCallback, useState } from "react";
import { Upload, File, X, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { formatBytes } from "@/utils/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// const ACCEPTED_EXT = /\.docx$/i;
const ACCEPTED_EXT = /\.(docx|pdf)$/i;
const MAX_FILE_SIZE = 25 * 1024 * 1024;

interface UploadAreaProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  disabled?: boolean;
  className?: string;
}

export function UploadArea({
  files,
  onFilesChange,
  disabled,
  className,
}: UploadAreaProps) {
  const [isDragging, setIsDragging] = useState(false);

  const processFiles = useCallback(
    (fileList: FileList | File[]) => {
      const next: File[] = [...files];
      Array.from(fileList).forEach((file) => {
        if (!ACCEPTED_EXT.test(file.name)) {
          // toast.error(`${file.name}: only .docx files are allowed`);
          toast.error(`${file.name}: only .docx and .pdf files are allowed`);
          return;
        }
        if (file.size > MAX_FILE_SIZE) {
          toast.error(`${file.name}: must be under 25 MB`);
          return;
        }
        if (!next.some((f) => f.name === file.name && f.size === file.size)) {
          next.push(file);
        }
      });
      onFilesChange(next);
    },
    [files, onFilesChange]
  );

  const removeFile = (index: number) => {
    onFilesChange(files.filter((_, i) => i !== index));
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
          "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors",
          disabled && "opacity-60 pointer-events-none",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30"
        )}
      >
        <motion.div
          animate={{ scale: isDragging ? 1.05 : 1 }}
          className="flex flex-col items-center text-center"
        >
          <div className="mb-4 rounded-full bg-primary/10 p-4">
            <Upload className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">Drag and drop .docx or .pdf files</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            or browse. Max 25 MB per file.
          </p>
          <label className="mt-4">
            <input
              type="file"
              multiple
              // accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              accept=".docx,.pdf,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              disabled={disabled}
              onChange={(e) => e.target.files && processFiles(e.target.files)}
            />
            <Button variant="outline" asChild disabled={disabled}>
              <span>Browse Files</span>
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
            className="overflow-hidden rounded-xl border"
          >
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">File Name</th>
                  <th className="px-4 py-3 text-left font-medium">Size</th>
                  <th className="px-4 py-3 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {files.map((file, index) => (
                  <tr key={`${file.name}-${index}`} className="border-b last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <File className="h-4 w-4 text-muted-foreground" />
                        <span className="max-w-[240px] truncate">{file.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatBytes(file.size)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={disabled}
                        onClick={() => removeFile(index)}
                        aria-label={`Remove ${file.name}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}
      </AnimatePresence>

      {files.length === 0 && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <AlertCircle className="h-3.5 w-3.5" />
          Only Microsoft Word (.docx) and PDF files are accepted.
        </p>
      )}
    </div>
  );
}
