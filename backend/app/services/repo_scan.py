"""Scans a repo's file list for the SEO/AI-crawler files Seovate expects to find."""

EXPECTED_FILES = {
    "sitemap.xml": "Not found at site root — search engines can't efficiently discover your pages",
    "robots.txt": "Found, but doesn't reference your sitemap",
    "public/schema/local-business.json": "Not found — no structured LocalBusiness data for this repo's pages",
    "llms.txt": "Found and current — AI crawlers can already read your content guidance",
}

# Simulated repo contents for the mock customer's repository.
MOCK_REPO_FILES = {
    "robots.txt": "User-agent: *\nAllow: /\n",
    "llms.txt": "# llms.txt\nThis site is a plumbing services business in Frisco, TX.\n",
}


def scan_repo(repo_files: dict[str, str] = MOCK_REPO_FILES) -> list[dict]:
    results = []
    for path, missing_description in EXPECTED_FILES.items():
        if path not in repo_files:
            results.append({"path": path, "description": missing_description, "status": "Missing"})
        elif path == "robots.txt" and "sitemap" not in repo_files[path].lower():
            results.append({"path": path, "description": missing_description, "status": "Needs update"})
        else:
            results.append(
                {
                    "path": path,
                    "description": "Found and current — AI crawlers can already read your content guidance"
                    if path == "llms.txt"
                    else "Up to date",
                    "status": "Up to date",
                }
            )
    return results
