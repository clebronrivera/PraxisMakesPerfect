import { runCapacityTest } from '../brain/question-capacity';

if (import.meta.main) {
  const result = runCapacityTest();
  console.log('GENERATION CAPACITY');
  console.log('===================');

  for (const domain of result.domainSummaries) {
    console.log('');
    console.log(`Domain ${domain.domainId}: ${domain.name}`);
    for (const skill of domain.skills) {
      console.log(`  ${skill.skillId}: ${skill.capacity} unique questions possible`);
    }
    console.log(`  Domain total: ${domain.total} questions`);
  }

  console.log('');
  console.log(`SYSTEM TOTAL: ${result.systemTotal} unique questions`);
  console.log('');

  if (result.lowCapacityWarnings.length > 0) {
    console.log('LOW CAPACITY WARNINGS (<20 questions):');
    for (const warning of result.lowCapacityWarnings) {
      console.log(`  - ${warning.skillId}: Only ${warning.capacity} combinations`);
    }
  } else {
    console.log('LOW CAPACITY WARNINGS (<20 questions): none');
  }
}
