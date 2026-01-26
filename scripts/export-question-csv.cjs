const fs = require('fs');
const path = require('path');

const QUESTIONS_PATH = path.join(__dirname, '../src/data/questions.json');
const SKILL_MAP_PATH = path.join(__dirname, '../src/data/question-skill-map.json');
const OUTPUT_PATH = path.join(__dirname, '../reports/questions-export.csv');

const domainShortNames = {
  1: 'DBDM',
  2: 'C&C',
  3: 'Academic',
  4: 'MBH',
  5: 'School-Wide',
  6: 'Prevention',
  7: 'Family',
  8: 'Diversity',
  9: 'Research',
  10: 'Legal/Ethics'
};

const domainKeywords = {
  1: ['reliability', 'validity', 'assessment', 'data', 'cbm', 'screening', 'progress monitoring', 'measurement', 'psychometric'],
  2: ['consultation', 'collaborate', 'consultee', 'indirect'],
  3: ['academic', 'intervention', 'reading', 'math', 'instruction', 'tier 2', 'tier 3', 'learning disability'],
  4: ['behavior', 'mental health', 'counseling', 'fba', 'bip', 'anxiety', 'depression', 'suicide', 'social-emotional'],
  5: ['school-wide', 'pbis', 'mtss', 'rti', 'universal', 'tier 1', 'climate'],
  6: ['crisis', 'threat', 'safety', 'prevention', 'responsive'],
  7: ['family', 'parent', 'home-school', 'caregiver'],
  8: ['cultural', 'diversity', 'bias', 'equity', 'ell', 'multicultural', 'disproportional'],
  9: ['research', 'meta-analysis', 'effect size', 'statistical', 'study', 'evidence-based'],
  10: ['ethical', 'legal', 'confidential', 'idea', 'ferpa', 'court case', 'nasp', 'mandated', 'tarasoff']
};

const DOMAIN_TERM_LIBRARIES = {
  legal: [
    'Tarasoff', 'IDEA', 'FERPA', 'Section 504', 'Mills', 'Larry P.', 'Lau',
    'FAPE', 'due process', 'IEP', 'manifestation determination', 'Rowley',
    'PARC', 'least restrictive environment', 'LRE', 'educationally relevant'
  ],
  psychometric: [
    'reliability', 'validity', 'correlation', 'z-score', 't-test', 'ANOVA',
    'standard deviation', 'mean', 'median', 'coefficient', 'regression',
    'test-retest', 'internal consistency', 'Cronbach', 'alpha', 'interrater',
    'sensitivity', 'specificity', 'true positive', 'false positive'
  ],
  fba: [
    'function', 'antecedent', 'consequence', 'ABC data', 'escape', 'attention',
    'tangible', 'automatic reinforcement', 'functional analysis', 'FBA',
    'behavior intervention plan', 'BIP', 'maintaining consequence'
  ],
  consultation: [
    'rapport', 'contracting', 'consultee', 'entry', 'resistance',
    'collaborative', 'problem-solving stages', 'conjoint', 'organizational'
  ],
  therapy: [
    'CBT', 'cognitive behavioral', 'SFBT', 'solution-focused', 'DBT',
    'dialectical', 'play therapy', 'counseling model', 'therapeutic alliance'
  ],
  assessment: [
    'screening', 'diagnosis', 'eligibility', 'progress monitoring', 'CBM',
    'curriculum-based measurement', 'benchmark', 'diagnostic assessment'
  ],
  intervention: [
    'Tier 1', 'Tier 2', 'Tier 3', 'RTI', 'MTSS', 'scaffolding',
    'differentiation', 'explicit instruction'
  ]
};

const BANNED_TERMS = {
  consultation: [
    'Tarasoff', 'IDEA', 'Mills', 'Larry P.', 'Lau', 'FERPA',
    'Section 504', ' v. ', 'Rowley', 'PARC', 'FAPE', 'due process', 'IEP'
  ],
  therapy: [
    'Tarasoff', 'Mills', 'Larry P.', 'Lau', ' v. ', 'IDEA', 'FERPA'
  ],
  intervention: [
    'Tarasoff', 'Mills', 'Larry P.', ' v. ', 'IDEA'
  ],
  fba: [
    'Tarasoff', 'IDEA', 'Mills', ' v. ', 'Larry P.', 'Lau'
  ],
  assessment: [
    'Tarasoff', ' v. '
  ],
  psychometric: [
    'Tarasoff', ' v. '
  ],
  legal: []
};

