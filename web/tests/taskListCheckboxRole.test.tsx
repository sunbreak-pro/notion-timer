import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { RichTextEditor } from "../src/notes/RichTextEditor";

/*
 * The note body's task-list checkbox names itself like every other todo
 * checkbox in the app (#1523).
 *
 * The Mobile audit read `role` / `aria-checked` off the note body's box and off
 * the paper's and the Schedule tray's — <TodoStatusCheckbox>, a
 * `<button role="checkbox" aria-checked>` — and found the note body carrying
 * neither. TipTap's box is a native <input type="checkbox">, so a screen reader
 * was never actually in the dark; what was missing is the shared vocabulary
 * anything INSPECTING the three surfaces reads, which is why they looked like
 * three different controls.
 *
 * Written against the real editor rather than a stub: the attributes are
 * stamped from inside a ProseMirror node view, and the thing worth checking is
 * that the stamp survives a toggle — i.e. that `aria-checked` is not a copy
 * that goes stale the first time the user presses it. No layout is involved, so
 * jsdom is enough (unlike the SIZE half of the Issue, which only a stylesheet
 * assertion can reach — taskListCheckboxSize.test.ts).
 */

function docWithTasks(checked: boolean[]) {
  return JSON.stringify({
    type: "doc",
    content: [
      {
        type: "taskList",
        content: checked.map((isChecked) => ({
          type: "taskItem",
          attrs: { checked: isChecked },
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: isChecked ? "done" : "todo" }],
            },
          ],
        })),
      },
    ],
  });
}

function renderTasks(checked: boolean[]) {
  const view = render(
    <RichTextEditor
      noteId="note-1"
      initialContent={docWithTasks(checked)}
      onUpdate={() => {}}
    />,
  );
  const boxes = Array.from(
    view.container.querySelectorAll<HTMLInputElement>(
      'ul[data-type="taskList"] input[type="checkbox"]',
    ),
  );
  return { view, boxes };
}

describe("the note body's task-list checkbox (#1523)", () => {
  it("carries role=checkbox, like the paper's and the tray's", () => {
    const { boxes } = renderTasks([false, true]);
    expect(boxes).toHaveLength(2);
    for (const box of boxes) {
      expect(box.getAttribute("role")).toBe("checkbox");
    }
  });

  it("reports the state each item was opened in", () => {
    const { boxes } = renderTasks([false, true]);
    expect(boxes[0]?.getAttribute("aria-checked")).toBe("false");
    expect(boxes[1]?.getAttribute("aria-checked")).toBe("true");
  });

  it("follows the box when the user presses it", () => {
    const { boxes } = renderTasks([false]);
    const box = boxes[0];
    expect(box).toBeDefined();
    if (!box) return;

    // What a press does: the browser flips `checked`, then fires `change` —
    // which is the event TipTap's own listener writes the document from.
    box.checked = true;
    box.dispatchEvent(new Event("change", { bubbles: true }));
    expect(box.getAttribute("aria-checked")).toBe("true");

    box.checked = false;
    box.dispatchEvent(new Event("change", { bubbles: true }));
    expect(box.getAttribute("aria-checked")).toBe("false");
  });
});
