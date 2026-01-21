// Domain 2 Templates - Question generation templates for Consultation & Collaboration skills

import { QuestionTemplate } from '../template-schema';

export const domain2Templates: QuestionTemplate[] = [
  // CC-S01: Consultation Type Recognition
  {
    templateId: "CC-T01",
    skillId: "CC-S01",
    templateType: "definition-recognition",
    stem: "A school psychologist is working with {consultation_context}. This is an example of which type of consultation?",
    slots: {
      consultation_context: {
        name: "consultation_context",
        description: "The consultation scenario",
        possibleValues: [
          "a cultural broker to facilitate communication with a family",
          "a teacher to address an individual student's behavior",
          "the principal to implement a school-wide behavior system",
          "both parents and teachers to address home-school collaboration"
        ]
      }
    },
    correctAnswerLogic: {
      evaluate: (slotValues) => {
        const { consultation_context } = slotValues;
        if (consultation_context.includes("cultural broker")) return "Multicultural consultation";
        if (consultation_context.includes("individual student")) return "Behavioral consultation";
        if (consultation_context.includes("school-wide")) return "Organizational consultation";
        if (consultation_context.includes("both parents and teachers") || consultation_context.includes("home-school")) return "Conjoint Behavioral Consultation";
        return "Behavioral consultation";
      },
      description: "Maps consultation context to consultation type"
    },
    allowedDistractorPatterns: ["similar-concept", "context-mismatch"],
    keyPrinciple: "Different consultation types serve different purposes: behavioral (individual), organizational (systems), multicultural (cultural brokers), conjoint (home-school).",
    exampleSlotValues: {
      consultation_context: "a cultural broker to facilitate communication with a family"
    }
  },

  // NEW-2-ConsultationProcess: Consultation Process Knowledge
  {
    templateId: "CC-T02",
    skillId: "NEW-2-ConsultationProcess",
    templateType: "sequence-recognition",
    stem: "What is the first step in establishing a {consultation_type} relationship?",
    slots: {
      consultation_type: {
        name: "consultation_type",
        description: "Type of consultation relationship",
        possibleValues: ["parent consultation", "teacher consultation", "organizational consultation"]
      }
    },
    correctAnswerLogic: {
      evaluate: () => {
        return "Establishing mutual goals and building rapport";
      },
      description: "First step is always entry/contracting and establishing goals"
    },
    allowedDistractorPatterns: ["premature-action", "sequence-error"],
    keyPrinciple: "Consultation always begins with entry/contracting: establishing goals, roles, and building rapport before problem-solving.",
    exampleSlotValues: {
      consultation_type: "parent consultation"
    }
  },

  // NEW-2-ProblemSolvingSteps: Problem-Solving Model Application
  {
    templateId: "CC-T03",
    skillId: "NEW-2-ProblemSolvingSteps",
    templateType: "first-step-scenario",
    stem: "A school psychologist is consulting about a student who {problem_description}. What should the psychologist do first?",
    slots: {
      problem_description: {
        name: "problem_description",
        description: "The problem being consulted about",
        possibleValues: [
          "is frequently off-task during math",
          "has difficulty following directions",
          "disrupts class during transitions"
        ]
      }
    },
    correctAnswerLogic: {
      evaluate: () => {
        return "Define the problem by collecting detailed baseline data";
      },
      description: "Always define the problem first before analyzing or intervening"
    },
    allowedDistractorPatterns: ["premature-action", "data-ignorance"],
    keyPrinciple: "Problem-solving models require defining the problem with data before analyzing causes or implementing solutions.",
    exampleSlotValues: {
      problem_description: "is frequently off-task during math"
    }
  },

  // CC-S03: Collaborative Role & Approach
  {
    templateId: "CC-T04",
    skillId: "CC-S03",
    templateType: "best-selection",
    stem: "A school psychologist is working with a teacher who is struggling with {challenge}. What is the most effective approach?",
    slots: {
      challenge: {
        name: "challenge",
        description: "The teacher's challenge",
        possibleValues: ["classroom management", "student engagement", "instructional planning"]
      }
    },
    correctAnswerLogic: {
      evaluate: () => {
        return "Collaborative problem-solving that empowers the teacher";
      },
      description: "Collaborative approach is always most effective, not expert model"
    },
    allowedDistractorPatterns: ["expert-model", "directive-approach"],
    keyPrinciple: "School psychologists serve as facilitators and collaborators, not experts. Collaborative problem-solving empowers teachers.",
    exampleSlotValues: {
      challenge: "classroom management"
    }
  },

  // NEW-2-CommunicationStrategies: Communication & Resistance Management
  {
    templateId: "CC-T05",
    skillId: "NEW-2-CommunicationStrategies",
    templateType: "best-selection",
    stem: "A teacher is resistant to implementing a recommended intervention. What is the best strategy to build rapport?",
    slots: {},
    correctAnswerLogic: {
      evaluate: () => {
        return "Listen actively and acknowledge the teacher's perspective";
      },
      description: "Active listening and empathy build rapport, not directive approaches"
    },
    allowedDistractorPatterns: ["directive-approach", "expert-stance"],
    keyPrinciple: "Resistance is best managed through active listening, empathy, and collaboration rather than directive or expert stances.",
    exampleSlotValues: {}
  }
];

// Export as a map for easy lookup
export const domain2TemplateMap: Record<string, QuestionTemplate> = {};
domain2Templates.forEach(template => {
  domain2TemplateMap[template.templateId] = template;
});
