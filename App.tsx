import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Brain, Target, BookOpen, TrendingUp, CheckCircle, XCircle, ChevronRight, RotateCcw, AlertTriangle, Zap, Award, Clock, BarChart3, Lightbulb, ArrowRight, Play, Pause, RefreshCw } from 'lucide-react';

// Import knowledge base
import { NASP_DOMAINS, KEY_COURT_CASES, DISTRACTOR_PATTERNS, STEM_PATTERNS } from './knowledge-base';

// Import question generation (dynamic import to avoid circular dependencies)
import { generateQuestion } from './brain/question-generator';
import questionSkillMapData from './data/question-skill-map.json';
import { SkillId, SKILL_MAP, getSkillById } from './brain/skill-map';

// Questions data is defined below (all 125 questions)

// ============================================
// TYPE DEFINITIONS
// ============================================

interface Question {
  id: string;
  question: string;
  choices: Record<string, string>;
  correct_answer: string[];
  rationale: string;
  skillId?: string;
}

interface AnalyzedQuestion extends Question {
  domains: number[];
  dok: number;
  questionType: 'Scenario-Based' | 'Direct Knowledge';
  stemType: string;
  keyConcepts: string[];
  skillId?: string; // Optional skill ID for skill-based tracking
  isGenerated?: boolean; // Whether this question was generated
}

interface UserResponse {
  questionId: string;
  selectedAnswers: string[];
  correctAnswers: string[];
  isCorrect: boolean;
  timeSpent: number;
  confidence: 'low' | 'medium' | 'high';
  timestamp: number;
}

interface UserProfile {
  preAssessmentComplete: boolean;
  domainScores: Record<number, { correct: number; total: number }>;
  skillScores: Record<string, { correct: number; total: number; lastSeen: number }>; // Skill-level tracking
  weakestDomains: number[];
  factualGaps: string[];
  errorPatterns: string[];
  practiceHistory: UserResponse[];
  totalQuestionsSeen: number;
  streak: number;
  generatedQuestionsSeen: Set<string>; // Track generated question IDs to avoid duplicates
}

type ConfidenceLevel = 'high' | 'medium' | 'low';

interface QuestionSkillEntry {
  questionId: string;
  skillId: string;
  confidence: ConfidenceLevel;
}

interface QuestionSkillMapSchema {
  totalQuestions: number;
  mappedQuestions: QuestionSkillEntry[];
}

const questionSkillMap: QuestionSkillMapSchema = questionSkillMapData;
const CONFIDENCE_RANK: Record<ConfidenceLevel, number> = { high: 3, medium: 2, low: 1 };

const INTERIM_SKILL_LOOKUP = questionSkillMap.mappedQuestions.reduce<
  Record<string, { skillId: string; confidence: ConfidenceLevel }>
>((acc, entry) => {
  const existing = acc[entry.questionId];
  if (!existing || CONFIDENCE_RANK[entry.confidence] > CONFIDENCE_RANK[existing.confidence]) {
    acc[entry.questionId] = { skillId: entry.skillId, confidence: entry.confidence };
  }
  return acc;
}, {});

const QUESTION_SKILL_LOOKUP: Record<string, string> = Object.fromEntries(
  Object.entries(INTERIM_SKILL_LOOKUP).map(([questionId, value]) => [questionId, value.skillId])
);

// ============================================
// QUESTION ANALYSIS ENGINE
// ============================================

function analyzeQuestion(q: Question): AnalyzedQuestion {
  const text = q.question.toLowerCase();
  const rationale = q.rationale.toLowerCase();
  
  // Detect domains based on content
  const domains: number[] = [];
  
  // Domain detection keywords
  const domainKeywords: Record<number, string[]> = {
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
  
  for (const [domain, keywords] of Object.entries(domainKeywords)) {
    if (keywords.some(kw => text.includes(kw) || rationale.includes(kw))) {
      domains.push(parseInt(domain));
    }
  }
  
  if (domains.length === 0) domains.push(1); // Default
  
  // Detect question type
  const scenarioIndicators = ['school psychologist', 'teacher', 'student', 'parent', 'dr.'];
  const isScenario = scenarioIndicators.some(ind => text.includes(ind)) && q.question.length > 150;
  
  // Detect stem type
  let stemType = 'Other';
  if (text.includes('first step') || text.includes('should first')) stemType = 'First Step';
  else if (text.includes('most appropriate')) stemType = 'Most Appropriate';
  else if (text.includes('best example')) stemType = 'Best Example';
  else if (text.includes('best describes')) stemType = 'Best Description';
  else if (text.includes('which of the following is the best')) stemType = 'Best Answer';
  
  // Estimate DOK
  let dok = 2;
  if (stemType === 'First Step' || isScenario) dok = 3;
  if (text.includes('definition') || text.includes('which of the following is')) dok = 1;
  
  // Extract key concepts being tested
  const keyConcepts: string[] = [];
  for (const domain of domains) {
    const domainInfo = NASP_DOMAINS[domain as keyof typeof NASP_DOMAINS];
    if (domainInfo?.keyConcepts) {
      for (const concept of domainInfo.keyConcepts) {
        if (text.includes(concept) || rationale.includes(concept)) {
          keyConcepts.push(concept);
        }
      }
    }
  }
  
  return {
    ...q,
    skillId: QUESTION_SKILL_LOOKUP[q.id],
    domains,
    dok,
    questionType: isScenario ? 'Scenario-Based' : 'Direct Knowledge',
    stemType,
    keyConcepts
  };
}

// ============================================
// WEAKNESS DETECTION ENGINE
// ============================================

function detectWeaknesses(responses: UserResponse[], questions: AnalyzedQuestion[]): {
  weakestDomains: number[];
  factualGaps: string[];
  errorPatterns: string[];
  domainScores: Record<number, { correct: number; total: number }>;
} {
  const domainScores: Record<number, { correct: number; total: number }> = {};
  const errorPatterns: Record<string, number> = {};
  const factualGaps: string[] = [];
  
  // Initialize all domains
  for (let i = 1; i <= 10; i++) {
    domainScores[i] = { correct: 0, total: 0 };
  }
  
  // Analyze each response
  for (const response of responses) {
    const question = questions.find(q => q.id === response.questionId);
    if (!question) continue;
    
    // Update domain scores
    for (const domain of question.domains) {
      domainScores[domain].total++;
      if (response.isCorrect) {
        domainScores[domain].correct++;
      }
    }
    
    // If wrong, analyze why
    if (!response.isCorrect) {
      // Check for pattern in wrong answer
      const selectedText = response.selectedAnswers
        .map(a => question.choices[a])
        .join(' ')
        .toLowerCase();
      
      // Detect error patterns
      if (selectedText.includes('immediately') || selectedText.includes('refer')) {
        errorPatterns['prematureAction'] = (errorPatterns['prematureAction'] || 0) + 1;
      }
      if (selectedText.includes('take over') || selectedText.includes('prescribe')) {
        errorPatterns['roleConfusion'] = (errorPatterns['roleConfusion'] || 0) + 1;
      }
      
      // Track concepts missed
      for (const concept of question.keyConcepts) {
        if (!factualGaps.includes(concept)) {
          factualGaps.push(concept);
        }
      }
    }
  }
  
  // Find weakest domains (score < 60%)
  const weakestDomains = Object.entries(domainScores)
    .filter(([_, score]) => score.total > 0 && (score.correct / score.total) < 0.6)
    .sort((a, b) => (a[1].correct / a[1].total) - (b[1].correct / b[1].total))
    .map(([domain]) => parseInt(domain));
  
  // Get top error patterns
  const topErrorPatterns = Object.entries(errorPatterns)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([pattern]) => pattern);
  
  return {
    weakestDomains,
    factualGaps: factualGaps.slice(0, 10),
    errorPatterns: topErrorPatterns,
    domainScores
  };
}

// ============================================
// ADAPTIVE QUESTION SELECTION
// ============================================

function getDomainFromSkillId(skillId: SkillId): number {
  for (const [domainId, domain] of Object.entries(SKILL_MAP)) {
    if (domain.clusters.some(cluster => cluster.skills.some(skill => skill.skillId === skillId))) {
      return Number(domainId);
    }
  }
  return 1;
}

function selectNextQuestion(
  profile: UserProfile,
  questions: AnalyzedQuestion[],
  sessionHistory: string[]
): AnalyzedQuestion | null {
  // Filter out already-seen questions this session
  const available = questions.filter(q => !sessionHistory.includes(q.id));
  
  // Identify weakest skill (lowest accuracy with minimum 2 attempts)
  const skillScores = profile.skillScores || {};
  const skillsWithEnoughData = Object.entries(skillScores)
    .filter(([_, score]) => score.total >= 2)
    .map(([skillId, score]) => ({
      skillId,
      accuracy: score.correct / score.total,
      score
    }))
    .sort((a, b) => a.accuracy - b.accuracy); // Sort by accuracy (lowest first)
  
  const weakestSkill = skillsWithEnoughData.length > 0 ? skillsWithEnoughData[0] : null;
  
  // If we have a weakest skill, target it
  if (weakestSkill) {
    // 60% chance: Select from question bank if untested questions exist for this skill
    // 40% chance: Generate new question for this skill
    const useBank = Math.random() < 0.6;
    
    if (useBank) {
      // Find bank questions for this skill
      const skillQuestions = available.filter(q => 
        q.skillId === weakestSkill.skillId && !q.isGenerated
      );
      
      if (skillQuestions.length > 0) {
        return skillQuestions[Math.floor(Math.random() * skillQuestions.length)];
      }
    }
    
    // Generate new question for this skill
    try {
      const generated = generateQuestion(weakestSkill.skillId);
      
      if (generated) {
        // Check if we've seen this generated question before
        const questionHash = `${generated.metadata.templateId}-${JSON.stringify(generated.metadata.slotValues)}`;
        const seenQuestions = profile.generatedQuestionsSeen || new Set();
        
        if (!seenQuestions.has(questionHash)) {
          // Convert GeneratedQuestion to AnalyzedQuestion
        const analyzedQuestion: AnalyzedQuestion = {
          ...generated,
          domains: [getDomainFromSkillId(generated.metadata.skillId)],
          dok: 2,
          questionType: 'Direct Knowledge',
          stemType: 'Generated',
          keyConcepts: [],
          skillId: generated.metadata.skillId,
          isGenerated: true
        };
          
          // Track that we've seen this question
          seenQuestions.add(questionHash);
          profile.generatedQuestionsSeen = seenQuestions;
          
          return analyzedQuestion;
        }
      }
    } catch (error) {
      console.warn('Failed to generate question:', error);
      // Fall through to bank question selection
    }
    
    // Fallback: try to find any question for this skill
    const anySkillQuestions = available.filter(q => q.skillId === weakestSkill.skillId);
    if (anySkillQuestions.length > 0) {
      return anySkillQuestions[Math.floor(Math.random() * anySkillQuestions.length)];
    }
  }
  
  // Fallback to domain-based selection
  if (profile.weakestDomains.length > 0) {
    const weakDomainQuestions = available.filter(q =>
      q.domains.some(d => profile.weakestDomains.includes(d))
    );
    if (weakDomainQuestions.length > 0) {
      // 70% chance to pick from weak domains
      if (Math.random() < 0.7) {
        return weakDomainQuestions[Math.floor(Math.random() * weakDomainQuestions.length)];
      }
    }
  }
  
  // Mix in questions from other domains
  if (available.length > 0) {
    return available[Math.floor(Math.random() * available.length)];
  }
  
  return null;
}

// ============================================
// MAIN APP COMPONENT
// ============================================

