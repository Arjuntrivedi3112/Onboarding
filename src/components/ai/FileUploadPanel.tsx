
import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, FileText, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

import { supabase } from "@/integrations/supabase/client";
// import { extractDocxText } from "@/lib/extractDocxText";

	type UploadedFile = {
	  id: string;
	  name: string;
	  size: number;
	  file: File;
	  status: "uploading" | "processing" | "done" | "error";
	  summary: string;
	  error?: string;
	};

export function FileUploadPanel({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
	const [files, setFiles] = useState<UploadedFile[]>([]);
	const [isDragging, setIsDragging] = useState(false);
	const [selectedRole, setSelectedRole] = useState("general");


	async function readFileContent(file: File): Promise<string> {
		const ext = file.name.split('.').pop()?.toLowerCase();
		if (ext === 'docx') {
			// Upload to backend for extraction
			const formData = new FormData();
			formData.append('file', file);
			try {
				const res = await fetch('http://localhost:4001/extract-docx', {
					method: 'POST',
					body: formData,
				});
				const data = await res.json();
				if (data.text) return data.text;
				return 'Unable to extract text from DOCX file.';
			} catch (err) {
				return 'Unable to extract text from DOCX file.';
			}
		} else if (ext === 'txt' || ext === 'md') {
			return new Promise((resolve, reject) => {
				const reader = new FileReader();
				reader.onload = () => resolve(reader.result as string);
				reader.onerror = reject;
				reader.readAsText(file);
			});
		} else {
			return 'Unsupported file type for extraction.';
		}
	}

	const getSummary = async (file: File) => {
		const fileContent = await readFileContent(file);
		if (!fileContent || fileContent.startsWith('Unable') || fileContent.startsWith('Unsupported')) {
			return fileContent;
		}
		const { data, error } = await supabase.functions.invoke("summarize-doc", {
			body: { fileName: file.name, fileContent },
		});
		if (error) throw new Error(error.message || "Failed to summarize document");
		return data.summary;
	};

	// Process files for the current role
	const processFiles = async (fileList: File[]) => {
		for (const file of fileList) {
			const fileId = Date.now().toString() + file.name;
			setFiles((prev) => [
				...prev,
				{
					id: fileId,
					name: file.name,
					size: file.size,
					file,
					status: "uploading",
					summary: "",
				},
			]);
			try {
				setFiles((prev) =>
					prev.map((f) =>
						f.id === fileId ? { ...f, status: "processing" } : f
					)
				);
				const summary = await getSummary(file);
				setFiles((prev) =>
					prev.map((f) =>
						f.id === fileId
							? {
									...f,
									status: "done",
									summary,
								}
							: f
					)
				);
			} catch (error) {
				setFiles((prev) =>
					prev.map((f) =>
						f.id === fileId
							? {
									...f,
									status: "error",
									error: error instanceof Error ? error.message : "Failed to process file",
								}
							: f
					)
				);
			}
		}
	};

	// Regenerate summary for a file when role changes
	const regenerateSummaryForRole = async (file: UploadedFile, role: string) => {
		setFiles((prev) =>
			prev.map((f) =>
				f.id === file.id ? { ...f, status: "processing" } : f
			)
		);
		try {
			const summary = await getSummaryForRole(file.file, role);
			setFiles((prev) =>
				prev.map((f) =>
					f.id === file.id
						? {
								...f,
								status: "done",
								summaryByRole: { ...f.summaryByRole, [role]: summary },
							}
						: f
				)
			);
		} catch (error) {
			setFiles((prev) =>
				prev.map((f) =>
					f.id === file.id
						? {
								...f,
								status: "error",
								error: error instanceof Error ? error.message : "Failed to process file",
							}
						: f
				)
			);
		}
	};

	const removeFile = (fileId: string) => {
		setFiles((prev) => prev.filter((f) => f.id !== fileId));
	};

	const handleFileSelect = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const fileList = e.target.files;
			if (fileList) {
				processFiles(Array.from(fileList));
			}
		},
		[selectedRole]
	);

	const handleDrop = useCallback(
		(e: React.DragEvent<HTMLDivElement>) => {
			e.preventDefault();
			setIsDragging(false);
			const fileList = e.dataTransfer.files;
			if (fileList) {
				processFiles(Array.from(fileList));
			}
		},
		[selectedRole]
	);

	// Regenerate summaries for all files when role changes
	const handleRoleChange = async (role: string) => {
		setSelectedRole(role);
		// Regenerate summaries for all files for the new role
		await Promise.all(
			files.map(async (file) => {
				if (!file.summaryByRole[role]) {
					await regenerateSummaryForRole(file, role);
				}
			})
		);
	};

	if (!isOpen) return null;

	return (
		<>
			{/* Backdrop */}
			<div className="fixed inset-0 z-[99] bg-background/80 backdrop-blur-sm" onClick={onClose} />
			{/* Modal Panel (pointer-events enabled) */}
			<div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-auto">
				<div className="relative w-full max-w-lg mx-auto pointer-events-auto" tabIndex={-1} aria-modal="true" role="dialog">
					<div className="rounded-2xl border bg-card text-card-foreground shadow-2xl p-6 animate-in fade-in zoom-in">
						{/* Header */}
						<div className="flex items-center justify-between mb-4">
							<h2 className="text-lg font-semibold">Document Upload & Summary</h2>
							<button onClick={onClose} className="p-2 rounded-full hover:bg-muted transition-colors">
								<X className="w-5 h-5" />
							</button>
						</div>
						{/* AI Model Note */}
						<div className="text-xs text-muted-foreground mb-2">
							Powered by <span className="font-medium">Google Gemini 2.5 Flash</span> (via Lovable AI Gateway)
						</div>
						{/* Single plain-language summary output (no role selection) */}
						<div className="flex items-center gap-3 mb-4">
							<p className="text-sm text-muted-foreground">Summary: plain-language, easy-to-read</p>
						</div>
						{/* Upload Dropzone */}
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
							<div className="mt-6 space-y-3 max-h-64 overflow-y-auto pr-2">
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
				</div>
			</div>
		</>
	);
}

