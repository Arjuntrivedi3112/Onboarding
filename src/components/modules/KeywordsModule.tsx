import React from "react";

export function KeywordsModule() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Glossary — Key Terms</h2>
      <p className="text-muted-foreground mb-4">Send me the list of keywords and I'll populate detailed definitions here.</p>
      <div className="space-y-4">
        <div className="p-4 border rounded-lg bg-card">
          <p className="font-medium">No terms added yet</p>
          <p className="text-sm text-muted-foreground">Once you send the keyword list, I'll replace this with a detailed glossary.</p>
        </div>
      </div>
    </div>
  );
}
