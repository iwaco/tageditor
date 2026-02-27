from app.services.tags import normalize_tags, parse_tag_text, serialize_tags


def test_parse_and_normalize_tags():
    text = "tag1, tag2, ,  tag1 , long hair,  "
    assert parse_tag_text(text) == ["tag1", "tag2", "long hair"]


def test_serialize_tags():
    tags = ["a", " b ", "a", ""]
    assert serialize_tags(tags) == "a, b\n"


def test_normalize_preserves_order():
    tags = ["z", "a", "z", "a", "b"]
    assert normalize_tags(tags) == ["z", "a", "b"]
