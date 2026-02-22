"""
Input sanitization and prompt injection protection for the assessment framework.

Security features:
- Prompt injection detection and sanitization with logging
- Input length limits and content validation
- Conversation memory compression for token efficiency

NOTE on Rate Limiting:
  In production, rate limiting should be enforced at the infrastructure layer
  (e.g., API Gateway, nginx, or cloud provider). For this research prototype,
  rate limiting is not implemented as the system targets controlled evaluation
  sessions with expert users, not public deployment.
"""

import logging
import re
from typing import Optional

logger = logging.getLogger("governance.security")


# --- Input sanitization & prompt injection protection ---

# Maximum allowed message length (chars)
MAX_MESSAGE_LENGTH = 3000

# Patterns that indicate prompt injection attempts
INJECTION_PATTERNS = [
    # Direct instruction override attempts
    r'(?i)ignor(e|iere)\s+(all|alle|die|the|vorheri|previous|above|obig)',
    r'(?i)(vergiss|forget)\s+(alles|everything|all|die|the)',
    r'(?i)new\s+(system|instruction|role|prompt)',
    r'(?i)neues?\s+(system|anweisung|rolle|prompt)',
    r'(?i)du\s+bist\s+(jetzt|nun|ab\s+sofort)\s+',
    r'(?i)you\s+are\s+now\s+',
    r'(?i)(override|overwrite|replace|bypass)\s+(system|instruct|prompt|rule)',
    r'(?i)(überschreibe|ersetze|umgehe)\s+(system|anweisung|prompt|regel)',
    # Role-playing / identity manipulation
    r'(?i)pretend\s+(to\s+be|you\s+are)',
    r'(?i)(tu|tue|mach)\s+so\s+als\s+(ob|wärst)',
    r'(?i)act\s+as\s+(if|a\s+different)',
    # Score manipulation
    r'(?i)(gib|give|set|setz)\s+(mir|me|all)?\s*(all|alle)?\s*(score|level|bewertung)',
    r'(?i)(maximum|highest|höchst|level\s*5|optimizing)\s+(score|bewertung|für\s+alle)',
    # System prompt extraction
    r'(?i)(show|zeig|print|output|reveal|display)\s+(your|dein|the)?\s*(system|original)?\s*(prompt|instruction|anweisung)',
    r'(?i)(what|was)\s+(is|sind|are)\s+(your|dein)\s*(system|original)?\s*(prompt|instruction|anweisung)',
]

COMPILED_INJECTION_PATTERNS = [re.compile(p) for p in INJECTION_PATTERNS]


def sanitize_input(text: str) -> tuple[str, list[str]]:
    """Sanitize user input: length limiting, injection detection.

    Pure function — returns new values, never mutates input.

    Returns:
        (sanitized_text, list_of_warnings)
        If injection detected, returns the sanitized text with a warning flag.
    """
    # Length limit (produce new string, don't mutate)
    truncated = text[:MAX_MESSAGE_LENGTH] if len(text) > MAX_MESSAGE_LENGTH else text
    warnings = ["Message truncated to maximum length."] if truncated is not text else []

    # Strip potential control characters (keep normal whitespace)
    cleaned = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', truncated)

    # Check for injection patterns
    for i, pattern in enumerate(COMPILED_INJECTION_PATTERNS):
        match = pattern.search(cleaned)
        if match:
            logger.warning(
                "Prompt injection detected (pattern #%d): '%s' in input: %s",
                i, match.group()[:50], cleaned[:100],
            )
            return cleaned, [*warnings, "prompt_injection_detected"]

    return cleaned, warnings


def compress_conversation(messages: list[dict], keep_recent: int = 8) -> list[dict]:
    """Compress conversation history for token efficiency.

    Strategy: Keep system-critical information while reducing token count.
    - Always keep the first 2 messages (greeting + initial context)
    - Summarize middle messages into a compact format
    - Keep the most recent N messages in full

    Args:
        messages: Full list of {role, content} dicts
        keep_recent: Number of recent messages to keep verbatim

    Returns:
        Compressed message list
    """
    if len(messages) <= keep_recent + 2:
        return messages

    # First 2 messages (greeting context)
    first = messages[:2]
    # Recent messages (active conversation)
    recent = messages[-keep_recent:]
    # Middle messages to compress
    middle = messages[2:-keep_recent]

    if not middle:
        return messages

    # Compress middle into a summary message
    summary_parts = []
    for msg in middle:
        role_label = "Agent" if msg.get('role') == 'assistant' else "Nutzer"
        content = msg.get('content', '')
        # Truncate each to ~100 chars
        if len(content) > 120:
            content = content[:120] + "..."
        summary_parts.append(f"[{role_label}]: {content}")

    summary = "[Zusammenfassung früherer Gesprächsteile]\n" + "\n".join(summary_parts)

    compressed = first + [{"role": "assistant", "content": summary}] + recent
    return compressed


# All 6 dimensions with their criteria IDs for tracking completeness
DIMENSION_ORDER = ["D1", "D2", "D3", "D4", "D5", "D6"]

CRITERIA_PER_DIMENSION = {
    "D1": ["D1.1", "D1.2", "D1.3", "D1.4", "D1.5", "D1.6"],
    "D2": ["D2.1", "D2.2", "D2.3", "D2.4", "D2.5"],
    "D3": ["D3.1", "D3.2", "D3.3", "D3.4", "D3.5"],
    "D4": ["D4.1", "D4.2", "D4.3", "D4.4", "D4.5"],
    "D5": ["D5.1", "D5.2", "D5.3", "D5.4", "D5.5"],
    "D6": ["D6.1", "D6.2", "D6.3", "D6.4", "D6.5"],
}

ALL_CRITERIA = [c for ids in CRITERIA_PER_DIMENSION.values() for c in ids]
