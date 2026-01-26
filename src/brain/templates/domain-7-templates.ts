// Domain 7 Templates - Question generation templates for Family-School Collaboration Services skills

import { QuestionTemplate } from '../template-schema';

export const domain7Templates: QuestionTemplate[] = [
  // FSC-S01: Partnership Goals
  {
    templateId: "FSC-T01",
    skillId: "FSC-S01",
    templateType: "goal-identification",
    stem: "The primary goal of family-school partnerships is:",
    slots: {},
    correctAnswerLogic: {
      evaluate: () => {
        return "Shared responsibility for student learning and success";
      },
      description: "Partnership goal"
    },
    allowedDistractorPatterns: ["context-mismatch"],
    keyPrinciple: "Partnership goal = shared responsibility, collaboration, mutual respect, student success focus. Not one-way communication.",
    exampleSlotValues: {}
  },

  // FSC-S03: Communication Strategies
  {
    templateId: "FSC-T02",
    skillId: "FSC-S03",
    templateType: "best-selection",
    stem: "The best way to present assessment results to parents is:",
    slots: {},
    correctAnswerLogic: {
      evaluate: () => {
        return "Using jargon-free language and focusing on strengths and needs";
      },
      description: "Effective communication with families"
    },
    allowedDistractorPatterns: ["context-mismatch", "context-mismatch"],
    keyPrinciple: "Effective communication = welcoming environment, two-way communication, jargon-free language, focus on strengths and needs, cultural sensitivity.",
    exampleSlotValues: {}
  },

  // FSC-S04: Cultural Competence
  {
    templateId: "FSC-T03",
    skillId: "FSC-S04",
    templateType: "best-selection",
    stem: "When working with a family from a collectivist culture, it is important to:",
    slots: {},
    correctAnswerLogic: {
      evaluate: () => {
        return "Respect the role of extended family members in decision-making";
      },
      description: "Cultural competence with collectivist cultures"
    },
    allowedDistractorPatterns: ["context-mismatch"],
    keyPrinciple: "Cultural competence = respect extended family roles, collectivist decision-making, cultural values, avoid assumptions.",
    exampleSlotValues: {}
  },

  // NEW-7-BarriersToEngagement: Barriers to Engagement
  {
    templateId: "FSC-T04",
    skillId: "NEW-7-BarriersToEngagement",
    templateType: "barrier-identification",
    stem: "The most significant barrier to parental involvement for low-SES families is typically:",
    slots: {},
    correctAnswerLogic: {
      evaluate: () => {
        return "Logistical issues such as transportation and work schedules, not lack of interest";
      },
      description: "Barriers are usually systemic, not attitudinal"
    },
    allowedDistractorPatterns: ["context-mismatch"],
    keyPrinciple: "Barriers to involvement = logistical (transportation, schedules), language, systemic. Not lack of care. Address barriers, don't blame families.",
    exampleSlotValues: {}
  },

  // NEW-7-FamilySystems: Family Systems Theory
  {
    templateId: "FSC-T05",
    skillId: "NEW-7-FamilySystems",
    templateType: "principle-identification",
    stem: "A core concept of Family Systems Theory is:",
    slots: {},
    correctAnswerLogic: {
      evaluate: () => {
        return "Events affecting one family member affect the whole system";
      },
      description: "Family systems interdependence"
    },
    allowedDistractorPatterns: ["context-mismatch"],
    keyPrinciple: "Family systems = interdependence, circular causality, homeostasis, boundaries. Events affect whole system, not just individual.",
    exampleSlotValues: {}
  },

  // NEW-7-InteragencyCollaboration: Interagency Collaboration
  {
    templateId: "FSC-T06",
    skillId: "NEW-7-InteragencyCollaboration",
    templateType: "best-selection",
    stem: "Interagency collaboration for students with disabilities is most useful for:",
    slots: {},
    correctAnswerLogic: {
      evaluate: () => {
        return "Planning for postsecondary transitions and connecting students to employment and education opportunities";
      },
      description: "Interagency collaboration is most important for transitions"
    },
    allowedDistractorPatterns: ["similar-concept", "context-mismatch"],
    keyPrinciple: "Interagency collaboration = coordination between school and community agencies (mental health, vocational, postsecondary). Most useful for: postsecondary transition planning, connecting to employment opportunities, accessing community services. Collaboration facilitates connections beyond high school.",
    exampleSlotValues: {}
  },
  {
    templateId: "FSC-T08",
    skillId: "NEW-7-InteragencyCollaboration",
    templateType: "best-selection",
    stem: "A school psychologist is developing a transition plan for a {student_type} student with {disability_type}. Which interagency collaboration is most critical?",
    slots: {
      student_type: {
        name: "student_type",
        description: "Type of student",
        possibleValues: [
          "high school senior",
          "ninth-grade",
          "twelfth-grade",
          "transition-age"
        ]
      },
      disability_type: {
        name: "disability_type",
        description: "Type of disability",
        possibleValues: [
          "intellectual disability",
          "autism spectrum disorder",
          "emotional disturbance",
          "multiple disabilities"
        ]
      }
    },
    correctAnswerLogic: {
      evaluate: (slotValues) => {
        const { disability_type } = slotValues;
        if (disability_type === "intellectual disability") {
          return "Collaboration with vocational rehabilitation and supported employment agencies";
        }
        if (disability_type === "autism spectrum disorder") {
          return "Coordination with postsecondary education support services and employment agencies";
        }
        if (disability_type === "emotional disturbance") {
          return "Partnership with mental health agencies and vocational services";
        }
        return "Coordination with multiple community agencies for comprehensive transition support";
      },
      description: "Matches interagency collaboration to transition needs"
    },
    allowedDistractorPatterns: ["similar-concept", "context-mismatch", "incomplete-response"],
    keyPrinciple: "Transition planning requires interagency collaboration. Different disabilities need different agency connections: vocational rehab for employment, mental health for emotional support, postsecondary education for college-bound students. Collaboration begins early (by age 16) and involves multiple community partners.",
    exampleSlotValues: {
      student_type: "high school senior",
      disability_type: "intellectual disability"
    }
  },
  {
    templateId: "FSC-T09",
    skillId: "NEW-7-InteragencyCollaboration",
    templateType: "first-step-scenario",
    stem: "A school psychologist wants to establish interagency collaboration for transition planning. The first step should be:",
    slots: {},
    correctAnswerLogic: {
      evaluate: () => {
        return "Identify relevant community agencies and establish communication protocols";
      },
      description: "First step is identifying and connecting with agencies"
    },
    allowedDistractorPatterns: ["premature-action", "incomplete-response", "delay"],
    keyPrinciple: "Interagency collaboration requires: identifying relevant agencies (vocational rehab, mental health, postsecondary), establishing communication protocols, involving families, coordinating services, and maintaining ongoing relationships. Start early in transition planning process.",
    exampleSlotValues: {}
  },

  // NEW-7-ParentingInterventions: Parenting & Home Interventions
  {
    templateId: "FSC-T07",
    skillId: "NEW-7-ParentingInterventions",
    templateType: "best-selection",
    stem: "A school psychologist is working with parents to address {child_behavior} at home. What is the most effective approach?",
    slots: {
      child_behavior: {
        name: "child_behavior",
        description: "The child's behavior concern",
        possibleValues: [
          "difficulty following directions",
          "challenging behaviors",
          "homework completion",
          "behavior management"
        ]
      }
    },
    correctAnswerLogic: {
      evaluate: () => {
        return "Teach parents behavior management strategies including positive reinforcement, clear rules, and consistent consequences";
      },
      description: "Parenting interventions focus on teaching strategies"
    },
    allowedDistractorPatterns: ["similar-concept", "context-mismatch"],
    keyPrinciple: "Parenting interventions = teaching parents behavior management strategies, positive reinforcement, clear rules, consistent consequences. Home interventions support school goals. Strategies include: parent training, home-school communication, behavior contracts, home reinforcement systems.",
    exampleSlotValues: {
      child_behavior: "difficulty following directions"
    }
  }
];

export const domain7TemplateMap: Record<string, QuestionTemplate> = {};
domain7Templates.forEach(template => {
  domain7TemplateMap[template.templateId] = template;
});
