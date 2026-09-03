import { useCallback, useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import TopNav from "./TopNav";
import AssistantDrawer from "../assistant/AssistantDrawer";
import AssistantLauncher from "../assistant/AssistantLauncher";
import { useAssistant } from "../assistant/useAssistant";

export default function AppLayout() {
  const [assistantOpen, setAssistantOpen] = useState(false);

  // The assistant lives here rather than inside the drawer so the conversation outlives
  // both closing the panel and navigating: a citation chip can route to a deal page
  // without discarding the answer that produced it.
  const { exchanges, streaming, ask, reset, stop } = useAssistant();

  const openAssistant = useCallback(() => setAssistantOpen(true), []);

  // The app's first meta-key binding. The floating button is the discoverable entry
  // point; this is the accelerator, advertised in that button's tooltip.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setAssistantOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const askAndOpen = useCallback(
    (question: string) => {
      setAssistantOpen(true);
      ask(question);
    },
    [ask]
  );

  return (
    <div className="min-h-screen bg-page">
      <TopNav onOpenAssistant={openAssistant} />
      <main className="mx-auto max-w-[1400px] px-6 py-8">
        <Outlet />
      </main>

      <AssistantLauncher
        onClick={openAssistant}
        hidden={assistantOpen}
        busy={streaming && !assistantOpen}
      />
      <AssistantDrawer
        open={assistantOpen}
        onClose={() => setAssistantOpen(false)}
        exchanges={exchanges}
        streaming={streaming}
        onAsk={askAndOpen}
        onReset={reset}
        onStop={stop}
      />
    </div>
  );
}
