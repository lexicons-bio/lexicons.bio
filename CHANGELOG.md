# Changelog

All notable changes to the lexicons.bio schemas are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

NSIDs include the version as a segment (e.g. `bio.lexicons.temp.v0-1.occurrence`).
The `temp.` prefix marks the schemas as not yet stable — breaking changes may
ship in subsequent versions until the prefix is dropped.

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
