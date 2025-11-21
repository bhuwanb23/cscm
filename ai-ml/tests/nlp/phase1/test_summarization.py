"""Tests for Phase 1 summarization."""

import os
import sys
import json

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
DATA = os.path.join(ROOT, 'data', 'test', 'nlp_reports.json')
sys.path.insert(0, os.path.join(ROOT, 'models'))

from nlp.summarization import t5_summarizer, bart_summarizer, bert_extractor, anomaly_summary


def load_reports():
    with open(DATA, 'r', encoding='utf-8') as f:
        return json.load(f)


def test_t5_summarizer():
    reports = load_reports()
    model = t5_summarizer.T5Summarizer()
    summary = model.summarize(reports[0]['body'])
    assert summary


def test_bart_summarizer():
    reports = load_reports()
    model = bart_summarizer.BARTSummarizer()
    summaries = model.batch(reports)
    assert len(summaries) == len(reports)


def test_bert_extractor():
    reports = load_reports()
    extractor = bert_extractor.BERTInformationExtractor()
    entities = extractor.extract(reports[0]['body'])
    assert isinstance(entities, list)


def test_anomaly_summary():
    generator = anomaly_summary.AnomalySummaryGenerator()
    summary = generator.summarize(load_reports()[1])
    assert 'Anomaly' in summary or 'Temperature' in summary
