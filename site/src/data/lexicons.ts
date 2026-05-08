import occurrenceJson from "../../../lexicons/bio/lexicons/temp/v0-1/occurrence.json";
import identificationJson from "../../../lexicons/bio/lexicons/temp/v0-1/identification.json";
import mediaJson from "../../../lexicons/bio/lexicons/temp/v0-1/media.json";
import surveyJson from "../../../lexicons/bio/lexicons/temp/v0-1/survey.json";
import surveyProtocolJson from "../../../lexicons/bio/lexicons/temp/v0-1/surveyProtocol.json";
import surveyTargetJson from "../../../lexicons/bio/lexicons/temp/v0-1/surveyTarget.json";

export interface LexiconDef {
  type: string;
  description?: string;
  key?: string;
  record?: LexiconObject;
  required?: string[];
  properties?: Record<string, LexiconProperty>;
}

export interface LexiconObject {
  type: string;
  description?: string;
  required?: string[];
  properties?: Record<string, LexiconProperty>;
}

export interface LexiconProperty {
  type: string;
  format?: string;
  description?: string;
  ref?: string;
  refs?: string[];
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  default?: string | number | boolean;
  knownValues?: string[];
  items?: LexiconProperty;
  accept?: string[];
  maxSize?: number;
  required?: boolean;
  def?: string;
}

export interface Lexicon {
  lexicon: number;
  id: string;
  defs: Record<string, LexiconDef>;
}

export interface ModelConfig {
  name: string;
  slug: string;
  lexicon: Lexicon;
  classes: string[];
  description: string;
  shortExample: string;
  fullExample: string;
}

