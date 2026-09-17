# Architecture & Design Decisions

## Record Relationships

The lexicons follow a star schema with the occurrence record at the center. Records reference each other via `com.atproto.repo.strongRef` — a pair of URI + CID that creates an immutable, content-addressed link. Identifications reference occurrences, and occurrences reference media.

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

### Cross-Platform References

Observations are routinely posted to more than one platform, so consumers
need to cross-link between them and aggregators need to avoid counting the
same organism twice. `externalRecords` carries this, each entry pairing a
`uri` with the `service` holding it.

Entries are objects rather than URL strings because `service` cannot be
derived reliably from the URL, hostnames being poor platform identifiers:
`inaturalist.nz` is iNaturalist, `waarneming.nl` is Observation.org. It also
leaves room to describe which copy came first, should consumers turn out to
need it, where widening `string[]` to `object[]` later would be a breaking
change.

"External" means outside this lexicon, not outside the AT Protocol network:
an occurrence in another atproto lexicon is as external as an iNaturalist
observation. Reference those by at-uri, which is canonical and does not tie
the reference to one appview, and everything else by canonical web URL. One
`uri` field covers both, since
[`format: uri`](https://atproto.com/specs/lexicon#uri) accepts any scheme
and lists `at`. A separate `atUri` field would duplicate it, and with
neither individually required would leave `required: ["uri"]` unenforceable.

No DwC-DP term covers this. On export the entry URIs concatenate into
`dwc:otherCatalogNumbers`, which did not survive into DwC-DP.
`dwc:ResourceRelationship` models it fully but is an extension class, worth
revisiting as a separate lexicon if third parties ever need to assert
duplicates the author did not declare.

## Namespace

The lexicons use the `bio.lexicons.*` namespace, corresponding to the `lexicons.bio` domain. See the [AT Protocol NSID specification](https://atproto.com/specs/nsid) for how domain-based namespacing works.
