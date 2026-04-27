import { Box } from "@mui/material";
import { Link } from "react-router-dom";
import SchemaGraph from "../components/SchemaGraph";
import { MODELS } from "../data/lexicons";
import { palette, fonts } from "../theme";

export default function Overview() {
  return (
    <>
      <Box
        component="p"
        sx={{
          color: palette.inkSoft,
          fontSize: "15.5px",
          maxWidth: 660,
          m: 0,
          mb: "28px",
        }}
      >
        AT Protocol record schemas for biodiversity observations, aligned with{" "}
        <Box component="a" href="https://github.com/gbif/dwc-dp" target="_blank" rel="noopener" sx={{ color: palette.link }}>
          DwC-DP
        </Box>
        . Three records:{" "}
        <Box component="span" sx={{ fontFamily: fonts.mono }}>occurrence</Box>,{" "}
        <Box component="span" sx={{ fontFamily: fonts.mono }}>identification</Box>,{" "}
        <Box component="span" sx={{ fontFamily: fonts.mono }}>media</Box>. Cross-record links use{" "}
        <Box component="span" sx={{ fontFamily: fonts.mono }}>com.atproto.repo.strongRef</Box>.
      </Box>

      <Box
        sx={{
          mb: "36px",
          fontSize: "13.5px",
        }}
      >
        {MODELS.map((m) => (
          <Box
            key={m.slug}
            sx={{
              borderBottom: `1px solid ${palette.ruleSoft}`,
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              alignItems: { sm: "flex-start" },
              gap: { xs: "4px", sm: "14px" },
              py: "12px",
            }}
          >
            <Box
              component={Link}
              to={`/${m.slug}`}
              sx={{
                fontFamily: fonts.mono,
                fontSize: "12.5px",
                color: palette.link,
                textDecoration: "none",
                flex: { sm: "0 0 260px" },
                overflowWrap: "anywhere",
              }}
            >
              {m.lexicon.id}
            </Box>
            <Box sx={{ color: palette.inkSoft, flex: 1 }}>{m.description}</Box>
          </Box>
        ))}
      </Box>

      <SchemaGraph />
    </>
  );
}
