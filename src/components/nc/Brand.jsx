import { NC } from "../../theme/tokens";

export function NCMark({ size = 44, ink = NC.ink, butter = NC.butter }) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" fill="none" aria-hidden>
      <circle cx="22" cy="22" r="18" fill={butter} opacity="0.35" />
      <path
        d="M8 30 C 8 18, 18 8, 26 14 C 34 20, 30 32, 22 32 C 14 32, 12 24, 18 22 C 26 19, 34 24, 36 30"
        stroke={ink}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="36" cy="30" r="1.6" fill={ink} />
    </svg>
  );
}

export function NCThread({ width = 320, height = 60, stroke = NC.ink, opacity = 0.18 }) {
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none" aria-hidden>
      <path
        d={`M2 ${height - 12} C ${width * 0.18} ${height - 44}, ${width * 0.32} ${height - 2}, ${width * 0.5} ${height / 2 - 6}
           S ${width * 0.78} 4, ${width - 2} ${height - 18}`}
        stroke={stroke}
        strokeOpacity={opacity}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Vertical dashed thread for conversation column */
export function ConversationThreadLine({ stroke = NC.ink }) {
  return (
    <svg
      width={2}
      height="100%"
      viewBox="0 0 2 600"
      preserveAspectRatio="none"
      style={{ position: "absolute", left: 36, top: 12, opacity: 0.18, pointerEvents: "none" }}
      aria-hidden
    >
      <line x1="1" y1="0" x2="1" y2="600" stroke={stroke} strokeDasharray="2 6" strokeLinecap="round" />
    </svg>
  );
}
