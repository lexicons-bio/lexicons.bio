# Taxonomy Curation on AT Protocol

How iNaturalist's curator system could work on AT Protocol, and the design challenges involved.

## What iNaturalist Curators Do

iNaturalist curators manage a centralized taxonomy tree. Their key operations:

| Operation | Inputs | Outputs | Example |
|-----------|--------|---------|---------|
| **Taxon Swap** | 1 taxon | 1 taxon | Species moved to a new genus |
| **Taxon Split** | 1 taxon | Many taxa | Species divided into distinct species |
| **Taxon Merge** | Many taxa | 1 taxon | Synonymize multiple taxa into one |
| **Taxon Drop** | 1 taxon | None | Deactivate without replacement |

When a taxon change is committed:
1. Input taxa are **deactivated** (not deleted — history is preserved)
2. Output taxa are **activated**
3. All identifications of the input are marked `is_current = false`
4. New identifications of the output are created for each affected user
5. Affected observers/identifiers are notified
6. Users who opted out of automatic updates are skipped

### How Splits Work (the hard case)

Splits are the most destructive operation. When species A is split into B and C:
- If the system has geographic atlases for B and C, it can auto-assign observations based on coordinates
- If it can't disambiguate, identifications fall back to the closest common ancestor (e.g., the genus) — effectively coarsening the ID
- Child taxa must be manually moved to the appropriate output

### External Authorities

iNaturalist follows compiled secondary authorities (Clements for birds, POWO for plants, ASM for mammals, etc.) rather than individual papers. This avoids curator disputes: "Following authorities helps us avoid having these arguments on iNat."

Groups without designated authorities (fungi, most insects) are curated ad hoc from primary literature, leading to more disputes.

## The Fundamental Challenge on AT Protocol

iNaturalist's system is centralized: one taxonomy tree, one database, one set of curators mutating shared state. AT Protocol is the opposite:

- **You can only write records in your own repository.** There is no shared mutable state.
- **Records are content-addressed.** A strongRef (URI + CID) pins to a specific version. When the target changes, the CID becomes stale.
- **There is no built-in referential integrity.** The protocol doesn't enforce that references resolve.
- **There is no concept of roles or permissions** at the protocol level. Curator status would be an application-level concept.

This means the iNaturalist model — where curators edit a shared taxonomy tree and changes propagate to all observations — cannot work directly. Every piece of it needs to be reimagined.

## Approach: Taxon Changes as Records, Propagation in the Appview

The only viable architecture separates concerns:
- **Records in user repos** declare intentions and data
- **The appview** aggregates, validates, and propagates changes
- **Labels** signal status and quality

### Taxon Change Records

A curator would create taxon change records in their own repo:

```json
{
  "$type": "bio.lexicons.temp.v0-1.taxonSwap",
  "inputName": "Aphelocoma coerulescens",
  "inputAuthority": "gbif:2482550",
  "outputName": "Aphelocoma coerulescens",
  "outputAuthority": "gbif:2482550",
  "description": "Reclassification per Clements 2024",
  "source": "https://doi.org/...",
  "createdAt": "2024-06-15T10:00:00Z"
}
```

For splits, the record would reference multiple outputs. For merges, multiple inputs.

### How Propagation Would Work

1. Curator creates a taxon change record in their repo
2. The appview receives it via the firehose
3. The appview validates the curator's authority (are they a recognized curator for this group?)
4. The appview finds all identifications matching the input taxon
5. **The appview cannot modify those identifications** — they live in other users' repos
6. Instead, the appview:
   - Updates its internal taxonomy index
   - Re-resolves the community taxon for affected observations using the new taxonomy
   - Displays the updated taxonomy to users
   - Notifies affected users that their identification's taxon has been reclassified

### What the Appview Can't Do

The critical difference from iNaturalist: **the appview cannot create new identification records on behalf of users.** In iNaturalist, a taxon swap creates a new `is_current = true` identification for each affected user. On AT Protocol, each user's records are in their own signed repo — only they can create records there.

Options for handling this:

**Option A: Appview-level resolution only.** The appview maintains a synonym/reclassification table. When it encounters an identification for "Aphelocoma coerulescens" and knows that name has been swapped, it displays the current accepted name instead. The underlying record is unchanged. This is the simplest approach and works without any user action.

**Option B: User-initiated updates.** The appview notifies affected users and provides a tool to create a new identification with the updated name. The old identification remains in their repo. This preserves user agency but requires action.

**Option C: PDS-level automation.** A user could authorize a service to write records on their behalf (via OAuth/app passwords). This is technically possible but raises trust and complexity concerns.

**Recommendation: Option A for v1.** The appview resolves synonyms transparently. Users see current names. The raw data preserves what was originally written. This matches Darwin Core's principle of preserving original data while allowing interpretation layers.

## Curator Identity

### Who Is a Curator?

On iNaturalist, curator status is granted by staff. On AT Protocol, there's no central authority. Options:

