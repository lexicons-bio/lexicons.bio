import { createTheme } from "@mui/material/styles";

export const palette = {
  bg: "#fbfaf6",
  bgPanel: "#f1eee2",
  forest: "#0e2a1c",
  moss: "#3a5b2c",
  ink: "#1a1f1a",
  inkSoft: "#52584f",
  inkFaint: "#8a8f86",
  rule: "#dcd6c4",
  ruleSoft: "#ebe6d6",
  warn: "#a14b2a",
  link: "#3a5b2c",
};

export const fonts = {
  sans: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  serif: '"Fraunces", Georgia, serif',
  mono: '"JetBrains Mono", ui-monospace, Menlo, monospace',
};

export const theme = createTheme({
  palette: {
    mode: "light",
    background: { default: palette.bg, paper: palette.bg },
    primary: { main: palette.forest },
    secondary: { main: palette.moss },
    text: { primary: palette.ink, secondary: palette.inkSoft },
    divider: palette.rule,
    error: { main: palette.warn },
  },
  typography: {
    fontFamily: fonts.sans,
    fontSize: 14,
  },
  shape: { borderRadius: 0 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          overflowY: "scroll",
        },
        body: {
          background: palette.bg,
          color: palette.ink,
          fontFamily: fonts.sans,
          fontSize: 14,
          lineHeight: 1.65,
          WebkitFontSmoothing: "antialiased",
        },
        a: { color: palette.link },
      },
    },
  },
});
