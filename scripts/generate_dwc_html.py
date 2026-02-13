#!/usr/bin/env python3
"""Generate a multi-page static site documenting lexicons.bio lexicons and Darwin Core alignment.

Reads the AT Protocol lexicon JSON files and TDWG term_versions.csv,
then produces a set of HTML pages in docs/:
  - index.html        — Overview, architecture, and quick links
  - occurrence.html   — Occurrence lexicon reference + DwC alignment
  - identification.html — Identification lexicon reference + DwC alignment
"""

import csv
import json
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DWC_CSV = ROOT / "schemas" / "dwc" / "term_versions.csv"
OUTPUT_DIR = ROOT / "docs"

# Lexicon paths and which DwC classes they cover
MODELS = [
    {
        "name": "Occurrence",
        "slug": "occurrence",
        "lexicon": ROOT / "lexicons" / "bio" / "lexicons" / "occurrence.json",
        "classes": ["Occurrence", "Event", "Location", "Record-level"],
        "description": "A biodiversity observation — an organism at a place and time.",
    },
    {
        "name": "Identification",
        "slug": "identification",
        "lexicon": ROOT / "lexicons" / "bio" / "lexicons" / "identification.json",
        "classes": ["Identification", "Taxon"],
        "description": "A taxonomic determination for an observation.",
    },
]

# Lexicon field -> DwC term_localName (when names differ)
FIELD_TO_DWC = {
    "notes": "occurrenceRemarks",
    "comment": "identificationRemarks",
    "blobs": "associatedMedia",
    "recordedBy": "recordedBy",
}

# Fields that are AT Protocol infrastructure (no DwC mapping)
ATPROTO_FIELDS = {
    "subject", "subjectIndex", "isAgreement", "confidence", "taxonId",
    "taxon", "location", "image", "alt", "aspectRatio", "width", "height",
}

# GBIF publishing requirements
GBIF_REQUIRED = {"occurrenceID", "basisOfRecord", "scientificName", "eventDate"}
GBIF_RECOMMENDED = {
    "taxonRank", "kingdom", "decimalLatitude", "decimalLongitude",
    "geodeticDatum", "countryCode", "individualCount",
}


# --- Data loading ---

