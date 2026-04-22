"""Evaluate generated concept content with an LLM-as-judge approach.

Reads concept records from ``data/concepts/concepts_generated_v4.json``,
evaluates each concept across 7 quality metrics using a single OpenAI call,
and saves results to JSON and CSV files.
"""

import csv
import json
import os
import re
import sys
import time
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from openai import OpenAI

PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

DEFAULT_JUDGE_MODEL = "gpt-4.1"
SLEEP_BETWEEN_CALLS = 1

METRICS = {
    "faithfulness": (
        "Does the explanation accurately represent the concept without factual errors "
        "or hallucinated information? Use your own knowledge of the topic as reference. "
        "Score from 1 (many errors) to 5 (fully accurate)."
    ),
    "coherence": (
        "Is the explanation presented in a clear and logical order? "
        "Does it flow naturally from introduction to detail? "
        "Score from 1 (hard to follow) to 5 (perfectly structured)."
    ),
    "conciseness": (
        "Is the content free from vague, redundant, or padded sentences? "
        "Penalise phrases like 'this concept explains', 'in the world of AI'. "
        "Score from 1 (very verbose) to 5 (tight and focused)."
    ),
    "accuracy": (
        "Does the explanation correctly represent the concept without oversimplifications "
        "that would mislead a learner? "
        "Score from 1 (misleading) to 5 (technically correct)."
    ),
    "educational_value": (
        "Does the content genuinely teach the reader something they can retain and apply? "
        "Does it go beyond a surface-level definition to explain mechanism and real-world use? "
        "Score from 1 (just a definition) to 5 (genuinely insightful)."
    ),
    "analogy_quality": (
        "Is the analogy accurate, relatable, and genuinely clarifying rather than misleading? "
        "Does it make the concept click without sacrificing technical correctness? "
        "If no analogy is present, score 1. "
        "Score from 1 (missing or misleading) to 5 (excellent)."
    ),
    "difficulty_appropriateness": (
        "Does the complexity, vocabulary, and depth match the stated difficulty level? "
        "Beginner: no prior knowledge needed. "
        "Intermediate: assumes basic ML familiarity. "
        "Advanced: can use technical terminology freely. "
        "Score from 1 (wrong level) to 5 (perfectly matched)."
    ),
}

METRIC_NAMES = list(METRICS.keys())

JUDGE_PROMPT_TEMPLATE = """You are an expert AI educator evaluating concept explanations for a micro-learning app called Thinkly.

Concept topic: {topic}
Category: {category}
Difficulty: {difficulty}

Generated content to evaluate:
Title: {title}
Summary: {summary}
Analogy: {analogy}
Why it matters: {why_it_matters}
Deep dive: {body_text}

Evaluate the content against each metric below. For each metric provide:
- score: integer from 1 to 5
- reason: one sentence justification

Metrics:
{metrics_block}

Be critical and discriminating in your scoring. 
A score of 5 should be rare and reserved for exceptional content. 
Most good content should score 3-4. 
You must find at least one weakness in each concept to justify 
not giving a perfect score across all metrics.


Return ONLY a JSON object in this exact format:
{{
  "faithfulness":               {{"score": 0, "reason": ""}},
  "coherence":                  {{"score": 0, "reason": ""}},
  "conciseness":                {{"score": 0, "reason": ""}},
  "accuracy":                   {{"score": 0, "reason": ""}},
  "educational_value":          {{"score": 0, "reason": ""}},
  "analogy_quality":            {{"score": 0, "reason": ""}},
  "difficulty_appropriateness": {{"score": 0, "reason": ""}}
}}"""

CSV_COLUMNS = [
    "concept_id",
    "topic",
    "category",
    "difficulty",
    "prompt_version",
    "faithfulness",
    "coherence",
    "conciseness",
    "accuracy",
    "educational_value",
    "analogy_quality",
    "difficulty_appropriateness",
    "average_score",
]


def load_environment() -> tuple[OpenAI, str]:
    """Load environment variables and return an OpenAI client and model name."""
    load_dotenv(PROJECT_ROOT / ".env")
    load_dotenv()

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("Missing OPENAI_API_KEY. Add it to your .env file.")

    model = os.getenv("OPENAI_JUDGE_MODEL", DEFAULT_JUDGE_MODEL)
    return OpenAI(api_key=api_key), model


