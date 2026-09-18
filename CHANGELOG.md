# Changelog

All notable changes to the lexicons.bio schemas are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

NSIDs include the version as a segment (e.g. `bio.lexicons.temp.v0-1.occurrence`).
The `temp.` prefix marks the schemas as not yet stable — breaking changes may
ship in subsequent versions until the prefix is dropped.

## [Unreleased]

### Added
- `bio.lexicons.temp.v0-1.occurrence.externalRecords` — an array of
  `#externalRecord` (`uri`, `service`) tracking the same occurrence as held
  outside this lexicon, whether in another AT Protocol lexicon or on a
  service outside the network, for cross-linking and cross-platform
  deduplication.
- `bio.lexicons.temp.v0-1.remark` — free text filling a Darwin Core remarks
  term on another record, with its own license, so authored prose can be
  attributed and licensed separately from the facts it describes (#5, #42).
- `bio.lexicons.temp.v0-1.occurrence.occurrenceRemarksID`,
  `bio.lexicons.temp.v0-1.occurrence.eventRemarksID`, and
  `bio.lexicons.temp.v0-1.identification.identificationRemarksID` —
  `at-uri` references to `remark` records in the same repository.

### Changed
- `bio.lexicons.temp.v0-1.media.license` — replace SPDX identifiers
  (`CC-BY-4.0`, …) with license URIs
  (`https://creativecommons.org/licenses/by/4.0/`, …). SPDX is primarily
  a software-license vocabulary, while Dublin Core `dcterms:license`
  expects a URI of the license document. Closes #15.

### Removed
- `bio.lexicons.temp.v0-1.identification.identificationRemarks` — the inline
  string is superseded by `identificationRemarksID`. Existing records that
  set it still validate, since undeclared fields are ignored, but consumers
  following the schema will no longer read it.

## [0.1] — 2026-04-27

Initial tagged release. Three record types under `bio.lexicons.temp.v0-1.*`.

### Added
- `bio.lexicons.temp.v0-1.occurrence` — a biodiversity observation (organism
  at a place and time), aligned with Darwin Core / DwC-DP `Occurrence` and
  `Event` classes. Flattened record with no required fields; coordinates
  stored as strings to preserve decimal precision.
- `bio.lexicons.temp.v0-1.identification` — a taxonomic determination
  referencing an occurrence via strongRef. MVP field set: `scientificName`,
  `taxonRank`, `kingdom`, `identificationRemarks`.
- `bio.lexicons.temp.v0-1.media` — image blobs with alt text, aspect ratio,
  and SPDX license, referenced from occurrences via strongRef.
