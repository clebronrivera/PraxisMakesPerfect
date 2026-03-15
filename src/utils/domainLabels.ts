import type { Domain } from '../types/content';

export function getDomainLabel(domain: Pick<Domain, 'id' | 'name'> | null | undefined): string {
  if (!domain) {
    return 'Unknown domain';
  }

  const name = domain.name?.trim();
  if (name) {
    return name;
  }

  return `Domain ${domain.id}`;
}
