# API Specification (MVP)

Base URL: `/api`

## 1. Open Dataset

### `POST /dataset/open`

Request:

```json
{
  "rootPath": "/abs/path/to/dataset"
}
```

Response:

```json
{
  "rootPath": "/abs/path/to/dataset",
  "categories": ["catA", "catB"],
  "images": [],
  "total": 0,
  "tagStats": []
}
```

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
  "tags": ["..."]
}
```

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

