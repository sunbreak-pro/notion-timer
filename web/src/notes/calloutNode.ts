import { Node, mergeAttributes } from "@tiptap/core";

/*
 * callout — block container node for the MCP server's callout blocks (#1521).
 *
 * The MCP server has always been able to write callouts: `generate_content`
 * takes a `callout` block, `format_content` has a `wrap_callout` action, and
 * `markdownToTiptap` turns a GitHub-style `> [!NOTE]` alert into one (every
 * markdown-taking tool advertises that syntax in its description). The web
 * editor's schema never knew the node, so `enableContentCheck: true` rejected
 * the WHOLE document and RichTextEditor's onContentError only logged it — the
 * note opened blank and the next autosave wrote that blank back over the real
 * body. Registering the node here is what makes those documents load.
 *
 * Registered UNCONDITIONALLY by RichTextEditor for the same reason itemLink
 * and attachment (#1404) are: a note authored through one surface has to open
 * on every other one, so the schema must know the node even where nothing in
 * the UI creates it. Nothing in the editor creates a callout yet — there is no
 * slash-menu entry and no input rule — so this is a read/round-trip node whose
 * job is to survive save→reload untouched.
 *
 *   attrs.iconName  lucide icon name the writer chose (default "Lightbulb")
 *   attrs.color     one of default / blue / green / yellow / purple / red
 *   attrs.emoji     legacy, see addAttributes
 *   attrs.showIcon  legacy, see addAttributes
 *
 * All four round-trip through getJSON() so an MCP-written callout keeps its
 * intent after the user edits the note in the app. `color` is the only one the
 * editor draws (a tinted block with a colour band, mirroring how blockquote is
 * treated in the same stylesheet); `iconName` is carried but NOT drawn — the
 * note editor's CSS is deliberately lean (web/src/index.css) and pulling the
 * lucide set into a ProseMirror node view for a decoration would be the odd
 * one out here. The attribute is preserved, so drawing it later is additive.
 *
 * `content: "block+"` because callouts nest real blocks: markdownToTiptap
 * fills one with paragraphs, and `wrap_callout` wraps a whole document — which
 * may hold headings, lists or code blocks — in a single callout.
 *
 * `defining: true`, like blockquote: it keeps the wrapper alive when the user
 * replaces the text inside it, instead of letting a paste lift the content out
 * of the callout.
 *
 * lumen-* only — the visual treatment lives in web/src/index.css.
 */

/** Node type name. Must match the string the MCP builder writes. */
export const CALLOUT_NODE_TYPE = "callout";

/**
 * Colours the MCP side can emit: `tiptapJsonBuilder.callout()` defaults to
 * "default", and `markdownToTiptap`'s ALERT_MAP uses the other five. The list
 * is a display concern only — an unknown value is kept in the JSON and simply
 * falls back to the neutral treatment in CSS, because `generate_content` takes
 * a free-form string and must never cost the user their document.
 */
export const CALLOUT_COLORS = [
  "default",
  "blue",
  "green",
  "yellow",
  "purple",
  "red",
] as const;

export type CalloutColor = (typeof CALLOUT_COLORS)[number];

export const Callout = Node.create({
  name: CALLOUT_NODE_TYPE,
  group: "block",
  content: "block+",
  defining: true,

  /*
   * Name, group, content, `defining` and the parseHTML tag below are all
   * VERBATIM from the pre-Tauri implementation this replaces
   * (`frontend/src/extensions/Callout.ts`, still readable at git tag
   * `pre-tauri-removal`), down to the `data-icon` / `data-color` attribute
   * names. Notes written by that app are still in the database, so matching it
   * is not nostalgia — it is what makes those documents parse as the same node
   * rather than a differently-shaped one.
   *
   * `emoji` and `showIcon` come from there too. Nothing writes them today: the
   * MCP builder emits only iconName + color, and the editor creates no
   * callouts at all. They are declared because ProseMirror drops attributes
   * the schema does not name — silently, on the save after the note is opened
   * — and quietly shrinking a document is the whole bug this file exists to
   * fix. Declaring them costs two entries and keeps an old note whole.
   */
  addAttributes() {
    return {
      iconName: {
        // Same default as the MCP builder, so a callout written without one
        // and a callout round-tripped through the editor agree.
        default: "Lightbulb",
        parseHTML: (el) => el.getAttribute("data-icon") ?? "Lightbulb",
        renderHTML: (attrs) => ({ "data-icon": attrs.iconName }),
      },
      color: {
        default: "default",
        parseHTML: (el) => el.getAttribute("data-color") ?? "default",
        renderHTML: (attrs) => ({ "data-color": attrs.color }),
      },
      emoji: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-emoji"),
        // Omitted entirely when unset, so a callout without one does not grow
        // an empty attribute every time it is written back.
        renderHTML: (attrs) =>
          attrs.emoji ? { "data-emoji": attrs.emoji } : {},
      },
      showIcon: {
        default: true,
        parseHTML: (el) => el.getAttribute("data-show-icon") !== "false",
        renderHTML: (attrs) => ({
          "data-show-icon": attrs.showIcon ? "true" : "false",
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-callout]" }];
  },

  /*
   * One element with the content hole in it — no wrapper for a decoration,
   * which is what lets this node work without a node view at all. The
   * `data-callout` marker is what parseHTML matches on, so a callout copied
   * out of the editor and pasted back stays a callout instead of collapsing
   * into loose paragraphs.
   */
  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-callout": "",
        class: "note-callout",
      }),
      0,
    ];
  },
});

/**
 * Build the callout node. A function (rather than exporting the node straight)
 * to match createItemLinkNode / createAttachmentNode at the RichTextEditor
 * call site, even though this node takes no host wiring.
 */
export function createCalloutNode(): Node {
  return Callout;
}
