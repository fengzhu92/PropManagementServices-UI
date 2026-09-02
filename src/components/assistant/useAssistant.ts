import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "../../api/client";
import {
  askAssistant,
  type AssistantCitation,
  type AssistantDone,
  type AssistantTurn,
} from "../../api/assistant";

/** One tool call as the UI shows it: announced on `status`, completed on `tool`. */
export interface ProgressStep {
  key: string;
  tool: string;
  label: string;
  summary?: string;
  capped?: boolean;
  failed?: boolean;
}

/** One exchange, kept so the drawer can show a conversation rather than a single answer. */
export interface Exchange {
  question: string;
  answer: string;
  progress: ProgressStep[];
  citations: AssistantCitation[];
  done: AssistantDone | null;
  error: string | null;
}

/**
 * Conversation state for the Deal Assistant.
 *
 * <p>The client is the store: there is no threads table in v1, so history is held here
 * and sent back with each question.</p>
 *
 * <p>A question takes roughly a minute, which shapes two decisions. The progress steps
 * are surfaced rather than hidden, because a blank panel for that long reads as broken.
 * And the request is deliberately <em>not</em> aborted when the drawer closes — only when
 * the component unmounts — so closing the panel to keep working doesn't throw away an
 * answer that was 50 seconds in.</p>
 */
export function useAssistant(context?: { dealId?: string; documentId?: string }) {
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [streaming, setStreaming] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  // Aborts only on unmount. Closing the drawer leaves the answer running.
  useEffect(() => () => abortRef.current?.abort(), []);

  const patchLast = useCallback((patch: (current: Exchange) => Exchange) => {
    setExchanges((all) => (all.length === 0 ? all : [...all.slice(0, -1), patch(all[all.length - 1])]));
  }, []);

  const ask = useCallback(
    async (question: string) => {
      const trimmed = question.trim();
      if (!trimmed || streaming) return;

      // Built before the new exchange is appended, so the question being asked isn't
      // also sent as its own history.
      const history: AssistantTurn[] = exchanges.flatMap((e) =>
        e.answer
          ? [
              { role: "user" as const, content: e.question },
              { role: "assistant" as const, content: e.answer },
            ]
          : []
      );

      setExchanges((all) => [
        ...all,
        { question: trimmed, answer: "", progress: [], citations: [], done: null, error: null },
      ]);
      setStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        await askAssistant(
          { question: trimmed, history, context },
          {
            onStatus: (s) =>
              patchLast((e) => ({
                ...e,
                progress: [
                  ...e.progress,
                  { key: `${s.iteration}-${s.tool}-${e.progress.length}`, tool: s.tool, label: s.label },
                ],
              })),

            // Completes the most recent un-completed step for this tool rather than
            // appending: status and tool are two halves of one call.
            onTool: (t) =>
              patchLast((e) => {
                const index = [...e.progress]
                  .map((step, i) => ({ step, i }))
                  .reverse()
                  .find(({ step }) => step.tool === t.tool && step.summary === undefined)?.i;
                if (index === undefined) return e;
                const progress = [...e.progress];
                progress[index] = {
                  ...progress[index],
                  summary: t.summary,
                  capped: t.capped,
                  failed: t.failed,
                };
                return { ...e, progress };
              }),

            onDelta: (text) => patchLast((e) => ({ ...e, answer: e.answer + text })),
            onCitations: (citations) => patchLast((e) => ({ ...e, citations })),
            onDone: (done) => patchLast((e) => ({ ...e, done })),
            onError: (error) => patchLast((e) => ({ ...e, error: error.message })),
          },
          controller.signal
        );
      } catch (err) {
        if (controller.signal.aborted) return;
        patchLast((e) => ({ ...e, error: messageFor(err) }));
      } finally {
        if (abortRef.current === controller) abortRef.current = null;
        setStreaming(false);
      }
    },
    [context, exchanges, patchLast, streaming]
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setExchanges([]);
    setStreaming(false);
  }, []);

  return { exchanges, streaming, ask, reset };
}

/**
 * Failures worth distinguishing, in the spirit of DealQaPanel's error mapping.
 *
 * <p>The 5xx cases matter because they are the ones a user actually hits in a running
 * system, and the raw status text ("Request failed: 500 Internal Server Error") tells
 * them nothing about whether to retry. A dead ai-service reaches the browser as a 500
 * from the dev proxy, not as a connection error.</p>
 */
function messageFor(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 503) return "The assistant is unavailable — it may be missing an API key.";
    if (err.status === 502) return "The assistant couldn't reach one of its data sources. Try again shortly.";
    if (err.status >= 500) return "The assistant service isn't responding. Try again in a moment.";
    if (err.status === 400) return err.message;
    return err.message;
  }
  // fetch() rejects rather than resolving when the connection itself fails.
  if (err instanceof TypeError) return "Couldn't reach the assistant. Check your connection and try again.";
  return "Something went wrong asking the assistant.";
}
