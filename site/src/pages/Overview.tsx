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
        component="table"
        sx={{
          width: "100%",
          borderCollapse: "collapse",
          mb: "36px",
          fontSize: "13.5px",
        }}
      >
        <tbody>
          {MODELS.map((m) => (
            <Box
              key={m.slug}
              component="tr"
              sx={{ borderBottom: `1px solid ${palette.ruleSoft}` }}
            >
              <Box
                component="td"
                sx={{
                  p: "12px 14px 12px 0",
                  verticalAlign: "top",
                  width: 260,
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
                  }}
                >
                  {m.lexicon.id}
                </Box>
              </Box>
              <Box
                component="td"
                sx={{
                  p: "12px 14px",
                  color: palette.inkSoft,
                  verticalAlign: "top",
                }}
              >
                {m.description}
              </Box>
            </Box>
          ))}
        </tbody>
      </Box>

      <SchemaGraph />
    </>
  );
}
