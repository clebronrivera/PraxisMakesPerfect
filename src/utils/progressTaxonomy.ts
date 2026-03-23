// src/utils/progressTaxonomy.ts
// Canonical domain and skill definitions used by the Progress page and all
// proficiency-tracking surfaces.  Covers all 4 Praxis 5403 domains and every
// testable skill (IDs match skill-map.ts and Supabase skill_scores columns).

export type PraxisDomainId = 1 | 2 | 3 | 4;

export interface ProgressDomainDefinition {
  id: PraxisDomainId;
  name: string;
  shortName: string;
  subtitle: string;
}

export interface ProgressSkillDefinition {
  skillId: string;
  shortLabel: string;
  fullLabel: string;
  domainId: PraxisDomainId;
}

export const PROGRESS_DOMAINS: ProgressDomainDefinition[] = [
  {
    id: 1,
    name: 'Professional Practices',
    shortName: 'Professional',
    subtitle: 'Assessment, consultation, and data-based decision making'
  },
  {
    id: 2,
    name: 'Student-Level Services',
    shortName: 'Student-Level',
    subtitle: 'Academic, developmental, and mental health supports'
  },
  {
    id: 3,
    name: 'Systems-Level Services',
    shortName: 'Systems-Level',
    subtitle: 'Family, schoolwide, and systems practice'
  },
  {
    id: 4,
    name: 'Foundations of School Psychology',
    shortName: 'Foundations',
    subtitle: 'Ethics, law, diversity, and research'
  }
];

