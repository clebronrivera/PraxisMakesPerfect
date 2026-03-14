export interface Domain {
  id: string; // e.g., '1', '2', '3' or generic ID
  name: string; // e.g., 'Data-Based Decision Making'
  weight?: number; // Optional weight in the assessment
}

export interface Skill {
  id: string; // e.g., 'DBD-01'
  name: string; // e.g., 'RIOT Framework'
  domainId?: string; // Optional link back to Domain
  conceptLabel?: string;
  prerequisites?: string[]; // IDs of prerequisite skills
  prerequisiteReasoning?: string;
}

export interface Option {
  letter: string; // 'A', 'B', 'C', etc.
  text: string;
}

export interface DistractorInfo {
  letter: string;
  tier?: string;
  errorType?: string;
  misconception?: string;
  skillDeficit?: string;
}

export interface Question {
  id: string; // UNIQUEID
  itemFormat: string; // 'Single-Select', etc.
  isMultiSelect: boolean;
  correctAnswerCount: number;
  optionCountExpected: number;
  hasCaseVignette: boolean;
  caseText?: string;
  questionStem: string;
  options: Option[];
  correctAnswers: string[]; // ['A'], or ['A', 'C'] for multi-select
  correctExplanation?: string;
  coreConcept?: string;
  contentLimit?: string;
  domain: number | string; // Numeric ID or name identifier
  domainName: string; // domain_name
  skillId: string; // current_skill_id
  skillName: string; // skill_name
  cognitiveComplexity?: string;
  complexityRationale?: string;
  rationale?: string;
  distractors?: DistractorInfo[];
  isFoundational?: boolean;
}
