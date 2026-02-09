# Test Coverage Analysis

## Current State

### Overall Numbers

| Layer | Source Files | Test Files | Coverage |
|-------|-------------|-----------|----------|
| **Backend total** | 33 | 2 | ~6% |
| **Frontend total** | ~121 | 2 | ~1.6% |

All 8 existing frontend tests pass (Vitest). The test infrastructure on both sides is set up and functional — the gap is in test authoring, not tooling.

---

## What Exists Today

### Backend (Spring Boot / JUnit 5 + Mockito)

1. **`SonicFlowApplicationTest`** — context-loads smoke test
2. **`TaskServiceTest`** — 6 unit tests covering `createTask`, `getTaskTree`, `updateTask` (2 scenarios), `updateTask` not-found, and `permanentDelete`

### Frontend (Vitest + React Testing Library)

1. **`useLocalStorage.test.ts`** — 5 tests for the localStorage hook
2. **`duration.test.ts`** — 3 tests for the `formatDuration` utility

Test infrastructure is ready: Vitest config, jsdom environment, `@testing-library/react` + `user-event`, localStorage mock, and a `renderWithProviders` wrapper that composes all context providers.

---

## Priority Recommendations

### Priority 1 — Pure Logic (highest value, lowest effort)

These are pure functions with zero dependencies on React or Spring. They can be tested with simple input/output assertions.

#### Frontend

| File | Why |
|------|-----|
| `utils/breadcrumb.ts` — `getAncestors()` | Tree traversal logic; edge cases around missing parents, circular references, root nodes |
| `utils/folderColor.ts` — `resolveTaskColor()` | Color inheritance up the tree; edge cases: orphan nodes, root tasks (Inbox color), nested folders |
| `utils/folderTag.ts` | If it contains pure logic, same reasoning |
| `hooks/useTaskTreeCRUD.ts` | Core CRUD: `addNode`, `updateNode`, `toggleExpanded`, `toggleTaskStatus`. These can be tested by extracting the logic or calling the hook with `renderHook`. Key cases: folder depth limit (`MAX_FOLDER_DEPTH`), order calculation, status toggle with `completedAt` timestamp |
| `hooks/useTaskTreeDeletion.ts` | `softDelete`, `restoreNode`, `permanentDelete`. Recursive descendant collection, ancestor restoration on restore. This is business-critical logic with subtle edge cases (e.g., restoring a child should also restore deleted ancestors) |
| `hooks/useTaskTreeMovement.ts` | `moveNode`, `moveNodeInto`, `moveToRoot`. The most complex frontend logic: circular reference prevention, depth validation, cross-parent reordering, sibling order compaction. High bug surface area |

#### Backend

| File | Why |
|------|-----|
| `TaskService.softDelete()` | Recursive descendant collection + batch update. Currently untested |
| `TaskService.restore()` | Descendant + ancestor restoration. Complex traversal logic, completely untested |
| `TaskService.syncTree()` | Bulk save — simple but untested |
| `TaskService.parseDateTime()` | Timezone-stripping logic (`Z`, `+offset`). Edge cases around malformed strings |
| `TimerService` (all methods) | Settings singleton pattern, session lifecycle (start/end), validation of positive-only duration updates |

**Estimated test count: ~40-50 tests to cover these thoroughly.**

---

### Priority 2 — API Layer (medium effort, high confidence value)

#### Backend Controller Tests (`@WebMvcTest` + MockMvc)

None of the 26 API endpoints have tests. Controller tests verify:
- Request/response serialization (JSON ↔ DTO)
- HTTP status codes (200, 201, 404, 400)
- Path variable and request body binding
- Error handling (what happens when service throws `IllegalArgumentException`?)

| Controller | Endpoints | Priority |
|------------|-----------|----------|
| `TaskController` | 8 | High — most used API, complex operations like tree sync |
| `TimerController` | 6 | High — session lifecycle is timing-sensitive |
| `SoundController` | 5 | Medium |
| `MemoController` | 4 | Medium |
| `AIController` | 3 | Lower — external dependency (Gemini) complicates testing |
| `MigrationController` | 1 | Low — one-time operation |

#### Frontend API Client Tests

The 5 API clients (`taskClient`, `timerClient`, `soundClient`, `memoClient`, `aiClient`) make HTTP calls. Tests should mock `fetch` and verify:
- Correct URLs and HTTP methods
- Request body serialization
- Response parsing
- Error handling on non-2xx responses

**Estimated test count: ~50-60 tests.**

---

### Priority 3 — State Management / Context Providers

These are the hardest to test but cover the most critical integration logic.

