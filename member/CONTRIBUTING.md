# Contributing

1. Clone and install in dev mode:
```bash
git clone <repo>
cd members
pip install -e ".[dev]"
```

2. Make your changes in `members/core.py` or `members/cli.py`

3. Add/update tests in `tests/test_members.py`

4. Run tests:
```bash
pytest tests/
```

5. Commit and push
```bash
git commit -m "your message"
git push
```

All tests must pass on Python 3.8+.
