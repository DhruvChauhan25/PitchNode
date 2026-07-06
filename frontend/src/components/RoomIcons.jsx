/* Minimal stroke icons for the interview room controls. */

const base = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

export const MicIcon = () => (
  <svg {...base}>
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
  </svg>
);

export const MicOffIcon = () => (
  <svg {...base}>
    <path d="M9 6a3 3 0 0 1 6 0v5a3 3 0 0 1-.5 1.7M9 9v2a3 3 0 0 0 4.6 2.5" />
    <path d="M5 11a7 7 0 0 0 11.6 5.2M19 11a7 7 0 0 1-.6 2.8M12 18v3" />
    <path d="M3 3l18 18" />
  </svg>
);

export const CamIcon = () => (
  <svg {...base}>
    <rect x="3" y="6" width="13" height="12" rx="3" />
    <path d="M16 10.5 21 8v8l-5-2.5" />
  </svg>
);

export const CamOffIcon = () => (
  <svg {...base}>
    <path d="M8 6h5a3 3 0 0 1 3 3v1.5L21 8v8l-2.5-1.25M16 16a3 3 0 0 1-3 2H6a3 3 0 0 1-3-3V9a3 3 0 0 1 1.5-2.6" />
    <path d="M3 3l18 18" />
  </svg>
);

export const ScreenIcon = () => (
  <svg {...base}>
    <rect x="3" y="4" width="18" height="13" rx="2" />
    <path d="M8 21h8M12 17v4" />
  </svg>
);

export const LeaveIcon = () => (
  <svg {...base}>
    <path d="M9 21H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3h3" />
    <path d="M15 16l4-4-4-4M19 12H9" />
  </svg>
);

export const CopyIcon = () => (
  <svg {...base} width={16} height={16}>
    <rect x="9" y="9" width="12" height="12" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

export const CheckIcon = () => (
  <svg {...base} width={16} height={16}>
    <path d="M4 12.5 9.5 18 20 6" />
  </svg>
);
