"""Evaluate generated news summaries with Ollama."""

import csv
import json
import os
import re
import sys
from pathlib import Path
from typing import Any

import requests
from dotenv import load_dotenv

from clearml import Task

task = Task.init(
    project_name="three-lifes",
    task_name="evaluate-summaries-ollama",
    task_type=Task.TaskTypes.data_processing,
)

SUMMARY_PROMPT_VERSION = "v1"
DEFAULT_EVALUATION_MODEL = "llama3.1:8b"
MIN_ARTICLE_WORD_COUNT = 40
SUMMARY_FIELD = "summary_v2"
OLLAMA_URL = "http://localhost:11434/api/chat"

EVALUATION_PROMPT_TEMPLATE = """You are evaluating the quality of a generated summary for a news article.

Your task is to rate the summary based ONLY on the information provided in the article. Do not assume or invent missing details.

ARTICLE:
{article_text}

SUMMARY:
{summary}

Evaluate the summary using the following criteria:

1. Relevance
Does the summary include the key points of the article?
Compare the summary to the source document and identify the main points of the article.
Assess how well the summary covers the main points of the article, and how much irrelevant or redundant information it contains.
Score from 1 (poor) to 5 (excellent).

2. Faithfulness
Does the summary accurately reflect the article without introducing incorrect or hallucinated information?
Read the article carefully and identify the main facts and details it presents.
Read the summary and compare it to the article. Check if the summary contains any factual errors that are not supported by the article.
Score from 1 to 5.

3. Conciseness
Is the summary brief and free from unnecessary or redundant information?
For each sentence in the summary, your job is to evaluate if the sentence is vague, and hence does not help in summarizing the key points of the text.
Vague sentences are those that do not directly mention a main point, e.g. 'this summary describes the reasons for China's AI policy'.
Such a sentence does not mention the specific reasons, and is vague and uninformative.
Sentences that use phrases such as 'the article suggests', 'the author describes', 'the text discusses' are also considered vague and verbose.
Score from 1 to 5.

4. Coherence
 Read the article carefully and identify the main topic and key points.
 Read the summary and compare it to the article. Check if the summary covers the main topic and key points of the article, and if it presents them in a clear and logical order.
Score from 1 to 5.

5. Usefulness
Does the summary help a reader quickly understand what happened and why it matters?
How useful is the article to the user in relation to the tech world. How much does the article teach them about things going on in the techworld

IMPORTANT for usefulness:
- Penalise vague sentences such as:
  - “the article discusses...”
  - “this summary explains...”
  - “the author describes...”
- Penalise summaries that do not clearly state concrete facts or outcomes
- Reward summaries that clearly explain key insights or implications

Return ONLY valid JSON in this exact structure:
{{
  "relevance": 0,
  "faithfulness": 0,
  "conciseness": 0,
  "coherence": 0,
  "usefulness": 0,
  "overall_score": 0.0,
  "explanations": {{
    "relevance": "",
    "faithfulness": "",
    "conciseness": "",
    "coherence": "",
    "usefulness": ""
  }}
}}"""

CSV_COLUMNS = [
    "article_id",
    "article_title",
    "model",
    "prompt_version",
    "summary",
    "technical_terms",
    "technical_term_names",
    "relevance",
    "faithfulness",
    "conciseness",
    "coherence",
    "usefulness",
    "overall_score",
    "relevance_explanation",
    "faithfulness_explanation",
    "conciseness_explanation",
    "coherence_explanation",
    "usefulness_explanation",
]

SCORE_FIELDS = [
    "relevance",
    "faithfulness",
    "conciseness",
    "coherence",
    "usefulness",
]


def get_project_root() -> Path:
    return Path(__file__).resolve().parent.parent


def load_environment() -> str:
    project_root = get_project_root()
    load_dotenv(project_root / ".env")
    load_dotenv()

    evaluation_model = os.getenv("OLLAMA_EVALUATION_MODEL", DEFAULT_EVALUATION_MODEL)
    return evaluation_model


def clean_text(value: Any) -> str:
    if not value:
        return ""

    text = str(value).replace("\r", " ").replace("\n", " ")
    text = re.sub(r"\s+", " ", text)
    return text.strip()


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


def word_count(text: str) -> int:
    return len(text.split()) if text else 0


def load_articles(path: Path) -> list[dict[str, Any]]:
    with path.open("r", encoding="utf-8") as file:
        data = json.load(file)

    if not isinstance(data, list):
        raise ValueError("Expected the dataset JSON to contain a list of articles.")

    return data


def build_article_text(article: dict[str, Any]) -> str:
    content = article.get("content", {})
    full_text = clean_text(content.get("full_text"))

    if full_text and word_count(full_text) >= MIN_ARTICLE_WORD_COUNT:
        return full_text

    title = clean_text(article.get("title"))
    description = clean_text(article.get("description") or content.get("description"))

    if title and description:
        fallback_text = f"{title}\n\n{description}"
        if word_count(fallback_text) >= 5:
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


def parse_score(value: Any, field_name: str) -> int:
    try:
        score = int(value)
    except (TypeError, ValueError) as exc:
        raise ValueError(f"Invalid score for '{field_name}': {value}") from exc

    if score < 1 or score > 5:
        raise ValueError(f"Score for '{field_name}' must be between 1 and 5.")

    return score


