# CLAUDE.md

## Development Rules

- Python commands must be run with `uv`.
- Use `pyproject.toml` + `uv sync` for dependency management (`requirements.txt` is not used).
- Lint/type checks must run on every change before completion.
- Always run both:
  - `uv run ruff check .`
  - `uv run ty check`

## Herdr Workspace

「tageditor開いて」と指示されたら、Herdr の現在のペインの下に開発サーバー用のペインを
左右 2 つ作り、左を backend、右を frontend として起動する。

```
+-----------------------------+
|      Claude (current)       |
+--------------+--------------+
|   backend    |   frontend   |
+--------------+--------------+
```

手順:

1. 現在のペインを下方向に分割し、backend ペインを作る（フォーカスは移さない）。
   `herdr pane split --current --direction down --ratio 0.3 --cwd backend --no-focus`
2. 作成された backend ペインの `pane_id` を出力 JSON から取得し、そのペインを右方向に
   分割して frontend ペインを作る。frontend は許可ホストの環境変数を渡して起動する。
   `herdr pane split <backend-pane-id> --direction right --ratio 0.5 --cwd frontend --env TAGEDITOR_ALLOWED_HOSTS=boucherie.oeilvert.org --no-focus`
3. 各ペインを `herdr pane rename` で `backend` / `frontend` に命名する。
4. `herdr pane run` で起動コマンドを実行する。
   - backend: `uv run uvicorn app.main:app --reload --host :: --port 8000`
   - frontend: `npm run dev -- --host :: --port 5173`
5. フォーカスは Claude のペインに残したままにする。既に backend / frontend ペインが
   存在する場合は新規作成せず、そのペインで再起動する。

起動コマンドの詳細と依存関係の準備（`uv sync --group dev` / `npm install`）は README を参照。
