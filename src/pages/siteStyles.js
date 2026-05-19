import { NC } from "../theme/tokens";

export const sitePage = {
  minHeight: "100vh",
  background: NC.paper,
  color: NC.ink,
  fontFamily: NC.sans,
};

export const siteWrap = {
  maxWidth: 920,
  margin: "0 auto",
  padding: "0 24px 64px",
};

export const siteNav = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "20px 0",
  gap: 16,
  flexWrap: "wrap",
};

export const siteH1 = {
  fontFamily: NC.serif,
  fontSize: "clamp(2rem, 5vw, 3.2rem)",
  fontWeight: 500,
  letterSpacing: "-0.03em",
  lineHeight: 1.05,
  margin: 0,
};

export const siteH2 = {
  fontFamily: NC.serif,
  fontSize: "clamp(1.5rem, 3vw, 2rem)",
  fontWeight: 500,
  letterSpacing: "-0.02em",
  margin: "0 0 12px",
};

export const siteCard = {
  background: NC.card,
  border: `1px solid ${NC.cardEdge}`,
  borderRadius: 16,
  padding: "20px 22px",
  boxShadow: NC.shadow,
};

export const siteLink = {
  color: NC.teal,
  textDecoration: "underline",
  cursor: "pointer",
  background: "none",
  border: "none",
  font: "inherit",
  padding: 0,
};
