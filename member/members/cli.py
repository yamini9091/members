import argparse
import sys
from .core import load_members, search_members, filter_by_gender


def main():
    """Command-line interface for the members package."""
    parser = argparse.ArgumentParser(
        prog="members",
        description="Load, search, and filter member records",
    )
    subparsers = parser.add_subparsers(dest="command", help="Command to run")

    # List command
    list_parser = subparsers.add_parser("list", help="List all members")
    list_parser.add_argument(
        "--csv",
        help="Path to custom CSV file (default: bundled members.csv)",
    )
    list_parser.add_argument(
        "--format",
        choices=["name", "full"],
        default="name",
        help="Output format: 'name' (first last) or 'full' (all fields)",
    )

    # Search command
    search_parser = subparsers.add_parser("search", help="Search members by name or email")
    search_parser.add_argument("query", help="Search term")
    search_parser.add_argument(
        "--csv",
        help="Path to custom CSV file",
    )
    search_parser.add_argument(
        "--format",
        choices=["name", "full"],
        default="name",
        help="Output format",
    )

    # Filter command
    filter_parser = subparsers.add_parser("filter", help="Filter members by gender")
    filter_parser.add_argument("gender", help="Gender to filter by")
    filter_parser.add_argument(
        "--csv",
        help="Path to custom CSV file",
    )
    filter_parser.add_argument(
        "--format",
        choices=["name", "full"],
        default="name",
        help="Output format",
    )

    # Count command
    count_parser = subparsers.add_parser("count", help="Count members by gender")
    count_parser.add_argument(
        "--csv",
        help="Path to custom CSV file",
    )

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        sys.exit(0)

    members = load_members(args.csv)

    if args.command == "list":
        for m in members:
            if args.format == "full":
                print(f"{m.id}\t{m.full_name}\t{m.email}\t{m.gender}\t{m.ip_address}")
            else:
                print(m.full_name)

    elif args.command == "search":
        results = search_members(members, args.query)
        if not results:
            print(f"No results found for '{args.query}'")
            sys.exit(0)
        for m in results:
            if args.format == "full":
                print(f"{m.id}\t{m.full_name}\t{m.email}\t{m.gender}\t{m.ip_address}")
            else:
                print(m.full_name)

    elif args.command == "filter":
        results = filter_by_gender(members, args.gender)
        if not results:
            print(f"No members found with gender '{args.gender}'")
            sys.exit(0)
        for m in results:
            if args.format == "full":
                print(f"{m.id}\t{m.full_name}\t{m.email}\t{m.gender}\t{m.ip_address}")
            else:
                print(m.full_name)

    elif args.command == "count":
        genders = {}
        for m in members:
            genders[m.gender] = genders.get(m.gender, 0) + 1
        print("Gender Distribution:")
        for gender, count in sorted(genders.items()):
            print(f"  {gender}: {count}")


if __name__ == "__main__":
    main()
