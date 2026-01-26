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
    allowedDistractorPatterns: ["context-mismatch"],
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
        possibleValues: ["reading comprehension", "reading fluency", "phonemic awareness", "phonics", "vocabulary", "decoding"]
      }
    },
    correctAnswerLogic: {
      evaluate: (slotValues) => {
        const { reading_component } = slotValues;
        if (reading_component === "reading comprehension") return "Reciprocal teaching or question generation";
        if (reading_component === "reading fluency") return "Repeated readings or timed practice";
        if (reading_component === "phonemic awareness") return "Sound manipulation activities";
        if (reading_component === "phonics") return "Explicit letter-sound instruction";
        if (reading_component === "vocabulary") return "Direct vocabulary instruction and word-learning strategies";
        if (reading_component === "decoding") return "Systematic phonics instruction and word attack strategies";
        return "Evidence-based reading intervention";
      },
      description: "Maps reading component to appropriate intervention"
    },
    allowedDistractorPatterns: ["similar-concept"],
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
    allowedDistractorPatterns: ["similar-concept"],
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
    allowedDistractorPatterns: ["context-mismatch"],
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
    allowedDistractorPatterns: ["similar-concept"],
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
    allowedDistractorPatterns: ["similar-concept"],
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
    allowedDistractorPatterns: ["context-mismatch"],
    keyPrinciple: "Metacognition = thinking about thinking. Strategies include self-monitoring, self-questioning, organization, and study skills.",
    exampleSlotValues: {}
  },

  // ACAD-S01: Intervention Intensity Matching
  {
    templateId: "ACAD-T08",
    skillId: "ACAD-S01",
    templateType: "best-selection",
    stem: "A student has received {intervention_description} for {duration} with {outcome}. The team should:",
    slots: {
      intervention_description: {
        name: "intervention_description",
        description: "What intervention the student received",
        possibleValues: [
          "Tier 2 small-group reading instruction",
          "Tier 3 intensive one-on-one math support",
          "Tier 1 universal classroom strategies"
        ]
      },
      duration: {
        name: "duration",
        description: "How long the intervention has been in place",
        possibleValues: [
          "six weeks",
          "one semester",
          "one school year"
        ]
      },
      outcome: {
        name: "outcome",
        description: "The student's response to intervention",
        possibleValues: [
          "minimal progress",
          "adequate progress",
          "significant improvement"
        ]
      }
    },
    correctAnswerLogic: {
      evaluate: (slotValues) => {
        const { intervention_description, outcome } = slotValues;
        if (outcome === "minimal progress" && intervention_description.includes("Tier 2")) {
          return "Increase intensity to Tier 3";
        }
        if (outcome === "minimal progress" && intervention_description.includes("Tier 3")) {
          return "Consider comprehensive evaluation for special education";
        }
        if (outcome === "adequate progress" || outcome === "significant improvement") {
          return "Maintain current tier level";
        }
        return "Continue monitoring and adjust as needed";
      },
      description: "Match intervention intensity to student response"
    },
    allowedDistractorPatterns: ["context-mismatch", "premature-action"],
    keyPrinciple: "Intervention intensity should match student response: minimal progress requires increased intensity, adequate progress maintains current level, significant improvement may allow reduction.",
    exampleSlotValues: {
      intervention_description: "Tier 2 small-group reading instruction",
      duration: "six weeks",
      outcome: "minimal progress"
    }
  },

  // ACAD-S02: Reading Intervention Selection (Enhanced)
  {
    templateId: "ACAD-T09",
    skillId: "ACAD-S02",
    templateType: "best-selection",
    stem: "Assessment data shows a student struggles with {reading_component}. The most appropriate intervention targets:",
    slots: {
      reading_component: {
        name: "reading_component",
        description: "The specific reading deficit",
        possibleValues: ["phonemic awareness", "fluency", "comprehension", "vocabulary", "decoding"]
      }
    },
    correctAnswerLogic: {
      evaluate: (slotValues) => {
        const { reading_component } = slotValues;
        if (reading_component === "phonemic awareness") return "Sound manipulation and blending activities";
        if (reading_component === "fluency") return "Repeated readings and timed practice";
        if (reading_component === "comprehension") return "Comprehension strategies and question generation";
        if (reading_component === "vocabulary") return "Direct vocabulary instruction and context clues";
        if (reading_component === "decoding") return "Systematic phonics and word attack strategies";
        return "Evidence-based reading intervention";
      },
      description: "Match intervention to specific reading component deficit"
    },
    allowedDistractorPatterns: ["similar-concept", "context-mismatch"],
    keyPrinciple: "Interventions must target the specific reading component deficit: phonemic awareness (sounds), fluency (speed), comprehension (understanding), vocabulary (word knowledge), decoding (word reading).",
    exampleSlotValues: {
      reading_component: "phonemic awareness"
    }
  },

  // NEW-3-MathIntervention: Math Intervention Selection
  {
    templateId: "ACAD-T10",
    skillId: "ACAD-S02",
    templateType: "best-selection",
    stem: "A student demonstrates difficulty with {math_skill}. Which intervention approach is most appropriate?",
    slots: {
      math_skill: {
        name: "math_skill",
        description: "The specific math skill deficit",
        possibleValues: ["number sense", "computation fluency", "problem-solving", "fractions"]
      }
    },
    correctAnswerLogic: {
      evaluate: (slotValues) => {
        const { math_skill } = slotValues;
        if (math_skill === "number sense") return "Concrete manipulatives and number line activities";
        if (math_skill === "computation fluency") return "Timed practice and fact fluency drills";
        if (math_skill === "problem-solving") return "Strategy instruction and word problem analysis";
        if (math_skill === "fractions") return "Visual representations and part-whole relationships";
        return "Evidence-based math intervention";
      },
      description: "Match intervention to specific math skill deficit"
    },
    allowedDistractorPatterns: ["similar-concept", "context-mismatch"],
    keyPrinciple: "Math interventions target specific deficits: number sense (quantity understanding), computation fluency (speed/accuracy), problem-solving (strategies), fractions (part-whole concepts).",
    exampleSlotValues: {
      math_skill: "number sense"
    }
  },

  // NEW-3-AccommodationsModifications: Accommodations & Modifications
  {
    templateId: "ACAD-T10",
    skillId: "NEW-3-AccommodationsModifications",
    templateType: "definition-recognition",
    stem: "A student with {disability_type} needs {support_type}. This is an example of:",
    slots: {
      disability_type: {
        name: "disability_type",
        description: "Type of disability",
        possibleValues: [
          "a learning disability",
          "ADHD",
          "a physical disability",
          "a sensory impairment"
        ]
      },
      support_type: {
        name: "support_type",
        description: "Type of support needed",
        possibleValues: [
          "extended time on tests",
          "a reduced assignment load",
          "assistive technology for writing",
          "tests read aloud"
        ]
      }
    },
    correctAnswerLogic: {
      evaluate: (slotValues) => {
        const { support_type } = slotValues;
        if (support_type.includes("reduced assignment") || support_type.includes("modified content")) {
          return "A modification (changes what the student learns)";
        }
        return "An accommodation (changes how the student accesses the curriculum)";
      },
      description: "Distinguishes accommodations from modifications"
    },
    allowedDistractorPatterns: ["similar-concept", "context-mismatch"],
    keyPrinciple: "Accommodation = changes HOW (extended time, read aloud, assistive technology). Modification = changes WHAT (reduced content, altered standards).",
    exampleSlotValues: {
      disability_type: "a learning disability",
      support_type: "extended time on tests"
    }
  },
  {
    templateId: "ACAD-T13",
    skillId: "NEW-3-AccommodationsModifications",
    templateType: "best-selection",
    stem: "A school psychologist is developing an IEP for a student with {disability_type}. The student struggles with {academic_area}. Which accommodation is most appropriate?",
    slots: {
      disability_type: {
        name: "disability_type",
        description: "Type of disability",
        possibleValues: [
          "dyslexia",
          "ADHD",
          "dysgraphia",
          "a visual impairment"
        ]
      },
      academic_area: {
        name: "academic_area",
        description: "Academic area of difficulty",
        possibleValues: [
          "reading comprehension",
          "written expression",
          "sustained attention during tests",
          "accessing written materials"
        ]
      }
    },
    correctAnswerLogic: {
      evaluate: (slotValues) => {
        const { disability_type, academic_area } = slotValues;
        if (disability_type === "dyslexia" && academic_area === "reading comprehension") {
          return "Text-to-speech software and extended time";
        }
        if (disability_type === "dysgraphia" && academic_area === "written expression") {
          return "Speech-to-text software or scribe";
        }
        if (disability_type === "ADHD" && academic_area === "sustained attention during tests") {
          return "Separate testing location and extended time";
        }
        if (disability_type === "a visual impairment" && academic_area === "accessing written materials") {
          return "Large print materials or screen reader";
        }
        return "Appropriate assistive technology or format change";
      },
      description: "Matches accommodation to specific disability and academic need"
    },
    allowedDistractorPatterns: ["similar-concept", "context-mismatch", "function-confusion"],
    keyPrinciple: "Accommodations must match the specific disability and academic need. IEP accommodations change HOW students access curriculum without changing content standards. Common accommodations: extended time, assistive technology, format changes, separate setting.",
    exampleSlotValues: {
      disability_type: "dyslexia",
      academic_area: "reading comprehension"
    }
  },
  {
    templateId: "ACAD-T14",
    skillId: "NEW-3-AccommodationsModifications",
    templateType: "best-selection",
    stem: "A student with a 504 plan requires accommodations for {challenge_type}. The school psychologist recommends {accommodation_type}. This accommodation is appropriate because it:",
    slots: {
      challenge_type: {
        name: "challenge_type",
        description: "Type of challenge",
        possibleValues: [
          "test anxiety",
          "executive functioning difficulties",
          "fine motor difficulties",
          "processing speed deficits"
        ]
      },
      accommodation_type: {
        name: "accommodation_type",
        description: "Type of accommodation",
        possibleValues: [
          "extended time and separate testing location",
          "graphic organizers and checklists",
          "use of a computer for written work",
          "reduced number of problems with same time limit"
        ]
      }
    },
    correctAnswerLogic: {
      evaluate: (slotValues) => {
        const { challenge_type, accommodation_type } = slotValues;
        if (challenge_type === "test anxiety" && accommodation_type.includes("extended time")) {
          return "Provides additional time to manage anxiety without changing content standards";
        }
        if (challenge_type === "executive functioning difficulties" && accommodation_type.includes("graphic organizers")) {
          return "Supports organization and planning without altering curriculum";
        }
        if (challenge_type === "fine motor difficulties" && accommodation_type.includes("computer")) {
          return "Changes the method of response without changing what is learned";
        }
        if (challenge_type === "processing speed deficits" && accommodation_type.includes("reduced number")) {
          return "Allows demonstration of knowledge without time pressure, but note: reducing problems may be a modification";
        }
        return "Changes how the student accesses or demonstrates learning without changing content standards";
      },
      description: "Explains why accommodation is appropriate for 504 plan"
    },
    allowedDistractorPatterns: ["similar-concept", "law-confusion", "context-mismatch"],
    keyPrinciple: "504 accommodations change HOW students access education. Accommodations maintain grade-level standards while providing access. Modifications change WHAT students learn. 504 plans focus on accommodations, not modifications.",
    exampleSlotValues: {
      challenge_type: "test anxiety",
      accommodation_type: "extended time and separate testing location"
    }
  },

  // NEW-3-AcademicProgressFactors: Factors Related to Academic Progress
  {
    templateId: "ACAD-T11",
    skillId: "NEW-3-AcademicProgressFactors",
    templateType: "best-selection",
    stem: "A student's academic progress is influenced by {factor_category}. Which factor is most likely to impact achievement?",
    slots: {
      factor_category: {
        name: "factor_category",
        description: "Category of factors",
        possibleValues: [
          "classroom factors",
          "family factors",
          "socioeconomic factors",
          "environmental factors"
        ]
      }
    },
    correctAnswerLogic: {
      evaluate: (slotValues) => {
        const { factor_category } = slotValues;
        if (factor_category === "classroom factors") {
          return "Classroom climate and teacher-student relationships";
        }
        if (factor_category === "family factors") {
          return "Family involvement and home-school partnership";
        }
        if (factor_category === "socioeconomic factors") {
          return "Access to resources and stability";
        }
        return "Home environment and community resources";
      },
      description: "Identifies key factors affecting academic progress"
    },
    allowedDistractorPatterns: ["similar-concept", "context-mismatch"],
    keyPrinciple: "Academic progress is influenced by multiple factors: classroom climate, family involvement, socioeconomic resources, and environmental stability. All factors interact to affect achievement.",
    exampleSlotValues: {
      factor_category: "classroom factors"
    }
  },

  // NEW-3-BioCulturalInfluences: Biological, Cultural, and Social Influences
  {
    templateId: "ACAD-T12",
    skillId: "NEW-3-BioCulturalInfluences",
    templateType: "best-selection",
    stem: "A student's academic performance is affected by {influence_type}. Which consideration is most important?",
    slots: {
      influence_type: {
        name: "influence_type",
        description: "Type of influence",
        possibleValues: [
          "developmental readiness",
          "cultural background",
          "social relationships",
          "multiple interacting factors"
        ]
      }
    },
    correctAnswerLogic: {
      evaluate: (slotValues) => {
        const { influence_type } = slotValues;
        if (influence_type === "developmental readiness") {
          return "Cognitive development and readiness for academic tasks";
        }
        if (influence_type === "cultural background") {
          return "Cultural learning styles, values, and communication patterns";
        }
        if (influence_type === "social relationships") {
          return "Peer relationships and family structure";
        }
        return "The interaction of biological, cultural, and social factors";
      },
      description: "Recognizes different types of influences on academic performance"
    },
    allowedDistractorPatterns: ["similar-concept", "context-mismatch"],
    keyPrinciple: "Academic performance is influenced by biological factors (developmental readiness, cognitive development), cultural factors (learning styles, values), and social factors (peer relationships, family structure). These factors interact and affect how students learn.",
    exampleSlotValues: {
      influence_type: "developmental readiness"
    }
  }
];

export const domain3TemplateMap: Record<string, QuestionTemplate> = {};
domain3Templates.forEach(template => {
  domain3TemplateMap[template.templateId] = template;
});
