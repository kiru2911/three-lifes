import csv
import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import requests
from dotenv import load_dotenv
from openai import OpenAI


QUERY = (
    "artificial intelligence OR generative AI OR machine learning "
    "OR large language model OR LLM OR AI chips OR OpenAI OR Anthropic "
    "OR Google DeepMind OR AI research OR neural network"
)
NEWS_API_URL = "https://newsapi.org/v2/everything"
DEFAULT_ARTICLE_LIMIT = 12
DEFAULT_SUMMARY_MODEL = "gpt-4.1-mini"
SUMMARY_PROMPT_VERSION = "v1"
MIN_TEXT_LENGTH = 120

# LOAD ENVIRONMENT VARIABLES
def load_environment() -> tuple[str, str, str]:
    project_root = Path(__file__).resolve().parent.parent
    load_dotenv(project_root / ".env")
    load_dotenv()

    news_api_key = os.getenv("NEWS_API_KEY")
    openai_api_key = os.getenv("OPENAI_API_KEY")
    summary_model = os.getenv("OPENAI_SUMMARY_MODEL", DEFAULT_SUMMARY_MODEL)

    if not news_api_key:
        raise ValueError("Missing NEWS_API_KEY. Add it to your .env file.")
    if not openai_api_key:
        raise ValueError("Missing OPENAI_API_KEY. Add it to your .env file.")

    return news_api_key, openai_api_key, summary_model

# FETCH NEWS FROM NEWSAPI
def fetch_news(
    news_api_key: str,
    page_size: int = DEFAULT_ARTICLE_LIMIT,
    from_date: str | None = None,
) -> list[dict[str, Any]]:
    params = {
        "q": QUERY,
        "language": "en",
        "sortBy": "publishedAt",
        "pageSize": page_size,
        "apiKey": news_api_key,
        "domains": (
            "techcrunch.com,theverge.com,wired.com,arstechnica.com,"
            "venturebeat.com,thenextweb.com,zdnet.com,engadget.com,"
            "siliconangle.com,reuters.com,bloomberg.com,cnbc.com,"
            "techradar.com,axios.com,theinformation.com"
        ),
        "excludeDomains": (
            "pypi.org,globenewswire.com,prnewswire.com,businesswire.com"
        ),
    }
    if from_date:
        params["from"] = from_date

    response = requests.get(NEWS_API_URL, params=params, timeout=30)
    response.raise_for_status()

    payload = response.json()
    if payload.get("status") != "ok":
        message = payload.get("message", "NewsAPI returned an unknown error.")
        raise RuntimeError(message)

    return payload.get("articles", [])