def clean_text(value: Any) -> str:
    """Return a compact string value with normalised whitespace."""
    if not value:
        return ""
    text = str(value).replace("\r", " ").replace("\n", " ")
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def load_concepts(path: Path) -> list[dict[str, Any]]:
    """Load concept records from a JSON file."""
    with path.open("r", encoding="utf-8") as f:
        data = json.load(f)

    if not isinstance(data, list):
        raise ValueError("Expected the concepts JSON to contain a list.")

    return data


def build_metrics_block() -> str:
    """Format the metrics dict into a numbered prompt block."""
    lines = []
    for i, (name, description) in enumerate(METRICS.items(), start=1):
        lines.append(f"{i}. {name}\n{description.strip()}")
    return "\n\n".join(lines)


def extract_json_text(model_output: str) -> str:
    """Extract a JSON object from model output, even if wrapped in markdown."""
    cleaned = model_output.strip()

    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)

    if cleaned.startswith("{") and cleaned.endswith("}"):
        return cleaned

    match = re.search(r"\{.*\}", cleaned, re.DOTALL)
    if match:
        return match.group(0)

    raise ValueError("No JSON object found in the model response.")


def parse_score(value: Any, field_name: str) -> int:
    """Parse and validate a 1–5 integer score."""
    try:
        score = int(value)
    except (TypeError, ValueError) as exc:
        raise ValueError(f"Invalid score for '{field_name}': {value!r}") from exc

    if not 1 <= score <= 5:
        raise ValueError(f"Score for '{field_name}' must be between 1 and 5, got {score}.")

    return score


def normalise_scores(payload: dict[str, Any]) -> dict[str, Any]:
    """Validate the judge payload and return clean scores + reasons."""
    scores: dict[str, Any] = {}

    for name in METRIC_NAMES:
        entry = payload.get(name)
        if not isinstance(entry, dict):
            raise ValueError(f"Missing or malformed entry for metric '{name}'.")

        scores[name] = {
            "score": parse_score(entry.get("score"), name),
            "reason": clean_text(entry.get("reason")),
        }

    scores["average_score"] = round(
        sum(scores[name]["score"] for name in METRIC_NAMES) / len(METRIC_NAMES),
        2,
    )

    return scores


def evaluate_concept(
    concept: dict[str, Any],
    client: OpenAI,
    model: str,
    metrics_block: str,
) -> dict[str, Any]:
    """Run one LLM judge call for a concept and return normalised scores."""
    ai = concept.get("ai_output", {})

    prompt = JUDGE_PROMPT_TEMPLATE.format(
        topic=clean_text(concept.get("topic")),
        category=clean_text(concept.get("category")),
        difficulty=clean_text(concept.get("difficulty")),
        title=clean_text(ai.get("title")),
        summary=clean_text(ai.get("summary")),
        analogy=clean_text(ai.get("analogy")) or "None provided.",
        why_it_matters=clean_text(ai.get("why_it_matters")),
        body_text=clean_text(ai.get("post_content")),
        metrics_block=metrics_block,
    )

    response = client.chat.completions.create(
        model=model,
        messages=[
            {
                "role": "system",
                "content": "You are a strict concept quality evaluator. Return only valid JSON.",
            },
            {"role": "user", "content": prompt},
        ],
        temperature=0,
    )

    raw = (response.choices[0].message.content or "").strip()
    if not raw:
        raise ValueError("The model returned an empty response.")

    json_text = extract_json_text(raw)
    parsed = json.loads(json_text)

    if not isinstance(parsed, dict):
        raise ValueError("The model response was not a JSON object.")

    return normalise_scores(parsed)


def build_result_record(
    concept: dict[str, Any],
    scores: dict[str, Any],
) -> dict[str, Any]:
    """Build one full output record for JSON export."""
    ai = concept.get("ai_output", {})

    metric_scores = {name: scores[name] for name in METRIC_NAMES}

    return {
        "concept_id": clean_text(concept.get("concept_id")),
        "topic": clean_text(concept.get("topic")),
        "category": clean_text(concept.get("category")),
        "difficulty": clean_text(concept.get("difficulty")),
        "prompt_version": clean_text(ai.get("prompt_version")),
        "model": clean_text(ai.get("model")),
        "scores": metric_scores,
        "average_score": scores["average_score"],
    }


