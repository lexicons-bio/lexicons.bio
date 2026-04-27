import { useParams, Navigate } from "react-router-dom";
import { Box } from "@mui/material";
import FieldTable from "../components/FieldTable";
import DwcAlignmentTable from "../components/DwcAlignmentTable";
import { MODELS, getFlatProperties } from "../data/lexicons";
import { dwcTerms } from "../data/dwcTerms";
import { palette, fonts } from "../theme";

export default function LexiconPage() {
  const { slug } = useParams<{ slug: string }>();
  const model = MODELS.find((m) => m.slug === slug);
  if (!model) return <Navigate to="/" replace />;

  const lexProps = getFlatProperties(model.lexicon);
  const lexId = model.lexicon.id;
  const lastDot = lexId.lastIndexOf(".");
  const nsidPrefix = lexId.slice(0, lastDot + 1);
  const nsidName = lexId.slice(lastDot + 1);

  return (
    <>
      <Box
        component="h2"
        sx={{
          fontFamily: fonts.serif,
          fontSize: { xs: "20px", sm: "24px" },
          fontWeight: 600,
          letterSpacing: "-0.005em",
          m: "0 0 6px",
          color: palette.ink,
          borderTop: `1px solid ${palette.rule}`,
          pt: "32px",
          mt: 0,
          overflowWrap: "anywhere",
        }}
      >
        <Box
          component="span"
          sx={{
            fontFamily: fonts.mono,
            fontSize: "14px",
            color: palette.inkFaint,
            fontWeight: 400,
          }}
        >
          {nsidPrefix}
        </Box>
        <Box component="span" sx={{ fontFamily: fonts.mono }}>
          {nsidName}
        </Box>
      </Box>

      <Box
        component="p"
        sx={{
          color: palette.inkSoft,
          fontSize: "14.5px",
          m: "0 0 24px",
          maxWidth: 660,
        }}
      >
        {model.description}
      </Box>

      <FieldTable fields={lexProps} dwcTerms={dwcTerms} />

      <Box
        component="pre"
        sx={{
          fontFamily: fonts.mono,
          fontSize: "11.5px",
          background: palette.bgPanel,
          p: "14px",
          m: "0 0 36px",
          overflow: "auto",
          color: palette.ink,
          lineHeight: 1.65,
          border: "none",
        }}
      >
        {model.fullExample}
      </Box>

      <Box
        component="h3"
        sx={{
          fontFamily: fonts.serif,
          fontSize: "16px",
          fontWeight: 600,
          m: "0 0 8px",
          color: palette.inkSoft,
        }}
      >
        DwC-DP alignment
      </Box>

      <DwcAlignmentTable
        classes={model.classes}
        dwcTerms={dwcTerms}
        lexProps={lexProps}
      />
    </>
  );
}
