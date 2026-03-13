# ThreeLifes

ThreeLifes is a simple university AI app project. For Sprint 1, the backend collects recent AI and technology news, generates short AI summaries, and saves the results as a small dataset.

## Sprint 1 scope

- Fetch recent English AI and tech articles from NewsAPI
- Generate a short summary for each article using the OpenAI API
- Save the enriched dataset to JSON and CSV in the `data/` folder

## Project structure

```text
backend/
  fetch_news.py
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

## Run the script

From the project root, run:

```bash
python backend/fetch_news.py
```

## Output files

When the script runs successfully, it creates these files inside `data/`:

- `data/articles.json`
- `data/articles.csv`

The script also creates the `data/` folder automatically if it does not already exist.

## Notes

- The script keeps the backend intentionally minimal for Sprint 1.
- If an article cannot be summarised, the script continues processing the remaining articles.
- The OpenAI summary model defaults to `gpt-4.1-mini` in the script for compatibility, but you can change it inside `backend/fetch_news.py` if needed.

## How to Run the Ollama version of the code?

- The only additional step is installing ollama on your current instance. For that, follow these steps:
1. Sagemaker uses Linux so, enter the following command in the terminal: curl -fsSL https://ollama.com/install.sh | sh. This downloads ollama onto /usr/local/bin/ollama
2. Verify installation in the same terminal: ollama -v. You should see something like: ollama version 0.x.x
3. Start the server: ollama serve. You should see something like: Listening on 127.0.0.1:11434
4. Open another terminal and enter this command: ollama pull llama3.1:8b
5. If you want to test it, enter: ollama run llama3.1:8b and ask it anything. If it responds, it works. Exit with /bye
6. Now you can run the python file: python three-lifes/backend/fetch_news_ollama.py
7. The ollama output will be saved under data/ollama_output
