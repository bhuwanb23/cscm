"""Verify all saved model weights load and produce predictions."""
import sys, os, pickle, glob
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'models'))

import numpy as np

results = []
for p in sorted(glob.glob(os.path.join(os.path.dirname(__file__), '..', '**', 'weights', '*.pkl'), recursive=True)):
    fsize = os.path.getsize(p)
    rel = os.path.relpath(p, os.path.join(os.path.dirname(__file__), '..'))
    try:
        with open(p, 'rb') as f:
            payload = pickle.load(f)
        if isinstance(payload, dict):
            typ = type(payload.get('model', next(iter(payload.values())))).__name__
        else:
            typ = type(payload).__name__

        model = payload.get('model') if isinstance(payload, dict) else payload
        if hasattr(model, 'predict'):
            x = np.random.randn(5, 4)
            preds = model.predict(x)
            status = f"predict OK ({preds[:3]})"
        elif hasattr(model, 'solve'):
            status = "solver OK"
        else:
            status = f"config OK ({list(payload.keys())[:2]})"
        results.append((rel, fsize, typ, "OK", status))
    except Exception as e:
        results.append((rel, fsize, "?", "FAIL", str(e)[:80]))

for rel, size, typ, ok, note in results:
    print(f"[{ok}] {rel}  ({size//1024}KB)  {typ}  {note}")
