import subprocess, requests, time, sys, os

proc = subprocess.Popen(
    [sys.executable, '-m', 'uvicorn', 'api.main:app', '--host', '127.0.0.1', '--port', '8349', '--log-level', 'error'],
    cwd=os.getcwd(), stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
)
time.sleep(8)
base = 'http://127.0.0.1:8349/api/v1'

ok, fail = 0, 0

r = requests.post(f'{base}/inventory/ss-policy', json={
    'sku_id': 'SKU001', 'store_id': 'STORE01',
    'holding_cost': 5, 'ordering_cost': 50, 'shortage_cost': 15
})
if r.status_code == 200:
    d = r.json()
    print(f'analytical: s={d["s"]:.2f} S={d["S"]:.2f}')
    ok += 1
else:
    print(f'FAIL {r.status_code}: {r.text[:200]}')
    fail += 1

r = requests.post(f'{base}/inventory/ss-policy', json={
    'sku_id': 'SKU001', 'store_id': 'STORE01',
    'holding_cost': 3, 'ordering_cost': 25, 'shortage_cost': 9, 'service_level': 0.9
})
if r.status_code == 200:
    d = r.json()
    print(f'lookup: s={d["s"]:.2f} S={d["S"]:.2f}')
    ok += 1
else:
    print(f'FAIL {r.status_code}: {r.text[:200]}')
    fail += 1

proc.terminate(); proc.wait()
print(f'OK={ok} FAIL={fail}')
