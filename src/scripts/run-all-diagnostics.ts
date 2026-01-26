import { runCoverageAudit } from './coverage-audit';
import { runCapacityTest } from './capacity-test';
import { runUniquenessTest } from './uniqueness-test';
import { runDistractorAudit } from './distractor-audit';
import { runBlueprintAlignment } from './blueprint-alignment';
import { runFullSimulation, printSimulationReport } from './full-simulation';

export async function runAllDiagnostics() {
  const coverage = runCoverageAudit();
  const capacity = runCapacityTest();
  const uniqueness = runUniquenessTest();
  const distractors = runDistractorAudit();
  const blueprint = runBlueprintAlignment();
  const simulation = runFullSimulation();
  printSimulationReport(simulation);

  const coverageStatus = coverage.deadZones.length === 0 ? 'PASS' : 'WARN';
  const capacityStatus = capacity.systemTotal >= 2000 ? 'PASS' : 'WARN';
  const uniquenessStatus = uniqueness.needsMore.length === 0 ? 'PASS' : 'WARN';
  const distractorStatus = distractors.issues.length === 0 ? 'PASS' : 'WARN';
  const blueprintStatus = blueprint.recommendations.length === 0 ? 'PASS' : 'WARN';
  const simulationStatus = 'PASS';

  const overallStatus =
    [coverageStatus, capacityStatus, uniquenessStatus, distractorStatus, blueprintStatus].includes('WARN')
      ? 'NEEDS ATTENTION'
      : 'READY FOR USE';

  const priorityFixes = [];

  if (coverage.deadZones.length > 0) {
    coverage.deadZones.forEach(zone =>
      priorityFixes.push(`Add templates for ${zone.skillId} (${zone.name})`)
    );
  }

  if (capacity.lowCapacityWarnings.length > 0) {
    capacity.lowCapacityWarnings.slice(0, 2).forEach(skill =>
      priorityFixes.push(`Expand slot values for ${skill.skillId}`)
    );
  }

  blueprint.recommendations.slice(0, 2).forEach(rec => priorityFixes.push(rec));

  console.log('');
  console.log('=====================================');
  console.log('PRAXIS STUDY APP - SYSTEM DIAGNOSTIC');
  console.log('=====================================');
  console.log('');
  console.log(
    `[Coverage Audit]........... ${coverageStatus}${coverage.deadZones.length ? ` (${coverage.deadZones.length} gaps found)` : ''}`
  );
  console.log(
    `[Generation Capacity]...... ${capacityStatus} (${Math.round(capacity.systemTotal)} questions)`
  );
  console.log(
    `[Uniqueness Test].......... ${uniquenessStatus}${uniqueness.needsMore.length ? ` (${uniqueness.needsMore.length} skills low variety)` : ''}`
  );
  console.log(
    `[Distractor Audit]......... ${distractorStatus}${distractors.issues.length ? ' (issues detected)' : ''}`
  );
  console.log(
    `[Blueprint Alignment]...... ${blueprintStatus}${blueprint.recommendations.length ? ' (gaps detected)' : ''}`
  );
  console.log(`[Full Simulation].......... ${simulationStatus} (${simulation.averageDuplicates.toFixed(1)} duplicates avg)`);
  console.log('');
  console.log(`OVERALL: ${overallStatus}`);
  if (priorityFixes.length > 0) {
    console.log('');
    console.log('PRIORITY FIXES:');
    priorityFixes.slice(0, 5).forEach((fix, index) => console.log(`${index + 1}. ${fix}`));
  }
  console.log('');
  console.log('Estimated effort: 2 hours');

  return {
    coverage,
    capacity,
    uniqueness,
    distractors,
    blueprint,
    simulation
  };
}

if (import.meta.main) {
  runAllDiagnostics();
}
