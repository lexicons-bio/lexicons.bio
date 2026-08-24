# HappyView AppView

[HappyView](https://happyview.dev) is a lexicon-driven AppView for AT Protocol.
It subscribes to Jetstream, indexes records for the collections you register,
and serves XRPC endpoints over them. Pointing it at this repository's lexicons
gives us a network-wide index of `bio.lexicons.temp.v0-1.*` records — the
substrate the [consensus model](architecture.md#taxonomy-in-identifications-not-occurrences)
needs, since computing a community identification means reading identifications
authored across many repos, not just one.

Deployment is handled by [`.github/workflows/happyview.yml`](../.github/workflows/happyview.yml),
which uses the official [happyview-actions](https://happyview.dev/guides/github-actions).
On pull requests it lints; on merges to `main` it uploads every lexicon under
`lexicons/**/*.json` to the instance. The repository is the source of truth, so
schema changes reach the AppView the moment they land.

## One-time setup

These steps need an account and a running instance, so they can't be automated
from the repo.

### 1. Deploy an instance

Follow the [quickstart](https://happyview.dev/getting-started/quickstart).
Railway is the fastest path; Docker and from-source options are documented under
[Deployment](https://happyview.dev/getting-started/deployment/railway). At minimum HappyView
needs `DATABASE_URL` and `PUBLIC_URL` set — see
[Configuration](https://happyview.dev/getting-started/configuration) for the
full list.

### 2. Bootstrap the super user

Open the instance's root URL and log in with your atproto handle. The first
handle to authenticate is automatically granted super-user permissions, so do
this before sharing the URL.

### 3. Create an API key

In the dashboard, go to **Settings > API Keys** and create a key with:

- `lexicons:create` — upload lexicons
- `scripts:manage` — upload Lua scripts (not used yet; see
  [Public endpoints](#public-endpoints) below)

If you later enable `prune: true` in the workflow, the key also needs
`lexicons:read`, `lexicons:delete`, and `scripts:read` so the action can delete
remote items that no longer exist in git.

### 4. Configure the repository

In **Settings > Secrets and variables > Actions**:

| Name                 | Kind     | Value                                    |
| -------------------- | -------- | ---------------------------------------- |
| `HAPPYVIEW_URL`      | Variable | Base URL of the instance                 |
| `HAPPYVIEW_API_KEY`  | Secret   | The `hv_…` key from step 3               |

The deploy job is guarded on `vars.HAPPYVIEW_URL != ''`, so until the variable
exists the workflow lints pull requests and skips deploys rather than failing
them.

## What gets deployed

The action derives everything from directory layout — there is no manifest to
maintain. Our three record lexicons map to collections one-to-one:

| File                                             | NSID / collection                       |
| ------------------------------------------------ | --------------------------------------- |
| `lexicons/bio/lexicons/temp/v0-1/occurrence.json` | `bio.lexicons.temp.v0-1.occurrence`     |
| `lexicons/bio/lexicons/temp/v0-1/identification.json` | `bio.lexicons.temp.v0-1.identification` |
| `lexicons/bio/lexicons/temp/v0-1/media.json`      | `bio.lexicons.temp.v0-1.media`          |

Because we upload the JSON directly, HappyView treats these as *local* lexicons
and no DNS is involved. Tracking them as [network lexicons](https://happyview.dev/guides/lexicons#network-lexicons)
instead would require a `_lexicon.v0-1.temp.lexicons.bio` TXT record pointing at
the publishing DID — the authority `bio.lexicons.temp.v0-1` reversed. Uploading
from CI avoids that entirely and keeps git authoritative.

Registering a record lexicon does two things: it adds the collection to the
Jetstream subscription filter (indexing new records as they are created), and,
on first upload only, it starts a backfill job to discover records that already
exist on the network. Editing a lexicon later re-saves it without re-crawling;
to re-crawl, start a backfill from the **Backfill** page.

## Verifying

The dashboard home shows live record counts and a per-collection breakdown, with
detail under **Records** and **Backfill**.

To check from the command line, the admin API serves any indexed collection
generically — no per-collection lexicon needed. The key needs `records:read`:

```bash
curl -H "Authorization: Bearer $HAPPYVIEW_API_KEY" "$HAPPYVIEW_URL/admin/records?collection=bio.lexicons.temp.v0-1.occurrence&limit=10"
```

The response carries a `records` array and a `cursor` that is present only while
more results remain.

## Public endpoints

`/admin/records` is deliberately admin-only: `hv_` keys are rejected on `/xrpc/*`
routes, and an admin key can read and delete every collection, so it can't be
handed to a client.

Serving a public, unauthenticated endpoint means adding a `query`-type lexicon —
HappyView maps one lexicon to one XRPC method, so there is no generic public
`listRecords?collection=…`. A query lexicon named, say,
`bio.lexicons.temp.v0-1.listOccurrences` would register
`GET /xrpc/bio.lexicons.temp.v0-1.listOccurrences`, supporting `uri` for a single
record or `limit`/`cursor`/`did` for a page, with no handler code required.
Binding it to a collection needs either a `target_collection` on upload or a
paired script at `lua/bio/lexicons/temp/v0-1/listOccurrences.lua` declaring
`collection = "bio.lexicons.temp.v0-1.occurrence"`; the action pairs scripts to
lexicons by matching path, ignoring base directory and extension.

Nothing here needs that yet, and each query lexicon adds an NSID to the published
`bio.lexicons.temp.v0-1.*` surface, so they are left out until a client calls for
one.

## Running locally

A local instance lives at `../happyview` (outside this repo, so its `.env`
secrets and SQLite volume are never committed). It runs the prebuilt image
rather than the [dev stack](https://happyview.dev/getting-started/deployment/local-development),
which compiles the Rust workspace from scratch and takes minutes on first boot.

Setup, once:

```bash
mkdir -p ../happyview && curl -fsSL -o ../happyview/docker-compose.yml https://raw.githubusercontent.com/gamesgamesgamesgamesgames/happyview/main/docker-compose.prod.sqlite.yml
```

Then create `../happyview/.env`:

```bash
cd ../happyview && printf 'PUBLIC_URL=http://127.0.0.1:3000\nSESSION_SECRET=%s\nTOKEN_ENCRYPTION_KEY=%s\nHAPPYVIEW_VERSION=latest\n' "$(openssl rand -base64 48)" "$(openssl rand -base64 32)" > .env && chmod 600 .env
```

Start it:

```bash
cd ../happyview && docker compose up -d
```

The dashboard is at <http://127.0.0.1:3000>. A loopback `PUBLIC_URL` makes
HappyView use atproto's loopback OAuth client metadata (`Using loopback OAuth
client metadata` in the logs), so signing in with your handle works without a
public HTTPS URL — no Cloudflare tunnel needed, unlike the documented dev stack.
The first handle to sign in becomes the super user.

Note that the deployed production path still needs a real HTTPS `PUBLIC_URL`;
the loopback exemption is local-only.

### Uploading lexicons to it

Create an `hv_` key under **Settings > API Keys**, then upload all three:

```bash
for f in lexicons/bio/lexicons/temp/v0-1/*.json; do curl -sS -X POST http://127.0.0.1:3000/admin/lexicons -H "Authorization: Bearer $HAPPYVIEW_API_KEY" -H "Content-Type: application/json" -d "$(jq -c --slurpfile l "$f" -n '{lexicon_json: $l[0], backfill: true}')"; echo; done
```

Uploads are idempotent upserts, so re-running is safe. Each returns a
`backfill_job_id` on first upload — that's the network crawl for records that
already exist.

Useful operations:

```bash
cd ../happyview && docker compose logs -f
```

```bash
cd ../happyview && docker compose down
```

`down` keeps the `happyview-data` volume; add `-v` to discard the database and
start over from an empty instance.
