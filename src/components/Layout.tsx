import {
  AppBar,
  Toolbar,
  Button,
  Box,
  Link as MuiLink,
  Container,
  Alert,
  Typography,
} from "@mui/material";
import { Link, NavLink, Outlet } from "react-router-dom";

const navItems = [
  { to: "/", label: "Overview" },
  { to: "/occurrence", label: "Occurrence" },
  { to: "/identification", label: "Identification" },
];

const footerLinks = [
  { href: "https://observ.ing", label: "Observ.ing" },
  { href: "https://atproto.com/", label: "AT Protocol" },
  { href: "https://dwc.tdwg.org/", label: "Darwin Core" },
  { href: "https://www.gbif.org/", label: "GBIF" },
  { href: "https://github.com/lexicons-bio/lexicons", label: "GitHub" },
];

export default function Layout() {
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
          sx={{ borderTop: 1, borderColor: "divider", mt: 6, pt: 2, display: "flex", gap: 3, flexWrap: "wrap" }}
        >
          {footerLinks.map(({ href, label }) => (
            <Typography key={href} variant="body2">
              <MuiLink href={href} target="_blank" rel="noopener" color="textSecondary">
                {label}
              </MuiLink>
            </Typography>
          ))}
        </Box>
      </Container>
    </>
  );
}
