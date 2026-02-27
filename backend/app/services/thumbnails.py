from __future__ import annotations

from pathlib import Path

from fastapi.responses import FileResponse
from PIL import Image

THUMBNAIL_MAX = (320, 320)


def ensure_thumbnail(cache_dir: Path, source_file: Path, encoded_id: str) -> Path:
    cache_dir.mkdir(parents=True, exist_ok=True)
    target = cache_dir / f"{encoded_id}.jpg"

    if target.exists() and target.stat().st_mtime >= source_file.stat().st_mtime:
        return target

    with Image.open(source_file) as img:
        img = img.convert("RGB")
        img.thumbnail(THUMBNAIL_MAX)
        img.save(target, format="JPEG", quality=85, optimize=True)

    return target


def thumbnail_response(path: Path) -> FileResponse:
    return FileResponse(path, media_type="image/jpeg")
