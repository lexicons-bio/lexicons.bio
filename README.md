# lexicons.bio

AT Protocol lexicons for decentralized biodiversity observation data, aligned with [Darwin Core](https://dwc.tdwg.org/) and [GBIF](https://www.gbif.org/) standards.

**[lexicons.bio](https://lexicons.bio)** — Full documentation, field references, and Darwin Core alignment tables.

These lexicons define the record types used by [Observ.ing](https://observ.ing), a decentralized biodiversity observation platform built on the [AT Protocol](https://atproto.com/).

## Lexicons

| NSID | Description |
|------|-------------|
| `bio.lexicons.temp.occurrence` | A biodiversity observation — organism at a place and time |
| `bio.lexicons.temp.identification` | A taxonomic determination for an observation |

## Development

```bash
npm install
npm run dev      # Start dev server
npm run build    # Build for production
```

The site is built with Vite + React + MUI. Lexicon JSON files live in `lexicons/` and Darwin Core terms are sourced from `schemas/dwc/term_versions.csv`.

## License

The lexicon schemas in this repository are licensed under [CC0 1.0 Universal](LICENSE).
