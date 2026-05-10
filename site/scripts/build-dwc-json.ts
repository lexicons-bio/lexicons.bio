/**
 * Converts DwC-DP table schemas into a JSON file
 * that the React app can import at build time.
 *
 * Source: https://github.com/gbif/dwc-dp (v0.1)
 *
 * Run: npx tsx scripts/build-dwc-json.ts
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SITE_ROOT = resolve(__dirname, "..");
const REPO_ROOT = resolve(SITE_ROOT, "..");
const SCHEMA_DIR = resolve(REPO_ROOT, "schemas/dwc-dp");
const OUT_PATH = resolve(SITE_ROOT, "src/data/dwc-terms.json");

interface DwcDpField {
  name: string;
  title: string;
  description: string;
  "dcterms:isVersionOf"?: string;
  [key: string]: unknown;
}

interface DwcDpSchema {
  name: string;
  title: string;
  fields: DwcDpField[];
}

interface DwcTerm {
  name: string;
  label: string;
  definition: string;
  term_iri: string;
  tables: string[];
}

/** Table schemas to include, in display order */
const TABLES = ["event", "occurrence", "identification", "media", "survey", "survey-protocol", "survey-target", "protocol"];

const terms: Record<string, DwcTerm> = {};

for (const table of TABLES) {
  const path = resolve(SCHEMA_DIR, `${table}.json`);
  const schema: DwcDpSchema = JSON.parse(readFileSync(path, "utf-8"));

  for (const field of schema.fields) {
    const name = field.name;
    const existing = terms[name];

    if (existing) {
      // Term already seen in another table — add this table
      if (!existing.tables.includes(schema.title)) {
        existing.tables.push(schema.title);
      }
      continue;
    }

    terms[name] = {
      name,
      label: field.title ?? name,
      definition: field.description ?? "",
      term_iri: (field["dcterms:isVersionOf"] as string) ?? "",
      tables: [schema.title],
    };
  }
}

mkdirSync(dirname(OUT_PATH), { recursive: true });
writeFileSync(OUT_PATH, JSON.stringify(terms, null, 2));
console.log(`Wrote ${Object.keys(terms).length} DwC-DP terms to ${OUT_PATH}`);
