import { useContext } from "react";
import {
  AppBar,
  Toolbar,
  Button,
  Box,
  Link as MuiLink,
  Container,
  Alert,
  Typography,
  IconButton,
} from "@mui/material";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import SettingsBrightnessIcon from "@mui/icons-material/SettingsBrightness";
import { Link, NavLink, Outlet } from "react-router-dom";
import { ColorModeContext } from "../App";

const navItems = [
  { to: "/", label: "Overview" },
  { to: "/occurrence", label: "Occurrence" },
  { to: "/identification", label: "Identification" },
  { to: "/media", label: "Media" },
];

const footerLinks = [
  { href: "https://observ.ing", label: "Observ.ing" },
  { href: "https://atproto.com/", label: "AT Protocol" },
  { href: "https://dwc.tdwg.org/", label: "Darwin Core" },
  { href: "https://www.gbif.org/", label: "GBIF" },
  { href: "https://github.com/lexicons-bio/lexicons", label: "GitHub" },
];

export default function Layout() {
  const { pref, cycle } = useContext(ColorModeContext);

  return (
    <>
      <AppBar position="sticky" elevation={0} color="default">
        <Toolbar variant="dense" sx={{ maxWidth: 960, width: "100%", mx: "auto" }}>
          <Button
            component={Link}
            to="/"
            color="primary"
            startIcon={<img src="/logo.svg" alt="" width={20} height={20} />}
            sx={{ textTransform: "none", fontWeight: 700, mr: 2 }}
          >
            lexicons.bio
          </Button>

          {navItems.map(({ to, label }) => (
            <Button
              key={to}
              component={NavLink}
              to={to}
              end={to === "/"}
              size="small"
              sx={{
                textTransform: "none",
                color: "text.secondary",
                "&.active": { color: "primary.main", fontWeight: 600 },
              }}
            >
              {label}
            </Button>
          ))}

          <Box sx={{ flex: 1 }} />

          <IconButton
            size="small"
            onClick={cycle}
            color="inherit"
            sx={{ mr: 1 }}
            title={pref === "system" ? "Theme: System" : pref === "light" ? "Theme: Light" : "Theme: Dark"}
          >
            {pref === "light" ? <LightModeIcon fontSize="small" /> : pref === "dark" ? <DarkModeIcon fontSize="small" /> : <SettingsBrightnessIcon fontSize="small" />}
          </IconButton>

          <MuiLink
            href="https://github.com/lexicons-bio/lexicons"
            target="_blank"
            rel="noopener"
            variant="body2"
            color="textSecondary"
          >
            GitHub
          </MuiLink>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          These lexicons are early drafts under active development. Field names, types, and
          structure may change without notice.
        </Alert>

        <Outlet />

        <Box
          component="footer"
          sx={{ borderTop: 1, borderColor: "divider", mt: 6, pt: 2 }}
        >
          <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap", mb: 1 }}>
            {footerLinks.map(({ href, label }) => (
              <Typography key={href} variant="body2">
                <MuiLink href={href} target="_blank" rel="noopener" color="textSecondary">
                  {label}
                </MuiLink>
              </Typography>
            ))}
          </Box>
          <Typography variant="caption" color="textSecondary">
            Lexicon schemas licensed under{" "}
            <MuiLink href="https://creativecommons.org/publicdomain/zero/1.0/" target="_blank" rel="noopener">
              CC0 1.0 Universal
            </MuiLink>
          </Typography>
        </Box>
      </Container>
    </>
  );
}
