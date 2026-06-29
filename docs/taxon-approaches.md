# Taxon Handling Approaches

Comparison of approaches for representing taxonomic information in lexicons.bio schemas.

## 1. Inline Flat Fields (Current)

Each identification carries a full taxon snapshot as flat fields on the record.

```json
{
  "$type": "bio.lexicons.temp.v0-1.identification",
  "subject": { "uri": "at://...", "cid": "..." },
  "scientificName": "Aphelocoma californica",
  "taxonRank": "species",
  "vernacularName": "California Scrub-Jay",
  "kingdom": "Animalia",
  "family": "Corvidae",
  "genus": "Aphelocoma"
}
```

**Strengths**: Self-contained, no cross-record lookups, each identification is a complete snapshot. Follows the [GBIF Identification History extension](https://rs.gbif.org/extension/dwc/identification.xml) pattern. Simple to produce and export to DwC-A. Works well with AT Protocol's document-oriented model.

**Weaknesses**: Duplicated taxon data across every identification of the same species. No canonical taxon to browse or link to. Hard to answer "all observations of family Corvidae" without appview aggregation. Taxonomy corrections require a whole new identification record.

## 2. Separate Taxon Record Type

A `bio.lexicons.temp.v0-1.taxon` record that identifications reference via strongRef.

```json
// Taxon record (created once, referenced many times)
{
  "$type": "bio.lexicons.temp.v0-1.taxon",
  "scientificName": "Aphelocoma californica",
  "taxonRank": "species",
  "kingdom": "Animalia",
  "family": "Corvidae",
  "genus": "Aphelocoma"
}

// Identification just references it
{
  "$type": "bio.lexicons.temp.v0-1.identification",
  "subject": { "uri": "at://...", "cid": "..." },
  "taxon": { "uri": "at://did:plc:.../bio.lexicons.temp.v0-1.taxon/...", "cid": "..." },
  "vernacularName": "California Scrub-Jay"
}
```

**Strengths**: Deduplication — thousands of identifications reference one taxon record. Taxon records become browsable/searchable resources. Clean separation of concerns. Could enable expert-curated taxonomy.

**Weaknesses**: Who owns taxon records? In AT Protocol, records live in a user's PDS — there's no natural "owner" for *Aphelocoma californica*. Creates a chicken-and-egg problem: you need to find or create a taxon record before making an identification. strongRef pins to a specific version, so taxon corrections don't propagate. If the taxon record owner deletes their account, references break. Doesn't match GBIF's pattern where each identification snapshots its own taxon.

## 3. External Authority Reference Only

Store just a taxon ID from GBIF, ITIS, WoRMS, or another backbone, plus a display name.

```json
{
  "$type": "bio.lexicons.temp.v0-1.identification",
  "subject": { "uri": "at://...", "cid": "..." },
  "scientificName": "Aphelocoma californica",
  "taxonConceptID": "gbif:2482568"
}
```

**Strengths**: Leverages existing authoritative taxonomic databases. Minimal schema. No duplication. Easy to resolve to full taxonomy via API. Unambiguous — the ID resolves synonymy and homonymy.

**Weaknesses**: External dependency — records aren't self-describing without a network lookup. Different authorities use different IDs for the same species (GBIF vs ITIS vs WoRMS). Breaks FAIR accessibility if the authority goes down. Users/apps need to know the external ID upfront. Can't work offline.

## 4. Inline Snapshot + Optional Authority Reference (Hybrid)

Current approach plus an optional `taxonConceptID` field linking to an external backbone.

```json
{
  "$type": "bio.lexicons.temp.v0-1.identification",
  "subject": { "uri": "at://...", "cid": "..." },
  "scientificName": "Aphelocoma californica",
  "taxonRank": "species",
  "vernacularName": "California Scrub-Jay",
  "kingdom": "Animalia",
  "family": "Corvidae",
  "genus": "Aphelocoma",
  "taxonConceptID": "gbif:2482568"
}
```

**Strengths**: Self-describing records that also link to authoritative taxonomy. Appview can use the ID to normalize, resolve synonyms, and validate. Darwin Core itself has `taxonConceptID` for exactly this purpose. Best of both worlds — works offline, works with external tools.

**Weaknesses**: Two sources of truth — inline fields and authority ID could diverge. Still duplicates data across identifications. More fields. Format of the ID needs a convention (URI? prefixed ID?).

## 5. Minimal Inline + Appview-Resolved Taxonomy

Store only what the user actually provides (name + common name). The appview resolves the rest from a taxonomy backbone.

```json
{
  "$type": "bio.lexicons.temp.v0-1.identification",
  "subject": { "uri": "at://...", "cid": "..." },
  "scientificName": "Aphelocoma californica",
  "vernacularName": "California Scrub-Jay"
}
```

The appview auto-resolves rank, kingdom through genus, synonyms, etc. for display and search.

**Strengths**: Smallest possible record. Users don't need to know or provide taxonomy hierarchy (the app's autocomplete handles it, but the hierarchy isn't stored). Appview can keep its backbone current — taxonomy updates are reflected immediately. Simplest schema.

**Weaknesses**: Records aren't self-describing — you need an appview to see the full taxonomy. Different appviews might resolve differently (or not at all). Loses the snapshot property — you can't tell what taxonomy the identifier intended at the time. Name matching is imperfect (homonyms, misspellings, outdated synonyms). Harder to export to DwC-A without appview enrichment.

## Comparison

| | Self-describing | Deduplication | Authority link | Schema size | Offline-capable | GBIF export |
|---|---|---|---|---|---|---|
| **1. Inline flat** | Yes | No | No | Medium | Yes | Easy |
| **2. Separate record** | Via lookup | Yes | No | Small per-ID | Yes (if cached) | Needs joins |
| **3. External ref only** | No | Yes | Yes | Small | No | Needs API |
| **4. Hybrid** | Yes | No | Yes | Large | Yes | Easy |
| **5. Appview-resolved** | No | Yes | Implicit | Smallest | No | Needs appview |

## Analysis

The current approach (1) optimizes for self-describing records and simple export. The hybrid (4) is the natural evolution — just add an optional `taxonConceptID` field when there's demand. Approach 2 has a fundamental tension with AT Protocol's ownership model (who owns the canonical *Aphelocoma californica* record?). Approach 5 is the most minimal but pushes the most complexity into the appview.
