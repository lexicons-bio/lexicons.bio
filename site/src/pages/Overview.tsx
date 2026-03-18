import { Box, Typography, Link as MuiLink } from "@mui/material";
import LexiconCard from "../components/LexiconCard";
import { MODELS, ATPROTO_FIELDS, getFlatProperties } from "../data/lexicons";

export default function Overview() {
  const modelProps = MODELS.map((m) => getFlatProperties(m.lexicon));

  return (
    <>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          lexicons.bio
        </Typography>
        <Typography variant="body2" color="textSecondary">
          AT Protocol lexicons for decentralized biodiversity observation data, aligned with{" "}
          <MuiLink href="https://dwc.tdwg.org/" target="_blank" rel="noopener">
            Darwin Core
          </MuiLink>{" "}
          and{" "}
          <MuiLink href="https://www.gbif.org/" target="_blank" rel="noopener">
            GBIF
          </MuiLink>{" "}
          standards.
        </Typography>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 2,
          my: 3,
        }}
      >
        {MODELS.map((model, idx) => {
          const props = modelProps[idx];
          const fieldCount = Object.keys(props).filter(
            (f) => !ATPROTO_FIELDS.has(f)
          ).length;
          return (
            <LexiconCard
              key={model.slug}
              nsid={`bio.lexicons.${model.slug}`}
              title={model.name}
              description={model.description}
              meta={`${fieldCount} fields`}
              to={`/${model.slug}`}
            />
          );
        })}
      </Box>
    </>
  );
}
