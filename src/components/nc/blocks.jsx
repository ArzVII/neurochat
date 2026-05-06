import { NC, NC_CAT, categoryToNcKey } from "../../theme/tokens";
import { NCIcon } from "./NCIcon";
import { Body, Eyebrow } from "./ui";

export function SecondaryTile({ icon, title, desc, tone, ink, onClick, type = "button" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      style={{
        background: NC.card,
        border: `1px solid ${NC.cardEdge}`,
        borderRadius: 18,
        padding: 14,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        minHeight: 100,
        textAlign: "left",
        cursor: "pointer",
        font: "inherit",
        color: "inherit",
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: tone,
          color: ink,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </div>
      <div style={{ marginTop: "auto" }}>
        <div
          style={{
            fontFamily: NC.serif,
            fontSize: 15,
            fontWeight: 500,
            color: NC.ink,
            letterSpacing: "-0.01em",
          }}
        >
          {title}
        </div>
        <Body size={12} color={NC.inkMute}>
          {desc}
        </Body>
      </div>
    </button>
  );
}

export function FilterPill({ children, active, catKey, onClick }) {
  const c = catKey ? NC_CAT[catKey] : null;
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flexShrink: 0,
        padding: "8px 14px",
        borderRadius: 999,
        background: active ? NC.ink : NC.card,
        color: active ? NC.paper : NC.inkSoft,
        border: `1px solid ${active ? NC.ink : NC.cardEdge}`,
        fontFamily: NC.sans,
        fontSize: 13,
        fontWeight: 500,
        display: "flex",
        alignItems: "center",
        gap: 6,
        cursor: "pointer",
      }}
    >
      {c ? <span style={{ width: 6, height: 6, borderRadius: 999, background: c.dot }} /> : null}
      {children}
    </button>
  );
}

export function MoodOptionCard({ icon, label, sub, color, bg, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        background: selected ? bg : NC.card,
        border: `1.5px solid ${selected ? color : NC.cardEdge}`,
        borderRadius: 18,
        padding: "16px 18px",
        width: "100%",
        cursor: "pointer",
        textAlign: "left",
        font: "inherit",
      }}
    >
      <div style={{ color }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontFamily: NC.serif,
            fontSize: 19,
            fontWeight: 500,
            color: NC.ink,
            letterSpacing: "-0.01em",
          }}
        >
          {label}
        </div>
        <Body size={13} color={NC.inkMute}>
          {sub}
        </Body>
      </div>
      {selected ? (
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: 999,
            background: color,
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {NCIcon.check(14)}
        </div>
      ) : null}
    </button>
  );
}

export function OnboardingDot({ active }) {
  return (
    <div
      style={{
        width: active ? 22 : 6,
        height: 6,
        borderRadius: 999,
        background: active ? NC.ink : NC.cardEdge,
        transition: "all 0.2s ease",
      }}
    />
  );
}