def normalise_evaluation(payload: dict[str, Any]) -> dict[str, Any]:
    explanations = payload.get("explanations")
    if not isinstance(explanations, dict):
        raise ValueError("The evaluation response is missing 'explanations'.")

    evaluation: dict[str, Any] = {"explanations": {}}

    for field_name in SCORE_FIELDS:
        evaluation[field_name] = parse_score(payload.get(field_name), field_name)
        evaluation["explanations"][field_name] = clean_text(explanations.get(field_name))

    overall_score = payload.get("overall_score")
    if overall_score in (None, ""):
        evaluation["overall_score"] = round(
            sum(evaluation[field_name] for field_name in SCORE_FIELDS) / len(SCORE_FIELDS),
            2,
        )
    else:
        try:
            evaluation["overall_score"] = round(float(overall_score), 2)
        except (TypeError, ValueError) as exc:
            raise ValueError(f"Invalid overall_score: {overall_score}") from exc

    return evaluation


def evaluate_summary(
    article_text: str,
    summary: str,
    evaluation_model: str,
) -> dict[str, Any]:
    prompt = EVALUATION_PROMPT_TEMPLATE.format(
        article_text=article_text,
        summary=summary,
    )

    payload = {
        "model": evaluation_model,
        "messages": [
            {
                "role": "system",
                "content": "You are a strict summary evaluator. Return only valid JSON.",
            },
            {
                "role": "user",
                "content": prompt,
            },
        ],
        "stream": False,
    }

    response = requests.post(OLLAMA_URL, json=payload, timeout=180)
    response.raise_for_status()

    response_payload = response.json()
    response_text = clean_text(response_payload.get("message", {}).get("content"))

    if not response_text:
        raise ValueError("The model returned an empty response.")

    json_text = extract_json_text(response_text)
    parsed_payload = json.loads(json_text)

    if not isinstance(parsed_payload, dict):
        raise ValueError("The model response was not a JSON object.")

    return normalise_evaluation(parsed_payload)


def build_result_row(article: dict[str, Any], evaluation: dict[str, Any]) -> dict[str, Any]:
    ai_output = article.get("ai_output", {})
    explanations = evaluation["explanations"]

    return {
        "article_id": clean_text(article.get("article_id")),
        "article_title": clean_text(article.get("title")),
        "model": clean_text(ai_output.get("summary_v2_model") or ai_output.get("summary_model")),
        "prompt_version": clean_text(
            ai_output.get("summary_v2_prompt_version") or ai_output.get("summary_prompt_version")
        ),
        "summary": clean_text(ai_output.get(SUMMARY_FIELD)),
        "technical_terms": format_technical_terms_for_csv(
            ai_output.get("technical_terms", [])
        ),
        "technical_term_names": format_technical_term_names_for_csv(
            ai_output.get("technical_terms", [])
        ),
        "relevance": evaluation["relevance"],
        "faithfulness": evaluation["faithfulness"],
        "conciseness": evaluation["conciseness"],
        "coherence": evaluation["coherence"],
        "usefulness": evaluation["usefulness"],
        "overall_score": evaluation["overall_score"],
        "relevance_explanation": explanations["relevance"],
        "faithfulness_explanation": explanations["faithfulness"],
        "conciseness_explanation": explanations["conciseness"],
        "coherence_explanation": explanations["coherence"],
        "usefulness_explanation": explanations["usefulness"],
    }


def save_results_json(path: Path, rows: list[dict[str, Any]]) -> None:
    with path.open("w", encoding="utf-8") as file:
        json.dump(rows, file, indent=2, ensure_ascii=False)


def save_results_csv(path: Path, rows: list[dict[str, Any]]) -> None:
    with path.open("w", encoding="utf-8", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=CSV_COLUMNS)
        writer.writeheader()
        writer.writerows(rows)


def main() -> int:
    try:
        evaluation_model = load_environment()
    except ValueError as exc:
        print(f"Error: {exc}")
        return 1

    project_root = get_project_root()
    data_dir = project_root / "data" / "ollama_output"

    input_path = data_dir / "articles_with_v2.json"
    json_output_path = data_dir / "evaluation_results_v2.json"
    csv_output_path = data_dir / "evaluation_results_v2.csv"

    if not input_path.exists():
        print(f"Error: dataset not found at {input_path}")
        return 1

    try:
        articles = load_articles(input_path)
    except (OSError, json.JSONDecodeError, ValueError) as exc:
        print(f"Error: failed to load dataset: {exc}")
        return 1

    result_rows: list[dict[str, Any]] = []
    skipped_count = 0
    failed_count = 0

    for article in articles:
        article_id = clean_text(article.get("article_id")) or "unknown_article"
        summary = clean_text(article.get("ai_output", {}).get(SUMMARY_FIELD))
        article_text = build_article_text(article)

        if not article_text:
            print(f"Skipping {article_id}: missing article text or fallback title/description.")
            skipped_count += 1
            continue

        if not summary:
            print(f"Skipping {article_id}: missing generated summary.")
            skipped_count += 1
            continue

        try:
            evaluation = evaluate_summary(article_text, summary, evaluation_model)
            result_rows.append(build_result_row(article, evaluation))
            print(f"Evaluated {article_id}")
        except Exception as exc:
            print(f"Failed to evaluate {article_id}: {exc}")
            failed_count += 1

    save_results_json(json_output_path, result_rows)
    save_results_csv(csv_output_path, result_rows)

    print(
        f"Saved {len(result_rows)} evaluation results to {json_output_path} and {csv_output_path}."
    )
    print(f"Skipped: {skipped_count}. Failed: {failed_count}.")
    return 0


if __name__ == "__main__":
    sys.exit(main())