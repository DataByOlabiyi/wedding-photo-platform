# /feature — Feature development workflow

This is the default workflow for any non-trivial change on the `saas` branch. Run it automatically unless the user says "skip the workflow" or the change is a single-line fix.

**Non-trivial** means: anything touching auth, payments, RLS, migrations, new routes, new components, or existing API contracts.

---

## Workflow: PM → Planner → DB-Architect (if DB) → Designer → Engineer → Tester → Security-Auditor (pre-deploy) → Reviewer

Work through each phase in order. Do not skip a phase. Do not proceed to the next phase if the current one has unresolved blockers or open questions.

---

### Phase 1 — PM

Invoke the `pm` agent.

Input: the user's feature request (verbatim or summarised from context).

The PM agent produces a brief with: Problem, Acceptance criteria, Out of scope, Open questions, Risks.

**Gate:** If the PM brief has open questions, surface them to the user now. Do not proceed to planning until they are answered.

---

### Phase 2 — Planner

Invoke the `planner` agent.

Input: the approved PM brief.

The planner produces: Files touched, Step-by-step plan (ordered, with dependencies), Migration note (if applicable), Risk areas touched, Questions for PM (if any).

**Gate:** If the planner has questions for PM, resolve them before proceeding. If the plan touches a CLAUDE.md risk area, explicitly flag it to the user.

---

### Phase 2b — DB-Architect (skip if no schema changes)

Invoke the `db-architect` agent.

Input: the approved PM brief + planner's step list.

The db-architect produces: migration SQL, RLS policies, index recommendations, and risk notes.

**Gate:** If the plan includes a new table, new column, new RLS policy, new index, or any change to an existing migration pattern — this phase is mandatory, not optional. Do not let the engineer write migration SQL ad-hoc. If the db-architect raises risk notes, surface them to the user before proceeding.

---

### Phase 3 — Designer (skip if no UI involved)

Invoke the `designer` agent.

Input: the approved PM brief + planner's step list.

The designer produces: Component inventory, Screen-by-screen behaviour, Mobile behaviour, Reuse notes.

**Gate:** If the change is purely backend (no new UI, no changes to existing UI), skip this phase and note it.

---

### Phase 4 — Engineer

Invoke the `engineer` agent.

Input: the PM brief + planner's step list + designer's spec (if applicable).

The engineer implements each step in the order specified. On completion, the engineer lists every file changed and what changed in each.

**Gate:** If the engineer hits an ambiguity not covered by the plan, stop, surface the question, resolve it, then continue. Do not guess.

---

### Phase 5 — Tester

Invoke the `tester` agent.

Input: PM brief (acceptance criteria) + list of files changed by engineer.

The tester runs the verification checklist, checks each acceptance criterion, and reports PASS or FAIL with evidence.

**Gate:** If the tester reports FAIL, return to the engineer with the specific failures. Do not proceed to review until tester reports PASS.

---

### Phase 5b — Security-Auditor (run before any deploy touching auth, payments, or RLS)

Invoke the `security-auditor` agent.

Input: the diff (files changed by engineer).

The security-auditor checks: tenant isolation, payment idempotency, admin role leakage, service-role exposure, storage scope, rate-limit bypass vectors.

**Gate:** If the change touches `requireOrg()`, `createAdminClient()`, Stripe, storage, PIN verification, or any auth flow — this phase is mandatory. CRITICAL or HIGH findings block the deploy. MEDIUM findings are surfaced to the user to decide. If the change is purely UI (no data access changes), skip this phase and note it.

---

### Phase 6 — Reviewer

Invoke the `reviewer` agent.

Input: the diff (files changed) + CLAUDE.md.

The reviewer checks all hard rules and risk areas. Reports APPROVED, APPROVED WITH ADVISORIES, or BLOCKED.

**Gate:** If BLOCKED, return to engineer with the blocking findings. If APPROVED WITH ADVISORIES, surface them to the user — they decide whether to act.

---

## Completion

When all phases pass, report to the user:
- What was built (one sentence)
- Any advisory findings the reviewer raised
- Whether a migration needs to be manually applied in Supabase
- Whether a Stripe webhook needs to be verified in the dashboard

Do not commit or push unless the user explicitly asks.
