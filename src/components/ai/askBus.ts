/**
 * Lets any page open the "Ask a question" panel with a question already
 * typed in (the Lab's "Explain what I'm seeing", for example) without
 * threading props through the layout.
 */
const EVENT = "adtech:open-ask";

export function openAskPanel(prefill?: string) {
  window.dispatchEvent(new CustomEvent<string | undefined>(EVENT, { detail: prefill }));
}

export function onOpenAskPanel(handler: (prefill: string | undefined) => void): () => void {
  const listener = (event: Event) => handler((event as CustomEvent<string | undefined>).detail);
  window.addEventListener(EVENT, listener);
  return () => window.removeEventListener(EVENT, listener);
}
