import { Box } from "@mui/material";
import type { DwcTerm } from "../data/dwcTerms";
import type { LexiconProperty } from "../data/lexicons";
import { FIELD_TO_DWC, ATPROTO_FIELDS } from "../data/lexicons";
import { palette, fonts } from "../theme";

interface Props {
  classes: string[];
  dwcTerms: Record<string, DwcTerm>;
  lexProps: Record<string, LexiconProperty & { required?: boolean }>;
}

interface Row {
  term: string;
  cls: string;
  mapped: boolean;
  iri?: string;
}

export default function DwcAlignmentTable({ classes, dwcTerms, lexProps }: Props) {
  const lexByDwc = new Map<string, string>();
  for (const fieldName of Object.keys(lexProps)) {
    if (ATPROTO_FIELDS.has(fieldName)) continue;
    const dwcName = FIELD_TO_DWC[fieldName] ?? fieldName;
    if (dwcName in dwcTerms) lexByDwc.set(dwcName, fieldName);
  }

  const rows: Row[] = [];
  const seen = new Set<string>();
  for (const cls of classes) {
    const clsTerms = Object.values(dwcTerms)
      .filter((t) => t.tables.includes(cls))
      .sort((a, b) => a.name.localeCompare(b.name));
    for (const t of clsTerms) {
      if (seen.has(t.name)) continue;
      seen.add(t.name);
      rows.push({
        term: t.name,
        cls,
        mapped: lexByDwc.has(t.name),
        iri: t.term_iri,
      });
    }
  }

  return (
    <Box sx={{ fontSize: "12.5px", borderTop: `1px solid ${palette.rule}` }}>
      {rows.map((r) => (
        <Box
          key={r.term}
          sx={{
            borderBottom: `1px solid ${palette.ruleSoft}`,
            display: "flex",
            alignItems: "baseline",
            gap: { xs: "8px", sm: "10px" },
            py: "6px",
          }}
        >
          <Box
            sx={{
              fontFamily: fonts.mono,
              fontSize: "12px",
              color: r.mapped ? palette.ink : palette.warn,
              flex: 1,
              minWidth: 0,
              overflowWrap: "anywhere",
            }}
          >
            {r.iri ? (
              <Box
                component="a"
                href={r.iri}
                target="_blank"
                rel="noopener"
                sx={{ color: "inherit", textDecoration: "none" }}
              >
                {r.term}
              </Box>
            ) : (
              r.term
            )}
          </Box>
          <Box
            sx={{
              fontFamily: fonts.mono,
              fontSize: "11px",
              color: palette.inkFaint,
              display: { xs: "none", sm: "block" },
              flex: "0 0 auto",
            }}
          >
            {r.cls}
          </Box>
          <Box
            sx={{
              fontFamily: fonts.mono,
              fontSize: "11px",
              color: r.mapped ? palette.moss : palette.warn,
              textAlign: "right",
              flex: "0 0 auto",
            }}
          >
            {r.mapped ? "mapped" : "—"}
          </Box>
        </Box>
      ))}
    </Box>
  );
}
