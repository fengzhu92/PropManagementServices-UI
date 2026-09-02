import AnswerText from "./AnswerText";
import CitationChip from "./CitationChip";
import type { Exchange, ProgressStep } from "./useAssistant";

interface Props {
  exchanges: Exchange[];
  streaming: boolean;
  /** Shown when there is nothing to display yet. */
  emptyState: React.ReactNode;
}

/**
 * Renders a conversation with the assistant. Shared by the global drawer and the
 * deal-scoped panel so streaming, progress and citations look the same in both.
 */
export default function AssistantConversation({ exchanges, streaming, emptyState }: Props) {
  if (exchanges.length === 0) return <>{emptyState}</>;

  return (
    <div className="space-y-6">
      {exchanges.map((exchange, i) => (
        <ExchangeView
          key={i}
          exchange={exchange}
          streaming={streaming && i === exchanges.length - 1}
        />
      ))}
    </div>
  );
}

function ExchangeView({ exchange, streaming }: { exchange: Exchange; streaming: boolean }) {
  const { question, answer, progress, citations, done, error } = exchange;

  return (
    <div>
      <p className="text-sm font-medium text-slate-900">{question}</p>

      {/* Progress is shown while the tools run and kept afterwards: which tools were
          consulted is part of reading the answer, not a loading spinner. */}
      {progress.length > 0 && (
        <ul className="mt-2 space-y-1">
          {progress.map((step) => (
            <ProgressRow key={step.key} step={step} />
          ))}
        </ul>
      )}

      {answer && (
        <div className="mt-3">
          <AnswerText text={answer} />
          {streaming && (
            <span className="mt-1 inline-block h-4 w-1.5 animate-pulse bg-slate-400 align-text-bottom" />
          )}
        </div>
      )}

      {!answer && streaming && progress.length === 0 && (
        <p className="mt-3 text-sm text-slate-400">Thinking…</p>
      )}

      {error && (
        <p className="mt-3 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
      )}

      {citations.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-medium text-slate-400">Sources</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {citations.map((c) => (
              <CitationChip key={`${c.kind}-${c.id}-${c.sourceNumber}`} citation={c} />
            ))}
          </div>
        </div>
      )}

      {done && (
        <p className="mt-2.5 text-xs text-slate-300">
          {done.model} · {done.toolCalls} tool call{done.toolCalls === 1 ? "" : "s"} ·{" "}
          {(done.latencyMs / 1000).toFixed(1)}s
          {/* Truncation is the normal outcome for a broad question, not a failure — the
              answer itself says what was skipped, so this only needs to be legible. */}
          {done.truncated && " · stopped early on budget"}
        </p>
      )}
    </div>
  );
}

function ProgressRow({ step }: { step: ProgressStep }) {
  const running = step.summary === undefined;

  return (
    <li className="flex items-start gap-2 text-xs">
      <span
        className={[
          "mt-1 h-1.5 w-1.5 shrink-0 rounded-full",
          step.failed ? "bg-rose-400" : running ? "animate-pulse bg-brand" : "bg-slate-300",
        ].join(" ")}
      />
      <span className={step.failed ? "text-rose-600" : "text-slate-500"}>
        {step.summary ?? step.label}
        {step.capped && (
          <span className="ml-1.5 rounded bg-amber-100 px-1 py-0.5 text-[10px] font-medium text-amber-700">
            partial
          </span>
        )}
      </span>
    </li>
  );
}
