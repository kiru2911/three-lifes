# ThreeLifes

ThreeLifes is a simple university AI app project. For Sprint 1, the backend collects recent AI and technology news, generates short AI summaries, evaluates those summaries with an LLM, and saves the results as a small dataset.

## Sprint 1 scope

- Fetch recent English AI and tech articles from NewsAPI
- Generate a short summary for each article using the OpenAI API
- Evaluate each generated summary against the source article
- Save the enriched dataset and evaluation results to JSON and CSV in the `data/` folder

## Project structure

```text
backend/
  evaluate_summaries.py
  fetch_news.py
  generate_summaries_v2.py
  requirements.txt
  .env.example
data/
README.md
.gitignore
```

## Setup

1. Create and activate a Python virtual environment.
2. Install dependencies:

```bash
pip install -r backend/requirements.txt
```

3. Create a `.env` file in the project root by copying `backend/.env.example`.

Example `.env`:

```env
NEWS_API_KEY=your_newsapi_key_here
OPENAI_API_KEY=your_openai_api_key_here
```

Optional:

```env
OPENAI_SUMMARY_MODEL=gpt-4.1-mini
OPENAI_EVALUATION_MODEL=gpt-4.1-mini
```

## Run the pipeline

From the project root, run:

```bash
python backend/fetch_news.py
```

Then run the evaluation step:

```bash
python backend/evaluate_summaries.py
```

To generate improved v2 summaries from the existing `data/articles/articles.json` file without fetching new articles, run:

```bash
python backend/generate_summaries_v2.py
```

## Output files

After `python backend/fetch_news.py`, the project creates these files inside `data/articles/`:

- `data/articles/articles.json`
- `data/articles/articles.csv`

After `python backend/evaluate_summaries.py`, the project creates:

- `data/evaluation/evaluation_results.json`
- `data/evaluation/evaluation_results.csv`

After `python backend/generate_summaries_v2.py`, the project creates:

- `data/articles/articles_with_v2.json`
- `data/articles/articles_with_v2.csv`

The scripts also create the `data/` folder automatically if it does not already exist.

## Google Sheets export

`data/evaluation/evaluation_results.csv` is a flat file designed for Google Sheets import.

It includes:

- article metadata
- the generated summary
- 1 to 5 scores for relevance, faithfulness, conciseness, coherence, and usefulness
- short explanations for each score

To review results in Google Sheets:

1. Open Google Sheets.
2. Create a blank sheet.
3. Import `data/evaluation/evaluation_results.csv`.

This makes it easy to sort, filter, and review summary quality by article and score.

## Notes

- The script keeps the backend intentionally minimal for Sprint 1.
- If an article cannot be summarised, the script continues processing the remaining articles.
- If one article fails during evaluation, the evaluator logs the issue and continues with the remaining articles.
- The OpenAI summary model defaults to `gpt-4.1-mini` in the script for compatibility, and the evaluation model also defaults to `gpt-4.1-mini`.

## How to Run the Ollama version of the code?

The only additional step is installing ollama on your current instance. For that, follow these steps:
1. Sagemaker uses Linux so, enter the following command in the terminal:
   
   **curl -fsSL https://ollama.com/install.sh | sh.**
   
   This downloads ollama onto **/usr/local/bin/ollama**
   
3. Verify installation in the same terminal:
 
   **ollama -v**
   
   You should see something like:
     **ollama version 0.x.x**
   
5. Start the server:
   
   **ollama serve**
   
   You should see something like:
   
   **Listening on 127.0.0.1:11434**
   
7. Open another terminal and enter this command:
   
   **ollama pull llama3.1:8b**
   
9. If you want to test it, enter:
    
   ** ollama run llama3.1:8b and ask it anything.**
   
    If it responds, it works. Exit with **/bye**
   
11. Now you can run the python file:
    
    **python three-lifes/backend/fetch_news_ollama.py**
    
13. The ollama output will be saved under **data/ollama_output**
