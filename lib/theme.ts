export const COLORS = {
  // Light gradient theme
  background: 'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)', // soft light gradient
  surface: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)', // subtle white gradient for cells
  card: '#ffffff', // flat white for consistency
  border: '#334155', // dark slate border
  accent: '#14b8a6', // teal accent
  textPrimary: '#0f172a', // dark navy text
  textSecondary: '#475569', // muted gray text
  success: '#10b981',
  danger: '#ef4444',
  muted: '#e2e8f0', // light gray muted
};

export type Theme = typeof COLORS;
