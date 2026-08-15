import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 16, ...props }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    ...props,
  };
}

export function IconOverview(p: IconProps) {
  return (
    <svg {...base(p)}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

export function IconNodes(p: IconProps) {
  return (
    <svg {...base(p)}>
      <rect x="3" y="3" width="11" height="5" rx="1" />
      <rect x="3" y="10" width="11" height="5" rx="1" />
      <rect x="3" y="17" width="11" height="5" rx="1" />
      <circle cx="18.5" cy="5.5" r="2.25" />
      <circle cx="18.5" cy="12.5" r="2.25" />
      <circle cx="18.5" cy="19.5" r="2.25" />
    </svg>
  );
}

export function IconLive(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M13.2 2.1 4.2 13.5h6l-1.2 8.4 9-11.4h-6l1.2-8.4z" />
    </svg>
  );
}

export function IconHistory(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M3 12a9 9 0 1 0 2.6-6.4" />
      <path d="M3 4v5h5" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

export function IconAnalytics(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M4 20V10" />
      <path d="M10 20V4" />
      <path d="M16 20v-7" />
      <path d="M22 20H2" />
    </svg>
  );
}

export function IconAlert(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M10.3 3.5 2.6 17a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.5a2 2 0 0 0-3.4 0z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

export function IconHealth(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M12 3l1.8 5.2H19l-4.2 3.2 1.6 5.1-4.4-3.2-4.4 3.2 1.6-5.1L5 8.2h5.2L12 3z" />
    </svg>
  );
}

export function IconSystem(p: IconProps) {
  return (
    <svg {...base(p)}>
      <rect x="3" y="4" width="14" height="16" rx="2" />
      <path d="M3 9h14" />
      <circle cx="19.5" cy="9" r="1.5" />
      <circle cx="19.5" cy="15" r="1.5" />
    </svg>
  );
}

export function IconSettings(p: IconProps) {
  return (
    <svg {...base(p)}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3h1a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8v1a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z" />
    </svg>
  );
}

export function IconBell(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.9 1.9 0 0 0 3.4 0" />
    </svg>
  );
}

export function IconBellDot(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.9 1.9 0 0 0 3.4 0" />
      <circle cx="18" cy="5" r="2.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconSignal(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M2 20h.01" />
      <path d="M7 20v-4" />
      <path d="M12 20v-8" />
      <path d="M17 20V8" />
      <path d="M22 20V4" />
    </svg>
  );
}

export function IconWifi(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M5 12.5a11 11 0 0 1 14 0" />
      <path d="M8.5 15.7a6.9 6.9 0 0 1 7 0" />
      <path d="M2 9.4a15 15 0 0 1 20 0" />
      <circle cx="12" cy="19" r="1" fill="currentColor" />
    </svg>
  );
}

export function IconChip(p: IconProps) {
  return (
    <svg {...base(p)}>
      <rect x="6" y="6" width="12" height="12" rx="2" />
      <path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3" />
    </svg>
  );
}

export function IconDatabase(p: IconProps) {
  return (
    <svg {...base(p)}>
      <ellipse cx="12" cy="5" rx="8" ry="3" />
      <path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5" />
      <path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
    </svg>
  );
}

export function IconMap(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" />
      <path d="M9 4v14M15 6v14" />
    </svg>
  );
}

export function IconChevronRight(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

export function IconClose(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

export function IconArrowUp(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  );
}

export function IconArrowDown(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M12 5v14M19 12l-7 7-7-7" />
    </svg>
  );
}

export function IconMenu(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

export function IconRefresh(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M21 12a9 9 0 1 1-2.6-6.4" />
      <path d="M21 3v5h-5" />
    </svg>
  );
}

export function IconDroplet(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M12 3s6 6.3 6 10a6 6 0 0 1-12 0c0-3.7 6-10 6-10z" />
    </svg>
  );
}

/** SCEMS brand mark */
export function IconLogo(p: IconProps) {
  return (
    <svg {...base({ ...p, strokeWidth: 2 })}>
      <path d="M12 3 21 19H3L12 3z" />
      <path d="M12 8.5 17 19H7l5-10.5z" fill="currentColor" stroke="none" />
    </svg>
  );
}