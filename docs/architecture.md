# Architecture & Design Decisions

## Record Relationships

The lexicons follow a star schema with the occurrence record at the center. Identifications reference occurrences, occurrences reference media, and occurrences and identifications reference their remarks. Most references use `com.atproto.repo.strongRef`, a pair of URI + CID that creates an immutable, content-addressed link. References to remarks use a bare `at-uri` instead; see [Remarks as Separate Records](#remarks-as-separate-records).

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

Fields using `knownValues`: `license`, `taxonRank`, `dwcTerm`

### `strongRef` for Immutable References

References to a specific version of a record use AT Protocol's `com.atproto.repo.strongRef`, which contains:
- **`uri`**: The AT Protocol URI (`at://did/collection/rkey`)
- **`cid`**: Content identifier (hash of the record content)

The CID ensures that a reference always points to a specific version of the target record. If the target is updated, the CID changes, making the reference point to the historical version.

### Remarks as Separate Records

Darwin Core has many free-text "remarks" terms (`occurrenceRemarks`,
`eventRemarks`, `identificationRemarks`, and others). Unlike coordinates or
dates, that prose is potentially a creative work, so it should be possible
to attribute and license it on its own (see
[#5](https://github.com/lexicons-bio/lexicons.bio/issues/5)). Remarks
therefore live in `remark` records rather than inline strings, the same way
images live in `media` records.

The record being described points to its remarks with an `at-uri` field
named for the Darwin Core term plus an `ID` suffix, e.g.
`occurrence.occurrenceRemarksID`. Everywhere else in these lexicons, a
field named for a Darwin Core term holds that term's value; the suffix
keeps it that way, so a consumer mapping fields by name skips the
reference instead of exporting an at-uri as remarks text. The direction of
that reference matters:

- **Forward references are cheap to resolve.** A client holding an
  occurrence fetches each referenced remark with
  `com.atproto.repo.getRecord`, as it does media. Assembling a complete
  Darwin Core row needs no index.
- **Backlinks are not.** Finding the remark about an occurrence without a
  forward reference needs an AppView or backlink index, or a `listRecords`
  scan of the author's entire remark collection, since `listRecords` cannot
  filter.
- **Cardinality is enforced.** An occurrence has at most one
  `occurrenceRemarksID`, so consumers never need a rule for picking among
  several (though AppViews do).
- **Remarks can't be spoofed.** Author intent is explicit, rather than
  preserved by a convention like most recently-created remark referencing a
  term in the occurrence author's PDS.

The reference is a bare `at-uri`, not a `strongRef`, so editing a remark's
text (a `putRecord` to the same URI) does not change the CID of the record
that references it. The referencing record changes only when a remark is added or
removed. Since neither side carries a CID, a client can generate both
record keys up front and write an occurrence and its remarks in a single
`com.atproto.repo.applyWrites` call.

Each `remark` also names its `subject` and `dwcTerm`, so it is self-describing
when read on its own, and a consumer can check that a forward reference
points at a remark about that record.

`remark` is only for text that fills a Darwin Core term. Discussion
(comments by anyone, replies, threads) has different rules for
authorship, cardinality, editing, and length, and belongs in its own
lexicon.

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
