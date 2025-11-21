"""Phase 3 document processing tests."""

import sys
import os

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
sys.path.insert(0, os.path.join(ROOT, 'models'))

from nlp.document_processing import ner_processor, relation_extractor, constraint_parser


def test_ner_processor():
    processor = ner_processor.NERProcessor()
    results = processor.extract("Acme Corp signed agreement with Beta LLC")
    assert isinstance(results, list)


def test_relation_extractor():
    extractor = relation_extractor.RelationExtractor()
    relations = extractor.extract_relations("Supplier must deliver within 5 days of PO receipt")
    assert relations


def test_constraint_parser():
    parser = constraint_parser.ConstraintParser()
    constraints = parser.parse("Lead time must not exceed 7 days. Fill rate at least 95%.")
    assert len(constraints) == 2
