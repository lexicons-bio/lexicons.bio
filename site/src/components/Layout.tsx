import { Link, NavLink, Outlet } from "react-router-dom";
import { Box } from "@mui/material";
import HelixMark from "./HelixMark";
import { palette, fonts } from "../theme";

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

const navLinkStyle: React.CSSProperties = {
  color: palette.inkSoft,
  textDecoration: "none",
  alignSelf: "baseline",
};

export default function Layout() {
  return (
    <>
      <Box
        component="nav"
        sx={{
          maxWidth: 760,
          mx: "auto",
          px: { xs: 2, sm: 3, md: 4 },
          pt: "30px",
          display: "flex",
          alignItems: "baseline",
          flexWrap: "wrap",
          rowGap: "10px",
          columnGap: { xs: "14px", sm: "20px" },
          fontSize: "13.5px",
          color: palette.inkSoft,
        }}
      >
        <Box
          component={Link}
          to="/"
          sx={{
            display: "inline-block",
            lineHeight: 1,
            color: "inherit",
            textDecoration: "none",
            whiteSpace: "nowrap",
          }}
        >
          <Box
            component="span"
            sx={{
              display: "inline-block",
              verticalAlign: "-3px",
              mr: "6px",
            }}
          >
            <HelixMark />
          </Box>
          <Box
            component="span"
            sx={{
              fontFamily: fonts.mono,
              fontSize: "14px",
              color: palette.ink,
              fontWeight: 500,
            }}
          >
            lexicons
          </Box>
          <Box
            component="span"
            sx={{
              fontFamily: fonts.serif,
              fontStyle: "italic",
              fontSize: "17px",
              color: palette.moss,
              fontWeight: 500,
              ml: "1px",
            }}
          >
            .bio
          </Box>
        </Box>

        {navItems.map(({ to, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            style={({ isActive }) => ({
              ...navLinkStyle,
              color: isActive ? palette.ink : palette.inkSoft,
              fontWeight: isActive ? 500 : 400,
            })}
          >
            {label}
          </NavLink>
        ))}

        <Box sx={{ flex: 1, display: { xs: "none", sm: "block" } }} />

        <Box
          component="span"
          sx={{
            fontFamily: fonts.mono,
            fontSize: "11px",
            color: palette.inkFaint,
            ml: { xs: "auto", sm: 0 },
          }}
        >
          v0.1-draft
        </Box>
        <Box
          component="a"
          href="https://github.com/lexicons-bio/lexicons"
          target="_blank"
          rel="noopener"
          sx={{ color: palette.link, textDecoration: "none" }}
        >
          GitHub
        </Box>
      </Box>

      <Box
        component="main"
        sx={{
          maxWidth: 760,
          mx: "auto",
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
          maxWidth: 760,
          mx: "auto",
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
    </>
  );
}
