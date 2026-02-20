import occurrenceJson from "../../../lexicons/bio/lexicons/temp/occurrence.json";
import identificationJson from "../../../lexicons/bio/lexicons/temp/identification.json";

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
    classes: ["Occurrence", "Event", "Location", "Record-level"],
    description:
      "A biodiversity observation — an organism at a place and time.",
    shortExample: JSON.stringify(
      {
        $type: "bio.lexicons.temp.occurrence",
        eventDate: "2024-06-12T08:45:00Z",
        decimalLatitude: "37.8716",
        decimalLongitude: "-122.2727",
      },
      null,
      2
    ),
    fullExample: JSON.stringify(
      {
        $type: "bio.lexicons.temp.occurrence",
        eventDate: "2024-06-12T08:45:00Z",
        decimalLatitude: "37.8716",
        decimalLongitude: "-122.2727",
        coordinateUncertaintyInMeters: 15,
        associatedMedia: [
          {
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
        ],
      },
      null,
      2
    ),
  },
  {
    name: "Identification",
    slug: "identification",
    lexicon: identificationJson as unknown as Lexicon,
    classes: ["Identification", "Taxon"],
    description: "A taxonomic determination for an observation.",
    shortExample: JSON.stringify(
      {
        $type: "bio.lexicons.temp.identification",
        subject: {
          uri: "at://did:plc:abc123.../bio.lexicons.temp.occurrence/3k...",
          cid: "bafyrei...",
        },
        scientificName: "Aphelocoma californica",
        taxonRank: "species",
        vernacularName: "California Scrub-Jay",
      },
      null,
      2
    ),
    fullExample: JSON.stringify(
      {
        $type: "bio.lexicons.temp.identification",
        subject: {
          uri: "at://did:plc:abc123.../bio.lexicons.temp.occurrence/3k...",
          cid: "bafyrei...",
        },
        scientificName: "Aphelocoma californica",
        scientificNameAuthorship: "(Vigors, 1839)",
        taxonRank: "species",
        vernacularName: "California Scrub-Jay",
        kingdom: "Animalia",
        phylum: "Chordata",
        class: "Aves",
        order: "Passeriformes",
        family: "Corvidae",
        genus: "Aphelocoma",
        identificationRemarks:
          "Blue head and wings, white eyebrow, gray-brown back — classic California Scrub-Jay",
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
  "subject",
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
    return ref.includes(".") ? ref.split(".").pop()! : "ref";
  }
  if (t === "array") {
    const items = prop.items;
    if (items) {
      const inner = items.type ?? "";
      if (inner === "ref") {
        const ref = items.ref ?? "";
        if (ref.startsWith("#")) return `${ref}[]`;
        return ref.includes(".") ? `${ref.split(".").pop()!}[]` : "ref[]";
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
