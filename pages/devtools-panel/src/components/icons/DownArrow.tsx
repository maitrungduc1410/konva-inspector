import { memo } from 'react';

const DownArrow = memo(() => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-4 w-4 cursor-pointer fill-current"
    width="24"
    height="24"
    viewBox="0 0 24 24">
    <path d="M0 0h24v24H0z" fill="none"></path>
    <path fill="currentColor" d="M7 10l5 5 5-5z"></path>
  </svg>
));

DownArrow.displayName = 'DownArrow';

export default DownArrow;
