from pathlib import Path
import subprocess
import sys
import textwrap


def test_calculator_runs_without_site_packages_network_or_database(tmp_path):
    backend = Path(__file__).resolve().parents[2]
    script = textwrap.dedent(
        """
        import builtins
        import sys
        sys.path.insert(0, sys.argv[1])
        original_import = builtins.__import__
        blocked = {"fastapi", "pydantic", "sqlalchemy", "sqlite3", "socket",
                   "requests", "httpx", "urllib", "http"}
        def guarded_import(name, *args, **kwargs):
            if name.split(".")[0] in blocked:
                raise AssertionError("Forbidden dependency: " + name)
            return original_import(name, *args, **kwargs)
        builtins.__import__ = guarded_import
        from app.domain import calculate_quote
        assert calculate_quote(15, "ES").total_cents == 16940
        """
    )
    result = subprocess.run(
        [sys.executable, "-I", "-S", "-c", script, str(backend)],
        cwd=tmp_path,
        capture_output=True,
        text=True,
        timeout=15,
    )
    assert result.returncode == 0, result.stdout + result.stderr