const SKILL_TO_DOMAIN_MAP = {
  'DBDM-S01': ['psychometric'],
  'DBDM-S02': ['psychometric'],
  'DBDM-S03': ['psychometric'],
  'DBDM-S04': ['psychometric'],
  'DBDM-S05': ['assessment', 'psychometric'],
  'DBDM-S06': ['assessment'],
  'DBDM-S07': ['assessment'],
  'DBDM-S08': ['assessment'],
  'DBDM-S09': ['assessment'],
  'DBDM-S10': ['assessment'],
  'NEW-1-BackgroundInformation': ['assessment'],
  'NEW-1-DynamicAssessment': ['assessment'],
  'NEW-1-IQvsAchievement': ['psychometric', 'assessment'],
  'NEW-1-LowIncidenceExceptionalities': ['assessment'],
  'NEW-1-PerformanceAssessment': ['assessment'],
  'NEW-1-ProblemSolvingFramework': ['intervention'],
  'CC-S01': ['consultation'],
  'CC-S03': ['consultation'],
  'NEW-2-ConsultationProcess': ['consultation'],
  'NEW-2-ProblemSolvingSteps': ['consultation'],
  'NEW-2-CommunicationStrategies': ['consultation'],
  'NEW-2-FamilyCollaboration': ['consultation'],
  'NEW-2-CommunityAgencies': ['consultation'],
  'ACAD-S01': ['intervention'],
  'ACAD-S02': ['intervention'],
  'ACAD-S03': ['intervention'],
  'ACAD-S04': ['intervention'],
  'ACAD-S05': ['assessment', 'intervention'],
  'NEW-3-AccommodationsModifications': ['intervention'],
  'NEW-3-AcademicProgressFactors': ['intervention'],
  'NEW-3-BioCulturalInfluences': ['intervention'],
  'NEW-3-InstructionalHierarchy': ['intervention'],
  'NEW-3-MetacognitiveStrategies': ['intervention'],
  'MBH-S01': ['fba'],
  'MBH-S02': ['fba'],
  'MBH-S03': ['fba'],
  'MBH-S04': ['therapy'],
  'MBH-S05': ['therapy'],
  'MBH-S06': ['intervention', 'fba'],
  'NEW-4-Psychopathology': ['therapy'],
  'NEW-4-DevelopmentalInterventions': ['therapy'],
  'NEW-4-MentalHealthImpact': ['therapy'],
  'NEW-4-GroupCounseling': ['therapy'],
  'SWP-S01': ['intervention'],
  'SWP-S02': ['intervention'],
  'SWP-S03': ['intervention'],
  'SWP-S04': ['intervention'],
  'NEW-5-EducationalPolicies': ['legal', 'assessment'],
  'NEW-5-EBPImportance': ['intervention'],
  'NEW-5-SchoolClimate': ['intervention'],
  'RES-S01': ['intervention'],
  'RES-S02': ['intervention'],
  'RES-S03': ['intervention'],
  'RES-S04': ['intervention'],
  'RES-S05': ['intervention'],
  'RES-S06': ['intervention'],
  'NEW-6-BullyingPrevention': ['intervention'],
  'NEW-6-TraumaInformed': ['intervention'],
  'NEW-6-SchoolClimateMeasurement': ['assessment', 'intervention'],
  'FSC-S01': ['consultation'],
  'FSC-S02': ['consultation'],
  'FSC-S03': ['therapy'],
  'FSC-S04': ['consultation'],
  'NEW-7-BarriersToEngagement': ['consultation'],
  'NEW-7-FamilySystems': ['consultation'],
  'NEW-7-InteragencyCollaboration': ['consultation'],
  'NEW-7-ParentingInterventions': ['consultation', 'intervention'],
  'DIV-S01': ['assessment'],
  'DIV-S02': ['assessment'],
  'DIV-S03': ['psychometric'],
  'DIV-S04': ['assessment'],
  'DIV-S05': ['assessment'],
  'DIV-S06': ['assessment'],
  'DIV-S07': ['intervention'],
  'NEW-8-Acculturation': ['assessment'],
  'NEW-8-LanguageAcquisition': ['assessment'],
  'NEW-8-SocialJustice': ['legal'],
  'NEW-9-DescriptiveStats': ['psychometric'],
  'NEW-9-ValidityThreats': ['psychometric'],
  'NEW-9-StatisticalTests': ['psychometric'],
  'NEW-9-Variables': ['psychometric'],
  'NEW-9-ProgramEvaluation': ['assessment'],
  'NEW-9-ImplementationFidelity': ['intervention'],
  'LEG-S01': ['legal'],
  'LEG-S02': ['legal'],
  'LEG-S03': ['legal'],
  'LEG-S04': ['legal'],
  'LEG-S05': ['legal'],
  'LEG-S06': ['legal'],
  'LEG-S07': ['legal'],
  'PC-S01': ['assessment'],
  'PC-S02': ['assessment'],
  'PC-S03': ['legal'],
  'PC-S04': ['intervention'],
  'PC-S05': ['legal'],
  'NEW-10-EducationLaw': ['legal'],
  'NEW-10-EthicalProblemSolving': ['legal'],
  'NEW-10-RecordKeeping': ['legal'],
  'NEW-10-TestSecurity': ['legal'],
  'NEW-10-Supervision': ['legal'],
  'NEW-10-ProfessionalGrowth': ['legal']
};

