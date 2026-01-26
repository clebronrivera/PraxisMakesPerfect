import { SKILL_MAP } from '../brain/skill-map';
import { runCapacityTest } from './capacity-test';
import { formatPercent } from './diagnostic-utils';

const PRAXIS_WEIGHTS: Record<number, number> = {
  1: 0.32,
  2: 0.10,
  3: 0.08,
  4: 0.14,
  5: 0.08,
  6: 0.06,
  7: 0.05,
  8: 0.07,
  9: 0.04,
  10: 0.06
};

export interface DomainAlignment {
  domainId: number;
  name: string;
  praxisWeight: number;
  yourWeight: number;
  gap: number;
  status: string;
}

export interface BlueprintAlignmentReport {
  comparisons: DomainAlignment[];
  recommendations: string[];
}

function determineStatus(gap: number): string {
  if (Math.abs(gap) <= 0.02) {
    return '✓ Close';
  }
  if (gap >= 0.03) {
    return '✗ Gap';
  }
  if (gap > 0.02) {
    return '⚠ Light';
  }
  if (gap <= -0.05) {
    return '⚠ Heavy (Review)';
  }
  return '✓ Heavy (OK)';
}

export function runBlueprintAlignment(): BlueprintAlignmentReport {
  const capacity = runCapacityTest();
  const totalCapacity = capacity.systemTotal || 1;
  const comparisons: DomainAlignment[] = [];
  const recommendations: string[] = [];

  for (const [domainId, domain] of Object.entries(SKILL_MAP)) {
    const id = Number(domainId);
    const summary = capacity.domainSummaries.find(ds => ds.domainId === id);
    const yourCapacity = summary?.total ?? 0;
    const yourWeight = yourCapacity / totalCapacity;
    const praxisWeight = PRAXIS_WEIGHTS[id] ?? 0;
    const gap = praxisWeight - yourWeight;

    if (gap > 0.02) {
      recommendations.push(`Add more templates for Domain ${id} (${domain.name})`);
    }

    comparisons.push({
      domainId: id,
      name: domain.name,
      praxisWeight,
      yourWeight,
      gap,
      status: determineStatus(gap)
    });
  }

  console.log('BLUEPRINT ALIGNMENT');
  console.log('===================');
  console.log('');
  console.log('Domain                  | Praxis | Yours | Gap    | Status');
  console.log('------------------------|--------|-------|--------|--------');

  for (const comparison of comparisons) {
    console.log(
      `${comparison.domainId.toString().padEnd(2)}. ${comparison.name.padEnd(20)} | ${formatPercent(
        comparison.praxisWeight,
        0
      ).padEnd(6)} | ${formatPercent(comparison.yourWeight, 0).padEnd(5)} | ${
        comparison.gap >= 0 ? '+' : ''
      }${(comparison.gap * 100).toFixed(0).padStart(5)}% | ${comparison.status}`
    );
  }

  console.log('');
  console.log('RECOMMENDED ACTIONS:');
  if (recommendations.length === 0) {
    console.log('  (none)');
  } else {
    const uniqueRecommendations = Array.from(new Set(recommendations));
    uniqueRecommendations.forEach(rec => console.log(`  - ${rec}`));
  }

  return {
    comparisons,
    recommendations
  };
}

if (import.meta.main) {
  runBlueprintAlignment();
}
