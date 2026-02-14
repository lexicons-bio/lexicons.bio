# Darwin Core Alignment

Field-by-field mapping between lexicons.bio lexicons and [Darwin Core](https://dwc.tdwg.org/) (DwC) / [GBIF](https://www.gbif.org/) standards.

Additional Darwin Core fields can be added to the schemas as community demand demonstrates need.

## Occurrence

`bio.lexicons.temp.occurrence` maps to [dwc:Occurrence](https://dwc.tdwg.org/terms/#occurrence) + [dwc:Event](https://dwc.tdwg.org/terms/#event) + [dwc:Location](https://dwc.tdwg.org/terms/#location).

| Lexicon Field | Darwin Core Term | Notes |
|---------------|-----------------|-------|
| `occurrenceRemarks` | dwc:occurrenceRemarks | — |
| `associatedMedia` | dwc:associatedMedia | AT Protocol blob references |
| `license` | dcterms:license | SPDX identifiers (CC0, CC-BY, etc.) |
| (AT Protocol URI) | dwc:occurrenceID | `at://did:plc:.../bio.lexicons.temp.occurrence/...` |
| (repo owner DID) | dwc:recordedBy | Derived from AT Protocol identity |

### Event Fields

| Lexicon Field | Darwin Core Term | Notes |
|---------------|-----------------|-------|
| `event.eventDate` | dwc:eventDate | ISO 8601 datetime |

### Location Fields

| Lexicon Field | Darwin Core Term | Notes |
|---------------|-----------------|-------|
| `location.decimalLatitude` | dwc:decimalLatitude | Stored as string for precision |
| `location.decimalLongitude` | dwc:decimalLongitude | Stored as string for precision |
| `location.coordinateUncertaintyInMeters` | dwc:coordinateUncertaintyInMeters | — |

## Identification

`bio.lexicons.temp.identification` maps to [dwc:Identification](https://dwc.tdwg.org/list/#identification) with an embedded [dwc:Taxon](https://dwc.tdwg.org/list/#taxon).

### Identification Fields

| Lexicon Field | Darwin Core Term | Notes |
|---------------|-----------------|-------|
| `identificationRemarks` | dwc:identificationRemarks | — |
| (repo commit timestamp) | dwc:dateIdentified | Derived from AT Protocol repo |
| (AT Protocol URI) | dwc:identificationID | — |
| (repo owner DID) | dwc:identifiedBy | — |

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

Darwin Core terms that could be added in future versions as community demand demonstrates need:

| Darwin Core Term | Category | Notes |
|-----------------|----------|-------|
| dwc:basisOfRecord | Record-level | Appview can default to `HumanObservation` for DwC export |
| dwc:occurrenceStatus | Occurrence | Nearly always `present` |
| dwc:individualCount | Occurrence | — |
| dwc:sex | Occurrence | — |
| dwc:lifeStage | Occurrence | — |
| dwc:habitat | Event | — |
| dwc:establishmentMeans | Occurrence | — |
| dwc:behavior | Occurrence | — |
| dwc:verbatimLocality | Location | — |
| dwc:geodeticDatum | Location | WGS84 assumed by default |
| dwc:country / dwc:countryCode | Location | Reverse-geocoded by appview |
| dwc:stateProvince / dwc:county | Location | Reverse-geocoded by appview |
| dwc:identificationQualifier | Identification | `cf.`, `aff.` |
| dwc:reproductiveCondition | Occurrence | — |
| dwc:samplingProtocol | Event | — |
| dwc:specificEpithet | Taxon | — |

## References

- [Darwin Core Quick Reference](https://dwc.tdwg.org/terms/)
- [GBIF Darwin Core Guide](https://www.gbif.org/darwin-core)
- [GBIF Occurrence Download Fields](https://www.gbif.org/developer/occurrence)
- [GBIF Identification History Extension](https://rs.gbif.org/extension/dwc/identification.xml)