def build_csv_row(record: dict[str, Any]) -> dict[str, Any]:
    """Flatten one result record into a CSV row."""
    row: dict[str, Any] = {
        "concept_id": record["concept_id"],
        "topic": record["topic"],
        "category": record["category"],
        "difficulty": record["difficulty"],
        "prompt_version": record["prompt_version"],
    }
    for name in METRIC_NAMES:
        row[name] = record["scores"][name]["score"]
    row["average_score"] = record["average_score"]
    return row


def save_results_json(path: Path, records: list[dict[str, Any]]) -> None:
    with path.open("w", encoding="utf-8") as f:
        json.dump(records, f, indent=2, ensure_ascii=False)


def save_results_csv(path: Path, records: list[dict[str, Any]]) -> None:
    with path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=CSV_COLUMNS)
        writer.writeheader()
        writer.writerows(build_csv_row(r) for r in records)


def print_summary(records: list[dict[str, Any]]) -> None:
    """Print aggregate stats, top 3 and bottom 3 concepts by average score."""
    if not records:
        print("No results to summarise.")
        return

    print("\n" + "=" * 60)
    print("EVALUATION SUMMARY")
    print("=" * 60)
    print(f"Total concepts evaluated: {len(records)}")

    print("\nAverage score per metric:")
    for name in METRIC_NAMES:
        avg = sum(r["scores"][name]["score"] for r in records) / len(records)
        print(f"  {name:<30} {avg:.2f}")

    overall_avg = sum(r["average_score"] for r in records) / len(records)
    print(f"\n  {'overall average':<30} {overall_avg:.2f}")

    sorted_records = sorted(records, key=lambda r: r["average_score"], reverse=True)

    print("\nTop 3 concepts:")
    for r in sorted_records[:3]:
        print(f"  [{r['average_score']:.2f}] {r['concept_id']} — {r['topic']}")

    print("\nBottom 3 concepts:")
    for r in sorted_records[-3:]:
        print(f"  [{r['average_score']:.2f}] {r['concept_id']} — {r['topic']}")

    print("=" * 60)


def main() -> int:
    """Run the concept evaluation pipeline."""
    try:
        client, model = load_environment()
    except ValueError as exc:
        print(f"Error: {exc}")
        return 1

    concepts_dir = PROJECT_ROOT / "data" / "concepts"
    evaluation_dir = PROJECT_ROOT / "data" / "evaluation"
    evaluation_dir.mkdir(parents=True, exist_ok=True)

    input_path = concepts_dir / "concepts_generated_v4.json"
    json_output_path = evaluation_dir / "concept_evaluation_results.json"
    csv_output_path = evaluation_dir / "concept_evaluation_results.csv"

    if not input_path.exists():
        print(f"Error: dataset not found at {input_path}")
        return 1

    try:
        concepts = load_concepts(input_path)
    except (OSError, json.JSONDecodeError, ValueError) as exc:
        print(f"Error: failed to load concepts: {exc}")
        return 1

    print(f"Loaded {len(concepts)} concepts from {input_path.name}.")
    print(f"Judge model: {model}\n")

    metrics_block = build_metrics_block()
    result_records: list[dict[str, Any]] = []
    failed_count = 0

    for concept in concepts:
        concept_id = clean_text(concept.get("concept_id")) or "unknown"
        topic = clean_text(concept.get("topic")) or concept_id

        try:
            scores = evaluate_concept(concept, client, model, metrics_block)
            record = build_result_record(concept, scores)
            result_records.append(record)
            print(f"  Evaluated {concept_id}: avg {record['average_score']:.2f}")
        except Exception as exc:
            print(f"  Failed {concept_id} ({topic}): {exc}")
            failed_count += 1

        time.sleep(SLEEP_BETWEEN_CALLS)

    save_results_json(json_output_path, result_records)
    save_results_csv(csv_output_path, result_records)

    print(f"\nSaved {len(result_records)} results to:")
    print(f"  {json_output_path}")
    print(f"  {csv_output_path}")
    print(f"Failed: {failed_count}")

    print_summary(result_records)
    return 0


if __name__ == "__main__":
    sys.exit(main())
