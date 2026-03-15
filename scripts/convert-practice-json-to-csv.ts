import fs from 'fs';
import path from 'path';

const inputFile = path.join(process.cwd(), 'praxis_5403_practice_questions_900q.json');
const outputDir = path.join(process.cwd(), 'output');
const outputFile = path.join(outputDir, 'praxis_5403_practice_questions_900q.csv');

interface PracticeQuestion {
    question_id: string;
    skill_id: string;
    question_stem: string;
    options: {
        A?: string;
        B?: string;
        C?: string;
        D?: string;
    };
    correct_answer: string;
    explanation: string;
}

const data = JSON.parse(fs.readFileSync(inputFile, 'utf-8'));

const headers = [
    'UNIQUEID', 'item_format', 'is_multi_select', 'correct_answer_count', 'option_count_expected',
    'has_case_vignette', 'case_text', 'question_stem', 'A', 'B', 'C', 'D', 'E', 'F',
    'correct_answers', 'CORRECT_Explanation', 'core_concept', 'content_limit', 'DOMAIN', 'domain_name',
    'domain_weight', 'nasp_domain_primary', 'original_skill_id', 'current_skill_id', 'skill_name',
    'skill_domain_code', 'skill_nasp_domain', 'was_remapped', 'cognitive_complexity', 'complexity_rationale',
    'outcome', 'construct_actually_tested', 'rationale', 'distractor_tier_A', 'distractor_error_type_A',
    'distractor_misconception_A', 'distractor_skill_deficit_A', 'distractor_tier_B', 'distractor_error_type_B',
    'distractor_misconception_B', 'distractor_skill_deficit_B', 'distractor_tier_C', 'distractor_error_type_C',
    'distractor_misconception_C', 'distractor_skill_deficit_C', 'distractor_tier_D', 'distractor_error_type_D',
    'distractor_misconception_D', 'distractor_skill_deficit_D', 'distractor_tier_E', 'distractor_error_type_E',
    'distractor_misconception_E', 'distractor_skill_deficit_E', 'distractor_tier_F', 'distractor_error_type_F',
    'distractor_misconception_F', 'distractor_skill_deficit_F', 'is_foundational', 'prereq_chain_narrative',
    'dominant_error_pattern', 'error_cluster_tag', 'audit_status', 'dominant_failure_mode_tier',
    'top_misconception_themes', 'instructional_red_flags', 'skill_prerequisites', 'is_human_verified',
    'domain_rationale', 'skill_rationale'
];

function escapeCSV(val: string): string {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}

const lines = [];
lines.push(headers.map(escapeCSV).join(','));

for (const q of data.questions) {
    const row = new Array(headers.length).fill('');
    row[headers.indexOf('UNIQUEID')] = q.question_id;
    row[headers.indexOf('item_format')] = 'Single-Select';
    row[headers.indexOf('is_multi_select')] = 'False';
    row[headers.indexOf('correct_answer_count')] = '1';
    row[headers.indexOf('option_count_expected')] = '4';
    row[headers.indexOf('has_case_vignette')] = 'False';
    row[headers.indexOf('question_stem')] = q.question_stem;
    row[headers.indexOf('A')] = q.options.A || '';
    row[headers.indexOf('B')] = q.options.B || '';
    row[headers.indexOf('C')] = q.options.C || '';
    row[headers.indexOf('D')] = q.options.D || '';
    row[headers.indexOf('correct_answers')] = q.correct_answer;
    row[headers.indexOf('CORRECT_Explanation')] = q.explanation;
    row[headers.indexOf('current_skill_id')] = q.skill_id;
    row[headers.indexOf('original_skill_id')] = q.skill_id;
    
    const domainCode = q.skill_id.split('-')[0] || '';
    row[headers.indexOf('skill_domain_code')] = domainCode;
    
    lines.push(row.map(escapeCSV).join(','));
}

fs.writeFileSync(outputFile, lines.join('\n'));
console.log(`Successfully generated ${outputFile} with ${data.questions.length} questions.`);
