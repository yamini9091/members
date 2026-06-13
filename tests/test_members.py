import pytest
from io import StringIO
import sys
from members import load_members, search_members, filter_by_gender, Member
from members.cli import main


class TestLoadMembers:
    def test_load_bundled_csv(self):
        members = load_members()
        assert len(members) == 1000
        assert all(isinstance(m, Member) for m in members)

    def test_member_attributes(self):
        members = load_members()
        m = members[0]
        assert m.id == 1
        assert isinstance(m.first_name, str)
        assert isinstance(m.last_name, str)
        assert isinstance(m.email, str)
        assert isinstance(m.gender, str)
        assert isinstance(m.ip_address, str)

    def test_member_full_name(self):
        members = load_members()
        assert members[0].full_name == "Marigold Patrick"


class TestSearchMembers:
    def setup_method(self):
        self.members = load_members()

    def test_search_by_first_name(self):
        results = search_members(self.members, "Johnathan")
        assert len(results) == 2
        assert all("Johnathan" in m.first_name for m in results)

    def test_search_by_last_name(self):
        results = search_members(self.members, "Patrick")
        assert len(results) > 0
        assert all("Patrick" in m.last_name for m in results)

    def test_search_by_email(self):
        results = search_members(self.members, "wikipedia.org")
        assert len(results) > 0
        assert all("wikipedia.org" in m.email for m in results)

    def test_search_case_insensitive(self):
        results_lower = search_members(self.members, "johnathan")
        results_upper = search_members(self.members, "JOHNATHAN")
        assert len(results_lower) == len(results_upper) == 2

    def test_search_no_results(self):
        results = search_members(self.members, "zzzzzzzzzzz")
        assert len(results) == 0


class TestFilterByGender:
    def setup_method(self):
        self.members = load_members()

    def test_filter_male(self):
        results = filter_by_gender(self.members, "Male")
        assert len(results) > 0
        assert all(m.gender == "Male" for m in results)

    def test_filter_female(self):
        results = filter_by_gender(self.members, "Female")
        assert len(results) > 0
        assert all(m.gender == "Female" for m in results)

    def test_filter_non_binary(self):
        results = filter_by_gender(self.members, "Non-binary")
        assert len(results) > 0
        assert all(m.gender == "Non-binary" for m in results)

    def test_filter_case_insensitive(self):
        results_lower = filter_by_gender(self.members, "non-binary")
        results_exact = filter_by_gender(self.members, "Non-binary")
        assert len(results_lower) == len(results_exact)

    def test_filter_no_results(self):
        results = filter_by_gender(self.members, "UnknownGender")
        assert len(results) == 0

    def test_gender_distribution(self):
        all_genders = {m.gender for m in self.members}
        expected = {
            "Male", "Female", "Agender", "Bigender",
            "Genderfluid", "Genderqueer", "Non-binary", "Polygender"
        }
        assert all_genders == expected


class TestMember:
    def test_member_repr(self):
        m = Member(
            id=1,
            first_name="John",
            last_name="Doe",
            email="john@example.com",
            gender="Male",
            ip_address="192.168.1.1"
        )
        assert "John" in repr(m)
        assert "john@example.com" in repr(m)

    def test_member_full_name_property(self):
        m = Member(
            id=1,
            first_name="Jane",
            last_name="Smith",
            email="jane@example.com",
            gender="Female",
            ip_address="192.168.1.2"
        )
        assert m.full_name == "Jane Smith"


class TestCLI:
    def test_cli_list(self, capsys):
        sys.argv = ["members", "list"]
        main()
        captured = capsys.readouterr()
        lines = captured.out.strip().split("\n")
        assert len(lines) == 1000
        assert "Marigold Patrick" in lines[0]

    def test_cli_search(self, capsys):
        sys.argv = ["members", "search", "john"]
        main()
        captured = capsys.readouterr()
        assert "Johnathan McOnie" in captured.out
        assert "Johnathan Seacroft" in captured.out

    def test_cli_search_no_results(self, capsys):
        sys.argv = ["members", "search", "zzzzzzzzz"]
        with pytest.raises(SystemExit):
            main()
        captured = capsys.readouterr()
        assert "No results found" in captured.out

    def test_cli_filter(self, capsys):
        sys.argv = ["members", "filter", "Non-binary"]
        main()
        captured = capsys.readouterr()
        lines = captured.out.strip().split("\n")
        assert len(lines) == 10

    def test_cli_filter_no_results(self, capsys):
        sys.argv = ["members", "filter", "UnknownGender"]
        with pytest.raises(SystemExit):
            main()
        captured = capsys.readouterr()
        assert "No members found" in captured.out

    def test_cli_count(self, capsys):
        sys.argv = ["members", "count"]
        main()
        captured = capsys.readouterr()
        assert "Gender Distribution:" in captured.out
        assert "Male:" in captured.out
        assert "Female:" in captured.out

    def test_cli_format_full(self, capsys):
        sys.argv = ["members", "search", "john", "--format", "full"]
        main()
        captured = capsys.readouterr()
        assert "\t" in captured.out  # Tab-separated format
        assert "jmconie6d@etsy.com" in captured.out