export const MODELS: ModelConfig[] = [
  {
    name: "Occurrence",
    slug: "occurrence",
    lexicon: occurrenceJson as unknown as Lexicon,
    classes: ["Event", "Occurrence"],
    description:
      "A biodiversity observation — an organism at a place and time.",
    shortExample: JSON.stringify(
      {
        $type: "bio.lexicons.temp.v0-1.occurrence",
        eventDate: "2024-06-12T08:45:00Z",
        decimalLatitude: "37.8716",
        decimalLongitude: "-122.2727",
      },
      null,
      2
    ),
    fullExample: JSON.stringify(
      {
        $type: "bio.lexicons.temp.v0-1.occurrence",
        eventDate: "2024-06-12T08:45:00Z",
        decimalLatitude: "37.8716",
        decimalLongitude: "-122.2727",
        coordinateUncertaintyInMeters: 15,
        associatedMedia: [
          {
            uri: "at://did:plc:abc123.../bio.lexicons.temp.v0-1.media/3k...",
            cid: "bafyrei...",
          },
        ],
      },
      null,
      2
    ),
  },
  {
    name: "Media",
    slug: "media",
    lexicon: mediaJson as unknown as Lexicon,
    classes: ["Media"],
    description:
      "An image associated with an observation, with alt text and license.",
    shortExample: JSON.stringify(
      {
        $type: "bio.lexicons.temp.v0-1.media",
        image: {
          $type: "blob",
          ref: { $link: "bafyrei..." },
          mimeType: "image/jpeg",
          size: 204800,
        },
        alt: "California Scrub-Jay perched on oak branch",
        license: "CC-BY-4.0",
      },
      null,
      2
    ),
    fullExample: JSON.stringify(
      {
        $type: "bio.lexicons.temp.v0-1.media",
        image: {
          $type: "blob",
          ref: { $link: "bafyrei..." },
          mimeType: "image/jpeg",
          size: 204800,
        },
        alt: "California Scrub-Jay perched on oak branch",
        aspectRatio: { width: 4032, height: 3024 },
        license: "CC-BY-4.0",
      },
      null,
      2
    ),
  },
  {
    name: "Identification",
    slug: "identification",
    lexicon: identificationJson as unknown as Lexicon,
    classes: ["Identification"],
    description: "A taxonomic determination for an observation.",
    shortExample: JSON.stringify(
      {
        $type: "bio.lexicons.temp.v0-1.identification",
        occurrence: {
          uri: "at://did:plc:abc123.../bio.lexicons.temp.v0-1.occurrence/3k...",
          cid: "bafyrei...",
        },
        scientificName: "Aphelocoma californica",
        taxonRank: "species",
      },
      null,
      2
    ),
    fullExample: JSON.stringify(
      {
        $type: "bio.lexicons.temp.v0-1.identification",
        occurrence: {
          uri: "at://did:plc:abc123.../bio.lexicons.temp.v0-1.occurrence/3k...",
          cid: "bafyrei...",
        },
        scientificName: "Aphelocoma californica (Vigors, 1839)",
        taxonRank: "species",
        identificationRemarks:
          "Blue head and wings, white eyebrow, gray-brown back — classic California Scrub-Jay",
      },
      null,
      2
    ),
  },
  {
    name: "Survey",
    slug: "survey",
    lexicon: surveyJson as unknown as Lexicon,
    classes: ["Survey"],
    description:
      "An event where organism occurrence data is collected according to a Protocol.",
    shortExample: JSON.stringify(
      {
        $type: "bio.lexicons.temp.v0-1.survey",
        protocol: {
          uri: "at://did:plc:abc123.../bio.lexicons.temp.v0-1.surveyProtocol/3k...",
          cid: "bafyrei...",
        },
        createdAt: "2024-06-12T08:45:00Z",
      },
      null,
      2
    ),
    fullExample: JSON.stringify(
      {
        $type: "bio.lexicons.temp.v0-1.survey",
        protocol: {
          uri: "at://did:plc:abc123.../bio.lexicons.temp.v0-1.surveyProtocol/3k...",
          cid: "bafyrei...",
        },
        createdAt: "2024-06-12T08:45:00Z",
        location: {
          $type: "org.atgeo.place",
          name: "Point Reyes National Seashore",
          locations: [
            {
              $type: "community.lexicon.location.geo",
              latitude: "38.0956",
              longitude: "-122.8792",
            },
          ],
        },
        eventDate: "2024-06-12",
        eventDurationValue: 90,
        eventDurationUnit: "minutes",
        surveyorCount: 3,
        samplingPerformedByID: ["did:plc:def456...", "did:plc:ghi789..."],
      },
      null,
      2
    ),
  },
  {
    name: "SurveyProtocol",
    slug: "surveyProtocol",
    lexicon: surveyProtocolJson as unknown as Lexicon,
    classes: ["Survey Protocol"],
    description:
      "Defines the contents of a Survey, including what participants should look for and what fields they must fill out.",
    shortExample: JSON.stringify(
      {
        $type: "bio.lexicons.temp.v0-1.surveyProtocol",
        title: "Breeding Bird Atlas Block Survey",
        description: "Standardized point-count protocol for breeding bird atlas blocks.",
        createdAt: "2024-01-15T00:00:00Z",
      },
      null,
      2
    ),
    fullExample: JSON.stringify(
      {
        $type: "bio.lexicons.temp.v0-1.surveyProtocol",
        title: "Breeding Bird Atlas Block Survey",
        description: "Standardized point-count protocol for breeding bird atlas blocks.",
        createdAt: "2024-01-15T00:00:00Z",
        requiredFields: ["eventDate", "eventDuration"],
        locationOptions: [
          {
            $type: "org.atgeo.place",
            name: "Block 37N-122W-A",
          },
          {
            $type: "org.atgeo.place",
            name: "Block 37N-122W-B",
            locations: [
              {
                $type: "community.lexicon.location.geo",
                latitude: "37.8031",
                longitude: "-122.2576",
              },
            ],
          },
          {
            $type: "org.atgeo.place",
            name: "Block 37N-122W-C",
            locations: [
              {
                $type: "community.lexicon.location.geo",
                latitude: "37.811890",
                longitude: "-122.269034",
              },
              {
                $type: "community.lexicon.location.address",
                country: "US",
                region: "CA",
                locality: "Oakland",
                postalCode: "94609",
                street: "Telegraph Ave & West Grand Ave",
              },
            ],
          },
        ],
      },
      null,
      2
    ),
  },
  {
    name: "SurveyTarget",
    slug: "surveyTarget",
    lexicon: surveyTargetJson as unknown as Lexicon,
    classes: ["Survey Target"],
    description: "A subject for a Survey. Belongs to a single Protocol.",
    shortExample: JSON.stringify(
      {
        $type: "bio.lexicons.temp.v0-1.surveyTarget",
        protocol: "at://did:plc:abc123.../bio.lexicons.temp.v0-1.surveyProtocol/3k...",
        scope: [
          {
            $type: "bio.lexicons.temp.v0-1.surveyTarget#taxonScope",
            scientificName: "Aphelocoma californica",
            taxonRank: "species",
          },
        ],
      },
      null,
      2
    ),
    fullExample: JSON.stringify(
      {
        $type: "bio.lexicons.temp.v0-1.surveyTarget",
        protocol: "at://did:plc:abc123.../bio.lexicons.temp.v0-1.surveyProtocol/3k...",
        scope: [
          {
            $type: "bio.lexicons.temp.v0-1.surveyTarget#taxonScope",
            scientificName: "Aphelocoma californica",
            taxonRank: "species",
            vernacularName: "California Scrub-Jay",
            kingdom: "Animalia",
            taxonID: "https://www.gbif.org/species/2482414",
          },
        ],
      },
      null,
      2
    ),
  },
];

