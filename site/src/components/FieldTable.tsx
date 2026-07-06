import { Box } from "@mui/material";
import type { LexiconProperty } from "../data/lexicons";
import {
  typeLabel,
  FIELD_TO_DWC,
  ATPROTO_FIELDS,
  refsOf,
  resolveRef,
  getDefProperties,
} from "../data/lexicons";
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
      sx={{
        mb: "36px",
        fontSize: "13px",
        borderTop: `1px solid ${palette.rule}`,
      }}
    >
      {entries.map(([name, prop]) => {
        const dwcName = FIELD_TO_DWC[name] ?? name;
        const dwcTerm = !ATPROTO_FIELDS.has(name) ? dwcTerms[dwcName] : undefined;
        return (
          <Box
            key={name}
            sx={{
              borderBottom: `1px solid ${palette.ruleSoft}`,
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              alignItems: { sm: "flex-start" },
              gap: { xs: "2px", sm: "12px" },
              py: "10px",
            }}
          >
            <Box
              sx={{
                fontFamily: fonts.mono,
                fontSize: "12.5px",
                color: palette.forest,
                flex: { sm: "0 0 200px" },
                overflowWrap: "anywhere",
              }}
            >
              {name}
              {prop.required && (
                <Box component="span" sx={{ color: palette.warn, ml: "4px" }}>*</Box>
              )}
            </Box>
            <Box sx={{ color: palette.inkSoft, flex: 1, minWidth: 0 }}>
              {prop.description ?? ""}
              <Box
                sx={{
                  fontFamily: fonts.mono,
                  fontSize: "10.5px",
                  color: palette.inkFaint,
                  mt: "3px",
                  wordBreak: "break-word",
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
              {prop.knownValues && (
                <Box
                  sx={{
                    fontFamily: fonts.mono,
                    fontSize: "10.5px",
                    color: palette.inkFaint,
                    mt: "3px",
                    wordBreak: "break-word",
                  }}
                >
                  <strong>{"Known values: "}</strong>
                  {prop.knownValues.join(", ")}
                </Box>
              )}
              {refsOf(prop)
                .map((ref) => ({ ref, def: resolveRef(ref) }))
                .filter((r) => r.def)
                .map(({ ref, def }) => {
                  const refName = ref.includes("#")
                    ? ref.split("#").pop()!
                    : ref;
                  const { properties, required } = getDefProperties(def!);
                  return (
                    <Box
                      key={ref}
                      sx={{
                        mt: "8px",
                        pl: "12px",
                        borderLeft: `2px solid ${palette.ruleSoft}`,
                      }}
                    >
                      <Box
                        sx={{
                          fontFamily: fonts.mono,
                          fontSize: "10.5px",
                          color: palette.inkFaint,
                          mb: "4px",
                        }}
                      >
                        {refName}
                      </Box>
                      {Object.entries(properties).map(([subName, subProp]) => (
                        <Box
                          key={subName}
                          sx={{
                            display: "flex",
                            flexDirection: { xs: "column", sm: "row" },
                            gap: { xs: "1px", sm: "10px" },
                            py: "4px",
                          }}
                        >
                          <Box
                            sx={{
                              fontFamily: fonts.mono,
                              fontSize: "11.5px",
                              color: palette.forest,
                              flex: { sm: "0 0 150px" },
                              overflowWrap: "anywhere",
                            }}
                          >
                            {subName}
                            {required.has(subName) && (
                              <Box
                                component="span"
                                sx={{ color: palette.warn, ml: "4px" }}
                              >
                                *
                              </Box>
                            )}
                          </Box>
                          <Box sx={{ flex: 1, minWidth: 0, fontSize: "12.5px" }}>
                            {subProp.description ?? ""}
                            <Box
                              sx={{
                                fontFamily: fonts.mono,
                                fontSize: "10px",
                                color: palette.inkFaint,
                                mt: "2px",
                                wordBreak: "break-word",
                              }}
                            >
                              {typeLabel(subProp)}
                            </Box>
                            {subProp.knownValues && (
                              <Box
                                sx={{
                                  fontFamily: fonts.mono,
                                  fontSize: "10px",
                                  color: palette.inkFaint,
                                  mt: "2px",
                                  wordBreak: "break-word",
                                }}
                              >
                                <strong>{"Known values: "}</strong>
                                {subProp.knownValues.join(", ")}
                              </Box>
                            )}
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  );
                })}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