const confidenceRank = { high: 3, medium: 2, low: 1 };

function buildSkillLookup(mappedQuestions = []) {
  const interim = {};
  for (const entry of mappedQuestions) {
    const existing = interim[entry.questionId];
    if (!existing || confidenceRank[entry.confidence] > confidenceRank[existing.confidence]) {
      interim[entry.questionId] = entry;
    }
  }
  return Object.fromEntries(Object.entries(interim).map(([questionId, entry]) => [questionId, entry.skillId]));
}

function extractTemplateId(question) {
  if (question.metadata?.templateId) {
    return question.metadata.templateId;
  }

  if (question.id.startsWith('GEN-')) {
    const parts = question.id.split('-');
    if (parts.length >= 3) {
      return parts.slice(1, 3).join('-');
    }
  }

  return '';
}

function normalizeCorrectAnswers(answer) {
  if (!answer) return [];
  return Array.isArray(answer) ? answer.map(a => String(a).trim().toUpperCase()) : [String(answer).trim().toUpperCase()];
}

function inferDomain(question) {
  const text = (question.question || '').toLowerCase();
  const rationale = (question.rationale || '').toLowerCase();
  const matches = [];

  for (const [domainKey, keywords] of Object.entries(domainKeywords)) {
    const domainNum = Number(domainKey);
    const keywordFound = keywords.some(term => {
      const lowerTerm = term.toLowerCase();
      return text.includes(lowerTerm) || rationale.includes(lowerTerm);
    });
    if (keywordFound) {
      matches.push(domainNum);
    }
  }

  const chosenDomain = matches.length > 0 ? matches[0] : 1;
  return domainShortNames[chosenDomain] || domainShortNames[1];
}

