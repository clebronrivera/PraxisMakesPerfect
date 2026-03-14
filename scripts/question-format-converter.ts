/**
 * Question Format Converter
 * Converts between the project's question format and the format expected by quality scripts
 */

// Project format (current)
export interface ProjectQuestion {
  id: string;
  question: string;
  choices: { [key: string]: string }; // e.g., { A: "text", B: "text", ... }
  correct_answer: string[]; // Array of letter strings
  rationale: string;
  skillId: string;
  skillName?: string;
  domain?: number;
}

// Script format (expected by quality tools)
export interface ScriptQuestion {
  id: string;
  skillId: string;
  skillName?: string;
  question: string;
  choices: Choice[];
  correctAnswer: string; // Single letter string
  rationale: string;
  domain?: number;
}

export interface Choice {
  letter: string;
  text: string;
  isCorrect?: boolean;
}

/**
 * Convert project format to script format
 */
export function convertToScriptFormat(projectQuestion: ProjectQuestion): ScriptQuestion {
  // Convert choices object to array
  const choices: Choice[] = [];
  const correctAnswers = projectQuestion.correct_answer || [];
  
  // Process choices in order (A, B, C, D, E, F)
  const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
  for (const letter of letters) {
    const text = projectQuestion.choices[letter];
    if (text && text.trim() !== '') {
      const isCorrect = correctAnswers.includes(letter);
      choices.push({
        letter,
        text: text.trim(),
        isCorrect
      });
    }
  }
  
  // Determine correctAnswer (use first correct answer, or empty string if none)
  const correctAnswer = correctAnswers.length > 0 ? correctAnswers[0] : '';
  
  return {
    id: projectQuestion.id,
    skillId: projectQuestion.skillId,
    skillName: projectQuestion.skillName,
    question: projectQuestion.question,
    choices,
    correctAnswer,
    rationale: projectQuestion.rationale,
    domain: projectQuestion.domain
  };
}

/**
 * Convert script format back to project format
 */
export function convertToProjectFormat(scriptQuestion: ScriptQuestion): ProjectQuestion {
  // Convert choices array back to object
  const choices: { [key: string]: string } = {};
  const correctAnswer: string[] = [];
  
  for (const choice of scriptQuestion.choices) {
    choices[choice.letter] = choice.text;
    if (choice.isCorrect || choice.letter === scriptQuestion.correctAnswer) {
      if (!correctAnswer.includes(choice.letter)) {
        correctAnswer.push(choice.letter);
      }
    }
  }
  
  // Ensure we have at least one correct answer
  if (correctAnswer.length === 0 && scriptQuestion.correctAnswer) {
    correctAnswer.push(scriptQuestion.correctAnswer);
  }
  
  return {
    id: scriptQuestion.id,
    question: scriptQuestion.question,
    choices,
    correct_answer: correctAnswer,
    rationale: scriptQuestion.rationale,
    skillId: scriptQuestion.skillId,
    skillName: scriptQuestion.skillName,
    domain: scriptQuestion.domain
  };
}

/**
 * Convert an array of questions from project format to script format
 */
export function convertArrayToScriptFormat(projectQuestions: ProjectQuestion[]): ScriptQuestion[] {
  return projectQuestions.map(convertToScriptFormat);
}

/**
 * Convert an array of questions from script format to project format
 */
export function convertArrayToProjectFormat(scriptQuestions: ScriptQuestion[]): ProjectQuestion[] {
  return scriptQuestions.map(convertToProjectFormat);
}
