// @vitest-environment node (this suite touches no DOM)
import { describe, it, expect, beforeEach } from "vitest";
import {
  getConnectTagSelection,
  setConnectTagSelection,
  resetConnectSelection,
} from "../src/state/connectSelectionStore";

/*
 * #1473 — module-level Connect selection store, the #282 idiom for the tag
 * hub. It survives the section body's unmount (module state outlives React
 * trees) and resets with the process. Pinned here: null default, round-trip,
 * explicit null clears, reset returns to the fresh state.
 */

describe("connectSelectionStore", () => {
  beforeEach(() => {
    resetConnectSelection();
  });

  it("defaults to null on a fresh store", () => {
    expect(getConnectTagSelection()).toBeNull();
  });

  it("round-trips a tag id", () => {
    setConnectTagSelection("t-work");
    expect(getConnectTagSelection()).toBe("t-work");
  });

  it("treats an explicit null as a deselection, not a no-op", () => {
    setConnectTagSelection("t-work");
    setConnectTagSelection(null);
    expect(getConnectTagSelection()).toBeNull();
  });

  it("reset returns to the fresh-process state", () => {
    setConnectTagSelection("t-idle");
    resetConnectSelection();
    expect(getConnectTagSelection()).toBeNull();
  });
});
