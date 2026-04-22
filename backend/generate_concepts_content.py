"""Generate educational concept content from seed topics.

This script reads topic seeds from ``data/concepts/concept_seeds.json``, fetches a short
reference summary from Wikipedia, generates concise educational content with the
OpenAI API, and saves the results to JSON and CSV files.
"""

import csv
import json
import os
import sys
from pathlib import Path
from typing import Any

from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from utils.llm_client import DEFAULT_SUMMARY_MODEL, generate_concept_content
from utils.wikipedia_fetch import fetch_wikipedia_summary

# PROMPT_VERSION = "v1"
# PROMPT_VERSION = "v2"
PROMPT_VERSION = "v3"
DEFAULT_CATEGORY = "AI/Technology"
DEFAULT_DIFFICULTY = "beginner"
USE_WIKIPEDIA = False


def load_environment() -> str:
    """Load environment variables and return the model name."""
    load_dotenv(PROJECT_ROOT / ".env")
    load_dotenv()

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("Missing OPENAI_API_KEY. Add it to your .env file.")

    return os.getenv("OPENAI_SUMMARY_MODEL", DEFAULT_SUMMARY_MODEL)


def load_prompt_template() -> str:
    """Load the concept prompt template from the prompts folder."""
    prompt_paths = [
        # PROJECT_ROOT / "backend" / "prompts" / "concept_v1.txt",
        # PROJECT_ROOT / "backend" / "prompts" / "concept_v1.txt ",
        # PROJECT_ROOT / "backend" / "prompts" / "concept_v2.txt",
        # PROJECT_ROOT / "backend" / "prompts" / "concept_v2.txt ",
        PROJECT_ROOT / "backend" / "prompts" / "concept_v3.txt",
    ]

    for path in prompt_paths:
        if path.exists():
            prompt_text = path.read_text(encoding="utf-8").strip()
            if prompt_text.startswith("```") and prompt_text.endswith("```"):
                prompt_text = prompt_text.removeprefix("```").removesuffix("```").strip()
            return prompt_text

    raise FileNotFoundError("Could not find backend/prompts/concept_v3.txt")


def load_seeds(path: Path) -> list[dict[str, Any]]:
    """Load concept seeds from JSON."""
    with path.open("r", encoding="utf-8") as file:
        data = json.load(file)

    if not isinstance(data, list):
        raise ValueError("Expected data/concepts/concept_seeds.json to contain a list.")

    return data


def clean_text(value: Any) -> str:
    """Return a clean string value."""
    if value is None:
        return ""
    return str(value).strip()


def normalise_seed(seed: dict[str, Any], index: int) -> dict[str, str]:
    """Normalise one seed record and apply simple defaults."""
    topic = clean_text(seed.get("topic") or seed.get("title") or seed.get("name"))
    if not topic:
        topic = f"concept_{index:04d}"

    return {
        "concept_id": clean_text(seed.get("concept_id") or seed.get("topic_id")) or f"concept_{index:04d}",
        "topic": topic,
        "category": clean_text(seed.get("category")) or DEFAULT_CATEGORY,
        "difficulty": clean_text(seed.get("difficulty")) or DEFAULT_DIFFICULTY,
    }


def build_output_record(
    seed: dict[str, str],
    source_data: dict[str, str],
    generated_content: dict[str, Any],
    model: str,
) -> dict[str, Any]:
    """Build one output record for JSON and CSV export."""
    return {
        "concept_id": seed["concept_id"],
        "topic": seed["topic"],
        "category": seed["category"],
        "difficulty": seed["difficulty"],
        "source": {
            "title": clean_text(source_data.get("source_title")),
            "url": clean_text(source_data.get("source_url")),
        },
        "reference_text": clean_text(source_data.get("reference_text")),
        "ai_output": {
            "title": clean_text(generated_content.get("title")),
            "post_content": clean_text(generated_content.get("post_content")),
            "summary": clean_text(generated_content.get("summary")),
            "analogy": clean_text(generated_content.get("analogy")),
            "why_it_matters": clean_text(generated_content.get("why_it_matters")),
            "tts_text": clean_text(generated_content.get("tts_text")),
            "model": model,
            "prompt_version": PROMPT_VERSION,
        },
    }


