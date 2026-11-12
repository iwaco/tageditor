from pathlib import Path

import pytest

from app.config import CONFIG_ENV_VAR, ConfigError, load_dataset_root


def _write_config(path: Path, body: str) -> Path:
    path.write_text(body, encoding="utf-8")
    return path


def test_load_dataset_root_returns_absolute_root(tmp_path: Path):
    root = tmp_path / "datasets"
    root.mkdir()
    config = _write_config(tmp_path / "config.toml", f'dataset_root = "{root}"\n')

    assert load_dataset_root({CONFIG_ENV_VAR: str(config)}) == root.resolve()


def test_load_dataset_root_resolves_relative_path_from_config_dir(tmp_path: Path):
    config_dir = tmp_path / "conf"
    config_dir.mkdir()
    root = tmp_path / "datasets"
    root.mkdir()
    config = _write_config(config_dir / "config.toml", 'dataset_root = "../datasets"\n')

    assert load_dataset_root({CONFIG_ENV_VAR: str(config)}) == root.resolve()


def test_load_dataset_root_fails_when_env_is_unset():
    with pytest.raises(ConfigError, match=CONFIG_ENV_VAR):
        load_dataset_root({})


def test_load_dataset_root_fails_when_env_is_empty():
    with pytest.raises(ConfigError, match=CONFIG_ENV_VAR):
        load_dataset_root({CONFIG_ENV_VAR: ""})


def test_load_dataset_root_fails_when_config_file_is_missing(tmp_path: Path):
    missing = tmp_path / "missing.toml"

    with pytest.raises(ConfigError, match="not found"):
        load_dataset_root({CONFIG_ENV_VAR: str(missing)})


def test_load_dataset_root_fails_when_config_is_invalid_toml(tmp_path: Path):
    config = _write_config(tmp_path / "config.toml", "dataset_root = \n")

    with pytest.raises(ConfigError, match="invalid TOML"):
        load_dataset_root({CONFIG_ENV_VAR: str(config)})


def test_load_dataset_root_fails_when_key_is_missing(tmp_path: Path):
    config = _write_config(tmp_path / "config.toml", 'other = "x"\n')

    with pytest.raises(ConfigError, match="dataset_root"):
        load_dataset_root({CONFIG_ENV_VAR: str(config)})


def test_load_dataset_root_fails_when_key_is_not_a_string(tmp_path: Path):
    config = _write_config(tmp_path / "config.toml", "dataset_root = 1\n")

    with pytest.raises(ConfigError, match="dataset_root"):
        load_dataset_root({CONFIG_ENV_VAR: str(config)})


def test_load_dataset_root_fails_when_root_does_not_exist(tmp_path: Path):
    config = _write_config(tmp_path / "config.toml", f'dataset_root = "{tmp_path / "nope"}"\n')

    with pytest.raises(ConfigError, match="does not exist"):
        load_dataset_root({CONFIG_ENV_VAR: str(config)})


def test_load_dataset_root_fails_when_root_is_a_file(tmp_path: Path):
    file = tmp_path / "file.txt"
    file.write_text("x", encoding="utf-8")
    config = _write_config(tmp_path / "config.toml", f'dataset_root = "{file}"\n')

    with pytest.raises(ConfigError, match="not a directory"):
        load_dataset_root({CONFIG_ENV_VAR: str(config)})
