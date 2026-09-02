import { Link } from "react-router-dom";
import type { AssistantCitation } from "../../api/assistant";

/**
 * One source behind an answer. The chip shows where a claim came from; the tooltip
 * carries the quoted text, so a figure can be checked without leaving the page.
 *
 * <p>Links when the server computed an href, and renders as a plain span when it
 * didn't — a document excerpt whose owning deal is unknown has a page worth quoting but
 * nothing to open.</p>
 */
export default function CitationChip({ citation }: { citation: AssistantCitation }) {
  const label = citation.title ?? fallbackLabel(citation.kind);
  const page = citation.kind === "document" && citation.pageNo != null ? ` · p.${citation.pageNo}` : "";

  const body = (
    <>
      <span className="text-slate-400">[S{citation.sourceNumber}]</span> {label}
      {page}
    </>
  );

  const className =
    "inline-block max-w-full truncate rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600";

  if (!citation.href) {
    return (
      <span title={citation.snippet ?? undefined} className={className}>
        {body}
      </span>
    );
  }

  return (
    <Link
      to={citation.href}
      title={citation.snippet ?? undefined}
      className={`${className} hover:bg-slate-200 hover:text-slate-900`}
    >
      {body}
    </Link>
  );
}

function fallbackLabel(kind: AssistantCitation["kind"]): string {
  if (kind === "deal") return "Deal";
  if (kind === "property") return "Property";
  return "Document";
}
