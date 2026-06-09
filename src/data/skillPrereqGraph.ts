// src/data/skillPrereqGraph.ts
//
// Skill prerequisite dependency graph (DAG). `prereqGraph[X]` lists the skills that should be
// at Demonstrating before X — used to (a) order the learning path (getPrereqDepth: lower = more
// foundational = earlier) and (b) drive the "Do X first" unblocker in the module catalog.
//
// Re-keyed 2026-06-09 to the canonical 45 skills (progressTaxonomy.PROGRESS_SKILLS). The prior
// version was extracted from an OLD taxonomy (skill-phase-d.json): it carried 16 phantom keys
// (CON-02/03/04/05, DBD-02/04, FAM-01, MBH-01, PRV-01/02/03, SAF-02, SLD-01/02/03, SWP-01) that
// are not real skills, and was missing 16 real skills (DBD-06/07/08/09/10, DEV-01, DIV-01/03/05,
// MBH-05, PSY-01/02/03/04, RES-02/03). Phantoms are removed; edges for the missing skills are
// hand-authored; four edges that pointed at the phantom SWP-01/DBD-02 are repaired (see FIX).
//
// Invariants enforced by tests/skillPrereqGraph.test.ts: keys === the 45 canonical skills; every
// edge target is canonical; no self-edges; the graph is acyclic. Edge content is a provisional
// first pass — SME-confirmable; it never feeds scoring/mastery, only ordering + routing.

export const prereqGraph: Record<string, string[]> = {
  // ── Domain 1 — Assessment & Data-Based Decision Making ──────────────────────
  "CON-01": [],
  "DBD-01": [],                                   // RIOT / info-gathering — assessment root
  "DBD-03": ["PSY-01"],                           // cognitive assessment needs score interpretation
  "DBD-05": ["DBD-03"],                           // FIX (was phantom DBD-02): processing measures follow cognitive
  "DBD-06": ["DBD-01"],                           // behavioral-assessment instruments build on info-gathering
  "DBD-07": ["DBD-06"],                           // FBA builds on behavioral assessment
  "DBD-08": ["PSY-03"],                           // CBM / progress monitoring sits inside MTSS/problem-solving
  "DBD-09": ["DBD-01"],                           // ecological assessment extends info-gathering
  "DBD-10": ["DBD-01"],                           // records review is part of info-gathering
  "PSY-01": [],                                   // scores/norms — measurement root
  "PSY-02": ["PSY-01"],                           // reliability/validity after scores/norms
  "PSY-03": ["DBD-01"],                           // problem-solving / MTSS in assessment after info-gathering
  "PSY-04": ["PSY-01", "DIV-03"],                 // CLD assessment needs measurement + bias awareness

  // ── Domain 2 — Student-Level Services (Academic & Mental Health) ────────────
  "ACA-02": ["ACA-04"],                           // accommodations build on instructional strategies
  "ACA-03": ["ACA-06"],                           // self-regulated learning builds on learning theory
  "ACA-04": ["ACA-06"],                           // instruction builds on learning theory
  "ACA-06": ["DEV-01"],                           // learning theory / cognitive development builds on development
  "ACA-07": ["ACA-06"],                           // language & literacy build on learning theory
  "ACA-08": ["ACA-06"],                           // cognitive processes / EF build on learning theory
  "ACA-09": ["MBH-05"],                           // health conditions & impact build on biological bases
  "DEV-01": [],                                   // child & adolescent development — root
  "MBH-02": [],
  "MBH-03": [],
  "MBH-04": ["MBH-03"],                           // psychopathology after theoretical models
  "MBH-05": [],                                   // biological bases — root

  // ── Domain 3 — Systems-Level Services ───────────────────────────────────────
  "FAM-02": [],
  "FAM-03": ["FAM-02"],                           // interagency collaboration after family involvement
  "SAF-01": [],
  "SAF-03": ["MBH-02", "SAF-01"],                 // FIX (was phantom SWP-01): crisis/threat after prevention + counseling
  "SAF-04": ["SAF-03", "MBH-02", "MBH-03"],       // full crisis response after crisis assessment
  "SWP-02": [],                                   // FIX (was phantom SWP-01): policy/practice is now a root
  "SWP-03": ["SWP-02"],                           // evidence-based practices after policy
  "SWP-04": ["SWP-02", "SWP-03"],                 // FIX (dropped phantom SWP-01): MTSS at systems level last

  // ── Domain 4 — Foundations (Diversity, Ethics, Law, Research) ───────────────
  "DIV-01": ["DIV-03"],                           // culturally-responsive design builds on bias awareness
  "DIV-03": [],                                   // implicit/explicit bias — root
  "DIV-05": ["LEG-02"],                           // special-ed services build on special-ed law
  "ETH-01": [],
  "ETH-02": ["ETH-01"],
  "ETH-03": ["ETH-01", "ETH-02"],
  "LEG-01": ["ETH-01"],
  "LEG-02": ["ETH-01", "ETH-02", "LEG-01"],
  "LEG-03": ["LEG-02"],
  "LEG-04": ["LEG-02"],
  "RES-02": ["RES-03"],                           // applying research after research design/stats
  "RES-03": [],                                   // research designs & statistics — root
};

/**
 * Returns the total number of unique prerequisite skills that `skillId` depends
 * on, counting transitively (breadth-first, cycle-safe).
 *
 * - 0 = foundational skill (no prerequisites)
 * - Higher = more advanced skill that should appear later in the learning path
 */
export function getPrereqDepth(
  skillId: string,
  graph: Record<string, string[]> = prereqGraph,
): number {
  const visited = new Set<string>();
  const queue = [...(graph[skillId] ?? [])];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);
    const next = graph[current] ?? [];
    queue.push(...next);
  }

  return visited.size;
}
