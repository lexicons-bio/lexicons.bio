# Changelog

All notable changes to the lexicons.bio schemas are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

NSIDs include the version as a segment (e.g. `bio.lexicons.temp.v0-1.occurrence`).
The `temp.` prefix marks the schemas as not yet stable — breaking changes may
ship in subsequent versions until the prefix is dropped.

## [Unreleased]

### Added
- `bio.lexicons.temp.v0-1.comment` — attributed, independently licensable
  free text about another record. `subject` is an `at-uri` (not a strongRef)
  so the comment survives edits to its subject, with optional `subjectCid`
  recording the version the author was reading. `dwcTerm` names the Darwin
  Core remarks column the body fulfills, which is what lets a decentralized
  comment round-trip into a DwC-DP row. DwC-DP has no comment or remark
  entity — remarks are string columns on parent tables — so this is not a
  1:1 mapping; the closest shape is `Assertion`, whose name is left free for
  actual assertions. `license` extends DwC-DP's UsagePolicy concept, which
  the standard attaches only to media and material entities, to authored
  text. Threading (`root`) and content signals are deliberately out of
  scope. Relevant to #42.

### Removed
- `bio.lexicons.temp.v0-1.identification.identificationRemarks` — replaced by
  a comment with `dwcTerm: "identificationRemarks"`. PR #6 already removed
  `occurrenceRemarks` from occurrence on the reasoning in #5; leaving
  identification's inline remarks in place would hold two contradictory
  positions in one release. **Breaking.**

### Changed
- `bio.lexicons.temp.v0-1.media.license` — replace SPDX identifiers
  (`CC-BY-4.0`, …) with license URIs
  (`https://creativecommons.org/licenses/by/4.0/`, …). SPDX is primarily
  a software-license vocabulary, while Dublin Core `dcterms:license`
  expects a URI of the license document. Closes #15.

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
