interface Props {
  onClick: () => void;
  /** Hidden while the drawer is open — the drawer is its own dismiss affordance. */
  hidden: boolean;
  /** A question is still running with the drawer closed. */
  busy: boolean;
}

/**
 * The floating entry point to the assistant.
 *
 * <p>A persistent button rather than a keyboard shortcut, because a shortcut is
 * invisible: nobody finds ⌘K unless they are told, and this app has no other meta-key
 * binding to teach it. ⌘K works too, and the tooltip is where that gets advertised.</p>
 */
export default function AssistantLauncher({ onClick, hidden, busy }: Props) {
  return (
    <div
      className={[
        "group fixed bottom-6 right-6 z-40 transition-opacity duration-200",
        hidden ? "pointer-events-none opacity-0" : "opacity-100",
      ].join(" ")}
    >
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-1/2 right-full mr-3 translate-y-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2.5 py-1.5 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
      >
        Ask the assistant <span className="text-white/50">⌘K</span>
      </span>

      <button
        type="button"
        onClick={onClick}
        aria-label="Ask the assistant"
        className="relative grid h-14 w-14 place-items-center rounded-full bg-brand text-white shadow-lg transition-transform hover:scale-105 hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-brand/40"
      >
        <SparkleIcon />
        {/* A question running behind a closed drawer would otherwise be invisible. */}
        {busy && (
          <span className="absolute right-0 top-0 h-3.5 w-3.5 animate-pulse rounded-full bg-amber-400 ring-2 ring-page" />
        )}
      </button>
    </div>
  );
}

function SparkleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
      <path d="M12 8.5 13.4 11 16 12l-2.6 1L12 15.5 10.6 13 8 12l2.6-1z" fill="currentColor" stroke="none" />
    </svg>
  );
}
