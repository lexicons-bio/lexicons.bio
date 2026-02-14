import { createContext, useEffect, useMemo, useState } from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider, CssBaseline, useMediaQuery } from "@mui/material";
import { buildTheme } from "./theme";
import Layout from "./components/Layout";
import Overview from "./pages/Overview";
import LexiconPage from "./pages/LexiconPage";

export type ColorPref = "light" | "dark" | "system";

export const ColorModeContext = createContext({
  mode: "light" as "light" | "dark",
  pref: "system" as ColorPref,
  cycle: () => {},
});

export default function App() {
  const [pref, setPref] = useState<ColorPref>(() => {
    const stored = localStorage.getItem("colorMode");
    if (stored === "light" || stored === "dark") return stored;
    return "system";
  });

  const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");
  const mode = pref === "system" ? (prefersDark ? "dark" : "light") : pref;
  const theme = useMemo(() => buildTheme(mode), [mode]);

  useEffect(() => {
    if (pref === "system") {
      localStorage.removeItem("colorMode");
    } else {
      localStorage.setItem("colorMode", pref);
    }
  }, [pref]);

  const colorMode = useMemo(
    () => ({
      mode,
      pref,
      cycle: () =>
        setPref((prev) => {
          const order: ColorPref[] = ["light", "system", "dark"];
          return order[(order.indexOf(prev) + 1) % order.length];
        }),
    }),
    [mode, pref]
  );

  return (
    <ColorModeContext value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <HashRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Overview />} />
              <Route path=":slug" element={<LexiconPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </HashRouter>
      </ThemeProvider>
    </ColorModeContext>
  );
}