**Labeler-based curation.** A labeler service (like Bluesky's moderation labelers) could:
- Maintain a list of recognized curators (by DID)
- Apply labels to taxon change records: `curator-verified`, `authority-aligned`, `disputed`
- Apply labels to identifications: `needs-update`, `synonym-detected`
- Users choose which taxonomy labelers to trust

**DID-based trust lists.** The appview maintains a list of DIDs whose taxon change records it accepts. This is effectively a curator roster. Multiple appviews could have different curator lists, leading to different taxonomic interpretations of the same underlying data.

**Authority-linked curation.** Curators declare which external authority they follow (e.g., "I follow Clements for birds"). The appview can cross-reference taxon changes against the declared authority. This distributes the "which authority to follow" decision.

### Multiple Appviews, Multiple Taxonomies

This is both a feature and a challenge. Different appviews could:
- Follow different authorities (Clements vs IOC for birds)
- Recognize different curators
- Resolve synonyms differently

The underlying data (identification records) is the same across all appviews. Only the interpretation differs. This is conceptually clean but could confuse users who see different species names on different apps.

## Taxon Change Scenarios on AT Protocol

### Species Renamed (Swap)

1. Curator creates a `taxonSwap` record: "Aphelocoma coerulescens" → "Aphelocoma coerulescens" (new authority reference)
2. Appview adds the mapping to its synonym table
3. Existing identifications with `scientificName: "Aphelocoma coerulescens"` are displayed with the current accepted name
4. New identifications use the current name from the app's autocomplete

### Species Split

1. Curator creates a `taxonSplit` record: "Aphelocoma coerulescens" → ["Aphelocoma coerulescens" (Florida), "Aphelocoma woodhouseii" (Western)]
2. Appview marks the input name as inactive in its index
3. For existing identifications of the input:
   - If the observation has coordinates and the appview has range data, it can infer the output
   - Otherwise, the appview can only resolve to the common ancestor (genus *Aphelocoma*)
4. The appview notifies affected users to submit new identifications with the correct output species
5. Until users update, the observation's community taxon may be coarsened to genus level

### Species Merged

1. Curator creates a `taxonMerge` record: ["Species A", "Species B"] → "Species C"
2. Appview resolves all identifications of A or B to C
3. Simple case — no geographic disambiguation needed

## What This System Cannot Do (vs. iNaturalist)

| Capability | iNaturalist | AT Protocol |
|-----------|-------------|-------------|
| Automatically create new IDs for affected users | Yes | No — users must create their own records |
| Edit the taxonomy tree in place | Yes — centralized DB | No — appview maintains its own index |
| Enforce a single taxonomy across all clients | Yes | No — different appviews can differ |
| Roll back a bad taxon change | Yes — revert in DB | Partially — curator can create a counter-change |
| Transfer conservation statuses on swap | Yes — automatic | Appview-level only |
| Geographic auto-assignment on split | Yes — with atlases | Possible if appview has range data |

## Proposed Lexicons

These are speculative — only needed if taxonomy curation becomes a priority.

### `bio.lexicons.temp.v0-1.taxonSwap`

```json
{
  "lexicon": 1,
  "id": "bio.lexicons.temp.v0-1.taxonSwap",
  "defs": {
    "main": {
      "type": "record",
      "key": "tid",
      "record": {
        "type": "object",
        "required": ["inputName", "outputName"],
        "properties": {
          "inputName": { "type": "string", "description": "Scientific name being replaced." },
          "outputName": { "type": "string", "description": "Replacement scientific name." },
          "description": { "type": "string", "description": "Justification for the change." },
          "source": { "type": "string", "format": "uri", "description": "Citation or reference URL." },
          "authority": { "type": "string", "description": "External authority (e.g., 'Clements 2024')." },
          "createdAt": { "type": "string", "format": "datetime" }
        }
      }
    }
  }
}
```

### `bio.lexicons.temp.v0-1.taxonSplit`

```json
{
  "lexicon": 1,
  "id": "bio.lexicons.temp.v0-1.taxonSplit",
  "defs": {
    "main": {
      "type": "record",
      "key": "tid",
      "record": {
        "type": "object",
        "required": ["inputName", "outputNames"],
        "properties": {
          "inputName": { "type": "string" },
          "outputNames": { "type": "array", "items": { "type": "string" } },
          "description": { "type": "string" },
          "source": { "type": "string", "format": "uri" },
          "authority": { "type": "string" },
          "createdAt": { "type": "string", "format": "datetime" }
        }
      }
    }
  }
}
```

### `bio.lexicons.temp.v0-1.taxonMerge`

Same structure as split but with `inputNames` (array) and `outputName` (string).

## Open Questions

1. **Should the appview silently resolve synonyms, or should it make the resolution visible?** iNaturalist shows both the original and updated name. Transparency matters for trust.

2. **How to handle conflicting taxon changes from different curators?** iNaturalist solves this with a single authority per group. A decentralized system could allow competing taxonomies, but this confuses users.

3. **Is taxonomy curation needed for v1?** The current inline approach (approach 1 from taxon-approaches.md) works without any curation infrastructure. The appview's autocomplete can guide users to current names. Curation becomes important only at scale, when outdated names accumulate.

4. **Should taxon change records reference identifications by scientific name (string matching) or by some other mechanism?** String matching is simple but fragile (typos, homonyms). An authority ID (approach 4 from taxon-approaches.md) would make matching more robust.

5. **What's the minimum viable curation?** Possibly just an appview-maintained synonym table, updated manually by operators, without any on-protocol lexicons. Taxon change records on-protocol add transparency and decentralization but also complexity.

## Recommendation

For v1, **don't build taxonomy curation into the protocol.** The current inline flat fields approach works. The appview can maintain a synonym table and guide users to current names via autocomplete. Taxonomy curation is an appview-level concern, not a protocol-level one.

When curation becomes necessary (at scale, when outdated names accumulate), start with:
1. An appview-maintained synonym table sourced from GBIF's backbone
2. A labeler service that flags identifications using outdated names
3. Taxon change records (swap/split/merge) as on-protocol lexicons for transparency

This follows the guiding principle: start minimal, extend when needed.
