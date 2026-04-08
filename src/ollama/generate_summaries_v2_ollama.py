"""Generate v2 summaries for existing news articles and extract key technical terms."""

import csv
import json
import os
import re
import sys
from copy import deepcopy
from pathlib import Path
from typing import Any

import requests
from dotenv import load_dotenv

from clearml import Task

task = Task.init(
    project_name="three-lifes",
    task_name="generate-summaries-v2-ollama",
    task_type=Task.TaskTypes.data_processing,
)

DEFAULT_SUMMARY_MODEL = "llama3.1:8b"
SUMMARY_V2_PROMPT_VERSION = "v2"
TECH_TERMS_PROMPT_VERSION = "v2"
MIN_FULL_TEXT_LENGTH = 120
MIN_FALLBACK_TEXT_LENGTH = 20
OLLAMA_URL = "http://localhost:11434/api/chat"

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

TECH_TERMS_PROMPT = """You are extracting key technical terminology from a news summary for a micro-learning AI news app.

Task:
Identify important technical terms, AI concepts, model names, architectures, methods, tools, benchmarks, and domain-specific jargon that appear in the text.

For each identified term, provide a beginner-friendly explanation in at most 2 to 3 sentences.

Rules:
- Only extract terms explicitly present in the text.
- Do not invent or infer terms that are not written.
- Prefer concise canonical terms.
- Keep abbreviations if they appear in the text, e.g. LLM, LSTM, GPU, RAG.
- Include proper technical names such as Transformer, diffusion model, fine-tuning, inference, multimodal model, vector database.
- Exclude generic non-technical words like company, startup, product, market, software unless they are clearly technical in context.
- Return at most 10 terms.
- Remove duplicates.
- Preserve original capitalization where appropriate.
- Explanations must be clear, factual, simple, and suitable for beginners.
- Explanations must be based on general technical understanding of the term.
- Keep each explanation short: maximum 2 to 3 sentences.

Return ONLY valid JSON in this exact structure:
{
  "technical_terms": [
    {
      "term": "LLM",
      "explanation": "A large language model is an AI system trained on very large amounts of text to understand and generate human-like language. It can be used for tasks like chat, summarization, and question answering."
    },
    {
      "term": "LSTM",
      "explanation": "LSTM is a type of recurrent neural network designed to remember information over longer sequences. It was commonly used for language and time-series tasks before transformer models became dominant."
    }
  ]
}"""


def get_project_root() -> Path:
    current = Path(__file__).resolve()
    for parent in [current.parent, *current.parents]:
        if (parent / "data/ollama_output").exists():
            return parent
    raise FileNotFoundError("Could not locate project root containing the data directory.")


def load_environment() -> str:
    project_root = get_project_root()
    load_dotenv(project_root / ".env")
    load_dotenv()

    summary_model = os.getenv("OLLAMA_SUMMARY_MODEL", DEFAULT_SUMMARY_MODEL)
    return summary_model


