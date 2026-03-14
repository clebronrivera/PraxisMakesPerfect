/**
 * Shared utility for domain coloring mapping
 * Supports the 4 primary Praxis sections/domains
 */
export const getDomainColor = (domainId: number): string => {
  const colors: Record<number, string> = {
    1: '#3B82F6', // Section I: Professional Practices (Blue)
    2: '#10B981', // Section II: Student-Level Services (Green)
    3: '#8B5CF6', // Section III: Systems-Level Services (Purple)
    4: '#F59E0B'  // Section IV: Foundations (Amber)
  };
  return colors[domainId] || '#64748B'; // Fallback slate color
};
