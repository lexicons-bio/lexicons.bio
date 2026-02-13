#!/usr/bin/env python3
"""Generate a static HTML page showing Darwin Core alignment.

Reads the TDWG term_versions.csv and AT Protocol lexicon JSON files,
then produces docs/dwc-alignment.html with side-by-side tables of DwC
terms and lexicon fields.
"""

import csv
import json
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DWC_CSV = ROOT / "schemas" / "dwc" / "term_versions.csv"
OUTPUT = ROOT / "docs" / "dwc-alignment.html"

# Lexicon paths and which DwC classes they cover
MODELS = [
    {
        "name": "Occurrence",
        "lexicon": ROOT / "lexicons" / "org" / "rwell" / "test" / "occurrence.json",
        "classes": ["Occurrence", "Event", "Location", "Record-level"],
    },
    {
        "name": "Identification",
        "lexicon": ROOT / "lexicons" / "org" / "rwell" / "test" / "identification.json",
        "classes": ["Identification", "Taxon"],
    },
]

# Lexicon field -> DwC term_localName (when names differ)
FIELD_TO_DWC = {
    "notes": "occurrenceRemarks",
    "comment": "identificationRemarks",
    "blobs": "associatedMedia",
    "recordedBy": "recordedBy",
    "createdAt": "dateIdentified",
}

# Reverse: DwC term_localName -> lexicon field name
DWC_TO_FIELD = {v: k for k, v in FIELD_TO_DWC.items()}

# Fields that are AT Protocol infrastructure (no DwC mapping)
ATPROTO_FIELDS = {
    "subject", "subjectIndex", "isAgreement", "confidence", "taxonId",
    "taxon", "location", "image", "alt", "aspectRatio", "width", "height",
}


# --- Data loading ---

def load_dwc_terms(csv_path: Path) -> dict[str, dict]:
    """Load recommended DwC property terms, keyed by term_localName."""
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


def load_lexicon_properties(lexicon_path: Path) -> dict[str, dict]:
    """Load all properties from a lexicon, returning full metadata.

    Returns flat dict: {"eventDate": {"type": "string", "format": "datetime",
    "description": "...", "required": True, "def": "main"}, ...}
    """
    with open(lexicon_path, encoding="utf-8") as f:
        lex = json.load(f)

    result = {}
    for def_name, def_body in lex.get("defs", {}).items():
        props = def_body.get("properties", {})
        if not props:
            record = def_body.get("record", {})
            props = record.get("properties", {})
        required = set(
            def_body.get("required", [])
            or def_body.get("record", {}).get("required", [])
        )
        for field_name, field_meta in props.items():
            result[field_name] = {
                **field_meta,
                "required": field_name in required,
                "def": def_name,
            }
    return result


def type_label(prop: dict) -> str:
    """Build a human-readable type string from a lexicon property."""
    t = prop.get("type", "")
    fmt = prop.get("format", "")
    if t == "ref":
        ref = prop.get("ref", "")
        if ref.startswith("#"):
            return f"#{ref[1:]}"
        return "ref"
    if t == "array":
        items = prop.get("items", {})
        inner = items.get("type", "")
        if inner == "ref":
            ref = items.get("ref", "")
            return f"{ref}[]" if ref.startswith("#") else "ref[]"
        return f"{inner}[]" if inner else "array"
    if fmt:
        return f"{t} ({fmt})"
    return t


# --- HTML generation ---

CSS = """\
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
       color: #1a1a1a; max-width: 1200px; margin: 0 auto; padding: 2rem 1rem; }
h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
.subtitle { color: #666; margin-bottom: 1.5rem; }
.stats { display: flex; gap: 1.5rem; margin-bottom: 2rem; flex-wrap: wrap; }
.stat { background: #f5f5f5; border-radius: 8px; padding: 0.75rem 1rem; }
.stat-value { font-size: 1.25rem; font-weight: 600; }
.stat-label { font-size: 0.8rem; color: #666; }
h2 { font-size: 1.25rem; margin: 2rem 0 0.25rem; padding-bottom: 0.25rem;
     border-bottom: 2px solid #e0e0e0; }
h3 { font-size: 1rem; color: #444; margin: 1.25rem 0 0.5rem; }
table { width: 100%; border-collapse: collapse; font-size: 0.85rem; margin-bottom: 1rem; }
th { background: #fafafa; text-align: left; padding: 0.5rem 0.75rem;
     border-bottom: 2px solid #ddd; font-weight: 600; white-space: nowrap; }
td { padding: 0.5rem 0.75rem; border-bottom: 1px solid #eee; vertical-align: top; }
tr:hover { background: #fafafa; }
.def { color: #555; max-width: 350px; }
.term-link { color: #1a73e8; text-decoration: none; }
.term-link:hover { text-decoration: underline; }
.type { font-family: "SF Mono", Monaco, Consolas, monospace; font-size: 0.8rem; color: #6b21a8; }
.badge { display: inline-block; font-size: 0.7rem; font-weight: 600; padding: 2px 8px;
         border-radius: 10px; text-transform: uppercase; letter-spacing: 0.03em; }
.badge-mapped { background: #dcfce7; color: #166534; }
.badge-missing { background: #fee2e2; color: #991b1b; }
.badge-ext { background: #e0e7ff; color: #3730a3; }
.req { color: #dc2626; font-weight: 600; }
.field-name { font-family: "SF Mono", Monaco, Consolas, monospace; font-size: 0.8rem; }
"""


def badge(status: str) -> str:
    cls = {"mapped": "badge-mapped", "missing": "badge-missing", "extension": "badge-ext"}
    return f'<span class="badge {cls[status]}">{status}</span>'