def clean_text(value: Any) -> str:
    if not value:
        return ""

    text = str(value).replace("\r", " ").replace("\n", " ")
    text = re.sub(r"\[\+\d+\s+chars\]$", "", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def load_articles(path: Path) -> list[dict[str, Any]]:
    with path.open("r", encoding="utf-8") as file:
        data = json.load(file)

    if not isinstance(data, list):
        raise ValueError("Expected the dataset JSON to contain a list of articles.")

    return data


def build_source_text(article: dict[str, Any]) -> str:
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


def extract_json_text(model_output: str) -> str:
    cleaned_output = model_output.strip()

    if cleaned_output.startswith("```"):
        cleaned_output = re.sub(r"^```(?:json)?\s*", "", cleaned_output)
        cleaned_output = re.sub(r"\s*```$", "", cleaned_output)

    if cleaned_output.startswith("{") and cleaned_output.endswith("}"):
        return cleaned_output

    match = re.search(r"\{.*\}", cleaned_output, re.DOTALL)
    if match:
        return match.group(0)

    raise ValueError("No JSON object found in the model response.")


def normalise_technical_terms(payload: dict[str, Any]) -> list[dict[str, str]]:
    terms = payload.get("technical_terms", [])

    if not isinstance(terms, list):
        raise ValueError("'technical_terms' must be a list.")

    cleaned_terms: list[dict[str, str]] = []
    seen: set[str] = set()

    for item in terms:
        if not isinstance(item, dict):
            continue

        term = clean_text(item.get("term"))
        explanation = clean_text(item.get("explanation"))

        if not term:
            continue

        key = term.lower()
        if key in seen:
            continue

        seen.add(key)
        cleaned_terms.append(
            {
                "term": term,
                "explanation": explanation,
            }
        )

    return cleaned_terms[:10]


def format_technical_terms_for_csv(technical_terms: list[dict[str, str]]) -> str:
    if not isinstance(technical_terms, list):
        return ""

    parts: list[str] = []
    for item in technical_terms:
        if not isinstance(item, dict):
            continue

        term = clean_text(item.get("term"))
        explanation = clean_text(item.get("explanation"))

        if not term:
            continue

        if explanation:
            parts.append(f"{term}: {explanation}")
        else:
            parts.append(term)

    return " | ".join(parts)


def format_technical_term_names_for_csv(technical_terms: list[dict[str, str]]) -> str:
    if not isinstance(technical_terms, list):
        return ""

    names: list[str] = []
    for item in technical_terms:
        if not isinstance(item, dict):
            continue

        term = clean_text(item.get("term"))
        if term:
            names.append(term)

    return ", ".join(names)


def summarise_article_v2(article_text: str, summary_model: str) -> str:
    payload = {
        "model": summary_model,
        "messages": [
            {"role": "system", "content": SUMMARY_V2_PROMPT},
            {"role": "user", "content": f"Article text:\n{article_text}"},
        ],
        "stream": False,
    }

    response = requests.post(OLLAMA_URL, json=payload, timeout=180)
    response.raise_for_status()

    response_payload = response.json()
    summary = clean_text(response_payload.get("message", {}).get("content"))

    if not summary:
        raise ValueError("The model returned an empty summary.")

    return summary


def extract_technical_terms(text: str, summary_model: str) -> list[dict[str, str]]:
    payload = {
        "model": summary_model,
        "messages": [
            {"role": "system", "content": TECH_TERMS_PROMPT},
            {"role": "user", "content": f"Text:\n{text}"},
        ],
        "stream": False,
    }

    response = requests.post(OLLAMA_URL, json=payload, timeout=180)
    response.raise_for_status()

    response_payload = response.json()
    response_text = clean_text(response_payload.get("message", {}).get("content"))

    if not response_text:
        raise ValueError("The model returned an empty response for technical terms.")

    json_text = extract_json_text(response_text)
    parsed_payload = json.loads(json_text)

    if not isinstance(parsed_payload, dict):
        raise ValueError("The technical terms response was not a JSON object.")

    return normalise_technical_terms(parsed_payload)


def prepare_article_for_v2(article: dict[str, Any], summary_model: str) -> dict[str, Any]:
    updated_article = deepcopy(article)
    ai_output = updated_article.setdefault("ai_output", {})

    ai_output["summary_v2"] = clean_text(ai_output.get("summary_v2"))
    ai_output["summary_v2_model"] = summary_model
    ai_output["summary_v2_prompt_version"] = SUMMARY_V2_PROMPT_VERSION

    technical_terms = ai_output.get("technical_terms", [])
    ai_output["technical_terms"] = technical_terms if isinstance(technical_terms, list) else []
    ai_output["technical_terms_model"] = summary_model
    ai_output["technical_terms_prompt_version"] = TECH_TERMS_PROMPT_VERSION

    return updated_article


def save_json(path: Path, articles: list[dict[str, Any]]) -> None:
    with path.open("w", encoding="utf-8") as file:
        json.dump(articles, file, indent=2, ensure_ascii=False)


def save_csv(path: Path, articles: list[dict[str, Any]]) -> None:
    fieldnames = [
        "article_id",
        "article_title",
        "summary_v1",
        "summary_v2",
        "technical_terms",
        "technical_term_names",
        "model_v1",
        "model_v2",
        "technical_terms_model",
        "prompt_version_v1",
        "prompt_version_v2",
        "technical_terms_prompt_version",
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
                    "technical_terms": format_technical_terms_for_csv(
                        ai_output.get("technical_terms", [])
                    ),
                    "technical_term_names": format_technical_term_names_for_csv(
                        ai_output.get("technical_terms", [])
                    ),
                    "model_v1": clean_text(ai_output.get("summary_model")),
                    "model_v2": clean_text(ai_output.get("summary_v2_model")),
                    "technical_terms_model": clean_text(ai_output.get("technical_terms_model")),
                    "prompt_version_v1": clean_text(ai_output.get("summary_prompt_version")),
                    "prompt_version_v2": clean_text(ai_output.get("summary_v2_prompt_version")),
                    "technical_terms_prompt_version": clean_text(
                        ai_output.get("technical_terms_prompt_version")
                    ),
                }
            )


def main() -> int:
    try:
        summary_model = load_environment()
    except (ValueError, FileNotFoundError) as exc:
        print(f"Error: {exc}")
        return 1

    project_root = get_project_root()
    data_dir = project_root / "data/ollama_output"
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

    updated_articles: list[dict[str, Any]] = []

    for article in articles:
        article_id = clean_text(article.get("article_id")) or "unknown_article"
        source_text = build_source_text(article)
        updated_article = prepare_article_for_v2(article, summary_model)
        ai_output = updated_article["ai_output"]

        if not source_text:
            print(f"Skipping {article_id}: no usable source text found.")
            ai_output["technical_terms"] = []
            updated_articles.append(updated_article)
            continue

        try:
            ai_output["summary_v2"] = summarise_article_v2(source_text, summary_model)
            print(f"Generated v2 summary for {article_id}")
        except Exception as exc:
            print(f"Failed to summarise {article_id}: {exc}")
            ai_output["summary_v2"] = ""

        if ai_output["summary_v2"]:
            try:
                ai_output["technical_terms"] = extract_technical_terms(
                    ai_output["summary_v2"],
                    summary_model,
                )
                print(f"Extracted technical terms for {article_id}")
            except Exception as exc:
                print(f"Failed to extract technical terms for {article_id}: {exc}")
                ai_output["technical_terms"] = []
        else:
            ai_output["technical_terms"] = []

        updated_articles.append(updated_article)

    save_json(output_json_path, updated_articles)
    save_csv(output_csv_path, updated_articles)

    print(f"Saved {len(updated_articles)} articles to {output_json_path} and {output_csv_path}.")
    return 0


if __name__ == "__main__":
    sys.exit(main())