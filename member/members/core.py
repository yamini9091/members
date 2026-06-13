import csv
from dataclasses import dataclass
from pathlib import Path
from typing import List, Optional

_BUNDLED_CSV = Path(__file__).parent.parent / "members.csv"


@dataclass
class Member:
    """Represents a single member record."""

    id: int
    first_name: str
    last_name: str
    email: str
    gender: str
    ip_address: str

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"

    def __repr__(self) -> str:
        return f"Member(id={self.id}, name='{self.full_name}', email='{self.email}')"


def load_members(csv_path: Optional[str] = None) -> List[Member]:
    """Load members from a CSV file.

    Args:
        csv_path: Path to a CSV file. If omitted, loads the bundled members.csv.
                  The CSV must have columns: id, first_name, last_name, email, gender, ip_address.

    Returns:
        List of Member objects.

    Example:
        >>> members = load_members()
        >>> members = load_members("path/to/custom.csv")
    """
    path = Path(csv_path) if csv_path else _BUNDLED_CSV
    with open(path, newline="", encoding="utf-8") as f:
        return [
            Member(
                id=int(row["id"]),
                first_name=row["first_name"],
                last_name=row["last_name"],
                email=row["email"],
                gender=row["gender"],
                ip_address=row["ip_address"],
            )
            for row in csv.DictReader(f)
        ]


def search_members(members: List[Member], query: str) -> List[Member]:
    """Search members by name or email (case-insensitive).

    Args:
        members: List of Member objects to search.
        query: Search string matched against first name, last name, and email.

    Returns:
        List of matching Member objects.

    Example:
        >>> members = load_members()
        >>> results = search_members(members, "john")
    """
    q = query.lower()
    return [
        m for m in members
        if q in m.first_name.lower()
        or q in m.last_name.lower()
        or q in m.email.lower()
    ]


def filter_by_gender(members: List[Member], gender: str) -> List[Member]:
    """Filter members by gender (case-insensitive).

    Args:
        members: List of Member objects to filter.
        gender: Gender value to match (e.g. "Female", "Male", "Non-binary").

    Returns:
        List of Member objects matching the given gender.

    Example:
        >>> members = load_members()
        >>> non_binary = filter_by_gender(members, "Non-binary")
    """
    return [m for m in members if m.gender.lower() == gender.lower()]
