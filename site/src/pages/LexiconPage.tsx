import { useParams, Navigate } from "react-router-dom";
import { Box } from "@mui/material";
import FieldTable from "../components/FieldTable";
import DwcAlignmentTable from "../components/DwcAlignmentTable";
import { MODELS, getFlatProperties, getDefProperties } from "../data/lexicons";
import { dwcTerms } from "../data/dwcTerms";
import { palette, fonts } from "../theme";

export default function LexiconPage() {
  const { slug } = useParams<{ slug: string }>();
  const model = MODELS.find((m) => m.slug === slug);
  if (!model) return <Navigate to="/" replace />;

  const lexProps = getFlatProperties(model.lexicon);

  const mainDef = model.lexicon.defs["main"];
  const { properties: mainProps, required: mainRequired } = getDefProperties(mainDef);
  const mainFields = Object.fromEntries(
    Object.entries(mainProps).map(([k, v]) => [k, { ...v, required: mainRequired.has(k), def: "main" }])
  );

  const otherDefs = Object.entries(model.lexicon.defs).filter(([name]) => name !== "main");
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

      <FieldTable fields={mainFields} dwcTerms={dwcTerms} />

      {otherDefs.map(([defName, defBody]) => {
        const { properties, required } = getDefProperties(defBody);
        const fields = Object.fromEntries(
          Object.entries(properties).map(([k, v]) => [k, { ...v, required: required.has(k), def: defName }])
        );
        return (
          <Box key={defName} sx={{ mb: "36px" }}>
            <Box
              component="h4"
              sx={{
                fontFamily: fonts.mono,
                fontSize: "13px",
                fontWeight: 500,
                color: palette.inkSoft,
                m: "0 0 4px",
              }}
            >
              #{defName}
            </Box>
            {defBody.description && (
              <Box sx={{ fontSize: "13px", color: palette.inkSoft, mb: "12px" }}>
                {defBody.description}
              </Box>
            )}
            <FieldTable fields={fields} dwcTerms={dwcTerms} />
          </Box>
        );
      })}

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
