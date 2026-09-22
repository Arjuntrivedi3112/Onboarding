import React, { useMemo, useState } from "react";
import { AIChatPanel } from "@/components/ai/AIChatPanel";
import { GLOSSARY } from "@/data/glossary";

// Kept in the shape this module already used; GLOSSARY is the shared source of truth.
const TERMS: { term: string; def: string }[] = GLOSSARY.map((g) => ({ term: g.term, def: g.def }));

export function KeywordsModule() {
  const [q, setQ] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatContext, setChatContext] = useState<string | undefined>(undefined);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return TERMS;
    return TERMS.filter(
      (t) =>
        t.term.toLowerCase().includes(term) ||
        t.def.toLowerCase().includes(term)
    );
  }, [q]);

  const handleAskAI = (input: string) => {
    setChatContext(input);
    setIsChatOpen(true);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Glossary — Key Terms</h2>
      <p className="text-muted-foreground mb-4">Definitions sourced from the provided list. Terms are numbered for easy reference.</p>

      <div className="flex gap-2 mb-6">
        <input
          aria-label="Search glossary"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search terms or definitions..."
          className="flex-1 px-4 py-2 rounded-lg bg-muted border border-border focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background text-sm"
        />
        <button
          onClick={() => handleAskAI(q || "Explain glossary terms")}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground"
        >
          Ask AI
        </button>
      </div>

      {results.length === 0 ? (
        <div className="p-6 border rounded-lg bg-card">
          <p className="mb-4">No results found for "{q}".</p>
          <p className="text-sm text-muted-foreground mb-4">Use the search box and press the top <strong>Ask AI</strong> button to get an explanation.</p>
          <div className="flex gap-2">
            <button
              onClick={() => setQ("")}
              className="px-4 py-2 rounded-lg border"
            >
              Clear
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {results.map((t, i) => (
            <div key={t.term} className="p-4 border rounded-lg bg-card">
              <div className="flex items-baseline justify-between">
                <h3 className="text-lg font-semibold">{i + 1}. {t.term}</h3>
                {/* single Ask AI button at the top handles queries; keep entries clean */}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{t.def}</p>
            </div>
          ))}
        </div>
      )}

      <AIChatPanel isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} context={chatContext} />
    </div>
  );
}
