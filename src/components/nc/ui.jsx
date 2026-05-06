import { NC } from "../../theme/tokens";

const PAD = 24;
export { PAD };

export function Paper({ children, style = {} }) {
  return (
    <div
      style={{
        width: "100%",
        minHeight: "100%",
        background: NC.paper,
        backgroundImage: `radial-gradient(circle at 20% 0%, rgba(240,201,106,0.08), transparent 55%),
          radial-gradient(circle at 100% 100%, rgba(90,138,147,0.07), transparent 60%)`,
        position: "relative",
        overflow: "hidden",
        fontFamily: NC.sans,
        color: NC.ink,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function ScreenColumn({ children, style = {} }) {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: 420,
        margin: "0 auto",
        paddingLeft: "max(24px, env(safe-area-inset-left))",
        paddingRight: "max(24px, env(safe-area-inset-right))",
        paddingTop: "max(8px, env(safe-area-inset-top))",
        paddingBottom: "max(16px, env(safe-area-inset-bottom))",
        boxSizing: "border-box",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function TopBar({ left, right, center, style = {} }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr auto 1fr",
        alignItems: "center",
        padding: "8px 6px 14px",
        minHeight: 44,
        ...style,
      }}
    >
      <div style={{ justifySelf: "start" }}>{left}</div>
      <div
        style={{
          justifySelf: "center",
          fontFamily: NC.sans,
          fontSize: 13,
          fontWeight: 500,
          color: NC.inkMute,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
        }}
      >
        {center}
      </div>
      <div style={{ justifySelf: "end" }}>{right}</div>
    </div>
  );
}

export function Eyebrow({ children, color = NC.inkMute, style = {} }) {
  return (
    <div
      style={{
        fontFamily: NC.mono,
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        color,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function H1({ children, style = {} }) {
  return (
    <h1
      style={{
        fontFamily: NC.serif,
        fontWeight: 400,
        fontSize: 36,
        lineHeight: 1.05,
        color: NC.ink,
        margin: 0,
        letterSpacing: "-0.02em",
        fontVariationSettings: '"opsz" 144, "SOFT" 100',
        textWrap: "balance",
        ...style,
      }}
    >
      {children}
    </h1>
  );
}

export function H2({ children, style = {} }) {
  return (
    <h2
      style={{
        fontFamily: NC.serif,
        fontWeight: 500,
        fontSize: 24,
        lineHeight: 1.15,
        color: NC.ink,
        margin: 0,
        letterSpacing: "-0.015em",
        fontVariationSettings: '"opsz" 96',
        textWrap: "balance",
        ...style,
      }}
    >
      {children}
    </h2>
  );
}

export function Body({ children, color, size = 16, style = {} }) {
  return (
    <p
      style={{
        fontFamily: NC.sans,
        fontWeight: 400,
        fontSize: size,
        lineHeight: 1.55,
        color: color || NC.inkSoft,
        margin: 0,
        letterSpacing: "-0.005em",
        textWrap: "pretty",
        ...style,
      }}
    >
      {children}
    </p>
  );
}

export function PrimaryButton({ children, icon, style = {}, kind = "ink", type = "button", disabled, onClick, ...rest }) {
  const styles = {
    ink: { bg: NC.ink, fg: NC.paper, edge: "rgba(0,0,0,0.18)" },
    butter: { bg: NC.butter, fg: NC.ink, edge: "rgba(120,80,0,0.15)" },
    sage: { bg: NC.sage, fg: "#fff", edge: "rgba(60,80,50,0.18)" },
  }[kind];
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        width: "100%",
        minHeight: 56,
        padding: "0 22px",
        borderRadius: 18,
        background: styles.bg,
        color: styles.fg,
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
        fontFamily: NC.sans,
        fontSize: 17,
        fontWeight: 500,
        letterSpacing: "-0.01em",
        boxShadow: `inset 0 -2px 0 ${styles.edge}, ${NC.shadow}`,
        ...style,
      }}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}

export function GhostButton({ children, icon, style = {}, type = "button", disabled, onClick, ...rest }) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        width: "100%",
        minHeight: 52,
        padding: "0 22px",
        borderRadius: 16,
        background: "transparent",
        color: NC.ink,
        border: `1.5px solid ${NC.cardEdge}`,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
        fontFamily: NC.sans,
        fontSize: 16,
        fontWeight: 500,
        ...style,
      }}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}

export function Card({ children, style = {}, tone = "card" }) {
  const bg = tone === "card" ? NC.card : tone;
  return (
    <div
      style={{
        background: bg,
        borderRadius: NC.rLg,
        padding: 22,
        border: `1px solid ${NC.cardEdge}`,
        boxShadow: NC.shadow,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Chip({ children, color = NC.teal, soft, style = {} }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 10px",
        borderRadius: 999,
        fontFamily: NC.mono,
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        background: soft || "transparent",
        color,
        border: soft ? "none" : `1px solid ${color}40`,
        ...style,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: 999, background: color }} />
      {children}
    </span>
  );
}

export function Toggle({ checked, onChange, label, id, style = {} }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 14,
        ...style,
      }}
    >
      {label ? (
        <Body size={15} color={NC.ink} style={{ fontWeight: 500, flex: 1, textAlign: "left" }}>
          {label}
        </Body>
      ) : null}
      <button
        type="button"
        id={id}
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        style={{
          width: 46,
          height: 28,
          borderRadius: 999,
          background: checked ? NC.sage : NC.cardEdge,
          position: "relative",
          transition: "background 0.2s ease",
          border: "none",
          padding: 0,
          cursor: "pointer",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 3,
            left: checked ? 21 : 3,
            width: 22,
            height: 22,
            borderRadius: 999,
            background: "#fff",
            boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
            transition: "left 0.2s ease",
          }}
        />
      </button>
    </div>
  );
}

export function Bubble({ side = "ai", children, className = "", style = {} }) {
  const isUser = side === "user";
  return (
    <div
      className={`nc-bubble-enter ${className}`}
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        paddingLeft: isUser ? 32 : 0,
        paddingRight: isUser ? 0 : 32,
        ...style,
      }}
    >
      <div
        style={{
          background: isUser ? NC.ink : NC.card,
          color: isUser ? NC.paper : NC.ink,
          padding: "12px 16px",
          borderRadius: 18,
          borderTopLeftRadius: isUser ? 18 : 6,
          borderTopRightRadius: isUser ? 6 : 18,
          fontFamily: NC.sans,
          fontSize: 15,
          lineHeight: 1.5,
          maxWidth: "82%",
          border: isUser ? "none" : `1px solid ${NC.cardEdge}`,
          boxShadow: isUser ? "none" : NC.shadow,
        }}
      >
        {children}
      </div>
    </div>
  );
}
