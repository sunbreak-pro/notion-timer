import { describe, it, expect, vi } from "vitest";
import { act, render, screen, fireEvent } from "@testing-library/react";
import { type ReactNode } from "react";
import { UndoRedoProvider } from "../src/context/UndoRedoContext";
import { useUndoRedoContext } from "../src/hooks/useUndoRedoContext";
import { SyncContext } from "../src/context/SyncContextValue";
import { uniformDomainVersions } from "../src/context/syncDomains";
import { TodoTreeProvider } from "../src/context/TodoTreeContext";
import { useTodoTreeContext } from "../src/hooks/useTodoTreeContext";
import type { DataService } from "../src/services/DataService";
import type { TodoNode } from "../src/types/todoTree";

/*
 * #1485 — undoing a todo CREATE takes the row out of the DB.
 *
 * The Schedule creation panel's Todo tab (and the Todos board's own add) write
 * through `addNode`, whose undo used to be "persist the list from before".
 * That is a faithful reversal for every other tree write, but `syncTodoTree`
 * is an upsert: a row missing from the list is simply not written, never
 * removed. So the new todo left the screen for an instant, Realtime echoed
 * the write back, the tree re-read, and the todo stood there again with the
 * Undo button already spent — and it survived a reload, because the DB never
 * heard about the undo at all.
 *
 * These tests drive the same handlers the panel does (D-20260812-refactor-2:
 * render + click, no coordinates) and assert on BOTH sides of the fix — the
 * tree the provider hands its consumers (the calendar chips are a pure
 * derivation of it) and what reached the DataService, since a rollback that
 * never leaves React is exactly the bug.
 */

const EXISTING: TodoNode = {
  id: "task-existing",
  type: "task",
  title: "already here",
  parentId: null,
  order: 0,
  status: "NOT_STARTED",
  createdAt: "2026-09-01T00:00:00.000Z",
};

function SyncStub({ children }: { children: ReactNode }) {
  return (
    <SyncContext.Provider
      value={{
        syncVersion: 0,
        domainVersions: uniformDomainVersions(0),
        triggerSync: async () => {},
      }}
    >
      {children}
    </SyncContext.Provider>
  );
}

/**
 * A DataService whose sync can be held open, so a case can undo while the
 * create's own upsert is still in flight — the ordering the fix has to get
 * right (a soft delete that lands BEFORE the insert is a zero-row UPDATE).
 */
function makeTodoDS() {
  const synced: TodoNode[][] = [];
  const softDeleted: string[] = [];
  /** Timeline of DB writes, in the order they SETTLED. */
  const timeline: string[] = [];
  let release: (() => void) | null = null;
  const ds = {
    fetchTodoTree: async () => [EXISTING],
    fetchDeletedTodos: async () => [],
    syncTodoTree: async (nodes: TodoNode[]) => {
      synced.push(nodes);
      if (release === null) {
        timeline.push(`sync:${nodes.map((n) => n.id).join(",")}`);
        return;
      }
      await new Promise<void>((resolve) => {
        const prev = release;
        release = () => {
          prev?.();
          resolve();
        };
      });
      timeline.push(`sync:${nodes.map((n) => n.id).join(",")}`);
    },
    softDeleteTodo: vi.fn(async (id: string) => {
      softDeleted.push(id);
      timeline.push(`softDelete:${id}`);
    }),
  } as unknown as DataService & { softDeleteTodo: ReturnType<typeof vi.fn> };
  /** From here on, every sync waits until `flush()` is called. */
  const hold = () => {
    release = () => {};
  };
  const flush = async () => {
    const r = release;
    release = null;
    await act(async () => {
      r?.();
    });
  };
  const lastSyncedIds = () => synced[synced.length - 1]?.map((n) => n.id) ?? [];
  return { ds, synced, softDeleted, timeline, hold, flush, lastSyncedIds };
}

/** Stands in for the creation panel: the same `addNode` call its Todo tab makes. */
function CreateProbe() {
  const { nodes, addNode } = useTodoTreeContext();
  return (
    <>
      <span data-testid="ids">
        {nodes
          .filter((n) => !n.isDeleted)
          .map((n) => n.id)
          .join(",")}
      </span>
      <button
        onClick={() =>
          addNode("task", null, "from the panel", {
            scheduledAt: "2026-09-08T09:00:00.000Z",
            scheduledEndAt: "2026-09-08T10:00:00.000Z",
            isAllDay: false,
          })
        }
      >
        create
      </button>
    </>
  );
}

