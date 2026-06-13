# members

A lightweight Python package for loading, searching, and filtering member records from CSV files.

**Use it as:**
- **Python Library** — `from members import load_members, search_members`
- **CLI Tool** — `members search "john"`

## Installation

```bash
pip install git+https://github.com/YOUR_USERNAME/members.git
```

Or from PyPI (after publishing):
```bash
pip install members
```

## Quick Start

### As a Library

```python
from members import load_members, search_members, filter_by_gender

members = load_members()
results = search_members(members, "john")
females = filter_by_gender(members, "Female")
```

### As a CLI

```bash
members list
members search "john"
members filter "Female"
members count
```

## API Reference

### `load_members(csv_path=None) -> List[Member]`
Load members from CSV. Uses bundled dataset if no path provided.

### `search_members(members, query) -> List[Member]`
Search by name or email (case-insensitive).

### `filter_by_gender(members, gender) -> List[Member]`
Filter members by gender (case-insensitive).

### `Member` (dataclass)
Fields: `id`, `first_name`, `last_name`, `email`, `gender`, `ip_address`  
Property: `full_name` — returns `"{first_name} {last_name}"`

## CLI Commands

```bash
members list                           # List all members
members list --format full             # Show all fields (tab-separated)
members search QUERY                   # Search by name or email
members filter GENDER                  # Filter by gender
members count                          # Show gender distribution
members list --csv path/to/file.csv   # Use custom CSV
```

## Using Your Own CSV

CSV must have columns: `id`, `first_name`, `last_name`, `email`, `gender`, `ip_address`

```python
members = load_members("path/to/data.csv")
```

## Development

```bash
pip install -e ".[dev]"
pytest tests/
```

## Requirements

- Python 3.8+
- No external dependencies

## License

MIT
