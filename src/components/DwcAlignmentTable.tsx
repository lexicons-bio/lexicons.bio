import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Link as MuiLink,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import StatusBadge from "./StatusBadge";
import type { DwcTerm } from "../data/dwcTerms";
import type { LexiconProperty } from "../data/lexicons";
import {
  FIELD_TO_DWC,
  ATPROTO_FIELDS,
  GBIF_REQUIRED,
  GBIF_RECOMMENDED,
  typeLabel,
} from "../data/lexicons";

interface Props {
  classes: string[];
  dwcTerms: Record<string, DwcTerm>;
  lexProps: Record<string, LexiconProperty & { required?: boolean }>;
}

export default function DwcAlignmentTable({ classes, dwcTerms, lexProps }: Props) {
  const lexByDwc: Record<string, { fieldName: string; prop: LexiconProperty & { required?: boolean } }> = {};
  const mappedLexFields = new Set<string>();

  for (const [fieldName, prop] of Object.entries(lexProps)) {
    if (ATPROTO_FIELDS.has(fieldName)) continue;
    const dwcName = FIELD_TO_DWC[fieldName] ?? fieldName;
    if (dwcName in dwcTerms) {
      lexByDwc[dwcName] = { fieldName, prop };
      mappedLexFields.add(fieldName);
    }
  }

  const extFields = Object.entries(lexProps).filter(
    ([name]) => !mappedLexFields.has(name) && !ATPROTO_FIELDS.has(name)
  );

  return (
    <>
      {classes.map((cls) => {
        const clsTerms = Object.values(dwcTerms)
          .filter((t) => t.class === cls)
          .sort((a, b) => a.name.localeCompare(b.name));
        if (clsTerms.length === 0) return null;

        const mappedCount = clsTerms.filter((t) => t.name in lexByDwc).length;

        return (
          <Accordion key={cls} variant="outlined" disableGutters defaultExpanded={mappedCount > 0}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" fontWeight={600}>
                {cls}
              </Typography>
              <Typography variant="caption" color="textSecondary" sx={{ ml: 2, alignSelf: "center" }}>
                {mappedCount}/{clsTerms.length} mapped
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>DwC Term</TableCell>
                      <TableCell>Definition</TableCell>
                      <TableCell>Lexicon Field</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {clsTerms.map((term) => {
                      const match = lexByDwc[term.name];
                      return (
                        <TableRow key={term.name}>
                          <TableCell>
                            <MuiLink href={term.term_iri} target="_blank" rel="noopener" variant="caption">
                              {term.name}
                            </MuiLink>
                            {GBIF_REQUIRED.has(term.name) && (
                              <> <StatusBadge status="gbif-req" /></>
                            )}
                            {GBIF_RECOMMENDED.has(term.name) && (
                              <> <StatusBadge status="gbif-rec" /></>
                            )}
                          </TableCell>
                          <TableCell sx={{ color: "text.secondary" }}>
                            {term.definition}
                          </TableCell>
                          <TableCell>
                            {match && (
                              <>
                                <code>{match.fieldName}</code>
                                {match.prop.required && (
                                  <Typography component="span" color="error" fontWeight={600} sx={{ ml: 0.5 }}>*</Typography>
                                )}
                              </>
                            )}
                          </TableCell>
                          <TableCell>
                            {match && (
                              <code style={{ color: "#7c3aed" }}>{typeLabel(match.prop)}</code>
                            )}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={match ? "mapped" : "missing"} />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </AccordionDetails>
          </Accordion>
        );
      })}

      {extFields.length > 0 && (
        <Accordion variant="outlined" disableGutters>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1" fontWeight={600}>
              Lexicon-only
            </Typography>
            <Typography variant="caption" color="textSecondary" sx={{ ml: 2, alignSelf: "center" }}>
              {extFields.length} fields
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 0 }}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>DwC Term</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Lexicon Field</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {extFields
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([fieldName, prop]) => (
                      <TableRow key={fieldName}>
                        <TableCell />
                        <TableCell sx={{ color: "text.secondary" }}>
                          {prop.description ?? ""}
                        </TableCell>
                        <TableCell>
                          <code>{fieldName}</code>
                          {prop.required && (
                            <Typography component="span" color="error" fontWeight={600} sx={{ ml: 0.5 }}>*</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <code style={{ color: "#7c3aed" }}>{typeLabel(prop)}</code>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status="extension" />
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          </AccordionDetails>
        </Accordion>
      )}
    </>
  );
}
