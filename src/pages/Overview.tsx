import { Box, Typography, Divider, Link as MuiLink } from "@mui/material";
import StatBar from "../components/StatBar";
import LexiconCard from "../components/LexiconCard";
import ArchitectureDiagram from "../components/ArchitectureDiagram";
import { MODELS, ATPROTO_FIELDS, getFlatProperties } from "../data/lexicons";
import { dwcTerms } from "../data/dwcTerms";
import { computeGlobalStats, computeModelStats } from "../data/stats";

export default function Overview() {
  const modelProps = MODELS.map((m) => getFlatProperties(m.lexicon));
  const allClasses = MODELS.flatMap((m) => m.classes);
  const globalStats = computeGlobalStats(dwcTerms, modelProps, allClasses);

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

      <StatBar
        stats={[
          { value: MODELS.length, label: "Lexicons" },
          { value: globalStats.totalFields, label: "Fields" },
          { value: `${globalStats.pct.toFixed(0)}%`, label: "DwC Coverage" },
          { value: globalStats.mapped, label: "Terms Mapped" },
        ]}
      />

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
          const ms = computeModelStats(dwcTerms, props, model.classes);
          const fieldCount = Object.keys(props).filter(
            (f) => !ATPROTO_FIELDS.has(f)
          ).length;
          return (
            <LexiconCard
              key={model.slug}
              nsid={`bio.lexicons.${model.slug}`}
              title={model.name}
              description={model.description}
              meta={`${fieldCount} fields \u00b7 ${ms.pct.toFixed(0)}% DwC coverage`}
              to={`/${model.slug}`}
            />
          );
        })}
      </Box>

      <Divider sx={{ my: 4 }} />

      <Typography variant="h5" gutterBottom>
        Architecture
      </Typography>
      <Typography variant="body2" color="textSecondary" paragraph>
        Records use AT Protocol's <code>strongRef</code> (URI + CID) to create
        immutable links. The occurrence record sits at the center, with
        identifications referencing it.
      </Typography>

      <ArchitectureDiagram />

      <Typography variant="body2" color="textSecondary" paragraph>
        Taxonomy lives in identification records, not occurrences — this enables
        community consensus identification where multiple users can propose IDs
        for the same observation.
      </Typography>

      <Divider sx={{ my: 4 }} />

      <Typography variant="h5" gutterBottom>
        Usage
      </Typography>
      <Typography variant="body2" color="textSecondary" paragraph>
        These lexicons follow the{" "}
        <MuiLink href="https://atproto.com/specs/lexicon" target="_blank" rel="noopener">
          AT Protocol Lexicon
        </MuiLink>{" "}
        schema format. Records are stored in users' personal data servers (PDS)
        under the appropriate collection, referenced by NSID.
      </Typography>

      <Typography variant="h6" gutterBottom>
        Record keys
      </Typography>
      <Typography variant="body2" color="textSecondary" paragraph>
        All records use <code>tid</code> (timestamp-based identifier) as their
        record key, per the{" "}
        <MuiLink href="https://atproto.com/specs/record-key" target="_blank" rel="noopener">
          AT Protocol record key spec
        </MuiLink>
        .
      </Typography>

      <Typography variant="h6" gutterBottom>
        Cross-references
      </Typography>
      <Typography variant="body2" color="textSecondary">
        Records reference each other using <code>com.atproto.repo.strongRef</code>,
        which contains both a URI and CID. The CID ensures you're referencing a
        specific version of the target record.
      </Typography>
    </>
  );
}
