import { useCallback, useEffect, useState } from "react";
import { Box } from "@mui/material";
import { palette, fonts } from "../theme";

const NSID = "bio.lexicons.temp.v0-1.listOccurrences";
const PAGE_SIZE = 50;

const INSTANCE_URL = import.meta.env.VITE_HAPPYVIEW_URL;
const CLIENT_KEY = import.meta.env.VITE_HAPPYVIEW_CLIENT_KEY;

interface Occurrence {
  uri?: string;
  eventDate?: string;
  decimalLatitude?: string;
  decimalLongitude?: string;
  organismQuantity?: string;
  organismQuantityType?: string;
  taxonID?: string;
}

/**
 * HappyView's built-in list mode returns record fields flattened alongside the
 * AT URI, while a Lua handler returning db.query() rows can nest them under
 * `record`. Accept either so the table doesn't depend on which one is serving.
 */
function normalize(row: unknown): Occurrence {
  if (typeof row !== "object" || row === null) return {};
  const obj = row as Record<string, unknown>;
  const nested =
    typeof obj.record === "object" && obj.record !== null
      ? (obj.record as Record<string, unknown>)
      : undefined;
  const fields = nested ?? obj;
  return {
    uri: typeof obj.uri === "string" ? obj.uri : undefined,
    eventDate: str(fields.eventDate),
    decimalLatitude: str(fields.decimalLatitude),
    decimalLongitude: str(fields.decimalLongitude),
    organismQuantity: str(fields.organismQuantity),
    organismQuantityType: str(fields.organismQuantityType),
    taxonID: str(fields.taxonID),
  };
}

function str(v: unknown): string | undefined {
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  return undefined;
}

/** `at://did:plc:abc/collection/rkey` -> `did:plc:abc`. */
function authorDid(uri?: string): string | undefined {
  return uri?.split("/")[2];
}

function coords(o: Occurrence): string | undefined {
  if (!o.decimalLatitude || !o.decimalLongitude) return undefined;
  return `${o.decimalLatitude}, ${o.decimalLongitude}`;
}

/**
 * taxonID is a full URI (typically GBIF). Shown in full it crowds out every
 * other column, so label it `host/id` and keep the URI on the href.
 */
function taxonLabel(taxonID: string): string {
  try {
    const u = new URL(taxonID);
    const last = u.pathname.split("/").filter(Boolean).pop();
    const host = u.host.replace(/^www\./, "");
    return last ? `${host}/${last}` : host;
  } catch {
    return taxonID;
  }
}

function quantity(o: Occurrence): string | undefined {
  if (!o.organismQuantity) return undefined;
  return o.organismQuantityType
    ? `${o.organismQuantity} ${o.organismQuantityType}`
    : o.organismQuantity;
}

const CELL = {
  py: "9px",
  pr: "16px",
  verticalAlign: "top",
  borderBottom: `1px solid ${palette.ruleSoft}`,
  fontFamily: fonts.mono,
  fontSize: "12px",
  color: palette.inkSoft,
  whiteSpace: "nowrap",
} as const;

const HEAD = {
  py: "8px",
  pr: "16px",
  textAlign: "left",
  borderBottom: `1px solid ${palette.rule}`,
  fontSize: "11px",
  fontWeight: 500,
  color: palette.inkFaint,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  whiteSpace: "nowrap",
} as const;

