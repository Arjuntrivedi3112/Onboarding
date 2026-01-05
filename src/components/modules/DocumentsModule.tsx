import React from "react";

const documents = [
  { name: "THE-ADTECH-BOOK.pdf", path: "/THE-ADTECH-BOOK.pdf" },
  { name: "CONTENT-COMPARISON.md", path: "/CONTENT-COMPARISON.md" },
  { name: "README-VERIFICATION.md", path: "/README-VERIFICATION.md" },
  { name: "extract-pdf.js", path: "/extract-pdf.js" },
  { name: "extract-pdf-python.py", path: "/extract-pdf-python.py" },
];

export function DocumentsModule() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Documents & Resources</h2>
      <p className="text-muted-foreground mb-4">Click to open or download repository documents.</p>
      <ul className="space-y-2">
        {documents.map((doc) => (
          <li key={doc.path}>
            <a
              href={doc.path}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {doc.name}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
