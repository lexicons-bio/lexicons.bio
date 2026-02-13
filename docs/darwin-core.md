# Darwin Core Alignment

Field-by-field mapping between atbio lexicons and [Darwin Core](https://dwc.tdwg.org/) (DwC) / [GBIF](https://www.gbif.org/) standards.

## Occurrence

`org.rwell.test.occurrence` maps to [dwc:Occurrence](https://dwc.tdwg.org/terms/#occurrence) + [dwc:Event](https://dwc.tdwg.org/terms/#event) + [dwc:Location](https://dwc.tdwg.org/terms/#location).

| Lexicon Field | Darwin Core Term | Notes |
|---------------|-----------------|-------|
| `eventDate` | dwc:eventDate | ISO 8601 datetime |
| `basisOfRecord` | dwc:basisOfRecord | Default: `HUMAN_OBSERVATION` |
| `occurrenceStatus` | dwc:occurrenceStatus | Default: `PRESENT` |
| `individualCount` | dwc:individualCount | — |
| `sex` | dwc:sex | GBIF vocabulary: `MALE`, `FEMALE`, `HERMAPHRODITE` |
| `lifeStage` | dwc:lifeStage | GBIF vocabulary: `ADULT`, `JUVENILE`, `LARVA`, etc. |
| `verbatimLocality` | dwc:verbatimLocality | Free-text place description |
| `notes` | dwc:occurrenceRemarks | — |
| `blobs` | dwc:associatedMedia | AT Protocol blob references |
| `license` | dcterms:license | SPDX identifiers (CC0, CC-BY, etc.) |
| `habitat` | dwc:habitat | Free-text habitat description |
| `establishmentMeans` | dwc:establishmentMeans | GBIF vocabulary: `NATIVE`, `INTRODUCED`, etc. |
| `behavior` | dwc:behavior | Free-text behavior description |
| `caste` | dwc:caste | For eusocial species (e.g., `queen`, `worker`) |
| (AT Protocol URI) | dwc:occurrenceID | `at://did:plc:.../org.rwell.test.occurrence/...` |
| (repo owner DID) | dwc:recordedBy | Derived from AT Protocol identity |

### Location Fields

| Lexicon Field | Darwin Core Term | Notes |
|---------------|-----------------|-------|
| `location.decimalLatitude` | dwc:decimalLatitude | Stored as string for precision |
| `location.decimalLongitude` | dwc:decimalLongitude | Stored as string for precision |
| `location.coordinateUncertaintyInMeters` | dwc:coordinateUncertaintyInMeters | — |
| `location.geodeticDatum` | dwc:geodeticDatum | Default: `WGS84` |
| `location.continent` | dwc:continent | — |
| `location.country` | dwc:country | — |
| `location.countryCode` | dwc:countryCode | ISO 3166-1 alpha-2 |
| `location.stateProvince` | dwc:stateProvince | — |
| `location.county` | dwc:county | — |
| `location.municipality` | dwc:municipality | — |
| `location.locality` | dwc:locality | — |
| `location.waterBody` | dwc:waterBody | — |
| `location.minimumElevationInMeters` | dwc:minimumElevationInMeters | — |
| `location.maximumElevationInMeters` | dwc:maximumElevationInMeters | — |
| `location.minimumDepthInMeters` | dwc:minimumDepthInMeters | — |
| `location.maximumDepthInMeters` | dwc:maximumDepthInMeters | — |

## Identification

`org.rwell.test.identification` maps to [dwc:Identification](https://dwc.tdwg.org/list/#identification) with an embedded [dwc:Taxon](https://dwc.tdwg.org/list/#taxon).

### Identification Fields

| Lexicon Field | Darwin Core Term | Notes |
|---------------|-----------------|-------|
| `comment` | dwc:identificationRemarks | — |
| (repo commit timestamp) | dwc:dateIdentified | Derived from AT Protocol repo |
| `identificationQualifier` | dwc:identificationQualifier | `cf.`, `aff.` |
| (AT Protocol URI) | dwc:identificationID | — |
| (repo owner DID) | dwc:identifiedBy | — |
| `isAgreement` | — | Observ.ing extension for community consensus |
| `confidence` | — | Observ.ing extension |

### Taxon Fields

| Lexicon Field | Darwin Core Term | Notes |
|---------------|-----------------|-------|
| `taxon.scientificName` | dwc:scientificName | Required |
| `taxon.scientificNameAuthorship` | dwc:scientificNameAuthorship | — |
| `taxon.taxonRank` | dwc:taxonRank | — |
| `taxon.vernacularName` | dwc:vernacularName | — |
| `taxon.kingdom` | dwc:kingdom | — |
| `taxon.phylum` | dwc:phylum | — |
| `taxon.class` | dwc:class | — |
| `taxon.order` | dwc:order | — |
| `taxon.family` | dwc:family | — |
| `taxon.genus` | dwc:genus | — |

## Not Yet Implemented

Darwin Core terms that could be added in future versions:

| Darwin Core Term | Category | Priority |
|-----------------|----------|----------|
| dwc:reproductiveCondition | Occurrence | Nice-to-have |
| dwc:samplingProtocol | Event | Nice-to-have |
| dwc:identificationVerificationStatus | Identification | Nice-to-have |
| dwc:specificEpithet | Taxon | Nice-to-have |
| dwc:infraspecificEpithet | Taxon | Nice-to-have |

## References

- [Darwin Core Quick Reference](https://dwc.tdwg.org/terms/)
- [GBIF Darwin Core Guide](https://www.gbif.org/darwin-core)
- [GBIF Occurrence Download Fields](https://www.gbif.org/developer/occurrence)
- [GBIF Identification History Extension](https://rs.gbif.org/extension/dwc/identification.xml)
