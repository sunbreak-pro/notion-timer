import { describe, it, expect, vi, afterEach } from "vitest";
import { render, act, waitFor } from "@testing-library/react";
import { RichTextEditor } from "../src/notes/RichTextEditor";

/*
 * #1521 — a note the MCP server wrote with a callout must OPEN, and must
 * survive being saved.
 *
 * The bug was not that the callout drew badly: `enableContentCheck: true`
 * rejects a document containing a node the schema does not know, RichTextEditor
 * only logs that, and the editor comes up empty. The 800ms autosave then wrote
 * the empty document back over the real body — so opening the note once was
 * enough to lose it. Both halves are asserted here: the body is on screen, and
 * a later edit round-trips a document that still HAS the callout, with its
 * attributes, and still has everything that sat around it.
 *
 * Driven through the real RichTextEditor like attachmentNode / itemLinkClick:
 * the schema check and the getJSON() round-trip are plain ProseMirror work with
 * no coordinate pipeline in them, so jsdom's missing layout (#475) is not in
 * the way.
 */

/** The exact shape mcp-server/src/utils/tiptapJsonBuilder.ts::callout() emits. */
function docWithCallout(
  attrs: { iconName: string; color: string } = {
    iconName: "Info",
    color: "blue",
  },
) {
  return JSON.stringify({
    type: "doc",
    content: [
      { type: "paragraph", content: [{ type: "text", text: "before" }] },
      {
        type: "callout",
        attrs,
        content: [
          { type: "paragraph", content: [{ type: "text", text: "inside" }] },
        ],
      },
      { type: "paragraph", content: [{ type: "text", text: "after" }] },
    ],
  });
}

function renderEditor(content: string, onUpdate: (json: string) => void) {
  return render(
    <RichTextEditor
      noteId="note-1"
      initialContent={content}
      onUpdate={onUpdate}
    />,
  );
}

/** A real document change: ProseMirror's own splitBlock through its keymap. */
function edit(container: HTMLElement) {
  const dom = container.querySelector<HTMLElement>(".tiptap");
  if (!dom) throw new Error("editor did not mount");
  act(() => {
    dom.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Enter",
        bubbles: true,
        cancelable: true,
      }),
    );
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("callout node (#1521)", () => {
  it("opens a callout note with its body instead of discarding the document", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { container } = renderEditor(docWithCallout(), () => {});

    await waitFor(() =>
      expect(container.querySelector(".tiptap")).toBeTruthy(),
    );

    // The callout body AND the paragraphs around it — a schema rejection takes
    // the whole document, not just the node it choked on.
    expect(container.textContent).toContain("inside");
    expect(container.textContent).toContain("before");
    expect(container.textContent).toContain("after");

    // onContentError is the exact channel the bug reported itself on.
    expect(warn).not.toHaveBeenCalledWith(
      "[web RichTextEditor] TipTap content schema error",
      expect.anything(),
      expect.anything(),
    );
  });

  it("draws the callout with the colour attribute CSS keys off", async () => {
    const { container } = renderEditor(
      docWithCallout({ iconName: "AlertTriangle", color: "yellow" }),
      () => {},
    );

    await waitFor(() =>
      expect(container.querySelector(".note-callout")).toBeTruthy(),
    );
    const el = container.querySelector(".note-callout");
    expect(el?.getAttribute("data-color")).toBe("yellow");
    expect(el?.getAttribute("data-icon")).toBe("AlertTriangle");
  });

  it("keeps the callout and its attributes through a save", () => {
    vi.useFakeTimers();
    try {
      const onUpdate = vi.fn();
      const { container } = renderEditor(
        docWithCallout({ iconName: "Lightbulb", color: "green" }),
        onUpdate,
      );

      edit(container);
      act(() => void vi.advanceTimersByTime(800));

      expect(onUpdate).toHaveBeenCalledTimes(1);
      const saved = JSON.parse(onUpdate.mock.calls[0][0] as string);
      const callout = saved.content.find(
        (n: { type: string }) => n.type === "callout",
      );
      expect(callout).toBeDefined();
      // iconName is carried but never drawn — a round-trip that quietly dropped
      // it would cost the writer's intent on the next MCP read.
      expect(callout.attrs).toMatchObject({
        iconName: "Lightbulb",
        color: "green",
      });
      expect(JSON.stringify(callout)).toContain("inside");
    } finally {
      vi.useRealTimers();
    }
  });

  it("keeps the pre-Tauri emoji / showIcon attributes through a save", () => {
    // A callout authored by the old Tauri app carries two more attributes.
    // ProseMirror drops attributes the schema does not declare, so without
    // them the first save after opening such a note would quietly flatten it.
    vi.useFakeTimers();
    try {
      const onUpdate = vi.fn();
      const doc = JSON.stringify({
        type: "doc",
        content: [
          {
            type: "callout",
            attrs: {
              iconName: "Info",
              color: "blue",
              emoji: "🔥",
              showIcon: false,
            },
            content: [
              {
                type: "paragraph",
                content: [{ type: "text", text: "inside" }],
              },
            ],
          },
        ],
      });
      const { container } = render(
        <RichTextEditor
          noteId="note-1"
          initialContent={doc}
          onUpdate={onUpdate}
        />,
      );

      edit(container);
      act(() => void vi.advanceTimersByTime(800));

      const saved = JSON.parse(onUpdate.mock.calls[0][0] as string);
      const callout = saved.content.find(
        (n: { type: string }) => n.type === "callout",
      );
      expect(callout.attrs).toMatchObject({ emoji: "🔥", showIcon: false });
    } finally {
      vi.useRealTimers();
    }
  });

  it("keeps an unknown colour rather than normalising it away", async () => {
    // generate_content takes a free-form colour string; anything the CSS map
    // does not cover has to stay in the document and fall back visually.
    const { container } = renderEditor(
      docWithCallout({ iconName: "Sparkles", color: "chartreuse" }),
      () => {},
    );

    await waitFor(() =>
      expect(container.querySelector(".note-callout")).toBeTruthy(),
    );
    expect(
      container.querySelector(".note-callout")?.getAttribute("data-color"),
    ).toBe("chartreuse");
    expect(container.textContent).toContain("inside");
  });
});
