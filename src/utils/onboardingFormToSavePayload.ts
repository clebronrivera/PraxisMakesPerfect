import type { UserProfileData } from '../components/OnboardingFlow';

/** Maps onboarding form state to the payload expected by `saveOnboardingData`. */
export function onboardingFormToSavePayload(data: UserProfileData) {
  return {
    account_role: data.account_role || undefined,
    preferred_display_name: data.preferred_display_name || undefined,
    university: data.university || undefined,
    program_type: data.program_type || undefined,
    program_state: data.program_state || undefined,
    delivery_mode: data.delivery_mode || undefined,
    training_stage: data.training_stage || undefined,
    certification_state: data.certification_state || undefined,
    current_role: data.current_role || undefined,
    certification_route: data.certification_route || undefined,
    primary_exam: data.primary_exam || undefined,
    planned_test_date: data.planned_test_date || undefined,
    retake_status: data.retake_status || undefined,
    number_of_prior_attempts: data.number_of_prior_attempts ? parseInt(data.number_of_prior_attempts, 10) : null,
    target_score: data.target_score ? parseInt(data.target_score, 10) : null,
    study_goals: data.study_goals,
    weekly_study_hours: data.weekly_study_hours || undefined,
    biggest_challenge: data.biggest_challenge,
    used_other_resources: data.used_other_resources ?? null,
    other_resources_list: data.other_resources_list,
    what_was_missing: data.what_was_missing || undefined
  };
}
