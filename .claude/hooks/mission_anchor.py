#!/usr/bin/env python3
"""Non-blocking Claude Code hook for reanchoring Coffee Lab context.

Modes:
  python3 .claude/hooks/mission_anchor.py precompact
  python3 .claude/hooks/mission_anchor.py sessionstart

PreCompact stdout is fed to the compaction-summary instruction context by
supported Claude Code versions. SessionStart stdout adds fresh context after
startup/resume/compact. This does NOT enforce mission adherence or uptime.
"""
import hashlib
import json
import os
import pathlib
import sys

ROOT = pathlib.Path(os.environ.get("CLAUDE_PROJECT_DIR", os.getcwd()))
CANON = ROOT / "COFFEE_LAB_HANDOFF.md"
STATE = ROOT / "docs" / "EXECUTION_STATE.md"
DECISIONS = ROOT / "docs" / "DECISIONS.md"
DIGEST = ROOT / ".claude" / "mission.sha256"

ANCHOR = (
    "MISSION ANCHOR — COFFEE LAB: Work on the real beginner-first coffee Web "
    "learning product, not an abstract app generator. Distinct Desktop 2D, "
    "Mobile touch + real-world step coaching, optional functional WebXR "
    "spatial interactions. Share learner state but vary interaction design. "
    "Main agent plans/delegates/integrates/QA; subagents implement details. "
    "No fabricated physical observation, taste prediction, XR device tests, "
    "paid API calls or deployment. Working product > architecture. "
    "Original COFFEE_LAB_HANDOFF.md is immutable and authoritative."
)


def read_excerpt(path: pathlib.Path, max_chars: int) -> str:
    try:
        txt = path.read_text(encoding="utf-8")
        if len(txt) > max_chars:
            return txt[:max_chars] + "\n[truncated; re-read full file when needed]"
        return txt
    except OSError:
        return "[unavailable — read file manually]"


def digest_status() -> str:
    try:
        actual = hashlib.sha256(CANON.read_bytes()).hexdigest()
        expected = DIGEST.read_text(encoding="ascii").strip().split()[0]
        return "MISSION FILE HASH OK" if actual == expected else (
            "WARNING: CANONICAL HANDOFF HASH CHANGED. Investigate and restore "
            "the approved original before trusting a revised mission."
        )
    except OSError:
        return "Mission checksum unavailable: confirm source file manually."


def main() -> None:
    try:
        data = json.load(sys.stdin)
    except Exception:
        data = {}
    mode = sys.argv[1] if len(sys.argv) > 1 else "sessionstart"
    print(ANCHOR)
    print(digest_status())
    print("Read root CLAUDE.md and canonical handoff as independent files.")
    if mode == "precompact":
        print("COMPACTION PRIORITIES: preserve exact original mission, invariants, "
              "one-time clarification rule, leading/orchestration role, P0/P1 "
              "acceptance, verified tests and failures, file ownership, active "
              "tasks, next three steps, and user-approved decisions. "
              "Discard verbose logs and old brainstorming first. "
              "Immediately after compact, reload files rather than trusting summary.")
    else:
        print("SESSION SOURCE:", data.get("source", "unknown"))
    print("CURRENT EXECUTION STATE:\n" + read_excerpt(STATE, 2300))
    print("RECORDED DECISIONS:\n" + read_excerpt(DECISIONS, 1000))


if __name__ == "__main__":
    main()