export function FeedbackCard({ tone, ink, border, title, eyebrow, children, compact }) {
  return (
    <div
      style={{
        background: tone,
        borderRadius: 18,
        padding: compact ? "14px 16px" : "14px 16px 16px",
        border: `1px solid ${border}40`,
        position: "relative",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
        <div
          style={{
            fontFamily: NC.mono,
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: ink,
            opacity: 0.7,
          }}
        >
          {eyebrow}
        </div>
        <div
          style={{
            fontFamily: NC.serif,
            fontSize: 17,
            fontWeight: 500,
            color: ink,
            letterSpacing: "-0.01em",
          }}
        >
          {title}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>{children}</div>
    </div>
  );
}

export function FBPoint({ children }) {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
      <div
        style={{
          width: 6,
          height: 6,
          borderRadius: 999,
          background: NC.ink,
          opacity: 0.4,
          marginTop: 8,
          flexShrink: 0,
        }}
      />
      <Body size={13.5} color={NC.ink}>
        {children}
      </Body>
    </div>
  );
}

export function StatCard({ n, label, color }) {
  return (
    <div
      style={{
        background: NC.card,
        border: `1px solid ${NC.cardEdge}`,
        borderRadius: 16,
        padding: "14px 12px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: color }} />
      <div
        style={{
          fontFamily: NC.serif,
          fontSize: 38,
          fontWeight: 400,
          lineHeight: 1,
          color: NC.ink,
          letterSpacing: "-0.04em",
          fontVariationSettings: '"opsz" 144',
        }}
      >
        {n}
      </div>
      <div
        style={{
          fontFamily: NC.mono,
          fontSize: 10,
          color: NC.inkMute,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          marginTop: 4,
        }}
      >
        {label}
      </div>
    </div>
  );
}

export function BadgeTile({ icon, label, unlocked, color = NC.teal }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 16,
          background: unlocked ? NC.card : NC.paperDeep,
          border: `1px solid ${unlocked ? `${color}60` : NC.cardEdge}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: unlocked ? color : NC.inkFaint,
          opacity: unlocked ? 1 : 0.5,
          boxShadow: unlocked ? `inset 0 -2px 0 ${color}30` : "none",
        }}
      >
        {unlocked ? icon : NCIcon.lock(16)}
      </div>
      <div
        style={{
          fontFamily: NC.sans,
          fontSize: 10,
          color: unlocked ? NC.inkSoft : NC.inkFaint,
          textAlign: "center",
          lineHeight: 1.2,
        }}
      >
        {label}
      </div>
    </div>
  );
}

export function RecentRow({ categoryLabel, title, when, showCheck = true }) {
  const c = NC_CAT[categoryToNcKey(categoryLabel)] || NC_CAT.work;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 12px",
        background: NC.card,
        border: `1px solid ${NC.cardEdge}`,
        borderRadius: 14,
      }}
    >
      <div style={{ width: 4, height: 28, borderRadius: 2, background: c.dot }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: NC.serif, fontSize: 14, fontWeight: 500, color: NC.ink }}>{title}</div>
        <Body size={11.5} color={NC.inkMute}>
          {when}
        </Body>
      </div>
      {showCheck ? <div style={{ color: NC.sage }}>{NCIcon.check(16)}</div> : null}
    </div>
  );
}

export function TipRow({ icon, title, count, catKey, onClick }) {
  const c = NC_CAT[catKey] || NC_CAT.social;
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "14px 14px",
        background: NC.card,
        border: `1px solid ${NC.cardEdge}`,
        borderRadius: 16,
        width: "100%",
        cursor: "pointer",
        font: "inherit",
        textAlign: "left",
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 11,
          background: c.soft,
          color: c.ink,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: NC.serif, fontSize: 16, fontWeight: 500, color: NC.ink, letterSpacing: "-0.01em" }}>{title}</div>
        <Body size={11.5} color={NC.inkMute}>
          {count} tips
        </Body>
      </div>
      <div style={{ color: NC.inkFaint }}>{NCIcon.send(16)}</div>
    </button>
  );
}

export function SettingsGroup({ title, children }) {
  return (
    <div>
      <Eyebrow style={{ marginBottom: 8 }}>{title}</Eyebrow>
      <div style={{ background: NC.card, border: `1px solid ${NC.cardEdge}`, borderRadius: 16, overflow: "hidden" }}>
        {children}
      </div>
    </div>
  );
}

export function SettingsRow({ label, hint, children, isFirst }) {
  return (
    <div
      style={{
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        borderTop: isFirst ? "none" : `1px solid ${NC.cardEdge}`,
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: NC.sans, fontSize: 15, fontWeight: 500, color: NC.ink }}>{label}</div>
        {hint ? (
          <Body size={12} color={NC.inkMute}>
            {hint}
          </Body>
        ) : null}
      </div>
      {children}
    </div>
  );
}

export function TurnDot({ done }) {
  return (
    <div
      style={{
        width: 8,
        height: 8,
        borderRadius: 999,
        background: done ? NC.ink : "transparent",
        border: `1.5px solid ${done ? NC.ink : NC.cardEdge}`,
      }}
    />
  );
}
