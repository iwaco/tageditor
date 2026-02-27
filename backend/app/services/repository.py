from __future__ import annotations

import base64
import threading
from collections import defaultdict
from dataclasses import dataclass
from pathlib import Path

from PIL import Image

from app.models.schemas import ImageEntryModel, ImageMetadataModel, TagStatsModel
from app.services.tags import normalize_tags, parse_tag_text, serialize_tags

SUPPORTED_EXTS = {".jpg", ".jpeg", ".png", ".webp"}


class RepositoryError(Exception):
    pass


class DatasetNotOpenedError(RepositoryError):
    pass


class RevisionConflictError(RepositoryError):
    def __init__(self, image_id: str, revision: int):
        super().__init__(f"revision conflict: {image_id}")
        self.image_id = image_id
        self.revision = revision


@dataclass
class DatasetState:
    root_path: Path
    entries_by_id: dict[str, ImageEntryModel]
    ordered_ids: list[str]


class DatasetRepository:
    def __init__(self) -> None:
        self._state: DatasetState | None = None
        self._lock = threading.RLock()

    def _ensure_state(self) -> DatasetState:
        if not self._state:
            raise DatasetNotOpenedError("dataset is not opened")
        return self._state

    @staticmethod
    def _to_image_id(relative_image_path: str) -> str:
        return relative_image_path.replace("\\", "/")

    @staticmethod
    def encode_id(image_id: str) -> str:
        return base64.urlsafe_b64encode(image_id.encode("utf-8")).decode("ascii")

    @staticmethod
    def decode_id(encoded: str) -> str:
        padded = encoded + "=" * (-len(encoded) % 4)
        return base64.urlsafe_b64decode(padded.encode("ascii")).decode("utf-8")

    def open_dataset(self, root_path: str) -> tuple[list[str], list[ImageEntryModel], list[TagStatsModel]]:
        root = Path(root_path).expanduser().resolve()
        if not root.exists() or not root.is_dir():
            raise RepositoryError(f"invalid dataset root path: {root}")

        entries: dict[str, ImageEntryModel] = {}
        for file in root.rglob("*"):
            if not file.is_file() or file.suffix.lower() not in SUPPORTED_EXTS:
                continue

            relative_image_path = str(file.relative_to(root)).replace("\\", "/")
            image_id = self._to_image_id(relative_image_path)
            tag_file = file.with_suffix(".txt")
            relative_tag_path = str(tag_file.relative_to(root)).replace("\\", "/")
            category = relative_image_path.split("/")[0] if "/" in relative_image_path else "."

            tags: list[str] = []
            if tag_file.exists():
                try:
                    tags = parse_tag_text(tag_file.read_text(encoding="utf-8"))
                except UnicodeDecodeError as exc:
                    raise RepositoryError(f"invalid UTF-8 in tag file: {relative_tag_path}") from exc

            stat = file.stat()
            with Image.open(file) as img:
                width, height = img.size

            encoded_id = self.encode_id(image_id)
            entry = ImageEntryModel(
                id=image_id,
                baseName=file.stem,
                category=category,
                imagePath=relative_image_path,
                imageUrl=f"/api/assets/image/{encoded_id}",
                tagFilePath=relative_tag_path,
                tags=tags,
                thumbnailUrl=f"/api/assets/thumbnail/{encoded_id}",
                metadata=ImageMetadataModel(
                    width=width,
                    height=height,
                    fileSize=stat.st_size,
                    mtime=stat.st_mtime,
                ),
                revision=0,
            )
            entries[image_id] = entry

        ordered_ids = sorted(entries.keys())
        categories = sorted({entries[k].category for k in ordered_ids})

        with self._lock:
            self._state = DatasetState(root_path=root, entries_by_id=entries, ordered_ids=ordered_ids)

        return categories, [entries[i] for i in ordered_ids], self.get_tag_stats()

    def get_root_path(self) -> Path:
        return self._ensure_state().root_path

    def list_images(
        self,
        category: str | None,
        has_tags: list[str],
        not_tags: list[str],
        page: int,
        page_size: int,
    ) -> tuple[list[ImageEntryModel], int]:
        state = self._ensure_state()
        has_tags_set = set(normalize_tags(has_tags))
        not_tags_set = set(normalize_tags(not_tags))

        filtered: list[ImageEntryModel] = []
        for image_id in state.ordered_ids:
            item = state.entries_by_id[image_id]
            if category and item.category != category:
                continue

            item_tags = set(item.tags)
            if has_tags_set and not has_tags_set.issubset(item_tags):
                continue
            if not_tags_set and not_tags_set.intersection(item_tags):
                continue
            filtered.append(item)

        total = len(filtered)
        start = (max(page, 1) - 1) * max(page_size, 1)
        end = start + max(page_size, 1)
        return filtered[start:end], total

    def get_image(self, image_id: str) -> tuple[ImageEntryModel, str | None, str | None]:
        state = self._ensure_state()
        if image_id not in state.entries_by_id:
            raise RepositoryError(f"image not found: {image_id}")

        idx = state.ordered_ids.index(image_id)
        prev_id = state.ordered_ids[idx - 1] if idx > 0 else None
        next_id = state.ordered_ids[idx + 1] if idx + 1 < len(state.ordered_ids) else None
        return state.entries_by_id[image_id], prev_id, next_id

    def update_tags(self, image_id: str, tags: list[str], revision: int) -> ImageEntryModel:
        state = self._ensure_state()
        with self._lock:
            if image_id not in state.entries_by_id:
                raise RepositoryError(f"image not found: {image_id}")

            entry = state.entries_by_id[image_id]
            if revision != entry.revision:
                raise RevisionConflictError(image_id=image_id, revision=entry.revision)

            normalized = normalize_tags(tags)
            self._write_tag_file(state.root_path / entry.tagFilePath, normalized)
            entry.tags = normalized
            entry.revision += 1
            state.entries_by_id[image_id] = entry
            return entry

    def batch_add_tags(self, image_ids: list[str], tags: list[str]) -> int:
        state = self._ensure_state()
        add_tags = normalize_tags(tags)
        updated = 0

        with self._lock:
            for image_id in image_ids:
                entry = state.entries_by_id.get(image_id)
                if not entry:
                    continue
                merged = normalize_tags(entry.tags + add_tags)
                if merged == entry.tags:
                    continue
                self._write_tag_file(state.root_path / entry.tagFilePath, merged)
                entry.tags = merged
                entry.revision += 1
                updated += 1

        return updated

    def batch_remove_tags(self, image_ids: list[str], tags: list[str]) -> int:
        state = self._ensure_state()
        remove_set = set(normalize_tags(tags))
        updated = 0

        with self._lock:
            for image_id in image_ids:
                entry = state.entries_by_id.get(image_id)
                if not entry:
                    continue
                after = [t for t in entry.tags if t not in remove_set]
                if after == entry.tags:
                    continue
                self._write_tag_file(state.root_path / entry.tagFilePath, after)
                entry.tags = after
                entry.revision += 1
                updated += 1

        return updated

    def get_tag_stats(self) -> list[TagStatsModel]:
        state = self._ensure_state()
        counts: dict[str, int] = defaultdict(int)
        categories: dict[str, set[str]] = defaultdict(set)

        for entry in state.entries_by_id.values():
            for tag in entry.tags:
                counts[tag] += 1
                categories[tag].add(entry.category)

        stats = [
            TagStatsModel(tag=tag, count=count, categories=sorted(categories[tag]))
            for tag, count in counts.items()
        ]
        stats.sort(key=lambda x: (-x.count, x.tag))
        return stats

    @staticmethod
    def _write_tag_file(path: Path, tags: list[str]) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        if path.exists() and not path.with_suffix(path.suffix + ".bak").exists():
            backup_path = path.with_suffix(path.suffix + ".bak")
            backup_path.write_text(path.read_text(encoding="utf-8"), encoding="utf-8")

        temp = path.with_suffix(path.suffix + ".tmp")
        temp.write_text(serialize_tags(tags), encoding="utf-8")
        temp.replace(path)
