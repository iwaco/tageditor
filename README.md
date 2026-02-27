# tageditor

LoRA training dataset tag editor (MVP).

## Backend (remote bind)

```bash
cd backend
uv sync --group dev
uv run uvicorn app.main:app --reload --host :: --port 8000
```

## Frontend (remote bind)

```bash
cd frontend
npm install
export TAGEDITOR_ALLOWED_HOSTS="boucherie.oeilvert.org"
npm run dev -- --host :: --port 5173
```

Frontend runs on `http://[::0]:5173` and proxies `/api` to backend (`http://[::0]:8000`).
`TAGEDITOR_ALLOWED_HOSTS` supports comma-separated hosts (example: `host1,host2`).

## Tests

```bash
cd backend
uv sync --group dev
uv run pytest
uv run ruff check .
uv run ty check
```

## How To Use

1. Start backend and frontend with the commands above.
2. Open `http://<server-ip-or-hostname>:5173` from your client machine.
3. Enter dataset root path in the top input and click `Open`.
4. Click thumbnails to select, double-click or press `Enter` for detail view.
5. Edit tags in right panel (`Add`, `x` remove); auto-save runs with debounce.
6. Use `Batch Add` / `Batch Remove` after selecting multiple images.
7. Use `Esc` to leave detail view, `Ctrl+Z` / `Ctrl+Shift+Z` for undo/redo.
