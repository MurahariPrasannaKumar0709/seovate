import hashlib
from urllib.parse import urlparse


def normalize_domain(url: str) -> str:
    parsed = urlparse(url if "://" in url else f"https://{url}")
    return parsed.netloc or parsed.path


def generate_verification_token(domain: str) -> str:
    digest = hashlib.sha256(domain.encode("utf-8")).hexdigest()
    return f"seovate-verify={digest[:12]}"


def build_txt_record(domain: str) -> dict:
    normalized = normalize_domain(domain)
    return {
        "host": f"_seovate-verify.{normalized}",
        "type": "TXT",
        "value": generate_verification_token(normalized),
    }
