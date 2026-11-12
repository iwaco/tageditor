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

- `POST /dataset/open` opens the configured root and takes no path from the client
- Config loading: valid, `TAGEDITOR_CONFIG` unset, file missing, invalid TOML, root missing
- `GET /images` with category / hasTag / notTag filters
- `POST /images/{id}/tags` success and conflict (409)
- batch add/remove endpoints and stats updates

## 3. Frontend Component Tests

- Tag input parse (comma-separated add)
- Undo/Redo reducer behavior
- Selection behavior (single, multi-toggle, range helper)

## 4. E2E (manual first)

- Start with `TAGEDITOR_CONFIG` -> configured root opens automatically, grid visible
- Start without `TAGEDITOR_CONFIG` -> error banner with the reason
- Select image -> edit tags -> auto-save reflected
- Enter detail mode -> zoom/pan -> prev/next -> Esc back
- Tag click positive/negative filter
- Multi-select -> batch add/remove

## 5. Acceptance Criteria

- Required features in MVP scope are executable
- Save output persists in `.txt` and reloads consistently
- 1,000-image dataset remains operable with virtualization enabled

