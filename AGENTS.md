# AGENTS.md

## Cursor Cloud specific instructions

This repo is a single Python (FastAPI) service: the **Tor IP Aggregator** API (`app.main:app`).
It aggregates Tor exit-node IPs from live external feeds, stores an admin exclusion list in an
embedded SQLite DB (`data/tor.db`), and serves filtered/unfiltered lists. There is no separate
frontend or database server; the interactive Swagger UI at `/docs` is the only UI.

Standard commands (run/test/lint/build) are documented in `README.md` and `.github/workflows/ci.yml`.
Notes below are the non-obvious caveats for this environment.

- **Python deps are installed system-wide** (via `pip --break-system-packages`) by the startup
  update script; there is no virtualenv. Just use the system `python3` (3.12 here; project needs 3.11+).
- **Console scripts live in `~/.local/bin`, which is not on `PATH` by default.** Invoke tools as
  modules to avoid surprises: `python3 -m uvicorn ...`, `python3 -m pytest -q`, `python3 -m ruff check app tests tools`.
- **Running the API needs two env vars** (auth keys). Defaults from `app/config.py` are
  `reader-local-key` / `admin-local-key`; set explicitly to be safe:
  `READER_API_KEYS=reader-local-key ADMIN_API_KEYS=admin-local-key python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000`.
  Authenticate requests with the `X-API-Key` header (admin key required for `/v1/exclusions`).
- **The live `/v1/tor-ips` endpoints require outbound internet** to fetch the Tor feeds; if a
  source is unreachable the API degrades gracefully (stale cache or 503). The pytest suite mocks
  these sources, so tests need no network.
- **`requirements-dev.txt` pulls in WeasyPrint/Pillow/Markdown** used only by
  `tools/generate_deliverables.py` (regenerates the docs PDF/PNG evidence). Not needed to run or
  test the API; WeasyPrint may need extra system libs (pango/cairo) if you actually run that tool.