function UndoProbe() {
  const { undo, redo, canUndo, canRedo } = useUndoRedoContext();
  return (
    <>
      <span data-testid="can-undo">{String(canUndo())}</span>
      <span data-testid="can-redo">{String(canRedo())}</span>
      <button onClick={() => undo()}>undo</button>
      <button onClick={() => redo()}>redo</button>
    </>
  );
}

async function mount(ds: DataService) {
  render(
    <UndoRedoProvider>
      <UndoProbe />
      <SyncStub>
        <TodoTreeProvider dataService={ds}>
          <CreateProbe />
        </TodoTreeProvider>
      </SyncStub>
    </UndoRedoProvider>,
  );
  // Flush the provider's initial fetch — until it lands, every write is
  // dropped by the not-loaded guard (useTodoTreeAPI).
  await act(async () => {});
}

const click = async (name: string) => {
  await act(async () => {
    fireEvent.click(screen.getByText(name));
  });
};

const ids = () => screen.getByTestId("ids").textContent;
const canUndo = () => screen.getByTestId("can-undo").textContent;
const canRedo = () => screen.getByTestId("can-redo").textContent;

/** The id addNode minted — the only one that is not EXISTING. */
const createdId = (synced: TodoNode[][]) =>
  synced[0].find((n) => n.id !== EXISTING.id)?.id;

describe("undoing a todo create (#1485)", () => {
  it("removes the row from the DB as well as from the tree", async () => {
    const { ds, synced, softDeleted, lastSyncedIds } = makeTodoDS();
    await mount(ds);
    expect(ids()).toBe(EXISTING.id);
    expect(canUndo()).toBe("false");

    await click("create");
    const id = createdId(synced);
    expect(id).toBeDefined();
    expect(ids()).toBe(`${EXISTING.id},${id}`);
    expect(canUndo()).toBe("true");
    // The create itself reached the DB.
    expect(lastSyncedIds()).toContain(id);

    await click("undo");
    // Gone from the tree the chips derive from …
    expect(ids()).toBe(EXISTING.id);
    // … and the DB was told so — the part that was missing. The sibling list
    // from before goes back too (its pre-create order), which is why the last
    // sync no longer names the row either.
    expect(softDeleted).toEqual([id]);
    expect(lastSyncedIds()).not.toContain(id);
    expect(canRedo()).toBe("true");
  });

  it("redo brings the same row back through the upsert", async () => {
    const { ds, synced, softDeleted, lastSyncedIds } = makeTodoDS();
    await mount(ds);
    await click("create");
    const id = createdId(synced);
    await click("undo");
    expect(ids()).toBe(EXISTING.id);

    await click("redo");
    expect(ids()).toBe(`${EXISTING.id},${id}`);
    // The redo is the plain re-persist: the node is in the list, and the
    // upsert writes it back with is_deleted:false. No second delete.
    expect(lastSyncedIds()).toContain(id);
    expect(softDeleted).toEqual([id]);
  });

  it("waits for the in-flight create before deleting, so the insert cannot land last", async () => {
    // Undo pressed before the create's upsert has settled. A soft delete that
    // reaches the DB first is a zero-row UPDATE (PostgREST reports success),
    // and the insert landing afterwards would resurrect the todo with the
    // undo already spent — the very symptom #1485 describes.
    const { ds, synced, timeline, hold, flush } = makeTodoDS();
    await mount(ds);
    hold();

    await click("create");
    await click("undo");
    // Nothing has settled yet: the delete is queued behind the sync.
    expect(timeline).toEqual([]);
    expect(ds.softDeleteTodo).not.toHaveBeenCalled();

    await flush();
    await act(async () => {});
    // Both syncs (the create, then the undo's re-persist of the old list)
    // settle before the soft delete is even issued.
    const id = createdId(synced);
    expect(timeline).toEqual([
      `sync:${EXISTING.id},${id}`,
      `sync:${EXISTING.id}`,
      `softDelete:${id}`,
    ]);
  });
});