#### Frontend Contexts

| Context | Why |
|---------|-----|
| `TimerContext` / `TimerProvider` | The pomodoro timer is the core feature. State transitions (WORK → BREAK → LONG_BREAK), `setInterval` countdown, session recording via API, background operation when modal is closed. Uses `renderHook` with the provider wrapper |
| `TaskTreeContext` / `TaskTreeProvider` | Orchestrates all task tree hooks + API synchronization (optimistic updates with 500ms debounce). The localStorage → API sync pattern is the most bug-prone area |
| `ThemeContext` | Simple but easy to test — theme toggle, persistence |
| `MemoContext` | CRUD for daily memos |

**Estimated test count: ~30-40 tests.**

---

### Priority 4 — Component Tests (selective)

Full component coverage isn't cost-effective for this codebase size. Focus on components with significant logic:

| Component | Why |
|-----------|-----|
| `TaskTreeNode` | Renders differently based on type (folder/task), status, active timer, expanded state. Inline timer display |
| `WorkScreen` | Timer controls, task selector integration, sound mixer state |
| `TaskDetail` | Status changes, memo editing, scheduled date updates |
| `Settings/TrashBin` | Restore/permanent-delete flow for soft-deleted items |
| `Calendar/WeeklyTimeGrid` | Time-based layout calculations |

**Estimated test count: ~20-30 tests.**

---

## Specific High-Risk Gaps

These are areas where bugs are most likely to occur and currently have zero test coverage:

### 1. Task Tree Movement — Circular Reference Prevention
`useTaskTreeMovement.ts:33-37` and `:95-99` both implement `isDescendant()` inline. If this logic has a bug, users can create circular parent references that break the entire tree rendering. This is the single highest-risk untested code path.

### 2. Soft Delete / Restore Consistency
Both frontend (`useTaskTreeDeletion.ts`) and backend (`TaskService.java`) implement recursive descendant collection independently. If these diverge, the optimistic update (frontend) and server state (backend) will be inconsistent. Tests should verify both implementations produce identical results for the same tree structure.

### 3. Timer Session Lifecycle
`TimerService.endSession()` doesn't validate that the session hasn't already ended. A double-end call would silently overwrite `completedAt`. No test covers this.

### 4. DateTime Parsing
`TaskService.parseDateTime()` strips timezone info with string manipulation (`replace("Z", "")`, `substring` before `+`). This is fragile — strings like `2024-01-01T00:00:00+09:00` or `2024-01-01T00:00:00.000Z` have different edge cases. No tests exist for this method.

### 5. Optimistic Update Divergence
The frontend applies changes to localStorage immediately, then syncs to the backend with a 500ms debounce. If the backend rejects the change (validation error, constraint violation), the frontend and backend state diverge silently. No tests verify the error/recovery path.

---

## Recommended Implementation Order

1. **Start with `useTaskTreeMovement` and `useTaskTreeDeletion` hook tests** — highest business risk, pure-ish logic, can use `renderHook`
2. **Add `TaskService` tests for `softDelete`, `restore`, `parseDateTime`** — fill the gaps in the only partially-tested service
3. **Add `TimerService` unit tests** — straightforward Mockito tests, second most important service
4. **Add controller tests for `TaskController` and `TimerController`** — `@WebMvcTest` + MockMvc
5. **Add `TimerContext` integration tests** — the core user-facing feature
6. **Add remaining utility tests** — `breadcrumb.ts`, `folderColor.ts`
7. **Add API client tests** — mock fetch, verify contracts
8. **Selective component tests** — `TaskTreeNode`, `WorkScreen`

---

## Test Infrastructure Notes

### What's already set up (no additional config needed)

**Frontend:**
- Vitest 4.0.18 with jsdom
- `@testing-library/react` 16.3.2 + `user-event` 14.6.1 + `jest-dom` 6.9.1
- localStorage mock in `src/test/setup.ts`
- `renderWithProviders` wrapper in `src/test/renderWithProviders.tsx`

**Backend:**
- JUnit 5 + Mockito + AssertJ (via `spring-boot-starter-test`)
- H2 in-memory test database (`application-test.properties`)
- `@ActiveProfiles("test")` pattern established

### What should be added

- **Coverage reporting**: Add `--coverage` flag to Vitest script and JaCoCo to Gradle for visibility into actual line/branch coverage
- **CI integration**: Run tests on every push (GitHub Actions or similar)
- **Test data factories**: Shared helper to create `TaskNode[]` trees for frontend tests and `Task` entity builders for backend tests, to reduce test boilerplate