export const PROGRESS_SKILLS: ProgressSkillDefinition[] = [
  { skillId: 'CON-01', shortLabel: 'Consultation Models', fullLabel: 'Consultation Models and Methods', domainId: 1 },
  { skillId: 'DBD-01', shortLabel: 'RIOT Framework', fullLabel: 'RIOT Framework and Multi-Method Information Gathering', domainId: 1 },
  { skillId: 'DBD-03', shortLabel: 'Cognitive Assessment', fullLabel: 'Cognitive and Intellectual Assessment', domainId: 1 },
  { skillId: 'DBD-05', shortLabel: 'Processing Measures', fullLabel: 'Diagnostic and Processing Measures', domainId: 1 },
  { skillId: 'DBD-06', shortLabel: 'Behavioral Assessment', fullLabel: 'Emotional and Behavioral Assessment Instruments', domainId: 1 },
  { skillId: 'DBD-07', shortLabel: 'FBA', fullLabel: 'Functional Behavioral Assessment', domainId: 1 },
  { skillId: 'DBD-08', shortLabel: 'Progress Monitoring', fullLabel: 'Curriculum-Based Measurement and Progress Monitoring', domainId: 1 },
  { skillId: 'DBD-09', shortLabel: 'Ecological Assessment', fullLabel: 'Ecological Assessment and Contextual Factors', domainId: 1 },
  { skillId: 'DBD-10', shortLabel: 'Records Review', fullLabel: 'Background Information and Records Review', domainId: 1 },
  { skillId: 'PSY-01', shortLabel: 'Score Interpretation', fullLabel: 'Test Scores, Norms, and Interpretation', domainId: 1 },
  { skillId: 'PSY-02', shortLabel: 'Reliability and Validity', fullLabel: 'Reliability and Validity Principles', domainId: 1 },
  { skillId: 'PSY-03', shortLabel: 'MTSS in Assessment', fullLabel: 'Problem-Solving Framework and MTSS in Assessment', domainId: 1 },
  { skillId: 'PSY-04', shortLabel: 'CLD Assessment', fullLabel: 'Assessment of Culturally and Linguistically Diverse Students', domainId: 1 },

  { skillId: 'ACA-02', shortLabel: 'Accommodations', fullLabel: 'Curricular Accommodations and Modifications', domainId: 2 },
  { skillId: 'ACA-03', shortLabel: 'Study Skills', fullLabel: 'Self-Regulated Learning, Metacognition, and Study Skills', domainId: 2 },
  { skillId: 'ACA-04', shortLabel: 'Instructional Strategies', fullLabel: 'Instructional Strategies and Effective Pedagogy', domainId: 2 },
  { skillId: 'ACA-06', shortLabel: 'Learning Theory', fullLabel: 'Learning Theories and Cognitive Development', domainId: 2 },
  { skillId: 'ACA-07', shortLabel: 'Language and Literacy', fullLabel: 'Language Development and Literacy', domainId: 2 },
  { skillId: 'ACA-08', shortLabel: 'Executive Function', fullLabel: 'Cognitive Processes and Executive Functioning', domainId: 2 },
  { skillId: 'ACA-09', shortLabel: 'Health Impact', fullLabel: 'Health Conditions and Educational Impact', domainId: 2 },
  { skillId: 'DEV-01', shortLabel: 'Development', fullLabel: 'Child and Adolescent Development (Erikson, Piaget, Developmental Milestones)', domainId: 2 },
  { skillId: 'MBH-02', shortLabel: 'Counseling Supports', fullLabel: 'Individual and Group Counseling Interventions', domainId: 2 },
  { skillId: 'MBH-03', shortLabel: 'Intervention Models', fullLabel: 'Theoretical Models of Intervention (CBT, ABA, Solution-Focused)', domainId: 2 },
  { skillId: 'MBH-04', shortLabel: 'Psychopathology', fullLabel: 'Child and Adolescent Psychopathology', domainId: 2 },
  { skillId: 'MBH-05', shortLabel: 'Biological Bases', fullLabel: 'Biological Bases of Behavior and Mental Health', domainId: 2 },

  { skillId: 'FAM-02', shortLabel: 'Family Advocacy', fullLabel: 'Family Involvement and Advocacy', domainId: 3 },
  { skillId: 'FAM-03', shortLabel: 'Interagency Collaboration', fullLabel: 'Interagency Collaboration', domainId: 3 },
  { skillId: 'SAF-01', shortLabel: 'Schoolwide Prevention', fullLabel: 'Schoolwide Prevention Practices (PBIS, Bullying, School Climate)', domainId: 3 },
  { skillId: 'SAF-03', shortLabel: 'Threat Assessment', fullLabel: 'Crisis and Threat Assessment', domainId: 3 },
  { skillId: 'SAF-04', shortLabel: 'Crisis Response', fullLabel: 'Crisis Prevention, Intervention, Response, and Recovery', domainId: 3 },
  { skillId: 'SWP-02', shortLabel: 'Policy and Practice', fullLabel: 'Educational Policy and Practice (Retention, Promotion, Tracking)', domainId: 3 },
  { skillId: 'SWP-03', shortLabel: 'Schoolwide Practices', fullLabel: 'Evidence-Based Schoolwide Practices', domainId: 3 },
  { skillId: 'SWP-04', shortLabel: 'Systems MTSS', fullLabel: 'Multi-Tiered Systems of Support (MTSS) at Systems Level', domainId: 3 },

  { skillId: 'DIV-01', shortLabel: 'Cultural Factors', fullLabel: 'Cultural and Individual Factors in Intervention Design', domainId: 4 },
  { skillId: 'DIV-03', shortLabel: 'Bias in Decisions', fullLabel: 'Implicit and Explicit Bias in Decision Making', domainId: 4 },
  { skillId: 'DIV-05', shortLabel: 'Diverse Needs', fullLabel: 'Special Education Services and Diverse Needs', domainId: 4 },
  { skillId: 'ETH-01', shortLabel: 'Ethical Problem-Solving', fullLabel: 'NASP Ethics and Ethical Problem-Solving', domainId: 4 },
  { skillId: 'ETH-02', shortLabel: 'Liability and Supervision', fullLabel: 'Professional Liability and Supervision', domainId: 4 },
  { skillId: 'ETH-03', shortLabel: 'Advocacy and Growth', fullLabel: 'Advocacy, Lifelong Learning, and Professional Growth', domainId: 4 },
  { skillId: 'LEG-01', shortLabel: 'FERPA', fullLabel: 'FERPA and Educational Records Confidentiality', domainId: 4 },
  { skillId: 'LEG-02', shortLabel: 'IDEA', fullLabel: 'IDEA and Special Education Law', domainId: 4 },
  { skillId: 'LEG-03', shortLabel: 'Section 504 and ADA', fullLabel: 'Section 504 and ADA Protections', domainId: 4 },
  { skillId: 'LEG-04', shortLabel: 'Case Law', fullLabel: 'Case Law and Student Rights', domainId: 4 },
  { skillId: 'RES-02', shortLabel: 'Research to Practice', fullLabel: 'Applying Research to Practice', domainId: 4 },
  { skillId: 'RES-03', shortLabel: 'Research Design', fullLabel: 'Research Designs and Basic Statistics', domainId: 4 }
];

export const PROGRESS_DOMAIN_LOOKUP = Object.fromEntries(
  PROGRESS_DOMAINS.map((domain) => [domain.id, domain])
) as Record<PraxisDomainId, ProgressDomainDefinition>;

export const PROGRESS_SKILL_LOOKUP = Object.fromEntries(
  PROGRESS_SKILLS.map((skill) => [skill.skillId, skill])
) as Record<string, ProgressSkillDefinition>;

export function getProgressDomainDefinition(domainId: number): ProgressDomainDefinition | null {
  return PROGRESS_DOMAIN_LOOKUP[domainId as PraxisDomainId] || null;
}

export function getProgressSkillDefinition(skillId?: string | null): ProgressSkillDefinition | null {
  if (!skillId) {
    return null;
  }

  return PROGRESS_SKILL_LOOKUP[skillId] || null;
}

export function getProgressSkillsForDomain(domainId: number): ProgressSkillDefinition[] {
  return PROGRESS_SKILLS.filter((skill) => skill.domainId === domainId);
}

export function resolveProgressDomainId(
  skillId?: string | null,
  fallbackDomainId?: number | null
): PraxisDomainId {
  const skill = getProgressSkillDefinition(skillId);
  if (skill) {
    return skill.domainId;
  }

  if (fallbackDomainId && fallbackDomainId >= 1 && fallbackDomainId <= 4) {
    return fallbackDomainId as PraxisDomainId;
  }

  return 1;
}