# CLEAN TEXT
def clean_text(value: str | None) -> str:
    if not value:
        return ""
    text = value.replace("\r", " ").replace("\n", " ")
    text = re.sub(r"\[\+\d+\s+chars\]$", "", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()

# BUILD ARTICLE TEXT
def build_article_text(article: dict[str, Any]) -> str:
    parts = [
        clean_text(article.get("title")),
        clean_text(article.get("description")),
        clean_text(article.get("content")),
    ]
    return " ".join(part for part in parts if part).strip()

# WORD COUNT
def word_count(text: str) -> int:
    return len(text.split()) if text else 0

# SUMMARISE ARTICLE
def summarise_article(
    client: OpenAI,
    raw_article: dict[str, Any],
    article: dict[str, Any],
    summary_model: str,
) -> str:
    article_text = clean_text(article.get("content", {}).get("full_text"))

    if len(article_text) < MIN_TEXT_LENGTH:
        fallback_parts = [
            clean_text(raw_article.get("title")),
            clean_text(raw_article.get("description")),
        ]
        article_text = " ".join(part for part in fallback_parts if part).strip()

    if not article_text:
        return "Summary unavailable because the article text was empty."

    try:
        response = client.responses.create(
            model=summary_model,
            input=[
                {
                    "role": "system",
                    "content": (
                        "You summarise news articles. Use only the article text provided. "
                        "Do not add outside facts. Keep the summary concise in 2 to 4 sentences."
                    ),
                },
                {
                    "role": "user",
                    "content": f"Article text:\n{article_text}",
                },
            ],
        )
        summary = response.output_text.strip()
        return summary or "Summary unavailable because the model returned no text."
    except Exception as exc:
        print(f"Warning: failed to summarise '{article.get('title', 'Untitled')}': {exc}")
        return "Summary unavailable due to summarisation error."


def load_existing_articles(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    try:
        with path.open("r", encoding="utf-8") as file:
            data = json.load(file)
        return data if isinstance(data, list) else []
    except (json.JSONDecodeError, OSError) as exc:
        print(f"Warning: could not read existing articles at {path}: {exc}")
        return []


def next_article_index(existing: list[dict[str, Any]]) -> int:
    max_index = 0
    for article in existing:
        article_id = article.get("article_id", "")
        match = re.search(r"(\d+)$", article_id)
        if match:
            max_index = max(max_index, int(match.group(1)))
    return max_index + 1


def latest_published_at(existing: list[dict[str, Any]]) -> str | None:
    timestamps = [a.get("published_at") for a in existing if a.get("published_at")]
    return max(timestamps) if timestamps else None


def normalise_article(
    raw_article: dict[str, Any],
    index: int,
    collected_at: str,
    summary_model: str,
) -> dict[str, Any]:
    full_text = build_article_text(raw_article)

    return {
        "article_id": f"article_{index:04d}",
        "source": {
            "name": clean_text(raw_article.get("source", {}).get("name")) or "Unknown source",
            "url": clean_text(raw_article.get("url")),
            "publisher_type": "news_website",
        },
        "title": clean_text(raw_article.get("title")) or "Untitled article",
        "author": clean_text(raw_article.get("author")) or "unknown",
        "image_url": raw_article.get("urlToImage", "") or "",
        "published_at": clean_text(raw_article.get("publishedAt")),
        "collected_at": collected_at,
        "language": "en",
        "region": "Global",
        "category": [],
        "keywords": [],
        "content": {
            "full_text": full_text,
            "word_count": word_count(full_text),
        },
        "ai_output": {
            "summary": "",
            "summary_model": summary_model,
            "summary_prompt_version": SUMMARY_PROMPT_VERSION,
        },
    }


def save_json(path: Path, articles: list[dict[str, Any]]) -> None:
    with path.open("w", encoding="utf-8") as file:
        json.dump(articles, file, indent=2, ensure_ascii=False)


def save_csv(path: Path, articles: list[dict[str, Any]]) -> None:
    fieldnames = [
        "article_id",
        "source_name",
        "source_url",
        "publisher_type",
        "title",
        "author",
        "published_at",
        "collected_at",
        "language",
        "region",
        "full_text",
        "word_count",
        "summary",
        "summary_model",
        "summary_prompt_version",
    ]

    with path.open("w", encoding="utf-8", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()

        for article in articles:
            writer.writerow(
                {
                    "article_id": article["article_id"],
                    "source_name": article["source"]["name"],
                    "source_url": article["source"]["url"],
                    "publisher_type": article["source"]["publisher_type"],
                    "title": article["title"],
                    "author": article["author"],
                    "published_at": article["published_at"],
                    "collected_at": article["collected_at"],
                    "language": article["language"],
                    "region": article["region"],
                    "full_text": article["content"]["full_text"],
                    "word_count": article["content"]["word_count"],
                    "summary": article["ai_output"]["summary"],
                    "summary_model": article["ai_output"]["summary_model"],
                    "summary_prompt_version": article["ai_output"]["summary_prompt_version"],
                }
            )


def main() -> int:
    try:
        news_api_key, openai_api_key, summary_model = load_environment()
    except ValueError as exc:
        print(f"Error: {exc}")
        return 1

    data_dir = Path(__file__).resolve().parent.parent / "data" / "articles"
    data_dir.mkdir(parents=True, exist_ok=True)

    json_path = data_dir / "articles.json"
    sample_json_path = data_dir / "articles_sample.json"
    csv_path = data_dir / "articles.csv"

    existing_articles = load_existing_articles(json_path)
    seen_urls = {a.get("source", {}).get("url") for a in existing_articles if a.get("source", {}).get("url")}
    from_date = latest_published_at(existing_articles)

    try:
        raw_articles = fetch_news(news_api_key, from_date=from_date)
    except requests.RequestException as exc:
        print(f"Error: failed to fetch articles from NewsAPI: {exc}")
        return 1
    except RuntimeError as exc:
        print(f"Error: NewsAPI returned an error: {exc}")
        return 1

    if not raw_articles:
        print("No articles were returned by NewsAPI.")
        return 0

    new_raw = [a for a in raw_articles if clean_text(a.get("url")) and clean_text(a.get("url")) not in seen_urls]

    print(f"Fetched {len(raw_articles)} from NewsAPI; {len(new_raw)} are new after dedupe.")

    if not new_raw:
        print("No new articles to add.")
        return 0

    collected_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    client = OpenAI(api_key=openai_api_key)
    start_index = next_article_index(existing_articles)
    new_articles: list[dict[str, Any]] = []

    for offset, raw_article in enumerate(new_raw):
        article = normalise_article(raw_article, start_index + offset, collected_at, summary_model)
        article["ai_output"]["summary"] = summarise_article(
            client, raw_article, article, summary_model
        )
        new_articles.append(article)

    articles = existing_articles + new_articles

    save_json(json_path, articles)
    save_json(sample_json_path, articles)
    save_csv(csv_path, articles)

    print(f"Added {len(new_articles)} new articles (total {len(articles)}) to {json_path} and {csv_path}.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
