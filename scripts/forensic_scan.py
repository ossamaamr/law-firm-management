from pathlib import Path
import re, json

ROOT = Path(__file__).resolve().parents[1]
EXCLUDED = {"node_modules", "dist", ".git", "coverage"}
EXTS = {".ts", ".tsx", ".js", ".jsx", ".sql", ".json", ".yaml", ".yml", ".md"}
PATTERNS = {
    "auth_storage": r"localStorage|sessionStorage|mock-jwt|mock token|Mock Token",
    "fake_or_placeholder": r"TODO|FIXME|placeholder|Mock data|mock data|comingSoon|success\s*:\s*true|Date\.now\(\)|storage\.example|return null;",
    "dangerous_sink": r"dangerouslySetInnerHTML|innerHTML|eval\(|new Function|child_process|exec\(|spawn\(|shell:\s*true",
    "external_network": r"https?://|fetch\(|axios\(|\brequest\(",
    "file_risk": r"isPublic|s3Url|s3Key|signed|multer|path\.join|readFile|writeFile|unlink",
    "tenant": r"lawFirmId|lawFirmProcedure|adminProcedure|protectedProcedure",
    "sql_raw": r"sql`|sql\.raw|SELECT |UPDATE |DELETE |INSERT ",
    "secrets": r"process\.env|cookieSecret|API_KEY|PASSWORD|SECRET|TOKEN",
}

files = []
findings = []
for p in ROOT.rglob("*"):
    if not p.is_file() or p.suffix not in EXTS or any(part in EXCLUDED for part in p.parts):
        continue
    rel = p.relative_to(ROOT).as_posix()
    files.append(rel)
    try:
        text = p.read_text(errors="replace")
    except Exception:
        continue
    for category, pattern in PATTERNS.items():
        for m in re.finditer(pattern, text, re.IGNORECASE if category in {"auth_storage", "fake_or_placeholder"} else 0):
            line = text.count("\n", 0, m.start()) + 1
            snippet = text.splitlines()[line-1].strip()[:240]
            findings.append({"file": rel, "line": line, "category": category, "snippet": snippet})

summary = {k: sum(1 for f in findings if f["category"] == k) for k in PATTERNS}
out = {"root": str(ROOT), "file_count": len(files), "files": sorted(files), "summary": summary, "findings": findings}
Path("/tmp/mersad_forensic_scan.json").write_text(json.dumps(out, ensure_ascii=False, indent=2))
print(json.dumps({"file_count": len(files), "summary": summary}, ensure_ascii=False, indent=2))
for f in findings[:300]:
    print(f'{f["file"]}:{f["line"]} [{f["category"]}] {f["snippet"]}')