export default function Occurrences() {
  const [rows, setRows] = useState<Occurrence[]>([]);
  const [cursor, setCursor] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [loaded, setLoaded] = useState(false);

  const configured = Boolean(INSTANCE_URL && CLIENT_KEY);

  const load = useCallback(
    async (after?: string, signal?: AbortSignal) => {
      setLoading(true);
      setError(undefined);
      try {
        const url = new URL(`/xrpc/${NSID}`, INSTANCE_URL);
        url.searchParams.set("limit", String(PAGE_SIZE));
        if (after) url.searchParams.set("cursor", after);

        const res = await fetch(url, {
          headers: { "X-Client-Key": CLIENT_KEY as string },
          signal,
        });
        if (!res.ok) {
          // The AppView returns { error } on failure; fall back to the status.
          const body = await res.json().catch(() => undefined);
          throw new Error(body?.error ?? `${res.status} ${res.statusText}`);
        }

        const body = await res.json();
        const batch = Array.isArray(body?.records) ? body.records.map(normalize) : [];
        setRows((prev) => (after ? [...prev, ...batch] : batch));
        setCursor(typeof body?.cursor === "string" ? body.cursor : undefined);
        setLoaded(true);
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!configured) return;
    const ctrl = new AbortController();
    void load(undefined, ctrl.signal);
    return () => ctrl.abort();
  }, [configured, load]);

  return (
    <>
      <Box
        component="p"
        sx={{ color: palette.inkSoft, fontSize: "15.5px", maxWidth: 660, m: 0, mb: "28px" }}
      >
        Occurrence records indexed from the AT Protocol network, served by the{" "}
        <Box component="span" sx={{ fontFamily: fonts.mono }}>{NSID}</Box>{" "}
        endpoint. Anyone can read this — no account required.
      </Box>

      {!configured && (
        <Note>
          No AppView configured. Set{" "}
          <Box component="span" sx={{ fontFamily: fonts.mono }}>VITE_HAPPYVIEW_URL</Box> and{" "}
          <Box component="span" sx={{ fontFamily: fonts.mono }}>VITE_HAPPYVIEW_CLIENT_KEY</Box>{" "}
          in <Box component="span" sx={{ fontFamily: fonts.mono }}>site/.env</Box> to point this
          page at an instance. See{" "}
          <Box component="span" sx={{ fontFamily: fonts.mono }}>docs/happyview.md</Box>.
        </Note>
      )}

      {configured && error && <Note tone="warn">Could not reach the AppView — {error}</Note>}

      {configured && !error && loading && rows.length === 0 && <Note>Loading…</Note>}

      {configured && !error && loaded && rows.length === 0 && !loading && (
        <Note>
          No occurrences indexed yet. Records appear here once they are published to the
          network and the backfill has run.
        </Note>
      )}

      {rows.length > 0 && (
        <Box sx={{ overflowX: "auto", mb: "24px" }}>
          <Box component="table" sx={{ borderCollapse: "collapse", width: "100%", minWidth: 560 }}>
            <Box component="thead">
              <Box component="tr">
                <Box component="th" sx={HEAD}>Date</Box>
                <Box component="th" sx={HEAD}>Coordinates</Box>
                <Box component="th" sx={HEAD}>Quantity</Box>
                <Box component="th" sx={HEAD}>Taxon</Box>
                <Box component="th" sx={HEAD}>Author</Box>
              </Box>
            </Box>
            <Box component="tbody">
              {rows.map((o, i) => (
                <Box component="tr" key={o.uri ?? i}>
                  <Box component="td" sx={CELL}>{o.eventDate ?? dash}</Box>
                  <Box component="td" sx={CELL}>{coords(o) ?? dash}</Box>
                  <Box component="td" sx={CELL}>{quantity(o) ?? dash}</Box>
                  <Box component="td" sx={CELL}>
                    {o.taxonID ? (
                      <Box
                        component="a"
                        href={o.taxonID}
                        target="_blank"
                        rel="noopener"
                        title={o.taxonID}
                        sx={{ color: palette.link, textDecoration: "none" }}
                      >
                        {taxonLabel(o.taxonID)}
                      </Box>
                    ) : (
                      dash
                    )}
                  </Box>
                  <Box component="td" sx={{ ...CELL, color: palette.inkFaint }}>
                    {authorDid(o.uri) ?? dash}
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      )}

      {cursor && (
        <Box
          component="button"
          type="button"
          onClick={() => void load(cursor)}
          disabled={loading}
          sx={{
            font: "inherit",
            fontFamily: fonts.mono,
            fontSize: "12px",
            color: palette.link,
            background: "none",
            border: `1px solid ${palette.rule}`,
            px: "12px",
            py: "6px",
            cursor: loading ? "default" : "pointer",
            opacity: loading ? 0.5 : 1,
          }}
        >
          {loading ? "Loading…" : "Load more"}
        </Box>
      )}
    </>
  );
}

const dash = "—";

function Note({ children, tone }: { children: React.ReactNode; tone?: "warn" }) {
  return (
    <Box
      sx={{
        fontSize: "13px",
        color: tone === "warn" ? palette.warn : palette.inkSoft,
        borderTop: `1px solid ${palette.rule}`,
        borderBottom: `1px solid ${palette.ruleSoft}`,
        py: "14px",
        mb: "24px",
      }}
    >
      {children}
    </Box>
  );
}
