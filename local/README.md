# Local Workspace

Use this folder for materials that should stay on your machine and out of the public repository.

Keep here:
- private or reference source material such as PDFs, DOCX files, and exported reports
- scratch mapping notes and one-off scripts that are not part of the runtime app
- generated artifacts you want to keep locally without treating them as source of truth

Rules:
- Do not wire app or build imports to `local/`.
- If something becomes a maintained runtime asset or shared tool, move it into a tracked repo location and document the change.
- `output/AUDIT_SUMMARY.md` is the current tracked handoff exception; most other exports should remain local-only.
