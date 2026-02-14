# CLAUDE.md

This file provides guidance for AI assistants (and developers) working on the **NLP-dan-silva-method** repository.

## Project Overview

This is a Natural Language Processing (NLP) project focused on analyzing the literary works of Dan Silva using computational methods. The project applies NLP techniques to study patterns, style, themes, and linguistic features across Dan Silva's novels.

## Repository Status

This project is in its **initial setup phase**. The repository was freshly created and does not yet contain source code, tests, or data pipelines. This document should be updated as the project evolves.

## Codebase Structure

```
NLP-dan-silva-method/
├── CLAUDE.md            # This file — project guidance for AI assistants
└── (project files to be added)
```

### Planned / Recommended Directory Layout

As the project grows, the following structure is recommended:

```
NLP-dan-silva-method/
├── CLAUDE.md            # AI assistant guidance
├── README.md            # Project documentation
├── requirements.txt     # Python dependencies (or pyproject.toml)
├── data/                # Raw and processed text data
│   ├── raw/             # Original source texts
│   └── processed/       # Cleaned / tokenized data
├── notebooks/           # Jupyter notebooks for exploration and analysis
├── src/                 # Source code / modules
│   ├── __init__.py
│   ├── preprocessing/   # Text cleaning, tokenization
│   ├── analysis/        # NLP analysis pipelines
│   └── visualization/   # Plotting and output generation
├── tests/               # Unit and integration tests
├── outputs/             # Generated results, plots, reports
└── scripts/             # Standalone runnable scripts
```

## Development Guidelines

### Language and Environment

- **Primary language**: Python 3.9+
- **Package management**: pip with `requirements.txt` or Poetry/PDM with `pyproject.toml`
- **Virtual environment**: Use `venv`, `conda`, or similar to isolate dependencies

### Common NLP Libraries (expected)

- `nltk` — tokenization, POS tagging, corpora
- `spacy` — industrial-strength NLP pipelines
- `scikit-learn` — ML models, TF-IDF, clustering
- `transformers` (Hugging Face) — pre-trained language models
- `matplotlib` / `seaborn` — visualization
- `pandas` / `numpy` — data manipulation

### Code Conventions

- Follow **PEP 8** for Python style
- Use **type hints** for function signatures
- Write **docstrings** (Google or NumPy style) for public functions and classes
- Keep notebooks clean: restart-and-run-all before committing
- Prefer functions and modules in `src/` over inline notebook code for reusable logic

### Git Workflow

- Use descriptive branch names: `feature/topic-modeling`, `fix/tokenizer-bug`
- Write clear commit messages explaining *why*, not just *what*
- Do not commit large data files directly — use `.gitignore` or Git LFS
- Do not commit secrets, API keys, or credentials

### Testing

- Use `pytest` as the test runner
- Place tests in the `tests/` directory mirroring the `src/` structure
- Run tests with: `pytest tests/`

### Data Handling

- Never commit raw copyrighted text to the repository
- Use `.gitignore` to exclude `data/raw/` and large output files
- Document data sources and any preprocessing steps
- Include scripts or instructions for reproducing data pipelines

## Key Commands

These commands are expected once the project has dependencies and code:

| Task | Command |
|------|---------|
| Install dependencies | `pip install -r requirements.txt` |
| Run tests | `pytest tests/` |
| Lint code | `flake8 src/` or `ruff check src/` |
| Format code | `black src/` |
| Launch notebooks | `jupyter notebook notebooks/` |

## For AI Assistants

When working on this project:

1. **Read before writing** — always read existing files before modifying them
2. **Stay focused** — only make changes that are directly requested
3. **Respect data privacy** — do not commit copyrighted text or sensitive data
4. **Test your changes** — run `pytest` after making code changes
5. **Update this file** — if you add major features, new directories, or change conventions, update this CLAUDE.md to reflect the current state
6. **Keep it simple** — prefer straightforward implementations over over-engineered abstractions
7. **Document data pipelines** — NLP projects depend heavily on data flow; make sure processing steps are reproducible
