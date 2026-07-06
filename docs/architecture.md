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

The **only** sanctioned exception is the open-union pattern below, which is constrained so that it never removes a Darwin Core term from where an exporter expects it.

### Open Unions for Anticipated In-Network References

Some fields hold an *external identifier today* but have a concrete, anticipated future as an *in-network AT Protocol record*. The first case is `identification.taxonRef`: an external taxon identifier now (`dwc:taxonID`), a `strongRef` to a future in-network `Taxon` record later. Modeling the field as an open `union` reserves that shape so the second variant can be added **additively**, instead of changing the field's type (which would be breaking).

This is the general ruleset. Apply it whenever a field is a candidate for this treatment; if a field doesn't clear rule&nbsp;1, keep it flat.

**1. When to use a union (and when not to).** Use an open union *only* when the value has a concrete, nameable future as an in-network record — e.g. `taxonID` → `Taxon`, `identifiedBy` → an actor/profile record. Pure descriptive data with no plausible in-network counterpart (`scientificName`, `eventDate`, coordinates, remarks) stays flat. Do **not** wrap speculatively: additivity alone is not a reason (see rule&nbsp;2).

**2. The union is not required merely to stay additive.** Adding a new *optional* field later is itself non-breaking. The union earns its place only when you want a **single** field to hold either representation, so consumers read one field ("the taxon this identification points at") regardless of whether the target is external or in-network. If you'd be content with two separate fields, don't use a union — keep it flat and add the second field when it exists.

**3. Naming (mirrors [`app.bsky.embed`](https://github.com/bluesky-social/atproto/tree/main/lexicons/app/bsky/embed)).**
- Field name: `<concept>Ref` — it reads as *a reference to* a concept, not a container *for* it. Use `taxonRef`, not `taxon`. This avoids the expectation that sibling descriptors (`scientificName`, `taxonRank`, `kingdom`) should nest inside it, and avoids colliding with a possible future `bio.lexicons.<concept>` lexicon.
- Variants are defined in `bio.lexicons.temp.v<ver>.defs`.
- The external-identifier variant is a def named `<concept>External`.
- The in-network variant reuses `com.atproto.repo.strongRef` directly — no bespoke def.

**4. Darwin Core leaf-key invariant (this is what keeps unions DwC-lossless).** Every Darwin Core term appears exactly once in the record tree, as a **leaf key whose name is the DwC term's `localName`, verbatim** (`taxonID`). Wrapping may add structure *above* the leaf but must never rename, move, or drop it. The wrapper field (`taxonRef`) is AT Protocol structure — it is **not** a DwC term and carries no DwC mapping of its own. On DwC-A / DwC-DP export the union flattens to its active variant's leaves: the external variant contributes the `taxonID` column; the `strongRef` variant contributes no DwC column (the referenced in-network record carries the term itself). Because the leaf key is unchanged, the exported DwC column set is identical to the flat design — the wrapping is DwC-lossless by construction.

**5. Tooling resolves DwC at the leaf.** DwC alignment in the docs site must be resolved at the leaf, not only by top-level field name. Concretely: the wrapper field is registered in `ATPROTO_FIELDS` (structure, no direct mapping), and `FieldTable` / `DwcAlignmentTable` recurse into union-def leaves and map them by leaf name. Without this, a wrapped term such as `dwc:taxonID` renders as *unmapped* even though the data carries it. (This recursion is not yet implemented — it is the outstanding follow-up for #40.)

**Checklist for a new field.**
1. Is there a concrete future in-network record for this value? No → keep it flat, stop here. Yes → continue.
2. Would a single unified field genuinely beat two separate fields? No → keep it flat, add the second field later. Yes → continue.
3. Name the field `<concept>Ref`.
4. Add a `<concept>External` def in `defs`, placing the DwC value on a leaf keyed to the DwC `localName`.
5. Set the union `refs` to `[defs#<concept>External]` now; reserve `com.atproto.repo.strongRef` for the in-network variant.
6. Verify the leaf-key invariant holds and the alignment table shows the term mapped.

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
