/**
 * The "GitHub Dark" theme of mermaideditor.io: five base colors, from which the editor derives the
 * flowchart styles (node, edge, subgraph) and maps them onto Mermaid's `base` theme variables.
 * The values below are that derivation, so diagrams look the same here as in the editor.
 */
const base = {
  background: "#0d1117",
  primary: "#ff00ff",
  secondary: "#3fb950",
  tertiary: "#a371f7",
  line: "#c9d1d9",
};

const node = "#1f2329";
const border = "#33373d";
const panel = "#191d23";
const text = "#e0e4f5";
const onAccent = "#1a1b26";

export const GITHUB_DARK = {
  background: "transparent",
  themeVariables: {
    fontSize: ".85em",
    background: "--background",
    primaryColor: base.primary,
    primaryBorderColor: base.primary,
    primaryTextColor: onAccent,
    secondaryColor: base.secondary,
    secondaryBorderColor: base.secondary,
    secondaryTextColor: onAccent,
    tertiaryColor: base.tertiary,
    tertiaryBorderColor: base.tertiary,
    tertiaryTextColor: onAccent,
    mainBkg: node,
    nodeBorder: border,
    nodeTextColor: text,
    textColor: text,
    clusterBkg: panel,
    clusterBorder: border,
    lineColor: base.line,
    defaultLinkColor: base.line,
    edgeLabelBackground: panel,
    // Mermaid 12 draws a light gray shadow under nodes, a glow on this background; the editor has none
    dropShadow: "none",
  },
} as const;
