import { NC, catColor } from "../../theme/tokens";
import { NCIcon } from "./NCIcon";
import { Body } from "./ui";

export function ScenarioCard({ category, iconKey, title, desc, difficultyLabel, done, onClick, style = {} }) {
  const c = catColor(category);
  const iconEl = NCIcon[iconKey] ? NCIcon[iconKey](20) : NCIcon.bubble(20);
  const inner = (
    <>
      <div style={{ width: 6, background: c.dot, flexShrink: 0 }} />
      <div style={{ display: "flex", gap: 14, padding: "16px 18px 16px 16px", flex: 1, alignItems: "flex-start" }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: c.soft,
            color: c.ink,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {iconEl}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
            <div
              style={{
                fontFamily: NC.serif,
                fontSize: 17,
                fontWeight: 500,
                color: NC.ink,
                letterSpacing: "-0.01em",
              }}
            >
              {title}
            </div>
            {done ? <div style={{ color: NC.sage, display: "flex" }}>{NCIcon.check(14)}</div> : null}
          </div>
          <div
            style={{
              fontFamily: NC.mono,
              fontSize: 10.5,
              color: c.ink,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: 6,
            }}
          >
            {difficultyLabel ? `${c.name} · ${difficultyLabel}` : c.name}
          </div>
          <Body size={13.5} color={NC.inkSoft} style={{ lineHeight: 1.45 }}>
            {desc}
          </Body>
        </div>
      </div>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        style={{
          display: "flex",
          background: NC.card,
          borderRadius: NC.rLg,
          border: `1px solid ${NC.cardEdge}`,
          overflow: "hidden",
          boxShadow: NC.shadow,
          cursor: "pointer",
          textAlign: "left",
          width: "100%",
          padding: 0,
          font: "inherit",
          ...style,
        }}
      >
        {inner}
      </button>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        background: NC.card,
        borderRadius: NC.rLg,
        border: `1px solid ${NC.cardEdge}`,
        overflow: "hidden",
        boxShadow: NC.shadow,
        ...style,
      }}
    >
      {inner}
    </div>
  );
}
