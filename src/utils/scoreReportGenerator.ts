import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, ShadingType, WidthType, BorderStyle, AlignmentType, HeadingLevel, VerticalAlign } from 'docx';
import { saveAs } from 'file-saver';
import { UserResponse } from '../brain/weakness-detector';

import { skillStudyGuide, SkillStudyGuide } from '../data/skill-study-guide';

const C = {
  NAVY: "1A3A5C",
  WHITE: "FFFFFF",
  GRAY_BG: "F5F7FA",
  GRAY_BAR: "E2E8F0",
  TEXT_DARK: "2D3748",
  TEXT_LIGHT: "718096",
  RED: "E53E3E",     // < 60% Emerging
  YELLOW: "D69E2E",  // 60-79% Approaching
  GREEN: "38A169"    // 80%+ Demonstrating
};

function getStatusColor(pct: number) {
  if (pct >= 80) return C.GREEN;
  if (pct >= 60) return C.YELLOW;
  return C.RED;
}

function createProgressBar(pct: number, color: string) {
  const TOTAL_WIDTH = 5000;
  const filledWidth = Math.max(100, Math.floor((pct / 100) * TOTAL_WIDTH));
  const emptyWidth = Math.max(100, TOTAL_WIDTH - filledWidth);

  return new Table({
    width: { size: TOTAL_WIDTH, type: WidthType.DXA },
    borders: {
      top: { style: BorderStyle.NONE, size: 0, color: "auto" },
      bottom: { style: BorderStyle.NONE, size: 0, color: "auto" },
      left: { style: BorderStyle.NONE, size: 0, color: "auto" },
      right: { style: BorderStyle.NONE, size: 0, color: "auto" },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: "auto" }
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: filledWidth, type: WidthType.DXA },
            shading: { fill: color, type: ShadingType.CLEAR },
            children: [new Paragraph("")]
          }),
          new TableCell({
            width: { size: emptyWidth, type: WidthType.DXA },
            shading: { fill: C.GRAY_BAR, type: ShadingType.CLEAR },
            children: [new Paragraph("")]
          })
        ]
      })
    ]
  });
}

function createSectionHeader(title: string) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: C.NAVY, type: ShadingType.CLEAR },
            margins: { top: 100, bottom: 100, left: 100, right: 100 },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: title, color: C.WHITE, bold: true, size: 28 })
                ]
              })
            ]
          })
        ]
      })
    ]
  });
}

function createScoreCard(title: string, score: number, total: number) {
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;
  const color = getStatusColor(pct);

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 70, type: WidthType.PERCENTAGE },
            margins: { top: 100, bottom: 100, left: 100, right: 100 },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: title, bold: true, size: 24 })
                ]
              }),
              createProgressBar(pct, color)
            ]
          }),
          new TableCell({
            width: { size: 30, type: WidthType.PERCENTAGE },
            margins: { top: 100, bottom: 100, left: 100, right: 100 },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({ text: `${pct}%`, size: 48, bold: true, color: color }),
                  new TextRun({ text: `\n${score}/${total} correct`, size: 20, color: C.TEXT_LIGHT })
                ]
              })
            ]
          })
        ]
      })
    ]
  });
}

function createSkillBlock(skill: SkillStudyGuide, pct: number) {
  const color = getStatusColor(pct);
  
  return [
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.NONE, size: 0, color: "auto" },
        bottom: { style: BorderStyle.NONE, size: 0, color: "auto" },
        left: { style: BorderStyle.NONE, size: 0, color: "auto" },
        right: { style: BorderStyle.NONE, size: 0, color: "auto" },
        insideVertical: { style: BorderStyle.NONE, size: 0, color: "auto" }
      },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 15, type: WidthType.PERCENTAGE },
              shading: { fill: color, type: ShadingType.CLEAR },
              margins: { top: 50, bottom: 50, left: 50, right: 50 },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({ text: skill.id, color: C.WHITE, bold: true, size: 20 })
                  ]
                })
              ]
            }),
            new TableCell({
              width: { size: 85, type: WidthType.PERCENTAGE },
              margins: { top: 50, bottom: 50, left: 100, right: 100 },
              verticalAlign: VerticalAlign.CENTER,
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: skill.name, bold: true, size: 22 })
                  ]
                })
              ]
            })
          ]
        })
      ]
    }),
    new Paragraph({
      text: "Skill Definition: " + skill.definition,
      spacing: { before: 100, after: 100 }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: "How to Answer:",
          bold: true
        })
      ]
    }),
    new Paragraph({
      text: skill.decisionRule,
      bullet: { level: 0 }
    }),
    new Paragraph({
      text: "",
      spacing: { after: 200 }
    })
  ];
}

export function buildDocument(responses: UserResponse[], scoreData: Record<string, { correct: number; total: number }>) {
  // Compute overall
  let totalCorrect = 0;
  let totalQuestions = responses.length;
  responses.forEach(r => {
    if (r.isCorrect) totalCorrect++;
  });

  const children: any[] = [
    new Paragraph({
      text: "Personalized Score & Study Report",
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 }
    }),
    createSectionHeader("OVERALL PERFORMANCE"),
    new Paragraph({ spacing: { after: 200 } }),
    createScoreCard("Total Assessment Score", totalCorrect, totalQuestions),
    new Paragraph({ spacing: { after: 400 } }),
    createSectionHeader("SKILL-LEVEL ANALYSIS"),
    new Paragraph({ spacing: { after: 200 } })
  ];

  // Group skill performances
  const emerging: { skill: SkillStudyGuide, pct: number }[] = [];
  const approaching: { skill: SkillStudyGuide, pct: number }[] = [];
  const demonstrating: { skill: SkillStudyGuide, pct: number }[] = [];

  Object.entries(scoreData).forEach(([skillId, stats]) => {
    if (stats.total > 0 && skillStudyGuide[skillId]) {
      const pct = Math.round((stats.correct / stats.total) * 100);
      const entry = { skill: skillStudyGuide[skillId], pct };
      if (pct >= 80) demonstrating.push(entry);
      else if (pct >= 60) approaching.push(entry);
      else emerging.push(entry);
    }
  });

  if (emerging.length > 0) {
    children.push(
      new Paragraph({ text: "Emerging Skills", heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 200 } })
    );
    emerging.forEach(item => {
      children.push(...createSkillBlock(item.skill, item.pct));
    });
  }

  if (approaching.length > 0) {
    children.push(
      new Paragraph({ text: "Approaching Skills", heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 200 } })
    );
    approaching.forEach(item => {
      children.push(...createSkillBlock(item.skill, item.pct));
    });
  }

  if (demonstrating.length > 0) {
    children.push(
      new Paragraph({ text: "Demonstrating Skills", heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 200 } })
    );
    demonstrating.forEach(item => {
      children.push(...createSkillBlock(item.skill, item.pct));
    });
  }

  return new Document({
    sections: [{
      properties: {},
      children
    }]
  });
}

export async function downloadScoreReport(responses: UserResponse[], profile: any, scoreData: Record<string, { correct: number; total: number }>) {
  const doc = buildDocument(responses, scoreData);
  const buffer = await Packer.toBuffer(doc);
  const blob = new Blob([buffer as any], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  const name = profile?.displayName || "User";
  saveAs(blob, `Praxis_5403_Score_Report_${name}.docx`);
}
