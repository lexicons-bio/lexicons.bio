/**
 * Project policy lint for lexicon schemas.
 *
 * `goat lex lint` checks that schemas are valid atproto Lexicon. This checks
 * the project-specific rules that keep a schema evolvable once it is released
 * (see discussion #47), using `lexicon-policy.json` to record the decisions a
 * schema alone can't express.
 *
 *   node scripts/lint-policy.ts             lint, exit 1 on any finding
 *   node scripts/lint-policy.ts --scaffold  add missing fields to the manifest
 *
 * Every object property must be classified in the manifest. The classification
 * (`kind`) is derived from the schema and must match it, so changing what a
 * field *is* means changing the manifest too, in the same PR diff.
 */

import { readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs";
import { join, relative, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const LEXICON_DIR = join(ROOT, "lexicons");
const MANIFEST_PATH = join(ROOT, "lexicon-policy.json");
const DWC_DP_DIR = join(ROOT, "schemas/dwc-dp");

/**
 * What a field holds, derived from its schema (arrays use their item type).
 *
 * - value     a literal (string, number, date, ...)
 * - external  a bare URI/DID pointing outside this lexicon. Needs a `why`:
 *             the default for external references is an open union.
 * - union     an open union
 * - pinned    a strongRef: "this exact version" of a record
 * - floating  an at-uri: "this record, whatever version"
 * - embedded  an inline object (a ref to a non-record object def)
 * - blob      a blob
 */
type Kind = "value" | "external" | "union" | "pinned" | "floating" | "embedded" | "blob";

interface FieldPolicy {
  kind: Kind;
  /** Darwin Core / Dublin Core / Audubon Core term this field maps to, e.g. "dwc:taxonID". */
  term?: string;
  /** Required for kind "external"; explains why this isn't an open union. */
  why?: string;
}

interface DefPolicy {
  /** Must equal the schema's `required` list exactly. */
  required: string[];
  fields: Record<string, FieldPolicy>;
}

interface Manifest {
  /** Terms that may be mapped even though DwC-DP doesn't include them, with a reason. */
  extraTerms: Record<string, string>;
  defs: Record<string, DefPolicy>;
}

interface Finding {
  rule: string;
  file: string;
  where: string;
  message: string;
}

type Json = Record<string, any>;

// ---------------------------------------------------------------------------
// Inputs

function walkJsonFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    if (e.isDirectory()) return walkJsonFiles(p);
    return e.name.endsWith(".json") ? [p] : [];
  });
}

const TERM_NAMESPACES: Record<string, string> = {
  dwc: "http://rs.tdwg.org/dwc/terms/",
  dcterms: "http://purl.org/dc/terms/",
  dc: "http://purl.org/dc/elements/1.1/",
  ac: "http://rs.tdwg.org/ac/terms/",
};

/** IRIs used by DwC-DP fields, split into ratified and still-pending terms. */
function loadDwcDpTerms(): { ratified: Set<string>; pending: Set<string> } {
  const ratified = new Set<string>();
  const pending = new Set<string>();
  for (const file of walkJsonFiles(DWC_DP_DIR)) {
    for (const field of JSON.parse(readFileSync(file, "utf-8")).fields ?? []) {
      const iri: string | undefined = field["dcterms:isVersionOf"];
      if (!iri) continue;
      const m = iri.match(/term-pending\/(\w+)\/(\w+)$/);
      if (m) pending.add(`${m[1]}:${m[2]}`);
      else ratified.add(iri);
    }
  }
  return { ratified, pending };
}

// ---------------------------------------------------------------------------
// Schema helpers

const STRONG_REF = new Set(["com.atproto.repo.strongRef", "com.atproto.repo.strongRef#main"]);

function kindOf(prop: Json): Kind {
  const t = prop.type === "array" ? prop.items : prop;
  switch (t.type) {
    case "union":
      return "union";
    case "blob":
      return "blob";
    case "ref":
      return STRONG_REF.has(t.ref) ? "pinned" : "embedded";
    case "object":
      return "embedded";
    case "string":
      if (t.format === "at-uri") return "floating";
      if (t.format === "uri" || t.format === "did") return "external";
      return "value";
    default:
      return "value";
  }
}

