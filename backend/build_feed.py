"""Build a unified frontend feed from news and concept datasets."""

import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


PROJECT_ROOT = Path(__file__).resolve().parent.parent
ARTICLES_PATH = PROJECT_ROOT / "data" / "articles" / "articles.json"
CONCEPTS_PATH = PROJECT_ROOT / "data" / "concepts" / "concepts_generated_v4.json"
FEED_PATH = PROJECT_ROOT / "data" / "feed.json"
MANIFEST_PATH = PROJECT_ROOT / "data" / "feed_manifest.json"


def load_json(path: str) -> list[dict[str, Any]]:
    """Load a JSON file and return a list of objects."""
    with open(path, "r", encoding="utf-8") as file:
        data = json.load(file)

    if not isinstance(data, list):
        raise ValueError(f"Expected a list in {path}")

    return data


def clean_text(text: Any) -> str:
    """Convert a value to a clean string."""
    if text is None:
        return ""
    return str(text).strip()


def clean_list(values: Any) -> list[str]:
    """Return a clean list of strings."""
    if not isinstance(values, list):
        return []

    cleaned_values: list[str] = []
    for value in values:
        cleaned_value = clean_text(value)
        if cleaned_value:
            cleaned_values.append(cleaned_value)

    return cleaned_values


def map_article_to_feed_item(article: dict[str, Any]) -> dict[str, Any]:
    """Map one news article into the shared feed schema."""
    source = article.get("source", {})
    ai_output = article.get("ai_output", {})
    categories = clean_list(article.get("category"))
    keywords = clean_list(article.get("keywords"))

    summary = clean_text(ai_output.get("summary_v2")) or clean_text(ai_output.get("summary"))
    model = clean_text(ai_output.get("summary_v2_model")) or clean_text(ai_output.get("summary_model"))
    prompt_version = clean_text(ai_output.get("summary_v2_prompt_version")) or clean_text(
        ai_output.get("summary_prompt_version")
    )

    return {
        "id": clean_text(article["article_id"]),
        "content_type": "news",
        "title": clean_text(article.get("title")),
        "subtitle": clean_text(source.get("name")),
        "summary": summary,
        "extra_text": "",
        "body_text": clean_text(article.get("content", {}).get("full_text")),
        "audio_text": summary,
        "image_url": clean_text(source.get("image_url")),
        "category": categories[0] if categories else "news",
        "difficulty": "",
        "tags": [],
        "keywords": keywords,
        "source_name": clean_text(source.get("name")),
        "source_url": clean_text(source.get("url")),
        "published_at": clean_text(article.get("published_at")),
        "collected_at": clean_text(article.get("collected_at")),
        "model": model,
        "prompt_version": prompt_version,
    }


def map_concept_to_feed_item(concept: dict[str, Any]) -> dict[str, Any]:
    """Map one concept item into the shared feed schema."""
    ai_output = concept.get("ai_output", {})
    source = concept.get("source", {})
    category = clean_text(concept.get("category"))
    difficulty = clean_text(concept.get("difficulty"))
    tags = clean_list(concept.get("tags"))
    keywords = clean_list(concept.get("keywords")) or tags

    subtitle_parts = [part for part in [category, difficulty] if part]

    return {
        "id": clean_text(concept["concept_id"]),
        "content_type": "concept",
        "title": clean_text(ai_output.get("title")) or clean_text(concept.get("topic")),
        "subtitle": " · ".join(subtitle_parts),
        "summary": clean_text(ai_output.get("summary")),
        "extra_text": clean_text(ai_output.get("why_it_matters")),
        "body_text": clean_text(ai_output.get("post_content")),
        "audio_text": clean_text(ai_output.get("tts_text")) or clean_text(ai_output.get("summary")),
        "analogy": clean_text(ai_output.get("analogy")),
        "image_url": "",
        "category": category,
        "difficulty": difficulty,
        "tags": tags,
        "keywords": keywords,
        "source_name": clean_text(source.get("title")),
        "source_url": clean_text(source.get("url")),
        "published_at": "",
        "collected_at": "",
        "model": clean_text(ai_output.get("model")),
        "prompt_version": clean_text(ai_output.get("prompt_version")),
    }


def save_json(data: Any, path: str) -> None:
    """Save data to a JSON file."""
    with open(path, "w", encoding="utf-8") as file:
        json.dump(data, file, indent=2, ensure_ascii=False)


def parse_datetime(value: str) -> float:
    """Convert an ISO datetime string to a sortable timestamp."""
    cleaned_value = clean_text(value)
    if not cleaned_value:
        return float("-inf")

    try:
        parsed = datetime.fromisoformat(cleaned_value.replace("Z", "+00:00"))
    except ValueError:
        return float("-inf")

    return parsed.timestamp()


def build_manifest(feed_items: list[dict[str, Any]]) -> dict[str, Any]:
    """Build a simple manifest for the generated feed."""
    total_news = sum(1 for item in feed_items if item.get("content_type") == "news")
    total_concepts = sum(1 for item in feed_items if item.get("content_type") == "concept")

    return {
        "feed_generated_at": datetime.now(timezone.utc)
        .replace(microsecond=0)
        .isoformat()
        .replace("+00:00", "Z"),
        "total_items": len(feed_items),
        "total_news": total_news,
        "total_concepts": total_concepts,
    }


def main() -> int:
    """Build the unified feed and manifest files."""
    try:
        articles = load_json(str(ARTICLES_PATH))
        concepts = load_json(str(CONCEPTS_PATH))
    except (OSError, json.JSONDecodeError, ValueError) as exc:
        print(f"Error: failed to load source data: {exc}")
        return 1

    news_items: list[tuple[dict[str, Any], int]] = []
    concept_items: list[tuple[dict[str, Any], int]] = []

    for index, article in enumerate(articles):
        try:
            feed_item = map_article_to_feed_item(article)
            news_items.append((feed_item, index))
        except Exception as exc:
            item_id = clean_text(article.get("article_id")) or f"article_index_{index}"
            print(f"Skipping article {item_id}: {exc}")

    for index, concept in enumerate(concepts):
        try:
            feed_item = map_concept_to_feed_item(concept)
            concept_items.append((feed_item, index))
        except Exception as exc:
            item_id = clean_text(concept.get("concept_id")) or f"concept_index_{index}"
            print(f"Skipping concept {item_id}: {exc}")

    sorted_news = sorted(
        news_items,
        key=lambda item: (
            1 if not clean_text(item[0].get("published_at")) else 0,
            -parse_datetime(clean_text(item[0].get("published_at"))),
            clean_text(item[0].get("id")),
            item[1],
        ),
    )

    sorted_concepts = sorted(
        concept_items,
        key=lambda item: (
            clean_text(item[0].get("id")),
            item[1],
        ),
    )

    feed_items = [item for item, _ in sorted_news] + [item for item, _ in sorted_concepts]
    manifest = build_manifest(feed_items)

    try:
        save_json(feed_items, str(FEED_PATH))
        save_json(manifest, str(MANIFEST_PATH))
    except OSError as exc:
        print(f"Error: failed to save feed outputs: {exc}")
        return 1

    print(f"Saved {len(feed_items)} feed items to {FEED_PATH}")
    print(f"Saved feed manifest to {MANIFEST_PATH}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
