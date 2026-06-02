"""Audit only endpoints returning mock/random data (skip import stubs)."""
import sys, os, re

routers_dir = os.path.join(os.path.dirname(__file__), '..', 'api', 'routers')
router_files = sorted(os.listdir(routers_dir))

# Only flag patterns that RETURN mock data to the caller
mock_patterns = [
    (r'\bnp\.random\.', 'np.random'),
    (r'\brng\b.*=', 'rng var'),
    (r'\brng\.random\b', 'rng.random'),
    (r'\brng\.randn\b', 'rng.randn'),
    (r'\brng\.integers\b', 'rng.integers'),
    (r'\brandom\.random\b', 'random.random'),
    (r'\brandom\.randn\b', 'random.randn'),
    (r'\brandom\.randint\b', 'random.randint'),
    (r'\brandom\.uniform\b', 'random.uniform'),
    (r'\brandom\.seed\b', 'random.seed'),
    (r'\brandom\.choice\b', 'random.choice'),
    (r'\brandom\.gauss\b', 'random.gauss'),
]

total_mock = 0
for rf in router_files:
    if not rf.endswith('.py') or rf == '__init__.py': continue
    fpath = os.path.join(routers_dir, rf)
    with open(fpath) as f: content = f.read()
    lines = content.split('\n')

    endpoints = []
    for m in re.finditer(r'@router\.(get|post|put|delete)\s*\([\'"]([^\'"]+)[\'"]', content):
        endpoints.append((m.group(1).upper(), m.group(2)))

    func_name = '__top__'
    mock_in_func = {}
    mock_lines_set = set()

    for i, line in enumerate(lines, 1):
        stripped = line.strip()
        fm = re.match(r'^\s*(?:async\s+)?def\s+(\w+)', stripped)
        if fm: func_name = fm.group(1)

        if stripped.startswith('#') or stripped.startswith('logger.') or stripped.startswith('print('):
            continue
        for pat, label in mock_patterns:
            if re.search(pat, stripped) and '_load_mod' not in stripped and '_ensure_pkg' not in stripped:
                mock_in_func[func_name] = mock_in_func.get(func_name, 0) + 1
                mock_lines_set.add(i)
                break

    if mock_lines_set:
        total_mock += len(mock_lines_set)
        print(f"\n=== {rf} ({len(endpoints)} endpoints, {len(mock_lines_set)} mock lines) ===")
        for func, count in sorted(mock_in_func.items(), key=lambda x: -x[1]):
            print(f"  {func}: {count} mock lines")
        for method, path in endpoints:
            print(f"  {method:5s} {path}")

print(f"\n{'='*50}")
print(f"Total mock lines across all routers: {total_mock}")
