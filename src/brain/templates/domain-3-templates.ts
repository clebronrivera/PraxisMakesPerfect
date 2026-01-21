// Domain 3 Templates - Question generation templates for Academic Interventions & Instructional Support skills

import { QuestionTemplate } from '../template-schema';

export const domain3Templates: QuestionTemplate[] = [
  // ACAD-S01: Tier Selection & Intensity
  {
    templateId: "ACAD-T01",
    skillId: "ACAD-S01",
    templateType: "best-selection",
    stem: "A student is performing {performance_level} on benchmark assessments. What tier of support is most appropriate?",
    slots: {
      performance_level: {
        name: "performance_level",
        description: "Student's performance level",
        possibleValues: ["slightly below benchmark", "significantly below benchmark", "at benchmark"]
      }
    },
    correctAnswerLogic: {
      evaluate: (slotValues) => {
        const { performance_level } = slotValues;
        if (performance_level === "slightly below benchmark") return "Tier 2";
        if (performance_level === "significantly below benchmark") return "Tier 3";
        return "Tier 1";
      },
      description: "Maps performance level to appropriate tier"
    },
    allowedDistractorPatterns: ["intensity-mismatch"],
    keyPrinciple: "Tier selection matches intensity to need: Tier 1 = universal, Tier 2 = targeted (slightly below), Tier 3 = intensive (significantly below).",
    exampleSlotValues: {
      performance_level: "slightly below benchmark"
    }
  },

  // ACAD-S02: Reading Intervention Selection
  {
    templateId: "ACAD-T02",
    skillId: "ACAD-S02",
    templateType: "best-selection",
    stem: "A student struggles with {reading_component}. Which intervention is most appropriate?",
    slots: {
      reading_component: {
        name: "reading_component",
        description: "The reading skill deficit",
        possibleValues: ["reading comprehension", "reading fluency", "phonemic awareness", "phonics"]
      }
    },
    correctAnswerLogic: {
      evaluate: (slotValues) => {
        const { reading_component } = slotValues;
        if (reading_component === "reading comprehension") return "Reciprocal teaching or question generation";
        if (reading_component === "reading fluency") return "Repeated readings or timed practice";
        if (reading_component === "phonemic awareness") return "Sound manipulation activities";
        if (reading_component === "phonics") return "Explicit letter-sound instruction";
        return "Evidence-based reading intervention";
      },
      description: "Maps reading component to appropriate intervention"
    },
    allowedDistractorPatterns: ["component-mismatch"],
    keyPrinciple: "Match intervention to specific reading component: comprehension (strategies), fluency (practice), phonemic awareness (sound work), phonics (letter-sound).",
    exampleSlotValues: {
      reading_component: "reading comprehension"
    }
  },

  // ACAD-S03: Error Pattern Analysis
  {
    templateId: "ACAD-T03",
    skillId: "ACAD-S03",
    templateType: "analysis",
    stem: "A student consistently makes errors such as {error_pattern}. This indicates a deficit in which skill?",
    slots: {
      error_pattern: {
        name: "error_pattern",
        description: "The error pattern observed",
        possibleValues: ["confusing 'b' and 'd'", "adding instead of subtracting", "missing vowel sounds"]
      }
    },
    correctAnswerLogic: {
      evaluate: (slotValues) => {
        const { error_pattern } = slotValues;
        if (error_pattern.includes("b and d")) return "Letter discrimination";
        if (error_pattern.includes("adding instead")) return "Operation understanding";
        if (error_pattern.includes("vowel")) return "Phonemic awareness";
        return "Specific skill deficit based on error pattern";
      },
      description: "Maps error pattern to skill deficit"
    },
    allowedDistractorPatterns: ["pattern-mismatch"],
    keyPrinciple: "Error patterns reveal specific skill deficits. Analyze errors before planning instruction.",
    exampleSlotValues: {
      error_pattern: "confusing 'b' and 'd'"
    }
  },

  // ACAD-S04: Fluency Building Strategies
  {
    templateId: "ACAD-T04",
    skillId: "ACAD-S04",
    templateType: "best-selection",
    stem: "A student reads accurately but very slowly. What intervention is most appropriate?",
    slots: {},
    correctAnswerLogic: {
      evaluate: () => {
        return "Repeated readings or timed practice to build fluency";
      },
      description: "Slow but accurate indicates fluency deficit, not accuracy"
    },
    allowedDistractorPatterns: ["accuracy-focus"],
    keyPrinciple: "Fluency = speed + accuracy. When accuracy is high but speed is low, focus on fluency building (repeated readings, timed practice).",
    exampleSlotValues: {}
  },

  // ACAD-S05: Instructional Level Determination
  {
    templateId: "ACAD-T05",
    skillId: "ACAD-S05",
    templateType: "interpretation",
    stem: "A student reads a passage with {accuracy_rate}% accuracy. This indicates which instructional level?",
    slots: {
      accuracy_rate: {
        name: "accuracy_rate",
        description: "The accuracy percentage",
        possibleValues: ["95", "93", "90", "85"]
      }
    },
    correctAnswerLogic: {
      evaluate: (slotValues) => {
        const accuracy = parseInt(slotValues.accuracy_rate);
        if (accuracy >= 95) return "Independent level";
        if (accuracy >= 93) return "Instructional level";
        return "Frustration level";
      },
      description: "Maps accuracy rate to instructional level"
    },
    allowedDistractorPatterns: ["level-confusion"],
    keyPrinciple: "Independent = 95-100%, Instructional = 93-97%, Frustration = below 93% (for decoding; comprehension uses 70-85% threshold).",
    exampleSlotValues: {
      accuracy_rate: "93"
    }
  },

  // NEW-3-InstructionalHierarchy: Instructional Hierarchy Application
  {
    templateId: "ACAD-T06",
    skillId: "NEW-3-InstructionalHierarchy",
    templateType: "best-selection",
    stem: "A student is just learning a new skill and needs immediate feedback. This student is in which stage of learning?",
    slots: {},
    correctAnswerLogic: {
      evaluate: () => {
        return "Acquisition stage";
      },
      description: "Just learning = acquisition stage"
    },
    allowedDistractorPatterns: ["stage-confusion"],
    keyPrinciple: "Acquisition = learning new skill (modeling, accuracy focus). Proficiency = building speed/fluency. Generalization = applying to new settings.",
    exampleSlotValues: {}
  },

  // NEW-3-MetacognitiveStrategies: Metacognitive & Study Skills
  {
    templateId: "ACAD-T07",
    skillId: "NEW-3-MetacognitiveStrategies",
    templateType: "best-selection",
    stem: "A student needs help monitoring their own learning and thinking processes. What strategy is most appropriate?",
    slots: {},
    correctAnswerLogic: {
      evaluate: () => {
        return "Metacognitive strategies such as self-monitoring or self-questioning";
      },
      description: "Monitoring own learning = metacognition"
    },
    allowedDistractorPatterns: ["content-focus"],
    keyPrinciple: "Metacognition = thinking about thinking. Strategies include self-monitoring, self-questioning, organization, and study skills.",
    exampleSlotValues: {}
  }
];

export const domain3TemplateMap: Record<string, QuestionTemplate> = {};
domain3Templates.forEach(template => {
  domain3TemplateMap[template.templateId] = template;
});
