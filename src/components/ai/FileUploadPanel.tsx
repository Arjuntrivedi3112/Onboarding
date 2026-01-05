import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, FileText, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

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
  error?: string;
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

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string || "");
      reader.onerror = reject;
      
      // Read as text for text files
      if (file.type.includes("text") || file.name.endsWith(".txt") || file.name.endsWith(".md")) {
        reader.readAsText(file);
      } else {
        // For PDFs and other files, we'll send filename only
        resolve(`[Binary file: ${file.name}, Size: ${(file.size / 1024).toFixed(1)}KB]`);
      }
    });
  };

  const processFiles = async (fileList: File[]) => {
    for (const file of fileList) {
      const fileId = Date.now().toString() + file.name;
      
      // Add file to state
      setFiles((prev) => [...prev, {
        id: fileId,
        name: file.name,
        size: file.size,
        status: "uploading",
      }]);

      try {
        // Update to processing
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileId ? { ...f, status: "processing" } : f
          )
        );

        // Read file content
        const fileContent = await readFileContent(file);

        // Call AI summarization
        const { data, error } = await supabase.functions.invoke("summarize-doc", {
          body: { fileName: file.name, fileContent },
        });

        if (error) {
          throw new Error(error.message || "Failed to summarize document");
        }

        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileId
              ? { ...f, status: "done", summary: data.summary }
              : f
          )
        );
      } catch (error) {
        console.error("File processing error:", error);
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileId
              ? { 
                  ...f, 
                  status: "error", 
                  error: error instanceof Error ? error.message : "Failed to process file" 
                }
              : f
          )
        );
      }
    }
  };

  const removeFile = (fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
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
            className="fixed inset-x-4 bottom-4 top-auto md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 w-auto md:w-full md:max-w-2xl max-h-[80vh] bg-card border border-border rounded-2xl z-50 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                  <Upload className="w-5 h-5 text-secondary-foreground" />
                </div>
                <div>
                  <h2 className="font-display font-semibold">Upload Documents</h2>
                  <p className="text-xs text-muted-foreground">Get AI-powered AdTech analysis</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content - Scrollable */}
            <div className="p-6 overflow-y-auto flex-1">
              {/* Drop Zone */}
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
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm truncate">{file.name}</p>
                            <button
                              onClick={() => removeFile(file.id)}
                              className="text-muted-foreground hover:text-foreground p-1"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {(file.size / 1024).toFixed(1)} KB
                          </p>
                          {file.summary && (
                            <div className="text-sm text-foreground mt-3 leading-relaxed whitespace-pre-wrap prose prose-sm prose-invert max-w-none">
                              {file.summary}
                            </div>
                          )}
                          {file.error && (
                            <p className="text-sm text-destructive mt-2">
                              {file.error}
                            </p>
                          )}
                        </div>
                        <div className="shrink-0">
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
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
