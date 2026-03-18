import { z } from 'zod';

export const STUDY_PLAN_API_VERSION = '2026-03-14';

export const StudyPlanApiSourceSummarySchema = z.object({
  screenerResponseCount:  z.number().int().nonnegative(),
  assessmentResponseCount: z.number().int().nonnegative(),
  flaggedSkillCount:      z.number().int().nonnegative(),
  domainScoreCount:       z.number().int().nonnegative(),
  deficitSkillCount:      z.number().int().nonnegative(),
  clusterCount:           z.number().int().nonnegative().optional(),
});

export const StudyConstraintsSchema = z.object({
  testDate:          z.string().optional(),
  weeksToTest:       z.number().int().positive().optional(),
  studyDaysPerWeek:  z.number().int().min(1).max(7).optional(),
  minutesPerSession: z.number().int().positive().optional(),
  weekendMinutes:    z.number().int().nonnegative().optional(),
  intensity:         z.enum(['light', 'moderate', 'aggressive']).optional(),
}).optional();

// Pre-computed payload from the client (v2): the background function
// persists the complete StudyPlanDocumentV2 without re-fetching data.
export const StudyPlanApiPreComputedAddonsSchema = z.object({
  // v2 — full preprocessed payload included in the persisted document
  scheduleFrame:       z.array(z.any()).optional(),
  precomputedClusters: z.array(z.any()).optional(),
  domainSummaries:     z.array(z.any()).optional(),
  studyConstraints:    StudyConstraintsSchema,
  // v1 legacy fields (kept for backwards compat during migration)
  masteryChecklist:    z.array(z.any()).optional(),
  finalAssessmentGate: z.any().nullable().optional(),
});

export const StudyPlanApiRequestSchema = z.object({
  userId:       z.string().min(1),
  prompt:       z.string().min(1).max(400000),
  sourceSummary: StudyPlanApiSourceSummarySchema,
  requestedAt:  z.string().datetime().optional(),
  /** Passed so the background function can persist a complete document
   *  without re-fetching assessment data on the server. */
  preComputedAddons: StudyPlanApiPreComputedAddonsSchema.optional(),
});

export const StudyPlanApiResponseSchema = z.object({
  content: z.string().min(1),
  model: z.string().min(1),
  generatedAt: z.string().datetime(),
  apiVersion: z.literal(STUDY_PLAN_API_VERSION)
});

export type StudyPlanApiSourceSummary = z.infer<typeof StudyPlanApiSourceSummarySchema>;
export type StudyPlanApiRequest = z.infer<typeof StudyPlanApiRequestSchema>;
export type StudyPlanApiResponse = z.infer<typeof StudyPlanApiResponseSchema>;
