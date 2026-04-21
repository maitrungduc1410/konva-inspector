import { memo } from 'react';

const Keyboard = memo(() => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    width="16"
    height="16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.3"
    strokeLinecap="round"
    strokeLinejoin="round">
    <rect x="1.5" y="3.5" width="13" height="9" rx="1.5" />
    <line x1="4" y1="6" x2="5" y2="6" />
    <line x1="7" y1="6" x2="9" y2="6" />
    <line x1="11" y1="6" x2="12" y2="6" />
    <line x1="4" y1="9" x2="5" y2="9" />
    <line x1="11" y1="9" x2="12" y2="9" />
    <line x1="7" y1="9" x2="9" y2="9" />
  </svg>
));

Keyboard.displayName = 'Keyboard';

export default Keyboard;
