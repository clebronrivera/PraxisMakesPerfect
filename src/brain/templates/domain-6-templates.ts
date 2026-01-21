// Domain 6 Templates - Question generation templates for Preventive & Responsive Services skills

import { QuestionTemplate } from '../template-schema';

export const domain6Templates: QuestionTemplate[] = [
  // PC-S01: Threat Assessment
  {
    templateId: "PC-T01",
    skillId: "PC-S01",
    templateType: "classification",
    stem: "A student makes a threat that appears to be {threat_characteristic}. This is best classified as:",
    slots: {
      threat_characteristic: {
        name: "threat_characteristic",
        description: "Characteristics of the threat",
        possibleValues: [
          "an emotional expression with no specific plan",
          "a specific plan with means and intent",
          "a vague statement made in anger"
        ]
      }
    },
    correctAnswerLogic: {
      evaluate: (slotValues) => {
        const { threat_characteristic } = slotValues;
        if (threat_characteristic.includes("specific plan")) return "Substantive threat";
        return "Transient threat";
      },
      description: "Maps threat characteristics to threat type"
    },
    allowedDistractorPatterns: ["threat-confusion"],
    keyPrinciple: "Transient threat = emotional expression, no plan, low risk. Substantive threat = specific plan, means, intent, high risk.",
    exampleSlotValues: {
      threat_characteristic: "an emotional expression with no specific plan"
    }
  },

  // PC-S02: Crisis Response Role
  {
    templateId: "PC-T02",
    skillId: "PC-S02",
    templateType: "role-identification",
    stem: "During a crisis event, the school psychologist's primary role is to:",
    slots: {},
    correctAnswerLogic: {
      evaluate: () => {
        return "Provide immediate support and psychological first aid, not long-term therapy";
      },
      description: "Crisis role is immediate support"
    },
    allowedDistractorPatterns: ["therapy-focus"],
    keyPrinciple: "Crisis role = immediate support, psychological first aid, triage, connect to resources. Not long-term therapy during crisis.",
    exampleSlotValues: {}
  },

  // PC-S03: Psychological First Aid
  {
    templateId: "PC-T03",
    skillId: "PC-S03",
    templateType: "characteristic-identification",
    stem: "The core elements of Psychological First Aid include:",
    slots: {},
    correctAnswerLogic: {
      evaluate: () => {
        return "Establish safety, promote calm, foster connectedness, enhance self-efficacy, and instill hope";
      },
      description: "PFA core elements"
    },
    allowedDistractorPatterns: ["therapy-elements"],
    keyPrinciple: "PFA elements = establish safety, promote calm, foster connectedness, enhance self-efficacy, instill hope. Not therapy.",
    exampleSlotValues: {}
  },

  // PC-S04: Crisis Preparedness
  {
    templateId: "PC-T04",
    skillId: "PC-S04",
    templateType: "best-practice",
    stem: "Best practices for crisis drills include:",
    slots: {},
    correctAnswerLogic: {
      evaluate: () => {
        return "Practicing regularly in a developmentally appropriate way";
      },
      description: "Crisis drill best practices"
    },
    allowedDistractorPatterns: ["trauma-inducing"],
    keyPrinciple: "Crisis drills = practiced regularly, developmentally appropriate, not traumatizing, prepare without causing fear.",
    exampleSlotValues: {}
  },

  // PC-S05: Postvention Services
  {
    templateId: "PC-T05",
    skillId: "PC-S05",
    templateType: "goal-identification",
    stem: "The primary goal of postvention services following a student suicide is:",
    slots: {},
    correctAnswerLogic: {
      evaluate: () => {
        return "Preventing contagion and cluster suicides";
      },
      description: "Postvention primary goal"
    },
    allowedDistractorPatterns: ["grief-focus"],
    keyPrinciple: "Postvention primary goal = prevent contagion/cluster suicides. Provide support, avoid glorification, monitor at-risk students.",
    exampleSlotValues: {}
  },

  // NEW-6-BullyingPrevention: Bullying & Harassment Prevention
  {
    templateId: "PC-T06",
    skillId: "NEW-6-BullyingPrevention",
    templateType: "best-selection",
    stem: "What is the most effective school-wide strategy to reduce bullying?",
    slots: {},
    correctAnswerLogic: {
      evaluate: () => {
        return "Improving school climate and supervision";
      },
      description: "Systemic prevention is most effective"
    },
    allowedDistractorPatterns: ["zero-tolerance", "peer-mediation"],
    keyPrinciple: "Effective bullying prevention = climate improvement, bystander training, supervision. Ineffective = zero tolerance, peer mediation for bullying.",
    exampleSlotValues: {}
  },

  // NEW-6-TraumaInformed: Trauma-Informed Care
  {
    templateId: "PC-T07",
    skillId: "NEW-6-TraumaInformed",
    templateType: "characteristic-identification",
    stem: "Common symptoms of trauma in young children include:",
    slots: {},
    correctAnswerLogic: {
      evaluate: () => {
        return "Regression, sleep disturbance, and behavioral changes";
      },
      description: "Trauma symptoms in children"
    },
    allowedDistractorPatterns: ["punishment-focus"],
    keyPrinciple: "Trauma impacts learning and behavior. Trauma-informed care prioritizes safety and relationships over punishment. Recognize ACEs impact.",
    exampleSlotValues: {}
  }
];

export const domain6TemplateMap: Record<string, QuestionTemplate> = {};
domain6Templates.forEach(template => {
  domain6TemplateMap[template.templateId] = template;
});
