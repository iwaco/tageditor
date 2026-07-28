from pathlib import Path

from PIL import Image

from app.services.repository import DatasetRepository


def _create_image(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    Image.new("RGB", (4, 4), color=(255, 0, 0)).save(path)


def _write_tags(path: Path, tags: list[str]) -> None:
    path.write_text(", ".join(tags) + "\n", encoding="utf-8")


def _open_with_entry(tmp_path: Path, tags: list[str]) -> tuple[DatasetRepository, str]:
    image = tmp_path / "catA" / "sample.jpg"
    _create_image(image)
    _write_tags(image.with_suffix(".txt"), tags)

    repo = DatasetRepository()
    repo.open_dataset(str(tmp_path))
    return repo, "catA/sample.jpg"


def test_open_dataset_skips_internal_tageditor_dir(tmp_path: Path):
    _create_image(tmp_path / "catA" / "sample.jpg")
    _create_image(tmp_path / ".tageditor" / "thumbnails" / "cached.jpg")

    repo = DatasetRepository()
    categories, images, _ = repo.open_dataset(str(tmp_path))

    assert categories == ["catA"]
    assert [img.category for img in images] == ["catA"]
    assert all(not img.imagePath.startswith(".tageditor/") for img in images)


def test_batch_add_tags_appends_by_default(tmp_path: Path):
    repo, image_id = _open_with_entry(tmp_path, ["a", "b"])

    updated = repo.batch_add_tags([image_id], ["trigger"])

    item, _, _ = repo.get_image(image_id)
    assert updated == 1
    assert item.tags == ["a", "b", "trigger"]


def test_batch_add_tags_prepends_when_position_is_start(tmp_path: Path):
    repo, image_id = _open_with_entry(tmp_path, ["a", "b"])

    updated = repo.batch_add_tags([image_id], ["trigger"], position="start")

    item, _, _ = repo.get_image(image_id)
    assert updated == 1
    assert item.tags == ["trigger", "a", "b"]


def test_batch_add_tags_moves_existing_tag_to_front(tmp_path: Path):
    repo, image_id = _open_with_entry(tmp_path, ["a", "trigger", "b"])

    updated = repo.batch_add_tags([image_id], ["trigger"], position="start")

    item, _, _ = repo.get_image(image_id)
    assert updated == 1
    assert item.tags == ["trigger", "a", "b"]


def test_batch_add_tags_writes_prepended_tags_to_file(tmp_path: Path):
    repo, image_id = _open_with_entry(tmp_path, ["a", "b"])

    repo.batch_add_tags([image_id], ["t1", "t2"], position="start")

    tag_file = tmp_path / "catA" / "sample.txt"
    assert tag_file.read_text(encoding="utf-8") == "t1, t2, a, b\n"


def test_batch_add_tags_skips_write_when_already_leading(tmp_path: Path):
    repo, image_id = _open_with_entry(tmp_path, ["trigger", "a"])

    updated = repo.batch_add_tags([image_id], ["trigger"], position="start")

    item, _, _ = repo.get_image(image_id)
    assert updated == 0
    assert item.tags == ["trigger", "a"]