/** Object defs (record bodies and plain objects) keyed as `nsid#def`, with inline objects as `nsid#def.field`. */
function objectDefs(schema: Json): Array<{ key: string; obj: Json }> {
  const out: Array<{ key: string; obj: Json }> = [];
  const visit = (key: string, obj: Json) => {
    out.push({ key, obj });
    for (const [name, prop] of Object.entries<Json>(obj.properties ?? {})) {
      const t = prop.type === "array" ? prop.items : prop;
      if (t?.type === "object") visit(`${key}.${name}`, t);
    }
  };
  for (const [name, def] of Object.entries<Json>(schema.defs ?? {})) {
    const key = `${schema.id}#${name}`;
    if (def.type === "record") visit(key, def.record);
    else if (def.type === "object") visit(key, def);
  }
  return out;
}

/** Visit every typed node in every def, reporting paths like `nsid#def.field[]`. */
function walkNodes(schema: Json, fn: (node: Json, path: string) => void) {
  const visit = (node: unknown, path: string) => {
    if (!node || typeof node !== "object" || Array.isArray(node)) return;
    const obj = node as Json;
    if (typeof obj.type === "string") fn(obj, path);
    for (const [k, v] of Object.entries(obj)) {
      if (k === "record" || k === "properties") visit(v, path);
      else if (k === "items") visit(v, `${path}[]`);
      else if (obj.type === "object" && k !== "required") continue;
      else visit(v, `${path}.${k}`);
    }
  };
  for (const [name, def] of Object.entries<unknown>(schema.defs ?? {})) visit(def, `${schema.id}#${name}`);
}

function termFromDescription(description: string | undefined): string | undefined {
  return description?.match(/\((?:Darwin|Dublin|Audubon) Core ((?:dwc|dcterms|dc|ac):\w+)\)/)?.[1];
}

// ---------------------------------------------------------------------------
// Rules

