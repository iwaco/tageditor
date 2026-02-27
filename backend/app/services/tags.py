from __future__ import annotations


def normalize_tags(tags: list[str]) -> list[str]:
    normalized: list[str] = []
    seen: set[str] = set()
    for raw in tags:
        tag = raw.strip()
        if not tag:
            continue
        if tag in seen:
            continue
        seen.add(tag)
        normalized.append(tag)
    return normalized


def parse_tag_text(text: str) -> list[str]:
    return normalize_tags(text.split(","))


def serialize_tags(tags: list[str]) -> str:
    return ", ".join(normalize_tags(tags)) + "\n"
