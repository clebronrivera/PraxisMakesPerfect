// Distractor Matcher - Matches selected wrong answers to distractor patterns
// Uses heuristic analysis to identify which error pattern likely generated the distractor
// Part of Phase D Step 5: Track Distractor Selection


/**
 * Matches a selected wrong answer to a distractor pattern
 * Uses heuristic analysis based on distractor pattern characteristics
 * 
 * @param selectedText - The text of the selected wrong answer
 * @param correctAnswer - The correct answer text (for context)
 * @returns PatternId if match found, null otherwise
 */
export function matchDistractorPattern(
  selectedText: string,
  correctAnswer?: string,
  _distractorPatterns?: Record<string, unknown> // kept for API compatibility, but pattern matching rules are heuristic
): string | null {
  const text = selectedText.toLowerCase().trim();
  
  // Pattern matching rules based on distractor pattern characteristics
  
  // Premature Action - action verbs without assessment/data collection
  if (
    /\b(implement|contact|refer|begin|start|immediately|right away|right now)\b/.test(text) &&
    !/\b(assess|review|collect|gather|analyze|evaluate|examine|observe|data|baseline)\b/.test(text)
  ) {
    return 'premature-action';
  }
  
  // Role Confusion - actions outside school psychologist scope
  if (
    /\b(take over|prescribe|discipline|teach|instruct|direct instruction|medical diagnosis|make disciplinary)\b/.test(text) ||
    /\b(teacher|doctor|administrator|parent).*role\b/.test(text)
  ) {
    return 'role-confusion';
  }
  
  // Sequence Error - correct elements but wrong order indicators
  if (
    /\b(before|after|first|then|next|followed by)\b/.test(text) &&
    (/\b(intervention|action|implement)\b.*\b(before|prior to)\b.*\b(assessment|data|analysis)\b/.test(text) ||
     /\b(analysis|assessment)\b.*\b(before|prior to)\b.*\b(data|collection)\b/.test(text))
  ) {
    return 'sequence-error';
  }
  
  // Context Mismatch - valid approach but wrong context indicators
  if (
    (/\b(cbm|curriculum-based measurement)\b.*\b(evaluation|eligibility|comprehensive)\b/.test(text) ||
     /\b(screening|screen)\b.*\b(eligibility|determine|evaluate)\b/.test(text) ||
     /\b(individual|one-on-one)\b.*\b(screening|screen)\b/.test(text) ||
     /\b(group|universal)\b.*\b(evaluation|eligibility)\b/.test(text)) &&
    !/\b(progress monitoring|monitor progress)\b/.test(text)
  ) {
    return 'context-mismatch';
  }
  
  // Similar Concept - related but incorrect terms
  // This is harder to detect heuristically, but we can look for common confusions
  const similarConceptPatterns = [
    /\b(test-retest|test retest)\b.*\b(single-subject|single subject)\b/,
    /\b(content validity)\b.*\b(construct|predictive)\b/,
    /\b(tier 2|tier two)\b.*\b(tier 3|tier three)\b/,
    /\b(reliability)\b.*\b(validity)\b/,
    /\b(sensitivity)\b.*\b(specificity)\b/
  ];
  
  if (similarConceptPatterns.some(pattern => pattern.test(text))) {
    return 'similar-concept';
  }
  
  // Definition Error - misunderstanding of key terms
  // Look for misuse of technical terms
  if (
    /\b(optimal|best possible|maximum)\b.*\b(education|fape)\b/.test(text) ||
    /\b(always|never|only|must|all|none)\b.*\b(appropriate|required|necessary)\b/.test(text) ||
    /\b(appropriate)\b.*\b(optimal|best)\b/.test(text)
  ) {
    return 'definition-error';
  }
  
  // Data Ignorance - decisions without data review
  if (
    /\b(decide|determine|recommend|conclude|judge)\b/.test(text) &&
    !/\b(review|analyze|examine|assess|evaluate|data|results|findings)\b/.test(text) &&
    !/\b(based on|using|with|from)\b.*\b(data|results|findings|assessment|evaluation)\b/.test(text)
  ) {
    return 'data-ignorance';
  }
  
  // Extreme Language - absolute statements
  if (
    /\b(always|never|only|must|all|none|every|any)\b/.test(text) &&
    !/\b(usually|often|typically|generally|may|can|sometimes)\b/.test(text)
  ) {
    return 'extreme-language';
  }
  
  // Incomplete Response - partial answers
  // Hard to detect without knowing the full answer, but we can look for single actions
  // when multiple are typically required
  if (
    /\b(and|also|additionally|furthermore)\b/.test(correctAnswer || '') &&
    !/\b(and|also|additionally|furthermore)\b/.test(text)
  ) {
    return 'incomplete-response';
  }
  
  // If no pattern matches, return null
  return null;
}
