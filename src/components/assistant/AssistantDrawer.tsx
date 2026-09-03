import { useEffect, useRef, useState } from "react";
import AssistantConversation from "./AssistantConversation";
import type { Exchange } from "./useAssistant";

interface Props {
  open: boolean;
  onClose: () => void;
  exchanges: Exchange[];
  streaming: boolean;
  onAsk: (question: string) => void;
  onReset: () => void;
  onStop: () => void;
}

const SUGGESTIONS = [
  "How many deals are in underwriting?",
  "Show me retail deals in Austin with overdue tasks",
  "Which deal(s) in NDA / LOI has site visit report?",
];

/**
 * The assistant, as a right-hand drawer.
 *
 * <p>Deliberately non-modal: no backdrop, no scroll lock, no click-outside-to-close.
 * A question takes about a minute, and a modal would hold the page hostage for all of
 * it — this way the deal you were reading stays readable while the answer builds, and a
 * stray click can't discard a question mid-flight.</p>
 */
export default function AssistantDrawer({
  open,
  onClose,
  exchanges,
  streaming,
  onAsk,
  onReset,
  onStop,
}: Props) {
  const [question, setQuestion] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Escape closes. Same discipline as Modal.tsx, minus the body-overflow lock that a
  // non-modal panel must not apply.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Follow the answer as it streams.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [exchanges, streaming]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || streaming) return;
    onAsk(question);
    setQuestion("");
  };

  return (
    <aside
      aria-label="Deal assistant"
      aria-hidden={!open}
      className={[
        "fixed bottom-0 right-0 top-14 z-40 flex w-full flex-col border-l border-slate-200",
        "bg-white shadow-xl transition-transform duration-200 ease-out sm:w-[440px]",
        open ? "translate-x-0" : "pointer-events-none translate-x-full",
      ].join(" ")}
    >
      <header className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-900">Assistant</h2>
        <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-medium text-brand-hover">
          Beta
        </span>
        <div className="ml-auto flex items-center gap-1">
          {exchanges.length > 0 && (
            <button
              type="button"
              onClick={onReset}
              className="rounded-md px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            >
              New question
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Minimize assistant"
            title="Minimize — your question keeps running"
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 19h14" />
            </svg>
          </button>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
        <AssistantConversation
          exchanges={exchanges}
          streaming={streaming}
          emptyState={
            <div>
              <p className="text-sm text-slate-500">
                Ask about any deal, property or document in the portfolio.
              </p>
              <div className="mt-3 space-y-1.5">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => onAsk(s)}
                    className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-left text-xs text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          }
        />
      </div>

      <form onSubmit={submit} className="border-t border-slate-100 p-3">
        <textarea
          ref={inputRef}
          rows={2}
          maxLength={2000}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            // Enter sends, Shift+Enter newlines — matching DealQaPanel.
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit(e);
            }
          }}
          placeholder="Ask a question…"
          className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-brand focus:outline-none"
        />
        <div className="mt-2 flex items-center justify-between">
          <p className="text-[11px] text-slate-400">
            {streaming ? "Working — this can take a minute." : "Enter to send"}
          </p>
          {streaming ? (
            <button
              type="button"
              onClick={onStop}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              Stop
            </button>
          ) : (
            <button
              type="submit"
              disabled={!question.trim()}
              className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40"
            >
              Ask
            </button>
          )}
        </div>
      </form>
    </aside>
  );
}
