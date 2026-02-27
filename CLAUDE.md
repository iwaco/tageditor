# CLAUDE.md

## Development Rules

- Python commands must be run with `uv`.
- Use `pyproject.toml` + `uv sync` for dependency management (`requirements.txt` is not used).
- Lint/type checks must run on every change before completion.
- Always run both:
  - `uv run ruff check .`
  - `uv run ty check`
