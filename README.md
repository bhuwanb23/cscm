# CSCM — Cognitive Supply Chain Mesh

A multi-tier supply chain intelligence platform with a React Native mobile app (3 roles + mesh console), a Node.js API gateway, and a Python AI/ML backend with 31 sub-agents.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Mobile App (Expo)                  │
│   Shopkeeper · Transporter · Wholesaler · Mesh UI    │
│  ┌───────────────────────────────────────────────┐   │
│  │               src/api/ (fetch wrapper)         │   │
│  └──────────────┬────────────────────────────────┘   │
└─────────────────┼────────────────────────────────────┘
                  │ :8080
┌─────────────────▼────────────────────────────────────┐
│               API Gateway (Express)                   │
│  ┌─────────────┴──────────────┐                       │
│  │  /api/*  proxy to backend │  /ai-ml/*  proxy to   │
│  │  (port 3000)              │  Python FastAPI (8000) │
│  └─────────────┬──────────────┘                       │
└────────────────┼─────────────────────────────────────┘
                 │
    ┌────────────┴────────────┐
┌───▼──────────┐      ┌──────▼───────────┐
│  Backend      │      │  Python AI/ML    │
│  (Express)    │      │  (FastAPI)       │
│  :3000        │      │  :8000           │
│  • REST API   │      │  • 17 routers    │
│  • SQLite     │      │  • 31 sub-agents │
│  • Seed data  │      │  • Legacy models │
└───────────────┘      └──────────────────┘
```

## Directory Structure

```
cscm/
├── App/              # React Native mobile app (Expo SDK 54)
│   ├── login/        # 3-role picker (shopkeeper/transporter/wholesaler)
│   ├── users/        # Role-specific screens + hooks
│   │   ├── shopkeepers/   # 7 screens (dashboard, inventory, stock, shipments, analysis, communication, profile)
│   │   ├── transporters/  # 4 screens (dashboard, tasks, navigation, profile)
│   │   ├── wholesalers/   # 5 screens (dashboard, inventory, orders, shipments, profile)
│   │   └── mesh/          # 4 sub-views (alerts, knowledge graph, drift, network)
│   └── src/          # Shared: api client, hooks, demo data, theme, utils
├── backend/          # Express.js API server (:3000) + gateway (:8080)
│   └── src/          # Routes, agents, middleware, seed scripts
├── ai-ml/            # Python FastAPI backend (:8000)
│   ├── api/          # FastAPI app: models, routers, scripts, validation
│   └── legacy_models/ # Model implementations (demand forecasting, NLP, CV, etc.)
├── plans/            # Build plans, smoke test records
├── prototype/        # Early HTML prototypes (stale; kept for reference)
├── cscm-video/       # Promotional video assets
├── website/          # Landing/marketing site
└── issues.md         # Issue tracker (all P0/P1/P2 closed)
```

## Quick Start

### Mobile App

```bash
cd App
npm install
npx expo start
```

### Backend (Express API + Gateway)

```bash
cd backend
npm install
npm start              # API on :3000
node src/gateway/gateway.js   # Gateway on :8080
```

### Python AI/ML

```bash
cd ai-ml
ai-ml\venv\Scripts\Activate.ps1    # Windows PowerShell
pip install -r requirements.txt
uvicorn api.main:app --reload       # FastAPI on :8000
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile | React Native 0.81 / Expo SDK 54 / React Native Paper 5.14 |
| API Gateway | Express.js (:8080) |
| Backend | Express.js (:3000) / SQLite |
| AI/ML | Python 3.11+ / FastAPI / PyTorch / Scikit-learn / XGBoost |
| Auth | Demo-only (3-role picker, no real auth) |

## Development Notes

- **Python venv**: Always use `ai-ml/venv/` — global Python has a broken torch DLL.
- **PowerShell**: No `&&` operator; use `if ($?) { cmd }` for chaining.
- **Commit messages**: Use Git Bash or double-quote strings to avoid `/` path interpretation.
- **Model weights**: Weight files (`*.pkl`, `*.pt`, `*.onnx`, etc.) are gitignored via `gitignore`.
