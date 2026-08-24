import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { theme } from "./theme";
import Layout from "./components/Layout";
import Overview from "./pages/Overview";
import LexiconPage from "./pages/LexiconPage";
import Occurrences from "./pages/Occurrences";

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Overview />} />
            {/* Static path, so it outranks the :slug lexicon route below. */}
            <Route path="records" element={<Occurrences />} />
            <Route path=":slug" element={<LexiconPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </ThemeProvider>
  );
}
