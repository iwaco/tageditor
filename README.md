# tageditor

LoRA training dataset tag editor (MVP).

## Backend

```bash
cd backend
uv sync --group dev
uv run uvicorn app.main:app --reload
```

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://127.0.0.1:5173` and proxies `/api` to backend (`http://127.0.0.1:8000`).

## Tests

```bash
cd backend
uv sync --group dev
uv run pytest
uv run ruff check .
uv run ty check
```