function escapeCsv(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function calculateFlags(question, skillId, correctLetters, avgCorrectLength) {
  const flags = new Set();
  const expectedDomains = SKILL_TO_DOMAIN_MAP[skillId] || [];
  const choices = question.choices || {};
  const correctSet = new Set(correctLetters);

  if (expectedDomains.length > 0) {
    for (const [letter, text] of Object.entries(choices)) {
      if (!text || !text.trim()) continue;
      if (correctSet.has(letter)) continue;

      const lowerText = text.toLowerCase();

      for (const [domainName, terms] of Object.entries(DOMAIN_TERM_LIBRARIES)) {
        if (expectedDomains.includes(domainName)) continue;
        if (terms.some(term => lowerText.includes(term.toLowerCase()))) {
          flags.add('irrelevant-domain');
          break;
        }
      }

      for (const domainName of expectedDomains) {
        const bannedList = BANNED_TERMS[domainName] || [];
        if (bannedList.some(term => lowerText.includes(term.toLowerCase()))) {
          flags.add('banned-term');
          break;
        }
      }
    }
  }

  const avg = avgCorrectLength || 1;
  for (const [letter, text] of Object.entries(choices)) {
    if (!text || !text.trim()) continue;
    if (correctSet.has(letter)) continue;
    const length = text.length;
    const ratio = length / avg;
    if (ratio < 0.5 || ratio > 2.0) {
      flags.add('length-mismatch');
      break;
    }
  }

  const allChoices = Object.entries(choices)
    .filter(([_, text]) => text && text.trim())
    .map(([letter, text]) => ({
      letter,
      text,
      wordCount: text.trim().split(/\s+/).length,
      isCorrect: correctSet.has(letter)
    }));

  const singleWordChoices = allChoices.filter(choice => choice.wordCount === 1);
  const multiWordChoices = allChoices.filter(choice => choice.wordCount > 3);

  if (singleWordChoices.length > 0 && multiWordChoices.length > 0) {
    const hasSingleDistractor = singleWordChoices.some(choice => !choice.isCorrect);
    if (hasSingleDistractor) {
      flags.add('single-word');
    }
  }

  return Array.from(flags);
}

function buildRow(question, skillLookup) {
  const skillId = question.skillId || skillLookup[question.id] || '';
  const templateId = extractTemplateId(question);
  const domain = inferDomain(question);
  const stem = question.question || '';

  const choices = question.choices || {};
  const letters = ['A', 'B', 'C', 'D'];
  const letterTexts = letters.map(letter => (choices[letter] || '').trim());
  const correctLetters = normalizeCorrectAnswers(question.correct_answer);
  const correctTexts = correctLetters
    .map(letter => (choices[letter] || '').trim())
    .filter(text => text);
  const avgCorrectLength =
    correctTexts.length > 0
      ? correctTexts.reduce((sum, text) => sum + text.length, 0) / correctTexts.length
      : 0;

  const choiceLengths = letterTexts.map(text => text.length);
  const normalization = avgCorrectLength || 1;
  const lengthRatios = choiceLengths.map(len => (len / normalization).toFixed(2));

  const flags = calculateFlags(question, skillId, correctLetters, avgCorrectLength);

  const row = [
    question.id,
    templateId,
    skillId,
    domain,
    stem,
    ...letterTexts,
    correctLetters.join('|'),
    correctTexts.join(' | '),
    letters.map((letter, index) => `${letter}=${choiceLengths[index]}`).join('|'),
    avgCorrectLength.toFixed(2),
    letters.map((letter, index) => `${letter}=${lengthRatios[index]}`).join('|'),
    flags.length > 0 ? flags.join(', ') : 'none',
    question.id.startsWith('GEN-') ? 'generated' : 'ETS'
  ];

  return row;
}

function main() {
  const questions = JSON.parse(fs.readFileSync(QUESTIONS_PATH, 'utf8'));
  const skillMapData = JSON.parse(fs.readFileSync(SKILL_MAP_PATH, 'utf8'));
  const skillLookup = buildSkillLookup(skillMapData.mappedQuestions || []);

  const rows = [];
  const header = [
    'id',
    'templateId',
    'skillId',
    'domain',
    'stem',
    'choiceA',
    'choiceB',
    'choiceC',
    'choiceD',
    'correctLetter',
    'correctText',
    'choiceLengths',
    'correctLength',
    'lengthRatios',
    'flags',
    'source'
  ];
  rows.push(header);

  for (const question of questions) {
    rows.push(buildRow(question, skillLookup));
  }

  const csv = rows
    .map(row => row.map(cell => escapeCsv(cell)).join(','))
    .join('\n');

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, csv, 'utf8');
  console.log(`Wrote ${rows.length - 1} questions to ${OUTPUT_PATH}`);
}

main();
