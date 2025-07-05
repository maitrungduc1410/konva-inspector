import { memo } from 'react';

const CopyToClipboard = memo(() => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-4 w-4 cursor-pointer fill-current"
    width="24"
    height="24"
    viewBox="0 0 24 24">
    <path d="M0 0h24v24H0z" fill="none"></path>
    <path
      fill="currentColor"
      d="
M3 13h2v-2H3v2zm0 4h2v-2H3v2zm2 4v-2H3a2 2 0 0 0 2 2zM3 9h2V7H3v2zm12 12h2v-2h-2v2zm4-18H9a2 2 0 0 0-2
2v10a2 2 0 0 0 2 2h10c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 12H9V5h10v10zm-8 6h2v-2h-2v2zm-4 0h2v-2H7v2z
"></path>
  </svg>
));

CopyToClipboard.displayName = 'CopyToClipboard';

export default CopyToClipboard;
