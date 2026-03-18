import { z } from 'zod';

export const STUDY_PLAN_API_VERSION = '2026-03-14';

export const StudyPlanApiSourceSummarySchema = z.object({
  screenerResponseCount: z.number().int().nonnegative(),
  assessmentResponseCount: z.number().int().nonnegative(),
  flaggedSkillCount: z.number().int().nonnegative(),
  domainScoreCount: z.number().int().nonnegative(),
  deficitSkillCount: z.number().int().nonnegative()
});

// Pre-computed values sent by the client so the background function can save
// a complete StudyPlanDocument without needing to re-fetch assessment data.
export const StudyPlanApiPreComputedAddonsSchema = z.object({
  masteryChecklist: z.array(z.any()),
  finalAssessmentGate: z.any().nullable()
});

export const StudyPlanApiRequestSchema = z.object({
  userId: z.string().min(1),
  prompt: z.string().min(1).max(200000),
  sourceSummary: StudyPlanApiSourceSummarySchema,
  requestedAt: z.string().datetime().optional(),
  /** Passed when using the background function endpoint so it can persist a
   *  complete StudyPlanDocument without re-fetching scores on the server. */
  preComputedAddons: StudyPlanApiPreComputedAddonsSchema.optional()
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
