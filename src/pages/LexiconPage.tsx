import { useParams, Navigate } from "react-router-dom";
import { Box, Typography, Divider, Link as MuiLink, Stack } from "@mui/material";
import StatBar from "../components/StatBar";
import FieldTable from "../components/FieldTable";
import DwcAlignmentTable from "../components/DwcAlignmentTable";
import { MODELS, ATPROTO_FIELDS, getFlatProperties } from "../data/lexicons";
import { dwcTerms } from "../data/dwcTerms";
import { computeModelStats } from "../data/stats";

export default function LexiconPage() {
  const { slug } = useParams<{ slug: string }>();
  const model = MODELS.find((m) => m.slug === slug);

  if (!model) return <Navigate to="/" replace />;

  const lexProps = getFlatProperties(model.lexicon);
  const stats = computeModelStats(dwcTerms, lexProps, model.classes);
  const lexId = model.lexicon.id;
  const fieldCount = Object.keys(lexProps).filter(
    (f) => !ATPROTO_FIELDS.has(f)
  ).length;

  const defs = model.lexicon.defs;

  return (
    <>
      <Box sx={{ mb: 3 }}>
        <Typography variant="overline" color="secondary">
          {lexId}
        </Typography>
        <Typography variant="h4" gutterBottom>
          {model.name}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {model.description}
        </Typography>
      </Box>

      <StatBar
        stats={[
          { value: fieldCount, label: "Fields" },
          { value: `${stats.pct.toFixed(0)}%`, label: "DwC Coverage" },
          { value: stats.mapped, label: "Mapped" },
          { value: stats.missing, label: "Missing" },
        ]}
      />

      <Typography variant="h5" gutterBottom>
        Lexicon Reference
      </Typography>

      <Stack spacing={1} sx={{ mb: 4 }}>
        {Object.entries(defs).map(([defName, defBody]) => (
          <FieldTable
            key={defName}
            defName={defName}
            defBody={defBody}
            lexiconId={lexId}
            dwcTerms={dwcTerms}
          />
        ))}
      </Stack>

      <Divider sx={{ my: 4 }} />

      <Typography variant="h5" gutterBottom>
        Darwin Core Alignment
      </Typography>
      <Typography variant="body2" color="textSecondary" gutterBottom>
        Cross-reference against{" "}
        <MuiLink href="https://dwc.tdwg.org/terms/" target="_blank" rel="noopener">
          Darwin Core
        </MuiLink>{" "}
        terms. Green = mapped, red = not yet implemented.
      </Typography>

      <Stack spacing={1}>
        <DwcAlignmentTable
          classes={model.classes}
          dwcTerms={dwcTerms}
          lexProps={lexProps}
        />
      </Stack>
    </>
  );
}
