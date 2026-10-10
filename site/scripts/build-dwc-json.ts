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
  title?: string;
  description?: string;
  "dcterms:isVersionOf"?: string;
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

/**
 * Runtime-validate the shape of a parsed DwC-DP schema file. JSON.parse
 * returns `any`, so we can't just type-annotate the result — we have to
 * actually inspect it.
 */
function parseDwcDpSchema(value: unknown, source: string): DwcDpSchema {
  if (typeof value !== "object" || value === null) {
    throw new Error(`${source}: expected object at top level`);
  }
  const v = value as Record<string, unknown>;
  if (typeof v.name !== "string") {
    throw new Error(`${source}: missing string \`name\``);
  }
  if (typeof v.title !== "string") {
    throw new Error(`${source}: missing string \`title\``);
  }
  if (!Array.isArray(v.fields)) {
    throw new Error(`${source}: missing array \`fields\``);
  }
  const fields: DwcDpField[] = v.fields.map((raw, i) => {
    if (typeof raw !== "object" || raw === null) {
      throw new Error(`${source}: field[${i}] is not an object`);
    }
    const f = raw as Record<string, unknown>;
    if (typeof f.name !== "string") {
      throw new Error(`${source}: field[${i}] missing string \`name\``);
    }
    const field: DwcDpField = { name: f.name };
    if (typeof f.title === "string") field.title = f.title;
    if (typeof f.description === "string") field.description = f.description;
    if (typeof f["dcterms:isVersionOf"] === "string") {
      field["dcterms:isVersionOf"] = f["dcterms:isVersionOf"];
    }
    return field;
  });
  return { name: v.name, title: v.title, fields };
}

/** Table schemas to include, in display order */
const TABLES = ["event", "occurrence", "identification", "media"];

const terms: Record<string, DwcTerm> = {};

for (const table of TABLES) {
  const path = resolve(SCHEMA_DIR, `${table}.json`);
  const schema = parseDwcDpSchema(
    JSON.parse(readFileSync(path, "utf-8")),
    `${table}.json`
  );

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
      term_iri: field["dcterms:isVersionOf"] ?? "",
      tables: [schema.title],
    };
  }
}

mkdirSync(dirname(OUT_PATH), { recursive: true });
writeFileSync(OUT_PATH, JSON.stringify(terms, null, 2));
console.log(`Wrote ${Object.keys(terms).length} DwC-DP terms to ${OUT_PATH}`);
