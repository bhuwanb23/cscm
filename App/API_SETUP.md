# API Setup

The CSCM mobile app talks to the **Node.js API gateway** running on your
development machine. The gateway listens on **port 8080** and routes
requests between:

- The **Express API** on port 3000 (`backend/src/api/server.js`) — handles
  CRUD, auth, agent sub-agents that don't need AI/ML models
- The **Python AI/ML service** on port 8000 (`ai-ml/api/main.py`) — handles
  demand forecasting, anomaly detection, NLP, knowledge graph queries, etc.

The gateway is the right entry point for the mobile app: it hides the
backend topology, has CORS configured, and is where production auth/rate
limiting will live.

## Quick start (three terminals)

```bash
# Terminal 1 — Express API (backend)
cd backend
npm run dev                          # :3000

# Terminal 2 — Python AI/ML (ai-ml)
cd ai-ml
venv\Scripts\python -m api._run_server   # :8000

# Terminal 3 — Gateway (backend)
cd backend
node src/gateway/gateway.js          # :8080

# Terminal 4 — Mobile app (App)
cd App
npx expo start                       # scan QR for Expo Go
```

If you only want to poke the mobile app and don't have time for the full
stack, the Express API on `:3000` also serves the same `/api/v1/*`
paths directly — set `EXPO_PUBLIC_BACKEND_URL=http://localhost:3000` to
use it as a shortcut. AI/ML endpoints will fail until Python is up.

## Health check

The app shows a green health gate on the launch screen when the gateway
returns 200 from `/health`. If it's red, the app won't let you past the
gate until the backend comes back.

To check the gateway yourself:
```bash
curl http://localhost:8080/health
# {"status":"healthy","service":"api-gateway","timestamp":"..."}

curl http://localhost:8080/health/python
# {"service":"ai-ml-python","status":"healthy",...}
```

## Backend URL resolution

The app picks the backend URL in this order (`src/api/config.js`):

| Priority | Source | Use case |
| --- | --- | --- |
| 1 | `EXPO_PUBLIC_BACKEND_URL` env var | Production builds, staging, demos on a different network |
| 2 | Expo `hostUri` (LAN IP of dev machine) | Phone with Expo Go on the same WiFi as your laptop |
| 3 | `http://localhost:8080` | Web build, iOS simulator, Android emulator on the same machine |

## Finding your dev machine's LAN IP

The Expo dev server prints a URL like `exp://192.168.1.10:8081`. The
`192.168.1.10` part is your dev machine's LAN IP — the app uses this to
reach the gateway at `http://192.168.1.10:8080` automatically.

To find it manually:

| OS | Command |
| --- | --- |
| Windows | `ipconfig` → look for `IPv4 Address` under your active WiFi/Ethernet adapter |
| macOS / Linux | `ifconfig \| grep "inet "` (skip the `127.0.0.1` line) |

## Overriding the backend URL

### For Expo Go (development)

Set the env var before starting Expo:
```powershell
# Windows PowerShell
$env:EXPO_PUBLIC_BACKEND_URL = "http://192.168.1.42:8080"
npx expo start
```
```bash
# macOS / Linux
EXPO_PUBLIC_BACKEND_URL=http://192.168.1.42:8080 npx expo start
```

### For production builds

```bash
EXPO_PUBLIC_BACKEND_URL=https://api.cscm.example.com npx expo run:ios
```

## Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Red health gate on launch | Gateway not running, or wrong port | Start `node src/gateway/gateway.js`; check `netstat -ano \| findstr :8080` (Windows) or `lsof -i :8080` (macOS) |
| Green gate but most endpoints 502 | Gateway is up but Python AI/ML is down | Start `venv\Scripts\python -m api._run_server` in `ai-ml/` |
| Red health gate, gateway is running | Firewall blocking port 8080 on the dev machine | Allow inbound on port 8080, or set `EXPO_PUBLIC_BACKEND_URL=localhost` for emulator |
| Phone can't reach backend, web build works | Phone and dev machine on different WiFi | Connect both to the same network, or set `EXPO_PUBLIC_BACKEND_URL` explicitly |
| Random network errors mid-session | Dev machine went to sleep, IP changed | Tap the "Retry" button on the health gate |
