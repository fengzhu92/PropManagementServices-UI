/**
 * Renders an assistant answer with the small amount of Markdown the model actually
 * produces: bold spans, bullet lists, and paragraph breaks.
 *
 * <p>Deliberately not a Markdown library. The model's output is prose with emphasis and
 * the occasional list — it does not emit tables, links, code fences or images — so a
 * dependency would buy syntax nobody sends in exchange for a parser that has to be kept
 * safe against text drawn from user-uploaded PDFs. Everything here renders through React
 * as text nodes, so there is no HTML injection surface at all.</p>
 *
 * <p>Anything unrecognised falls through as literal text, which is the right failure:
 * a stray character is legible, whereas swallowing it is not.</p>
 */
export default function AnswerText({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/);

  return (
    <div className="space-y-2 text-sm leading-relaxed text-slate-700">
      {blocks.map((block, i) => {
        const lines = block.split("\n");
        const isList = lines.every((l) => /^\s*[-*]\s+/.test(l) || l.trim() === "");
        const bullets = lines.filter((l) => l.trim() !== "");

        if (isList && bullets.length > 0) {
          return (
            <ul key={i} className="list-disc space-y-1 pl-4">
              {bullets.map((line, j) => (
                <li key={j}>{inline(line.replace(/^\s*[-*]\s+/, ""))}</li>
              ))}
            </ul>
          );
        }

        return (
          <p key={i} className="whitespace-pre-wrap">
            {inline(block)}
          </p>
        );
      })}
    </div>
  );
}

/** Splits on **bold** and returns alternating plain / strong segments. */
function inline(text: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") && part.length > 4 ? (
      <strong key={i} className="font-semibold text-slate-900">
        {part.slice(2, -2)}
      </strong>
    ) : (
      part
    )
  );
}
