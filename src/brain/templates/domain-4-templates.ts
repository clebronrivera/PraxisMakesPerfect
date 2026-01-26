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
  {
    templateId: "MBH-T01B",
    skillId: "MBH-S01",
    templateType: "scenario-application",
    stem: "When conducting an FBA, a school psychologist observes that {antecedent} occurs before {behavior_type}, which is followed by {consequence}. This demonstrates the:",
    slots: {
      antecedent: {
        name: "antecedent",
        description: "What happens before the behavior",
        possibleValues: [
          "a math worksheet is presented",
          "the teacher asks a question",
          "transition to recess is announced",
          "group work begins",
          "a peer approaches",
          "lunch period starts",
          "a difficult task is assigned"
        ]
      },
      behavior_type: {
        name: "behavior_type",
        description: "Type of problem behavior",
        possibleValues: [
          "aggression",
          "withdrawal",
          "avoidance",
          "defiance",
          "tantrums",
          "disruption"
        ]
      },
      consequence: {
        name: "consequence",
        description: "What happens after behavior",
        possibleValues: [
          "being sent out of class",
          "getting teacher attention",
          "receiving a preferred item",
          "being removed from the task",
          "getting peer attention"
        ]
      }
    },
    correctAnswerLogic: {
      evaluate: () => {
        return "ABC (Antecedent-Behavior-Consequence) model";
      },
      description: "ABC model application"
    },
    allowedDistractorPatterns: ["sequence-error", "similar-concept"],
    keyPrinciple: "ABC model: Antecedent (what happens before), Behavior (observable action), Consequence (what happens after, maintains behavior).",
    exampleSlotValues: {
      antecedent: "a math worksheet is presented",
      behavior_type: "defiance",
      consequence: "being sent out of class"
    }
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
  {
    templateId: "MBH-T03B",
    skillId: "MBH-S03",
    templateType: "best-selection",
    stem: "A student's {behavior_type} serves a {function} function. Which replacement behavior would be most effective?",
    slots: {
      behavior_type: {
        name: "behavior_type",
        description: "Type of problem behavior",
        possibleValues: [
          "aggression",
          "withdrawal",
          "avoidance",
          "defiance",
          "tantrums",
          "disruption"
        ]
      },
      function: {
        name: "function",
        description: "Function of the behavior",
        possibleValues: [
          "escape",
          "attention",
          "tangible",
          "sensory"
        ]
      }
    },
    correctAnswerLogic: {
      evaluate: (slotValues) => {
        const { function: func } = slotValues;
        if (func === "escape") {
          return "Teaching the student to request a break";
        }
        if (func === "attention") {
          return "Teaching the student to appropriately request attention";
        }
        if (func === "tangible") {
          return "Teaching the student to request the item appropriately";
        }
        return "Teaching a functionally equivalent replacement behavior";
      },
      description: "Replacement behavior must match function"
    },
    allowedDistractorPatterns: ["function-mismatch", "premature-action"],
    keyPrinciple: "Replacement behavior MUST serve the SAME function as problem behavior. It should be easier, more efficient, and socially acceptable.",
    exampleSlotValues: {
      behavior_type: "defiance",
      function: "escape"
    }
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
  },
  {
    templateId: "MBH-T08B",
    skillId: "NEW-4-GroupCounseling",
    templateType: "best-selection",
    stem: "A school psychologist is forming a {group_type} group. Which student should be excluded?",
    slots: {
      group_type: {
        name: "group_type",
        description: "Type of counseling group",
        possibleValues: [
          "social skills",
          "anger management",
          "grief and loss",
          "anxiety management",
          "friendship skills",
          "self-esteem"
        ]
      }
    },
    correctAnswerLogic: {
      evaluate: () => {
        return "A student with a history of aggressive behavior toward peers";
      },
      description: "Aggressive students are contraindicated"
    },
    allowedDistractorPatterns: ["inclusion-error", "similar-concept"],
    keyPrinciple: "Group counseling requires screening. Aggressive students, severe conduct disorders are contraindicated. Groups have stages: forming, storming, norming, performing.",
    exampleSlotValues: {
      group_type: "social skills"
    }
  },
  {
    templateId: "MBH-T08C",
    skillId: "NEW-4-GroupCounseling",
    templateType: "best-selection",
    stem: "A school psychologist observes that a {group_type} group is experiencing conflict, members challenging the leader, and testing boundaries. This group is in which stage?",
    slots: {
      group_type: {
        name: "group_type",
        description: "Type of counseling group",
        possibleValues: [
          "social skills",
          "anger management",
          "grief and loss",
          "anxiety management"
        ]
      }
    },
    correctAnswerLogic: {
      evaluate: () => {
        return "Storming stage (characterized by conflict, resistance, and testing of group norms)";
      },
      description: "Identifies storming stage characteristics"
    },
    allowedDistractorPatterns: ["sequence-error", "similar-concept"],
    keyPrinciple: "Group stages: Forming (orientation, getting acquainted), Storming (conflict, resistance, testing boundaries), Norming (cohesion, establishing norms), Performing (productive work, goal achievement). School psychologist must recognize and manage each stage.",
    exampleSlotValues: {
      group_type: "social skills"
    }
  },
  {
    templateId: "MBH-T08D",
    skillId: "NEW-4-GroupCounseling",
    templateType: "best-selection",
    stem: "When screening students for a {group_type} group, a school psychologist should prioritize:",
    slots: {
      group_type: {
        name: "group_type",
        description: "Type of counseling group",
        possibleValues: [
          "social skills",
          "anger management",
          "grief and loss",
          "anxiety management"
        ]
      }
    },
    correctAnswerLogic: {
      evaluate: () => {
        return "Ensuring members have similar needs, can benefit from group format, and are not contraindicated (e.g., aggressive behavior)";
      },
      description: "Screening criteria for group membership"
    },
    allowedDistractorPatterns: ["incomplete-response", "inclusion-error"],
    keyPrinciple: "Group screening criteria: similar needs/goals, ability to benefit from group format, appropriate social skills, no contraindications (aggression, severe conduct disorder). Screening ensures group safety and effectiveness.",
    exampleSlotValues: {
      group_type: "social skills"
    }
  },

  // MBH-T10: Counseling Approach Selection
  {
    templateId: "MBH-T10",
    skillId: "MBH-S01",
    templateType: "best-selection",
    stem: "A student presents with {presenting_issue} and {behavior_type} in {setting}. Which counseling approach is most appropriate?",
    slots: {
      presenting_issue: {
        name: "presenting_issue",
        description: "The main issue the student is facing",
        possibleValues: [
          "anxiety about academic performance",
          "depression with social withdrawal",
          "anger management difficulties",
          "low self-esteem",
          "grief and loss",
          "trauma symptoms",
          "social skills deficits",
          "family conflict"
        ]
      },
      behavior_type: {
        name: "behavior_type",
        description: "Type of behavior observed",
        possibleValues: [
          "aggression",
          "withdrawal",
          "avoidance",
          "defiance",
          "anxiety",
          "inattention",
          "impulsivity",
          "social isolation"
        ]
      },
      setting: {
        name: "setting",
        description: "Where behavior occurs",
        possibleValues: [
          "classroom",
          "lunch",
          "recess",
          "transitions",
          "specials",
          "hallway",
          "cafeteria",
          "playground"
        ]
      }
    },
    correctAnswerLogic: {
      evaluate: (slotValues) => {
        const { presenting_issue } = slotValues;
        if (presenting_issue.includes("anxiety") || presenting_issue.includes("depression")) {
          return "Cognitive-Behavioral Therapy (CBT)";
        }
        if (presenting_issue.includes("grief") || presenting_issue.includes("trauma")) {
          return "Trauma-informed or grief counseling";
        }
        if (presenting_issue.includes("social skills")) {
          return "Solution-Focused Brief Therapy (SFBT)";
        }
        return "Cognitive-Behavioral Therapy (CBT)";
      },
      description: "Match counseling approach to presenting issue"
    },
    allowedDistractorPatterns: ["model-confusion", "premature-action"],
    keyPrinciple: "CBT = cognitive distortions, anxiety, depression. SFBT = solution-focused, quick change. Play therapy = young children, trauma. DBT = emotion regulation, self-harm.",
    exampleSlotValues: {
      presenting_issue: "anxiety about academic performance",
      behavior_type: "avoidance",
      setting: "classroom"
    }
  },

  // MBH-T11: Crisis vs Ongoing Support
  {
    templateId: "MBH-T11",
    skillId: "MBH-S04",
    templateType: "first-step-scenario",
    stem: "A student reports {crisis_indicator} and shows {behavior_type} during {setting}. What is the school psychologist's first priority?",
    slots: {
      crisis_indicator: {
        name: "crisis_indicator",
        description: "Signs of crisis or immediate risk",
        possibleValues: [
          "suicidal ideation with a plan",
          "threats of violence toward others",
          "self-harm behaviors",
          "severe panic attacks",
          "hallucinations or delusions",
          "substance use at school",
          "disclosure of abuse"
        ]
      },
      behavior_type: {
        name: "behavior_type",
        description: "Type of behavior observed",
        possibleValues: [
          "aggression",
          "withdrawal",
          "avoidance",
          "defiance",
          "anxiety",
          "isolation",
          "erratic behavior"
        ]
      },
      setting: {
        name: "setting",
        description: "Where behavior occurs",
        possibleValues: [
          "classroom",
          "lunch",
          "recess",
          "transitions",
          "specials",
          "hallway"
        ]
      }
    },
    correctAnswerLogic: {
      evaluate: (slotValues) => {
        const { crisis_indicator } = slotValues;
        if (crisis_indicator.includes("suicidal") || crisis_indicator.includes("self-harm")) {
          return "Immediately assess plan, intent, and means for suicide risk";
        }
        if (crisis_indicator.includes("violence") || crisis_indicator.includes("threats")) {
          return "Conduct threat assessment and ensure safety";
        }
        if (crisis_indicator.includes("abuse")) {
          return "Follow mandated reporting procedures immediately";
        }
        return "Assess immediate safety and risk level";
      },
      description: "Crisis requires immediate assessment, not ongoing support"
    },
    allowedDistractorPatterns: ["delay", "premature-action"],
    keyPrinciple: "Crisis = immediate safety assessment. Ongoing support = regular counseling. Crisis indicators: suicide risk, threats, abuse, severe mental health symptoms.",
    exampleSlotValues: {
      crisis_indicator: "suicidal ideation with a plan",
      behavior_type: "withdrawal",
      setting: "classroom"
    }
  },

  // MBH-T12: Behavior Function Scenario (expanded)
  {
    templateId: "MBH-T12",
    skillId: "MBH-S02",
    templateType: "analysis",
    stem: "A student engages in {behavior_type} during {setting}, which results in {consequence}. What is the likely function of this behavior?",
    slots: {
      behavior_type: {
        name: "behavior_type",
        description: "Type of problem behavior",
        possibleValues: [
          "aggression",
          "withdrawal",
          "avoidance",
          "defiance",
          "anxiety",
          "tantrums",
          "disruption",
          "non-compliance"
        ]
      },
      setting: {
        name: "setting",
        description: "Where behavior occurs",
        possibleValues: [
          "math class",
          "reading group",
          "lunch",
          "recess",
          "transitions",
          "specials",
          "group work",
          "quiet reading time"
        ]
      },
      consequence: {
        name: "consequence",
        description: "What happens after behavior",
        possibleValues: [
          "being sent out of class",
          "getting teacher attention",
          "receiving a preferred item",
          "being removed from the task",
          "getting peer attention",
          "being allowed to avoid work",
          "receiving a break",
          "being sent to the office"
        ]
      }
    },
    correctAnswerLogic: {
      evaluate: (slotValues) => {
        const { consequence } = slotValues;
        if (consequence.includes("sent out") || consequence.includes("removed") || consequence.includes("avoid") || consequence.includes("break")) {
          return "Escape/Avoidance";
        }
        if (consequence.includes("teacher attention") || consequence.includes("peer attention") || consequence.includes("attention")) {
          return "Attention";
        }
        if (consequence.includes("preferred item") || consequence.includes("tangible")) {
          return "Tangible";
        }
        return "Escape/Avoidance";
      },
      description: "Maps consequence to behavior function"
    },
    allowedDistractorPatterns: ["function-confusion", "function-mismatch"],
    keyPrinciple: "Function = what maintains behavior. Escape/avoidance = removes task/demand. Attention = gets attention from peers/adults. Tangible = gets item/activity. Sensory = internal stimulation.",
    exampleSlotValues: {
      behavior_type: "defiance",
      setting: "math class",
      consequence: "being sent out of class"
    }
  },

  // NEW-4-DevelopmentalInterventions: Developmental-Level Interventions
  {
    templateId: "MBH-T15",
    skillId: "NEW-4-DevelopmentalInterventions",
    templateType: "best-selection",
    stem: "A school psychologist is planning an intervention for a {grade_level} student who {presenting_concern}. Which approach is most developmentally appropriate?",
    slots: {
      grade_level: {
        name: "grade_level",
        description: "Student's grade level",
        possibleValues: [
          "kindergarten",
          "elementary school",
          "middle school",
          "high school"
        ]
      },
      presenting_concern: {
        name: "presenting_concern",
        description: "The student's concern",
        possibleValues: [
          "has difficulty managing emotions",
          "struggles with social skills",
          "experiences anxiety",
          "has behavioral challenges"
        ]
      }
    },
    correctAnswerLogic: {
      evaluate: (slotValues) => {
        const { grade_level } = slotValues;
        if (grade_level === "kindergarten" || grade_level === "elementary school") {
          return "Concrete, play-based, visual strategies with shorter sessions";
        }
        return "Abstract, discussion-based approaches with longer sessions and peer-focused activities";
      },
      description: "Matches intervention approach to developmental level"
    },
    allowedDistractorPatterns: ["similar-concept", "context-mismatch"],
    keyPrinciple: "Interventions must match developmental level: elementary (concrete, play-based, visual, shorter sessions) vs. secondary (abstract, discussion-based, longer sessions, peer-focused). Consider cognitive development, attention span, and social-emotional maturity.",
    exampleSlotValues: {
      grade_level: "elementary school",
      presenting_concern: "has difficulty managing emotions"
    }
  },

  // NEW-4-MentalHealthImpact: Mental Health Impact on Education
  {
    templateId: "MBH-T16",
    skillId: "NEW-4-MentalHealthImpact",
    templateType: "best-selection",
    stem: "A student experiencing {mental_health_condition} is likely to show which impact on {educational_area}?",
    slots: {
      mental_health_condition: {
        name: "mental_health_condition",
        description: "The mental health condition",
        possibleValues: [
          "depression",
          "anxiety",
          "trauma",
          "ADHD"
        ]
      },
      educational_area: {
        name: "educational_area",
        description: "Area of education affected",
        possibleValues: [
          "academic performance",
          "test-taking",
          "school engagement",
          "learning"
        ]
      }
    },
    correctAnswerLogic: {
      evaluate: (slotValues) => {
        const { mental_health_condition, educational_area } = slotValues;
        if (mental_health_condition === "depression") {
          if (educational_area === "academic performance") {
            return "Decreased motivation, concentration difficulties, and academic decline";
          }
          if (educational_area === "school engagement") {
            return "Withdrawal, decreased participation, and reduced school engagement";
          }
        }
        if (mental_health_condition === "anxiety") {
          if (educational_area === "test-taking") {
            return "Worry, physical symptoms, and impaired test performance";
          }
          if (educational_area === "learning") {
            return "Attention difficulties, memory problems, and learning challenges";
          }
        }
        return "Impact on academic performance, engagement, and learning";
      },
      description: "Identifies how mental health conditions affect education"
    },
    allowedDistractorPatterns: ["similar-concept", "context-mismatch"],
    keyPrinciple: "Mental health conditions significantly impact education: depression affects motivation, concentration, and academic performance; anxiety impacts test-taking (worry, physical symptoms), learning (attention, memory), and school engagement. The relationship between mental health and school engagement is bidirectional.",
    exampleSlotValues: {
      mental_health_condition: "depression",
      educational_area: "academic performance"
    }
  }
];

export const domain4TemplateMap: Record<string, QuestionTemplate> = {};
domain4Templates.forEach(template => {
  domain4TemplateMap[template.templateId] = template;
});