export default function PraxisStudyApp() {
  // Load profile from localStorage on mount
  const loadProfile = (): UserProfile => {
    try {
      const saved = localStorage.getItem('praxis-study-profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure all required fields exist
        return {
          preAssessmentComplete: parsed.preAssessmentComplete || false,
          domainScores: parsed.domainScores || {},
          skillScores: parsed.skillScores || {},
          weakestDomains: parsed.weakestDomains || [],
          factualGaps: parsed.factualGaps || [],
          errorPatterns: parsed.errorPatterns || [],
          practiceHistory: parsed.practiceHistory || [],
          totalQuestionsSeen: parsed.totalQuestionsSeen || 0,
          streak: parsed.streak || 0,
          generatedQuestionsSeen: parsed.generatedQuestionsSeen 
            ? new Set(parsed.generatedQuestionsSeen) 
            : new Set()
        };
      }
    } catch (error) {
      console.warn('Failed to load profile from localStorage:', error);
    }
    return {
      preAssessmentComplete: false,
      domainScores: {},
      skillScores: {},
      weakestDomains: [],
      factualGaps: [],
      errorPatterns: [],
      practiceHistory: [],
      totalQuestionsSeen: 0,
      streak: 0,
      generatedQuestionsSeen: new Set()
    };
  };

  // Save profile to localStorage
  const saveProfile = (profileToSave: UserProfile) => {
    try {
      // Convert Set to Array for JSON serialization
      const profileToSaveSerializable = {
        ...profileToSave,
        generatedQuestionsSeen: Array.from(profileToSave.generatedQuestionsSeen || [])
      };
      localStorage.setItem('praxis-study-profile', JSON.stringify(profileToSaveSerializable));
    } catch (error) {
      console.warn('Failed to save profile to localStorage:', error);
    }
  };

  // App state
  const [mode, setMode] = useState<'home' | 'preassessment' | 'results' | 'practice' | 'review'>('home');
  const [currentQuestion, setCurrentQuestion] = useState<AnalyzedQuestion | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [sessionHistory, setSessionHistory] = useState<string[]>([]);
  const [startTime, setStartTime] = useState<number>(0);
  const [confidence, setConfidence] = useState<'low' | 'medium' | 'high'>('medium');
  
  // User profile - load from localStorage on mount
  const [profile, setProfile] = useState<UserProfile>(loadProfile);
  
  // Save profile to localStorage whenever it changes
  useEffect(() => {
    saveProfile(profile);
  }, [profile]);
  
  // Pre-assessment tracking
  const [preAssessmentQuestions, setPreAssessmentQuestions] = useState<AnalyzedQuestion[]>([]);
  const [preAssessmentIndex, setPreAssessmentIndex] = useState(0);
  const [preAssessmentResponses, setPreAssessmentResponses] = useState<UserResponse[]>([]);
  
  // Analyze all questions
  const analyzedQuestions = useMemo(() => {
    return QUESTIONS_DATA.map(analyzeQuestion);
  }, []);
  
  // ============================================
  // HANDLERS
  // ============================================
  
  const startPreAssessment = useCallback(() => {
    // Select 2 questions per domain (20 total)
    const selected: AnalyzedQuestion[] = [];
    for (let domain = 1; domain <= 10; domain++) {
      const domainQuestions = analyzedQuestions.filter(q => q.domains.includes(domain));
      const shuffled = [...domainQuestions].sort(() => Math.random() - 0.5);
      selected.push(...shuffled.slice(0, 2));
    }
    
    // Shuffle final selection
    setPreAssessmentQuestions(selected.sort(() => Math.random() - 0.5));
    setPreAssessmentIndex(0);
    setPreAssessmentResponses([]);
    setMode('preassessment');
    setCurrentQuestion(selected[0]);
    setStartTime(Date.now());
    setSelectedAnswers([]);
    setShowFeedback(false);
  }, [analyzedQuestions]);
  
  const submitAnswer = useCallback(() => {
    if (!currentQuestion || selectedAnswers.length === 0) return;
    
    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    const isCorrect = 
      selectedAnswers.length === currentQuestion.correct_answer.length &&
      selectedAnswers.every(a => currentQuestion.correct_answer.includes(a));
    
    const response: UserResponse = {
      questionId: currentQuestion.id,
      selectedAnswers,
      correctAnswers: currentQuestion.correct_answer,
      isCorrect,
      timeSpent,
      confidence,
      timestamp: Date.now()
    };
    
    if (mode === 'preassessment') {
      const newResponses = [...preAssessmentResponses, response];
      setPreAssessmentResponses(newResponses);
      setShowFeedback(true);
    } else {
      // Practice mode - update profile
      const newHistory = [...profile.practiceHistory, response];
      const analysis = detectWeaknesses(newHistory, analyzedQuestions);
      
      // Update skill scores if question has a skillId
      let updatedSkillScores = { ...profile.skillScores };
      if (currentQuestion.skillId) {
        const skillId = currentQuestion.skillId;
        const currentSkillScore = updatedSkillScores[skillId] || { correct: 0, total: 0, lastSeen: 0 };
        updatedSkillScores[skillId] = {
          correct: currentSkillScore.correct + (isCorrect ? 1 : 0),
          total: currentSkillScore.total + 1,
          lastSeen: Date.now()
        };
      }
      
      setProfile(prev => ({
        ...prev,
        practiceHistory: newHistory,
        skillScores: updatedSkillScores,
        ...analysis,
        totalQuestionsSeen: prev.totalQuestionsSeen + 1,
        streak: isCorrect ? prev.streak + 1 : 0
      }));
      
      setSessionHistory(prev => [...prev, currentQuestion.id]);
      setShowFeedback(true);
    }
  }, [currentQuestion, selectedAnswers, startTime, confidence, mode, preAssessmentResponses, profile, analyzedQuestions]);
  
  const nextQuestion = useCallback(() => {
    if (mode === 'preassessment') {
      const nextIndex = preAssessmentIndex + 1;
      if (nextIndex >= preAssessmentQuestions.length) {
        // Pre-assessment complete
        const analysis = detectWeaknesses(preAssessmentResponses, analyzedQuestions);
        setProfile(prev => ({
          ...prev,
          preAssessmentComplete: true,
          practiceHistory: [...prev.practiceHistory, ...preAssessmentResponses],
          ...analysis
        }));
        setMode('results');
      } else {
        setPreAssessmentIndex(nextIndex);
        setCurrentQuestion(preAssessmentQuestions[nextIndex]);
        setStartTime(Date.now());
        setSelectedAnswers([]);
        setShowFeedback(false);
        setConfidence('medium');
      }
    } else {
      // Practice mode - select next based on weaknesses
      const next = selectNextQuestion(profile, analyzedQuestions, sessionHistory);
      if (next) {
        setCurrentQuestion(next);
        setStartTime(Date.now());
        setSelectedAnswers([]);
        setShowFeedback(false);
        setConfidence('medium');
      }
    }
  }, [mode, preAssessmentIndex, preAssessmentQuestions, preAssessmentResponses, profile, analyzedQuestions, sessionHistory]);
  
  const startPractice = useCallback(() => {
    setSessionHistory([]);
    const next = selectNextQuestion(profile, analyzedQuestions, []);
    if (next) {
      setCurrentQuestion(next);
      setStartTime(Date.now());
      setSelectedAnswers([]);
      setShowFeedback(false);
      setConfidence('medium');
      setMode('practice');
    }
  }, [profile, analyzedQuestions]);
  
  const toggleAnswer = useCallback((letter: string) => {
    if (showFeedback) return;
    
    const maxAnswers = currentQuestion?.correct_answer.length || 1;
    
    setSelectedAnswers(prev => {
      if (prev.includes(letter)) {
        return prev.filter(a => a !== letter);
      }
      if (prev.length < maxAnswers) {
        return [...prev, letter];
      }
      // Replace oldest selection
      return [...prev.slice(1), letter];
    });
  }, [showFeedback, currentQuestion]);
  
  // ============================================
  // RENDER HELPERS
  // ============================================
  
  const getDomainColor = (domain: number) => {
    const colors: Record<number, string> = {
      1: '#3B82F6', 2: '#3B82F6',
      3: '#10B981', 4: '#10B981',
      5: '#8B5CF6', 6: '#8B5CF6', 7: '#8B5CF6',
      8: '#F59E0B', 9: '#F59E0B', 10: '#F59E0B'
    };
    return colors[domain] || '#64748B';
  };
  
  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-emerald-400';
    if (score >= 0.6) return 'text-amber-400';
    return 'text-red-400';
  };

  // ============================================
  // RENDER
  // ============================================
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100" style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif" }}>
      
      {/* Header */}
      <header className="border-b border-slate-800/50 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg bg-gradient-to-r from-amber-200 to-orange-200 bg-clip-text text-transparent">
                Praxis Study
              </h1>
              <p className="text-xs text-slate-500">School Psychology 5403</p>
            </div>
          </div>
          
          {profile.preAssessmentComplete && mode !== 'home' && (
            <button
              onClick={() => setMode('home')}
              className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
            >
              ← Home
            </button>
          )}
        </div>
      </header>
      
      <main className="max-w-4xl mx-auto px-6 py-8">
        
        {/* HOME SCREEN */}
        {mode === 'home' && (
          <div className="space-y-8">
            <div className="text-center space-y-4 pt-8">
              <h2 className="text-3xl font-bold text-slate-100">
                {profile.preAssessmentComplete ? 'Welcome Back!' : 'Ready to Study?'}
              </h2>
              <p className="text-slate-400 max-w-md mx-auto">
                {profile.preAssessmentComplete 
                  ? `You've completed ${profile.totalQuestionsSeen} questions. Let's keep building your knowledge.`
                  : 'Start with a quick diagnostic to identify your strengths and weaknesses.'}
              </p>
            </div>
            
            {/* Quick Stats (if has history) */}
            {profile.preAssessmentComplete && (
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-slate-800/50 rounded-xl text-center">
                  <p className="text-2xl font-bold text-amber-400">{profile.totalQuestionsSeen}</p>
                  <p className="text-xs text-slate-500">Questions</p>
                </div>
                <div className="p-4 bg-slate-800/50 rounded-xl text-center">
                  <p className="text-2xl font-bold text-emerald-400">{profile.streak}</p>
                  <p className="text-xs text-slate-500">Current Streak</p>
                </div>
                <div className="p-4 bg-slate-800/50 rounded-xl text-center">
                  <p className="text-2xl font-bold text-purple-400">{profile.weakestDomains.length}</p>
                  <p className="text-xs text-slate-500">Focus Areas</p>
                </div>
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="space-y-4">
              {!profile.preAssessmentComplete ? (
                <button
                  onClick={startPreAssessment}
                  className="w-full p-6 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl flex items-center justify-between group hover:shadow-lg hover:shadow-amber-500/20 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <Target className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-white text-lg">Start Pre-Assessment</p>
                      <p className="text-amber-100 text-sm">20 questions • ~15 minutes</p>
                    </div>
                  </div>
                  <ChevronRight className="w-6 h-6 text-white group-hover:translate-x-1 transition-transform" />
                </button>
              ) : (
                <>
                  <button
                    onClick={startPractice}
                    className="w-full p-6 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-between group hover:shadow-lg hover:shadow-emerald-500/20 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                        <Zap className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-white text-lg">Adaptive Practice</p>
                        <p className="text-emerald-100 text-sm">Focus on your weak areas</p>
                      </div>
                    </div>
                    <ChevronRight className="w-6 h-6 text-white group-hover:translate-x-1 transition-transform" />
                  </button>
                  
                  <button
                    onClick={() => setMode('results')}
                    className="w-full p-6 bg-slate-800/50 border border-slate-700 rounded-2xl flex items-center justify-between group hover:bg-slate-800 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-700 rounded-xl flex items-center justify-center">
                        <BarChart3 className="w-6 h-6 text-slate-300" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-slate-200">View Progress</p>
                        <p className="text-slate-500 text-sm">See your domain scores</p>
                      </div>
                    </div>
                    <ChevronRight className="w-6 h-6 text-slate-500 group-hover:translate-x-1 transition-transform" />
                  </button>
                </>
              )}
            </div>
            
            {/* Weak Areas Preview */}
            {profile.preAssessmentComplete && profile.weakestDomains.length > 0 && (
              <div className="p-6 bg-slate-800/30 border border-slate-700/50 rounded-2xl">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <h3 className="font-semibold text-slate-200">Focus Areas</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profile.weakestDomains.map(d => (
                    <span key={d} className="px-3 py-1.5 rounded-full text-sm" style={{
                      backgroundColor: `${getDomainColor(d)}20`,
                      color: getDomainColor(d)
                    }}>
                      {NASP_DOMAINS[d as keyof typeof NASP_DOMAINS]?.shortName || `Domain ${d}`}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* PRE-ASSESSMENT / PRACTICE MODE */}
        {(mode === 'preassessment' || mode === 'practice') && currentQuestion && (
          <div className="space-y-6">
            {/* Progress Bar */}
            {mode === 'preassessment' && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-slate-500">
                  <span>Pre-Assessment</span>
                  <span>{preAssessmentIndex + 1} of {preAssessmentQuestions.length}</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                    style={{ width: `${((preAssessmentIndex + 1) / preAssessmentQuestions.length) * 100}%` }}
                  />
                </div>
              </div>
            )}
            
            {/* Practice Mode Header */}
            {mode === 'practice' && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-500" />
                    <span className="text-sm text-slate-400">Streak: <span className="text-amber-400 font-bold">{profile.streak}</span></span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {currentQuestion.domains.slice(0, 2).map(d => (
                    <span key={d} className="px-2 py-1 rounded text-xs" style={{
                      backgroundColor: `${getDomainColor(d)}20`,
                      color: getDomainColor(d)
                    }}>
                      {NASP_DOMAINS[d as keyof typeof NASP_DOMAINS]?.shortName}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Question Card */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">
              <div className="p-6">
                <p className="text-lg text-slate-200 leading-relaxed">{currentQuestion.question}</p>
              </div>
              
              {/* Answer Format Indicator */}
              {currentQuestion.correct_answer.length > 1 && (
                <div className="px-6 pb-2">
                  <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm">
                    Select {currentQuestion.correct_answer.length}
                  </span>
                </div>
              )}
              
              {/* Answer Choices */}
              <div className="p-4 space-y-2">
                {(Object.entries(currentQuestion.choices) as [string, string][])
                  .filter(([_, v]) => v.trim())
                  .map(([letter, text]) => {
                    const isSelected = selectedAnswers.includes(letter);
                    const isCorrect = currentQuestion.correct_answer.includes(letter);
                    
                    let bgColor = 'bg-slate-700/50 hover:bg-slate-700';
                    let borderColor = 'border-transparent';
                    let textColor = 'text-slate-300';
                    
                    if (showFeedback) {
                      if (isCorrect) {
                        bgColor = 'bg-emerald-500/20';
                        borderColor = 'border-emerald-500/50';
                        textColor = 'text-emerald-200';
                      } else if (isSelected && !isCorrect) {
                        bgColor = 'bg-red-500/20';
                        borderColor = 'border-red-500/50';
                        textColor = 'text-red-200';
                      }
                    } else if (isSelected) {
                      bgColor = 'bg-amber-500/20';
                      borderColor = 'border-amber-500/50';
                      textColor = 'text-amber-200';
                    }
                    
                    return (
                      <button
                        key={letter}
                        onClick={() => toggleAnswer(letter)}
                        disabled={showFeedback}
                        className={`w-full p-4 rounded-xl border ${bgColor} ${borderColor} text-left transition-all flex items-start gap-4`}
                      >
                        <span className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                          showFeedback && isCorrect ? 'bg-emerald-500 text-white' :
                          showFeedback && isSelected && !isCorrect ? 'bg-red-500 text-white' :
                          isSelected ? 'bg-amber-500 text-white' : 'bg-slate-600 text-slate-300'
                        }`}>
                          {letter}
                        </span>
                        <span className={textColor}>{text}</span>
                        {showFeedback && isCorrect && (
                          <CheckCircle className="w-5 h-5 text-emerald-500 ml-auto flex-shrink-0" />
                        )}
                        {showFeedback && isSelected && !isCorrect && (
                          <XCircle className="w-5 h-5 text-red-500 ml-auto flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
              </div>
            </div>
            
            {/* Confidence Selection (before submit) */}
            {!showFeedback && selectedAnswers.length > 0 && (
              <div className="flex items-center justify-center gap-4">
                <span className="text-sm text-slate-500">Confidence:</span>
                {(['low', 'medium', 'high'] as const).map(level => (
                  <button
                    key={level}
                    onClick={() => setConfidence(level)}
                    className={`px-4 py-2 rounded-lg text-sm transition-all ${
                      confidence === level 
                        ? 'bg-slate-700 text-slate-200' 
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </button>
                ))}
              </div>
            )}
            
            {/* Submit / Next Button */}
            <div className="flex justify-center">
              {!showFeedback ? (
                <button
                  onClick={submitAnswer}
                  disabled={selectedAnswers.length === 0}
                  className="px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-amber-500/20 transition-all"
                >
                  Submit Answer
                </button>
              ) : (
                <button
                  onClick={nextQuestion}
                  className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl font-semibold text-white hover:shadow-lg hover:shadow-emerald-500/20 transition-all flex items-center gap-2"
                >
                  Next Question
                  <ArrowRight className="w-5 h-5" />
                </button>
              )}
            </div>
            
            {/* Feedback Panel */}
            {showFeedback && (
              <div className={`p-6 rounded-2xl border ${
                selectedAnswers.every(a => currentQuestion.correct_answer.includes(a)) &&
                selectedAnswers.length === currentQuestion.correct_answer.length
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : 'bg-red-500/10 border-red-500/30'
              }`}>
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    selectedAnswers.every(a => currentQuestion.correct_answer.includes(a)) &&
                    selectedAnswers.length === currentQuestion.correct_answer.length
                      ? 'bg-emerald-500/20'
                      : 'bg-red-500/20'
                  }`}>
                    {selectedAnswers.every(a => currentQuestion.correct_answer.includes(a)) &&
                    selectedAnswers.length === currentQuestion.correct_answer.length
                      ? <CheckCircle className="w-5 h-5 text-emerald-400" />
                      : <XCircle className="w-5 h-5 text-red-400" />
                    }
                  </div>
                  <div className="flex-1">
                    <h4 className={`font-semibold mb-2 ${
                      selectedAnswers.every(a => currentQuestion.correct_answer.includes(a)) &&
                      selectedAnswers.length === currentQuestion.correct_answer.length
                        ? 'text-emerald-300'
                        : 'text-red-300'
                    }`}>
                      {selectedAnswers.every(a => currentQuestion.correct_answer.includes(a)) &&
                      selectedAnswers.length === currentQuestion.correct_answer.length
                        ? 'Correct!'
                        : 'Not quite right'}
                    </h4>
                    <p className="text-slate-300 text-sm leading-relaxed">{currentQuestion.rationale}</p>
                    
                    {/* Key Concepts */}
                    {currentQuestion.keyConcepts.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-slate-700/50">
                        <p className="text-xs text-slate-500 mb-2">KEY CONCEPTS:</p>
                        <div className="flex flex-wrap gap-2">
                          {currentQuestion.keyConcepts.map((concept, i) => (
                            <span key={i} className="px-2 py-1 bg-slate-700/50 rounded text-xs text-slate-300">
                              {concept}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* RESULTS SCREEN */}
        {mode === 'results' && (
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-slate-100">Your Progress</h2>
              <p className="text-slate-400">
                Based on {profile.practiceHistory.length} questions answered
              </p>
            </div>
            
            {/* Domain Scores */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
              <h3 className="font-semibold text-slate-200 mb-6 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-amber-500" />
                Domain Scores
              </h3>
              <div className="space-y-4">
                {(Object.entries(profile.domainScores) as [string, { correct: number; total: number }][])
                  .filter(([_, score]) => score.total > 0)
                  .sort((a, b) => (a[1].correct / a[1].total) - (b[1].correct / b[1].total))
                  .map(([domain, score]) => {
                    const pct = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;
                    const domainInfo = NASP_DOMAINS[parseInt(domain) as keyof typeof NASP_DOMAINS];
                    return (
                      <div key={domain} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-300">
                            {domainInfo?.shortName}: {domainInfo?.name}
                          </span>
                          <span className={`text-sm font-bold ${getScoreColor(pct / 100)}`}>
                            {pct}%
                          </span>
                        </div>
                        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all"
                            style={{ 
                              width: `${pct}%`,
                              backgroundColor: getDomainColor(parseInt(domain))
                            }}
                          />
                        </div>
                        <p className="text-xs text-slate-500">
                          {score.correct} of {score.total} correct
                        </p>
                      </div>
                    );
                  })}
              </div>
            </div>
            
            {/* Focus Areas */}
            {profile.weakestDomains.length > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6">
                <h3 className="font-semibold text-amber-300 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Recommended Focus Areas
                </h3>
                <div className="space-y-3">
                  {profile.weakestDomains.map(d => {
                    const domainInfo = NASP_DOMAINS[d as keyof typeof NASP_DOMAINS];
                    return (
                      <div key={d} className="p-4 bg-slate-800/50 rounded-xl">
                        <p className="font-medium text-slate-200">{domainInfo?.name}</p>
                        <p className="text-sm text-slate-400 mt-1">
                          Review: {domainInfo?.keyConcepts?.slice(0, 3).join(', ')}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Knowledge Gaps */}
            {profile.factualGaps.length > 0 && (
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
                <h3 className="font-semibold text-slate-200 mb-4 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-purple-400" />
                  Concepts to Review
                </h3>
                <div className="flex flex-wrap gap-2">
                  {profile.factualGaps.map((gap, i) => (
                    <span key={i} className="px-3 py-1.5 bg-purple-500/20 text-purple-300 rounded-full text-sm">
                      {gap}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Action Button */}
            <button
              onClick={startPractice}
              className="w-full p-6 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center gap-3 font-semibold text-white hover:shadow-lg hover:shadow-emerald-500/20 transition-all"
            >
              <Play className="w-5 h-5" />
              Start Adaptive Practice
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

// ============================================
// SAMPLE QUESTIONS (Replace with full 125)
// ============================================
const QUESTIONS_DATA = [
  {
    "id": "SP5403_Q001",
    "question": "Which of the following is a commonly used metric for establishing reliability of measurement within the context of a single-subject design?",
    "choices": {"A": "Internal consistency", "B": "Test-retest reliability", "C": "Interobserver agreement", "D": "The generalizability coefficient", "E": "", "F": ""},
    "correct_answer": ["C"],
    "rationale": "Option (C) is correct. Although all responses represent common reliability metrics, only interobserver agreement is commonly used within the context of single-subject design. In fact, the other metrics would be difficult to calculate given the nature of single-case data."
  },
  {
    "id": "SP5403_Q002",
    "question": "A school psychologist is working with a cultural broker to understand how to support a student who recently moved to the district from India. The school psychologist then shares the information from the cultural broker with the teachers to use in the classroom. Which of the following best describes the type of consultation being used?",
    "choices": {"A": "Consultee-centered", "B": "Multicultural", "C": "Problem-solving", "D": "Indirect", "E": "", "F": ""},
    "correct_answer": ["B"],
    "rationale": "Option (B) is correct. The school psychologist is seeking support related to a new cultural situation."
  },
  {
    "id": "SP5403_Q003",
    "question": "A school psychologist serves a population consisting primarily of non-White students, many of whom identify as Black and Hispanic American. The school psychologist approaches a more experienced colleague for advice. Which TWO of the following recommendations should be offered to the school psychologist?",
    "choices": {"A": "When using an interpreter in a family conference, direct statements and questions to the interpreter to increase the accuracy of the translation.", "B": "Understand that stereotypes can prevent understanding of factors unique to individual students and their families.", "C": "Be aware that individuals within a family often differ in the degree to which they identify with the majority culture.", "D": "Set aside personal cultural beliefs and values in working with this population.", "E": "", "F": ""},
    "correct_answer": ["B", "C"],
    "rationale": "Options (B) and (C) are correct. While stereotypes can be helpful in understanding a student's culture, they often become prejudicial in nature. Additionally, within a family, individuals vary in the degree to which they embrace aspects of the majority or mainstream culture."
  },
  {
    "id": "SP5403_Q004",
    "question": "Which of the following is the best example of action research?",
    "choices": {"A": "Reviewing the results of an empirical research study to find out whether a reading intervention is effective", "B": "Conducting an experimental study in the school to determine whether cognitive behavior techniques are effective in alleviating anxiety", "C": "Assisting a teacher in implementing a math intervention to determine whether it improves a class's math computation ability", "D": "Reading testimonials on a Web site for a writing intervention program and deciding to implement the program in the school", "E": "", "F": ""},
    "correct_answer": ["C"],
    "rationale": "Option (C) is correct. Action research in education is a form of applied research conducted with the primary purpose of improving an educational professional's own practice. It focuses on a direct and specific setting, such as with an individual or classroom."
  },
  {
    "id": "SP5403_Q005",
    "question": "Emily is a kindergarten student with a hearing impairment. She is experiencing difficulties in phonemic awareness and reading comprehension. Teacher of the Deaf (TOD) services have been recommended for Emily; however, the student support team director would prefer that a special education teacher provide these services. Which of the following is the most appropriate course of action to ensure that Emily's needs are met?",
    "choices": {"A": "Training the special education teacher to provide TOD services", "B": "Proceeding with the director's recommendation that only special education teacher supports are warranted", "C": "Insisting that Teacher of the Deaf services have been recommended and should be considered", "D": "Consulting with the speech and language therapist to revise Emily's plan of services", "E": "", "F": ""},
    "correct_answer": ["C"],
    "rationale": "Option (C) is correct. Because Emily has an identified hearing impairment in addition to difficulties in phonics/reading comprehension, Teacher of the Deaf services have been recommended and should be considered."
  },
  {
    "id": "SP5403_Q006",
    "question": "Juan is a third-grade student whose primary language is Spanish. Juan's teacher has observed that he has difficulty understanding and following directions. The teacher reports concerns with his sentence structure and grammar. Juan is reportedly quiet and does not speak much within the school environment. Based on this information, which of the following is the most appropriate recommendation at this time?",
    "choices": {"A": "Retaining Juan so he can develop his English skills with native-speaking peers", "B": "Considering English-language learner services or supports", "C": "Providing individual pull-out services for English language arts to improve Juan's grammar", "D": "Recommending small-group social skills training for Juan", "E": "", "F": ""},
    "correct_answer": ["B"],
    "rationale": "Option (B) is correct. Juan's primary language has been identified as Spanish; therefore, it is important to first consider his cultural and linguistic background."
  },
  {
    "id": "SP5403_Q007",
    "question": "Which THREE of the following does NASP suggest school psychologists do to combat implicit bias?",
    "choices": {"A": "Raise awareness of implicit bias by sharing research on the topic at faculty meetings", "B": "Advocate hiring faculty from diverse cultural backgrounds to work in the district", "C": "Take additional classes in multicultural psychology", "D": "Only work with students from the same cultural background as themselves", "E": "Continually be mindful of their own implicit biases when working with students and families", "F": "Decline to evaluate students from diverse backgrounds to avoid supporting disproportionate representations in special education"},
    "correct_answer": ["A", "B", "E"],
    "rationale": "Options (A), (B), and (E) are correct. Helping school staff raise awareness of implicit bias, advocating for diversity in hiring practices, and being mindful of one's own biases are all steps school psychologists should take."
  },
  {
    "id": "SP5403_Q008",
    "question": "Which THREE of the following are key components NASP considers necessary for developing threat-assessment policies in schools?",
    "choices": {"A": "Creating district-wide procedures", "B": "Conducting a needs assessment at the district and school levels", "C": "Creating a team of professionals from different disciplines to evaluate crisis response", "D": "Interviewing parents and students regarding the district's school safety policy", "E": "Raising awareness of district policies on school safety and threat response", "F": "Consulting cultural brokers for culturally sensitive crisis responses"},
    "correct_answer": ["A", "C", "E"],
    "rationale": "Options (A), (C), and (E) are correct. According to NASP, creating district-wide procedures, utilizing a multidisciplinary crisis-response team, and educating the school community are the main components in the development of threat-assessment policies."
  },
  {
    "id": "SP5403_Q009",
    "question": "A school psychologist is interested in research on grade retention and believes that reviewing a meta-analysis may be helpful. Which of the following studies best exemplifies a meta-analysis?",
    "choices": {"A": "Many studies related to grade retention were analyzed, and the overall effect size was calculated as a result of the synthesis of the research.", "B": "A study was conducted that compared grade retention rates to student dropout rates in one school.", "C": "A county researched the grade retention rates and compared the retention rates to the pass rate on the national state exam.", "D": "A student examines the number of students who have been retained over the past ten years in one district and compares their performance to their overall final high school GPA.", "E": "", "F": ""},
    "correct_answer": ["A"],
    "rationale": "Option (A) is correct. A meta-analysis is a synthesis of research studies that can be used to analyze trends in the magnitude of effects observed in a set of quantitative research studies all involving the same research question."
  },
  {
    "id": "SP5403_Q010",
    "question": "Which of the following is an example of test sensitivity?",
    "choices": {"A": "Performance on the DIBELS reading fluency measure was found to correlate well with other established measures of reading fluency.", "B": "Two different teachers complete the BASC-3 for the same student, and similar scores are found across most subscales between the two teachers.", "C": "The WISC-V accurately predicts which students are likely to be diagnosed with a specific learning disability.", "D": "The Woodcock-Johnson IV shows good consistency of results over multiple administrations across most subtests.", "E": "", "F": ""},
    "correct_answer": ["C"],
    "rationale": "Option (C) is correct. Test sensitivity refers to a test's rate of \"true positives\" and indicates that a test is able to accurately identify those who actually have a particular disorder or disability."
  },
  {
    "id": "SP5403_Q011",
    "question": "Which of the following court cases focuses on the duty to warn and protect others who may be in danger when someone reports intent to harm?",
    "choices": {"A": "Tarasoff v. Regents of the University of California", "B": "Mills v. Board of Education of the District of Columbia", "C": "Larry P. v. Riles", "D": "Lau v. Nichols", "E": "", "F": ""},
    "correct_answer": ["A"],
    "rationale": "Option (A) is correct. The Tarasoff case focused on the duty to warn and the duty to protect. The three other court cases have to do with civil rights."
  },
  {
    "id": "SP5403_Q012",
    "question": "An elementary school recently implemented a new reading program with the goal of reducing referrals. Because this initiative is new for the teachers, the building principal has asked the school psychologist to assist with implementation of the program. Which of the following activities is most appropriate for the school psychologist to participate in when assisting the teachers?",
    "choices": {"A": "Coteaching lessons once weekly to observe the students in the classroom", "B": "Conducting weekly observations of each classroom to determine if the teachers are correctly following the curriculum and reporting to the principal with information from the observation", "C": "Taking over for the teacher when implementing the reading program to identify students who might need more individualized support", "D": "Helping to develop a means of tracking the progress of students receiving the intervention program and assisting teachers with the data collection process", "E": "", "F": ""},
    "correct_answer": ["D"],
    "rationale": "Option (D) is correct. School psychologists should collaborate with teachers and assist with data collection and progress monitoring."
  },
  {
    "id": "SP5403_Q013",
    "question": "Which of the following is the first step in selecting an appropriate academic intervention?",
    "choices": {"A": "Selecting an appropriate evidence-based intervention", "B": "Monitoring the student's performance", "C": "Assessing the student's current level of functioning to identify the skill deficit", "D": "Evaluating the effectiveness of the intervention", "E": "", "F": ""},
    "correct_answer": ["C"],
    "rationale": "Option (C) is correct. Identifying the skill deficit is the first step in selecting an intervention. It is necessary to know what the student's baseline abilities are to know what to target with the intervention."
  },
  {
    "id": "SP5403_Q014",
    "question": "A school psychologist serving a rural school district has found that the district is resistant to using academic interventions. The district uses a curriculum that has not been updated for 15 years. The school psychologist has found that there are significant discrepancies between the achievement levels of students who attend the district schools and those who attend the nearby city schools. Which of the following is the best course of action for the school psychologist to begin addressing the discrepancies?",
    "choices": {"A": "Advocating with district leaders for an update to the curriculum based on the evidence that shows the discrepancies between districts", "B": "Continuing to advocate with teachers for interventions that address specific student deficits and documenting results", "C": "Meeting with families to discuss their children's educational deficits and providing at-home intervention activities to increase achievement", "D": "Presenting to the school board on how the school psychologist can improve district outcomes through evaluating more students for special education", "E": "", "F": ""},
    "correct_answer": ["A"],
    "rationale": "Option (A) is correct. School psychologists should advocate for systemic change to address educational discrepancies between districts."
  },
  {
    "id": "SP5403_Q015",
    "question": "Which of the following is the best example of a functional behavior assessment (FBA)?",
    "choices": {"A": "Completing a cognitive and achievement assessment for the purpose of identifying a specific learning disability", "B": "Analyzing data to identify academic difficulties that can be addressed with interventions", "C": "Completing an observation and interview for the purpose of identifying the function of a student's problem behavior", "D": "Completing a depression screening for the purpose of identifying mental health concerns", "E": "", "F": ""},
    "correct_answer": ["C"],
    "rationale": "Option (C) is correct. FBAs are used to understand the function of a student's behavior and what conditions maintain the behavior."
  },
  {
    "id": "SP5403_Q016",
    "question": "Which of the following is an example of progress monitoring?",
    "choices": {"A": "Completing cognitive testing to identify intellectual ability", "B": "Completing classroom observations of a student for the purpose of identifying the function of a behavior", "C": "Completing reading curriculum-based measures weekly to identify reading growth", "D": "Administering a universal reading screener to all students", "E": "", "F": ""},
    "correct_answer": ["C"],
    "rationale": "Option (C) is correct. Progress monitoring involves frequent assessment of a skill over time to determine student growth."
  },
  {
    "id": "SP5403_Q017",
    "question": "A school psychologist is working with an eighth-grade student who has been demonstrating depressive symptoms. When the student says that she has been thinking about suicide, the school psychologist should first",
    "choices": {"A": "immediately contact the student's parents or guardians", "B": "ask the student if she has a plan for self-harm", "C": "ask the student if she feels safe", "D": "immediately contact a crisis center", "E": "", "F": ""},
    "correct_answer": ["B"],
    "rationale": "Option (B) is correct. The first response should be to assess the level of risk by asking whether the student has a plan."
  },
  {
    "id": "SP5403_Q018",
    "question": "Which of the following describes a key difference between formative and summative assessments?",
    "choices": {"A": "Formative assessments occur at the end of instruction, while summative assessments occur during instruction.", "B": "Formative assessments are used to guide instruction, while summative assessments are used to evaluate learning at the end of instruction.", "C": "Formative assessments are graded, while summative assessments are not graded.", "D": "Formative assessments are used to rank students, while summative assessments are not used for ranking.", "E": "", "F": ""},
    "correct_answer": ["B"],
    "rationale": "Option (B) is correct. Formative assessments guide instruction while summative assessments evaluate cumulative learning."
  },
  {
    "id": "SP5403_Q019",
    "question": "A school psychologist has recently been hired to work at an elementary school. The principal informs the psychologist that over the past year, there has been an increase in behavior referrals for students on the playground and in the hallways. Which of the following steps should the school psychologist take first?",
    "choices": {"A": "Meet with classroom teachers to identify strategies they use for playground and hallway transitions", "B": "Review the referral data to identify common problem behaviors and the locations where they occur most frequently", "C": "Contact the district's behavior specialist to schedule professional development on positive behavior support strategies", "D": "Present a plan to implement a schoolwide positive behavior intervention and support (PBIS) program", "E": "", "F": ""},
    "correct_answer": ["B"],
    "rationale": "Option (B) is correct. Data-based decision making requires reviewing data before making recommendations."
  },
  {
    "id": "SP5403_Q020",
    "question": "A school psychologist is working with Sarah, a tenth-grade student who has expressed frustration with her lack of progress in math class. She has said that she studies hard and does well on most of her homework but that she does poorly on tests. During the evaluation, the school psychologist notices that Sarah appears very anxious during testing. Which of the following would be the best first step for the school psychologist to take?",
    "choices": {"A": "Recommend that Sarah be provided with extended testing time on all math tests", "B": "Teach Sarah strategies to help her manage her anxiety during tests", "C": "Contact Sarah's parents to suggest she see a doctor about anxiety medication", "D": "Suggest that Sarah's teacher allow her to take tests in a separate, quieter location", "E": "", "F": ""},
    "correct_answer": ["B"],
    "rationale": "Option (B) is correct. Teaching anxiety management strategies is the most appropriate first step."
  },
  {
    "id": "SP5403_Q021",
    "question": "A school psychologist is evaluating David, a fourth-grade student, for special education eligibility. Which of the following sources of data would be most important for the school psychologist to gather to determine whether David qualifies for special education services?",
    "choices": {"A": "Medical records, teacher interview, and behavior checklist", "B": "Cognitive assessment, achievement assessment, and progress monitoring data", "C": "Parent interview, classroom observation, and medical records", "D": "Universal screening data, teacher interview, and parent interview", "E": "", "F": ""},
    "correct_answer": ["B"],
    "rationale": "Option (B) is correct. Cognitive and achievement assessments along with progress monitoring data are most directly relevant to determining eligibility."
  },
  {
    "id": "SP5403_Q022",
    "question": "Which of the following is the best example of a Tier 2 intervention?",
    "choices": {"A": "A schoolwide positive behavior support program", "B": "A small-group social skills intervention", "C": "An individualized behavior intervention plan", "D": "A universal reading curriculum", "E": "", "F": ""},
    "correct_answer": ["B"],
    "rationale": "Option (B) is correct. Tier 2 interventions target small groups of students who need more support than Tier 1."
  },
  {
    "id": "SP5403_Q023",
    "question": "A school psychologist is leading a professional development session on evidence-based practices in education. Which of the following best describes an evidence-based practice?",
    "choices": {"A": "A practice that has been used for many years and is supported by experienced teachers", "B": "A practice that has been shown by rigorous research to produce positive results", "C": "A practice that was developed by experts in the field", "D": "A practice that is mandated by state or federal law", "E": "", "F": ""},
    "correct_answer": ["B"],
    "rationale": "Option (B) is correct. Evidence-based practices are supported by rigorous research demonstrating effectiveness."
  },
  {
    "id": "SP5403_Q024",
    "question": "Which of the following is NOT typically a role of the school psychologist in a problem-solving team meeting?",
    "choices": {"A": "Facilitating the meeting and keeping the team focused on the agenda", "B": "Making the final decision about which interventions to implement", "C": "Analyzing assessment data and sharing the results with the team", "D": "Helping the team identify evidence-based interventions", "E": "", "F": ""},
    "correct_answer": ["B"],
    "rationale": "Option (B) is correct. School psychologists facilitate but do not make unilateral decisions; the team decides together."
  },
  {
    "id": "SP5403_Q025",
    "question": "A school psychologist administers an intelligence test to a student. The student earns a Full Scale IQ score of 85 with a 95% confidence interval of 80-90. Which of the following is the best interpretation of this result?",
    "choices": {"A": "The student's true IQ is 85.", "B": "There is a 95% probability that the student's true IQ falls between 80 and 90.", "C": "The student will always score between 80 and 90 on this test.", "D": "The student's IQ score is significantly below average.", "E": "", "F": ""},
    "correct_answer": ["B"],
    "rationale": "Option (B) is correct. The confidence interval indicates the range within which the true score likely falls."
  },
  {
    "id": "SP5403_Q026",
    "question": "Which of the following is the best strategy for a school psychologist to use when building rapport with a student who is reluctant to participate in an evaluation?",
    "choices": {"A": "Explaining the consequences if the student refuses to participate", "B": "Starting with less demanding tasks and gradually moving to more challenging tasks", "C": "Having the student's teacher or parent present during the evaluation", "D": "Rushing through the evaluation to minimize the student's discomfort", "E": "", "F": ""},
    "correct_answer": ["B"],
    "rationale": "Option (B) is correct. Starting with easier tasks helps build rapport and reduce anxiety."
  },
  {
    "id": "SP5403_Q027",
    "question": "A school psychologist is consulting with a teacher about a student who frequently calls out answers without raising his hand. Which of the following intervention strategies would most directly address this behavior?",
    "choices": {"A": "Providing the student with a fidget toy to keep his hands busy", "B": "Moving the student's seat closer to the teacher", "C": "Teaching the student to use a self-monitoring checklist", "D": "Providing the student with more opportunities to respond appropriately", "E": "", "F": ""},
    "correct_answer": ["C"],
    "rationale": "Option (C) is correct. Self-monitoring helps students become aware of and regulate their own behavior."
  },
  {
    "id": "SP5403_Q028",
    "question": "A school psychologist is working with a student who has been identified as having a specific learning disability in reading. Which of the following assessment approaches would be most appropriate to determine the student's instructional level?",
    "choices": {"A": "Administering a standardized achievement test", "B": "Administering curriculum-based measurement probes", "C": "Administering a standardized intelligence test", "D": "Conducting a classroom observation", "E": "", "F": ""},
    "correct_answer": ["B"],
    "rationale": "Option (B) is correct. CBM probes are designed to determine instructional levels and monitor progress."
  },
  {
    "id": "SP5403_Q029",
    "question": "Which of the following best describes the purpose of a behavior intervention plan (BIP)?",
    "choices": {"A": "To document the frequency and severity of a student's problem behaviors", "B": "To identify the consequences that will be applied when a student misbehaves", "C": "To provide a comprehensive plan for addressing problem behaviors based on the function of the behavior", "D": "To determine whether a student qualifies for special education services", "E": "", "F": ""},
    "correct_answer": ["C"],
    "rationale": "Option (C) is correct. A BIP is based on FBA findings and addresses the function of the behavior."
  },
  {
    "id": "SP5403_Q030",
    "question": "A school psychologist is working with a third-grade student who has difficulty completing assignments independently. The teacher reports that the student frequently asks for help and does not begin tasks without prompting. Which of the following strategies would be most effective for increasing the student's independent work completion?",
    "choices": {"A": "Providing the student with extended time to complete assignments", "B": "Having the student complete assignments in a resource room with adult support", "C": "Teaching the student to use a self-instruction strategy to guide task completion", "D": "Modifying assignments to reduce the number of problems", "E": "", "F": ""},
    "correct_answer": ["C"],
    "rationale": "Option (C) is correct. Self-instruction strategies teach students to guide themselves through tasks independently."
  },
  {
    "id": "SP5403_Q031",
    "question": "Which of the following types of validity evidence is most directly assessed by examining the relationship between test scores and an external criterion?",
    "choices": {"A": "Content validity", "B": "Construct validity", "C": "Criterion-related validity", "D": "Face validity", "E": "", "F": ""},
    "correct_answer": ["C"],
    "rationale": "Option (C) is correct. Criterion-related validity examines the relationship between test scores and external criteria."
  },
  {
    "id": "SP5403_Q032",
    "question": "A school psychologist is evaluating a student who was recently adopted from another country. The student has limited English proficiency and has been in the United States for less than one year. Which of the following should the school psychologist consider most carefully when selecting assessment instruments?",
    "choices": {"A": "Choosing tests with strong reliability evidence", "B": "Selecting tests that were normed on students from the student's country of origin", "C": "Using nonverbal measures of cognitive ability", "D": "Administering tests in the student's native language only", "E": "", "F": ""},
    "correct_answer": ["C"],
    "rationale": "Option (C) is correct. Nonverbal measures reduce the impact of language barriers on assessment results."
  },
  {
    "id": "SP5403_Q033",
    "question": "A school psychologist is presenting results of an evaluation to a student's parents. The psychologist should",
    "choices": {"A": "use technical jargon to demonstrate expertise", "B": "focus only on the student's weaknesses to justify the need for services", "C": "explain results in language that is easy for the parents to understand", "D": "avoid discussing any results that might concern the parents", "E": "", "F": ""},
    "correct_answer": ["C"],
    "rationale": "Option (C) is correct. Results should be communicated in accessible language that parents can understand."
  },
  {
    "id": "SP5403_Q034",
    "question": "Which of the following is the most appropriate use of intelligence test scores in educational decision-making?",
    "choices": {"A": "To rank students by ability and track them into different educational programs", "B": "To predict a student's potential for academic achievement and success in life", "C": "To identify discrepancies between ability and achievement for eligibility determination", "D": "To determine the specific academic interventions a student needs", "E": "", "F": ""},
    "correct_answer": ["C"],
    "rationale": "Option (C) is correct. IQ scores are commonly used to identify ability-achievement discrepancies for eligibility purposes."
  },
  {
    "id": "SP5403_Q035",
    "question": "A school psychologist is working with a middle school student who has been experiencing social difficulties. The student reports feeling lonely and having trouble making friends. Which of the following interventions would be most appropriate?",
    "choices": {"A": "Referring the student for individual counseling with an outside therapist", "B": "Enrolling the student in a social skills group at school", "C": "Suggesting the parents arrange more playdates for the student", "D": "Recommending the student be placed in a smaller classroom setting", "E": "", "F": ""},
    "correct_answer": ["B"],
    "rationale": "Option (B) is correct. A social skills group provides structured practice in a school setting."
  },
  {
    "id": "SP5403_Q036",
    "question": "Which of the following assessment tools would be most appropriate for identifying students who may be at risk for reading difficulties at the beginning of first grade?",
    "choices": {"A": "A standardized reading achievement test", "B": "A phonemic awareness screening measure", "C": "A comprehensive reading diagnostic assessment", "D": "A reading interest inventory", "E": "", "F": ""},
    "correct_answer": ["B"],
    "rationale": "Option (B) is correct. Phonemic awareness screening identifies early reading risk efficiently."
  },
  {
    "id": "SP5403_Q037",
    "question": "A school psychologist is consulting with a teacher about a student who has been having difficulty staying on task during independent work time. The teacher has tried several strategies but has not seen improvement. Which of the following should the school psychologist recommend first?",
    "choices": {"A": "Referring the student for a comprehensive evaluation", "B": "Collecting more detailed data on the specific behaviors and conditions", "C": "Implementing a token economy system", "D": "Recommending the student for placement in a more structured classroom", "E": "", "F": ""},
    "correct_answer": ["B"],
    "rationale": "Option (B) is correct. Collecting detailed data helps identify the function of the behavior before selecting interventions."
  },
  {
    "id": "SP5403_Q038",
    "question": "Which of the following is a characteristic of a well-designed single-subject research study?",
    "choices": {"A": "Random assignment to treatment and control groups", "B": "Large sample size", "C": "Multiple measures of the target behavior over time", "D": "Double-blind procedures", "E": "", "F": ""},
    "correct_answer": ["C"],
    "rationale": "Option (C) is correct. Single-subject designs rely on repeated measurement over time."
  },
  {
    "id": "SP5403_Q039",
    "question": "A school psychologist is reviewing the results of a standardized test. The test manual indicates that the test has a reliability coefficient of .95. Which of the following best describes what this means?",
    "choices": {"A": "The test measures what it claims to measure 95% of the time.", "B": "Scores on this test are highly consistent and stable.", "C": "95% of students will score within the average range.", "D": "The test predicts future performance with 95% accuracy.", "E": "", "F": ""},
    "correct_answer": ["B"],
    "rationale": "Option (B) is correct. A reliability coefficient of .95 indicates high consistency of scores."
  },
  {
    "id": "SP5403_Q040",
    "question": "According to NASP's Model for Comprehensive and Integrated School Psychological Services, which of the following is considered a foundational domain?",
    "choices": {"A": "Data-based decision making", "B": "Consultation and collaboration", "C": "Legal, ethical, and professional practice", "D": "Interventions and instructional support", "E": "", "F": ""},
    "correct_answer": ["C"],
    "rationale": "Option (C) is correct. Legal, ethical, and professional practice is considered a foundational domain."
  },
  {
    "id": "SP5403_Q041",
    "question": "A school psychologist is working with a student who has a history of aggressive behavior. The student recently made a statement suggesting he might hurt another student. Which of the following should the school psychologist do first?",
    "choices": {"A": "Contact the student's parents", "B": "Report the statement to the school administration", "C": "Conduct a threat assessment", "D": "Document the statement and continue monitoring", "E": "", "F": ""},
    "correct_answer": ["C"],
    "rationale": "Option (C) is correct. A threat assessment should be conducted first to evaluate the level of risk."
  },
  {
    "id": "SP5403_Q042",
    "question": "Which of the following is the best example of a performance-based assessment?",
    "choices": {"A": "A multiple-choice test on math facts", "B": "A written essay on a historical topic", "C": "A standardized reading comprehension test", "D": "A teacher rating scale of student behavior", "E": "", "F": ""},
    "correct_answer": ["B"],
    "rationale": "Option (B) is correct. Performance-based assessments require students to demonstrate skills through authentic tasks."
  },
  {
    "id": "SP5403_Q043",
    "question": "A school psychologist is working with a student who has been diagnosed with ADHD. Which of the following classroom accommodations would be most likely to help the student stay focused during instruction?",
    "choices": {"A": "Reducing the amount of homework assigned", "B": "Providing preferential seating near the teacher", "C": "Allowing the student to retake tests until passing", "D": "Excusing the student from group activities", "E": "", "F": ""},
    "correct_answer": ["B"],
    "rationale": "Option (B) is correct. Preferential seating helps students with ADHD maintain attention."
  },
  {
    "id": "SP5403_Q044",
    "question": "Which of the following best describes the concept of response to intervention (RTI)?",
    "choices": {"A": "A model for identifying students with disabilities based on IQ-achievement discrepancies", "B": "A multi-tiered system for providing increasingly intensive interventions to struggling students", "C": "A process for evaluating the effectiveness of special education programs", "D": "A method for assessing student intelligence without standardized tests", "E": "", "F": ""},
    "correct_answer": ["B"],
    "rationale": "Option (B) is correct. RTI is a multi-tiered prevention and intervention framework."
  },
  {
    "id": "SP5403_Q045",
    "question": "A school psychologist is evaluating a student for possible autism spectrum disorder. Which of the following assessment approaches would be most appropriate?",
    "choices": {"A": "Administering only standardized cognitive and achievement tests", "B": "Using multiple sources of information including observation, interviews, and rating scales", "C": "Relying primarily on parent report of early developmental history", "D": "Focusing exclusively on academic performance data", "E": "", "F": ""},
    "correct_answer": ["B"],
    "rationale": "Option (B) is correct. ASD evaluation requires multiple sources and methods."
  },
  {
    "id": "SP5403_Q046",
    "question": "Which of the following is the most appropriate way for a school psychologist to respond when a parent requests that their child's evaluation report not be shared with the school?",
    "choices": {"A": "Agree to keep the report confidential from school staff", "B": "Explain that the report will be shared only with team members who need the information", "C": "Refuse to complete the evaluation", "D": "Share the full report with all school staff", "E": "", "F": ""},
    "correct_answer": ["B"],
    "rationale": "Option (B) is correct. Reports should be shared with those who have a legitimate educational need."
  },
  {
    "id": "SP5403_Q047",
    "question": "A school psychologist is working with a student who has anxiety. The student's teacher reports that the student frequently asks to leave class to go to the nurse's office. Which of the following is the most likely function of this behavior?",
    "choices": {"A": "Attention seeking", "B": "Escape or avoidance", "C": "Sensory stimulation", "D": "Tangible reinforcement", "E": "", "F": ""},
    "correct_answer": ["B"],
    "rationale": "Option (B) is correct. The behavior likely functions to escape anxiety-provoking situations."
  },
  {
    "id": "SP5403_Q048",
    "question": "Which of the following statistical concepts is most useful for understanding how much variability in a student's test scores is due to measurement error?",
    "choices": {"A": "Mean", "B": "Standard deviation", "C": "Standard error of measurement", "D": "Correlation coefficient", "E": "", "F": ""},
    "correct_answer": ["C"],
    "rationale": "Option (C) is correct. SEM indicates variability due to measurement error."
  },
  {
    "id": "SP5403_Q049",
    "question": "A school psychologist is conducting a consultation with a teacher about a student's behavior. Which of the following consultation models emphasizes collaboration between the consultant and consultee?",
    "choices": {"A": "Expert consultation", "B": "Behavioral consultation", "C": "Mental health consultation", "D": "Conjoint behavioral consultation", "E": "", "F": ""},
    "correct_answer": ["D"],
    "rationale": "Option (D) is correct. Conjoint behavioral consultation involves collaboration between home and school."
  },
  {
    "id": "SP5403_Q050",
    "question": "Which of the following is the best way for a school psychologist to ensure cultural responsiveness when conducting an evaluation?",
    "choices": {"A": "Using only nonverbal tests for all students from diverse backgrounds", "B": "Considering the student's cultural and linguistic background when interpreting results", "C": "Avoiding discussion of cultural factors to maintain objectivity", "D": "Using tests that have been translated into the student's native language", "E": "", "F": ""},
    "correct_answer": ["B"],
    "rationale": "Option (B) is correct. Cultural responsiveness requires considering background in interpretation."
  },
  {
    "id": "SP5403_Q051",
    "question": "A school psychologist is working with a student who exhibits oppositional behavior. The teacher reports that the student often refuses to follow directions and argues with adults. Which of the following interventions would be most effective as a first step?",
    "choices": {"A": "Implementing a punishment-based consequence system", "B": "Providing clear expectations and positive reinforcement for compliance", "C": "Removing the student from class when oppositional behavior occurs", "D": "Referring the student for an outside mental health evaluation", "E": "", "F": ""},
    "correct_answer": ["B"],
    "rationale": "Option (B) is correct. Clear expectations with positive reinforcement is an effective first step."
  },
  {
    "id": "SP5403_Q052",
    "question": "Which of the following is a key characteristic of norm-referenced tests?",
    "choices": {"A": "They measure a student's mastery of specific content standards.", "B": "They compare a student's performance to that of a representative sample.", "C": "They assess a student's rate of progress over time.", "D": "They are designed to be administered by classroom teachers.", "E": "", "F": ""},
    "correct_answer": ["B"],
    "rationale": "Option (B) is correct. Norm-referenced tests compare performance to a normative sample."
  },
  {
    "id": "SP5403_Q053",
    "question": "A school psychologist notices that a disproportionate number of students from one ethnic group are being referred for special education evaluation. Which of the following is the most appropriate first step to address this issue?",
    "choices": {"A": "Declining to evaluate students from that ethnic group", "B": "Examining referral practices and data to identify potential sources of bias", "C": "Recommending fewer students from that group for special education services", "D": "Using only assessments developed for that specific ethnic group", "E": "", "F": ""},
    "correct_answer": ["B"],
    "rationale": "Option (B) is correct. Examining data helps identify potential sources of disproportionality."
  },
  {
    "id": "SP5403_Q054",
    "question": "Which of the following best describes the difference between accommodations and modifications?",
    "choices": {"A": "Accommodations change what is taught; modifications change how it is taught.", "B": "Accommodations change how a student learns or demonstrates learning; modifications change the learning expectations.", "C": "Accommodations are only for students with disabilities; modifications are for all students.", "D": "Accommodations are permanent; modifications are temporary.", "E": "", "F": ""},
    "correct_answer": ["B"],
    "rationale": "Option (B) is correct. Accommodations change how; modifications change what is expected."
  },
  {
    "id": "SP5403_Q055",
    "question": "A school psychologist is working with a high school student who is planning for transition to postsecondary education. Which of the following assessment areas would be most important to address?",
    "choices": {"A": "Phonemic awareness", "B": "Self-determination and self-advocacy skills", "C": "Fine motor coordination", "D": "Prereading skills", "E": "", "F": ""},
    "correct_answer": ["B"],
    "rationale": "Option (B) is correct. Self-determination and advocacy are critical for postsecondary success."
  },
  {
    "id": "SP5403_Q056",
    "question": "Which of the following is the most appropriate role for a school psychologist during a crisis response?",
    "choices": {"A": "Providing long-term individual therapy to affected students", "B": "Offering immediate psychological first aid and support", "C": "Conducting comprehensive mental health evaluations", "D": "Assigning students to support groups based on diagnosis", "E": "", "F": ""},
    "correct_answer": ["B"],
    "rationale": "Option (B) is correct. During crisis response, immediate psychological first aid is the primary role."
  },
  {
    "id": "SP5403_Q057",
    "question": "A school psychologist is reviewing research on a reading intervention program. Which of the following research designs would provide the strongest evidence of the program's effectiveness?",
    "choices": {"A": "A case study of one student who improved after using the program", "B": "A randomized controlled trial comparing students who used the program to those who did not", "C": "A survey of teachers who used the program and reported satisfaction", "D": "A comparison of test scores before and after program implementation without a control group", "E": "", "F": ""},
    "correct_answer": ["B"],
    "rationale": "Option (B) is correct. RCTs provide the strongest causal evidence."
  },
  {
    "id": "SP5403_Q058",
    "question": "Which of the following cognitive processes is most directly assessed by measures of processing speed?",
    "choices": {"A": "The ability to hold information in mind while working with it", "B": "The ability to quickly and efficiently perform simple cognitive tasks", "C": "The ability to reason and solve novel problems", "D": "The ability to retrieve information from long-term memory", "E": "", "F": ""},
    "correct_answer": ["B"],
    "rationale": "Option (B) is correct. Processing speed measures quick, efficient completion of simple cognitive tasks."
  },
  {
    "id": "SP5403_Q059",
    "question": "A school psychologist is conducting a counseling session with a student who is struggling with peer relationships. Which of the following approaches would be most consistent with a cognitive-behavioral perspective?",
    "choices": {"A": "Exploring the student's early childhood experiences", "B": "Helping the student identify and challenge negative thoughts about peers", "C": "Using play therapy techniques to help the student express feelings", "D": "Focusing on the unconscious motivations behind the student's behavior", "E": "", "F": ""},
    "correct_answer": ["B"],
    "rationale": "Option (B) is correct. CBT focuses on identifying and challenging maladaptive thoughts."
  },
  {
    "id": "SP5403_Q060",
    "question": "Which of the following is the most appropriate use of standardized test norms?",
    "choices": {"A": "To determine whether a student has mastered grade-level content standards", "B": "To compare a student's performance to that of same-age or same-grade peers", "C": "To measure a student's rate of improvement over time", "D": "To identify specific skills that need remediation", "E": "", "F": ""},
    "correct_answer": ["B"],
    "rationale": "Option (B) is correct. Norms are used to compare performance to same-age or grade peers."
  },
  {
    "id": "SP5403_Q061",
    "question": "A school psychologist is working with a student whose parents are going through a divorce. The student has been having difficulty concentrating in class. Which of the following would be the most appropriate intervention?",
    "choices": {"A": "Referring the student for a comprehensive evaluation for attention problems", "B": "Providing supportive counseling to help the student cope with the family changes", "C": "Recommending that the student be placed in a smaller classroom", "D": "Contacting the parents to recommend family therapy", "E": "", "F": ""},
    "correct_answer": ["B"],
    "rationale": "Option (B) is correct. Supportive counseling helps address situational stressors."
  },
  {
    "id": "SP5403_Q062",
    "question": "Which of the following is a primary advantage of using curriculum-based measurement for progress monitoring?",
    "choices": {"A": "It provides detailed diagnostic information about specific skill deficits.", "B": "It can be administered frequently without practice effects.", "C": "It compares students to a national normative sample.", "D": "It measures a comprehensive range of academic skills.", "E": "", "F": ""},
    "correct_answer": ["B"],
    "rationale": "Option (B) is correct. CBM can be administered frequently without practice effects impacting results."
  },
  {
    "id": "SP5403_Q063",
    "question": "A school psychologist is asked to help a teacher who is struggling to manage a particularly challenging classroom. Which of the following consultation approaches would be most effective?",
    "choices": {"A": "Taking over the classroom for a day to demonstrate effective strategies", "B": "Working collaboratively with the teacher to identify problems and develop solutions", "C": "Providing the teacher with a list of research-based strategies to implement", "D": "Observing the classroom and reporting findings to the principal", "E": "", "F": ""},
    "correct_answer": ["B"],
    "rationale": "Option (B) is correct. Collaborative problem-solving is most effective for consultation."
  },
  {
    "id": "SP5403_Q064",
    "question": "Which of the following assessment tools would be most appropriate for measuring a student's executive functioning skills?",
    "choices": {"A": "A standardized achievement test", "B": "A behavior rating scale designed to assess executive function", "C": "A projective personality assessment", "D": "A universal reading screener", "E": "", "F": ""},
    "correct_answer": ["B"],
    "rationale": "Option (B) is correct. Executive function rating scales specifically measure these skills."
  },
  {
    "id": "SP5403_Q065",
    "question": "A school psychologist is interpreting results from a cognitive assessment. The student's Verbal Comprehension Index score is significantly higher than the Perceptual Reasoning Index score. Which of the following interpretations is most appropriate?",
    "choices": {"A": "The student has a learning disability.", "B": "The Full Scale IQ is a valid representation of the student's overall ability.", "C": "The student shows a pattern of relative strengths and weaknesses that should be considered in educational planning.", "D": "The student should be referred for further evaluation of nonverbal learning disability.", "E": "", "F": ""},
    "correct_answer": ["C"],
    "rationale": "Option (C) is correct. Score differences indicate patterns to consider in planning."
  },
  {
    "id": "SP5403_Q066",
    "question": "Which of the following is the best example of applied behavior analysis?",
    "choices": {"A": "Using psychoanalytic techniques to understand a student's behavior", "B": "Implementing systematic reinforcement procedures to change behavior", "C": "Prescribing medication to address behavioral symptoms", "D": "Using projective techniques to assess personality", "E": "", "F": ""},
    "correct_answer": ["B"],
    "rationale": "Option (B) is correct. ABA uses systematic reinforcement to change behavior."
  },
  {
    "id": "SP5403_Q067",
    "question": "A school psychologist is conducting an evaluation of a student referred for possible specific learning disability. Which of the following would be most important to rule out before identifying the student as having SLD?",
    "choices": {"A": "Emotional disturbance", "B": "Lack of appropriate instruction", "C": "Autism spectrum disorder", "D": "Other health impairment", "E": "", "F": ""},
    "correct_answer": ["B"],
    "rationale": "Option (B) is correct. SLD identification requires ruling out inadequate instruction."
  },
  {
    "id": "SP5403_Q068",
    "question": "Which of the following best describes the purpose of universal screening?",
    "choices": {"A": "To diagnose specific disabilities in students", "B": "To identify students who may need additional support or intervention", "C": "To determine eligibility for special education services", "D": "To evaluate the effectiveness of classroom instruction", "E": "", "F": ""},
    "correct_answer": ["B"],
    "rationale": "Option (B) is correct. Universal screening identifies students who may need additional support."
  },
  {
    "id": "SP5403_Q069",
    "question": "A school psychologist is working with a student who has been identified as gifted. The student reports feeling bored and unchallenged in class. Which of the following would be the most appropriate recommendation?",
    "choices": {"A": "Placing the student in a self-contained classroom for students with disabilities", "B": "Providing enrichment activities and acceleration opportunities", "C": "Recommending that the student skip two grade levels", "D": "Suggesting the parents find educational opportunities outside of school", "E": "", "F": ""},
    "correct_answer": ["B"],
    "rationale": "Option (B) is correct. Enrichment and acceleration address the needs of gifted students."
  },
  {
    "id": "SP5403_Q070",
    "question": "Which of the following is the most appropriate use of dynamic assessment?",
    "choices": {"A": "To compare a student's performance to national norms", "B": "To assess a student's learning potential and responsiveness to instruction", "C": "To diagnose specific learning disabilities", "D": "To measure achievement in specific academic content areas", "E": "", "F": ""},
    "correct_answer": ["B"],
    "rationale": "Option (B) is correct. Dynamic assessment evaluates learning potential and responsiveness."
  },
  {
    "id": "SP5403_Q071",
    "question": "A school psychologist is meeting with a parent who is concerned about their child's progress. The parent asks the school psychologist to explain what a percentile rank means. Which of the following explanations would be most accurate and helpful?",
    "choices": {"A": "It shows the percentage of questions your child answered correctly.", "B": "It shows how your child's performance compares to other students of the same age or grade.", "C": "It predicts your child's future academic success.", "D": "It shows the percentage of content your child has mastered.", "E": "", "F": ""},
    "correct_answer": ["B"],
    "rationale": "Option (B) is correct. Percentile ranks compare performance to same-age/grade peers."
  },
  {
    "id": "SP5403_Q072",
    "question": "Which of the following is the best strategy for a school psychologist to use when working with resistant parents who do not want their child evaluated?",
    "choices": {"A": "Proceeding with the evaluation since it is in the child's best interest", "B": "Building rapport and explaining the potential benefits of the evaluation", "C": "Having the principal contact the parents to require participation", "D": "Documenting the refusal and closing the case", "E": "", "F": ""},
    "correct_answer": ["B"],
    "rationale": "Option (B) is correct. Building rapport and explaining benefits helps engage reluctant parents."
  },
  {
    "id": "SP5403_Q073",
    "question": "A school psychologist is working with a student who exhibits anxiety in test-taking situations. The student's teacher asks the school psychologist to provide extended time on tests as an accommodation. Which of the following should the school psychologist do?",
    "choices": {"A": "Recommend extended time for all students in the class to be fair", "B": "Gather data to determine whether extended time is an appropriate accommodation for this student", "C": "Refuse to provide any accommodations until a formal evaluation is completed", "D": "Automatically approve the extended time request since the teacher made the request", "E": "", "F": ""},
    "correct_answer": ["B"],
    "rationale": "Option (B) is correct. Data should inform accommodation decisions."
  },
  {
    "id": "SP5403_Q074",
    "question": "Which of the following is a key principle of positive behavior support?",
    "choices": {"A": "Punishment is the most effective way to change behavior.", "B": "Behavior should be addressed by changing the environment and teaching new skills.", "C": "Problem behavior indicates that a student needs a more restrictive placement.", "D": "Behavior change occurs best through external control systems.", "E": "", "F": ""},
    "correct_answer": ["B"],
    "rationale": "Option (B) is correct. PBS emphasizes environmental change and skill teaching."
  },
  {
    "id": "SP5403_Q075",
    "question": "A school psychologist is conducting a group counseling session for students who have experienced recent loss. Which of the following is the most important consideration when forming the group?",
    "choices": {"A": "Ensuring all students in the group have the same type of loss", "B": "Including students who are at similar developmental levels", "C": "Requiring parent permission for participation", "D": "Limiting the group to no more than three students", "E": "", "F": ""},
    "correct_answer": ["C"],
    "rationale": "Option (C) is correct. Parent permission is required for group counseling participation."
  },
  {
    "id": "SP5403_Q076",
    "question": "Which of the following best describes the difference between intelligence and achievement?",
    "choices": {"A": "Intelligence measures what a student knows; achievement measures learning potential.", "B": "Intelligence measures reasoning and problem-solving ability; achievement measures learned knowledge and skills.", "C": "Intelligence is fixed; achievement changes over time.", "D": "Intelligence tests are norm-referenced; achievement tests are criterion-referenced.", "E": "", "F": ""},
    "correct_answer": ["B"],
    "rationale": "Option (B) is correct. Intelligence measures cognitive abilities; achievement measures learned content."
  },
  {
    "id": "SP5403_Q077",
    "question": "A school psychologist is developing a behavior intervention plan for a student who engages in frequent off-task behavior during independent work time. Functional behavior assessment data suggest the behavior is maintained by escape from task demands. Which of the following interventions would be most appropriate?",
    "choices": {"A": "Providing the student with attention when on-task", "B": "Allowing the student to take breaks contingent on work completion", "C": "Moving the student to a quiet area when off-task", "D": "Ignoring the off-task behavior", "E": "", "F": ""},
    "correct_answer": ["B"],
    "rationale": "Option (B) is correct. For escape-maintained behavior, providing breaks contingent on work completion is appropriate."
  },
  {
    "id": "SP5403_Q078",
    "question": "Which of the following is the most appropriate action for a school psychologist to take when a colleague discloses unethical behavior?",
    "choices": {"A": "Ignoring the information since it does not directly affect the school psychologist's work", "B": "Attempting to address the issue informally with the colleague first", "C": "Immediately reporting the colleague to the state licensing board", "D": "Documenting the disclosure but taking no further action", "E": "", "F": ""},
    "correct_answer": ["B"],
    "rationale": "Option (B) is correct. Informal resolution should be attempted first when appropriate."
  },
  {
    "id": "SP5403_Q079",
    "question": "A school psychologist is evaluating a student who may have an intellectual disability. Which of the following criteria must be met for this diagnosis?",
    "choices": {"A": "Significant limitations in intellectual functioning only", "B": "Significant limitations in adaptive behavior only", "C": "Significant limitations in both intellectual functioning and adaptive behavior with onset during the developmental period", "D": "IQ score below 70 regardless of adaptive functioning", "E": "", "F": ""},
    "correct_answer": ["C"],
    "rationale": "Option (C) is correct. Intellectual disability requires deficits in both IQ and adaptive functioning with developmental onset."
  },
  {
    "id": "SP5403_Q080",
    "question": "Which of the following is a key characteristic of criterion-referenced tests?",
    "choices": {"A": "They compare a student's performance to a normative sample.", "B": "They assess mastery of specific skills or content standards.", "C": "They are typically administered once per year.", "D": "They require standardized administration procedures.", "E": "", "F": ""},
    "correct_answer": ["B"],
    "rationale": "Option (B) is correct. Criterion-referenced tests measure mastery of specific standards."
  },
  {
    "id": "SP5403_Q081",
    "question": "A school psychologist is working with a student who has been bullied. Which of the following is the most appropriate intervention approach?",
    "choices": {"A": "Telling the student to ignore the bullying", "B": "Working with both the student who was bullied and those who engaged in bullying", "C": "Moving the student who was bullied to a different classroom", "D": "Recommending the student who was bullied receive training in self-defense", "E": "", "F": ""},
    "correct_answer": ["B"],
    "rationale": "Option (B) is correct. Effective bullying intervention addresses both targets and perpetrators."
  },
  {
    "id": "SP5403_Q082",
    "question": "Which of the following cognitive processes is most directly related to a student's ability to solve novel problems?",
    "choices": {"A": "Processing speed", "B": "Working memory", "C": "Fluid reasoning", "D": "Long-term retrieval", "E": "", "F": ""},
    "correct_answer": ["C"],
    "rationale": "Option (C) is correct. Fluid reasoning involves solving novel problems."
  },
  {
    "id": "SP5403_Q083",
    "question": "A school psychologist is presenting at a staff meeting on the topic of trauma-informed practices. Which of the following is a key principle of trauma-informed care?",
    "choices": {"A": "All students who have experienced trauma need individual therapy", "B": "Creating safe, predictable environments that support emotional regulation", "C": "Requiring students to discuss their traumatic experiences in group settings", "D": "Using punishment-based approaches to address trauma-related behaviors", "E": "", "F": ""},
    "correct_answer": ["B"],
    "rationale": "Option (B) is correct. Trauma-informed care emphasizes safety and predictability."
  },
  {
    "id": "SP5403_Q084",
    "question": "Which of the following best describes a Type I error in research?",
    "choices": {"A": "Concluding there is no effect when there actually is one", "B": "Concluding there is an effect when there actually is not one", "C": "Using an inappropriate statistical test", "D": "Having too small a sample size", "E": "", "F": ""},
    "correct_answer": ["B"],
    "rationale": "Option (B) is correct. A Type I error is a false positive - concluding an effect exists when it does not."
  },
  {
    "id": "SP5403_Q085",
    "question": "A school psychologist is working with a student who has autism spectrum disorder. The student becomes very upset when routines are changed. Which of the following strategies would be most helpful?",
    "choices": {"A": "Eliminating all changes to the student's routine", "B": "Providing advance notice and visual supports before changes occur", "C": "Ignoring the student's distress until it passes", "D": "Requiring the student to adapt to changes without support", "E": "", "F": ""},
    "correct_answer": ["B"],
    "rationale": "Option (B) is correct. Advance notice and visual supports help students with ASD manage transitions."
  },
  {
    "id": "SP5403_Q086",
    "question": "Which of the following is the primary purpose of an IEP progress report?",
    "choices": {"A": "To determine whether the student still qualifies for special education", "B": "To document the student's progress toward annual IEP goals", "C": "To compare the student's performance to that of peers", "D": "To identify new goals for the upcoming year", "E": "", "F": ""},
    "correct_answer": ["B"],
    "rationale": "Option (B) is correct. Progress reports document advancement toward IEP goals."
  },
  {
    "id": "SP5403_Q087",
    "question": "A school psychologist is working with a student who has selective mutism. Which of the following interventions would be most appropriate?",
    "choices": {"A": "Requiring the student to speak in all situations", "B": "Using a graduated exposure approach to increase verbal communication", "C": "Allowing the student to communicate only in writing", "D": "Removing the student from social situations", "E": "", "F": ""},
    "correct_answer": ["B"],
    "rationale": "Option (B) is correct. Graduated exposure is the evidence-based treatment for selective mutism."
  },
  {
    "id": "SP5403_Q088",
    "question": "Which of the following is the most important factor in determining whether an intervention should be continued?",
    "choices": {"A": "Whether the teacher likes implementing the intervention", "B": "Whether the student's progress monitoring data show improvement", "C": "Whether the intervention is research-based", "D": "Whether the intervention was recommended by an outside expert", "E": "", "F": ""},
    "correct_answer": ["B"],
    "rationale": "Option (B) is correct. Progress monitoring data should guide intervention decisions."
  },
  {
    "id": "SP5403_Q089",
    "question": "A school psychologist is facilitating a problem-solving meeting. The team has identified that a student is struggling with reading fluency. Which of the following should the team do next?",
    "choices": {"A": "Select an intervention from a list of evidence-based programs", "B": "Analyze the student's specific reading error patterns", "C": "Refer the student for special education evaluation", "D": "Recommend the student for retention", "E": "", "F": ""},
    "correct_answer": ["B"],
    "rationale": "Option (B) is correct. Analyzing error patterns helps identify the specific skill deficit."
  },
  {
    "id": "SP5403_Q090",
    "question": "Which of the following best describes the principle of least restrictive environment (LRE)?",
    "choices": {"A": "Students with disabilities should receive all services in the general education classroom.", "B": "Students with disabilities should be educated with nondisabled peers to the maximum extent appropriate.", "C": "Students with disabilities should receive services in specialized settings.", "D": "Students with disabilities should be grouped together for instruction.", "E": "", "F": ""},
    "correct_answer": ["B"],
    "rationale": "Option (B) is correct. LRE requires education with nondisabled peers to the maximum extent appropriate."
  },
  {
    "id": "SP5403_Q091",
    "question": "A school psychologist administers an achievement test to a student. The student earns a standard score of 85 in reading comprehension. This score falls in which range?",
    "choices": {"A": "Below average", "B": "Average", "C": "Above average", "D": "Significantly below average", "E": "", "F": ""},
    "correct_answer": ["B"],
    "rationale": "Option (B) is correct. A standard score of 85 falls within the average range (typically 85-115)."
  },
  {
    "id": "SP5403_Q092",
    "question": "Which of the following is the best example of a social validity measure?",
    "choices": {"A": "Measuring how many times a behavior occurs", "B": "Surveying teachers about whether they find an intervention acceptable and useful", "C": "Calculating effect sizes from research studies", "D": "Administering a standardized behavior rating scale", "E": "", "F": ""},
    "correct_answer": ["B"],
    "rationale": "Option (B) is correct. Social validity assesses acceptability and usefulness of interventions."
  },
  {
    "id": "SP5403_Q093",
    "question": "A school psychologist is working with a student who has a specific learning disability in math. The student struggles with math fact fluency but understands mathematical concepts. Which of the following accommodations would be most appropriate?",
    "choices": {"A": "Reducing the number of math problems assigned", "B": "Allowing the student to use a calculator for computation", "C": "Providing the student with a modified math curriculum", "D": "Excusing the student from math class", "E": "", "F": ""},
    "correct_answer": ["B"],
    "rationale": "Option (B) is correct. A calculator accommodates computation difficulties while allowing demonstration of conceptual understanding."
  },
  {
    "id": "SP5403_Q094",
    "question": "Which of the following is a primary characteristic of effective progress monitoring?",
    "choices": {"A": "It is administered at the beginning and end of the school year.", "B": "It is administered frequently using standardized procedures.", "C": "It compares student performance to grade-level expectations.", "D": "It provides detailed diagnostic information about specific skills.", "E": "", "F": ""},
    "correct_answer": ["B"],
    "rationale": "Option (B) is correct. Effective progress monitoring is frequent and standardized."
  },
  {
    "id": "SP5403_Q095",
    "question": "A school psychologist is reviewing data from a schoolwide positive behavior intervention and support (PBIS) program. Which of the following metrics would be most useful for evaluating program effectiveness?",
    "choices": {"A": "Number of students referred for special education", "B": "Office discipline referrals and suspensions", "C": "Scores on standardized achievement tests", "D": "Teacher satisfaction surveys", "E": "", "F": ""},
    "correct_answer": ["B"],
    "rationale": "Option (B) is correct. ODRs and suspensions are primary outcome measures for PBIS."
  },
  {
    "id": "SP5403_Q096",
    "question": "Which of the following is the most appropriate response when a student discloses abuse to a school psychologist?",
    "choices": {"A": "Promising the student that the information will be kept confidential", "B": "Reporting the disclosure to child protective services as mandated by law", "C": "Investigating the allegation before making any report", "D": "Asking the student to write a detailed account of what happened", "E": "", "F": ""},
    "correct_answer": ["B"],
    "rationale": "Option (B) is correct. Mandated reporters must report suspected abuse to protective services."
  },
  {
    "id": "SP5403_Q097",
    "question": "A school psychologist is consulting with a teacher who reports that a student frequently engages in attention-seeking behavior. Which of the following interventions would be most appropriate?",
    "choices": {"A": "Ignoring all of the student's behavior", "B": "Providing attention for appropriate behavior and minimizing attention for inappropriate behavior", "C": "Sending the student to the office when attention-seeking behavior occurs", "D": "Providing more individual attention to prevent the behavior", "E": "", "F": ""},
    "correct_answer": ["B"],
    "rationale": "Option (B) is correct. Differential attention reinforces appropriate behavior while reducing reinforcement for problem behavior."
  },
  {
    "id": "SP5403_Q098",
    "question": "Which of the following assessment approaches would be most appropriate for evaluating a preschool child's development?",
    "choices": {"A": "Standardized intelligence testing with verbal and nonverbal subtests", "B": "Developmental screening followed by comprehensive evaluation if concerns are identified", "C": "Academic achievement testing", "D": "Self-report questionnaires about social-emotional functioning", "E": "", "F": ""},
    "correct_answer": ["B"],
    "rationale": "Option (B) is correct. Developmental screening with follow-up evaluation is appropriate for preschoolers."
  },
  {
    "id": "SP5403_Q099",
    "question": "A school psychologist is working with a student who has experienced a traumatic event. The student has been having nightmares and flashbacks. Which of the following interventions would be most appropriate?",
    "choices": {"A": "Requiring the student to describe the traumatic event in detail", "B": "Referring the student to a trauma-focused mental health specialist", "C": "Telling the student to try not to think about what happened", "D": "Focusing only on academic performance", "E": "", "F": ""},
    "correct_answer": ["B"],
    "rationale": "Option (B) is correct. Students with significant trauma symptoms should be referred to specialists."
  },
  {
    "id": "SP5403_Q100",
    "question": "Which of the following is a key ethical principle that guides school psychologists' practice?",
    "choices": {"A": "Maximizing assessment revenue for the school district", "B": "Acting in the best interests of children", "C": "Prioritizing the preferences of teachers over parents", "D": "Maintaining strict confidentiality in all circumstances", "E": "", "F": ""},
    "correct_answer": ["B"],
    "rationale": "Option (B) is correct. Acting in children's best interests is a fundamental ethical principle."
  },
  {
    "id": "SP5403_Q101",
    "question": "A school psychologist is developing an intervention for a student who has difficulty organizing homework assignments. Which of the following would be the most effective strategy?",
    "choices": {"A": "Having the teacher reduce the amount of homework assigned", "B": "Teaching the student to use a planner and organizational system", "C": "Requiring the student's parents to check homework each night", "D": "Having the student complete all homework at school", "E": "", "F": ""},
    "correct_answer": ["B"],
    "rationale": "Option (B) is correct. Teaching organizational skills addresses the underlying skill deficit."
  },
  {
    "id": "SP5403_Q102",
    "question": "Which of the following best describes the purpose of a systematic review?",
    "choices": {"A": "To provide an expert opinion on a topic", "B": "To synthesize research evidence using explicit and reproducible methods", "C": "To describe findings from a single research study", "D": "To generate new research hypotheses", "E": "", "F": ""},
    "correct_answer": ["B"],
    "rationale": "Option (B) is correct. Systematic reviews synthesize evidence using explicit, reproducible methods."
  },
  {
    "id": "SP5403_Q103",
    "question": "A school psychologist is working with a family from a collectivist culture. Which of the following would be most important to consider?",
    "choices": {"A": "Communicating directly with the student without involving the family", "B": "Including extended family members in discussions about the student's education", "C": "Expecting the student to advocate independently for their needs", "D": "Focusing exclusively on individual student outcomes", "E": "", "F": ""},
    "correct_answer": ["B"],
    "rationale": "Option (B) is correct. Collectivist cultures often involve extended family in educational decisions."
  },
  {
    "id": "SP5403_Q104",
    "question": "Which of the following is the best way to establish a positive working relationship with a resistant teacher during consultation?",
    "choices": {"A": "Emphasizing the school psychologist's expertise", "B": "Listening to the teacher's concerns and acknowledging their perspective", "C": "Telling the teacher what strategies must be implemented", "D": "Suggesting that the principal mandate the teacher's participation", "E": "", "F": ""},
    "correct_answer": ["B"],
    "rationale": "Option (B) is correct. Active listening and acknowledging concerns builds rapport."
  },
  {
    "id": "SP5403_Q105",
    "question": "A school psychologist is interpreting the results of a behavior rating scale. Two teachers rated the same student, and their ratings were significantly different. Which of the following is the most appropriate interpretation?",
    "choices": {"A": "One of the teachers is incorrect.", "B": "The behavior may vary across settings or contexts.", "C": "The rating scale is not reliable.", "D": "The student has multiple behavior disorders.", "E": "", "F": ""},
    "correct_answer": ["B"],
    "rationale": "Option (B) is correct. Different ratings often reflect contextual differences in behavior."
  },
  {
    "id": "SP5403_Q106",
    "question": "Which of the following is a primary advantage of using multiple regression in research?",
    "choices": {"A": "It determines causation between variables.", "B": "It allows examination of the relationship between one outcome and multiple predictors.", "C": "It eliminates the need for control groups.", "D": "It is easier to compute than correlation.", "E": "", "F": ""},
    "correct_answer": ["B"],
    "rationale": "Option (B) is correct. Multiple regression examines relationships between multiple predictors and an outcome."
  },
  {
    "id": "SP5403_Q107",
    "question": "A school psychologist is asked to help develop a school crisis response plan. Which of the following should be included?",
    "choices": {"A": "A plan that addresses only natural disasters", "B": "Comprehensive procedures for various types of crises including communication and recovery", "C": "A plan developed solely by the school psychologist", "D": "A plan that focuses only on immediate response, not prevention or recovery", "E": "", "F": ""},
    "correct_answer": ["B"],
    "rationale": "Option (B) is correct. Crisis plans should be comprehensive and address multiple scenarios."
  },
  {
    "id": "SP5403_Q108",
    "question": "Which of the following is the most important consideration when selecting an academic intervention for a student?",
    "choices": {"A": "Whether the intervention is new and innovative", "B": "Whether research evidence supports the intervention's effectiveness for the student's identified needs", "C": "Whether the intervention is recommended by other school psychologists", "D": "Whether the intervention requires minimal teacher training", "E": "", "F": ""},
    "correct_answer": ["B"],
    "rationale": "Option (B) is correct. Evidence-based interventions matched to student needs are most important."
  },
  {
    "id": "SP5403_Q109",
    "question": "A school psychologist notices that their own cultural background differs significantly from that of a student they are evaluating. Which of the following is the most appropriate action?",
    "choices": {"A": "Asking another psychologist with a similar background to the student to conduct the evaluation", "B": "Proceeding with the evaluation while being mindful of potential cultural influences on assessment", "C": "Using only tests developed in the student's culture of origin", "D": "Ignoring cultural differences to maintain objectivity", "E": "", "F": ""},
    "correct_answer": ["B"],
    "rationale": "Option (B) is correct. Cultural awareness during evaluation is essential."
  },
  {
    "id": "SP5403_Q110",
    "question": "Which of the following is the best example of interrater reliability?",
    "choices": {"A": "A student receives similar scores when tested on two different days.", "B": "Two observers recording the same behavior at the same time obtain similar data.", "C": "A test measures what it is supposed to measure.", "D": "Different items on a test measure the same construct.", "E": "", "F": ""},
    "correct_answer": ["B"],
    "rationale": "Option (B) is correct. Interrater reliability is agreement between different raters or observers."
  },
  {
    "id": "SP5403_Q111",
    "question": "A school psychologist is working with a student who has test anxiety. Which of the following techniques would be most appropriate to teach the student?",
    "choices": {"A": "Avoiding tests whenever possible", "B": "Relaxation and positive self-talk strategies", "C": "Requesting that tests be given orally instead", "D": "Having a parent present during testing", "E": "", "F": ""},
    "correct_answer": ["B"],
    "rationale": "Option (B) is correct. Relaxation and cognitive strategies are effective for test anxiety."
  },
  {
    "id": "SP5403_Q112",
    "question": "Which of the following is a key component of effective parent-school communication?",
    "choices": {"A": "Limiting contact to formal meetings only", "B": "Using jargon to demonstrate professional expertise", "C": "Establishing regular, two-way communication channels", "D": "Communicating primarily through written reports", "E": "", "F": ""},
    "correct_answer": ["C"],
    "rationale": "Option (C) is correct. Regular two-way communication supports effective partnerships."
  },
  {
    "id": "SP5403_Q113",
    "question": "A school psychologist is reviewing research on an intervention program. The study reports a statistically significant effect with p < .05. Which of the following is the most appropriate interpretation?",
    "choices": {"A": "The intervention will work for 95% of students.", "B": "There is less than a 5% probability that the observed effect occurred by chance.", "C": "The intervention has a large practical effect.", "D": "The results are clinically meaningful.", "E": "", "F": ""},
    "correct_answer": ["B"],
    "rationale": "Option (B) is correct. Statistical significance indicates low probability the result is due to chance."
  },
  {
    "id": "SP5403_Q114",
    "question": "Which of the following is the most appropriate way for a school psychologist to address a situation where they realize they may have made an error during an evaluation?",
    "choices": {"A": "Ignoring the error if it seems minor", "B": "Acknowledging the error and taking steps to correct it", "C": "Completing the evaluation without mentioning the error", "D": "Waiting to see if anyone notices the error", "E": "", "F": ""},
    "correct_answer": ["B"],
    "rationale": "Option (B) is correct. Ethical practice requires acknowledging and correcting errors."
  },
  {
    "id": "SP5403_Q115",
    "question": "A school psychologist is working with a student diagnosed with depression. Which of the following school-based interventions would be most appropriate?",
    "choices": {"A": "Prescribing antidepressant medication", "B": "Implementing cognitive-behavioral strategies and monitoring mood", "C": "Reducing academic expectations", "D": "Isolating the student from peers", "E": "", "F": ""},
    "correct_answer": ["B"],
    "rationale": "Option (B) is correct. CBT strategies and mood monitoring are appropriate school-based interventions."
  },
  {
    "id": "SP5403_Q116",
    "question": "Which of the following is the best way for a school psychologist to stay current with evidence-based practices?",
    "choices": {"A": "Relying solely on information from colleagues", "B": "Engaging in ongoing professional development and reading peer-reviewed research", "C": "Using the same assessment and intervention approaches learned in graduate school", "D": "Attending only state-mandated training sessions", "E": "", "F": ""},
    "correct_answer": ["B"],
    "rationale": "Option (B) is correct. Ongoing PD and reading research keeps practice current."
  },
  {
    "id": "SP5403_Q117",
    "question": "A school psychologist is evaluating a student for possible emotional disturbance. Which of the following characteristics must be present for this classification under IDEA?",
    "choices": {"A": "An inability to learn that cannot be explained by intellectual, sensory, or health factors", "B": "A medical diagnosis of a mental health disorder", "C": "Aggressive behavior toward peers and adults", "D": "Failure to respond to behavioral interventions", "E": "", "F": ""},
    "correct_answer": ["A"],
    "rationale": "Option (A) is correct. Unexplained inability to learn is a defining characteristic of emotional disturbance under IDEA."
  },
  {
    "id": "SP5403_Q118",
    "question": "Which of the following best describes the purpose of a manifestation determination review?",
    "choices": {"A": "To determine whether a student qualifies for special education", "B": "To determine whether a student's behavior was caused by or related to their disability", "C": "To develop a behavior intervention plan", "D": "To decide whether a student should be suspended", "E": "", "F": ""},
    "correct_answer": ["B"],
    "rationale": "Option (B) is correct. Manifestation determination assesses whether behavior is related to disability."
  },
  {
    "id": "SP5403_Q119",
    "question": "A school psychologist is working with a teacher who wants to implement a token economy in the classroom. Which of the following is the most important consideration?",
    "choices": {"A": "Ensuring all students receive the same number of tokens", "B": "Defining target behaviors clearly and delivering tokens consistently", "C": "Using tokens that have monetary value", "D": "Implementing the system for at least one full school year", "E": "", "F": ""},
    "correct_answer": ["B"],
    "rationale": "Option (B) is correct. Clear behavior definitions and consistent delivery are essential for token economies."
  },
  {
    "id": "SP5403_Q120",
    "question": "Which of the following is the most appropriate response when a school psychologist identifies a potential conflict of interest in providing services to a student?",
    "choices": {"A": "Proceeding with services but documenting the conflict", "B": "Disclosing the conflict and, if necessary, referring to another professional", "C": "Ignoring the conflict if it does not seem serious", "D": "Letting the parents decide how to handle the conflict", "E": "", "F": ""},
    "correct_answer": ["B"],
    "rationale": "Option (B) is correct. Conflicts of interest require disclosure and possible referral."
  },
  {
    "id": "SP5403_Q121",
    "question": "A school psychologist is analyzing universal screening data for a school. Which of the following would be most useful for identifying students who may need Tier 2 support?",
    "choices": {"A": "Comparing students' scores to grade-level benchmarks", "B": "Calculating the overall school average", "C": "Reviewing only the scores of students already receiving special education", "D": "Looking at last year's data only", "E": "", "F": ""},
    "correct_answer": ["A"],
    "rationale": "Option (A) is correct. Comparing to benchmarks identifies students needing additional support."
  },
  {
    "id": "SP5403_Q122",
    "question": "Which of the following is a key principle of family-centered practice?",
    "choices": {"A": "Professionals make decisions about services without family input", "B": "Families are viewed as partners in planning and decision-making", "C": "Services focus exclusively on the child", "D": "Communication with families is limited to formal meetings", "E": "", "F": ""},
    "correct_answer": ["B"],
    "rationale": "Option (B) is correct. Family-centered practice involves families as partners in decision-making."
  },
  {
    "id": "SP5403_Q123",
    "question": "A school psychologist is interpreting data from a progress monitoring graph. The data show a flat trend line after four weeks of intervention. Which of the following is the most appropriate interpretation?",
    "choices": {"A": "The intervention is working well", "B": "The student is making adequate progress", "C": "The intervention may need to be modified or intensified", "D": "The student should be referred for special education", "E": "", "F": ""},
    "correct_answer": ["C"],
    "rationale": "Option (C) is correct. A flat trend suggests the intervention needs modification."
  },
  {
    "id": "SP5403_Q124",
    "question": "Which of the following is most likely to be considered the best sign of successful implementation of a district-wide Tier 1 system of Positive Behavior Interventions and Supports (PBIS) that will lead to long-term benefits?",
    "choices": {"A": "The district recreation department posts signs indicating behavior expectations on each sports field.", "B": "All schools use the same metrics for success and have consistent teaching strategies.", "C": "Local businesses partner with the district to provide incentives for students.", "D": "Students can recite the expectations of the program when asked.", "E": "", "F": ""},
    "correct_answer": ["B"],
    "rationale": "Option (B) is correct. Consistent teaching strategies and metrics are necessary for long-term success. This ensures that practices can be implemented with fidelity over time compared to one-time trainings."
  },
  {
    "id": "SP5403_Q125",
    "question": "Dr. Shor receives paperwork for a new referral for Matthew, a tenth-grade student. Wanting to schedule a meeting to plan evaluations, Dr. Shor asks Matthew if it would be better to call his mother or his father. When Matthew responds that he has two fathers and that it would be fine to call either, Dr. Shor realizes he has made a mistake by assuming Matthew had two opposite-sex parents. Which of the following best describes Dr. Shor's assumption?",
    "choices": {"A": "An unbiased assumption", "B": "An explicitly biased assumption", "C": "An implicitly biased assumption", "D": "Both an implicitly and explicitly biased assumption", "E": "", "F": ""},
    "correct_answer": ["C"],
    "rationale": "Option (C) is correct. Implicit bias stems from one's preexisting beliefs and experiences and often leads to harmful actions made toward another individual but with no intent to harm."
  }
];