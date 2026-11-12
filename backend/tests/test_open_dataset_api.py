import inspect
from pathlib import Path

import pytest
from fastapi import HTTPException
from PIL import Image

from app.api import routes
from app.config import CONFIG_ENV_VAR
from app.services.repository import DatasetRepository


@pytest.fixture(autouse=True)
def fresh_repo(monkeypatch: pytest.MonkeyPatch) -> DatasetRepository:
    repo = DatasetRepository()
    monkeypatch.setattr(routes, "repo", repo)
    return repo


def _create_dataset(root: Path) -> None:
    image = root / "catA" / "sample.jpg"
    image.parent.mkdir(parents=True, exist_ok=True)
    Image.new("RGB", (4, 4), color=(255, 0, 0)).save(image)
    image.with_suffix(".txt").write_text("a, b\n", encoding="utf-8")


def test_open_dataset_does_not_accept_a_root_path_from_the_client():
    assert list(inspect.signature(routes.open_dataset).parameters) == []


def test_open_dataset_opens_configured_root(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, fresh_repo: DatasetRepository
):
    root = tmp_path / "datasets"
    _create_dataset(root)
    config = tmp_path / "config.toml"
    config.write_text(f'dataset_root = "{root}"\n', encoding="utf-8")
    monkeypatch.setenv(CONFIG_ENV_VAR, str(config))

    res = routes.open_dataset()

    assert res.rootPath == str(root.resolve())
    assert res.categories == ["catA"]
    assert res.total == 1
    assert [img.id for img in res.images] == ["catA/sample.jpg"]
    assert fresh_repo.get_root_path() == root.resolve()


def test_open_dataset_reports_missing_config_env(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.delenv(CONFIG_ENV_VAR, raising=False)

    with pytest.raises(HTTPException) as exc_info:
        routes.open_dataset()

    assert exc_info.value.status_code == 500
    assert CONFIG_ENV_VAR in str(exc_info.value.detail)


def test_open_dataset_reports_missing_root(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    config = tmp_path / "config.toml"
    config.write_text(f'dataset_root = "{tmp_path / "nope"}"\n', encoding="utf-8")
    monkeypatch.setenv(CONFIG_ENV_VAR, str(config))

    with pytest.raises(HTTPException) as exc_info:
        routes.open_dataset()

    assert exc_info.value.status_code == 500
    assert "does not exist" in str(exc_info.value.detail)
