// Plan limits — change these constants to adjust limits across the codebase.
// Starter limits are enforced in:
//   - createEvent (event-management.ts) — max 1 event
//   - /api/upload/check-event-limit — max photos per event
//   - /dashboard/billing — usage display

export const PLAN_LIMITS = {
  starter: {
    maxEvents: 1,
    maxPhotosPerEvent: 200,
  },
  pro: {
    maxEvents: null,       // unlimited
    maxPhotosPerEvent: null, // unlimited
  },
} as const

export type PlanKey = keyof typeof PLAN_LIMITS
