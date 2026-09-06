/*
 * "What was filed under this tag most recently" (#1472) — the one derivation
 * the detail panel adds on top of the hub model.
 *
 * The hub's groups already order each KIND newest-first by the item's own
 * `updatedAt`, which answers "what moved in this topic". The panel asks a
 * different question — "what was put here lately" — and the assignment row
 * is what knows that: its `updatedAt` is when the tag was attached (or last
 * re-attached), regardless of whether the item itself has been touched since.
 *
 * The untagged bucket has no assignment rows by definition, so it falls back
 * to the item's own timestamp; the host labels that list differently.
 *
 * Pure, like buildTagHubModel: no React, no DataService (§3.1).
 */
import type { WikiTagAssignment } from "../../types/wikiTagUnified";
import { UNTAGGED_TAG_ID, type TagHubGroup, type TagHubItem } from "./types";

/** How many rows the panel lists. Small: it is a glance, not the list. */
export const TAG_HUB_RECENT_LIMIT = 5;

export interface SelectRecentTaggedItemsInput {
  /** The selected tag — a real `wiki_tags.id` or UNTAGGED_TAG_ID. */
  readonly tagId: string;
  /** Every assignment row the provider holds; filtered to `tagId` here. */
  readonly assignments: readonly WikiTagAssignment[];
  /**
   * The selected tag's groups from the model. Doubles as the "is this item
   * live and listable" check: an assignment whose item is not in them points
   * at something trashed or of a kind the hub does not show.
   */
  readonly groups: readonly TagHubGroup[];
  readonly limit?: number;
}

/** ISO strings compare as text; absent sorts last (same rule as the model). */
function compareIsoDesc(a: string | undefined, b: string | undefined): number {
  if (a === b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  return a < b ? 1 : -1;
}

export function selectRecentTaggedItems({
  tagId,
  assignments,
  groups,
  limit = TAG_HUB_RECENT_LIMIT,
}: SelectRecentTaggedItemsInput): TagHubItem[] {
  const itemsById = new Map<string, TagHubItem>();
  for (const group of groups) {
    for (const item of group.items) itemsById.set(item.id, item);
  }

  if (tagId === UNTAGGED_TAG_ID) {
    return [...itemsById.values()]
      .sort((a, b) => compareIsoDesc(a.updatedAt, b.updatedAt))
      .slice(0, limit);
  }

  const stamped = assignments
    .filter(
      (row) =>
        row.tagId === tagId && !row.isDeleted && itemsById.has(row.itemId),
    )
    .sort((a, b) => compareIsoDesc(a.updatedAt, b.updatedAt));

  // One row per item: the same item can carry two assignment rows to one tag
  // only through a soft-delete + re-add cycle, and the newer one already won
  // the sort above.
  const out: TagHubItem[] = [];
  const seen = new Set<string>();
  for (const row of stamped) {
    if (seen.has(row.itemId)) continue;
    seen.add(row.itemId);
    const item = itemsById.get(row.itemId);
    if (item) out.push(item);
    if (out.length >= limit) break;
  }
  return out;
}
