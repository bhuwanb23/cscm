# NLP & LLM Components

## Structure
- `summarization/`: T5/BART wrappers, BERT info extraction, anomaly summaries
- `conversational/`: instruction-tuned LLM interface, ChatOps agent, why/what-if handler
- `document_processing/`: NER, relation extraction, constraint parsing
- `privacy/`: private deployment config, PII masking, API guard

## Data
- Sample reports: `data/test/nlp_reports.json`

## Tests
- `tests/nlp/phase1-4/` covering each phase

Run:
```bash
.\venv\Scripts\activate
pytest tests/nlp/ -v
```
