"""Generate anomaly summaries from reports."""

from __future__ import annotations

from typing import Dict


class AnomalySummaryGenerator:
    def summarize(self, report: Dict[str, str]) -> str:
        title = report.get('title', 'Anomaly')
        body = report.get('body', '')
        if 'temperature' in body.lower():
            status = 'Temperature threshold exceeded'
        elif 'delay' in body.lower():
            status = 'Delay detected in operations'
        else:
            status = 'Anomaly recorded'
        return f"{title}: {status}. Details: {body[:120]}"
