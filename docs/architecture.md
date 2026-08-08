# Architecture & Design Decisions

## Record Relationships

The lexicons follow a star schema with the occurrence record at the center. Identifications reference occurrences, occurrences reference media, and comments reference whatever record they are about. Most of these links use `com.atproto.repo.strongRef` — a pair of URI + CID that creates an immutable, content-addressed link — but comments deliberately do not; see [Reference Strength](#reference-strength-strongref-vs-at-uri).

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

Fields using `knownValues`: `license`, `taxonRank`, `organismQuantityType`, `dwcTerm`

### Reference Strength: `strongRef` vs `at-uri`

AT Protocol's `com.atproto.repo.strongRef` contains:
- **`uri`**: The AT Protocol URI (`at://did/collection/rkey`)
- **`cid`**: Content identifier (hash of the record content)

The CID ensures that a reference always points to a specific version of the target record. If the target is updated, the CID changes, making the reference point to the historical version.

That is the right behavior when a reference means *this exact version* and the wrong behavior when it means *this thing, whatever version*. The rule:

- **`strongRef`** — the reference is to a specific version, and pointing at a later version would change what the referring record claims. Used by `identification.occurrence`, `occurrence.acceptedIdentificationID`, and `occurrence.media`.
- **`at-uri`** (a bare `uri` string, `format: "at-uri"`) — the reference is to the record's identity, and must survive edits to the target. Used by `comment.subject`: a comment on an occurrence is still a comment on that occurrence after its coordinates are corrected. This also matches how DwC-DP joins tables — on `occurrenceID`, which has no version component.

Where the version genuinely matters to a version-less reference, record it as a separate optional field rather than by strengthening the link. `comment.subjectCid` does this: it captures which version the author was reading (so a client can show that the subject has since changed), without making the association itself depend on the CID.

### Authored Text as Separate Records

Occurrence facts — coordinates, dates, counts — are not works of authorship, so they carry no `license`. Prose is, so it lives in records that can be attributed and licensed on their own: `media` for images, `comment` for text. This is why the record lexicons carry no inline `*Remarks` string fields.

Darwin Core stores remarks as string columns on the parent table, and DwC-DP has no comment or remark entity of its own. A comment with `dwcTerm` set is the bridge: an aggregator rebuilding a DwC-DP row reads `dwcTerm` to know which column the body belongs in. For a given term, the fulfilling comment is the newest one authored by the subject record's own author. Nothing enforces that cardinality at the schema level — resolution is the consumer's job, and the subject record holds no forward reference back to the comment (which would churn the subject's CID on every edit to its prose, staling the identifications that strongRef it).

DwC-DP's closest analogue is `Assertion`, whose shape a comment nearly matches (`assertionType` / `assertionValue` / `assertionMadeDate` / `assertionByID`). The name is deliberately not reused: DwC-DP defines an assertion as a measurement of or fact about a resource, which is the facts-vs-creative-works distinction this separation exists to draw, and leaves the term free for actual assertions (counts, body length, sex, vitality) later. Likewise DwC-DP attaches its `UsagePolicy` (license, rights, rightsHolder, credit) only to media and material entities, never to occurrences or events — `comment.license` extends that same concept to text.

### Coordinates as Strings

Latitude and longitude are stored as strings rather than numbers to preserve exact decimal precision. Floating-point representation can introduce rounding artifacts (e.g., `37.7749` might become `37.774899999999997`). String storage preserves the user's original coordinate values exactly.

## Namespace

The lexicons use the `bio.lexicons.*` namespace, corresponding to the `lexicons.bio` domain. See the [AT Protocol NSID specification](https://atproto.com/specs/nsid) for how domain-based namespacing works.
