# Requirements Files

The ai-ml project splits its dependencies into three tiers to keep the base
install lean and to make heavy/optional frameworks opt-in.

## Files

| File | Purpose | Install when... |
|---|---|---|
| `requirements.txt` | Core runtime dependencies needed by `api/main.py` and the routers (FastAPI, pydantic v2, numpy, pandas, sklearn, etc.). Tested against Python 3.11+. | Always. This is the base install. |
| `requirements-extras.txt` | Heavy / optional ML frameworks (torch, transformers, detectron2, ray, gurobipy, etc.). All lines are **commented out** — uncomment the ones you need. | Only when you need the corresponding feature (e.g., uncomment `torch` to use PyTorch-based routers). |
| `requirements-dev.txt` | Test-only dependencies (pytest, pytest-cov, pytest-asyncio, httpx). | When running `pytest` or contributing tests. |

## Why split?

The previous single `requirements.txt` (and a parallel `requirements_phase1.txt`)
contained conflicting version pins:
- `pydantic>=1.8.0,<2.0.0` clashed with code that uses Pydantic v2 syntax.
- Many heavy packages (torch, tensorflow, ray, detectron2, seldon-core) had
  upper bounds from a v1-era spec but were never actually used at install time.
- `grafana-api` is not a standard PyPI package — the real library is
  `grafana-client` or `grafapy`.

By splitting:
- `pip install -r requirements.txt` works on any Python 3.11+ machine.
- Heavy ML frameworks can be installed one at a time as features are needed.
- Tests are isolated to a separate dev install.

## Common install patterns

```bash
# Minimal: just run the API server with skeleton models
pip install -r requirements.txt

# Add deep-learning routers (nlp, computer_vision, continual_learning)
pip install -r requirements.txt
# then uncomment the lines you need in requirements-extras.txt and:
pip install -r requirements-extras.txt

# Developer install (with tests)
pip install -r requirements.txt -r requirements-dev.txt
```

## Compatibility

- **Python:** 3.11+ (Pydantic v2 requires 3.8+, FastAPI 0.110+ requires 3.8+)
- **OS:** Tested on Linux and Windows. Heavy ML packages may have additional
  native build requirements (CUDA, MSVC, etc.) — see their docs.
