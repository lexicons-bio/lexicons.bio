import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { Box, Drawer } from "@mui/material";
import HelixMark from "./HelixMark";
import { palette, fonts } from "../theme";

const SIDEBAR_WIDTH = 200;

const navItems = [
  { to: "/", label: "Overview", end: true },
  { to: "/occurrence", label: "Occurrence", end: false },
  { to: "/identification", label: "Identification", end: false },
  { to: "/media", label: "Media", end: false },
  { to: "/survey", label: "Survey", end: false },
  { to: "/surveyProtocol", label: "SurveyProtocol", end: false },
  { to: "/surveyTarget", label: "SurveyTarget", end: false },
];

const footerLinks = [
  { href: "https://observ.ing", label: "Observ.ing" },
  { href: "https://atproto.com/", label: "AT Protocol" },
  { href: "https://github.com/gbif/dwc-dp", label: "DwC-DP" },
  { href: "https://www.gbif.org/", label: "GBIF" },
  { href: "https://github.com/lexicons-bio/lexicons", label: "GitHub" },
];

function Logo() {
  return (
    <Box
      component={Link}
      to="/"
      sx={{ display: "flex", "alignItems": "center", textDecoration: "none" }}
    >
      <Box component="span" sx={{ display: "inline-block", mt: "2px", mr: "6px" }}>
        <HelixMark />
      </Box>
      <Box
        component="span"
        sx={{ display: "inline-flex", alignItems: "baseline", color: "inherit" }}
      >
        <Box component="span" sx={{ fontFamily: fonts.mono, fontSize: "14px", color: palette.ink, fontWeight: 500 }}>
          lexicons
        </Box>
        <Box component="span" sx={{ fontFamily: fonts.serif, fontStyle: "italic", fontSize: "17px", color: palette.moss, fontWeight: 500, ml: "1px" }}>
          .bio
        </Box>
      </Box>
    </Box>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Box component="nav" sx={{ display: "flex", flexDirection: "column", gap: "1px" }}>
      {navItems.map(({ to, label, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          style={({ isActive }) => ({
            display: "block",
            padding: "6px 16px 6px 13px",
            textDecoration: "none",
            fontSize: "13.5px",
            color: isActive ? palette.ink : palette.inkSoft,
            fontWeight: isActive ? 500 : 400,
            borderLeft: `3px solid ${isActive ? palette.moss : "transparent"}`,
            transition: "color 0.12s, border-color 0.12s",
          })}
        >
          {label}
        </NavLink>
      ))}
    </Box>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", py: "28px" }}>
      <Box sx={{ px: "16px", mb: "24px" }}>
        <Logo />
      </Box>
      <NavLinks onNavigate={onNavigate} />
      <Box sx={{ flex: 1 }} />
      <Box sx={{ px: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
        <Box sx={{ fontFamily: fonts.mono, fontSize: "11px", color: palette.inkFaint }}>
          v0.1-draft
        </Box>
        <Box
          component="a"
          href="https://github.com/lexicons-bio/lexicons"
          target="_blank"
          rel="noopener"
          sx={{ color: palette.link, textDecoration: "none", fontSize: "13px" }}
        >
          GitHub
        </Box>
      </Box>
    </Box>
  );
}

export default function Layout() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Mobile top bar */}
      <Box
        sx={{
          display: { xs: "flex", md: "none" },
          alignItems: "center",
          px: 2,
          py: 1.5,
          borderBottom: `1px solid ${palette.rule}`,
          background: palette.bg,
        }}
      >
        <Box
          component="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open navigation"
          sx={{
            background: "none",
            border: "none",
            borderRight: `1px solid ${palette.rule}`,
            cursor: "pointer",
            color: palette.inkSoft,
            pl: 0.5,
            pr: "12px",
            py: 0.5,
            mr: "12px",
            display: "flex",
            alignItems: "center",
          }}
        >
          <svg width="20" height="16" viewBox="0 0 20 16" fill="none">
            <rect y="0" width="20" height="2" fill="currentColor" />
            <rect y="7" width="20" height="2" fill="currentColor" />
            <rect y="14" width="20" height="2" fill="currentColor" />
          </svg>
        </Box>
        <Logo />
      </Box>

      {/* Mobile drawer */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: SIDEBAR_WIDTH,
            background: palette.bg,
            borderRight: `1px solid ${palette.rule}`,
          },
        }}
      >
        <SidebarContent onNavigate={() => setDrawerOpen(false)} />
      </Drawer>

      {/* Page body: sidebar + content, centered together */}
      <Box sx={{ display: "flex", flex: 1, justifyContent: "center", alignItems: "flex-start" }}>
        <Box
          component="aside"
          sx={{
            display: { xs: "none", md: "flex" },
            flexShrink: 0,
            width: SIDEBAR_WIDTH,
            flexDirection: "column",
            position: "sticky",
            top: 0,
            height: "100vh",
            overflowY: "auto",
          }}
        >
          <SidebarContent />
        </Box>

        <Box sx={{ flex: 1, maxWidth: 760, minWidth: 0, display: "flex", flexDirection: "column" }}>
          <Box
            component="main"
            sx={{
              flex: 1,
              px: { xs: 2, sm: 3, md: 4 },
              pt: { xs: "32px", sm: "48px" },
              pb: "56px",
            }}
          >
            <Outlet />
          </Box>

          <Box
            component="footer"
            sx={{
              px: { xs: 2, sm: 3, md: 4 },
              pt: 3,
              pb: 6,
              borderTop: `1px solid ${palette.rule}`,
              mt: 4,
              fontSize: "12.5px",
              color: palette.inkFaint,
              display: "flex",
              flexWrap: "wrap",
              rowGap: 1.5,
              columnGap: { xs: 2, sm: 3 },
              alignItems: "baseline",
            }}
          >
            {footerLinks.map(({ href, label }) => (
              <Box
                key={href}
                component="a"
                href={href}
                target="_blank"
                rel="noopener"
                sx={{ color: palette.link, textDecoration: "none" }}
              >
                {label}
              </Box>
            ))}
            <Box sx={{ flex: 1 }} />
            <Box component="span">
              schemas{" "}
              <Box
                component="a"
                href="https://creativecommons.org/publicdomain/zero/1.0/"
                target="_blank"
                rel="noopener"
                sx={{ color: palette.link, textDecoration: "none" }}
              >
                CC0 1.0
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
