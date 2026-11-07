/**
 * Coffee Lab icon set — original inline SVG, 24×24 grid, 1.75 stroke, round caps,
 * drawn in currentColor so icons inherit text colour and theme.
 * Decorative by default (aria-hidden); pass `title` to make an icon meaningful.
 */
import type { ReactNode, SVGProps } from 'react';

const dot = (cx: number, cy: number) => <circle cx={cx} cy={cy} r={0.7} fill="currentColor" stroke="none" />;

const PATHS = {
  bean: (
    <>
      <ellipse cx="12" cy="12" rx="6.3" ry="9" transform="rotate(35 12 12)" />
      <path d="M7.6 18.2C10 15.6 9.6 13.1 12 12s2.4-3.6 4.4-6.2" />
    </>
  ),
  cup: (
    <>
      <path d="M4 10h12v4a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5v-4Z" />
      <path d="M16 11h1.5a2.5 2.5 0 0 1 0 5H16" />
      <path d="M8 3.5c-.8.9-.8 1.9 0 2.8M12 3.5c-.8.9-.8 1.9 0 2.8" />
      <path d="M3 21.5h15" />
    </>
  ),
  portafilter: (
    <>
      <path d="M2 8h12" />
      <path d="M3 8v2a4 4 0 0 0 4 4h2a4 4 0 0 0 4-4V8" />
      <path d="M7 14v2.5M9 14v2.5" />
      <path d="M13.4 9.6l7.2 3.1a1.3 1.3 0 0 1-1 2.4l-6.9-3" />
    </>
  ),
  tamper: (
    <>
      <circle cx="12" cy="5.5" r="3" />
      <path d="M12 8.5v5" />
      <path d="M5.5 13.5h13v3h-13z" />
      <path d="M4 20.5h16" />
    </>
  ),
  kettle: (
    <>
      <path d="M6.5 11h9l1 8a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2l1-8Z" />
      <path d="M8.5 11V9.5a2.5 2.5 0 0 1 5 0V11M11 7V5.8" />
      <path d="M16 12.5h1.8a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2h-1.3" />
      <path d="M5.9 18.6c-2.2-.3-2.8-2.6-3.1-5.6L1.6 10.3" />
    </>
  ),
  dripper: (
    <>
      <path d="M4 5h16l-5 9H9L4 5Z" />
      <path d="M9.2 8.2l1.8 3.3M14.8 8.2L13 11.5" />
      <path d="M7.5 14h9" />
      <path d="M12 16.5V18" />
      <path d="M7 21h10" />
    </>
  ),
  scale: (
    <>
      <path d="M5 11.5V10h14v1.5" />
      <rect x="3" y="11.5" width="18" height="8" rx="2" />
      <rect x="6.5" y="14.2" width="6.5" height="2.6" rx=".6" />
      <circle cx="16.5" cy="15.5" r="1" />
    </>
  ),
  timer: (
    <>
      <circle cx="12" cy="13.5" r="7.5" />
      <path d="M12 13.5V9.5M10 2.8h4M12 2.8V6M18.3 6.6l1.5-1.5" />
    </>
  ),
  grinder: (
    <>
      <path d="M7 3h10l-2 6H9L7 3Z" />
      <rect x="7.5" y="9" width="9" height="10" rx="1.5" />
      <path d="M10 13.5h4" />
      <path d="M5 21.5h14" />
    </>
  ),
  milk: (
    <>
      <path d="M7 6h9l-.5 2.5L17 19a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2l1.5-10.5L7 6Z" />
      <path d="M7 6L4.6 4.4" />
      <path d="M16.6 10h1a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-.8" />
      <path d="M7.4 11.5h8.7" />
    </>
  ),
  steam: (
    <path d="M8 20c-1.5-1.5-1.5-3 0-4.5s1.5-3 0-4.5M12 18c-1.5-1.5-1.5-3 0-4.5s1.5-3 0-4.5-1.5-3 0-4.5M16 20c-1.5-1.5-1.5-3 0-4.5s1.5-3 0-4.5" />
  ),
  droplet: <path d="M12 3.5c3 4 6 7.2 6 10.5a6 6 0 0 1-12 0c0-3.3 3-6.5 6-10.5Z" />,
  thermometer: (
    <>
      <path d="M10 14.5V5a2 2 0 0 1 4 0v9.5a4 4 0 1 1-4 0Z" />
      <path d="M12 9v7" />
    </>
  ),
  leaf: (
    <>
      <path d="M5 19C5 11 10 5.5 19 5c.5 9-5 14-13 14" />
      <path d="M5 19c3-4 6-6.5 9-8" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z" />
    </>
  ),
  headset: (
    <>
      <path d="M3 9.5A2.5 2.5 0 0 1 5.5 7h13A2.5 2.5 0 0 1 21 9.5v5a2.5 2.5 0 0 1-2.5 2.5h-3l-2-2.5h-3L8.5 17h-3A2.5 2.5 0 0 1 3 14.5v-5Z" />
      <path d="M3 11H1.5M22.5 11H21" />
    </>
  ),
  phone: (
    <>
      <rect x="6.5" y="2.5" width="11" height="19" rx="2.5" />
      <path d="M10.5 18.5h3" />
    </>
  ),
  desktop: (
    <>
      <rect x="2.5" y="4" width="19" height="12.5" rx="1.8" />
      <path d="M8.5 20.5h7M12 16.5v4" />
    </>
  ),
  'sound-on': (
    <>
      <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />
      <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />
    </>
  ),
  'sound-off': (
    <>
      <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />
      <path d="M16 9.5l5 5M21 9.5l-5 5" />
    </>
  ),
  music: (
    <>
      <path d="M9 18V5.5l11-2V16" />
      <circle cx="6.5" cy="18" r="2.5" />
      <circle cx="17.5" cy="16" r="2.5" />
    </>
  ),
  mic: (
    <>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3" />
    </>
  ),
  check: <path d="M4.5 12.5l5 5 10-11" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  help: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.3a2.6 2.6 0 0 1 5 .9c0 1.8-2.5 2.2-2.5 3.8" />
      {dot(12, 17)}
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5" />
      {dot(12, 7.8)}
    </>
  ),
  warning: (
    <>
      <path d="M10.3 4.2L2.6 17.5a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9.5V14" />
      {dot(12, 17.2)}
    </>
  ),
  shield: (
    <>
      <path d="M12 3l7.5 3v5.5c0 4.5-3.2 8.2-7.5 9.5-4.3-1.3-7.5-5-7.5-9.5V6L12 3Z" />
      <path d="M12 8v5" />
      {dot(12, 16)}
    </>
  ),
  lightbulb: (
    <>
      <path d="M9 18h6M10 21h4" />
      <path d="M8.5 14.5a6 6 0 1 1 7 0c-.8.6-1 1.3-1 2V17h-5v-.5c0-.7-.2-1.4-1-2Z" />
    </>
  ),
  myth: (
    <>
      <path d="M4.5 4.5h15A1.5 1.5 0 0 1 21 6v9a1.5 1.5 0 0 1-1.5 1.5H10l-4.5 3.5v-3.5h-1A1.5 1.5 0 0 1 3 15V6a1.5 1.5 0 0 1 1.5-1.5Z" />
      <path d="M9.5 8l5 5M14.5 8l-5 5" />
    </>
  ),
  flask: (
    <>
      <path d="M9.5 3h5M10 3v6.2L4.8 18.3A1.8 1.8 0 0 0 6.4 21h11.2a1.8 1.8 0 0 0 1.6-2.7L14 9.2V3" />
      <path d="M7.3 14.5h9.4" />
    </>
  ),
  'person-check': (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
      <path d="M15.5 12.5l2 2 4-4.5" />
    </>
  ),
  'clipboard-check': (
    <>
      <rect x="5" y="4.5" width="14" height="17" rx="2" />
      <path d="M9 4.5V3h6v1.5" />
      <path d="M8.5 13l2.5 2.5 4.5-5" />
    </>
  ),
  cube: (
    <>
      <path d="M12 2.8l8 4.6v9.2l-8 4.6-8-4.6V7.4z" />
      <path d="M4 7.4l8 4.6 8-4.6M12 12v9.2" />
    </>
  ),
  eye: (
    <>
      <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  back: <path d="M15 5l-7 7 7 7" />,
  next: <path d="M9 5l7 7-7 7" />,
  'chevron-down': <path d="M6 9l6 6 6-6" />,
  'chevron-up': <path d="M6 15l6-6 6 6" />,
  repeat: (
    <>
      <path d="M4 12a8 8 0 0 1 13.7-5.6L20 8.5" />
      <path d="M20 4v4.5h-4.5" />
      <path d="M20 12a8 8 0 0 1-13.7 5.6L4 15.5" />
      <path d="M4 20v-4.5h4.5" />
    </>
  ),
  pause: (
    <>
      <rect x="6.5" y="5" width="3.5" height="14" rx="1" />
      <rect x="14" y="5" width="3.5" height="14" rx="1" />
    </>
  ),
  play: <path d="M7.5 4.8v14.4a1 1 0 0 0 1.5.9l11.2-7.2a1 1 0 0 0 0-1.7L9 4a1 1 0 0 0-1.5.8Z" />,
  journal: (
    <>
      <path d="M5.5 3.5h11a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2h-11z" />
      <path d="M8.5 3.5v17M11.5 8h4M11.5 11.5h4" />
    </>
  ),
  book: (
    <>
      <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5Z" />
      <path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5Z" />
    </>
  ),
  star: <path d="M12 3.2l2.7 5.5 6 .9-4.35 4.25 1 6L12 17l-5.4 2.85 1-6L3.3 9.6l6-.9L12 3.2Z" />,
  sparkle: (
    <>
      <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />
      <path d="M19 15.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      {dot(12, 12)}
    </>
  ),
  flag: <path d="M5 21V4M5 4h11l-2 4 2 4H5" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </>
  ),
  home: (
    <>
      <path d="M3.5 11L12 4l8.5 7" />
      <path d="M5.5 9.5V20h13V9.5" />
      <path d="M10 20v-5h4v5" />
    </>
  ),
  map: (
    <>
      <path d="M3.5 6.5L9 4l6 2.5L20.5 4v13.5L15 20l-6-2.5-5.5 2.5z" />
      <path d="M9 4v13.5M15 6.5V20" />
    </>
  ),
  sliders: (
    <>
      <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
      <circle cx="16" cy="7" r="2" />
      <circle cx="10" cy="17" r="2" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  lock: (
    <>
      <rect x="5" y="10.5" width="14" height="10" rx="2" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
    </>
  ),
  language: (
    <>
      <path d="M3 5h9M7.5 3v2M5 5c.5 3 2.5 5.5 5.5 7M10 5c-.5 3-2.5 5.5-5.5 7" />
      <path d="M12.5 21l4-10 4 10M14 17.5h5" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
    </>
  ),
  moon: <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />,
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof PATHS;
export const ICON_NAMES = Object.keys(PATHS) as IconName[];

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName;
  /** Rendered size in px (default 20). */
  size?: number;
  /** Accessible name. Omit for decorative icons next to visible text. */
  title?: string;
  strokeWidth?: number;
}

export function Icon({ name, size = 20, title, strokeWidth = 1.75, className, ...rest }: IconProps) {
  const labelled = Boolean(title);
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={['cl-icon', className].filter(Boolean).join(' ')}
      aria-hidden={labelled ? undefined : true}
      role={labelled ? 'img' : undefined}
      aria-label={labelled ? title : undefined}
      focusable="false"
      data-icon={name}
      {...rest}
    >
      {PATHS[name] ?? PATHS.cup}
    </svg>
  );
}
