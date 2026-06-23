# /bug-hunt — Bug scanning workflow

Scans the codebase (or a specified area) for real bugs. Proposes fixes one at a time. Never applies a fix without explicit approval.

---

## Usage

```
/bug-hunt                      — scan the whole codebase
/bug-hunt app/actions/         — scan a specific directory
/bug-hunt P0                   — scan for security/data integrity bugs only
/bug-hunt lib/rate-limit.ts    — scan a specific file
```

---

## Workflow

### Step 1 — Scope

Determine the scan area from the user's input. If none given, scan in this order:
1. CLAUDE.md risk areas (start here — highest value)
2. `app/actions/` (all server actions)
3. `app/api/` (all route handlers)
4. `lib/` (utilities, auth, stripe, rate-limit)
5. Components that handle user input

### Step 2 — Scan

Invoke the `bug-hunter` agent with the scope.

The bug-hunter reads the files, identifies bugs, prioritises by tier (P0 → P3), and prepares a list. It does NOT fix anything yet.

### Step 3 — Present first bug

The bug-hunter presents the highest-priority bug found:

```
BUG #1 [P0/P1/P2/P3]
File: path/to/file.ts (line N)
Problem: ...
Evidence: ...
Proposed fix: ...
```

Then asks: **"Apply this fix? (yes / skip / stop)"**

Wait for the user's response.

### Step 4 — Act on response

- **yes** → engineer applies the minimal fix, tester verifies it didn't regress, then present the next bug
- **skip** → note it as acknowledged, move to next bug
- **stop** → stop scanning, summarise what was found (fixed, skipped, remaining)

### Step 5 — Repeat

Continue presenting bugs one at a time until: the user says stop, all bugs are presented, or the scope is exhausted.

---

## Rules

- One bug at a time, one fix at a time
- Minimal fixes only — do not refactor surrounding code
- After each fix, run `npm test` before presenting the next bug
- If a fix would require a SQL migration, flag it explicitly before applying
- If a fix touches auth, RLS, or org scoping, it goes through the full `/feature` workflow instead — do not apply it inline

---

## Completion report

When done, output:

```
Bug hunt complete.
Fixed: N bugs (list titles)
Skipped: N bugs (list titles)
Remaining in queue: N bugs (list titles, user can re-run /bug-hunt to continue)
```
