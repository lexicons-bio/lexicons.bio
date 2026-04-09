import dwcData from "./dwc-terms.json";

export interface DwcTerm {
  name: string;
  label: string;
  definition: string;
  term_iri: string;
  /** DwC-DP tables this term appears in (e.g. ["Event", "Occurrence"]) */
  tables: string[];
}

export const dwcTerms = dwcData as Record<string, DwcTerm>;
