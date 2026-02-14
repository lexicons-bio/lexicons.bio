# Guiding Principles

These principles are drawn from Darwin Core, the AT Protocol, and other data standards that have solved similar problems (Dublin Core, Schema.org, ABCD, Bioschemas, Microformats, FAIR/CARE). They guide the design of lexicons.bio.

## Simplicity & Adoption

### Start minimal, extend when needed

Darwin Core's most important strategic bet was choosing simplicity over comprehensiveness. It won massive adoption over the more expressive ABCD standard because it was flat, minimal, and easy to implement. Define only terms with shared demand. You can always add fields and record types; removing them is nearly impossible.

### Lower barriers for publishers

No mandatory fields. An observation with just a date, a location, and a photo should be valid. Darwin Core explicitly accepts that imperfect data is preferable to no data. Schema.org takes the same stance: different sites naturally have different amounts of information available, and schema designers cannot anticipate this. Expertise should be optional, not required.

### 80/20 rule

Cover the most common biodiversity observation use cases. Don't try to represent every possible Darwin Core field. Microformats and Darwin Core both counsel: solve the common case well, and leave edge cases to extensions.

## Openness & Extensibility

### Open by default

Use open sets (`knownValues`) over closed sets (`enum`). Third parties should be able to add values, record types, and behaviors without permission. This is a core AT Protocol design principle and reflects Darwin Core's deliberate choice not to prescribe controlled vocabularies.

### Modular through sidecar records

Keep each record type focused on one concept. Add new capabilities as new record types (sidecars), not by expanding existing schemas. This mirrors the Darwin Core Archive star schema and the AT Protocol pattern of sidecar records. The occurrence/identification split embodies this: observations and taxonomic determinations are separate concerns with separate authorship.

### Graduated maturity

Use `.temp.` namespaces to signal schema stability. Experimental schemas can graduate to stable through community adoption and review. Schema.org uses a "pending" mechanism for the same purpose. Darwin Core supports a proof-of-concept pathway where extensions can later be promoted into core.

## Interoperability & Standards

### Reuse established vocabularies

Align with Darwin Core field names, GBIF standards, and Dublin Core where applicable. Never reinvent what exists. This is the single most emphasized recommendation across W3C, Microformats, Bioschemas, and EML.

### Bidirectional alignment with Darwin Core

Maintain clear, documented mappings between lexicon fields and Darwin Core terms. Data should be exportable to Darwin Core Archive format so that observations made on the AT Protocol can flow into GBIF and the broader biodiversity data ecosystem.

### FAIR by design

- **Findable**: AT-URIs provide globally unique identifiers; appviews serve as searchable indexes.
- **Accessible**: The AT Protocol is open and free; data persists across personal data stores, not a single server.
- **Interoperable**: Lexicons use a formal schema language aligned with Darwin Core.
- **Reusable**: The `license` field supports clear data usage licensing. Cryptographic signing provides provenance. Darwin Core alignment satisfies domain-relevant community standards.

## Decentralization & Ownership

### Decentralized by default

Data lives with its creator. The system should function without any single point of authority or failure. Each observer owns their observation data in their personal data server (PDS) and can migrate between providers.

### User-owned, community-enriched

Observations belong to observers; identifications are contributed by the community. Separate authorship from curation. The `strongRef` pattern (URI + CID) provides immutable, content-addressed links that preserve the provenance chain: who observed what, who identified it, and when.

### Immutable once published

Schemas cannot change constraints after publication. In a decentralized context there is no reliable mechanism to update all data records in the network. Evolution happens through optional additions or new NSIDs.

## Pragmatism

### Humans first, machines second

Field names should be recognizable to anyone familiar with biodiversity data. Visible, human-verifiable data is more accurate data. Because observation data is visible to the community for identification and quality review, human verification is built into the system's social design.

### Enforcement belongs in applications, not the standard

Darwin Core's most important philosophical stance: the standard accepts warts-and-all data. Data quality validation is a downstream concern. The lexicons define structure and semantics, not gatekeep.

### Pragmatism over purity

The AT Protocol chose a document-oriented model over RDF because it is more intuitive for software engineers. Dublin Core's Dumb-Down Principle says: ignore what you don't understand, and the remaining value should still be useful. Prioritize what works over what is theoretically elegant.

## Governance

### Community-driven, open process

Every successful standard emphasizes this. Darwin Core uses public forums, 30-day review periods, and Technical Architecture Group review. The lexicons.bio namespace should be governed by the community that uses it, not dictated top-down.

### Ethical data stewardship

Consider the CARE Principles (Collective Benefit, Authority to Control, Responsibility, Ethics) alongside FAIR, especially for sensitive species locations and any data involving Indigenous knowledge.

## The Meta-Lesson

Darwin Core's success can be distilled to a single strategic bet: simplicity and low barriers to entry will produce more aggregate value through massive adoption than comprehensiveness will through precise representation. ABCD was more expressive but more complex, and achieved far less adoption. Darwin Core accepted reduced expressiveness in exchange for a standard that anyone could implement with a spreadsheet, then layered extensibility on top.

lexicons.bio is making the same bet for the decentralized era: a simple, modular set of AT Protocol record types that any developer can implement, aligned with the vocabulary the biodiversity community already knows, with extensibility through sidecar records rather than schema bloat.
