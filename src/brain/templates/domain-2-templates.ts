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
    allowedDistractorPatterns: ["role-confusion", "premature-action"],
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
    allowedDistractorPatterns: ["premature-action", "role-confusion"],
    keyPrinciple: "Resistance is best managed through active listening, empathy, and collaboration rather than directive or expert stances.",
    exampleSlotValues: {}
  },

  // NEW-2-ConsultationStages: Consultation Stage Identification
  {
    templateId: "CC-T06",
    skillId: "NEW-2-ConsultationProcess",
    templateType: "definition-recognition",
    stem: "A school psychologist is working with a teacher who {teacher_situation}. The psychologist {psychologist_action}. This best represents which stage of consultation?",
    slots: {
      teacher_situation: {
        name: "teacher_situation",
        description: "The teacher's situation or concern",
        possibleValues: [
          "is concerned about a student's behavior",
          "wants to improve classroom engagement",
          "needs help with instructional planning"
        ]
      },
      psychologist_action: {
        name: "psychologist_action",
        description: "What the psychologist is doing",
        possibleValues: [
          "collects baseline data to define the problem",
          "analyzes data to identify the root cause",
          "implements an intervention strategy",
          "evaluates the effectiveness of the intervention"
        ]
      }
    },
    correctAnswerLogic: {
      evaluate: (slotValues) => {
        const { psychologist_action } = slotValues;
        if (psychologist_action.includes("collects baseline") || psychologist_action.includes("define the problem")) {
          return "Problem identification stage";
        }
        if (psychologist_action.includes("analyzes") || psychologist_action.includes("root cause")) {
          return "Problem analysis stage";
        }
        if (psychologist_action.includes("implements") || psychologist_action.includes("intervention strategy")) {
          return "Intervention implementation stage";
        }
        if (psychologist_action.includes("evaluates") || psychologist_action.includes("effectiveness")) {
          return "Evaluation stage";
        }
        return "Problem identification stage";
      },
      description: "Maps psychologist action to consultation stage"
    },
    allowedDistractorPatterns: ["premature-action", "sequence-error"],
    keyPrinciple: "Consultation stages: Problem identification (data collection), Problem analysis (root cause), Intervention (implementation), Evaluation (effectiveness).",
    exampleSlotValues: {
      teacher_situation: "is concerned about a student's behavior",
      psychologist_action: "collects baseline data to define the problem"
    }
  },

  // NEW-2-ResistanceManagement: Resistance Management
  {
    templateId: "CC-T07",
    skillId: "NEW-2-CommunicationStrategies",
    templateType: "best-selection",
    stem: "During consultation, a teacher {resistance_behavior}. The most appropriate response is to:",
    slots: {
      resistance_behavior: {
        name: "resistance_behavior",
        description: "How the teacher is showing resistance",
        possibleValues: [
          "expresses doubt about the recommended intervention",
          "says they don't have time to implement changes",
          "questions the psychologist's expertise",
          "appears defensive about their current approach"
        ]
      }
    },
    correctAnswerLogic: {
      evaluate: () => {
        return "Acknowledge concerns, explore barriers, and collaboratively problem-solve";
      },
      description: "Address resistance through collaboration, not confrontation"
    },
    allowedDistractorPatterns: ["premature-action", "role-confusion"],
    keyPrinciple: "Resistance is best managed through active listening, acknowledging concerns, exploring barriers, and maintaining collaborative relationship. Avoid confrontation or directive approaches.",
    exampleSlotValues: {
      resistance_behavior: "expresses doubt about the recommended intervention"
    }
  },

  // CC-S01: Consultation vs Other Services
  {
    templateId: "CC-T08",
    skillId: "CC-S01",
    templateType: "first-step-scenario",
    stem: "A {referral_source} requests help with {problem}. The school psychologist should first:",
    slots: {
      referral_source: {
        name: "referral_source",
        description: "Who is requesting help",
        possibleValues: [
          "A teacher",
          "A parent",
          "The principal",
          "A school counselor"
        ]
      },
      problem: {
        name: "problem",
        description: "The problem or concern",
        possibleValues: [
          "a student's academic difficulties",
          "classroom management challenges",
          "a student's behavioral concerns",
          "implementing a school-wide program"
        ]
      }
    },
    correctAnswerLogic: {
      evaluate: (slotValues) => {
        const { problem } = slotValues;
        // Determine if consultation or direct service is appropriate
        if (problem.includes("classroom management") || problem.includes("school-wide program")) {
          return "Determine if consultation or direct service is most appropriate based on the situation";
        }
        return "Clarify the specific concern and determine whether consultation or direct service is needed";
      },
      description: "First step is to determine appropriate service type"
    },
    allowedDistractorPatterns: ["premature-action", "role-confusion"],
    keyPrinciple: "School psychologists must determine whether consultation (indirect, collaborative) or direct service (assessment, counseling) is most appropriate for the situation.",
    exampleSlotValues: {
      referral_source: "A teacher",
      problem: "a student's academic difficulties"
    }
  },

  // NEW-2-FamilyCollaboration: Working with Diverse Families
  {
    templateId: "CC-T09",
    skillId: "NEW-2-FamilyCollaboration",
    templateType: "best-selection",
    stem: "A school psychologist is working with a family from {cultural_background} who {family_situation}. What is the most effective strategy?",
    slots: {
      cultural_background: {
        name: "cultural_background",
        description: "Family's cultural background",
        possibleValues: [
          "a collectivist culture",
          "a different cultural background",
          "a diverse cultural background"
        ]
      },
      family_situation: {
        name: "family_situation",
        description: "The family situation or challenge",
        possibleValues: [
          "seems resistant to intervention recommendations",
          "has difficulty attending meetings",
          "expresses concerns about the school's approach",
          "wants to collaborate on an intervention plan"
        ]
      }
    },
    correctAnswerLogic: {
      evaluate: (slotValues) => {
        const { family_situation } = slotValues;
        if (family_situation.includes("resistant") || family_situation.includes("concerns")) {
          return "Build trust by understanding family values and adapting communication styles";
        }
        if (family_situation.includes("difficulty attending")) {
          return "Identify and address barriers to engagement, such as scheduling or transportation";
        }
        return "Involve the family as partners, recognize their strengths, and promote home-school collaboration";
      },
      description: "Strategies emphasize building relationships, cultural responsiveness, and partnership"
    },
    allowedDistractorPatterns: ["similar-concept", "context-mismatch"],
    keyPrinciple: "Working with diverse families requires building trust, respecting cultural differences, involving families as partners, and recognizing family strengths. Avoid one-size-fits-all approaches.",
    exampleSlotValues: {
      cultural_background: "a collectivist culture",
      family_situation: "seems resistant to intervention recommendations"
    }
  },

  // NEW-2-CommunityAgencies: Working with Community Agencies
  {
    templateId: "CC-T10",
    skillId: "NEW-2-CommunityAgencies",
    templateType: "best-selection",
    stem: "A school psychologist needs to coordinate services for a student who {student_needs}. What is the most appropriate approach for working with community agencies?",
    slots: {
      student_needs: {
        name: "student_needs",
        description: "What the student needs",
        possibleValues: [
          "requires mental health services",
          "needs vocational support",
          "would benefit from postsecondary transition planning",
          "needs multiple community services"
        ]
      }
    },
    correctAnswerLogic: {
      evaluate: (slotValues) => {
        const { student_needs } = slotValues;
        if (student_needs.includes("postsecondary")) {
          return "Facilitate interagency collaboration to connect the student with employment and postsecondary education opportunities";
        }
        return "Coordinate services by understanding agency roles, facilitating communication between systems, and ensuring seamless service delivery";
      },
      description: "Emphasizes coordination, understanding roles, and facilitating communication"
    },
    allowedDistractorPatterns: ["similar-concept", "context-mismatch"],
    keyPrinciple: "Working with community agencies requires coordination, understanding agency roles and limitations, facilitating communication between school and community systems, and making appropriate referrals.",
    exampleSlotValues: {
      student_needs: "requires mental health services"
    }
  }
];

// Export as a map for easy lookup
export const domain2TemplateMap: Record<string, QuestionTemplate> = {};
domain2Templates.forEach(template => {
  domain2TemplateMap[template.templateId] = template;
});
