"""Generate v2 summaries for existing news articles.

This script reads articles from ``data/articles.json``, generates a new
summary for each article using an improved prompt, and saves the results to
new output files without overwriting the original v1 summary fields.
"""

import csv
import json
import os
import re
import sys
from copy import deepcopy
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from openai import OpenAI


DEFAULT_SUMMARY_MODEL = "gpt-4.1-mini"
SUMMARY_V2_PROMPT_VERSION = "v2"
MIN_FULL_TEXT_LENGTH = 120
MIN_FALLBACK_TEXT_LENGTH = 20

SUMMARY_V2_PROMPT = """You are generating a short news summary for a micro-learning app.

Summarize the article in 2 to 4 sentences.

Requirements:
- State the main fact or event directly.
- Do NOT begin with vague phrases such as:
  - "The article discusses..."
  - "The article highlights..."
  - "The author explains..."
  - "This summary describes..."
- Focus on the most important facts and why the news matters.
- Focus on Key Details such as Dates, Company names, and any relevant statistics
- Be concrete and informative.
- Do not invent details that are not supported by the source text.
- Keep the writing clear, concise, and suitable for a reader who wants to quickly learn from the news.

Return only the summary text."""


def load_environment() -> tuple[str, str]:
    """Load environment variables for the OpenAI API."""
    project_root = Path(__file__).resolve().parent.parent
    load_dotenv(project_root / ".env")
    load_dotenv()

    openai_api_key = os.getenv("OPENAI_API_KEY")
    summary_model = os.getenv("OPENAI_SUMMARY_MODEL", DEFAULT_SUMMARY_MODEL)

    if not openai_api_key:
        raise ValueError("Missing OPENAI_API_KEY. Add it to your .env file.")

    return openai_api_key, summary_model


def clean_text(value: Any) -> str:
    """Normalise whitespace and convert values to strings."""
    if not value:
        return ""

    text = str(value).replace("\r", " ").replace("\n", " ")
    text = re.sub(r"\[\+\d+\s+chars\]$", "", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def load_articles(path: Path) -> list[dict[str, Any]]:
    """Load article records from a JSON file."""
    with path.open("r", encoding="utf-8") as file:
        data = json.load(file)

    if not isinstance(data, list):
        raise ValueError("Expected the dataset JSON to contain a list of articles.")

    return data


def build_source_text(article: dict[str, Any]) -> str:
    """Build the best available source text for summarisation."""
    full_text = clean_text(article.get("content", {}).get("full_text"))
    if len(full_text) >= MIN_FULL_TEXT_LENGTH:
        return full_text

    fallback_parts = [
        clean_text(article.get("title")),
        clean_text(article.get("description")),
        clean_text(article.get("content", {}).get("description")),
    ]
    fallback_text = " ".join(part for part in fallback_parts if part).strip()

    if len(fallback_text) >= MIN_FALLBACK_TEXT_LENGTH:
        return fallback_text

    return ""


def summarise_article_v2(client: OpenAI, article_text: str, summary_model: str) -> str:
    """Generate a v2 summary for one article."""
    response = client.responses.create(
        model=summary_model,
        input=[
            {"role": "system", "content": SUMMARY_V2_PROMPT},
            {"role": "user", "content": f"Article text:\n{article_text}"},
        ],
    )

    summary = response.output_text.strip()
    if not summary:
        raise ValueError("The model returned an empty summary.")

    return summary


def prepare_article_for_v2(article: dict[str, Any], summary_model: str) -> dict[str, Any]:
    """Copy one article and ensure the v2 fields exist."""
    updated_article = deepcopy(article)
    ai_output = updated_article.setdefault("ai_output", {})

    ai_output["summary_v2"] = clean_text(ai_output.get("summary_v2"))
    ai_output["summary_v2_model"] = summary_model
    ai_output["summary_v2_prompt_version"] = SUMMARY_V2_PROMPT_VERSION
    return updated_article


def save_json(path: Path, articles: list[dict[str, Any]]) -> None:
    """Save articles to a JSON file."""
    with path.open("w", encoding="utf-8") as file:
        json.dump(articles, file, indent=2, ensure_ascii=False)


def save_csv(path: Path, articles: list[dict[str, Any]]) -> None:
    """Save a flat CSV for easy v1 vs v2 comparison."""
    fieldnames = [
        "article_id",
        "article_title",
        "summary_v1",
        "summary_v2",
        "model_v1",
        "model_v2",
        "prompt_version_v1",
        "prompt_version_v2",
    ]

    with path.open("w", encoding="utf-8", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()

        for article in articles:
            ai_output = article.get("ai_output", {})
            writer.writerow(
                {
                    "article_id": clean_text(article.get("article_id")),
                    "article_title": clean_text(article.get("title")),
                    "summary_v1": clean_text(ai_output.get("summary")),
                    "summary_v2": clean_text(ai_output.get("summary_v2")),
                    "model_v1": clean_text(ai_output.get("summary_model")),
                    "model_v2": clean_text(ai_output.get("summary_v2_model")),
                    "prompt_version_v1": clean_text(ai_output.get("summary_prompt_version")),
                    "prompt_version_v2": clean_text(ai_output.get("summary_v2_prompt_version")),
                }
            )


def main() -> int:
    """Generate v2 summaries for the existing article dataset."""
    try:
        openai_api_key, summary_model = load_environment()
    except ValueError as exc:
        print(f"Error: {exc}")
        return 1

    project_root = Path(__file__).resolve().parent.parent
    data_dir = project_root / "data"
    input_path = data_dir / "articles.json"
    output_json_path = data_dir / "articles_with_v2.json"
    output_csv_path = data_dir / "articles_with_v2.csv"

    if not input_path.exists():
        print(f"Error: dataset not found at {input_path}")
        return 1

    try:
        articles = load_articles(input_path)
    except (OSError, json.JSONDecodeError, ValueError) as exc:
        print(f"Error: failed to load dataset: {exc}")
        return 1

    client = OpenAI(api_key=openai_api_key)
    updated_articles: list[dict[str, Any]] = []

    for article in articles:
        article_id = clean_text(article.get("article_id")) or "unknown_article"
        source_text = build_source_text(article)
        updated_article = prepare_article_for_v2(article, summary_model)
        ai_output = updated_article["ai_output"]

        if not source_text:
            print(f"Skipping {article_id}: no usable source text found.")
            updated_articles.append(updated_article)
            continue

        try:
            ai_output["summary_v2"] = summarise_article_v2(client, source_text, summary_model)
            print(f"Generated v2 summary for {article_id}")
        except Exception as exc:
            print(f"Failed to summarise {article_id}: {exc}")
            ai_output["summary_v2"] = ""

        updated_articles.append(updated_article)

    save_json(output_json_path, updated_articles)
    save_csv(output_csv_path, updated_articles)

    print(f"Saved {len(updated_articles)} articles to {output_json_path} and {output_csv_path}.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
