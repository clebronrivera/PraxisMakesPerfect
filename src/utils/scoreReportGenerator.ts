import { UserResponse } from '../brain/weakness-detector';

/**
 * Generate and download the Word (.docx) score report.
 *
 * Kept deliberately thin. The document builder and the `docx` library it needs
 * (~400 kB) are pulled in only when this runs, so they ship as a lazy chunk
 * rather than riding along on the post-diagnostic screen where ScoreReport
 * renders. Keep both imports below dynamic — making either static puts the whole
 * library back on that critical path, which is exactly what this file exists to
 * prevent.
 */
export async function downloadScoreReport(
  responses: UserResponse[],
  profile: { displayName?: string; preferredDisplayName?: string; fullName?: string } | null | undefined,
  scoreData: Record<string, { correct: number; total: number }>
) {
  const [{ buildDocument }, { Packer }, { saveAs }] = await Promise.all([
    import('./scoreReportDocument'),
    import('docx'),
    import('file-saver'),
  ]);

  const doc = buildDocument(responses, scoreData);
  const buffer = await Packer.toBuffer(doc);
  const blob = new Blob([buffer as BlobPart], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  });
  const name = profile?.displayName || 'User';
  saveAs(blob, `Praxis_5403_Score_Report_${name}.docx`);
}
