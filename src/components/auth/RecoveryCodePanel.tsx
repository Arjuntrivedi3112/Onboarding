import { useEffect, useRef, useState } from "react";
import { Check, Copy, Download } from "lucide-react";

import { FormError } from "@/components/auth/fields";
import { supabase } from "@/integrations/supabase/client";
import { friendlyAuthError } from "@/lib/auth/errors";

/**
 * Issues a fresh recovery code, shows it exactly once, and only lets the
 * learner continue after they confirm they've kept it. Used at first sign-in
 * and from the profile page.
 */
export function RecoveryCodePanel({
  email,
  onSaved,
  confirmLabel = "Continue",
}: {
  email: string;
  onSaved: () => void | Promise<void>;
  confirmLabel?: string;
}) {
  const [code, setCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  // Strict-mode effects run twice; issuing twice would void the first code.
  const issued = useRef(false);

  useEffect(() => {
    if (issued.current) return;
    issued.current = true;
    supabase.rpc("regenerate_recovery_code").then(({ data, error: rpcError }) => {
      if (rpcError) setError(friendlyAuthError(rpcError));
      else setCode(data as string);
    });
  }, []);

  const copy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Couldn't copy automatically — select the code and copy it.");
    }
  };

  const download = () => {
    if (!code) return;
    const text = `AdTech Journey recovery code\n\nAccount: ${email}\nCode: ${code}\n\nUse it at Sign in → Forgot password. It works once; you'll get a new one after using it.\n`;
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "adtech-journey-recovery-code.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const confirm = async () => {
    setBusy(true);
    const { error: rpcError } = await supabase.rpc("confirm_recovery_code_saved");
    if (rpcError) {
      setError(friendlyAuthError(rpcError));
      setBusy(false);
      return;
    }
    await onSaved();
    setBusy(false);
  };

  return (
    <div className="space-y-5">
      <FormError>{error}</FormError>
      <div className="rounded-lg border border-border bg-card p-5 text-center">
        <p className="text-xs uppercase text-muted-foreground">Your recovery code</p>
        {code ? (
          <p className="figure mt-2 select-all text-2xl tracking-widest text-foreground" aria-live="polite">
            {code}
          </p>
        ) : (
          <p className="mt-2 text-muted-foreground" role="status">
            Generating your code…
          </p>
        )}
        <div className="mt-4 flex justify-center gap-2">
          <button
            type="button"
            onClick={copy}
            disabled={!code}
            className="interactive inline-flex min-h-[2.5rem] items-center gap-2 rounded-lg border border-border px-3 text-sm text-foreground hover:border-primary/40 disabled:opacity-60"
          >
            {copied ? <Check className="h-4 w-4 text-primary" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
            {copied ? "Copied" : "Copy"}
          </button>
          <button
            type="button"
            onClick={download}
            disabled={!code}
            className="interactive inline-flex min-h-[2.5rem] items-center gap-2 rounded-lg border border-border px-3 text-sm text-foreground hover:border-primary/40 disabled:opacity-60"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Download
          </button>
        </div>
      </div>

      <ul className="space-y-2 text-sm text-muted-foreground">
        <li>Keep it in a password manager or a private note — not in a shared channel.</li>
        <li>With it you can reset your password yourself, any time, without waiting for an admin.</li>
        <li>It works once. After you use it you&apos;ll get a new one.</li>
      </ul>

      <label className="flex items-start gap-3 text-sm text-foreground">
        <input
          type="checkbox"
          checked={saved}
          onChange={(e) => setSaved(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-primary"
        />
        I&apos;ve saved my recovery code somewhere safe.
      </label>

      <button
        type="button"
        onClick={confirm}
        disabled={!saved || !code || busy}
        className="interactive inline-flex min-h-[2.75rem] w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 text-base text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
      >
        {busy ? "Saving…" : confirmLabel}
      </button>
    </div>
  );
}
