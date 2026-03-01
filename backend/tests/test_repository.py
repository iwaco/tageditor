from pathlib import Path

from PIL import Image

from app.services.repository import DatasetRepository


def _create_image(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    Image.new("RGB", (4, 4), color=(255, 0, 0)).save(path)


def test_open_dataset_skips_internal_tageditor_dir(tmp_path: Path):
    _create_image(tmp_path / "catA" / "sample.jpg")
    _create_image(tmp_path / ".tageditor" / "thumbnails" / "cached.jpg")

    repo = DatasetRepository()
    categories, images, _ = repo.open_dataset(str(tmp_path))

    assert categories == ["catA"]
    assert [img.category for img in images] == ["catA"]
    assert all(not img.imagePath.startswith(".tageditor/") for img in images)
