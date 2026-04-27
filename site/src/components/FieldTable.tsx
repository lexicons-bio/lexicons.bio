import { Box } from "@mui/material";
import type { LexiconProperty } from "../data/lexicons";
import { typeLabel, FIELD_TO_DWC, ATPROTO_FIELDS } from "../data/lexicons";
import type { DwcTerm } from "../data/dwcTerms";
import { palette, fonts } from "../theme";

type FlatField = LexiconProperty & { required: boolean; def: string };

interface Props {
  fields: Record<string, FlatField>;
  dwcTerms: Record<string, DwcTerm>;
}

export default function FieldTable({ fields, dwcTerms }: Props) {
  const entries = Object.entries(fields);
  return (
    <Box
      component="table"
      sx={{
        width: "100%",
        borderCollapse: "collapse",
        mb: "36px",
        fontSize: "13px",
      }}
    >
      <tbody>
        {entries.map(([name, prop], i) => {
          const dwcName = FIELD_TO_DWC[name] ?? name;
          const dwcTerm = !ATPROTO_FIELDS.has(name) ? dwcTerms[dwcName] : undefined;
          return (
            <Box
              key={name}
              component="tr"
              sx={{
                borderTop: i === 0 ? `1px solid ${palette.rule}` : "none",
                borderBottom: `1px solid ${palette.ruleSoft}`,
              }}
            >
              <Box
                component="td"
                sx={{
                  fontFamily: fonts.mono,
                  fontSize: "12.5px",
                  p: "10px 12px 10px 0",
                  color: palette.forest,
                  verticalAlign: "top",
                  width: 200,
                }}
              >
                {name}
                {prop.required && (
                  <Box component="span" sx={{ color: palette.warn, ml: "4px" }}>*</Box>
                )}
              </Box>
              <Box
                component="td"
                sx={{ p: "10px 12px", color: palette.inkSoft, verticalAlign: "top" }}
              >
                {prop.description ?? ""}
                <Box
                  sx={{
                    fontFamily: fonts.mono,
                    fontSize: "10.5px",
                    color: palette.inkFaint,
                    mt: "3px",
                  }}
                >
                  {typeLabel(prop)}
                  {dwcTerm && (
                    <>
                      {" · "}
                      <Box
                        component="a"
                        href={dwcTerm.term_iri}
                        target="_blank"
                        rel="noopener"
                        sx={{ color: palette.inkFaint, textDecoration: "none" }}
                      >
                        dwc:{dwcTerm.name}
                      </Box>
                    </>
                  )}
                </Box>
              </Box>
            </Box>
          );
        })}
      </tbody>
    </Box>
  );
}
