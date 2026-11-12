# API Specification (MVP)

Base URL: `/api`

## 1. Open Dataset

### `POST /dataset/open`

Opens the dataset root configured on the server. The request has no body;
clients cannot choose the path. The server reads the TOML file named by the
`TAGEDITOR_CONFIG` environment variable and opens its `dataset_root`
(a relative path is resolved from the config file's directory).

Response (`rootPath` is the resolved absolute root):

```json
{
  "rootPath": "/abs/path/to/dataset",
  "categories": ["catA", "catB"],
  "images": [],
  "total": 0,
  "tagStats": []
}
```

Errors:

- `500` when `TAGEDITOR_CONFIG` is unset, the config file is missing or not valid TOML,
  `dataset_root` is missing or not a string, or the root does not exist or is not a directory.
  `detail` holds the reason, which the UI shows.
- `400` when scanning the root fails (e.g. a tag file is not valid UTF-8).

## 2. List Images

### `GET /images`

Query:

- `category` optional
- `hasTag` optional (repeatable)
- `notTag` optional (repeatable)
- `page` default `1`
- `pageSize` default `200`

Response:

```json
{
  "items": [],
  "total": 0,
  "page": 1,
  "pageSize": 200
}
```

## 3. Get Image Detail

### `GET /images/{id}`

Response:

```json
{
  "item": {},
  "prevId": "optional",
  "nextId": "optional"
}
```

## 4. Update Image Tags

### `POST /images/{id}/tags`

Request:

```json
{
  "tags": ["1girl", "blue eyes"],
  "revision": 3
}
```

Responses:

- `200 OK`: updated entry + revision
- `409 Conflict`: revision mismatch

## 5. Batch Add Tags

### `POST /images/batch/tags:add`

Request:

```json
{
  "imageIds": ["..."],
  "tags": ["..."],
  "position": "end"
}
```

`position` is optional and defaults to `"end"` (append). With `"start"` the tags are
inserted at the front of the list; a tag the image already carries is moved to the front
rather than left in place.

## 6. Batch Remove Tags

### `POST /images/batch/tags:remove`

Request:

```json
{
  "imageIds": ["..."],
  "tags": ["..."]
}
```

## 7. Tag Stats

### `GET /tags/stats`

Response:

```json
{
  "items": [
    {
      "tag": "1girl",
      "count": 24,
      "categories": ["catA"]
    }
  ]
}
```

## 8. Thumbnail

### `GET /assets/thumbnail/{id}`

- Returns image bytes (`image/jpeg`)
- `id` is URL-safe base64 encoded internal image id

