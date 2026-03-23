import type { UserProfile } from '../hooks/useFirebaseProgress';
import type { UserProfileData } from '../components/OnboardingFlow';

function numToStr(n: number | undefined): string {
  if (n == null || Number.isNaN(n)) return '';
  return String(n);
}

/** Maps persisted `UserProfile` to the onboarding form shape for editing. */
export function userProfileToFormData(profile: UserProfile): UserProfileData {
  const ar = profile.accountRole;
  const account_role: UserProfileData['account_role'] =
    ar === 'graduate_student' || ar === 'certification_only' || ar === 'other' ? ar : '';

  const pe = profile.primaryExam;
  const primary_exam: UserProfileData['primary_exam'] =
    pe === 'praxis_5403' || pe === 'ftce_school_psychologist' || pe === 'other' ? pe : '';

  return {
    account_role,
    preferred_display_name: profile.preferredDisplayName ?? '',
    university: profile.university ?? '',
    program_type: (profile.programType as UserProfileData['program_type']) || '',
    program_state: profile.programState ?? '',
    delivery_mode: (profile.deliveryMode as UserProfileData['delivery_mode']) || '',
    training_stage: (profile.trainingStage as UserProfileData['training_stage']) || '',
    certification_state: profile.certificationState ?? '',
    current_role: (profile.currentRole as UserProfileData['current_role']) || '',
    certification_route: (profile.certificationRoute as UserProfileData['certification_route']) || '',
    primary_exam,
    planned_test_date: profile.plannedTestDate ?? '',
    retake_status: (profile.retakeStatus as UserProfileData['retake_status']) || '',
    number_of_prior_attempts: numToStr(profile.numberOfPriorAttempts),
    target_score: numToStr(profile.targetScore),
    study_goals: profile.studyGoals ?? [],
    weekly_study_hours: (profile.weeklyStudyHours as UserProfileData['weekly_study_hours']) || '',
    biggest_challenge: profile.biggestChallenge ?? [],
    used_other_resources: profile.usedOtherResources ?? null,
    other_resources_list: profile.otherResourcesList ?? [],
    what_was_missing: profile.whatWasMissing ?? ''
  };
}
