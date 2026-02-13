#!/usr/bin/env python3
"""Cross-reference AT Protocol lexicon fields against Darwin Core terms.

Parses the TDWG term_versions.csv and the lexicon JSON files, then prints
a coverage report showing which DwC terms are implemented, which lexicon
fields have no DwC equivalent, and which relevant DwC terms are missing.
"""

import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DWC_CSV = ROOT / "schemas" / "dwc" / "term_versions.csv"
LEXICON_DIR = ROOT / "lexicons"

# DwC classes relevant to this project's lexicons
RELEVANT_CLASSES = {
    "Occurrence",
    "Event",
    "Location",
    "Taxon",
    "Identification",
    "Organism",
}

# Manual mappings for lexicon fields whose names don't match DwC term_localName
FIELD_TO_DWC = {
    "notes": "occurrenceRemarks",
    "comment": "identificationRemarks",
    "createdAt": "dateIdentified",  # only in identification context
}

# Fields that are AT Protocol infrastructure, not biodiversity data
ATPROTO_FIELDS = {
    "subject",
    "subjectIndex",
    "isAgreement",
    "confidence",
    "taxonId",
    "taxon",       # ref to nested object, not a field itself
    "location",    # ref to nested object
    "image",
    "alt",
    "aspectRatio",
    "width",
    "height",
}

# Fields that map to DwC but with different semantics per lexicon.
# Format: field_name -> {lexicon_id_substring: dwc_term_name}
CONTEXTUAL_MAPPINGS = {
    "createdAt": {"identification": "dateIdentified"},
    "blobs": {"occurrence": "associatedMedia"},
    "recordedBy": {"occurrence": "recordedBy"},
}


