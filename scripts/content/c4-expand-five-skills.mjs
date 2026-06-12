/**
 * C4 bank expansion — lift the five remaining ≤22-question skills to 30 items each.
 *
 *   DIV-03 Implicit/Explicit Bias        21 -> 30 (+9)   obj IV.A.1.c / IV.A.1.d
 *   DBD-09 Ecological Assessment         22 -> 30 (+8)   obj I.A.2.h
 *   PSY-01 Test Scores, Norms            22 -> 30 (+8)   obj I.A.3.b / I.A.3.c
 *   PSY-04 Assessment of CLD Students    22 -> 30 (+8)   obj I.A.4.b / I.A.3.e / I.A.3.f
 *   FAM-02 Family Involvement/Advocacy   22 -> 30 (+8)   obj III.C.1.a / III.C.1.b / III.C.1.d
 *                                                        ────────
 *                                                         +41 items
 *
 * Append-only: never mutates an existing item. New UNIQUEIDs continue each skill's
 * PQ_<skill>_<n> sequence. Keys are placed OFF-B (every skill is heavily B-skewed) and
 * each new item targets a subtopic the skill did not already cover (verified against the
 * existing constructs). Mirrors the Floor-5 procedure (commits 827bb00…b2f03b2):
 *   - full distractor tagging (tier / error_type / "The student…" misconception / skill_deficit)
 *   - objective-map entries written as method:"manual", verified:false so
 *     `seed-question-ets-topics.mjs --preserve-manual` keeps them (they are the review queue)
 *   - is_human_verified:true
 *
 * Run:  node scripts/content/c4-expand-five-skills.mjs            # apply
 *       node scripts/content/c4-expand-five-skills.mjs --check    # validate spec only, no write
 *
 * After running, ENGINEERING re-derives (do not skip):
 *   npx tsx scripts/migrations/seed-question-ets-topics.mjs --preserve-manual
 *   npx tsx scripts/migrations/derive-misconception-questions.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const Q_PATH = join(ROOT, 'src/data/questions.json');
const OBJ_PATH = join(ROOT, 'src/data/questionObjectiveMap.json');

const APPROVED_TAGS = new Set([
  'model-conflation', 'scope-overgeneralization', 'scope-undergeneralization', 'sequence-inversion',
  'component-confusion', 'indirect-direct-confusion', 'purpose-confusion', 'prerequisite-skipping',
  'label-retrieval', 'overgeneralization', 'population-confusion', 'role-confusion',
  'causation-correlation', 'validity-reliability-confusion', 'norm-criterion-confusion',
  'tier-level-confusion', 'eligibility-criteria-confusion', 'consent-confidentiality-confusion',
  'developmental-stage-mismatch', 'treatment-assessment-confusion',
]);
const ALLOWED_OBJ = {
  'DIV-03': new Set(['IV.A.1.c', 'IV.A.1.d']),
  'DBD-09': new Set(['I.A.2.h']),
  'PSY-01': new Set(['I.A.3.b', 'I.A.3.c']),
  'PSY-04': new Set(['I.A.4.b', 'I.A.3.e', 'I.A.3.f']),
  'FAM-02': new Set(['III.C.1.a', 'III.C.1.b', 'III.C.1.d']),
};

// ── The spec. d = distractor metadata for the WRONG options only: [tier, errorType, misconception, skillDeficit].
const SPEC = [
  // ───────────────────────── DIV-03 — Implicit/Explicit Bias (+9) ─────────────────────────
  {
    skill: 'DIV-03', cc: 'Application', correct: 'A', tag: 'causation-correlation', obj: ['IV.A.1.c'],
    stem: "A teacher concludes that a student who is frequently off task is simply 'lazy and unmotivated,' overlooking that the student recently became homeless. This judgment best illustrates which bias?",
    A: 'The fundamental attribution error — overweighting dispositional causes and discounting situational ones',
    B: 'The halo effect', C: 'The Hawthorne effect', D: 'Self-serving bias',
    construct: 'Fundamental attribution error as overattributing student behavior to disposition while discounting situational and contextual causes',
    why: "This is an Application item because the test-taker must read a classroom scenario and map it onto the correct attribution-bias label rather than recall a definition; the distractors name real but inapplicable effects.",
    pattern: 'Students label situationally driven behavior as a stable personal trait, ignoring contextual causes.',
    d: {
      B: ['L1', 'Lexical', 'The student believed the halo effect explains judging behavior as a fixed personal trait.', 'Halo effect (one trait biasing unrelated judgments) versus dispositional attribution error'],
      C: ['L1', 'Lexical', 'The student believed the Hawthorne effect describes attributing behavior to a student disposition.', 'Hawthorne effect (reactivity to observation) versus attribution bias'],
      D: ['L2', 'Conceptual', 'The student believed self-serving bias means blaming a student rather than protecting one’s own esteem.', 'Self-serving bias (protecting one’s own self-image) versus attributions about others'],
    },
  },
  {
    skill: 'DIV-03', cc: 'Recall', correct: 'C', tag: 'label-retrieval', obj: ['IV.A.1.c'],
    stem: "In evaluation, the 'halo effect' refers to which of the following?",
    A: 'Rating a student lower because a higher-performing peer was observed immediately before',
    B: 'A temporary performance boost that occurs because a student knows they are being observed',
    C: 'Allowing one favorable impression of a student to positively bias judgments of their unrelated traits',
    D: "Attributing a student's success to luck rather than to ability",
    construct: 'Definition of the halo effect as a single favorable impression biasing judgments of a student’s unrelated traits',
    why: "This is a Recall item because it asks for the textbook definition of the halo effect with no scenario to interpret; each distractor is the definition of a different, named effect.",
    pattern: 'Students confuse the halo effect with contrast, reactivity, or attribution effects.',
    d: {
      A: ['L1', 'Lexical', 'The student believed the halo effect is the contrast effect of comparing a student to a prior peer.', 'Halo effect versus contrast effect'],
      B: ['L1', 'Lexical', 'The student believed the halo effect is reactivity to being observed rather than a rating bias.', 'Halo effect versus Hawthorne/observer reactivity'],
      D: ['L2', 'Conceptual', 'The student believed the halo effect means crediting outcomes to luck instead of ability.', 'Halo effect versus attribution of causes'],
    },
  },
  {
    skill: 'DIV-03', cc: 'Application', correct: 'D', tag: 'causation-correlation', obj: ['IV.A.1.c'],
    stem: "Teachers were told that certain randomly selected students were 'academic bloomers,' and those students later showed greater gains than peers. This pattern most directly demonstrates:",
    A: 'Regression to the mean', B: 'Stereotype threat', C: 'The contrast effect',
    D: 'The self-fulfilling prophecy (Pygmalion/expectancy effect), in which teacher expectations shape student outcomes',
    construct: 'Self-fulfilling prophecy / expectancy effects whereby teacher beliefs about students causally shape student performance',
    why: "This is an Application item because the test-taker must interpret a classic expectancy study and identify the operating mechanism rather than recall a term; the distractors are plausible but causally wrong.",
    pattern: 'Students attribute expectancy-driven gains to statistical artifacts or unrelated phenomena.',
    d: {
      A: ['L2', 'Conceptual', 'The student believed the gains were only regression to the mean rather than teacher-expectation effects.', 'Self-fulfilling prophecy versus regression to the mean'],
      B: ['L2', 'Conceptual', 'The student believed stereotype threat, not positive teacher expectations, explained the students’ improvement.', 'Expectancy gains versus stereotype-threat decrements'],
      C: ['L1', 'Lexical', 'The student believed the contrast effect accounted for the bloomers’ measured academic gains.', 'Expectancy effects versus contrast effects'],
    },
  },
  {
    skill: 'DIV-03', cc: 'Recall', correct: 'A', tag: 'label-retrieval', obj: ['IV.A.1.c'],
    stem: 'Which statement best distinguishes implicit bias from explicit bias?',
    A: 'Implicit bias operates automatically and outside conscious awareness, whereas explicit bias reflects consciously held and endorsed attitudes',
    B: 'Implicit bias is always intentional, whereas explicit bias is always accidental',
    C: 'Implicit bias affects only test scores, whereas explicit bias affects only discipline',
    D: 'Implicit and explicit bias are identical, so the two terms are interchangeable',
    construct: 'Distinction between implicit (automatic, unconscious) and explicit (conscious, endorsed) bias',
    why: "This is a Recall item because it asks the test-taker to retrieve the defining contrast between implicit and explicit bias; the distractors invert, narrow, or collapse the distinction.",
    pattern: 'Students conflate implicit and explicit bias or misattribute intentionality to each.',
    d: {
      B: ['L2', 'Conceptual', 'The student believed implicit bias is intentional while explicit bias is merely accidental behavior.', 'Awareness/endorsement criterion versus intentionality in defining bias types'],
      C: ['L2', 'Conceptual', 'The student believed each bias type affects only one narrow outcome such as scores or discipline.', 'General influence of bias across decisions versus domain-restricted effects'],
      D: ['L1', 'Lexical', 'The student believed implicit and explicit bias are the same thing under two names.', 'Distinguishing implicit from explicit bias versus treating them as identical'],
    },
  },
  {
    skill: 'DIV-03', cc: 'Application', correct: 'C', tag: 'model-conflation', obj: ['IV.A.1.d'],
    stem: 'A principal gives identical resources to every classroom regardless of student need. A school psychologist advocating for equity would most likely recommend:',
    A: 'Continuing identical allocation because it treats every classroom the same',
    B: 'Removing all supplemental supports so that no classroom is favored',
    C: 'Distributing resources in proportion to differing student needs so that each student has a fair opportunity to meet the same high standards',
    D: 'Allocating the most resources to the highest-achieving classrooms',
    construct: 'Equity (need-based distribution toward a fair opportunity to meet shared standards) versus equality (identical distribution) in allocating school resources',
    why: "This is an Application item because the test-taker must translate the principle of equity into an allocation decision within a scenario; the distractors confuse equity with equality, austerity, or merit.",
    pattern: 'Students conflate equity with equality and treat identical distribution as fair.',
    d: {
      A: ['L2', 'Conceptual', 'The student believed equity means giving every classroom exactly the same resources regardless of need.', 'Equity (need-based) versus equality (identical distribution)'],
      B: ['L3', 'Conceptual', 'The student believed fairness requires removing supports so that no group receives extra help.', 'Equitable provision of need-based supports versus eliminating supports'],
      D: ['L3', 'Conceptual', 'The student believed equity directs the most resources to the highest-performing classrooms.', 'Need-based equity versus merit-based allocation'],
    },
  },
  {
    skill: 'DIV-03', cc: 'Application', correct: 'D', tag: 'causation-correlation', obj: ['IV.A.1.c'],
    stem: "A team repeatedly explains a multilingual student's struggles by citing 'lack of motivation' and a 'chaotic home life.' A school psychologist names this as deficit thinking and recommends:",
    A: "Lowering academic expectations to match the student's background",
    B: "Referring the student for special education to resolve the home problems",
    C: "Documenting the family's deficits more thoroughly to justify services",
    D: "Reframing around student and community assets and examining instructional and systemic factors within the school's control",
    construct: 'Deficit thinking as a bias that locates failure in the student or family, countered by asset-based framing and examination of systemic factors',
    why: "This is an Application item because the test-taker must recognize deficit thinking in a team's reasoning and select the asset-based, systems-oriented response; the distractors extend the deficit frame.",
    pattern: 'Students respond to struggle by locating blame in the student or family rather than examining systemic and instructional factors.',
    d: {
      A: ['L2', 'Conceptual', 'The student believed the right response to background factors is to lower academic expectations.', 'High expectations with support versus lowered expectations'],
      B: ['L3', 'Conceptual', 'The student believed a special-education referral is how a team should resolve home-life concerns.', 'Asset-based systemic response versus referral driven by deficit framing'],
      C: ['L2', 'Conceptual', 'The student believed documenting family deficits more fully is the appropriate professional next step.', 'Asset-based reframing versus deeper deficit documentation'],
    },
  },
  {
    skill: 'DIV-03', cc: 'Application', correct: 'A', tag: 'overgeneralization', obj: ['IV.A.1.c'],
    stem: "A school psychologist wants to reduce the chance that implicit bias shapes how staff interpret an individual student's classroom behavior. The strategy with the strongest evidence is to:",
    A: 'Gather specific, individuating information about the particular student rather than relying on global impressions or group-based assumptions',
    B: "Encourage staff to ignore the student's background and 'not see' group membership",
    C: "Defer to the most experienced staff member's gut impression",
    D: 'Reach a judgment quickly before staff have time to overthink it',
    construct: 'Individuating information (specific person-level data) as the evidence-based counter to stereotype-based, group-driven judgments of a student’s behavior',
    why: "This is an Application item because the test-taker must select the debiasing strategy for interpreting one student's behavior; the distractors are popular but ineffective approaches (colorblindness, intuition, speed).",
    pattern: 'Students rely on global impressions, colorblindness, or intuition instead of individuating information when judging a student’s behavior.',
    d: {
      B: ['L3', 'Conceptual', 'The student believed ignoring group membership through a colorblind stance is the most effective debiasing strategy.', 'Individuating information versus colorblind ideology'],
      C: ['L2', 'Conceptual', 'The student believed an experienced colleague’s gut impression reliably prevents biased judgments of behavior.', 'Individuating data versus reliance on clinical intuition'],
      D: ['L3', 'Procedural', 'The student believed reaching a judgment quickly reduces the influence of implicit bias on behavior interpretation.', 'Deliberate individuating analysis versus speed as a debiasing tactic'],
    },
  },
  {
    skill: 'DIV-03', cc: 'Application', correct: 'C', tag: 'causation-correlation', obj: ['IV.A.1.d'],
    stem: "Reframing a persistent 'achievement gap' as an 'opportunity gap' primarily shifts attention toward:",
    A: 'The innate ability differences presumed to exist between student groups',
    B: 'The need to lower standards for some student groups',
    C: 'Inequities in access to resources, qualified teachers, and learning opportunities that produce disparate outcomes',
    D: 'Individual students’ effort and grit as the main lever for change',
    construct: 'Opportunity-gap framing locating disparities in unequal access and resources rather than in student deficits (achievement-gap framing)',
    why: "This is an Application item because the test-taker must interpret what an opportunity-gap reframe foregrounds; the distractors keep the locus of explanation inside the student.",
    pattern: 'Students explain group outcome gaps through innate ability or individual effort rather than systemic opportunity.',
    d: {
      A: ['L3', 'Conceptual', 'The student believed an opportunity-gap frame points to innate ability differences between groups.', 'Systemic opportunity inequities versus innate-ability explanations'],
      B: ['L2', 'Conceptual', 'The student believed reframing the gap implies lowering academic standards for some groups.', 'Expanding opportunity versus lowering standards'],
      D: ['L2', 'Conceptual', 'The student believed the reframe still locates the gap in individual student effort and grit.', 'Opportunity/access focus versus individual-effort focus'],
    },
  },
  {
    skill: 'DIV-03', cc: 'Application', correct: 'D', tag: 'eligibility-criteria-confusion', obj: ['IV.A.1.d', 'IV.A.1.c'],
    stem: 'To reduce the influence of referral bias in identifying students for gifted services, the most defensible system-level practice is to:',
    A: 'Require two teacher nominations before any student may be tested',
    B: 'Test only those students whose parents formally request evaluation',
    C: 'Raise the cutoff score to make the program more selective',
    D: 'Implement universal screening of all students with locally normed, culturally responsive measures',
    construct: 'Universal screening with local, culturally responsive norms to counter referral and gatekeeping bias in gifted identification',
    why: "This is an Application item because the test-taker must choose the system-level practice that minimizes biased gatekeeping; the distractors preserve or worsen the referral filter.",
    pattern: 'Students rely on teacher- or parent-initiated referral gates that transmit bias instead of screening universally.',
    d: {
      A: ['L3', 'Procedural', 'The student believed requiring teacher nominations first reduces rather than transmits referral bias.', 'Universal screening versus nomination-gated identification'],
      B: ['L3', 'Procedural', 'The student believed limiting testing to parent-requested cases produces equitable identification.', 'Universal screening versus parent-request gating'],
      C: ['L2', 'Conceptual', 'The student believed raising the cutoff makes gifted identification more equitable.', 'Equitable access via screening versus increased selectivity'],
    },
  },

  // ───────────────────────── DBD-09 — Ecological Assessment (+8) ─────────────────────────
  {
    skill: 'DBD-09', cc: 'Application', correct: 'C', tag: 'component-confusion', obj: ['I.A.2.h'],
    stem: 'A student behaves well at home and in sports but struggles only during the school day, and home and school rarely communicate. An ecological assessment would focus on which Bronfenbrenner level?',
    A: 'The microsystem', B: 'The macrosystem',
    C: "The mesosystem — the interactions and congruence between the child's microsystems, such as home and school",
    D: 'The chronosystem',
    construct: "Mesosystem as the connections and congruence between a child's microsystems (e.g., home–school) in Bronfenbrenner's ecological model",
    why: "This is an Application item because the test-taker must map a cross-setting scenario onto the correct ecological level rather than recall its definition; the distractors are adjacent Bronfenbrenner systems.",
    pattern: 'Students locate cross-setting (home–school link) problems in a single microsystem or a distal system.',
    d: {
      A: ['L2', 'Conceptual', 'The student believed a home–school communication gap is a single-microsystem rather than a mesosystem issue.', 'Mesosystem (links between settings) versus a single microsystem'],
      B: ['L2', 'Conceptual', 'The student believed broad societal values, not home–school links, are the focus in this scenario.', 'Mesosystem versus macrosystem'],
      D: ['L1', 'Lexical', 'The student believed the time dimension, not the home–school link, was central here.', 'Mesosystem versus chronosystem'],
    },
  },
  {
    skill: 'DBD-09', cc: 'Application', correct: 'A', tag: 'purpose-confusion', obj: ['I.A.2.h'],
    stem: 'A school psychologist gathers Review, Interview, Observation, and Test data across Instruction, Curriculum, Environment, and the Learner. This RIOT/ICEL matrix is designed to:',
    A: 'Systematically sample multiple sources and domains so that problems are not prematurely located within the learner',
    B: 'Replace direct observation with standardized testing',
    C: 'Determine a special-education eligibility category from a single data source',
    D: 'Rank students by ability for placement decisions',
    construct: 'RIOT/ICEL matrix as a multi-source, multi-domain ecological assessment heuristic that examines instruction, curriculum, and environment before the learner',
    why: "This is an Application item because the test-taker must infer the purpose of an ecological assessment framework from its structure; the distractors describe reductive or single-source uses it is meant to prevent.",
    pattern: 'Students treat ecological frameworks as single-source eligibility or ranking tools rather than multi-source problem analysis.',
    d: {
      B: ['L2', 'Conceptual', 'The student believed the RIOT/ICEL matrix replaces observation with standardized testing.', 'Multi-method sampling versus substituting tests for observation'],
      C: ['L3', 'Procedural', 'The student believed the matrix yields an eligibility category from one source of data.', 'Convergent multi-source analysis versus single-source eligibility decisions'],
      D: ['L3', 'Conceptual', 'The student believed the framework exists to rank students by ability for placement.', 'Ecological problem analysis versus ability ranking'],
    },
  },
  {
    skill: 'DBD-09', cc: 'Application', correct: 'D', tag: 'causation-correlation', obj: ['I.A.2.h'],
    stem: 'A highly active child is constantly redirected in a rigid, low-movement classroom but thrives in an active, structured one. This contrast is best described by the ecological concept of:',
    A: 'Fixed temperament', B: 'Learned helplessness', C: 'Diagnostic overshadowing',
    D: 'Goodness-of-fit between the child’s temperament and the demands of the environment',
    construct: "Goodness-of-fit between child temperament and environmental demands as an ecological explanation of behavior",
    why: "This is an Application item because the test-taker must interpret a temperament-by-environment interaction and label it; the distractors name within-child traits or unrelated phenomena.",
    pattern: 'Students attribute behavior to a fixed within-child trait instead of a temperament–environment interaction.',
    d: {
      A: ['L2', 'Conceptual', 'The student believed the behavior reflects a fixed temperament rather than a temperament–environment fit.', 'Goodness-of-fit (interaction) versus fixed within-child temperament'],
      B: ['L2', 'Conceptual', 'The student believed learned helplessness explains a child who thrives in a different setting.', 'Goodness-of-fit versus learned helplessness'],
      C: ['L1', 'Lexical', 'The student believed diagnostic overshadowing describes the temperament-by-setting contrast shown.', 'Goodness-of-fit versus diagnostic overshadowing'],
    },
  },
  {
    skill: 'DBD-09', cc: 'Recall', correct: 'C', tag: 'component-confusion', obj: ['I.A.2.h'],
    stem: "In Bronfenbrenner's model, the 'chronosystem' refers to:",
    A: 'The immediate settings in which a child directly participates',
    B: 'Cultural values, laws, and broad societal ideologies',
    C: 'The dimension of time, including life transitions and sociohistorical changes that shape development',
    D: 'The connections between two of a child’s microsystems',
    construct: "Chronosystem as the time dimension (transitions and sociohistorical change) in Bronfenbrenner's ecological model",
    why: "This is a Recall item because it asks for the textbook meaning of the chronosystem with no scenario to interpret; each distractor defines a different ecological level.",
    pattern: 'Students confuse the chronosystem with the micro-, macro-, or mesosystem.',
    d: {
      A: ['L1', 'Lexical', 'The student believed the chronosystem is the set of immediate settings a child takes part in.', 'Chronosystem versus microsystem'],
      B: ['L1', 'Lexical', 'The student believed the chronosystem refers to cultural values and societal ideologies.', 'Chronosystem versus macrosystem'],
      D: ['L1', 'Lexical', 'The student believed the chronosystem is the link between two microsystems.', 'Chronosystem versus mesosystem'],
    },
  },
  {
    skill: 'DBD-09', cc: 'Application', correct: 'A', tag: 'causation-correlation', obj: ['I.A.2.h'],
    stem: "Before concluding that a student's reading difficulty reflects a within-child disability, an ecological approach requires the team to first rule out:",
    A: 'Inadequate or misaligned instruction, limited opportunity to learn, and curricular mismatch',
    B: "The student's motivation and effort",
    C: "The parents' level of education", D: "The student's birth order",
    construct: 'Ruling out instructional, curricular, and opportunity-to-learn (exclusionary) factors before attributing difficulty to a within-child disability',
    why: "This is an Application item because the test-taker must apply the exclusionary-factor principle to a referral decision; the distractors substitute non-instructional or within-child explanations.",
    pattern: 'Students skip ruling out instructional and ecological causes before inferring a disability.',
    d: {
      B: ['L2', 'Conceptual', 'The student believed motivation and effort are the first factors to rule out before a disability claim.', 'Instructional/ecological exclusionary factors versus student effort'],
      C: ['L2', 'Conceptual', 'The student believed parental education is the key factor to rule out before identifying a disability.', 'Instructional quality versus family demographic attribution'],
      D: ['L1', 'Lexical', 'The student believed birth order is a relevant factor to exclude before a disability decision.', 'Instructional/ecological factors versus irrelevant demographic variables'],
    },
  },
  {
    skill: 'DBD-09', cc: 'Application', correct: 'D', tag: 'role-confusion', obj: ['I.A.2.h'],
    stem: 'An ecological assessment reveals a neighborhood with few safe after-school spaces, which is affecting several students’ homework completion. A systems-oriented response would be to:',
    A: 'Assign more individual homework to build responsibility',
    B: 'Refer each affected student for an emotional-disability evaluation',
    C: 'Conclude that the students simply lack motivation',
    D: 'Partner with community organizations to expand supervised after-school and homework supports',
    construct: 'Translating a community-level ecological finding (limited after-school resources) into a systems-level, community-partnership intervention',
    why: "This is an Application item because the test-taker must convert a community-level ecological finding into a systems-level intervention; the distractors keep the response at the individual or deficit level.",
    pattern: 'Students answer a community-level problem with individual or deficit-based responses.',
    d: {
      A: ['L2', 'Conceptual', 'The student believed assigning more homework is the right response to a community-resource gap.', 'Community/systems intervention versus increased individual demands'],
      B: ['L3', 'Procedural', 'The student believed individual disability referrals address a neighborhood-resource problem.', 'Exosystem-level response versus individual eligibility referral'],
      C: ['L2', 'Conceptual', 'The student believed lack of motivation, not resources, explains the homework problem.', 'Ecological/contextual explanation versus motivational attribution'],
    },
  },
  {
    skill: 'DBD-09', cc: 'Application', correct: 'C', tag: 'causation-correlation', obj: ['I.A.2.h'],
    stem: 'Data show that a struggling class received far fewer minutes of actual reading instruction than peers because of frequent interruptions. Ecologically, this is best understood as a problem of:',
    A: 'Student aptitude', B: 'Test bias',
    C: 'Opportunity to learn — the quantity and quality of instruction actually delivered',
    D: 'Parental involvement',
    construct: 'Opportunity to learn (instructional time and quality actually delivered) as an ecological determinant of achievement',
    why: "This is an Application item because the test-taker must interpret instructional-time data through the opportunity-to-learn construct; the distractors relocate the cause to the student, the test, or the home.",
    pattern: 'Students overlook delivered instruction (opportunity to learn) and attribute low achievement to the student or family.',
    d: {
      A: ['L2', 'Conceptual', 'The student believed aptitude, not delivered instruction, best explains the class’s reading difficulty.', 'Opportunity to learn versus aptitude attribution'],
      B: ['L2', 'Conceptual', 'The student believed test bias explains a difference driven by lost instructional minutes.', 'Opportunity to learn versus test-bias explanation'],
      D: ['L2', 'Conceptual', 'The student believed parental involvement is the ecological factor at issue here.', 'Instructional opportunity versus home-involvement attribution'],
    },
  },
  {
    skill: 'DBD-09', cc: 'Application', correct: 'A', tag: 'component-confusion', obj: ['I.A.2.h'],
    stem: 'A student completes math accurately at home but rarely does so in class. An ecological assessment distinguishing a performance deficit from a skill deficit would conclude the issue is most likely:',
    A: 'A performance deficit driven by environmental or motivational conditions rather than an absent skill',
    B: 'A skill deficit requiring re-teaching of the math content',
    C: 'An intellectual disability', D: 'A vision impairment',
    construct: 'Distinguishing a performance deficit (can-do, context-dependent) from a skill deficit (cannot-do) using cross-setting ecological data',
    why: "This is an Application item because the test-taker must use cross-setting data to classify the difficulty as a performance versus skill deficit; the distractors ignore that the student can do the work elsewhere.",
    pattern: 'Students treat context-dependent (can-do) difficulties as skill deficits or within-child disabilities.',
    d: {
      B: ['L2', 'Conceptual', 'The student believed work that is accurate at home still indicates a skill deficit needing re-teaching.', 'Performance deficit (context-dependent) versus skill deficit (cannot perform)'],
      C: ['L3', 'Conceptual', 'The student believed inconsistent classroom performance points to an intellectual disability.', 'Performance deficit versus intellectual disability'],
      D: ['L1', 'Lexical', 'The student believed a vision impairment best explains accurate math at home but not at school.', 'Ecological performance analysis versus sensory-impairment attribution'],
    },
  },

  // ───────────────────────── PSY-01 — Test Scores, Norms (+8) ─────────────────────────
  {
    skill: 'PSY-01', cc: 'Recall', correct: 'C', tag: 'label-retrieval', obj: ['I.A.3.b'],
    stem: 'In a normal distribution, approximately what percentage of scores fall within one standard deviation of the mean?',
    A: 'About 50%', B: 'About 95%', C: 'About 68%', D: 'About 99%',
    construct: 'Proportion of cases within ±1 SD of the mean (≈68%) in a normal distribution',
    why: "This is a Recall item because it asks the test-taker to retrieve a fixed property of the normal curve; the distractors are the percentages associated with other standard-deviation bands.",
    pattern: 'Students confuse the ±1 SD (≈68%) band with the ±2 SD (≈95%) or ±3 SD bands or the median.',
    d: {
      A: ['L1', 'Lexical', 'The student believed about half of all scores fall within one standard deviation of the mean.', 'Normal-curve ±1 SD proportion versus the median split'],
      B: ['L2', 'Conceptual', 'The student believed roughly 95% of scores fall within one standard deviation of the mean.', '±1 SD (≈68%) band versus the ±2 SD (≈95%) band'],
      D: ['L2', 'Conceptual', 'The student believed about 99% of scores fall within a single standard deviation of the mean.', '±1 SD band versus the ±3 SD (≈99.7%) band'],
    },
  },
  {
    skill: 'PSY-01', cc: 'Recall', correct: 'A', tag: 'norm-criterion-confusion', obj: ['I.A.3.b'],
    stem: 'Which interpretation is criterion-referenced rather than norm-referenced?',
    A: "'The student mastered 90% of the grade-level fractions objectives'",
    B: "'The student scored at the 90th percentile compared with peers'",
    C: "'The student's standard score was 115, one standard deviation above the mean'",
    D: "'The student's stanine was 7 relative to the norm group'",
    construct: 'Distinguishing criterion-referenced interpretation (performance against a standard) from norm-referenced interpretation (performance against peers)',
    why: "This is a Recall item because it asks the test-taker to classify interpretations by reference frame; the distractors are all peer-referenced scores presented as if criterion-referenced.",
    pattern: 'Students misclassify peer-referenced scores (percentile, standard score, stanine) as criterion-referenced.',
    d: {
      B: ['L2', 'Conceptual', 'The student believed a percentile-rank statement is a criterion-referenced interpretation of mastery.', 'Criterion-referenced mastery versus norm-referenced percentile rank'],
      C: ['L2', 'Conceptual', 'The student believed a standard score relative to the mean is criterion-referenced.', 'Criterion reference versus norm-referenced standard scores'],
      D: ['L2', 'Conceptual', 'The student believed a stanine relative to the norm group is a criterion-referenced score.', 'Criterion reference versus norm-referenced stanines'],
    },
  },
  {
    skill: 'PSY-01', cc: 'Application', correct: 'D', tag: 'validity-reliability-confusion', obj: ['I.A.3.b'],
    stem: "A test's lowest possible standard score is 70, but a young student clearly performs well below that level. This 'floor effect' means the test:",
    A: "Overestimates the student's weaknesses", B: 'Is perfectly suited to this student',
    C: 'Has excellent discrimination at the low end',
    D: 'Cannot adequately discriminate among very low-performing examinees, so the score may understate the degree of deficit',
    construct: "Floor effect limiting a test's ability to discriminate among low-performing examinees, risking an understated estimate of deficit",
    why: "This is an Application item because the test-taker must reason about how a score floor affects interpretation for a specific low-performing student; the distractors invert or ignore the effect.",
    pattern: 'Students treat a score at the test floor as an accurate estimate rather than a lower bound.',
    d: {
      A: ['L2', 'Conceptual', 'The student believed a floor effect overstates a low-performing student’s weaknesses.', 'Floor effect understating versus overstating degree of deficit'],
      B: ['L2', 'Conceptual', 'The student believed a test is well suited to a student scoring at its floor.', 'Recognizing a floor effect versus assuming adequate measurement'],
      C: ['L2', 'Conceptual', 'The student believed a floor effect indicates strong discrimination at the low end.', 'Floor effect (poor low-end discrimination) versus strong discrimination'],
    },
  },
  {
    skill: 'PSY-01', cc: 'Recall', correct: 'C', tag: 'purpose-confusion', obj: ['I.A.3.b'],
    stem: "On an individually administered test, 'basal' and 'ceiling' rules are used to:",
    A: 'Convert raw scores into percentile ranks',
    B: 'Establish the confidence interval around a score',
    C: 'Define the start and stop points so that only an appropriate range of items is administered',
    D: 'Determine whether the norms are current',
    construct: 'Purpose of basal and ceiling rules in defining the administered item range on individually administered tests',
    why: "This is a Recall item because it asks for the function of basal and ceiling rules; the distractors name other, unrelated psychometric procedures.",
    pattern: 'Students confuse administration rules (basal/ceiling) with scoring, error, or norming procedures.',
    d: {
      A: ['L1', 'Lexical', 'The student believed basal and ceiling rules convert raw scores into percentile ranks.', 'Item-range administration rules versus score transformation'],
      B: ['L2', 'Conceptual', 'The student believed basal and ceiling rules set the confidence interval around a score.', 'Basal/ceiling administration rules versus standard error of measurement'],
      D: ['L2', 'Conceptual', 'The student believed basal and ceiling rules indicate whether a test’s norms are current.', 'Administration start/stop rules versus norm recency'],
    },
  },
  {
    skill: 'PSY-01', cc: 'Application', correct: 'A', tag: 'validity-reliability-confusion', obj: ['I.A.3.c'],
    stem: "A high-school student's self-report depression inventory shows no concerns, but teachers and parents report significant symptoms. A key limitation of self-report measures that could explain this is:",
    A: 'Susceptibility to social-desirability and response bias, so respondents may underreport symptoms',
    B: 'That self-reports are immune to bias and therefore the most accurate source',
    C: 'That self-reports measure intelligence rather than mood',
    D: 'That self-reports cannot be scored numerically',
    construct: 'Social-desirability and response bias as a limitation of self-report inventories that can produce underreporting',
    why: "This is an Application item because the test-taker must apply knowledge of self-report limitations to explain an informant discrepancy; the distractors deny the limitation or misstate what the measure assesses.",
    pattern: 'Students treat self-report as bias-free truth and ignore underreporting from social desirability.',
    d: {
      B: ['L3', 'Conceptual', 'The student believed self-report inventories are immune to bias and the most accurate source.', 'Self-report limitations (response bias) versus assumed bias-free accuracy'],
      C: ['L1', 'Lexical', 'The student believed a self-report depression inventory measures intelligence rather than mood.', 'Construct measured by a self-report inventory'],
      D: ['L1', 'Lexical', 'The student believed self-report inventories cannot be scored numerically.', 'Scorability of self-report inventories'],
    },
  },
  {
    skill: 'PSY-01', cc: 'Application', correct: 'D', tag: 'validity-reliability-confusion', obj: ['I.A.3.c'],
    stem: 'Compared with an unstructured clinical interview, a structured diagnostic interview primarily improves:',
    A: 'The rapport between clinician and student', B: 'The speed of administration',
    C: 'The reading level required of the student',
    D: 'The reliability and consistency of the information gathered across clinicians',
    construct: 'Structured interviews improving the reliability and consistency of data relative to unstructured interviews',
    why: "This is an Application item because the test-taker must identify the psychometric advantage structure confers; the distractors cite features unrelated to or worsened by structure.",
    pattern: 'Students attribute the value of structured interviews to rapport or speed rather than reliability.',
    d: {
      A: ['L2', 'Conceptual', 'The student believed the main gain of a structured interview is greater rapport with the student.', 'Reliability gains versus rapport effects of interview structure'],
      B: ['L2', 'Conceptual', 'The student believed structured interviews are valuable chiefly because they are faster.', 'Reliability gains versus administration speed'],
      C: ['L1', 'Lexical', 'The student believed a structured interview changes the reading level required of the student.', 'Interviewer-administered reliability versus examinee reading demands'],
    },
  },
  {
    skill: 'PSY-01', cc: 'Application', correct: 'C', tag: 'validity-reliability-confusion', obj: ['I.A.3.c'],
    stem: 'Parent and teacher behavior-rating scales for the same child disagree substantially. The most appropriate interpretation is that:',
    A: 'One rater must be inaccurate and should be excluded',
    B: 'The scales are invalid and should be discarded',
    C: 'Behavior is situation-specific, so informant discrepancies provide meaningful cross-setting information rather than error to be eliminated',
    D: 'The child therefore has two different disorders',
    construct: 'Interpreting cross-informant rating discrepancies as meaningful situational variance rather than measurement error to discard',
    why: "This is an Application item because the test-taker must interpret informant disagreement using knowledge of rating-scale limitations; the distractors treat discrepancy as error or as diagnosis.",
    pattern: 'Students treat cross-informant disagreement as error to discard rather than situational signal.',
    d: {
      A: ['L2', 'Conceptual', 'The student believed one rater must be wrong and should simply be excluded from consideration.', 'Cross-setting variance versus discarding a discrepant informant'],
      B: ['L2', 'Conceptual', 'The student believed disagreeing rating scales are invalid and should be thrown out.', 'Interpreting discrepancy versus discarding the measures'],
      D: ['L3', 'Conceptual', 'The student believed differing parent and teacher ratings mean the child has two disorders.', 'Situational behavior variation versus separate diagnoses'],
    },
  },
  {
    skill: 'PSY-01', cc: 'Application', correct: 'A', tag: 'population-confusion', obj: ['I.A.3.b'],
    stem: "Before interpreting a student's standard score, a psychologist verifies the test's norm sample. The most important reason is that scores are only meaningful when:",
    A: 'The norm sample adequately represents the population to which the student is being compared',
    B: 'The norm sample is as large as possible regardless of whom it included',
    C: 'The norms were collected within the same school district',
    D: 'The norm sample includes only students with disabilities',
    construct: 'Representativeness and appropriateness of the norm reference group as a precondition for valid norm-referenced interpretation',
    why: "This is an Application item because the test-taker must justify checking the norm sample before interpreting a score; the distractors substitute size, locality, or an inappropriate reference group for representativeness.",
    pattern: 'Students prioritize sample size or locality over representativeness when judging norm adequacy.',
    d: {
      B: ['L2', 'Conceptual', 'The student believed a very large norm sample is sufficient regardless of who is in it.', 'Representativeness of the norm group versus raw sample size'],
      C: ['L2', 'Conceptual', 'The student believed norms must come from the student’s own district to be valid.', 'Population representativeness versus local-only norming'],
      D: ['L3', 'Conceptual', 'The student believed a general standard score should be referenced only to a disability sample.', 'Appropriate reference population versus a restricted clinical sample'],
    },
  },

  // ───────────────────────── PSY-04 — Assessment of CLD Students (+8) ─────────────────────────
  {
    skill: 'PSY-04', cc: 'Application', correct: 'A', tag: 'norm-criterion-confusion', obj: ['I.A.4.b'],
    stem: 'A psychologist proposes administering an English cognitive test that an interpreter translates into Spanish on the spot. The most important psychometric problem is that:',
    A: "Ad hoc translation invalidates the test's standardization and norms, so resulting scores cannot be interpreted against the published norm group",
    B: 'Translation makes the test too easy',
    C: 'Spanish has no vocabulary equivalent to the English items',
    D: 'The interpreter will steer the student toward correct answers',
    construct: "Ad hoc translation of a standardized test invalidating its standardization and norms, precluding norm-referenced interpretation",
    why: "This is an Application item because the test-taker must evaluate a proposed assessment practice and identify the standardization threat; the distractors raise minor or inaccurate concerns.",
    pattern: 'Students assume an on-the-fly translation preserves the validity of standardized norms.',
    d: {
      B: ['L2', 'Conceptual', 'The student believed translating a standardized test simply makes the items easier.', 'Loss of standardization/norms versus a change in item difficulty'],
      C: ['L1', 'Lexical', 'The student believed Spanish lacks vocabulary to express the test items at all.', 'Standardization invalidity versus claims about language vocabulary'],
      D: ['L2', 'Conceptual', 'The student believed the central problem is an interpreter cuing the student to answers.', 'Invalidated norms versus interpreter-coaching concerns'],
    },
  },
  {
    skill: 'PSY-04', cc: 'Application', correct: 'C', tag: 'validity-reliability-confusion', obj: ['I.A.4.b', 'I.A.3.e'],
    stem: 'When interpreting an English-language cognitive battery for an English learner, organizing subtests by their degree of cultural loading and linguistic demand helps the psychologist:',
    A: 'Convert the scores into grade equivalents',
    B: "Increase the student's processing speed",
    C: 'Judge how much language and acculturation may have depressed scores, since the most culturally and linguistically demanding subtests are most affected',
    D: 'Establish special-education eligibility automatically',
    construct: 'Using cultural-loading and linguistic-demand gradients to interpret how language and acculturation may attenuate an ELL’s test scores',
    why: "This is an Application item because the test-taker must connect a sorting strategy to its interpretive purpose for an ELL; the distractors describe unrelated score conversions or automatic decisions.",
    pattern: 'Students overlook that language and cultural loading systematically depress some subtest scores for ELLs.',
    d: {
      A: ['L1', 'Lexical', 'The student believed sorting subtests by cultural loading converts scores into grade equivalents.', 'Interpreting attenuation by linguistic demand versus score conversion'],
      B: ['L1', 'Lexical', 'The student believed organizing subtests this way increases the student’s processing speed.', 'Interpretive purpose versus changing examinee performance'],
      D: ['L3', 'Procedural', 'The student believed the loading analysis by itself establishes special-education eligibility.', 'Interpretive caution versus automatic eligibility determination'],
    },
  },
  {
    skill: 'PSY-04', cc: 'Application', correct: 'D', tag: 'causation-correlation', obj: ['I.A.3.f'],
    stem: 'A measure shows lower average scores for one cultural group. In psychometric terms, this group difference by itself:',
    A: 'Proves the test is biased and must be discarded',
    B: 'Proves the test is fair', C: 'Indicates the test has low reliability',
    D: 'Does not by itself establish test bias, which requires evidence such as differential prediction or differential item functioning',
    construct: 'Group mean-score differences alone not constituting psychometric test bias, which requires evidence like differential prediction or DIF',
    why: "This is an Application item because the test-taker must distinguish a mean difference from statistical bias; the distractors equate the observed difference with proof of bias, fairness, or unreliability.",
    pattern: 'Students equate a group mean difference with proof of test bias.',
    d: {
      A: ['L2', 'Conceptual', 'The student believed a lower group average by itself proves the test is biased.', 'Mean differences versus psychometric evidence of bias'],
      B: ['L2', 'Conceptual', 'The student believed a group difference proves the test is fair to all groups.', 'Mean differences versus evidence of fairness'],
      C: ['L2', 'Conceptual', 'The student believed a group mean difference indicates the test has low reliability.', 'Bias evidence versus reliability'],
    },
  },
  {
    skill: 'PSY-04', cc: 'Application', correct: 'A', tag: 'population-confusion', obj: ['I.A.3.e'],
    stem: 'Two students share the same home language, but one immigrated last year and one was born in the United States. In planning assessment, a psychologist accounts for their differing levels of:',
    A: 'Acculturation, which influences familiarity with test content, format, and expectations',
    B: 'Innate intelligence', C: 'Articulation ability', D: 'Working-memory capacity',
    construct: 'Acculturation level as a personal and environmental factor influencing familiarity with test content and format in CLD assessment',
    why: "This is an Application item because the test-taker must identify the relevant moderating factor that differs between two same-language students; the distractors name within-child abilities unrelated to immigration history.",
    pattern: 'Students overlook acculturation and attribute test-familiarity differences to ability.',
    d: {
      B: ['L3', 'Conceptual', 'The student believed the relevant difference between the two students is innate intelligence.', 'Acculturation as an assessment factor versus innate ability'],
      C: ['L1', 'Lexical', 'The student believed articulation ability is what distinguishes the recent immigrant from the U.S.-born student.', 'Acculturation versus speech-articulation skill'],
      D: ['L2', 'Conceptual', 'The student believed working-memory capacity explains differences tied to immigration history.', 'Acculturation/experience versus a cognitive-capacity attribution'],
    },
  },
  {
    skill: 'PSY-04', cc: 'Application', correct: 'C', tag: 'component-confusion', obj: ['I.A.4.b'],
    stem: 'An English learner has strong conversational English but limited academic English and is fully literate in Spanish, her stronger academic language. For a cognitive assessment, the most appropriate decision about the language of administration is to:',
    A: 'Administer in English only, since she converses comfortably in English',
    B: 'Let the student choose whichever language she prefers on the day of testing',
    C: 'Select the language (or a bilingual approach) in which she can best demonstrate the underlying ability, recognizing that academic tasks draw on her stronger academic language',
    D: 'Use whichever language the examiner is most comfortable speaking',
    construct: 'Choosing the language/mode of administration that lets a CLD student best demonstrate the underlying construct, based on her academic-language profile rather than conversational fluency',
    why: "This is an Application item because the test-taker must apply a known proficiency profile to a language-of-administration decision; the distractors choose language by surface fluency, day-of preference, or examiner convenience.",
    pattern: 'Students choose the assessment language by conversational fluency or convenience rather than the student’s stronger academic language.',
    d: {
      A: ['L2', 'Conceptual', 'The student believed strong conversational English by itself justifies English-only cognitive assessment.', 'Language of administration by academic language versus conversational fluency'],
      B: ['L3', 'Procedural', 'The student believed letting the student pick the test-day language is the appropriate basis for selection.', 'Evidence-based language selection versus same-day student preference'],
      D: ['L2', 'Conceptual', 'The student believed the examiner’s own language comfort should determine the language of administration.', 'Student-centered language selection versus examiner convenience'],
    },
  },
  {
    skill: 'PSY-04', cc: 'Recall', correct: 'D', tag: 'eligibility-criteria-confusion', obj: ['I.A.4.b'],
    stem: "Under IDEA's evaluation requirements, which statement about the measures used to evaluate a culturally and linguistically diverse student is correct?",
    A: 'A single comprehensive test may serve as the sole criterion as long as it is well normed',
    B: 'Only measures that are available in English need be considered',
    C: 'The least expensive validated test should be used to conserve resources',
    D: 'A variety of assessment tools and strategies must be used, and no single measure may be the sole criterion for determining eligibility',
    construct: "IDEA requirement to use multiple assessment tools and strategies with no single measure as the sole eligibility criterion, applied to CLD evaluation",
    why: "This is a Recall item because it asks the test-taker to retrieve IDEA's multiple-measures requirement; the distractors describe single-test, English-only, or cost-based practices the statute prohibits.",
    pattern: 'Students believe a single well-normed test can be the sole basis for a CLD student’s eligibility.',
    d: {
      A: ['L2', 'Conceptual', 'The student believed one well-normed comprehensive test can be the sole criterion for eligibility.', 'Multiple-measures requirement versus a single-test eligibility decision'],
      B: ['L2', 'Conceptual', 'The student believed only English-available measures must be considered in a CLD evaluation.', 'Variety of appropriate tools versus English-only measures'],
      C: ['L1', 'Lexical', 'The student believed the cheapest validated test should drive the evaluation choice.', 'Multiple valid measures versus cost-driven selection'],
    },
  },
  {
    skill: 'PSY-04', cc: 'Recall', correct: 'A', tag: 'component-confusion', obj: ['I.A.3.f'],
    stem: 'A test item assumes experience with snow and therefore disadvantages students from tropical regions regardless of the construct being measured. This is an example of:',
    A: 'Content bias', B: 'Predictive bias', C: 'Construct bias', D: 'Reliability error',
    construct: 'Content bias (item content advantaging some groups) as distinct from predictive bias, construct bias, and unreliability',
    why: "This is a Recall item because it asks the test-taker to classify a described item flaw by bias type; the distractors are the other recognized forms of bias or measurement error.",
    pattern: 'Students confuse content bias with predictive or construct bias.',
    d: {
      B: ['L2', 'Conceptual', 'The student believed an item assuming snow experience is an example of predictive bias.', 'Content bias versus predictive (differential-prediction) bias'],
      C: ['L2', 'Conceptual', 'The student believed culture-specific item content is best labeled construct bias.', 'Content bias versus construct bias'],
      D: ['L1', 'Lexical', 'The student believed a culturally loaded item is simply a form of reliability error.', 'Content bias versus measurement reliability'],
    },
  },
  {
    skill: 'PSY-04', cc: 'Application', correct: 'C', tag: 'treatment-assessment-confusion', obj: ['I.A.4.b'],
    stem: 'To help distinguish a language difference from a disability in an English learner, the most defensible practice is to:',
    A: 'Rely on a single English achievement test',
    B: 'Wait until the student is fully English-proficient before acting',
    C: 'Examine the student’s response to high-quality, culturally and linguistically appropriate instruction over time, alongside other data sources',
    D: 'Compare the student only with native English speakers',
    construct: 'Using response to appropriate instruction (RTI/MTSS) plus convergent data to differentiate a language difference from a disability in ELLs',
    why: "This is an Application item because the test-taker must select the most defensible differentiation method; the distractors rely on a single biased source, indefinite delay, or an inappropriate comparison.",
    pattern: 'Students try to separate difference from disability with a single test or an inappropriate comparison group.',
    d: {
      A: ['L2', 'Conceptual', 'The student believed one English achievement test can distinguish a language difference from a disability.', 'Convergent response-to-instruction data versus a single test'],
      B: ['L2', 'Conceptual', 'The student believed the team should simply wait for full English proficiency before acting.', 'Progress-monitoring over time versus indefinite delay'],
      D: ['L3', 'Conceptual', 'The student believed comparing the ELL only with native English speakers is the appropriate method.', 'Appropriate comparison and instruction data versus a native-speaker-only reference'],
    },
  },

  // ───────────────────────── FAM-02 — Family Involvement/Advocacy (+8) ─────────────────────────
  {
    skill: 'FAM-02', cc: 'Recall', correct: 'C', tag: 'component-confusion', obj: ['III.C.1.b'],
    stem: "Epstein's framework of six types of family-school partnership includes parenting, communicating, volunteering, learning at home, decision-making, and:",
    A: 'Standardized testing', B: 'Disciplinary referral',
    C: 'Collaborating with the community', D: 'Retention and remediation',
    construct: "Epstein's sixth type of involvement (collaborating with the community) within the six-type family-school partnership framework",
    why: "This is a Recall item because it asks the test-taker to complete a named framework; the distractors are plausible school activities that are not Epstein partnership types.",
    pattern: "Students cannot complete Epstein's six types and substitute generic school activities.",
    d: {
      A: ['L1', 'Lexical', 'The student believed standardized testing is one of Epstein’s six types of family involvement.', "Epstein's collaborating-with-community type versus testing"],
      B: ['L1', 'Lexical', 'The student believed disciplinary referral is one of Epstein’s six involvement types.', "Epstein's partnership types versus disciplinary processes"],
      D: ['L1', 'Lexical', 'The student believed retention and remediation is one of Epstein’s six involvement types.', "Epstein's community-collaboration type versus instructional interventions"],
    },
  },
  {
    skill: 'FAM-02', cc: 'Application', correct: 'A', tag: 'purpose-confusion', obj: ['III.C.1.b'],
    stem: 'A leadership team wants to raise family involvement across the whole school, not just for individual families who are hard to reach. The most effective, equity-minded approach is to:',
    A: 'Build a sustained schoolwide engagement plan with multiple access points — flexible scheduling, interpretation, transportation, and two-way communication — embedded in school routines',
    B: 'Send a single annual newsletter in English only',
    C: 'Require attendance and penalize families who miss events',
    D: 'Delegate all family outreach to one staff volunteer to handle when time allows',
    construct: 'Designing a sustained, system-level schoolwide family-engagement structure with multiple access points rather than ad hoc, single-family, or one-off outreach',
    why: "This is an Application item because the test-taker must choose a system-level engagement design rather than a one-off or single-person fix; the distractors are narrow, coercive, or unsustainable.",
    pattern: 'Students treat schoolwide engagement as one-off events or single-staff outreach rather than a sustained system with multiple access points.',
    d: {
      B: ['L2', 'Conceptual', 'The student believed a single English-only newsletter is an adequate schoolwide engagement system.', 'Sustained multi-access engagement structure versus one-way English-only communication'],
      C: ['L3', 'Conceptual', 'The student believed mandating attendance and penalizing absences builds authentic schoolwide engagement.', 'Access-oriented engagement design versus coercive attendance rules'],
      D: ['L2', 'Conceptual', 'The student believed assigning all outreach to one occasional volunteer constitutes a schoolwide system.', 'Embedded schoolwide structure versus ad hoc single-person outreach'],
    },
  },
  {
    skill: 'FAM-02', cc: 'Application', correct: 'D', tag: 'role-confusion', obj: ['III.C.1.b'],
    stem: 'Which action best reflects authentic family involvement in school-level decision making rather than tokenism?',
    A: 'Inviting families to a meeting only after decisions are finalized',
    B: 'Asking families to sign off on a plan that is already written',
    C: 'Surveying families but neither sharing nor using the results',
    D: 'Including families as voting members of school-improvement and program-planning teams with real influence over decisions',
    construct: 'Authentic, non-tokenistic family participation in school governance and decision making versus symbolic consultation',
    why: "This is an Application item because the test-taker must distinguish genuine shared decision making from tokenism; the distractors describe after-the-fact or symbolic participation.",
    pattern: 'Students count after-the-fact or symbolic consultation as authentic family decision making.',
    d: {
      A: ['L2', 'Conceptual', 'The student believed inviting families after decisions are final is authentic involvement.', 'Shared decision making versus after-the-fact notification'],
      B: ['L2', 'Conceptual', 'The student believed having families sign a pre-written plan constitutes genuine participation.', 'Real influence on decisions versus ratifying a finished plan'],
      C: ['L3', 'Procedural', 'The student believed collecting family input without using it qualifies as decision-making involvement.', 'Acting on family input versus symbolic data collection'],
    },
  },
  {
    skill: 'FAM-02', cc: 'Application', correct: 'C', tag: 'purpose-confusion', obj: ['III.C.1.d'],
    stem: "A psychologist coaches a parent to ask open-ended questions and take turns during nightly book reading. This 'dialogic reading' is best described as:",
    A: 'A clinical therapy that requires a license to deliver',
    B: 'A retention-prevention testing strategy',
    C: 'An evidence-based home intervention that supports children’s language and literacy development',
    D: "A substitute for classroom reading instruction",
    construct: "Dialogic/shared reading as an evidence-based home intervention supporting children's language and literacy development",
    why: "This is an Application item because the test-taker must classify a coached home routine by its purpose; the distractors mislabel it as clinical therapy, testing, or a replacement for instruction.",
    pattern: 'Students misclassify home-support strategies as clinical treatment or as substitutes for school instruction.',
    d: {
      A: ['L2', 'Conceptual', 'The student believed dialogic reading is a licensed clinical therapy rather than a home support.', 'Evidence-based home intervention versus licensed clinical treatment'],
      B: ['L1', 'Lexical', 'The student believed dialogic reading is a strategy for preventing grade retention through testing.', 'Home literacy support versus a testing/retention strategy'],
      D: ['L2', 'Conceptual', 'The student believed a home reading routine is meant to replace classroom reading instruction.', 'Complementary home support versus a substitute for instruction'],
    },
  },
  {
    skill: 'FAM-02', cc: 'Application', correct: 'A', tag: 'purpose-confusion', obj: ['III.C.1.d'],
    stem: "A family wants strategies to manage a young child's tantrums at home. The school psychologist most appropriately recommends:",
    A: 'An evidence-based parent-training program that teaches consistent routines and positive reinforcement',
    B: 'Removing all limits in order to avoid conflict',
    C: 'Waiting until the behavior generalizes to school before acting',
    D: 'Referring the child directly for medication',
    construct: 'Evidence-based behavioral parent-training (consistent routines and reinforcement) as a safe, nurturing home behavior-support strategy',
    why: "This is an Application item because the test-taker must select an appropriate home behavior-support recommendation; the distractors are permissive, passive, or escalate prematurely to medication.",
    pattern: 'Students respond to home behavior concerns with permissiveness, delay, or premature medical referral.',
    d: {
      B: ['L2', 'Conceptual', 'The student believed removing all limits at home is an appropriate way to reduce tantrums.', 'Structured behavioral parent training versus permissive limit removal'],
      C: ['L2', 'Conceptual', 'The student believed the family should wait until tantrums appear at school before acting.', 'Proactive home support versus delaying until school onset'],
      D: ['L3', 'Procedural', 'The student believed a direct medication referral is the first response to a young child’s tantrums.', 'Behavioral home intervention versus premature medical referral'],
    },
  },
  {
    skill: 'FAM-02', cc: 'Recall', correct: 'D', tag: 'model-conflation', obj: ['III.C.1.a'],
    stem: "From a family-systems perspective, the principle of 'homeostasis' refers to:",
    A: "A parent's individual coping style",
    B: "The school's role within the family",
    C: "A child's expected developmental milestone",
    D: 'The family’s tendency to maintain stability and resist change, so that a change in one member affects the whole system',
    construct: 'Family-systems concept of homeostasis — maintenance of stability such that change in one member affects the whole system',
    why: "This is a Recall item because it asks for the definition of a family-systems concept; the distractors describe individual or unrelated constructs rather than a systems property.",
    pattern: 'Students define family-systems concepts at the individual level rather than the systemic level.',
    d: {
      A: ['L1', 'Lexical', 'The student believed homeostasis refers to an individual parent’s personal coping style.', 'Systemic stability/interdependence versus individual coping'],
      B: ['L2', 'Conceptual', 'The student believed homeostasis describes the school’s role within the family system.', 'Family self-regulation versus external/school roles'],
      C: ['L1', 'Lexical', 'The student believed homeostasis denotes a child’s expected developmental milestone.', 'Systems homeostasis versus developmental milestones'],
    },
  },
  {
    skill: 'FAM-02', cc: 'Application', correct: 'C', tag: 'model-conflation', obj: ['III.C.1.a', 'III.C.1.d'],
    stem: 'A psychologist convenes the parents and the teacher together to jointly define a behavior goal, share data, and carry out a consistent plan across home and school. This structured approach is best described as:',
    A: 'A due-process mediation', B: 'A unilateral school intervention',
    C: 'Conjoint behavioral consultation, which partners families and schools as co-equal problem solvers across settings',
    D: 'A standardized parent-rating procedure',
    construct: 'Conjoint behavioral consultation as a structured family–school partnership that co-defines and implements consistent cross-setting interventions',
    why: "This is an Application item because the test-taker must recognize a described cross-setting partnership model by name; the distractors are adjacent legal, unilateral, or assessment processes.",
    pattern: 'Students mislabel structured family–school problem solving as mediation, a school-only plan, or a rating procedure.',
    d: {
      A: ['L1', 'Lexical', 'The student believed a joint home–school problem-solving process is a due-process mediation.', 'Conjoint behavioral consultation versus legal due-process mediation'],
      B: ['L2', 'Conceptual', 'The student believed convening parents and teacher together is a unilateral school intervention.', 'Co-equal family–school partnership versus a school-only plan'],
      D: ['L1', 'Lexical', 'The student believed the collaborative process is a standardized parent-rating procedure.', 'Collaborative consultation versus a standardized rating scale'],
    },
  },
  {
    skill: 'FAM-02', cc: 'Application', correct: 'A', tag: 'purpose-confusion', obj: ['III.C.1.a'],
    stem: 'When beginning work with a family facing multiple stressors, a strengths-based school psychologist first:',
    A: 'Identifies the family’s existing competencies, supports, and cultural assets on which to build the partnership',
    B: "Catalogs the family's deficits to justify services",
    C: 'Defers all decisions until every risk has been fully documented',
    D: 'Limits contact to formal written notices',
    construct: 'Strengths-based / protective-factors framing that centers family competencies and cultural assets when initiating a family partnership',
    why: "This is an Application item because the test-taker must apply a strengths-based stance to the opening of family work; the distractors begin from deficits, paralysis, or minimal contact.",
    pattern: 'Students open family work by cataloging deficits or minimizing contact rather than building on strengths.',
    d: {
      B: ['L2', 'Conceptual', 'The student believed beginning by cataloging family deficits is the strengths-based approach.', 'Asset/competency identification versus deficit cataloging'],
      C: ['L3', 'Procedural', 'The student believed all decisions should wait until every family risk is fully documented.', 'Strengths-based engagement versus risk-documentation paralysis'],
      D: ['L2', 'Conceptual', 'The student believed limiting contact to formal written notices reflects strong family partnership.', 'Relational strengths-based engagement versus minimal formal contact'],
    },
  },
];

// CORRECT_Explanation per item, in SPEC order. Asserts the right concept, then dismisses the distractors.
const EXPLAIN = [
  // DIV-03
  "The fundamental attribution error is overweighting dispositional causes (e.g., 'lazy') while discounting situational ones (e.g., homelessness). The halo, Hawthorne, and self-serving effects describe other, inapplicable phenomena.",
  "The halo effect is letting one favorable impression bias judgments of a student's unrelated traits. The other options define the contrast effect, observer reactivity, and attribution to luck.",
  "Randomly designated 'bloomers' improving because teachers expected them to is the self-fulfilling prophecy (Pygmalion/expectancy effect). Regression to the mean, stereotype threat, and the contrast effect do not explain expectation-driven gains.",
  "Implicit bias is automatic and outside awareness; explicit bias is consciously held and endorsed. The distractors invert intentionality, narrow each bias to one outcome, or treat the terms as identical.",
  "Equity distributes resources in proportion to need so each student has a fair opportunity to meet the same high standards. Identical allocation is equality, removing supports is neither, and merit-based allocation is the opposite of equity.",
  "Naming deficit thinking calls for asset-based reframing and examining instructional and systemic factors the school controls. Lowering expectations, referring to special education, or documenting deficits all extend the deficit frame.",
  "Gathering specific, individuating information about the particular student is the evidence-based counter to bias when interpreting behavior. Colorblindness, gut intuition, and snap judgments are ineffective or counterproductive.",
  "An opportunity-gap reframe directs attention to inequitable access to resources, teachers, and learning opportunities. The distractors keep the explanation inside the student—ability, standards, or effort.",
  "Universal screening with local, culturally responsive norms minimizes biased gatekeeping in gifted identification. Nomination gates, parent-request gating, and higher cutoffs preserve or worsen the referral filter.",
  // DBD-09
  "A home–school link with poor communication is a mesosystem issue—the interaction between two microsystems. The micro-, macro-, and chronosystem describe other ecological levels.",
  "The RIOT/ICEL matrix samples multiple sources and domains so problems are not prematurely located in the learner. It does not replace observation with testing, decide eligibility from one source, or rank students.",
  "A child who struggles in one classroom but thrives in another illustrates goodness-of-fit between temperament and environmental demands. Fixed temperament, learned helplessness, and diagnostic overshadowing miss the interaction.",
  "The chronosystem is the time dimension—life transitions and sociohistorical change. The distractors define the micro-, macro-, and mesosystem.",
  "An ecological approach first rules out inadequate instruction, limited opportunity to learn, and curricular mismatch before inferring a within-child disability. Effort, parental education, and birth order are not the exclusionary factors.",
  "A neighborhood resource gap calls for a systems-level response—partnering with community organizations to expand supports. More homework, disability referrals, and motivation attributions misplace the problem.",
  "Lost instructional minutes are a problem of opportunity to learn—the instruction actually delivered. Aptitude, test bias, and parental involvement do not explain the instructional-time difference.",
  "Accurate work at home but not in class indicates a performance deficit driven by context, not an absent skill. Re-teaching, intellectual disability, and vision impairment ignore that the student can do the work elsewhere.",
  // PSY-01
  "About 68% of scores fall within one standard deviation of the mean. The distractors give the median split (50%), the ±2 SD band (95%), and the near-total ±3 SD band (99%+).",
  "Mastering 90% of objectives is criterion-referenced—performance against a standard. Percentile rank, standard score, and stanine are all norm-referenced—performance against peers.",
  "A floor effect means the test cannot discriminate among very low performers, so a student at the floor may be worse off than the score suggests. The distractors invert or ignore the effect.",
  "Basal and ceiling rules define the start and stop points so only an appropriate range of items is administered. They do not convert scores, set confidence intervals, or check norm recency.",
  "Self-report measures are susceptible to social-desirability and response bias, so symptoms may be underreported. They are not bias-free, do not measure intelligence, and can be scored numerically.",
  "A structured interview chiefly improves the reliability and consistency of information gathered across clinicians. Rapport, speed, and student reading level are not its primary advantage.",
  "Because behavior is situation-specific, parent–teacher discrepancies are meaningful cross-setting information, not error to eliminate. They do not mean a rater is wrong, the scales are invalid, or the child has two disorders.",
  "A score is meaningful only when the norm sample represents the comparison population. Raw sample size, same-district collection, or a disability-only sample do not substitute for representativeness.",
  // PSY-04
  "Ad hoc translation invalidates a test's standardization and norms, so the scores cannot be referenced to the published norm group. The other options raise minor or inaccurate concerns.",
  "Sorting subtests by cultural loading and linguistic demand shows how much language and acculturation may have depressed scores, since the most demanding subtests are most affected. It does not convert scores, change performance, or establish eligibility.",
  "A group mean difference alone does not establish test bias, which requires evidence such as differential prediction or differential item functioning. It proves neither bias nor fairness and does not indicate low reliability.",
  "The two same-language students differ in acculturation, which shapes familiarity with test content, format, and expectations. Innate intelligence, articulation, and working memory are not what immigration history changes.",
  "Because academic tasks draw on academic language, the language of administration should let the student best demonstrate the underlying ability — here her stronger academic language (Spanish) or a bilingual approach. Choosing by conversational fluency, day-of preference, or examiner convenience is inappropriate.",
  "IDEA requires a variety of assessment tools and strategies, and no single measure may be the sole criterion for eligibility. A single well-normed test, English-only measures, and cost-driven selection are all prohibited bases.",
  "An item that assumes snow experience disadvantages some students regardless of the construct measured—this is content bias. Predictive bias, construct bias, and reliability error are different concepts.",
  "Examining response to high-quality, culturally and linguistically appropriate instruction over time, with other data, best separates a language difference from a disability. A single test, indefinite delay, or a native-speaker-only comparison do not.",
  // FAM-02
  "Epstein's sixth type of involvement is collaborating with the community. Standardized testing, disciplinary referral, and retention are not Epstein partnership types.",
  "A sustained schoolwide plan with multiple access points — flexible scheduling, interpretation, transportation, and two-way communication — raises involvement system-wide. A one-off English-only newsletter, coercive attendance rules, and one occasional volunteer do not.",
  "Authentic involvement makes families voting members with real influence over decisions. After-the-fact invitations, signing a finished plan, and unused surveys are tokenism.",
  "Dialogic reading is an evidence-based home intervention that builds children's language and literacy. It is not licensed clinical therapy, a testing strategy, or a replacement for classroom instruction.",
  "An evidence-based parent-training program teaching consistent routines and reinforcement is the appropriate home recommendation. Removing limits, waiting for school onset, and direct medication referral are not.",
  "Homeostasis is the family's tendency to maintain stability so that change in one member affects the whole system. The distractors describe individual coping, external roles, or developmental milestones.",
  "Convening parents and the teacher to jointly set goals, share data, and implement a consistent cross-setting plan is conjoint behavioral consultation. It is not due-process mediation, a unilateral school plan, or a rating procedure.",
  "A strengths-based psychologist first identifies the family's competencies, supports, and cultural assets to build on. Cataloging deficits, waiting on full risk documentation, and minimal formal contact are not strengths-based.",
];
if (EXPLAIN.length !== SPEC.length) { console.error(`EXPLAIN length ${EXPLAIN.length} != SPEC length ${SPEC.length}`); process.exit(1); }
SPEC.forEach((s, i) => { s.explain = EXPLAIN[i]; });

// ── Build a full 72-field question object from a spec entry.
const LETTERS = ['A', 'B', 'C', 'D'];
function wordCount(s) { return s.trim().split(/\s+/).filter(Boolean).length; }

function buildItem(spec, uid) {
  const domainCode = spec.skill.split('-')[0];
  const o = {
    UNIQUEID: uid, item_format: 'Single-Select', is_multi_select: 'False', correct_answer_count: '1',
    option_count_expected: '4', has_case_vignette: 'False', case_text: '', question_stem: spec.stem,
    A: spec.A, B: spec.B, C: spec.C, D: spec.D, E: '', F: '', correct_answers: spec.correct,
    CORRECT_Explanation: spec.explain ?? '', core_concept: '', content_limit: '', DOMAIN: '',
    domain_name: '', domain_weight: '', nasp_domain_primary: '', original_skill_id: spec.skill,
    current_skill_id: spec.skill, skill_name: '', skill_domain_code: domainCode, skill_nasp_domain: '',
    was_remapped: '', cognitive_complexity: spec.cc, complexity_rationale: spec.why, outcome: '',
    construct_actually_tested: spec.construct, rationale: '',
  };
  for (const L of ['A', 'B', 'C', 'D', 'E', 'F']) {
    const dm = spec.d?.[L];
    o[`distractor_tier_${L}`] = dm ? dm[0] : '';
    o[`distractor_error_type_${L}`] = dm ? dm[1] : '';
    o[`distractor_misconception_${L}`] = dm ? dm[2] : '';
    o[`distractor_skill_deficit_${L}`] = dm ? dm[3] : '';
  }
  Object.assign(o, {
    is_foundational: false, prereq_chain_narrative: '', dominant_error_pattern: spec.pattern,
    error_cluster_tag: spec.tag, audit_status: '', dominant_failure_mode_tier: '',
    top_misconception_themes: '', instructional_red_flags: '', skill_prerequisites: '',
    is_human_verified: true, domain_rationale: '', skill_rationale: '', primaryModuleId: '',
    primarySnippet: '', moduleRefs: [],
  });
  return o;
}

// ── Validate the spec against every gate constraint before writing.
function validate(specs) {
  const errs = [];
  for (const [i, s] of specs.entries()) {
    const tag = `#${i} ${s.skill}`;
    if (!s.explain) errs.push(`${tag}: missing CORRECT_Explanation`);
    if (!['Recall', 'Application'].includes(s.cc)) errs.push(`${tag}: bad cc ${s.cc}`);
    if (!APPROVED_TAGS.has(s.tag)) errs.push(`${tag}: error_cluster_tag "${s.tag}" not approved`);
    if (s.correct === 'B') errs.push(`${tag}: key is B (must be off-B)`);
    if (!['A', 'C', 'D'].includes(s.correct)) errs.push(`${tag}: bad key ${s.correct}`);
    if (!s.pattern) errs.push(`${tag}: error_cluster_tag set but no dominant_error_pattern`);
    if (!Array.isArray(s.obj) || s.obj.length < 1 || s.obj.length > 2) errs.push(`${tag}: obj must be 1-2 codes`);
    for (const c of s.obj) if (!ALLOWED_OBJ[s.skill].has(c)) errs.push(`${tag}: obj ${c} not allowed for ${s.skill}`);
    const wrong = LETTERS.filter((L) => L !== s.correct);
    for (const L of wrong) {
      const dm = s.d?.[L];
      if (!dm) { errs.push(`${tag}: missing distractor meta for ${L}`); continue; }
      const [tier, etype, mis, deficit] = dm;
      if (!['L1', 'L2', 'L3'].includes(tier)) errs.push(`${tag}.${L}: bad tier ${tier}`);
      if (!['Lexical', 'Conceptual', 'Procedural'].includes(etype)) errs.push(`${tag}.${L}: bad error_type ${etype}`);
      if (!/^The student /.test(mis)) errs.push(`${tag}.${L}: misconception must start "The student "`);
      if (mis === 'UNUSED' || mis.includes('believed that students believed')) errs.push(`${tag}.${L}: framing violation`);
      if (wordCount(mis) < 9) errs.push(`${tag}.${L}: misconception < 9 words (${wordCount(mis)})`);
      if (!deficit) errs.push(`${tag}.${L}: missing skill_deficit`);
    }
    // the correct option must NOT carry distractor meta
    if (s.d?.[s.correct]) errs.push(`${tag}: correct option ${s.correct} has distractor meta`);
  }
  return errs;
}

// ── Append helpers. The committed JSON files store non-ASCII as \uXXXX escapes; a full
//    JSON.parse→stringify rewrite would flip every existing item's escapes (huge spurious diff).
//    So we TEXTUALLY append, matching the file's ASCII-escaped encoding — a clean, additive diff.
const asciiEscape = (s) => s.replace(/[-￿]/g, (c) => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
const indentBlock = (s, n) => s.split('\n').map((l) => ' '.repeat(n) + l).join('\n');

// ── Main
const checkOnly = process.argv.includes('--check');
const errs = validate(SPEC);
if (errs.length) {
  console.error('SPEC VALIDATION FAILED:\n' + errs.join('\n'));
  process.exit(1);
}
console.log(`Spec valid: ${SPEC.length} items.`);

// Parse (read-only) for indexing, collision checks, and meta recomputation. We never write the parse back.
const questions = JSON.parse(readFileSync(Q_PATH, 'utf-8'));
const objParsed = JSON.parse(readFileSync(OBJ_PATH, 'utf-8'));

const nextIdx = {};
for (const skill of Object.keys(ALLOWED_OBJ)) {
  let mx = 0;
  for (const q of questions) {
    const m = String(q.UNIQUEID).match(new RegExp(`^PQ_${skill}_(\\d+)$`));
    if (m) mx = Math.max(mx, +m[1]);
  }
  nextIdx[skill] = mx + 1;
}

const existingIds = new Set(questions.map((q) => q.UNIQUEID));
const newItems = [];   // built question objects
const newEntries = []; // { id, obj }
const keyTally = {};
for (const s of SPEC) {
  const uid = `PQ_${s.skill}_${nextIdx[s.skill]++}`;
  if (existingIds.has(uid) || objParsed.questions[uid]) { console.error(`COLLISION: ${uid} already present — aborting.`); process.exit(1); }
  const item = buildItem(s, uid);
  if (Object.keys(item).length !== 72) { console.error(`${uid}: ${Object.keys(item).length} keys (expected 72)`); process.exit(1); }
  newItems.push(item);
  newEntries.push({ id: uid, obj: s.obj });
  keyTally[`${s.skill}:${s.correct}`] = (keyTally[`${s.skill}:${s.correct}`] || 0) + 1;
  if (!checkOnly) console.log(`+ ${uid} [${s.cc[0]}|${s.correct}] ${s.obj.join(',')}`);
}
const added = newItems.length;

console.log(`\nNew-item key distribution: ${JSON.stringify(keyTally)}`);
if (checkOnly) { console.log('\n--check: no files written.'); process.exit(0); }

// ── questions.json: textual append before the final ']'.
let qText = readFileSync(Q_PATH, 'utf-8');
const qIdx = qText.lastIndexOf(']');
const qHead = qText.slice(0, qIdx).replace(/\s+$/, ''); // "...  }" of the last item
const qBlock = newItems.map((it) => indentBlock(asciiEscape(JSON.stringify(it, null, 2)), 2)).join(',\n');
writeFileSync(Q_PATH, qHead + ',\n' + qBlock + '\n]\n');

// ── questionObjectiveMap.json: textual append of manual entries before the 'questions' object close,
//    then refresh the (stale) meta counts. All 41 are manually mapped, so the seeder has nothing to
//    assign — we deliberately do NOT run it (running it would re-sort/reformat all 1,200 prior entries).
const ents = Object.values(objParsed.questions);
const meta = {
  totalMapped: ents.length + added,
  seededCount: ents.filter((e) => e.method === 'seeded').length,
  fallbackCount: ents.filter((e) => e.method === 'fallback').length,
  manualCount: ents.filter((e) => e.method === 'manual').length + added,
};
let oBody = readFileSync(OBJ_PATH, 'utf-8').replace(/\s+$/, '');
const tail = oBody.match(/\n {2}\}\n\}$/); // closes "questions" then root
if (!tail) { console.error('objectiveMap: could not locate the questions-object close — aborting.'); process.exit(1); }
const oEntries = newEntries.map(({ id, obj }) => {
  const v = JSON.stringify({ ets_topics: obj, method: 'manual', verified: false }, null, 2);
  return '    ' + JSON.stringify(id) + ': ' + v.split('\n').map((l, i) => (i === 0 ? l : '    ' + l)).join('\n');
}).join(',\n');
let oOut = oBody.slice(0, tail.index) + ',\n' + oEntries + '\n  }\n}\n';
oOut = oOut
  .replace(/("totalMapped":\s*)\d+/, `$1${meta.totalMapped}`)
  .replace(/("seededCount":\s*)\d+/, `$1${meta.seededCount}`)
  .replace(/("fallbackCount":\s*)\d+/, `$1${meta.fallbackCount}`)
  .replace(/("manualCount":\s*)\d+/, `$1${meta.manualCount}`);
writeFileSync(OBJ_PATH, oOut);

// ── Parse-back validation: the textual appends must yield valid JSON with exact parity.
const qCheck = JSON.parse(readFileSync(Q_PATH, 'utf-8'));
const oCheck = JSON.parse(readFileSync(OBJ_PATH, 'utf-8'));
const qIds = new Set(qCheck.map((q) => q.UNIQUEID));
const oIds = new Set(Object.keys(oCheck.questions));
const missing = [...qIds].filter((id) => !oIds.has(id));
const extra = [...oIds].filter((id) => !qIds.has(id));
if (qCheck.length !== questions.length + added) { console.error(`PARSE-BACK: questions count ${qCheck.length} != ${questions.length + added}`); process.exit(1); }
if (missing.length || extra.length) { console.error(`PARSE-BACK: parity broken (missing ${missing.length}, extra ${extra.length})`); process.exit(1); }

console.log(`\nWrote ${added} items to questions.json (now ${qCheck.length}) and ${added} manual objective entries (now ${oIds.size}).`);
console.log('Parse-back OK: valid JSON, exact id-parity, append-only (existing items untouched).');
console.log('NEXT (engineering): npx tsx scripts/migrations/derive-misconception-questions.mjs   # links the new items');
