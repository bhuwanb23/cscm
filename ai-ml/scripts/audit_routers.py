"""Audit all routers for mock/random data patterns."""
import sys, os, re

routers_dir = os.path.join(os.path.dirname(__file__), '..', 'api', 'routers')
router_files = sorted(os.listdir(routers_dir))

mock_patterns = [
    (r'np\.random', 'np.random'),
    (r'rng\.random', 'rng.random'),
    (r'\brng\b', 'rng variable'),
    (r'random\.random', 'random.random'),
    (r'random\.randn', 'random.randn'),
    (r'random\.randint', 'random.randint'),
    (r'random\.uniform', 'random.uniform'),
    (r'np\.random\.default_rng', 'default_rng'),
    (r'np\.random\.randn', 'np.random.randn'),
    (r'np\.random\.rand', 'np.random.rand'),
    (r'np\.random\.random', 'np.random.random'),
    (r'random\.seed', 'random seed'),
    (r'np\.random\.seed', 'np.random.seed'),
    (r'\b_ensure_pkg\b', 'ensure_pkg stub'),
    (r'\b_load_mod\b', 'load_mod stub'),
]

summary = []
for rf in router_files:
    if not rf.endswith('.py') or rf == '__init__.py':
        continue
    fpath = os.path.join(routers_dir, rf)
    with open(fpath, 'r') as f:
        content = f.read()
        lines = content.split('\n')

    # Find endpoint definitions
    endpoints = []
    for m in re.finditer(r'@router\.(get|post|put|delete)\s*\([\'"]([^\'"]+)[\'"]', content):
        endpoints.append((m.group(1).upper(), m.group(2)))

    # Find mock/random lines
    mock_found = {}
    for i, line in enumerate(lines, 1):
        stripped = line.strip()
        if stripped.startswith('#') or stripped.startswith('logger.') or stripped.startswith('print('):
            continue
        for pat, label in mock_patterns:
            if re.search(pat, stripped):
                # Get the function name from context
                func_name = '?'
                for j in range(i-1, max(0, i-20), -1):
                    fm = re.match(r'^\s*(?:async\s+)?def\s+(\w+)', lines[j-1])
                    if fm:
                        func_name = fm.group(1)
                        break
                mock_found[(i, func_name)] = label
                break

    summary.append({
        'file': rf,
        'endpoints': endpoints,
        'mocks': mock_found,
    })

# Print results
for s in summary:
    if s['mocks']:
        print(f"\n=== {s['file']} ({len(s['endpoints'])} endpoints, {len(s['mocks'])} mock lines) ===")
        for (ln, fn), label in sorted(s['mocks'].items()):
            print(f"  L{ln:4d} [{fn}] -> {label}")
        for method, path in s['endpoints']:
            print(f"  {method:5s} {path}")

total_mock_lines = sum(len(s['mocks']) for s in summary)
total_endpoints = sum(len(s['endpoints']) for s in summary)
print(f"\n{'='*50}")
print(f"Total: {total_endpoints} endpoints across {len(summary)} routers")
print(f"Total mock/random lines: {total_mock_lines}")

# List which mock patterns remain per file after Phase 2 fixes
phase2_fixed = ['inventory_optimization.py', 'anomaly_detection.py', 'supplier_risk.py']
for s in summary:
    if s['file'] in phase2_fixed:
        print(f"\n--- {s['file']} (after Phase 2) ---")
        if s['mocks']:
            for (ln, fn), label in sorted(s['mocks'].items()):
                print(f"  L{ln:4d} [{fn}] -> {label}")
        else:
            print(f"  CLEAN - no mock lines")
