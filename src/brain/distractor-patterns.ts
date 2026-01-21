// Distractor Pattern Library - Defines how wrong answers are generated
// Each pattern represents a common error type that leads to wrong answers

import { PatternId } from './template-schema';

export type SkillCategory = 
  | "first-step"
  | "scenario"
  | "definition"
  | "recognition"
  | "interpretation"
  | "legal-ethical"
  | "research-data";

export interface DistractorPattern {
  patternId: PatternId;
  name: string;
  description: string;
  logicTransform: string; // Explanation of how to generate wrong answer from correct logic
  renderingGuidance: string; // How to phrase the wrong answer
  feedbackExplanation: string; // Why this type of answer is wrong (for user feedback)
  applicableSkillTypes: SkillCategory[]; // Which skill categories this pattern applies to
}

export const DISTRACTOR_PATTERNS: Record<PatternId, DistractorPattern> = {
  "premature-action": {
    patternId: "premature-action",
    name: "Premature Action",
    description: "Jumping to intervention/action without proper assessment first",
    logicTransform: "Take the correct answer (which involves assessment/data review) and replace it with an action that would come AFTER assessment. Examples: 'Contact parents' instead of 'Assess the situation', 'Implement intervention' instead of 'Review data', 'Refer for evaluation' instead of 'Collect baseline data'.",
    renderingGuidance: "Use action verbs that imply immediate intervention: 'implement', 'contact', 'refer', 'begin', 'start'. Frame as doing something rather than gathering information.",
    feedbackExplanation: "This answer skips the crucial first step of assessment or data collection. School psychologists must understand the problem before taking action.",
    applicableSkillTypes: ["first-step", "scenario"]
  },

  "role-confusion": {
    patternId: "role-confusion",
    name: "Role Confusion",
    description: "Choosing actions that belong to another professional (teacher, parent, admin, doctor)",
    logicTransform: "Take an action that is appropriate but belongs to a different professional role. Examples: 'Take over teaching' (teacher's role), 'Prescribe medication' (doctor's role), 'Make disciplinary decisions' (administrator's role), 'Provide direct instruction' (teacher's role).",
    renderingGuidance: "Use actions that are valid but outside school psychologist scope: teaching, prescribing, disciplining, direct instruction, medical diagnosis.",
    feedbackExplanation: "School psychologists consult, collaborate, and assess. They do not take over roles of teachers, administrators, or medical professionals.",
    applicableSkillTypes: ["scenario", "first-step"]
  },

  "similar-concept": {
    patternId: "similar-concept",
    name: "Similar Concept",
    description: "Picking a related concept from the same category that doesn't fit the context",
    logicTransform: "Select a concept that is related but incorrect for this specific context. Examples: 'Test-retest reliability' when answer is 'Interobserver agreement' (both reliability types), 'Content validity' when answer is 'Construct validity' (both validity types), 'Tier 2 intervention' when answer is 'Tier 3' (both intervention tiers).",
    renderingGuidance: "Use related terms from the same conceptual category. The answer should be plausible but wrong for the specific context given.",
    feedbackExplanation: "While this concept is related, it doesn't match the specific context described in the question. The correct answer is more appropriate for this situation.",
    applicableSkillTypes: ["definition", "recognition", "context-matching"]
  },

  "data-ignorance": {
    patternId: "data-ignorance",
    name: "Data Ignorance",
    description: "Making decisions without reviewing available data",
    logicTransform: "Take an action that ignores or doesn't use available data. Examples: 'Make recommendation based on teacher report' instead of 'Review assessment data', 'Implement intervention' instead of 'Analyze progress monitoring data', 'Decide eligibility' instead of 'Review evaluation results'.",
    renderingGuidance: "Frame answers that make decisions or recommendations without mentioning data review, analysis, or assessment.",
    feedbackExplanation: "School psychologists practice data-based decision making. Decisions should be informed by reviewing and analyzing relevant data first.",
    applicableSkillTypes: ["scenario", "first-step", "interpretation"]
  },

  "extreme-language": {
    patternId: "extreme-language",
    name: "Extreme Language",
    description: "Answers with 'always', 'never', 'only', 'must' that are too absolute",
    logicTransform: "Take a correct principle and make it absolute with extreme language. Examples: 'Always use standardized tests' (should be 'often'), 'Never contact parents without consent' (should be 'usually'), 'Must implement Tier 2 before Tier 3' (should be 'typically').",
    renderingGuidance: "Use absolute qualifiers: 'always', 'never', 'only', 'must', 'all', 'none', 'every'. Make statements that don't allow for exceptions.",
    feedbackExplanation: "Best practices in school psychology allow for flexibility and exceptions. Absolute statements are rarely correct.",
    applicableSkillTypes: ["definition", "recognition", "scenario", "interpretation"]
  },

  "context-mismatch": {
    patternId: "context-mismatch",
    name: "Context Mismatch",
    description: "Correct approach but wrong for this specific situation",
    logicTransform: "Take a valid approach but apply it to the wrong context. Examples: 'Use CBM for comprehensive evaluation' (CBM is for progress monitoring), 'Use screening tool for eligibility' (screening identifies risk, not eligibility), 'Use individual assessment for screening' (screening should be group-administered).",
    renderingGuidance: "Use correct concepts but apply them to inappropriate contexts. The answer should be valid in general but wrong for this specific situation.",
    feedbackExplanation: "While this approach is valid in general, it doesn't match the specific context or purpose described in this question.",
    applicableSkillTypes: ["scenario", "context-matching", "best-selection"]
  },

  "incomplete-response": {
    patternId: "incomplete-response",
    name: "Incomplete Response",
    description: "Missing a required element of the complete answer",
    logicTransform: "Take the correct answer (which may have multiple components) and remove one essential element. Examples: For 'Review data and consult with teacher', use 'Review data' (missing consultation) or 'Consult with teacher' (missing data review).",
    renderingGuidance: "Provide partial answers that are correct but incomplete. Omit one critical component of the full answer.",
    feedbackExplanation: "This answer is partially correct but incomplete. The full answer requires additional steps or components.",
    applicableSkillTypes: ["first-step", "scenario", "best-selection"]
  },

  "legal-overreach": {
    patternId: "legal-overreach",
    name: "Legal Overreach",
    description: "Exceeding professional authority or legal bounds",
    logicTransform: "Take an action that exceeds legal or ethical boundaries. Examples: 'Share records without consent' (violates FERPA), 'Make medical diagnosis' (outside scope), 'Disclose confidential information' (violates confidentiality), 'Make placement decisions unilaterally' (requires team decision).",
    renderingGuidance: "Use actions that violate legal or ethical guidelines: sharing without consent, making decisions outside authority, exceeding professional boundaries.",
    feedbackExplanation: "This action exceeds the school psychologist's legal authority or violates ethical/legal guidelines such as FERPA, confidentiality, or IDEA requirements.",
    applicableSkillTypes: ["scenario", "legal-ethical", "first-step"]
  },

  "correlation-as-causation": {
    patternId: "correlation-as-causation",
    name: "Correlation as Causation",
    description: "Assuming causal relationship from correlational data",
    logicTransform: "Take correlational data and interpret it as causal. Examples: 'Students with low reading scores have behavior problems, so reading difficulties cause behavior problems' (correlation, not causation), 'Intervention was followed by improvement, so intervention caused improvement' (without control, can't infer causation).",
    renderingGuidance: "Use language that implies causation: 'causes', 'leads to', 'results in', 'makes happen'. Frame correlations as if they prove causation.",
    feedbackExplanation: "Correlation does not imply causation. Just because two things are related doesn't mean one causes the other. Additional evidence is needed to establish causation.",
    applicableSkillTypes: ["research-data", "interpretation"]
  },

  "function-confusion": {
    patternId: "function-confusion",
    name: "Function Confusion",
    description: "Confusing different behavior functions (attention vs escape vs tangible)",
    logicTransform: "Select a behavior function that is plausible but incorrect for the described consequence. Examples: 'Attention' when consequence is removal from task (should be escape), 'Escape' when consequence is getting attention (should be attention), 'Tangible' when consequence is removal (should be escape).",
    renderingGuidance: "Use related but incorrect behavior functions. The answer should be a valid function but wrong for the specific consequence described.",
    feedbackExplanation: "Behavior functions are determined by what maintains the behavior. The consequence described indicates a different function than this answer.",
    applicableSkillTypes: ["scenario", "recognition", "analysis"]
  },

  "case-confusion": {
    patternId: "case-confusion",
    name: "Case Confusion",
    description: "Confusing different landmark legal cases and their rulings",
    logicTransform: "Select a landmark case that is related but incorrect for the described legal principle. Examples: 'Larry P.' when question asks about duty to warn (should be Tarasoff), 'Rowley' when question asks about test bias (should be Larry P.), 'Tarasoff' when question asks about FAPE (should be Rowley).",
    renderingGuidance: "Use related but incorrect landmark cases. The answer should be a valid case but wrong for the specific legal principle described.",
    feedbackExplanation: "While this is a significant legal case, it doesn't match the specific legal principle or ruling described in the question.",
    applicableSkillTypes: ["legal-ethical", "recognition", "case-identification"]
  },

  "sequence-error": {
    patternId: "sequence-error",
    name: "Sequence Error",
    description: "Getting the order or sequence wrong",
    logicTransform: "Take a correct sequence and swap or reorder elements. Examples: 'B-A-C' instead of 'A-B-C', 'Intervention before assessment' instead of 'Assessment before intervention'.",
    renderingGuidance: "Reorder elements of a correct sequence. The answer should have correct elements but wrong order.",
    feedbackExplanation: "The elements are correct but the sequence is wrong. The proper order matters for this process.",
    applicableSkillTypes: ["definition", "recognition"]
  },

  "function-mismatch": {
    patternId: "function-mismatch",
    name: "Function Mismatch",
    description: "Selecting replacement behavior that doesn't match the function",
    logicTransform: "Select a replacement behavior that serves a different function than the problem behavior. Examples: If problem behavior serves escape function, select replacement that serves attention function.",
    renderingGuidance: "Use replacement behaviors that are valid but serve different functions than the problem behavior.",
    feedbackExplanation: "Replacement behaviors must serve the SAME function as the problem behavior to be effective.",
    applicableSkillTypes: ["best-selection", "scenario"]
  },

  "model-confusion": {
    patternId: "model-confusion",
    name: "Model Confusion",
    description: "Confusing different therapy or consultation models",
    logicTransform: "Select a related but incorrect model. Examples: 'CBT' when question describes SFBT techniques, 'DBT' when question describes CBT techniques.",
    renderingGuidance: "Use related but incorrect therapy or consultation models. The answer should be a valid model but wrong for the described techniques.",
    feedbackExplanation: "While this is a valid model, it doesn't match the specific techniques or approaches described in the question.",
    applicableSkillTypes: ["definition", "recognition"]
  },

  "instruction-only": {
    patternId: "instruction-only",
    name: "Instruction Only",
    description: "Using only instruction without practice or modeling",
    logicTransform: "Select an approach that uses only instruction without the necessary practice, modeling, or feedback components.",
    renderingGuidance: "Use answers that focus solely on instruction or explanation without including practice, modeling, or feedback.",
    feedbackExplanation: "Effective skill teaching requires more than instruction alone. Modeling, practice, and feedback are essential components.",
    applicableSkillTypes: ["best-selection", "scenario"]
  },

  "adult-criteria": {
    patternId: "adult-criteria",
    name: "Adult Criteria",
    description: "Applying adult diagnostic criteria to children",
    logicTransform: "Select adult diagnostic criteria or symptoms that don't account for developmental variations in children.",
    renderingGuidance: "Use adult-focused diagnostic criteria or symptoms that don't reflect developmental variations.",
    feedbackExplanation: "Child psychopathology often presents differently than adult psychopathology. Developmental variations must be considered.",
    applicableSkillTypes: ["characteristic-identification", "recognition"]
  },

  "inclusion-error": {
    patternId: "inclusion-error",
    name: "Inclusion Error",
    description: "Including inappropriate candidates or excluding appropriate ones",
    logicTransform: "Select candidates that should be excluded or exclude candidates that should be included.",
    renderingGuidance: "Use answers that include contraindicated candidates or exclude appropriate ones.",
    feedbackExplanation: "This answer doesn't match the appropriate inclusion/exclusion criteria for this situation.",
    applicableSkillTypes: ["best-selection", "scenario"]
  },

  "optimal-education": {
    patternId: "optimal-education",
    name: "Optimal Education",
    description: "Confusing FAPE with optimal or best possible education",
    logicTransform: "Select answers that describe optimal or best possible education rather than appropriate education.",
    renderingGuidance: "Use language that implies 'best possible' or 'optimal' education rather than 'appropriate'.",
    feedbackExplanation: "FAPE requires appropriate education, not optimal or best possible education.",
    applicableSkillTypes: ["legal-ethical", "definition"]
  },

  "general-concerns": {
    patternId: "general-concerns",
    name: "General Concerns",
    description: "Breaching confidentiality for general concerns rather than imminent danger",
    logicTransform: "Select answers that breach confidentiality for general concerns rather than specific imminent danger.",
    renderingGuidance: "Use answers that describe breaching confidentiality for general concerns or non-imminent situations.",
    feedbackExplanation: "Confidentiality should only be breached for imminent danger to self or others, not general concerns.",
    applicableSkillTypes: ["legal-ethical", "condition-identification"]
  },

  "investigation": {
    patternId: "investigation",
    name: "Investigation",
    description: "Investigating abuse instead of reporting",
    logicTransform: "Select answers that involve investigating abuse rather than immediately reporting to CPS.",
    renderingGuidance: "Use answers that describe investigating, gathering evidence, or verifying abuse before reporting.",
    feedbackExplanation: "The legal duty is to report suspected abuse immediately to CPS, not to investigate first.",
    applicableSkillTypes: ["legal-ethical", "duty-identification"]
  },

  "delay": {
    patternId: "delay",
    name: "Delay",
    description: "Delaying immediate action when immediate action is required",
    logicTransform: "Select answers that delay immediate action. Examples: 'Schedule assessment next week' when immediate assessment is needed, 'Wait and see' when immediate intervention is required.",
    renderingGuidance: "Use answers that involve waiting, scheduling later, or delaying action.",
    feedbackExplanation: "Some situations require immediate action and cannot be delayed.",
    applicableSkillTypes: ["first-step", "scenario"]
  },

  "punishment-focus": {
    patternId: "punishment-focus",
    name: "Punishment Focus",
    description: "Focusing on punishment rather than understanding cause",
    logicTransform: "Select answers that focus on punishment or discipline rather than understanding the cause or purpose of the process.",
    renderingGuidance: "Use answers that emphasize punishment, discipline, or consequences rather than understanding or determining cause.",
    feedbackExplanation: "This process is about understanding cause, not about punishment or discipline.",
    applicableSkillTypes: ["purpose-identification", "scenario"]
  },

  "absolute-rules": {
    patternId: "absolute-rules",
    name: "Absolute Rules",
    description: "Applying absolute rules without considering context",
    logicTransform: "Select answers that apply absolute rules without considering cultural or contextual factors.",
    renderingGuidance: "Use answers that apply rules absolutely without considering context or exceptions.",
    feedbackExplanation: "Ethical decision-making requires considering context and cultural factors, not applying absolute rules.",
    applicableSkillTypes: ["ethical-resolution", "scenario"]
  },

  "law-confusion": {
    patternId: "law-confusion",
    name: "Law Confusion",
    description: "Confusing different laws or legal requirements",
    logicTransform: "Select related but incorrect laws or legal requirements. Examples: 'IDEA' when question asks about Section 504, 'FERPA' when question asks about IDEA.",
    renderingGuidance: "Use related but incorrect laws or legal frameworks. The answer should be a valid law but wrong for the specific requirement described.",
    feedbackExplanation: "While this is a valid law, it doesn't match the specific legal requirement or distinction described in the question.",
    applicableSkillTypes: ["legal-ethical", "distinction"]
  },

  "no-access": {
    patternId: "no-access",
    name: "No Access",
    description: "Denying access without legal basis",
    logicTransform: "Select answers that deny access to records or information without proper legal basis.",
    renderingGuidance: "Use answers that deny access, restrict access, or limit rights without legal justification.",
    feedbackExplanation: "Parents generally have rights to access records unless there is a specific legal basis to deny access.",
    applicableSkillTypes: ["legal-ethical", "rights-identification"]
  },

  "insufficient-hours": {
    patternId: "insufficient-hours",
    name: "Insufficient Hours",
    description: "Providing insufficient supervision hours or requirements",
    logicTransform: "Select answers that provide less than the required hours or standards.",
    renderingGuidance: "Use answers that describe less than required hours, lower standards, or insufficient requirements.",
    feedbackExplanation: "NASP and professional standards specify minimum requirements that must be met.",
    applicableSkillTypes: ["legal-ethical", "standard-identification"]
  },

  "full-release": {
    patternId: "full-release",
    name: "Full Release",
    description: "Releasing test protocols without restrictions",
    logicTransform: "Select answers that allow full release or copying of test protocols without restrictions.",
    renderingGuidance: "Use answers that allow unrestricted copying, full release, or unlimited access to test protocols.",
    feedbackExplanation: "Test security and copyright laws require balancing parent rights with protection of test materials. Full release may violate test security.",
    applicableSkillTypes: ["legal-ethical", "balance-resolution"]
  }
};

// Helper function to get patterns applicable to a skill category
export function getPatternsForSkillType(skillType: SkillCategory): DistractorPattern[] {
  return Object.values(DISTRACTOR_PATTERNS).filter(pattern =>
    pattern.applicableSkillTypes.includes(skillType)
  );
}

// Helper function to get a pattern by ID
export function getPatternById(patternId: PatternId): DistractorPattern | null {
  return DISTRACTOR_PATTERNS[patternId] || null;
}
