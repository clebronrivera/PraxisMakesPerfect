// Domain 4 Templates - Question generation templates for Mental & Behavioral Health Services skills

import { QuestionTemplate } from '../template-schema';

export const domain4Templates: QuestionTemplate[] = [
  // MBH-S01: ABC Model Understanding
  {
    templateId: "MBH-T01",
    skillId: "MBH-S01",
    templateType: "definition-recognition",
    stem: "In Functional Behavior Assessment, the 'A-B-C' model refers to:",
    slots: {},
    correctAnswerLogic: {
      evaluate: () => {
        return "Antecedent-Behavior-Consequence";
      },
      description: "ABC model definition"
    },
    allowedDistractorPatterns: ["sequence-error"],
    keyPrinciple: "ABC model: Antecedent (what happens before), Behavior (observable action), Consequence (what happens after, maintains behavior).",
    exampleSlotValues: {}
  },

  // MBH-S02: Behavior Function Identification
  {
    templateId: "MBH-T02",
    skillId: "MBH-S02",
    templateType: "analysis",
    stem: "A student engages in disruptive behavior only during {context}, which results in {consequence}. What is the likely function?",
    slots: {
      context: {
        name: "context",
        description: "When behavior occurs",
        possibleValues: ["math worksheets", "group work", "quiet reading time"]
      },
      consequence: {
        name: "consequence",
        description: "What happens after behavior",
        possibleValues: ["being sent out of class", "getting teacher attention", "receiving a preferred item"]
      }
    },
    correctAnswerLogic: {
      evaluate: (slotValues) => {
        const { consequence } = slotValues;
        if (consequence.includes("sent out") || consequence.includes("removed")) return "Escape/Avoidance";
        if (consequence.includes("attention")) return "Attention";
        if (consequence.includes("preferred item")) return "Tangible";
        return "Escape/Avoidance";
      },
      description: "Maps consequence to behavior function"
    },
    allowedDistractorPatterns: ["function-confusion"],
    keyPrinciple: "Function = what maintains behavior. Escape/avoidance = removes task. Attention = gets attention. Tangible = gets item. Sensory = internal stimulation.",
    exampleSlotValues: {
      context: "math worksheets",
      consequence: "being sent out of class"
    }
  },

  // MBH-S03: Replacement Behavior Selection
  {
    templateId: "MBH-T03",
    skillId: "MBH-S03",
    templateType: "best-selection",
    stem: "A student's problem behavior serves an escape function. What is essential for a replacement behavior?",
    slots: {},
    correctAnswerLogic: {
      evaluate: () => {
        return "It must serve the same function (escape) as the problem behavior";
      },
      description: "Replacement behavior must match function"
    },
    allowedDistractorPatterns: ["function-mismatch"],
    keyPrinciple: "Replacement behavior MUST serve the SAME function as problem behavior. It should be easier, more efficient, and socially acceptable.",
    exampleSlotValues: {}
  },

  // MBH-S04: Suicide Risk Assessment
  {
    templateId: "MBH-T04",
    skillId: "MBH-S04",
    templateType: "first-step-scenario",
    stem: "A student expresses suicidal thoughts. What should the school psychologist do first?",
    slots: {},
    correctAnswerLogic: {
      evaluate: () => {
        return "Immediately assess plan, intent, and means";
      },
      description: "Immediate assessment of suicide risk is priority"
    },
    allowedDistractorPatterns: ["delay", "premature-action"],
    keyPrinciple: "Suicide risk requires IMMEDIATE assessment of plan, intent, and means. Never delay. High risk = specific plan + intent + means.",
    exampleSlotValues: {}
  },

  // MBH-S05: Therapy Model Recognition
  {
    templateId: "MBH-T05",
    skillId: "MBH-S05",
    templateType: "definition-recognition",
    stem: "A therapy approach uses the 'Miracle Question' and focuses on solutions rather than problems. This describes:",
    slots: {},
    correctAnswerLogic: {
      evaluate: () => {
        return "Solution-Focused Brief Therapy";
      },
      description: "Miracle Question = SFBT"
    },
    allowedDistractorPatterns: ["model-confusion"],
    keyPrinciple: "CBT = cognitive distortions. SFBT = miracle question, solution-focused. DBT = mindfulness, emotion regulation.",
    exampleSlotValues: {}
  },

  // MBH-S06: Social Skills Training
  {
    templateId: "MBH-T06",
    skillId: "MBH-S06",
    templateType: "best-selection",
    stem: "What is the most effective method to teach social skills?",
    slots: {},
    correctAnswerLogic: {
      evaluate: () => {
        return "Modeling, rehearsal, and feedback";
      },
      description: "Most effective = modeling + practice + feedback"
    },
    allowedDistractorPatterns: ["instruction-only"],
    keyPrinciple: "Social skills require modeling (demonstration), rehearsal (practice), and feedback. Role-play allows practice in safe setting.",
    exampleSlotValues: {}
  },

  // NEW-4-Psychopathology: Child & Adolescent Psychopathology
  {
    templateId: "MBH-T07",
    skillId: "NEW-4-Psychopathology",
    templateType: "characteristic-identification",
    stem: "How does depression in children often differ from depression in adults?",
    slots: {},
    correctAnswerLogic: {
      evaluate: () => {
        return "Children often present with irritability and somatic complaints rather than sadness";
      },
      description: "Child depression has developmental variations"
    },
    allowedDistractorPatterns: ["adult-criteria"],
    keyPrinciple: "Child psychopathology has developmental variations. Depression = irritability in children. ADHD = symptoms in 2+ settings. Know DSM-5 criteria.",
    exampleSlotValues: {}
  },

  // NEW-4-GroupCounseling: Group Counseling Dynamics
  {
    templateId: "MBH-T08",
    skillId: "NEW-4-GroupCounseling",
    templateType: "best-selection",
    stem: "Which student profile is contraindicated for group counseling?",
    slots: {},
    correctAnswerLogic: {
      evaluate: () => {
        return "A student with severe conduct disorder and aggressive behavior";
      },
      description: "Aggressive students are contraindicated for groups"
    },
    allowedDistractorPatterns: ["inclusion-error"],
    keyPrinciple: "Group counseling requires screening. Aggressive students, severe conduct disorders are contraindicated. Groups have stages: forming, storming, norming, performing.",
    exampleSlotValues: {}
  }
];

export const domain4TemplateMap: Record<string, QuestionTemplate> = {};
domain4Templates.forEach(template => {
  domain4TemplateMap[template.templateId] = template;
});