function lint(schemas: Array<{ file: string; schema: Json }>, manifest: Manifest): Finding[] {
  const findings: Finding[] = [];
  const dwc = loadDwcDpTerms();
  const seenDefs = new Set<string>();

  for (const { file, schema } of schemas) {
    const report = (rule: string, where: string, message: string) =>
      findings.push({ rule, file, where, message });

    // Rules on every typed node.
    walkNodes(schema, (node, path) => {
      if (node.type === "string" && Array.isArray(node.enum)) {
        report("no-closed-enum", path, "use `knownValues`; values can't be added to a closed `enum` after release");
      }
      if (node.type === "union" && node.closed === true) {
        report("no-closed-union", path, "unions must stay open so variants can be added after release");
      }
      if (
        node.type === "string" &&
        node.maxLength === undefined &&
        node.maxGraphemes === undefined &&
        node.format === undefined &&
        node.enum === undefined &&
        node.const === undefined
      ) {
        report("bounded-string", path, "add `maxLength`; tightening a limit after release is a breaking change");
      }
      if (typeof node.description === "string" && /\bdeprecated\b/i.test(node.description)) {
        report("no-deprecated", path, "deprecated fields must be removed before release; they can never be removed after");
      }
    });

    // Rules on object properties, checked against the manifest.
    for (const { key, obj } of objectDefs(schema)) {
      seenDefs.add(key);
      const policy = manifest.defs[key];
      if (!policy) {
        report("unclassified", key, "def is missing from lexicon-policy.json (run with --scaffold)");
        continue;
      }

      const required = [...(obj.required ?? [])].sort();
      const declared = [...(policy.required ?? [])].sort();
      if (required.join() !== declared.join()) {
        report(
          "required-mismatch",
          key,
          `schema requires [${required.join(", ")}] but manifest declares [${declared.join(", ")}]; required fields can never be dropped`,
        );
      }

      const props: Record<string, Json> = obj.properties ?? {};
      for (const [name, prop] of Object.entries(props)) {
        const where = `${key}.${name}`;
        const field = policy.fields[name];
        const kind = kindOf(prop);

        if (/ID$/.test(name) && kind !== "value" && kind !== "external") {
          report("id-suffix", where, `\`…ID\` is reserved for literal identifiers, but this field is \`${kind}\`; drop the suffix`);
        }

        if (!field) {
          report("unclassified", where, "field is missing from lexicon-policy.json (run with --scaffold)");
          continue;
        }
        if (field.kind !== kind) {
          report("kind-mismatch", where, `manifest says \`${field.kind}\` but schema is \`${kind}\``);
        }
        if (kind === "external" && !field.why?.trim()) {
          report("external-needs-why", where, "bare external reference; make it an open union or record a `why`");
        }
        if (field.why?.trim() === "TODO") {
          report("todo", where, "`why` is still TODO");
        }

        if (field.term) {
          const [prefix, local] = field.term.split(":");
          const ns = TERM_NAMESPACES[prefix];
          if (!ns || !local) {
            report("term-unknown", where, `unrecognized term \`${field.term}\``);
          } else if (dwc.pending.has(field.term)) {
            report("term-pending", where, `\`${field.term}\` is still pending in DwC-DP and may change`);
          } else if (!dwc.ratified.has(ns + local) && !(field.term in manifest.extraTerms)) {
            report("term-unknown", where, `\`${field.term}\` isn't in DwC-DP; add it to \`extraTerms\` with a reason if intended`);
          }
        }
      }

      for (const name of Object.keys(policy.fields)) {
        if (!(name in props)) report("stale-manifest", `${key}.${name}`, "manifest entry has no matching schema field");
      }
    }
  }

  for (const key of Object.keys(manifest.defs)) {
    if (!seenDefs.has(key)) {
      findings.push({ rule: "stale-manifest", file: "lexicon-policy.json", where: key, message: "manifest def has no matching schema def" });
    }
  }
  return findings;
}

// ---------------------------------------------------------------------------
// Scaffold: add unclassified defs/fields with their derived kind. Never edits existing entries.

function scaffold(schemas: Array<{ schema: Json }>, manifest: Manifest): number {
  let added = 0;
  for (const { schema } of schemas) {
    for (const { key, obj } of objectDefs(schema)) {
      const policy = (manifest.defs[key] ??= { required: [...(obj.required ?? [])], fields: {} });
      for (const [name, prop] of Object.entries<Json>(obj.properties ?? {})) {
        if (policy.fields[name]) continue;
        const kind = kindOf(prop);
        const entry: FieldPolicy = { kind };
        const term = termFromDescription(prop.description);
        if (term) entry.term = term;
        if (kind === "external") entry.why = "TODO";
        policy.fields[name] = entry;
        added++;
      }
    }
  }
  return added;
}

// ---------------------------------------------------------------------------

const schemas = walkJsonFiles(LEXICON_DIR).map((file) => ({
  file: relative(ROOT, file),
  schema: JSON.parse(readFileSync(file, "utf-8")) as Json,
}));
const manifest: Manifest = existsSync(MANIFEST_PATH)
  ? JSON.parse(readFileSync(MANIFEST_PATH, "utf-8"))
  : { extraTerms: {}, defs: {} };
manifest.extraTerms ??= {};
manifest.defs ??= {};

if (process.argv.includes("--scaffold")) {
  const added = scaffold(schemas, manifest);
  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n");
  console.log(`Added ${added} field(s) to ${relative(ROOT, MANIFEST_PATH)}. Review each kind, term and why.`);
  process.exit(0);
}

const findings = lint(schemas, manifest);
for (const f of findings) {
  console.log(`${f.file}  [${f.rule}] ${f.where}: ${f.message}`);
}
if (findings.length > 0) {
  console.log(`\n${findings.length} policy finding(s).`);
  process.exit(1);
}
console.log(`Lexicon policy OK (${schemas.length} schemas).`);
