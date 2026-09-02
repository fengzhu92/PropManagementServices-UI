// Deal Assistant API (design doc §6.8). Mirrors AiService.Api's SSE contract —
// AssistantController writes the frames, SseWriter serialises payloads as camelCase.
//
// Unlike the rest of ai-service this endpoint streams rather than returning JSON, so it
// goes through streamSse rather than the auth* helpers.

import { streamSse } from "./client";

/** What a citation points at, which decides where its chip navigates. */
export type CitationKind = "document" | "deal" | "property";

/** One source the answer may cite. `sourceNumber` matches the [S1] markers in the text. */
export interface AssistantCitation {
  sourceNumber: number;
  kind: CitationKind;
  /** documentId, dealId or propertyId depending on `kind`. */
  id: string;
  /** For a document, the deal it hangs off — which is what makes it linkable. */
  dealId: string | null;
  /** File name, deal name or property title. */
  title: string | null;
  pageNo: number | null;
  score: number | null;
  snippet: string | null;
  /** Route computed server-side (/acquisitions/:id or /listings/:id); null when the
   *  source has nothing to open. */
  href: string | null;
}

/** A tool the model is about to run. */
export interface AssistantStatus {
  iteration: number;
  tool: string;
  label: string;
}

/** A tool that has finished. `capped` means results were withheld; `failed` means the
 *  call errored — neither ends the question, and both should stay visible. */
export interface AssistantToolResult {
  iteration: number;
  tool: string;
  summary: string;
  capped: boolean;
  failed: boolean;
}

/** Terminal event. `truncated` means a budget stopped the loop early — the normal
 *  outcome for a broad question, not an error. */
export interface AssistantDone {
  model: string;
  iterations: number;
  toolCalls: number;
  latencyMs: number;
  truncated: boolean;
}

export interface AssistantError {
  code: string;
  message: string;
}

export interface AssistantTurn {
  role: "user" | "assistant";
  content: string;
}

export interface AskAssistantInput {
  question: string;
  /** Prior turns. There is no threads table in v1 — the client is the store, and the
   *  server trims to its own limit. */
  history?: AssistantTurn[];
  /** Server-pinned scope. The deal panel sends this; the model cannot widen it. */
  context?: { dealId?: string; documentId?: string };
}

export interface AskAssistantHandlers {
  onStatus?: (status: AssistantStatus) => void;
  onTool?: (result: AssistantToolResult) => void;
  onDelta?: (text: string) => void;
  onCitations?: (citations: AssistantCitation[]) => void;
  onDone?: (done: AssistantDone) => void;
  /** A failure raised *after* the stream opened. Failures before it throw ApiError. */
  onError?: (error: AssistantError) => void;
}

/**
 * Ask the assistant, streaming the answer.
 *
 * Resolves when the stream closes. Rejects with `ApiError` if the request fails before
 * streaming starts, or with an AbortError if `signal` fires.
 */
export function askAssistant(
  input: AskAssistantInput,
  handlers: AskAssistantHandlers,
  signal?: AbortSignal
): Promise<void> {
  return streamSse("/ai/v1/ask", input, {
    signal,
    onEvent: ({ event, data }) => {
      switch (event) {
        case "status":
          handlers.onStatus?.(data as AssistantStatus);
          break;
        case "tool":
          handlers.onTool?.(data as AssistantToolResult);
          break;
        case "delta":
          handlers.onDelta?.((data as { text: string }).text);
          break;
        case "citations":
          handlers.onCitations?.((data as { citations: AssistantCitation[] }).citations);
          break;
        case "done":
          handlers.onDone?.(data as AssistantDone);
          break;
        case "error":
          handlers.onError?.(data as AssistantError);
          break;
      }
    },
  });
}
