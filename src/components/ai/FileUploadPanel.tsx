
import React, { useState, useCallback } from "react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, FileText, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

	type UploadedFile = {
	  id: string;
	  name: string;
	  size: number;
	  status: "uploading" | "processing" | "done" | "error";
	  summaryByRole: Record<string, string>;
	  error?: string;
	};

export function FileUploadPanel({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
	const [files, setFiles] = useState<UploadedFile[]>([]);
	const [isDragging, setIsDragging] = useState(false);
	const [selectedRole, setSelectedRole] = useState("general");

	const readFileContent = (file: File): Promise<string> => {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => resolve(reader.result as string);
			reader.onerror = reject;
			reader.readAsText(file);
		});
	};

	const getSummaryForRole = async (file: File, role: string) => {
		const fileContent = await readFileContent(file);
		const { data, error } = await supabase.functions.invoke("summarize-doc", {
			body: { fileName: file.name, fileContent, role },
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
					status: "uploading",
					summaryByRole: {},
				},
			]);
			try {
				setFiles((prev) =>
					prev.map((f) =>
						f.id === fileId ? { ...f, status: "processing" } : f
					)
				);
				const summary = await getSummaryForRole(file, selectedRole);
				setFiles((prev) =>
					prev.map((f) =>
						f.id === fileId
							? {
									...f,
									status: "done",
									summaryByRole: { ...f.summaryByRole, [selectedRole]: summary },
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
			const fileObj = new File([file.name], file.name); // dummy file for name
			const summary = await getSummaryForRole(fileObj, role);
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
		for (const file of files) {
			if (!file.summaryByRole[role]) {
				await regenerateSummaryForRole(file, role);
			}
		}
	};

	if (!isOpen) return null;

	return (
		<>
			{/* Backdrop */}
			<div className="fixed inset-0 z-[99] bg-background/80 backdrop-blur-sm" onClick={onClose} />
			{/* Modal Panel */}
			<div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
				<div className="relative w-full max-w-lg mx-auto pointer-events-auto">
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
						{/* Role Filter */}
						<div className="flex items-center gap-3 mb-4">
							<span className="text-sm font-medium">Summary for:</span>
							<Select value={selectedRole} onValueChange={handleRoleChange}>
								<SelectTrigger className="w-[140px]">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{ROLES.map((role) => (
										<SelectItem key={role.value} value={role.value}>
											{role.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
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
												{file.summaryByRole[selectedRole] && (
													<div className="text-sm text-foreground mt-3 leading-relaxed whitespace-pre-wrap prose prose-sm prose-invert max-w-none">
														{file.summaryByRole[selectedRole]}
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