def load_dwc_terms(csv_path: Path) -> dict[str, dict]:
    """Load recommended DwC property terms, keyed by term_localName."""
    terms = {}
    with open(csv_path, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            if row["status"] != "recommended":
                continue
            rdf_type = row["rdf_type"]
            # Skip class definitions; we only want properties
            if "Class" in rdf_type:
                continue
            # Skip IRI-only variants (UseWithIRI namespace)
            if "UseWithIRI" in row.get("organized_in", ""):
                continue
            name = row["term_localName"]
            # Keep the first (most recent) recommended version of each term
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
    """Extract the class name from an organized_in URI."""
    if not organized_in:
        return "Record-level"
    last = organized_in.rstrip("/").split("/")[-1]
    # Dublin Core namespaces don't have a class segment
    if last in ("1.1", "terms"):
        return "Record-level"
    return last


def load_lexicon_fields(lexicon_path: Path) -> dict[str, list[str]]:
    """Extract field names from a lexicon JSON, grouped by def name.

    Returns a dict like {"main": ["eventDate", ...], "location": [...]}.
    """
    with open(lexicon_path, encoding="utf-8") as f:
        lex = json.load(f)

    result = {}
    for def_name, def_body in lex.get("defs", {}).items():
        props = def_body.get("properties", {})
        if not props:
            # For record types, properties are nested under record.properties
            record = def_body.get("record", {})
            props = record.get("properties", {})
        if props:
            result[def_name] = list(props.keys())
    return result


def find_lexicons(lexicon_dir: Path) -> list[Path]:
    """Find all .json lexicon files."""
    return sorted(lexicon_dir.rglob("*.json"))


def build_field_set(lexicon_fields: dict[str, dict[str, list[str]]]) -> set[str]:
    """Flatten all lexicon field names into a single set."""
    fields = set()
    for _path, defs in lexicon_fields.items():
        for _def_name, field_list in defs.items():
            fields.update(field_list)
    return fields


def main():
    # Load data
    dwc_terms = load_dwc_terms(DWC_CSV)
    lexicon_paths = find_lexicons(LEXICON_DIR)

    all_lexicon_fields: dict[str, dict[str, list[str]]] = {}
    for path in lexicon_paths:
        rel = path.relative_to(ROOT)
        all_lexicon_fields[str(rel)] = load_lexicon_fields(path)

    all_fields = build_field_set(all_lexicon_fields)

    # Classify fields
    mapped = {}       # field_name -> dwc term info
    unmapped = set()  # lexicon fields with no DwC equivalent

    # Resolve contextual mappings: check which lexicons contain each field
    contextual_resolved = {}
    for field, ctx_map in CONTEXTUAL_MAPPINGS.items():
        for lex_path in all_lexicon_fields:
            for ctx_key, dwc_name in ctx_map.items():
                if ctx_key in lex_path:
                    for _def, fields in all_lexicon_fields[lex_path].items():
                        if field in fields and dwc_name in dwc_terms:
                            contextual_resolved[field] = dwc_terms[dwc_name]

    for field in sorted(all_fields):
        if field in ATPROTO_FIELDS:
            unmapped.add(field)
            continue

        # Contextual mapping (field means different things in different lexicons)
        if field in contextual_resolved:
            mapped[field] = contextual_resolved[field]
        # Direct name match
        elif field in dwc_terms:
            mapped[field] = dwc_terms[field]
        # Manual mapping
        elif field in FIELD_TO_DWC and FIELD_TO_DWC[field] in dwc_terms:
            mapped[field] = dwc_terms[FIELD_TO_DWC[field]]
        else:
            unmapped.add(field)

    # Find unimplemented DwC terms in relevant classes
    mapped_dwc_names = {t["name"] for t in mapped.values()}
    unimplemented = {}
    for name, term in dwc_terms.items():
        if term["class"] in RELEVANT_CLASSES and name not in mapped_dwc_names:
            unimplemented[name] = term

    # --- Print report ---
    print("=" * 70)
    print("Darwin Core Cross-Reference Report")
    print("=" * 70)

    # Lexicon structure
    print("\n## Lexicon files\n")
    for path, defs in all_lexicon_fields.items():
        print(f"  {path}")
        for def_name, fields in defs.items():
            print(f"    #{def_name}: {len(fields)} fields")

    # Mapped fields
    print(f"\n## Mapped to Darwin Core ({len(mapped)} fields)\n")
    by_class: dict[str, list[tuple[str, dict]]] = {}
    for field, term in sorted(mapped.items()):
        cls = term["class"]
        by_class.setdefault(cls, []).append((field, term))

    for cls in sorted(by_class):
        print(f"  [{cls}]")
        for field, term in by_class[cls]:
            arrow = f"{field} -> {term['name']}" if field != term["name"] else field
            print(f"    {arrow:<45s} {term['term_iri']}")
        print()

    # Unmapped lexicon fields
    print(f"## AT Protocol / extension fields ({len(unmapped)} fields)\n")
    for field in sorted(unmapped):
        print(f"    {field}")

    # Unimplemented DwC terms
    print(f"\n## Unimplemented DwC terms in relevant classes ({len(unimplemented)} terms)\n")
    by_class2: dict[str, list[dict]] = {}
    for term in unimplemented.values():
        by_class2.setdefault(term["class"], []).append(term)

    for cls in sorted(by_class2):
        print(f"  [{cls}] ({len(by_class2[cls])} terms)")
        for term in sorted(by_class2[cls], key=lambda t: t["name"]):
            print(f"    {term['name']:<45s} {term['term_iri']}")
        print()

    # Summary
    total_relevant = len(mapped) + len(unimplemented)
    pct = (len(mapped) / total_relevant * 100) if total_relevant else 0
    print("=" * 70)
    print("Summary")
    print("=" * 70)
    print(f"  Lexicon fields mapped to DwC:       {len(mapped)}")
    print(f"  AT Protocol / extension fields:      {len(unmapped)}")
    print(f"  Unimplemented relevant DwC terms:    {len(unimplemented)}")
    print(f"  Coverage of relevant DwC terms:      {pct:.0f}% ({len(mapped)}/{total_relevant})")


if __name__ == "__main__":
    main()
