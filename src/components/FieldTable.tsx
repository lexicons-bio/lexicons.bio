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
import type { DwcTerm } from "../data/dwcTerms";
import type { LexiconDef } from "../data/lexicons";
import {
  getDefProperties,
  typeLabel,
  constraintsLabel,
  FIELD_TO_DWC,
  ATPROTO_FIELDS,
} from "../data/lexicons";

interface Props {
  defName: string;
  defBody: LexiconDef;
  lexiconId: string;
  dwcTerms: Record<string, DwcTerm>;
  defaultExpanded?: boolean;
}

export default function FieldTable({ defName, defBody, lexiconId, dwcTerms, defaultExpanded = true }: Props) {
  const { properties, required } = getDefProperties(defBody);
  if (Object.keys(properties).length === 0) return null;

  const desc = defBody.description ?? defBody.record?.description ?? "";
  const label = defName === "main" ? lexiconId.split(".").pop()! : defName;
  const fieldCount = Object.keys(properties).length;

  return (
    <Accordion defaultExpanded={defaultExpanded} variant="outlined" disableGutters>
      <AccordionSummary expandIcon={<ExpandMoreIcon />} id={defName}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ fontFamily: "monospace" }}>
          #{defName}
          {defName === "main" && (
            <Typography component="span" color="textSecondary" sx={{ ml: 1 }}>
              ({label})
            </Typography>
          )}
        </Typography>
        <Typography variant="caption" color="textSecondary" sx={{ ml: 2, alignSelf: "center" }}>
          {fieldCount} fields
        </Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 0 }}>
        {desc && (
          <Typography variant="body2" color="textSecondary" sx={{ px: 2, pb: 1 }}>
            {desc}
          </Typography>
        )}

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Field</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Constraints</TableCell>
                <TableCell>DwC</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.entries(properties).map(([fieldName, prop]) => {
                const dwcName = FIELD_TO_DWC[fieldName] ?? fieldName;
                const dwcTerm = !ATPROTO_FIELDS.has(fieldName) ? dwcTerms[dwcName] : undefined;
                const constraints = constraintsLabel(prop);

                return (
                  <TableRow key={fieldName}>
                    <TableCell>
                      <code>{fieldName}</code>
                      {required.has(fieldName) && (
                        <Typography component="span" color="error" fontWeight={600} sx={{ ml: 0.5 }}>*</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <code style={{ color: "#7c3aed" }}>{typeLabel(prop)}</code>
                    </TableCell>
                    <TableCell sx={{ color: "text.secondary" }}>
                      {prop.description ?? ""}
                    </TableCell>
                    <TableCell>
                      {constraints && (
                        <Typography variant="caption" color="textSecondary">{constraints}</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {dwcTerm && (
                        <MuiLink href={dwcTerm.term_iri} target="_blank" rel="noopener" variant="caption">
                          dwc:{dwcTerm.name}
                        </MuiLink>
                      )}
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
}
