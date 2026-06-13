# CLAUDE.md

Development guide for the members package.

## Quick Commands

```bash
pip install -e ".[dev]"          # Install for development
pytest tests/                     # Run 23 tests
pytest tests/ --cov=members      # With coverage (94%)
python3 -m build                 # Build distribution
```

## Structure

```
members/
  core.py      - load_members(), search_members(), filter_by_gender(), Member
  cli.py       - CLI: list, search, filter, count
  __init__.py  - Public API
tests/
  test_members.py - 23 tests (16 library + 7 CLI)
pyproject.toml    - Package config, CLI entry point
README.md         - User documentation
members.csv       - Bundled dataset (1,000 records)
```

## Key Functions

- `load_members(csv_path=None)` — Load CSV into list of Member objects
- `search_members(members, query)` — Case-insensitive search by name/email
- `filter_by_gender(members, gender)` — Filter by gender string
- `Member` — Dataclass with `full_name` property

## CLI

Entry point: `members.cli:main` in pyproject.toml

Commands:
- `members list [--format full] [--csv PATH]`
- `members search QUERY [--format full] [--csv PATH]`
- `members filter GENDER [--format full] [--csv PATH]`
- `members count [--csv PATH]`

## Testing

```bash
pytest tests/ -v                  # Verbose
pytest tests/ --cov=members       # Coverage report
```

## Publishing

```bash
python3 -m build
twine upload dist/*
```