def render_model_section(
    model_name: str,
    classes: list[str],
    dwc_terms: dict[str, dict],
    lex_props: dict[str, dict],
) -> str:
    """Render tables for one model (Occurrence or Identification)."""
    # Build reverse lookup: dwc_name -> lexicon field info
    lex_by_dwc: dict[str, tuple[str, dict]] = {}
    for field_name, prop in lex_props.items():
        if field_name in ATPROTO_FIELDS:
            continue
        dwc_name = FIELD_TO_DWC.get(field_name, field_name)
        if dwc_name in dwc_terms:
            lex_by_dwc[dwc_name] = (field_name, prop)

    html = f'<h2>{escape(model_name)}</h2>\n'

    for cls in classes:
        cls_terms = sorted(
            [t for t in dwc_terms.values() if t["class"] == cls],
            key=lambda t: t["name"],
        )
        if not cls_terms:
            continue

        mapped_count = sum(1 for t in cls_terms if t["name"] in lex_by_dwc)
        html += f'<h3>{escape(cls)} <span style="color:#888;font-weight:normal">'
        html += f'({mapped_count}/{len(cls_terms)} mapped)</span></h3>\n'
        html += '<table>\n<thead><tr>'
        html += '<th>DwC Term</th><th class="def">Definition</th>'
        html += '<th>Lexicon Field</th><th>Type</th><th>Status</th>'
        html += '</tr></thead>\n<tbody>\n'

        for term in cls_terms:
            iri = escape(term["term_iri"])
            name = escape(term["name"])
            defn = escape(term["definition"])

            if term["name"] in lex_by_dwc:
                field_name, prop = lex_by_dwc[term["name"]]
                lex_cell = f'<span class="field-name">{escape(field_name)}</span>'
                if prop.get("required"):
                    lex_cell += ' <span class="req">*</span>'
                type_cell = f'<span class="type">{escape(type_label(prop))}</span>'
                status_cell = badge("mapped")
            else:
                lex_cell = ""
                type_cell = ""
                status_cell = badge("missing")

            html += f'<tr><td><a class="term-link" href="{iri}">{name}</a></td>'
            html += f'<td class="def">{defn}</td>'
            html += f'<td>{lex_cell}</td><td>{type_cell}</td><td>{status_cell}</td></tr>\n'

        html += '</tbody>\n</table>\n'

    return html


def render_extensions(lex_props: dict[str, dict], dwc_terms: dict[str, dict]) -> str:
    """Render table for AT Protocol extension fields."""
    ext_fields = {}
    for field_name, prop in lex_props.items():
        if field_name in ATPROTO_FIELDS:
            ext_fields[field_name] = prop
        elif FIELD_TO_DWC.get(field_name, field_name) not in dwc_terms and field_name not in dwc_terms:
            ext_fields[field_name] = prop

    if not ext_fields:
        return ""

    html = '<h2>AT Protocol Extensions</h2>\n'
    html += '<table>\n<thead><tr>'
    html += '<th>Field</th><th>Type</th><th class="def">Description</th><th>Lexicon</th><th>Status</th>'
    html += '</tr></thead>\n<tbody>\n'

    for field_name in sorted(ext_fields):
        prop = ext_fields[field_name]
        desc = escape(prop.get("description", ""))
        def_name = prop.get("def", "")
        html += f'<tr><td><span class="field-name">{escape(field_name)}</span></td>'
        html += f'<td><span class="type">{escape(type_label(prop))}</span></td>'
        html += f'<td class="def">{desc}</td>'
        html += f'<td class="field-name">#{escape(def_name)}</td>'
        html += f'<td>{badge("extension")}</td></tr>\n'

    html += '</tbody>\n</table>\n'
    return html


def main():
    dwc_terms = load_dwc_terms(DWC_CSV)

    # Load all lexicon properties across both models
    all_lex_props: dict[str, dict] = {}
    model_props: list[dict[str, dict]] = []
    for model in MODELS:
        props = load_lexicon_properties(model["lexicon"])
        model_props.append(props)
        all_lex_props.update(props)

    # Count stats
    all_relevant_classes = set()
    for m in MODELS:
        all_relevant_classes.update(m["classes"])
    relevant_terms = [t for t in dwc_terms.values() if t["class"] in all_relevant_classes]

    mapped_count = 0
    for field_name in all_lex_props:
        if field_name in ATPROTO_FIELDS:
            continue
        dwc_name = FIELD_TO_DWC.get(field_name, field_name)
        if dwc_name in dwc_terms:
            mapped_count += 1

    total = len(relevant_terms)
    missing = total - mapped_count
    ext_count = sum(1 for f in all_lex_props if f in ATPROTO_FIELDS)
    pct = (mapped_count / total * 100) if total else 0

    # Build HTML
    body = ""
    for model, props in zip(MODELS, model_props):
        body += render_model_section(model["name"], model["classes"], dwc_terms, props)

    body += render_extensions(all_lex_props, dwc_terms)

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Darwin Core Alignment — atbio lexicons</title>
<style>{CSS}</style>
</head>
<body>
<h1>Darwin Core Alignment</h1>
<p class="subtitle">Cross-reference of atbio AT Protocol lexicons against Darwin Core terms</p>
<div class="stats">
  <div class="stat"><div class="stat-value">{pct:.0f}%</div><div class="stat-label">DwC coverage</div></div>
  <div class="stat"><div class="stat-value">{mapped_count}</div><div class="stat-label">Mapped</div></div>
  <div class="stat"><div class="stat-value">{missing}</div><div class="stat-label">Missing</div></div>
  <div class="stat"><div class="stat-value">{ext_count}</div><div class="stat-label">Extensions</div></div>
</div>
{body}
</body>
</html>"""

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(html, encoding="utf-8")
    print(f"Generated {OUTPUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
