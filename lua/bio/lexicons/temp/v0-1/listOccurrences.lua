-- Handler for bio.lexicons.temp.v0-1.listOccurrences.
--
-- The `collection` global is normally supplied by the lexicon's
-- target_collection, but the deploy action has no input for it, so the script
-- declares the binding itself. This mirrors the HappyView statusphere tutorial.
collection = "bio.lexicons.temp.v0-1.occurrence"

local DEFAULT_LIMIT = 20
local MAX_LIMIT = 100

function handle()
  -- Single-record mode, matching HappyView's built-in `uri` behaviour.
  if params.uri then
    local record = db.get(params.uri)
    if not record then
      -- error() would surface as an opaque 500; a structured body says why.
      return { error = "record not found" }
    end
    return { record = record }
  end

  -- Query params always arrive as strings.
  local limit = tonumber(params.limit) or DEFAULT_LIMIT
  if limit < 1 then
    limit = 1
  elseif limit > MAX_LIMIT then
    limit = MAX_LIMIT
  end

  return db.query({
    collection = collection,
    did = params.did,
    limit = limit,
    cursor = params.cursor,
  })
end
