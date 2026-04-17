import json
import os
import re

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

openai_api_key = os.getenv("OPENAI_API_KEY")
if not openai_api_key:
    raise ValueError("OPENAI_API_KEY is not set")

DEFAULT_SUMMARY_MODEL = "gpt-4.1-mini"
PROMPT_TEMPLATE = "prompts/concept_v1.txt"


def generate_concept_content(
    topic: str,
    category: str,
    difficulty: str,
    reference_text: str,
    prompt_template: str,
    model: str,
) -> dict:
    client = OpenAI(api_key=openai_api_key)

    prompt = prompt_template.format(
        topic=topic,
        category=category,
        difficulty=difficulty,
        reference_text=reference_text,
    )

    response = client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7,
    )

    raw = (response.choices[0].message.content or "").strip()

    if raw.startswith("```"):
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)

    match = re.search(r"\{.*\}", raw, re.DOTALL)
    if match:
        raw = match.group(0)

    try:
        return json.loads(raw)
    except json.JSONDecodeError as exc:
        raise ValueError(f"Model did not return valid JSON: {raw}") from exc