def build_reference_text(topic: str, source_data: dict[str, str]) -> str:
    """Build the reference text sent to the LLM."""
    wikipedia_text = clean_text(source_data.get("reference_text"))
    if wikipedia_text:
        return wikipedia_text

    return (
        f"Topic: {topic}\n"
        f"Write a concise educational explanation of this concept for a learner."
    )


def save_json(path: Path, rows: list[dict[str, Any]]) -> None:
    """Save generated concept content to JSON."""
    with path.open("w", encoding="utf-8") as file:
        json.dump(rows, file, indent=2, ensure_ascii=False)


def save_csv(path: Path, rows: list[dict[str, Any]]) -> None:
    """Save generated concept content to a flat CSV file."""
    fieldnames = [
        "concept_id",
        "topic",
        "category",
        "difficulty",
        "source_title",
        "source_url",
        "reference_text",
        "generated_title",
        "post_content",
        "summary",
        "analogy",
        "why_it_matters",
        "tts_text",
        "model",
        "prompt_version",
    ]

    with path.open("w", encoding="utf-8", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()

        for row in rows:
            ai_output = row.get("ai_output", {})
            source = row.get("source", {})
            writer.writerow(
                {
                    "concept_id": row.get("concept_id", ""),
                    "topic": row.get("topic", ""),
                    "category": row.get("category", ""),
                    "difficulty": row.get("difficulty", ""),
                    "source_title": source.get("title", ""),
                    "source_url": source.get("url", ""),
                    "reference_text": row.get("reference_text", ""),
                    "generated_title": ai_output.get("title", ""),
                    "post_content": ai_output.get("post_content", ""),
                    "summary": ai_output.get("summary", ""),
                    "analogy": ai_output.get("analogy", ""),
                    "why_it_matters": ai_output.get("why_it_matters", ""),
                    "tts_text": ai_output.get("tts_text", ""),
                    "model": ai_output.get("model", ""),
                    "prompt_version": ai_output.get("prompt_version", ""),
                }
            )


def main() -> int:
    """Generate concept learning content from seed topics."""
    try:
        model = load_environment()
        prompt_template = load_prompt_template()
    except (ValueError, FileNotFoundError) as exc:
        print(f"Error: {exc}")
        return 1

    data_dir = PROJECT_ROOT / "data" / "concepts"
    input_path = data_dir / "concept_seeds.json"
    # output_json_path = data_dir / "concepts_generated_v2.json"
    # output_csv_path = data_dir / "concepts_generated_v2.csv"
    # output_json_path = data_dir / "concepts_generated_v3.json"
    # output_csv_path = data_dir / "concepts_generated_v3.csv"
    output_json_path = data_dir / "concepts_generated_v4.json"
    output_csv_path = data_dir / "concepts_generated_v4.csv"

    if not input_path.exists():
        print(f"Error: dataset not found at {input_path}")
        return 1

    try:
        seeds = load_seeds(input_path)
    except (OSError, json.JSONDecodeError, ValueError) as exc:
        print(f"Error: failed to load concept seeds: {exc}")
        return 1

    if not seeds:
        print("No concept seeds found in data/concepts/concept_seeds.json.")
        save_json(output_json_path, [])
        save_csv(output_csv_path, [])
        return 0

    generated_rows: list[dict[str, Any]] = []

    for index, raw_seed in enumerate(seeds, start=1):
        if not isinstance(raw_seed, dict):
            print(f"Skipping seed {index}: expected an object.")
            continue

        seed = normalise_seed(raw_seed, index)
        topic = seed["topic"]

        try:
            source_data = {
                "source_title": "",
                "source_url": "",
                "reference_text": "",
            }

            if USE_WIKIPEDIA:
                source_data = fetch_wikipedia_summary(topic)

            reference_text = build_reference_text(topic, source_data)

            generated_content = generate_concept_content(
                topic=topic,
                category=seed["category"],
                difficulty=seed["difficulty"],
                reference_text=reference_text,
                prompt_template=prompt_template,
                model=model,
            )

            row = build_output_record(seed, source_data, generated_content, model)
            generated_rows.append(row)
            print(f"Generated concept content for {topic}")
        except Exception as exc:
            print(f"Failed to generate content for {topic}: {exc}")

    save_json(output_json_path, generated_rows)
    save_csv(output_csv_path, generated_rows)

    print(
        f"Saved {len(generated_rows)} concept records to {output_json_path} and {output_csv_path}."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
