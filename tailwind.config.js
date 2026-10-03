export default { content: ['./index.html', './src/**/*.{ts,tsx}'], theme: { extend: {
  colors: { plum: { DEFAULT: 'var(--brand-plum)', dark: 'var(--brand-plum-dark)', light: 'var(--brand-plum-light)' }, copper: { DEFAULT: 'var(--brand-copper)', light: 'var(--brand-copper-light)' },
    cream: 'var(--bg-cream)', surface: 'var(--surface)', ink: 'var(--text)', muted: 'var(--muted)', line: 'var(--border)', success: 'var(--success)', warning: 'var(--warning)', danger: 'var(--danger)' },
  fontFamily: { heading: ['"Plus Jakarta Sans"', 'sans-serif'], body: ['Inter', 'sans-serif'] },
  borderRadius: { card: 'var(--radius-card)' }, boxShadow: { card: 'var(--shadow-card)' },
  keyframes: { ringPulse: { '0%': { boxShadow: '0 0 0 0 rgba(184,100,60,.55)' }, '100%': { boxShadow: '0 0 0 18px rgba(184,100,60,0)' } } },
  animation: { 'ring-pulse': 'ringPulse 1.8s ease-out infinite' } } }, plugins: [] };
