// Domain 8 Templates - Question generation templates for Diversity in Development & Learning skills

import { QuestionTemplate } from '../template-schema';

export const domain8Templates: QuestionTemplate[] = [
  // DIV-S01: Implicit Bias Recognition
  {
    templateId: "DIV-T01",
    skillId: "DIV-S01",
    templateType: "bias-recognition",
    stem: "A psychologist assumes a student's lack of eye contact indicates defiance rather than considering cultural norms. This demonstrates:",
    slots: {},
    correctAnswerLogic: {
      evaluate: () => {
        return "Implicit cultural bias";
      },
      description: "Bias recognition"
    },
    allowedDistractorPatterns: ["similar-concept"],
    keyPrinciple: "Recognize when assumptions are based on cultural bias. Behavior may be cultural, not defiance. Question assumptions.",
    exampleSlotValues: {}
  },

  // DIV-S02: Nonverbal Assessment Selection
  {
    templateId: "DIV-T02",
    skillId: "DIV-S02",
    templateType: "best-selection",
    stem: "To reduce linguistic bias when assessing an ELL student with limited English proficiency, the psychologist should:",
    slots: {},
    correctAnswerLogic: {
      evaluate: () => {
        return "Use a nonverbal assessment";
      },
      description: "Nonverbal reduces linguistic bias"
    },
    allowedDistractorPatterns: ["context-mismatch", "context-mismatch"],
    keyPrinciple: "For ELL students = use nonverbal assessments, reduce linguistic demands, consider cultural factors. Translation violates standardization.",
    exampleSlotValues: {}
  },

  // DIV-S03: Language Dominance Assessment
  {
    templateId: "DIV-T03",
    skillId: "DIV-S03",
    templateType: "first-step-scenario",
    stem: "Before assessing an ELL student, the psychologist should first:",
    slots: {},
    correctAnswerLogic: {
      evaluate: () => {
        return "Determine language dominance and proficiency in both languages";
      },
      description: "Language assessment comes first"
    },
    allowedDistractorPatterns: ["premature-action"],
    keyPrinciple: "Before assessing ELL student = determine language dominance, proficiency in both languages, primary language, English proficiency level.",
    exampleSlotValues: {}
  },

  // DIV-S04: Disproportionality Interpretation
  {
    templateId: "DIV-T04",
    skillId: "DIV-S04",
    templateType: "interpretation",
    stem: "A risk ratio of 2.5 for a specific racial group in special education indicates:",
    slots: {},
    correctAnswerLogic: {
      evaluate: () => {
        return "Overrepresentation - the group is 2.5 times more likely to be identified";
      },
      description: "Risk ratio interpretation"
    },
    allowedDistractorPatterns: ["similar-concept"],
    keyPrinciple: "Risk ratio > 1.0 = overrepresentation. Risk ratio 2.5 = group is 2.5x more likely. Higher ratio = greater disproportionality.",
    exampleSlotValues: {}
  },

  // DIV-S05: Cultural Broker Role
  {
    templateId: "DIV-T05",
    skillId: "DIV-S05",
    templateType: "definition-recognition",
    stem: "A cultural broker is best defined as:",
    slots: {},
    correctAnswerLogic: {
      evaluate: () => {
        return "A community liaison who bridges the cultural gap between school and family";
      },
      description: "Cultural broker definition"
    },
    allowedDistractorPatterns: ["similar-concept"],
    keyPrinciple: "Cultural broker = community liaison, bridges cultural gap, facilitates communication, understands both cultures. Not just interpreter.",
    exampleSlotValues: {}
  },

  // DIV-S07: Interpreter Best Practices
  {
    templateId: "DIV-T06",
    skillId: "DIV-S07",
    templateType: "best-practice",
    stem: "When using an interpreter during a parent meeting, best practice is to:",
    slots: {},
    correctAnswerLogic: {
      evaluate: () => {
        return "Speak directly to the parent, not the interpreter";
      },
      description: "Interpreter best practice"
    },
    allowedDistractorPatterns: ["context-mismatch"],
    keyPrinciple: "Best practice = speak directly to parent/family, use qualified interpreter, maintain eye contact with parent, allow time for interpretation.",
    exampleSlotValues: {}
  },

  // NEW-8-Acculturation: Acculturation Dynamics
  {
    templateId: "DIV-T07",
    skillId: "NEW-8-Acculturation",
    templateType: "mode-identification",
    stem: "A student adopts new cultural norms while maintaining their original culture. This describes which acculturation mode?",
    slots: {},
    correctAnswerLogic: {
      evaluate: () => {
        return "Integration or Biculturalism";
      },
      description: "Integration = high original + high new culture"
    },
    allowedDistractorPatterns: ["similar-concept", "similar-concept"],
    keyPrinciple: "Acculturation modes: Integration = high original + high new. Assimilation = low original + high new. Separation = high original + low new. Marginalization = low both.",
    exampleSlotValues: {}
  },

  // NEW-8-LanguageAcquisition: Second Language Acquisition
  {
    templateId: "DIV-T08",
    skillId: "NEW-8-LanguageAcquisition",
    templateType: "distinction",
    stem: "The distinction between BICS (Basic Interpersonal Communication Skills) and CALP (Cognitive Academic Language Proficiency) is:",
    slots: {},
    correctAnswerLogic: {
      evaluate: () => {
        return "BICS is social language (2-3 years to acquire), CALP is academic language (5-7 years to acquire)";
      },
      description: "BICS vs CALP distinction"
    },
    allowedDistractorPatterns: ["similar-concept"],
    keyPrinciple: "BICS = social language ('playground English'), 2-3 years. CALP = academic language (cognitive tasks), 5-7 years. Don't confuse social fluency with academic readiness.",
    exampleSlotValues: {}
  },

  // NEW-8-SocialJustice: Social Justice & Advocacy
  {
    templateId: "DIV-T09",
    skillId: "NEW-8-SocialJustice",
    templateType: "role-identification",
    stem: "When observing systemic barriers affecting marginalized groups, the school psychologist's ethical responsibility is to:",
    slots: {},
    correctAnswerLogic: {
      evaluate: () => {
        return "Advocate for social justice and challenge systemic inequities";
      },
      description: "Social justice advocacy role"
    },
    allowedDistractorPatterns: ["context-mismatch"],
    keyPrinciple: "Psychologist's role = challenge systemic inequities, advocate for fair practices, not passive acceptance of discriminatory practices.",
    exampleSlotValues: {}
  },

  // DIV-T10: Assessment Modification for ELL
  {
    templateId: "DIV-T10",
    skillId: "DIV-S02",
    templateType: "best-selection",
    stem: "An ELL student with {language_background} and {proficiency_level} English proficiency needs cognitive assessment. What is the best approach?",
    slots: {
      language_background: {
        name: "language_background",
        description: "Student's primary language",
        possibleValues: [
          "Spanish",
          "Mandarin",
          "Arabic",
          "Vietnamese",
          "Tagalog",
          "French",
          "Portuguese"
        ]
      },
      proficiency_level: {
        name: "proficiency_level",
        description: "English proficiency level",
        possibleValues: [
          "limited",
          "intermediate",
          "advanced",
          "beginner",
          "emerging"
        ]
      }
    },
    correctAnswerLogic: {
      evaluate: (slotValues) => {
        const { proficiency_level } = slotValues;
        if (proficiency_level === "limited" || proficiency_level === "beginner" || proficiency_level === "emerging") {
          return "Use a nonverbal assessment to reduce linguistic bias";
        }
        return "Use nonverbal assessment or reduce linguistic demands";
      },
      description: "Nonverbal assessment for ELL reduces bias"
    },
    allowedDistractorPatterns: ["context-mismatch", "premature-action"],
    keyPrinciple: "For ELL students = use nonverbal assessments, reduce linguistic demands, consider cultural factors. Translation violates standardization.",
    exampleSlotValues: {
      language_background: "Spanish",
      proficiency_level: "limited"
    }
  },

  // DIV-T11: Disproportionality Response
  {
    templateId: "DIV-T11",
    skillId: "DIV-S04",
    templateType: "first-step-scenario",
    stem: "Data analysis reveals a risk ratio of {risk_ratio} for {group} in special education identification. What should the school psychologist do first?",
    slots: {
      risk_ratio: {
        name: "risk_ratio",
        description: "Risk ratio value",
        possibleValues: [
          "2.5",
          "1.8",
          "3.0",
          "1.2",
          "2.0",
          "1.5"
        ]
      },
      group: {
        name: "group",
        description: "Affected group",
        possibleValues: [
          "African American students",
          "Hispanic students",
          "students with disabilities",
          "English Language Learners",
          "students from low-income backgrounds"
        ]
      }
    },
    correctAnswerLogic: {
      evaluate: (slotValues) => {
        const { risk_ratio } = slotValues;
        const ratio = parseFloat(risk_ratio);
        if (ratio > 2.0) {
          return "Investigate root causes of disproportionality through data review";
        }
        return "Review assessment practices and referral patterns for bias";
      },
      description: "Disproportionality requires investigation"
    },
    allowedDistractorPatterns: ["premature-action", "data-ignorance"],
    keyPrinciple: "Risk ratio > 1.0 = overrepresentation. Risk ratio 2.5 = group is 2.5x more likely. Higher ratio = greater disproportionality. Investigate root causes.",
    exampleSlotValues: {
      risk_ratio: "2.5",
      group: "African American students"
    }
  }
];

export const domain8TemplateMap: Record<string, QuestionTemplate> = {};
domain8Templates.forEach(template => {
  domain8TemplateMap[template.templateId] = template;
});
