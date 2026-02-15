# Architecture & Design Decisions

## Record Relationships

The lexicons follow a **star schema** with the occurrence record at the center:

```
┌─────────────────┐    ┌─────────────┐
│  identification  │──▶│  occurrence  │
│  subject: ref    │    │  (central)  │
│  scientificName  │    │  eventDate  │
│  taxonRank       │    │  lat/lng    │
│  ...             │    │  media      │
└─────────────────┘    └─────────────┘
```

Every sidecar record references an occurrence via `com.atproto.repo.strongRef` — a pair of URI + CID that creates an immutable, content-addressed link.

## Key Design Decisions

### Taxonomy in Identifications, Not Occurrences

Unlike traditional biodiversity databases where taxonomy is part of the observation record, our occurrences contain no taxonomy fields. Instead:

1. Users submit an **occurrence** (photos, location, date)
2. Users submit **identification** records referencing that occurrence
3. The appview computes a **community consensus** from all identifications

This enables:
- Observations without knowing the species ("What is this?")
- Multiple competing identifications with different confidence levels
- Community-driven consensus building, similar to iNaturalist
- Full identification history preserved in the decentralized network

### Flat Record Structure

All Darwin Core fields are top-level properties on their record, not nested inside sub-objects. This follows Darwin Core's own flat structure and makes records simple to produce and consume. The identification record contains the full Darwin Core Taxon class hierarchy (kingdom through genus, plus scientific name and authorship) as flat fields, following the [GBIF Identification History extension](https://rs.gbif.org/extension/dwc/identification.xml) pattern where each identification carries its own snapshot of the taxon.

### `knownValues` Over `enum`

Per the [AT Protocol Lexicon Style Guide](https://atproto.com/guides/lexicon-style-guide) and [Lexinomicon](https://docs.google.com/document/d/1goj4pSPH-EKMtP3Y2vDIEKbLFEVGdeoKqpnmRH9S4t0/) community guide, we use `knownValues` (open sets) instead of `enum` (closed sets) for most string fields:

- **`knownValues`**: Validators accept any string, but suggest these specific values. Forward-compatible — new values can be added without breaking existing clients.
- **`enum`**: Validators reject unknown values. Used only when the set is truly closed.

Fields using `knownValues`: `license`, `taxonRank`

### `strongRef` for Immutable References

All cross-record references use AT Protocol's `com.atproto.repo.strongRef`, which contains:
- **`uri`**: The AT Protocol URI (`at://did/collection/rkey`)
- **`cid`**: Content identifier (hash of the record content)

The CID ensures that a reference always points to a specific version of the target record. If the target is updated, the CID changes, making the reference point to the historical version.

### Coordinates as Strings

Latitude and longitude are stored as strings rather than numbers to preserve exact decimal precision. Floating-point representation can introduce rounding artifacts (e.g., `37.7749` might become `37.774899999999997`). String storage preserves the user's original coordinate values exactly.

## Namespace

The lexicons use the `bio.lexicons.*` namespace, corresponding to the `lexicons.bio` domain. See the [AT Protocol NSID specification](https://atproto.com/specs/nsid) for how domain-based namespacing works.
