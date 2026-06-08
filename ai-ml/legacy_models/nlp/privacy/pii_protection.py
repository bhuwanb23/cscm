"""PII protection utilities."""

from __future__ import annotations

import re


class PIIProtector:
    EMAIL = re.compile(r"[\w.-]+@[\w.-]+")
    PHONE = re.compile(r"\+?\d{7,}")

    def mask(self, text: str) -> str:
        text = self.EMAIL.sub("[EMAIL]", text)
        text = self.PHONE.sub("[PHONE]", text)
        return text
