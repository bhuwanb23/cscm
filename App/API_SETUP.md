# API Setup

The CSCM mobile app talks to the **Node.js gateway** running on your development
machine. The gateway listens on **port 3000** by default and proxies AI/ML requests
to the Python service on port 8000.

## Quick start

1. **Start the backend** (in a separate terminal):
   ```bash
   cd backend
   npm run dev          # Node.js gateway on :3000
   ```
   Then in another terminal:
   ```bash
   cd ai-ml
   venv\Scripts\python -m api._run_server   # Python AI/ML on :8000
   ```

2. **Start the mobile app**:
   ```bash
   cd App
   npx expo start
   ```
   - Press `w` to open in a web browser (fastest smoke test)
   - Scan the QR code with **Expo Go** on a phone (must be on the same WiFi as your dev machine)

3. **Health check**: the app shows a green health gate on the launch screen when
   the backend is reachable. If it's red, the app won't let you past the gate
   until the backend comes back.

## Backend URL resolution

The app picks the backend URL in this order (`src/api/config.js`):

| Priority | Source | Use case |
| --- | --- | --- |
| 1 | `EXPO_PUBLIC_BACKEND_URL` env var | Production builds, staging, demos on a different network |
| 2 | Expo `hostUri` (LAN IP of dev machine) | Phone with Expo Go on the same WiFi as your laptop |
| 3 | `http://localhost:3000` | Web build, iOS simulator, Android emulator on the same machine |

## Finding your dev machine's LAN IP

The Expo dev server prints a URL like `exp://192.168.1.10:8081`. The `192.168.1.10`
part is your dev machine's LAN IP — the app uses this to reach your backend at
`http://192.168.1.10:3000` automatically.

To find it manually:

| OS | Command |
| --- | --- |
| Windows | `ipconfig` → look for `IPv4 Address` under your active WiFi/Ethernet adapter |
| macOS / Linux | `ifconfig \| grep "inet "` (skip the `127.0.0.1` line) |

## Overriding the backend URL

### For Expo Go (development)

Set the env var before starting Expo:
```bash
# Windows PowerShell
$env:EXPO_PUBLIC_BACKEND_URL = "http://192.168.1.42:3000"
npx expo start

# macOS / Linux
EXPO_PUBLIC_BACKEND_URL=http://192.168.1.42:3000 npx expo start
```

### For production builds

Set the env var at build time:
```bash
EXPO_PUBLIC_BACKEND_URL=https://api.cscm.example.com npx expo run:ios
```

## Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Red health gate on launch | Backend not running, or wrong port | Start the backend; check `lsof -i :3000` (macOS) or `netstat -ano \| findstr :3000` (Windows) |
| Red health gate, backend is running | Firewall blocking port 3000 on the dev machine | Allow inbound on port 3000, or set `EXPO_PUBLIC_BACKEND_URL` to `localhost` if using an emulator |
| Phone can't reach backend, web build works | Phone and dev machine on different WiFi networks | Connect both to the same network, or set `EXPO_PUBLIC_BACKEND_URL` explicitly |
| Random network errors mid-session | Dev machine went to sleep, IP changed | Tap the "Retry" button on the health gate |
