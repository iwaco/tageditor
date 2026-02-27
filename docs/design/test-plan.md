# Test Plan (MVP)

## 1. Backend Unit Tests

- Tag parser normalization:
  - Input with extra spaces
  - Empty tokens
  - Duplicates
- Scanner pairing:
  - Image with existing `.txt`
  - Image without `.txt`
- Batch operations:
  - Add no-op when tag already exists
  - Remove no-op when tag missing

## 2. Backend API Tests

- `POST /dataset/open` success and invalid path failure
- `GET /images` with category / hasTag / notTag filters
- `POST /images/{id}/tags` success and conflict (409)
- batch add/remove endpoints and stats updates

## 3. Frontend Component Tests

- Tag input parse (comma-separated add)
- Undo/Redo reducer behavior
- Selection behavior (single, multi-toggle, range helper)

## 4. E2E (manual first)

- Open dataset -> grid visible
- Select image -> edit tags -> auto-save reflected
- Enter detail mode -> zoom/pan -> prev/next -> Esc back
- Tag click positive/negative filter
- Multi-select -> batch add/remove

## 5. Acceptance Criteria

- Required features in MVP scope are executable
- Save output persists in `.txt` and reloads consistently
- 1,000-image dataset remains operable with virtualization enabled

