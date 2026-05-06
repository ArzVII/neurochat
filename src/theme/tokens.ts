/** Soft Stationery — NeuroChat design tokens */

export const NC = {
  paper: "#F5EFE3",
  paperDeep: "#EDE5D3",
  card: "#FBF6EA",
  cardEdge: "#E5DBC2",
  ink: "#1B2840",
  inkSoft: "#2F3D58",
  inkMute: "#6E7691",
  inkFaint: "#A8AEC1",
  butter: "#F0C96A",
  butterSoft: "#FAEBC4",
  sage: "#8FA88A",
  sageSoft: "#DCE6D5",
  teal: "#5A8A93",
  tealSoft: "#CFE0E2",
  terracotta: "#C68663",
  terracottaSoft: "#EFD9CB",
  mauve: "#9A8AA8",
  mauveSoft: "#E1DAE6",
  shadow: "0 1px 0 rgba(27,40,64,0.04), 0 4px 14px -6px rgba(27,40,64,0.10)",
  shadowLg: "0 1px 0 rgba(27,40,64,0.04), 0 12px 32px -10px rgba(27,40,64,0.18)",
  serif: "'Fraunces', 'Iowan Old Style', Georgia, serif",
  sans: "'Geist', 'Inter', -apple-system, system-ui, sans-serif",
  mono: "'Geist Mono', 'JetBrains Mono', ui-monospace, monospace",
  rSm: 10,
  rMd: 14,
  rLg: 20,
  rXl: 28,
} as const;

export type NcCatKey =
  | "work"
  | "social"
  | "everyday"
  | "difficult"
  | "relationships"
  | "selfadvocacy"
  | "bonus"
  | "custom";

export type NcCatEntry = { name: string; dot: string; soft: string; ink: string };

export const NC_CAT: Record<NcCatKey, NcCatEntry> = {
  work: { name: "Work", dot: NC.teal, soft: NC.tealSoft, ink: "#3D6A72" },
  social: { name: "Social", dot: NC.sage, soft: NC.sageSoft, ink: "#5A7155" },
  everyday: { name: "Everyday", dot: NC.butter, soft: NC.butterSoft, ink: "#8A6A1F" },
  difficult: { name: "Difficult", dot: NC.terracotta, soft: NC.terracottaSoft, ink: "#8B4F30" },
  relationships: { name: "Relationships", dot: NC.mauve, soft: NC.mauveSoft, ink: "#5F4F70" },
  selfadvocacy: { name: "Self-Advocacy", dot: "#3F7A7E", soft: "#C9DDDF", ink: "#2A5A5E" },
  bonus: { name: "Bonus", dot: NC.butter, soft: NC.butterSoft, ink: "#8A6A1F" },
  custom: { name: "My scenarios", dot: NC.teal, soft: NC.tealSoft, ink: "#3D6A72" },
};

/** Map app scenario category labels to NC_CAT keys */
export function categoryToNcKey(category: string | undefined): NcCatKey {
  const m: Record<string, NcCatKey> = {
    Work: "work",
    Social: "social",
    Everyday: "everyday",
    Difficult: "difficult",
    Relationships: "relationships",
    "Self-Advocacy": "selfadvocacy",
    Bonus: "bonus",
    "My scenarios": "custom",
    Replay: "everyday",
  };
  return (category && m[category]) || "work";
}

export function catColor(category: string | undefined): NcCatEntry {
  return NC_CAT[categoryToNcKey(category)];
}
