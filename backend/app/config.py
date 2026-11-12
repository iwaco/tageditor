from __future__ import annotations

import os
import tomllib
from collections.abc import Mapping
from pathlib import Path

CONFIG_ENV_VAR = "TAGEDITOR_CONFIG"
DATASET_ROOT_KEY = "dataset_root"


class ConfigError(Exception):
    pass


def load_dataset_root(env: Mapping[str, str] | None = None) -> Path:
    """Read the dataset root from the TOML file that TAGEDITOR_CONFIG points to.

    A relative ``dataset_root`` is resolved against the directory of the config file.
    """
    environ = os.environ if env is None else env
    raw_config_path = environ.get(CONFIG_ENV_VAR, "").strip()
    if not raw_config_path:
        raise ConfigError(f"{CONFIG_ENV_VAR} is not set; point it to a TOML config file")

    config_path = Path(raw_config_path).expanduser()
    if not config_path.is_file():
        raise ConfigError(f"config file not found: {config_path} ({CONFIG_ENV_VAR})")

    try:
        with config_path.open("rb") as f:
            data = tomllib.load(f)
    except tomllib.TOMLDecodeError as exc:
        raise ConfigError(f"invalid TOML in config file {config_path}: {exc}") from exc
    except OSError as exc:
        raise ConfigError(f"cannot read config file {config_path}: {exc}") from exc

    raw_root = data.get(DATASET_ROOT_KEY)
    if not isinstance(raw_root, str) or not raw_root.strip():
        raise ConfigError(f"'{DATASET_ROOT_KEY}' must be a non-empty string in {config_path}")

    root = Path(raw_root).expanduser()
    if not root.is_absolute():
        root = config_path.resolve().parent / root
    root = root.resolve()

    if not root.exists():
        raise ConfigError(f"dataset root does not exist: {root} (from {config_path})")
    if not root.is_dir():
        raise ConfigError(f"dataset root is not a directory: {root} (from {config_path})")
    return root