def load_dwc_terms(csv_path: Path) -> dict[str, dict]:
    terms = {}
    with open(csv_path, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            if row["status"] != "recommended":
                continue
            if "Class" in row["rdf_type"]:
                continue
            if "UseWithIRI" in row.get("organized_in", ""):
                continue
            name = row["term_localName"]
            if name not in terms:
                terms[name] = {
                    "name": name,
                    "label": row["label"],
                    "definition": row["definition"],
                    "term_iri": row["term_iri"],
                    "class": extract_class(row["organized_in"]),
                }
    return terms


def extract_class(organized_in: str) -> str:
    if not organized_in:
        return "Record-level"
    last = organized_in.rstrip("/").split("/")[-1]
    if last in ("1.1", "terms"):
        return "Record-level"
    return last


def load_lexicon(lexicon_path: Path) -> dict:
    with open(lexicon_path, encoding="utf-8") as f:
        return json.load(f)


def get_def_properties(def_body: dict) -> tuple[dict, set]:
    props = def_body.get("properties", {})
    required = set(def_body.get("required", []))
    if not props:
        record = def_body.get("record", {})
        props = record.get("properties", {})
        required = set(record.get("required", []))
    return props, required


def load_lexicon_properties_flat(lexicon_path: Path) -> dict[str, dict]:
    lex = load_lexicon(lexicon_path)
    result = {}
    for def_name, def_body in lex.get("defs", {}).items():
        props, required = get_def_properties(def_body)
        for field_name, field_meta in props.items():
            result[field_name] = {
                **field_meta,
                "required": field_name in required,
                "def": def_name,
            }
    return result


def type_label(prop: dict) -> str:
    t = prop.get("type", "")
    fmt = prop.get("format", "")
    if t == "ref":
        ref = prop.get("ref", "")
        if ref.startswith("#"):
            return ref
        return ref.split(".")[-1] if "." in ref else "ref"
    if t == "array":
        items = prop.get("items", {})
        inner = items.get("type", "")
        if inner == "ref":
            ref = items.get("ref", "")
            if ref.startswith("#"):
                return f"{ref}[]"
            return f"{ref.split('.')[-1]}[]" if "." in ref else "ref[]"
        return f"{inner}[]" if inner else "array"
    if fmt:
        return fmt
    return t


def constraints_label(prop: dict) -> str:
    parts = []
    if "maxLength" in prop:
        parts.append(f"max {prop['maxLength']}")
    if "minimum" in prop:
        parts.append(f"min {prop['minimum']}")
    if "maximum" in prop:
        parts.append(f"max {prop['maximum']}")
    if "default" in prop:
        parts.append(f"default: {prop['default']}")
    if "knownValues" in prop:
        vals = prop["knownValues"]
        if len(vals) <= 4:
            parts.append(" | ".join(str(v) for v in vals))
        else:
            parts.append(f"{len(vals)} values")
    return ", ".join(parts)


def dwc_term_for_field(field_name: str, dwc_terms: dict) -> dict | None:
    dwc_name = FIELD_TO_DWC.get(field_name, field_name)
    return dwc_terms.get(dwc_name)


# --- Compute stats ---

def compute_model_stats(dwc_terms: dict, lex_props: dict, classes: list[str]) -> dict:
    """Compute DwC coverage stats for one model."""
    lex_by_dwc = set()
    for field_name in lex_props:
        if field_name in ATPROTO_FIELDS:
            continue
        dwc_name = FIELD_TO_DWC.get(field_name, field_name)
        if dwc_name in dwc_terms:
            lex_by_dwc.add(dwc_name)

    relevant = [t for t in dwc_terms.values() if t["class"] in set(classes)]
    mapped = sum(1 for t in relevant if t["name"] in lex_by_dwc)
    total = len(relevant)
    pct = (mapped / total * 100) if total else 0
    return {"mapped": mapped, "total": total, "missing": total - mapped, "pct": pct}


def compute_global_stats(dwc_terms: dict, model_props_list: list[dict]) -> dict:
    all_props = {}
    for props in model_props_list:
        all_props.update(props)

    all_classes = set()
    for m in MODELS:
        all_classes.update(m["classes"])

    relevant = [t for t in dwc_terms.values() if t["class"] in all_classes]
    mapped_names = set()
    for field_name in all_props:
        if field_name in ATPROTO_FIELDS:
            continue
        dwc_name = FIELD_TO_DWC.get(field_name, field_name)
        if dwc_name in dwc_terms:
            mapped_names.add(dwc_name)

    mapped = sum(1 for t in relevant if t["name"] in mapped_names)
    total = len(relevant)
    total_fields = sum(
        len([f for f in p if f not in ATPROTO_FIELDS]) for p in model_props_list
    )
    return {
        "mapped": mapped,
        "total": total,
        "missing": total - mapped,
        "pct": (mapped / total * 100) if total else 0,
        "total_fields": total_fields,
    }


# --- CSS ---

CSS = """\
:root {
  --c-bg: #ffffff;
  --c-bg-subtle: #f8fafc;
  --c-border: #e2e8f0;
  --c-border-light: #f1f5f9;
  --c-text: #0f172a;
  --c-text-secondary: #64748b;
  --c-text-muted: #94a3b8;
  --c-primary: #0f766e;
  --c-primary-light: #ccfbf1;
  --c-accent: #0d9488;
  --c-mapped-bg: #dcfce7;
  --c-mapped-text: #166534;
  --c-missing-bg: #fef2f2;
  --c-missing-text: #991b1b;
  --c-ext-bg: #eff6ff;
  --c-ext-text: #1e40af;
  --c-gbif-req-bg: #fef3c7;
  --c-gbif-req-text: #92400e;
  --c-gbif-rec-bg: #f1f5f9;
  --c-gbif-rec-text: #475569;
  --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
  --font-mono: "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, monospace;
  --max-w: 960px;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: var(--font-sans);
  color: var(--c-text);
  background: var(--c-bg);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}

/* Nav */
nav {
  border-bottom: 1px solid var(--c-border);
  background: var(--c-bg);
  position: sticky;
  top: 0;
  z-index: 10;
}
.nav-inner {
  max-width: var(--max-w);
  margin: 0 auto;
  padding: 0 1.5rem;
  display: flex;
  align-items: center;
  height: 3.25rem;
  gap: 2rem;
}
.nav-brand {
  font-weight: 700;
  font-size: 0.95rem;
  color: var(--c-primary);
  text-decoration: none;
  letter-spacing: -0.02em;
}
.nav-links { display: flex; gap: 0.25rem; }
.nav-links a {
  font-size: 0.85rem;
  color: var(--c-text-secondary);
  text-decoration: none;
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  transition: background 0.15s, color 0.15s;
}
.nav-links a:hover { background: var(--c-bg-subtle); color: var(--c-text); }
.nav-links a.active { background: var(--c-primary-light); color: var(--c-primary); font-weight: 500; }
.nav-ext {
  margin-left: auto;
  font-size: 0.8rem;
  color: var(--c-text-muted);
  text-decoration: none;
}
.nav-ext:hover { color: var(--c-text-secondary); }

/* Content */
.content {
  max-width: var(--max-w);
  margin: 0 auto;
  padding: 2rem 1.5rem 4rem;
}

/* Page header */
.page-header { margin-bottom: 2rem; }
.page-title {
  font-size: 1.75rem;
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.2;
  margin-bottom: 0.5rem;
}
.page-subtitle {
  color: var(--c-text-secondary);
  font-size: 1rem;
  line-height: 1.5;
}
.nsid {
  font-family: var(--font-mono);
  font-size: 0.85rem;
  color: var(--c-accent);
  margin-bottom: 0.25rem;
}

/* Stats bar */
.stats {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}
.stat {
  background: var(--c-bg-subtle);
  border: 1px solid var(--c-border-light);
  border-radius: 10px;
  padding: 0.875rem 1.25rem;
  min-width: 120px;
}
.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--c-text);
}
.stat-label {
  font-size: 0.75rem;
  color: var(--c-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-top: 0.125rem;
}

/* Cards */
.cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem; margin: 1.5rem 0; }
.card {
  border: 1px solid var(--c-border);
  border-radius: 12px;
  padding: 1.5rem;
  text-decoration: none;
  color: inherit;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.card:hover {
  border-color: var(--c-accent);
  box-shadow: 0 2px 12px rgba(15, 118, 110, 0.08);
}
.card-nsid {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  color: var(--c-accent);
  margin-bottom: 0.375rem;
}
.card-title { font-weight: 600; font-size: 1.1rem; margin-bottom: 0.375rem; }
.card-desc { font-size: 0.875rem; color: var(--c-text-secondary); line-height: 1.5; margin-bottom: 0.75rem; }
.card-meta { font-size: 0.75rem; color: var(--c-text-muted); }

/* Sections */
h2 {
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin: 2.5rem 0 0.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--c-border);
}
h2:first-child { margin-top: 0; }
h3 {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--c-text);
  margin: 1.75rem 0 0.5rem;
}
h3 .muted { color: var(--c-text-muted); font-weight: 400; }

.section-desc {
  font-size: 0.9rem;
  color: var(--c-text-secondary);
  margin-bottom: 1rem;
  line-height: 1.5;
}

/* Tables */
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8125rem;
  margin-bottom: 0.5rem;
}
thead th {
  text-align: left;
  padding: 0.625rem 0.75rem;
  border-bottom: 2px solid var(--c-border);
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--c-text-secondary);
  white-space: nowrap;
}
td {
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid var(--c-border-light);
  vertical-align: top;
  line-height: 1.5;
}
tr:last-child td { border-bottom: none; }
tbody tr:hover { background: var(--c-bg-subtle); }

.def-col { color: var(--c-text-secondary); }

/* Field styling */
.field {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  white-space: nowrap;
}
.type {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: #7c3aed;
}
.constraints {
  font-size: 0.75rem;
  color: var(--c-text-muted);
}
.req { color: #dc2626; font-weight: 600; margin-left: 0.125rem; }

/* Links */
a.dwc-link {
  color: var(--c-primary);
  text-decoration: none;
  font-size: 0.8rem;
}
a.dwc-link:hover { text-decoration: underline; }

/* Badges */
.badge {
  display: inline-block;
  font-size: 0.65rem;
  font-weight: 600;
  padding: 0.125rem 0.5rem;
  border-radius: 10px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.badge-mapped { background: var(--c-mapped-bg); color: var(--c-mapped-text); }
.badge-missing { background: var(--c-missing-bg); color: var(--c-missing-text); }
.badge-ext { background: var(--c-ext-bg); color: var(--c-ext-text); }
.badge-gbif-req { background: var(--c-gbif-req-bg); color: var(--c-gbif-req-text); font-size: 0.6rem; }
.badge-gbif-rec { background: var(--c-gbif-rec-bg); color: var(--c-gbif-rec-text); font-size: 0.6rem; }

/* Diagram */
.diagram {
  background: var(--c-bg-subtle);
  border: 1px solid var(--c-border-light);
  border-radius: 10px;
  padding: 1.5rem 2rem;
  font-family: var(--font-mono);
  font-size: 0.8rem;
  line-height: 1.7;
  overflow-x: auto;
  margin: 1rem 0 1.5rem;
  white-space: pre;
  color: var(--c-text-secondary);
}
.diagram strong { color: var(--c-text); font-weight: 600; }
.diagram a { color: var(--c-accent); text-decoration: none; }
.diagram a:hover { text-decoration: underline; }

/* Section divider */
.divider {
  border: none;
  border-top: 1px solid var(--c-border);
  margin: 2.5rem 0;
}

/* Footer */
footer {
  border-top: 1px solid var(--c-border);
  margin-top: 3rem;
  padding-top: 1.5rem;
  font-size: 0.8rem;
  color: var(--c-text-muted);
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
}
footer a { color: var(--c-text-secondary); text-decoration: none; }
footer a:hover { color: var(--c-text); }

/* Inline code */
code {
  font-family: var(--font-mono);
  font-size: 0.85em;
  background: var(--c-bg-subtle);
  border: 1px solid var(--c-border-light);
  border-radius: 4px;
  padding: 0.125em 0.375em;
}

/* Responsive */
@media (max-width: 640px) {
  .nav-inner { padding: 0 1rem; gap: 1rem; }
  .content { padding: 1.5rem 1rem 3rem; }
  .page-title { font-size: 1.35rem; }
  .cards { grid-template-columns: 1fr; }
  table { font-size: 0.75rem; }
  td, th { padding: 0.375rem 0.5rem; }
  .stat { min-width: 100px; padding: 0.625rem 1rem; }
}
"""


# --- HTML helpers ---

def badge(status: str) -> str:
    cls = {"mapped": "badge-mapped", "missing": "badge-missing", "extension": "badge-ext"}
    return f'<span class="badge {cls[status]}">{status}</span>'


def nav_html(active: str = "") -> str:
    links = [
        ("index.html", "Overview"),
        ("occurrence.html", "Occurrence"),
        ("identification.html", "Identification"),
    ]
    nav_links = ""
    for href, label in links:
        cls = ' class="active"' if label.lower() == active.lower() else ""
        nav_links += f'<a href="{href}"{cls}>{label}</a>'

    return f"""<nav>
<div class="nav-inner">
<a href="index.html" class="nav-brand">lexicons.bio</a>
<div class="nav-links">{nav_links}</div>
<a href="https://github.com/lexicons-bio/lexicons" class="nav-ext">GitHub &nearr;</a>
</div>
</nav>"""


def footer_html() -> str:
    return """<footer>
<a href="https://observ.ing">Observ.ing</a>
<a href="https://atproto.com/">AT Protocol</a>
<a href="https://dwc.tdwg.org/">Darwin Core</a>
<a href="https://www.gbif.org/">GBIF</a>
<a href="https://github.com/lexicons-bio/lexicons">GitHub</a>
</footer>"""


def page_html(title: str, active: str, body: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{escape(title)}</title>
<style>{CSS}</style>
</head>
<body>
{nav_html(active)}
<div class="content">
{body}
{footer_html()}
</div>
</body>
</html>"""


# --- Lexicon reference tables ---

def render_def_table(def_name: str, def_body: dict, lex_id: str, dwc_terms: dict) -> str:
    props, required = get_def_properties(def_body)
    if not props:
        return ""

    desc = def_body.get("description", "")
    if not desc:
        desc = def_body.get("record", {}).get("description", "")

    label = def_name if def_name != "main" else lex_id.split(".")[-1]
    anchor = def_name

    html = f'<h3 id="{escape(anchor)}">#{escape(def_name)}'
    if def_name == "main":
        html += f' <span class="muted">({escape(label)})</span>'
    html += '</h3>\n'
    if desc:
        html += f'<p class="section-desc">{escape(desc)}</p>\n'

    html += '<table>\n<thead><tr>'
    html += '<th>Field</th><th>Type</th><th>Description</th><th>Constraints</th><th>DwC</th>'
    html += '</tr></thead>\n<tbody>\n'

    for field_name, prop in props.items():
        field_cell = f'<span class="field">{escape(field_name)}</span>'
        if field_name in required:
            field_cell += '<span class="req">*</span>'

        type_cell = f'<span class="type">{escape(type_label(prop))}</span>'
        desc_cell = escape(prop.get("description", ""))
        const = constraints_label(prop)
        const_cell = f'<span class="constraints">{escape(const)}</span>' if const else ""

        dwc_term = dwc_term_for_field(field_name, dwc_terms)
        if dwc_term and field_name not in ATPROTO_FIELDS:
            dwc_cell = f'<a class="dwc-link" href="{escape(dwc_term["term_iri"])}">dwc:{escape(dwc_term["name"])}</a>'
        else:
            dwc_cell = ""

        html += f'<tr><td>{field_cell}</td><td>{type_cell}</td>'
        html += f'<td class="def-col">{desc_cell}</td><td>{const_cell}</td>'
        html += f'<td>{dwc_cell}</td></tr>\n'

    html += '</tbody>\n</table>\n'
    return html


# --- DwC alignment tables ---

def render_dwc_tables(classes: list[str], dwc_terms: dict, lex_props: dict) -> str:
    lex_by_dwc: dict[str, tuple[str, dict]] = {}
    mapped_lex_fields: set[str] = set()
    for field_name, prop in lex_props.items():
        if field_name in ATPROTO_FIELDS:
            continue
        dwc_name = FIELD_TO_DWC.get(field_name, field_name)
        if dwc_name in dwc_terms:
            lex_by_dwc[dwc_name] = (field_name, prop)
            mapped_lex_fields.add(field_name)

    ext_fields = {
        name: prop for name, prop in lex_props.items()
        if name not in mapped_lex_fields and name not in ATPROTO_FIELDS
    }

    html = ""

    for cls in classes:
        cls_terms = sorted(
            [t for t in dwc_terms.values() if t["class"] == cls],
            key=lambda t: t["name"],
        )
        if not cls_terms:
            continue

        mapped_count = sum(1 for t in cls_terms if t["name"] in lex_by_dwc)
        html += f'<h3>{escape(cls)} <span class="muted">({mapped_count}/{len(cls_terms)})</span></h3>\n'
        html += '<table>\n<thead><tr>'
        html += '<th>DwC Term</th><th>Definition</th>'
        html += '<th>Lexicon Field</th><th>Type</th><th>Status</th>'
        html += '</tr></thead>\n<tbody>\n'

        for term in cls_terms:
            iri = escape(term["term_iri"])
            name = escape(term["name"])
            defn = escape(term["definition"])

            if term["name"] in GBIF_REQUIRED:
                gbif = ' <span class="badge badge-gbif-req">gbif req</span>'
            elif term["name"] in GBIF_RECOMMENDED:
                gbif = ' <span class="badge badge-gbif-rec">gbif rec</span>'
            else:
                gbif = ""

            if term["name"] in lex_by_dwc:
                field_name, prop = lex_by_dwc[term["name"]]
                lex_cell = f'<span class="field">{escape(field_name)}</span>'
                if prop.get("required"):
                    lex_cell += '<span class="req">*</span>'
                type_cell = f'<span class="type">{escape(type_label(prop))}</span>'
                status_cell = badge("mapped")
            else:
                lex_cell = ""
                type_cell = ""
                status_cell = badge("missing")

            html += f'<tr><td><a class="dwc-link" href="{iri}">{name}</a>{gbif}</td>'
            html += f'<td class="def-col">{defn}</td>'
            html += f'<td>{lex_cell}</td><td>{type_cell}</td><td>{status_cell}</td></tr>\n'

        html += '</tbody>\n</table>\n'

    if ext_fields:
        html += f'<h3>Lexicon-only <span class="muted">({len(ext_fields)} fields)</span></h3>\n'
        html += '<table>\n<thead><tr>'
        html += '<th>DwC Term</th><th>Description</th>'
        html += '<th>Lexicon Field</th><th>Type</th><th>Status</th>'
        html += '</tr></thead>\n<tbody>\n'

        for field_name in sorted(ext_fields):
            prop = ext_fields[field_name]
            desc = escape(prop.get("description", ""))
            lex_cell = f'<span class="field">{escape(field_name)}</span>'
            if prop.get("required"):
                lex_cell += '<span class="req">*</span>'
            type_cell = f'<span class="type">{escape(type_label(prop))}</span>'
            html += f'<tr><td></td><td class="def-col">{desc}</td>'
            html += f'<td>{lex_cell}</td><td>{type_cell}</td><td>{badge("extension")}</td></tr>\n'

        html += '</tbody>\n</table>\n'

    return html


# --- Page generators ---

def generate_index(dwc_terms: dict, model_props: list[dict]) -> str:
    stats = compute_global_stats(dwc_terms, model_props)

    cards = ""
    for model, props in zip(MODELS, model_props):
        ms = compute_model_stats(dwc_terms, props, model["classes"])
        field_count = len([f for f in props if f not in ATPROTO_FIELDS])
        cards += f"""<a class="card" href="{model['slug']}.html">
<div class="card-nsid">bio.lexicons.{escape(model['slug'])}</div>
<div class="card-title">{escape(model['name'])}</div>
<div class="card-desc">{escape(model['description'])}</div>
<div class="card-meta">{field_count} fields &middot; {ms['pct']:.0f}% DwC coverage</div>
</a>"""

    body = f"""\
<div class="page-header">
<h1 class="page-title">lexicons.bio</h1>
<p class="page-subtitle">AT Protocol lexicons for decentralized biodiversity observation data, aligned with
<a class="dwc-link" href="https://dwc.tdwg.org/">Darwin Core</a> and
<a class="dwc-link" href="https://www.gbif.org/">GBIF</a> standards.</p>
</div>

<div class="stats">
<div class="stat"><div class="stat-value">{len(MODELS)}</div><div class="stat-label">Lexicons</div></div>
<div class="stat"><div class="stat-value">{stats['total_fields']}</div><div class="stat-label">Fields</div></div>
<div class="stat"><div class="stat-value">{stats['pct']:.0f}%</div><div class="stat-label">DwC Coverage</div></div>
<div class="stat"><div class="stat-value">{stats['mapped']}</div><div class="stat-label">Terms Mapped</div></div>
</div>

<div class="cards">
{cards}
</div>

<hr class="divider">

<h2>Architecture</h2>
<p class="section-desc">Records use AT Protocol's <code>strongRef</code> (URI + CID) to create immutable links. The occurrence record sits at the center, with identifications referencing it.</p>

<div class="diagram"><a href="identification.html"><strong>identification</strong></a>
  └─ <strong>#taxon</strong>              ──references──▶  <a href="occurrence.html"><strong>occurrence</strong></a>
                                                └─ <strong>#location</strong>
                                                └─ <strong>#imageEmbed</strong></div>

<p class="section-desc">Taxonomy lives in identification records, not occurrences — this enables community consensus identification where multiple users can propose IDs for the same observation.</p>

<hr class="divider">

<h2>Usage</h2>
<p class="section-desc">These lexicons follow the <a class="dwc-link" href="https://atproto.com/specs/lexicon">AT Protocol Lexicon</a> schema format. Records are stored in users' personal data servers (PDS) under the appropriate collection, referenced by NSID.</p>

<h3>Record keys</h3>
<p class="section-desc">All records use <code>tid</code> (timestamp-based identifier) as their record key, per the <a class="dwc-link" href="https://atproto.com/specs/record-key">AT Protocol record key spec</a>.</p>

<h3>Cross-references</h3>
<p class="section-desc">Records reference each other using <code>com.atproto.repo.strongRef</code>, which contains both a URI and CID. The CID ensures you're referencing a specific version of the target record.</p>
"""

    return page_html("lexicons.bio", "overview", body)


def generate_model_page(model: dict, lex: dict, lex_props: dict, dwc_terms: dict) -> str:
    stats = compute_model_stats(dwc_terms, lex_props, model["classes"])
    lex_id = lex.get("id", "")
    field_count = len([f for f in lex_props if f not in ATPROTO_FIELDS])

    # Build table of contents
    defs = lex.get("defs", {})
    toc = ""
    for def_name, def_body in defs.items():
        props, _ = get_def_properties(def_body)
        if props:
            label = f"#{def_name}"
            toc += f' <a class="dwc-link" href="#{escape(def_name)}" style="margin-right:1rem;">{label}</a>'

    # Lexicon reference section
    ref_html = ""
    for def_name, def_body in defs.items():
        ref_html += render_def_table(def_name, def_body, lex_id, dwc_terms)

    # DwC alignment section
    dwc_html = render_dwc_tables(model["classes"], dwc_terms, lex_props)

    body = f"""\
<div class="page-header">
<div class="nsid">{escape(lex_id)}</div>
<h1 class="page-title">{escape(model['name'])}</h1>
<p class="page-subtitle">{escape(model['description'])}</p>
</div>

<div class="stats">
<div class="stat"><div class="stat-value">{field_count}</div><div class="stat-label">Fields</div></div>
<div class="stat"><div class="stat-value">{stats['pct']:.0f}%</div><div class="stat-label">DwC Coverage</div></div>
<div class="stat"><div class="stat-value">{stats['mapped']}</div><div class="stat-label">Mapped</div></div>
<div class="stat"><div class="stat-value">{stats['missing']}</div><div class="stat-label">Missing</div></div>
</div>

<h2>Lexicon Reference</h2>
<p class="section-desc">Definitions:{toc}</p>

{ref_html}

<hr class="divider">

<h2>Darwin Core Alignment</h2>
<p class="section-desc">Cross-reference against <a class="dwc-link" href="https://dwc.tdwg.org/terms/">Darwin Core</a> terms. Green = mapped, red = not yet implemented.</p>

{dwc_html}
"""

    return page_html(
        f"{model['name']} — lexicons.bio",
        model["name"],
        body,
    )


# --- Main ---

def main():
    dwc_terms = load_dwc_terms(DWC_CSV)

    lexicons = []
    model_props = []
    for model in MODELS:
        lex = load_lexicon(model["lexicon"])
        lexicons.append(lex)
        model_props.append(load_lexicon_properties_flat(model["lexicon"]))

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Index page
    index_path = OUTPUT_DIR / "index.html"
    index_path.write_text(generate_index(dwc_terms, model_props), encoding="utf-8")
    print(f"  {index_path.relative_to(ROOT)}")

    # Model pages
    for model, lex, props in zip(MODELS, lexicons, model_props):
        path = OUTPUT_DIR / f"{model['slug']}.html"
        path.write_text(
            generate_model_page(model, lex, props, dwc_terms),
            encoding="utf-8",
        )
        print(f"  {path.relative_to(ROOT)}")

    print("Done")


if __name__ == "__main__":
    main()
