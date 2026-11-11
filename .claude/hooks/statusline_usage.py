"""Status line: show subscription usage and save it for the lead's budget checks (generator lesson L2).

Claude Code pipes a JSON object on stdin. For Pro/Max/Ultra subscribers it includes `rate_limits.five_hour` and
`rate_limits.seven_day` (`used_percentage`, `resets_at`) after the first API response. We write those to
`.claude/usage.json` (git-ignored) and print one short line. Never fails loudly: a status line must not break the UI.
"""
import json
import os
import sys
import time

try:
    data = json.load(sys.stdin)
except Exception:
    data = {}

rl = data.get("rate_limits") or {}
five = rl.get("five_hour") or {}
week = rl.get("seven_day") or {}
project = (data.get("workspace") or {}).get("project_dir") or os.environ.get("CLAUDE_PROJECT_DIR") or os.getcwd()

if rl:
    try:
        out = {
            "saved_at": int(time.time()),
            "five_hour": {"used_percentage": five.get("used_percentage"), "resets_at": five.get("resets_at")},
            "seven_day": {"used_percentage": week.get("used_percentage"), "resets_at": week.get("resets_at")},
        }
        path = os.path.join(project, ".claude", "usage.json")
        tmp = path + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(out, f)
        os.replace(tmp, path)
    except Exception:
        pass


def pct(v):
    return "–" if v is None else f"{float(v):.0f}%"


model = ((data.get("model") or {}).get("display_name")) or ""
if rl:
    print(f"Coffee Lab · week {pct(week.get('used_percentage'))} · 5h {pct(five.get('used_percentage'))} · {model}")
else:
    print(f"Coffee Lab · usage n/a yet · {model}")