/** Lexicon field -> DwC term_localName (when names differ) */
export const FIELD_TO_DWC: Record<string, string> = {};

/** Fields that are AT Protocol infrastructure (no DwC mapping) */
export const ATPROTO_FIELDS = new Set([
  "occurrence",
  "image",
  "alt",
  "aspectRatio",
  "width",
  "height",
]);

/** GBIF publishing requirements */
export const GBIF_REQUIRED = new Set([
  "occurrenceID",
  "scientificName",
  "eventDate",
]);

export const GBIF_RECOMMENDED = new Set([
  "taxonRank",
  "kingdom",
  "decimalLatitude",
  "decimalLongitude",
]);

/** Get properties and required set from a def body */
export function getDefProperties(
  def: LexiconDef
): { properties: Record<string, LexiconProperty>; required: Set<string> } {
  let props = def.properties ?? {};
  let required = new Set(def.required ?? []);
  if (Object.keys(props).length === 0 && def.record) {
    props = def.record.properties ?? {};
    required = new Set(def.record.required ?? []);
  }
  return { properties: props, required };
}

/** Get all properties flattened across all defs */
export function getFlatProperties(
  lexicon: Lexicon
): Record<string, LexiconProperty & { required: boolean; def: string }> {
  const result: Record<
    string,
    LexiconProperty & { required: boolean; def: string }
  > = {};
  for (const [defName, defBody] of Object.entries(lexicon.defs)) {
    const { properties, required } = getDefProperties(defBody);
    for (const [fieldName, fieldMeta] of Object.entries(properties)) {
      result[fieldName] = {
        ...fieldMeta,
        required: required.has(fieldName),
        def: defName,
      };
    }
  }
  return result;
}

/** Get a human-readable type label for a property */
export function typeLabel(prop: LexiconProperty): string {
  const t = prop.type ?? "";
  const fmt = prop.format ?? "";
  if (t === "ref") {
    const ref = prop.ref ?? "";
    if (ref.startsWith("#")) return ref;
    return ref || "ref";
  }
  if (t === "union") {
    const refs = prop.refs ?? [];
    return refs.length ? `(${refs.join(" | ")})` : "union";
  }
  if (t === "array") {
    const items = prop.items;
    if (items) {
      const inner = items.type ?? "";
      if (inner === "ref") {
        const ref = items.ref ?? "";
        if (ref.startsWith("#")) return `${ref}[]`;
        return ref ? `${ref}[]` : "ref[]";
      }
      if (inner === "union") {
        const refs = items.refs ?? [];
        return refs.length ? `(${refs.join(" | ")})[]` : "union[]";
      }
      return inner ? `${inner}[]` : "array";
    }
    return "array";
  }
  if (fmt) return fmt;
  return t;
}

/** Get a human-readable constraints label */
export function constraintsLabel(prop: LexiconProperty): string {
  const parts: string[] = [];
  if (prop.maxLength !== undefined) parts.push(`max ${prop.maxLength}`);
  if (prop.minimum !== undefined) parts.push(`min ${prop.minimum}`);
  if (prop.maximum !== undefined) parts.push(`max ${prop.maximum}`);
  if (prop.default !== undefined) parts.push(`default: ${prop.default}`);
  if (prop.knownValues) {
    if (prop.knownValues.length <= 4) {
      parts.push(prop.knownValues.join(" | "));
    } else {
      parts.push(`${prop.knownValues.length} values`);
    }
  }
  return parts.join(", ");
}
