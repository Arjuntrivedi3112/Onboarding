import { useState } from "react";

import { DocumentsModule } from "@/components/modules/DocumentsModule";
import { FileUploadPanel } from "@/components/ai/FileUploadPanel";

export default function LibraryPage() {
  const [uploadOpen, setUploadOpen] = useState(false);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-foreground">Library</h1>
          <p className="measure mt-2 text-muted-foreground">
            Source material and anything the team has added.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setUploadOpen(true)}
          className="inline-flex min-h-[2.75rem] items-center rounded-lg border border-border-strong px-4 text-sm text-foreground hover:bg-secondary"
        >
          Add a document
        </button>
      </div>

      <div className="mt-8">
        <DocumentsModule />
      </div>

      <FileUploadPanel isOpen={uploadOpen} onClose={() => setUploadOpen(false)} />
    </div>
  );
}
