// Domain 10 Templates - Question generation templates for Legal, Ethical & Professional Practice skills

import { QuestionTemplate } from '../template-schema';

export const domain10Templates: QuestionTemplate[] = [
  // LEG-S01: Landmark Cases
  {
    templateId: "LEG-T01",
    skillId: "LEG-S01",
    templateType: "case-identification",
    stem: "The case that established the duty to warn/protect when a client makes a specific threat is:",
    slots: {},
    correctAnswerLogic: {
      evaluate: () => {
        return "Tarasoff";
      },
      description: "Tarasoff case"
    },
    allowedDistractorPatterns: ["case-confusion"],
    keyPrinciple: "Tarasoff = duty to warn/protect when specific threat. Larry P. = banned IQ tests for African American placement in CA. Rowley = 'some educational benefit' standard.",
    exampleSlotValues: {}
  },

  // LEG-S02: FAPE Requirements
  {
    templateId: "LEG-T02",
    skillId: "LEG-S02",
    templateType: "definition-recognition",
    stem: "The primary requirement of FAPE (Free Appropriate Public Education) under IDEA is:",
    slots: {},
    correctAnswerLogic: {
      evaluate: () => {
        return "Special education and related services provided at public expense";
      },
      description: "FAPE requirement"
    },
    allowedDistractorPatterns: ["optimal-education"],
    keyPrinciple: "FAPE = special education and related services provided at public expense, meet state standards, provided in conformity with IEP. Not optimal education.",
    exampleSlotValues: {}
  },

  // LEG-S03: Confidentiality Breach
  {
    templateId: "LEG-T03",
    skillId: "LEG-S03",
    templateType: "condition-identification",
    stem: "It is appropriate to breach confidentiality when:",
    slots: {},
    correctAnswerLogic: {
      evaluate: () => {
        return "There is imminent danger to self or others";
      },
      description: "Confidentiality breach conditions"
    },
    allowedDistractorPatterns: ["general-concerns"],
    keyPrinciple: "Breach confidentiality when: imminent danger to self/others, child abuse, court order. Not for general concerns.",
    exampleSlotValues: {}
  },

  // LEG-S04: Mandated Reporting
  {
    templateId: "LEG-T04",
    skillId: "LEG-S04",
    templateType: "duty-identification",
    stem: "When a child reveals abuse, the psychologist's immediate legal duty is to:",
    slots: {},
    correctAnswerLogic: {
      evaluate: () => {
        return "Report to CPS immediately, not investigate";
      },
      description: "Mandated reporting duty"
    },
    allowedDistractorPatterns: ["investigation", "delay"],
    keyPrinciple: "Legal duty = report suspected abuse to CPS immediately. Do NOT investigate. Report based on reasonable suspicion, not proof.",
    exampleSlotValues: {}
  },

  // LEG-S05: Manifestation Determination
  {
    templateId: "LEG-T05",
    skillId: "LEG-S05",
    templateType: "purpose-identification",
    stem: "The purpose of a Manifestation Determination Review (MDR) is to:",
    slots: {},
    correctAnswerLogic: {
      evaluate: () => {
        return "Decide if the conduct was caused by the disability";
      },
      description: "MDR purpose"
    },
    allowedDistractorPatterns: ["punishment-focus"],
    keyPrinciple: "MDR purpose = determine if conduct was caused by disability. If yes, cannot change placement. If no, can apply same discipline.",
    exampleSlotValues: {}
  },

  // LEG-S06: Ethical Dilemmas
  {
    templateId: "LEG-T06",
    skillId: "LEG-S06",
    templateType: "ethical-resolution",
    stem: "When considering whether to accept a gift from a parent, the psychologist should:",
    slots: {},
    correctAnswerLogic: {
      evaluate: () => {
        return "Consider cultural context while evaluating potential conflict of interest";
      },
      description: "Ethical resolution considers context"
    },
    allowedDistractorPatterns: ["absolute-rules"],
    keyPrinciple: "Ethical resolution = consider cultural context, avoid conflicts of interest, prioritize student welfare, consult when uncertain.",
    exampleSlotValues: {}
  },

  // NEW-10-EducationLaw: Section 504 vs. IDEA
  {
    templateId: "LEG-T07",
    skillId: "NEW-10-EducationLaw",
    templateType: "distinction",
    stem: "The key difference between Section 504 and IDEA is:",
    slots: {},
    correctAnswerLogic: {
      evaluate: () => {
        return "Section 504 is about civil rights/access, while IDEA provides educational benefit/specialized instruction";
      },
      description: "504 vs IDEA distinction"
    },
    allowedDistractorPatterns: ["law-confusion"],
    keyPrinciple: "Section 504 = Civil Rights/Access. IDEA = Educational Benefit/Specialized Instruction. Different purposes and requirements.",
    exampleSlotValues: {}
  },

  // NEW-10-RecordKeeping: FERPA & Record Access
  {
    templateId: "LEG-T08",
    skillId: "NEW-10-RecordKeeping",
    templateType: "rights-identification",
    stem: "Under FERPA, non-custodial parents generally have:",
    slots: {},
    correctAnswerLogic: {
      evaluate: () => {
        return "Access to student records unless a court order states otherwise";
      },
      description: "FERPA non-custodial parent rights"
    },
    allowedDistractorPatterns: ["no-access"],
    keyPrinciple: "FERPA upholds parent rights to access records. Non-custodial parents have access unless specific legal revocation exists.",
    exampleSlotValues: {}
  },

  // NEW-10-Supervision: Supervision Standards
  {
    templateId: "LEG-T09",
    skillId: "NEW-10-Supervision",
    templateType: "standard-identification",
    stem: "NASP standards require school psychology interns to receive:",
    slots: {},
    correctAnswerLogic: {
      evaluate: () => {
        return "At least 2 hours of face-to-face supervision per week by a credentialed psychologist";
      },
      description: "NASP supervision standards"
    },
    allowedDistractorPatterns: ["insufficient-hours"],
    keyPrinciple: "NASP standards = specific hours (e.g., 2 hours face-to-face), qualified supervisor, regular supervision. Know specific requirements.",
    exampleSlotValues: {}
  },

  // NEW-10-TestSecurity: Test Security & Copyright
  {
    templateId: "LEG-T10",
    skillId: "NEW-10-TestSecurity",
    templateType: "balance-resolution",
    stem: "When a parent requests to see test protocols, the psychologist should:",
    slots: {},
    correctAnswerLogic: {
      evaluate: () => {
        return "Allow viewing and explanation but prohibit copying or releasing protocols to unqualified persons";
      },
      description: "Balance parent rights with test security"
    },
    allowedDistractorPatterns: ["full-release", "no-access"],
    keyPrinciple: "Balance parent rights to inspect records with test security. Allow viewing/explanation but prohibit copying or releasing raw protocols.",
    exampleSlotValues: {}
  },

  // LEG-S07: Informed Consent Requirements
  {
    templateId: "LEG-T11",
    skillId: "LEG-S07",
    templateType: "consent-resolution",
    stem: "A {student_age} student asks to meet with the school psychologist for counseling but only under the condition that the school psychologist does not inform the student's parents. Which of the following is the best course of action?",
    slots: {
      student_age: {
        name: "student_age",
        description: "The age/grade level of the student",
        possibleValues: ["high school", "middle school", "elementary school"]
      }
    },
    correctAnswerLogic: {
      evaluate: () => {
        return "Ensuring that the student is not in danger and informing the student that parental consent is required for ongoing counseling";
      },
      description: "Safety first, then require consent for ongoing services"
    },
    allowedDistractorPatterns: ["no-consent-needed", "refuse-contact", "auto-inform-parents"],
    keyPrinciple: "Ensure student safety first when student requests counseling. Inform student that parental consent is required for ongoing counseling services. Cannot provide ongoing counseling without parental consent, regardless of student age.",
    exampleSlotValues: {
      student_age: "high school"
    }
  },

  // NEW-10-ProfessionalGrowth: Lifelong Learning & Professional Growth
  {
    templateId: "LEG-T15",
    skillId: "NEW-10-ProfessionalGrowth",
    templateType: "best-selection",
    stem: "To maintain professional competence, a school psychologist should:",
    slots: {},
    correctAnswerLogic: {
      evaluate: () => {
        return "Engage in ongoing professional development, stay current with research, and seek supervision when needed";
      },
      description: "Professional growth requires ongoing learning"
    },
    allowedDistractorPatterns: ["similar-concept", "context-mismatch"],
    keyPrinciple: "Professional growth = ongoing learning, staying current with research, continuing education, professional development activities, reading research literature, attending conferences, seeking supervision/consultation. Lifelong learning ensures competence and best practice. Professional growth is essential for maintaining effectiveness.",
    exampleSlotValues: {}
  }
];

export const domain10TemplateMap: Record<string, QuestionTemplate> = {};
domain10Templates.forEach(template => {
  domain10TemplateMap[template.templateId] = template;
});
