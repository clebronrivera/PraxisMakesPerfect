/**
 * Shared utility for domain coloring mapping
 * Supports the 4 primary Praxis sections/domains
 */
export const getDomainColor = (domainId: number): string => {
  const colors: Record<number, string> = {
    1: '#06B6D4', // Section I: Professional Practices (Cyan→Blue — solid cyan)
    2: '#10B981', // Section II: Student-Level Services (Emerald→Teal — solid emerald)
    3: '#F43F5E', // Section III: Systems-Level Services (Rose→Pink — solid rose)
    4: '#F59E0B'  // Section IV: Foundations (Amber→Orange — solid amber)
  };
  return colors[domainId] || '#64748B'; // Fallback slate color
};
