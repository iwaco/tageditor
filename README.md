# tageditor

LoRA training dataset tag editor (MVP).

## Configuration

The dataset root is set on the server, not in the UI. Write a TOML file
(see `config.example.toml`) and point `TAGEDITOR_CONFIG` to it:

```toml
dataset_root = "/home/yuanying/src/github.com/yuanying/lora_datasets"
```

- `dataset_root` is the only key. A relative path is resolved from the directory of the config file.
- The file is read each time the dataset is opened (on every page load), so a change takes effect on reload.
- If `TAGEDITOR_CONFIG` is unset, the file is missing or invalid, or the root does not exist,
  the open API returns 500 with the reason and the UI shows it in a banner.

## Backend (remote bind)

```bash
cd backend
uv sync --group dev
export TAGEDITOR_CONFIG=/path/to/config.toml
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
3. The dataset root from `TAGEDITOR_CONFIG` opens automatically; its path is shown at the top left.
4. Click thumbnails to select, double-click or press `Enter` for detail view.
5. Edit tags in right panel (`Add`, `x` remove); auto-save runs with debounce.
   Check `Add to front` to insert tags at the head of the list (for trigger words).
6. Use `Batch Add` / `Batch Remove` after selecting multiple images.
7. Use `Esc` to leave detail view, `Ctrl+Z` / `Ctrl+Shift+Z` for undo/redo.
