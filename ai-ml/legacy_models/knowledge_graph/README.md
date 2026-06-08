# Knowledge Graphs & Symbolic Reasoning

## Structure
- `graph_db/`: schema definitions, Neo4j adapter stub, ingestion utilities
- `embeddings/`: Node2Vec, TransE, GraphSAGE style embeddings
- `reasoning/`: rules engine, neuro-symbolic reasoner, constraint planner
- `use_cases/`: root cause analysis, similarity search, constraint system

## Data
- Sample graph: `data/test/kg_graph.json`

## Tests
- `tests/knowledge_graph/phase1-4/`

Run:
```bash
.\venv\Scripts\activate
pytest tests/knowledge_graph/ -v
```
