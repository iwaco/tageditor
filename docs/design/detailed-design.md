# LoRA Tag Editor Detailed Design (MVP)

## 1. Scope

This design targets only **required** features from `requirements.md`:

- Data load / parse / save / thumbnails
- Category tree, grid, detail view, selection
- Tag cloud add/remove/autocomplete
- Tag-to-images positive/negative filtering
- Batch add/remove
- Global tag frequency table
- Duplicate tag detection/removal
- Undo/Redo

## 2. Architecture

### 2.1 High-level

- Frontend: React + TypeScript + Tailwind + shadcn-style component structure
- Backend: FastAPI (Python)
- Storage: Local filesystem dataset (image files + sidecar `.txt` tag files)

### 2.2 Modules

- `backend/app/services/scanner.py`
  - Recursively scans dataset and builds in-memory index
- `backend/app/services/tags.py`
  - Parse/normalize/serialize tags
- `backend/app/services/storage.py`
  - Atomic save and lock handling
- `backend/app/services/thumbnails.py`
  - On-demand thumbnail generation and cache
- `backend/app/services/history.py`
  - Edit action stack helpers for frontend contract tests
- `backend/app/api/routes.py`
  - REST endpoints

Frontend modules:

- `frontend/src/features/dataset`
- `frontend/src/features/images`
- `frontend/src/features/tags`
- `frontend/src/features/history`

## 3. Core Flows

### 3.1 Open dataset

1. User inputs root folder path.
2. `POST /api/dataset/open`
3. Backend scans files and pairs image + tag file.
4. Backend parses tags, computes stats, returns initial payload.

### 3.2 Edit tags (single image)

1. User adds/removes tags in right panel.
2. Frontend updates local state immediately.
3. Debounced auto-save triggers `POST /api/images/{id}/tags`.
4. Backend normalizes tags and atomically writes `.txt`.
5. Backend returns updated `revision`.

### 3.3 Batch operation

1. User selects multiple images.
2. Executes batch add/remove.
3. Frontend calls batch endpoint.
4. Backend applies operation to each target with lock + atomic save.
5. Stats are recomputed and reflected.

### 3.4 Detail view

1. Enter from grid (double click or Enter).
2. Zoom/pan canvas image.
3. Left/right key navigates previous/next image in current filtered sequence.
4. Esc returns to grid preserving selected index.

## 4. State Design (Frontend)

- `datasetRootPath: string`
- `images: ImageEntry[]`
- `filteredImageIds: string[]`
- `selectedImageIds: string[]`
- `activeImageId: string | null`
- `viewMode: "grid" | "detail"`
- `history: { undo: EditAction[]; redo: EditAction[] }`
- `dirtyMap: Record<string, boolean>`
- `tagDictionary: string[]`

## 5. Error Handling

- Missing tag file: initialize with empty tags and create file on first save.
- Invalid UTF-8: API returns 400 with file path info.
- Revision conflict: API returns 409 with latest tags/revision.
- Save failure: API returns 500; frontend keeps dirty state and shows retry.

## 6. Non-functional Requirements Mapping

- Initial load target for 1,000 images within 10 seconds (hardware-dependent).
- Thumbnail endpoint supports caching.
- Tag edit UI updates immediately (optimistic UI).
- Save debounce default: 500ms.

## 7. Out of Scope for MVP

- Advanced sort options
- Presets
- Alias dictionary / fuzzy normalization
- Co-occurrence analytics
- Slideshow automation

