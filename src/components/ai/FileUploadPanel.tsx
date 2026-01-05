import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, FileText, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  status: "uploading" | "processing" | "done" | "error";
  summary?: string;
}

export function FileUploadPanel({ isOpen, onClose }: FileUploadPanelProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    processFiles(droppedFiles);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(Array.from(e.target.files));
    }
  };

  const processFiles = (fileList: File[]) => {
    const newFiles: UploadedFile[] = fileList.map((file) => ({
      id: Date.now().toString() + file.name,
      name: file.name,
      size: file.size,
      status: "uploading",
    }));

    setFiles((prev) => [...prev, ...newFiles]);

    // Simulate processing
    newFiles.forEach((file) => {
      setTimeout(() => {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === file.id ? { ...f, status: "processing" } : f
          )
        );
      }, 1000);

      setTimeout(() => {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === file.id
              ? {
                  ...f,
                  status: "done",
                  summary: `This document appears to be a ${file.name.includes("PRD") ? "Product Requirements Document" : file.name.includes("SRS") ? "Software Requirements Specification" : "technical document"} related to AdTech. Connect Lovable Cloud to get AI-powered summaries that explain what this document covers, where it fits in the AdTech ecosystem, and your potential role.`,
                }
              : f
          )
        );
      }, 3000);
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed inset-x-4 bottom-4 top-auto md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 w-auto md:w-full md:max-w-2xl bg-card border border-border rounded-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                  <Upload className="w-5 h-5 text-secondary-foreground" />
                </div>
                <div>
                  <h2 className="font-display font-semibold">Upload Documents</h2>
                  <p className="text-xs text-muted-foreground">PRD, SRS, or any AdTech docs</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drop Zone */}
            <div className="p-6">
              <div
                onDrop={handleDrop}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                className={cn(
                  "relative border-2 border-dashed rounded-xl p-8 text-center transition-all",
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground/50"
                )}
              >
                <input
                  type="file"
                  onChange={handleFileSelect}
                  accept=".pdf,.doc,.docx,.txt,.md"
                  multiple
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Upload className={cn(
                  "w-12 h-12 mx-auto mb-4 transition-colors",
                  isDragging ? "text-primary" : "text-muted-foreground"
                )} />
                <p className="font-medium text-foreground mb-1">
                  Drop files here or click to upload
                </p>
                <p className="text-sm text-muted-foreground">
                  Supports PDF, DOC, DOCX, TXT, MD
                </p>
              </div>

              {/* Uploaded Files */}
              {files.length > 0 && (
                <div className="mt-6 space-y-3">
                  <h3 className="text-sm font-medium text-foreground">Uploaded Files</h3>
                  {files.map((file) => (
                    <motion.div
                      key={file.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-muted rounded-xl p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-card flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(file.size / 1024).toFixed(1)} KB
                          </p>
                          {file.summary && (
                            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                              {file.summary}
                            </p>
                          )}
                        </div>
                        <div>
                          {file.status === "uploading" && (
                            <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
                          )}
                          {file.status === "processing" && (
                            <div className="flex items-center gap-1 text-xs text-primary">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Analyzing...</span>
                            </div>
                          )}
                          {file.status === "done" && (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          )}
                          {file.status === "error" && (
                            <AlertCircle className="w-5 h-5 text-destructive" />
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              <p className="text-xs text-muted-foreground text-center mt-6">
                Connect Lovable Cloud for AI-powered document analysis
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
