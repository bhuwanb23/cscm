import json

# Read template
with open(r"C:\Users\bhuwan.bhawarlal\.agents\skills\hyperframes\templates\design-picker.html", "r", encoding="utf-8") as f:
    html = f.read()

PROMPT = {
    "title": "Cognitive Supply Chain Mesh",
    "headline": "Supply Chain. Reimagined.",
    "subline": "AI-powered multi-agent system for modern retail",
    "section_desc": "Pick a visual direction for your CSCM product demo"
}

ARCHITECTURES = [
    {
        "name": "Data Grid",
        "description": "Metric-driven layout with stat callouts, data cards, and counters dominating the frame",
        "tag": "data / metrics / grid",
        "mood": "Precision and data density. Numbers tell the story.",
        "components": "Cards: dark glass with backdrop blur, 1px border. Stats: 80px+ with tabular-nums. Dividers: hairline rules centered in gaps.",
        "dos": "Lead with the biggest number. Use 2-column stat grids. Animate counters from 0.",
        "preview_html": "<div style=\"background:{{bg}};color:{{fg}};padding:{{pad}};min-height:100vh;font-family:'{{bf}}',sans-serif;font-weight:{{bw}};\"><div style=\"max-width:100%;display:flex;flex-direction:column;gap:{{gap}};\"><div style=\"font-size:10px;text-transform:uppercase;letter-spacing:0.12em;color:{{mt}};font-family:'{{bf}}',monospace;\">cognitive supply chain mesh</div><div style=\"font-family:'{{hf}}',serif;font-weight:{{hw}};font-size:52px;line-height:1.1;letter-spacing:-0.02em;\">{{prompt_headline}}</div><div style=\"font-size:18px;color:{{mt}};max-width:70%;line-height:1.5;\">{{prompt_sub}}</div><div style=\"background:{{fg6}};border-radius:{{cr}};padding:{{pad}};display:flex;gap:{{gap}};flex-wrap:wrap;align-items:stretch;box-shadow:{{shadow}};\"><div style=\"flex:1;min-width:180px;\"><div style=\"font-size:56px;font-family:'{{hf}}',serif;font-weight:{{hw}};color:{{ac}};font-variant-numeric:tabular-nums;\">3.2M+</div><div style=\"font-size:11px;color:{{mt}};margin-top:2px;\">shipments optimized</div></div><div style=\"width:1px;background:{{g}};align-self:stretch;\"></div><div style=\"flex:1;min-width:180px;\"><div style=\"font-size:56px;font-family:'{{hf}}',serif;font-weight:{{hw}};color:{{ac}};font-variant-numeric:tabular-nums;\">99.7%</div><div style=\"font-size:11px;color:{{mt}};margin-top:2px;\">fulfillment accuracy</div></div></div><div style=\"display:flex;gap:{{gap}};flex-wrap:wrap;\"><div style=\"background:{{fg3}};border-radius:{{cr}};padding:{{pad}};flex:1;min-width:180px;box-shadow:{{shadow}};\"><div style=\"font-size:14px;font-weight:600;color:{{fg}};\">Real-time Inventory</div><div style=\"font-size:12px;color:{{mt}};margin-top:6px;line-height:1.5;\">2,847 stores · 12 warehouses live</div></div><div style=\"background:{{fg3}};border-radius:{{cr}};padding:{{pad}};flex:1;min-width:180px;box-shadow:{{shadow}};\"><div style=\"font-size:14px;font-weight:600;color:{{fg}};\">AI Forecast</div><div style=\"font-size:12px;color:{{mt}};margin-top:6px;line-height:1.5;\">94.2% accuracy · 7-day horizon</div></div></div><div style=\"background:{{ac3}};border-radius:{{cr}};padding:{{pad}};border-left:3px solid {{ac}};\"><div style=\"font-size:13px;color:{{fg}};line-height:1.5;\">\"The system predicted a demand spike 48 hours before it happened — we had trucks rerouted before customers noticed.\"</div><div style=\"font-size:10px;color:{{mt}};margin-top:6px;\">— Retail Operations Director</div></div><div style=\"display:flex;gap:{{gap}};\"><div style=\"background:{{ac}};color:{{bg}};border:none;border-radius:{{cr}};padding:10px 20px;font-size:12px;font-weight:600;\">View Demo</div><div style=\"border:1px solid {{fg15}};color:{{fg}};border-radius:{{cr}};padding:10px 20px;font-size:12px;\">Learn More</div></div></div></div>"
    },
    {
        "name": "Editorial Flow",
        "description": "Narrative-driven layout with rich typography, pull quotes, and sequenced reveals",
        "tag": "editorial / narrative / storytelling",
        "mood": "Confident, unhurried, typographically rich. The story unfolds naturally.",
        "components": "Cards: minimal with 1px border. Quote: left-accent stripe. Stats: inline with body text.",
        "dos": "Let type breathe. Use generous padding. One story per scene.",
        "preview_html": "<div style=\"background:{{bg}};color:{{fg}};padding:{{pad}};min-height:100vh;font-family:'{{bf}}',sans-serif;font-weight:{{bw}};\"><div style=\"max-width:100%;display:flex;flex-direction:column;gap:{{gap}};\"><div style=\"font-size:10px;text-transform:uppercase;letter-spacing:0.12em;color:{{ac}};font-weight:600;\">the future of retail</div><div style=\"font-family:'{{hf}}',serif;font-weight:{{hw}};font-size:56px;line-height:1.1;letter-spacing:-0.03em;\">{{prompt_headline}}</div><div style=\"font-size:20px;color:{{mt}};max-width:72%;line-height:1.5;\">{{prompt_sub}} — connecting every link in the supply chain with intelligent agents that think, adapt, and decide.</div><div style=\"border-left:3px solid {{ac}};padding:14px {{pad}};background:{{ac3}};border-radius:0 {{cr}} {{cr}} 0;margin:4px 0;\"><div style=\"font-size:17px;font-style:italic;color:{{fg}};line-height:1.6;\">\"The best supply chain is the one your customers never think about.\"</div><div style=\"font-size:11px;color:{{mt}};margin-top:6px;\">— CSCM philosophy</div></div><div style=\"display:flex;gap:{{gap}};flex-wrap:wrap;\"><div style=\"flex:1;min-width:200px;\"><div style=\"font-size:42px;font-family:'{{hf}}',serif;font-weight:{{hw}};color:{{ac}};\">15K+</div><div style=\"font-size:12px;color:{{mt}};\">active retail nodes</div></div><div style=\"flex:1;min-width:200px;\"><div style=\"font-size:42px;font-family:'{{hf}}',serif;font-weight:{{hw}};color:{{fg}};\">7</div><div style=\"font-size:12px;color:{{mt}};\">intelligent agent types</div></div></div><div style=\"font-size:14px;line-height:1.7;color:{{fg}};max-width:65%;\">From demand sensing to last-mile delivery, each agent operates autonomously while coordinating through a shared knowledge graph and event mesh.</div><div style=\"display:flex;gap:8px;flex-wrap:wrap;\"><span style=\"background:{{fg6}};color:{{mt}};padding:4px 10px;border-radius:4px;font-size:10px;\">Demand Forecasting</span><span style=\"background:{{fg6}};color:{{mt}};padding:4px 10px;border-radius:4px;font-size:10px;\">Inventory Optimization</span><span style=\"background:{{fg6}};color:{{mt}};padding:4px 10px;border-radius:4px;font-size:10px;\">Route Planning</span></div><div style=\"height:1px;background:{{g}};margin:4px 0;\"></div><div style=\"display:flex;gap:{{gap}};align-items:center;flex-wrap:wrap;\"><div style=\"background:{{ac}};color:{{bg}};border:none;border-radius:{{cr}};padding:10px 20px;font-size:12px;font-weight:600;\">Explore Platform</div><div style=\"font-size:11px;color:{{mt}};\">No credit card required</div></div></div></div>"
    },
    {
        "name": "Terminal View",
        "description": "Code-forward, CLI-energy layout with monospace type, data panels, and technical precision",
        "tag": "technical / code / precision",
        "mood": "Industrial precision. Every element has a place and a purpose.",
        "components": "Terminal blocks: dark bg, green/amber accent, monospace. Cards: sharp corners, solid borders. Data: tabular, uncluttered.",
        "dos": "Use monospace for code/data. Sharp corners. Data must be legible at a glance.",
        "preview_html": "<div style=\"background:{{bg}};color:{{fg}};padding:{{pad}};min-height:100vh;font-family:'{{bf}}',monospace;\"><div style=\"max-width:100%;display:flex;flex-direction:column;gap:{{gap}};\"><div style=\"display:flex;gap:{{gap}};align-items:center;flex-wrap:wrap;\"><span style=\"color:{{mt}};font-size:10px;\">[cscm@mesh]</span><span style=\"color:{{ac}};font-size:10px;\">~$</span><span style=\"color:{{fg}};font-size:10px;\">./deploy --env production</span></div><div style=\"font-family:'{{hf}}',sans-serif;font-weight:{{hw}};font-size:44px;line-height:1.1;letter-spacing:-0.02em;\">{{prompt_headline}}</div><div style=\"font-size:14px;color:{{mt}};max-width:80%;line-height:1.6;font-family:'{{bf}}',monospace;\">// {{prompt_sub}}</div><div style=\"background:{{fg3}};border:1px solid {{fg15}};border-radius:{{cr}};padding:{{pad}};box-shadow:{{shadow}};display:flex;flex-direction:column;gap:6px;\"><div style=\"display:flex;gap:12px;font-size:11px;color:{{mt}};\"><span>NODE</span><span>STATUS</span><span style=\"flex:1;\">METRIC</span><span>VALUE</span></div><div style=\"height:1px;background:{{g}};\"></div><div style=\"display:flex;gap:12px;font-size:11px;\"><span style=\"color:{{ac}};\">store-01</span><span style=\"color:#4ade80;\">● active</span><span style=\"flex:1;color:{{mt}};\">inventory accuracy</span><span style=\"color:{{fg}};\">98.3%</span></div><div style=\"display:flex;gap:12px;font-size:11px;\"><span style=\"color:{{ac}};\">wh-03</span><span style=\"color:#4ade80;\">● active</span><span style=\"flex:1;color:{{mt}};\">pick rate</span><span style=\"color:{{fg}};\">287/hr</span></div><div style=\"display:flex;gap:12px;font-size:11px;\"><span style=\"color:{{ac}};\">truck-12</span><span style=\"color:#fbbf24;\">◇ en route</span><span style=\"flex:1;color:{{mt}};\">eta</span><span style=\"color:{{fg}};\">14 min</span></div></div><div style=\"display:flex;gap:{{gap}};flex-wrap:wrap;\"><div style=\"border:1px solid {{fg15}};border-radius:{{cr}};padding:{{pad}};flex:1;min-width:150px;text-align:center;box-shadow:{{shadow}};\"><div style=\"font-size:32px;font-weight:700;color:{{ac}};font-variant-numeric:tabular-nums;\">7</div><div style=\"font-size:9px;color:{{mt}};text-transform:uppercase;letter-spacing:0.06em;\">agents</div></div><div style=\"border:1px solid {{fg15}};border-radius:{{cr}};padding:{{pad}};flex:1;min-width:150px;text-align:center;box-shadow:{{shadow}};\"><div style=\"font-size:32px;font-weight:700;color:{{fg}};font-variant-numeric:tabular-nums;\">3</div><div style=\"font-size:9px;color:{{mt}};text-transform:uppercase;letter-spacing:0.06em;\">protocols</div></div></div><div style=\"background:{{ac3}};border:1px solid {{ac}}25;border-radius:{{cr}};padding:12px {{pad}};\"><div style=\"font-size:11px;color:{{ac}};\">▸ agents all healthy · runtime 14d · 0 incidents</div></div></div></div>"
    },
    {
        "name": "Premium Canvas",
        "description": "Spacious, elegant layout with generous whitespace, centered hero moments, and refined details",
        "tag": "premium / enterprise / showcase",
        "mood": "Refined confidence. Space is the luxury.",
        "components": "Cards: elevated with subtle shadow. Type: wide letter-spacing, uppercase labels. Dividers: thin rules.",
        "dos": "Lead with one idea. Center hero moments. Let whitespace frame the content.",
        "preview_html": "<div style=\"background:{{bg}};color:{{fg}};padding:{{pad}};min-height:100vh;font-family:'{{bf}}',sans-serif;font-weight:{{bw}};display:flex;flex-direction:column;align-items:center;text-align:center;\"><div style=\"max-width:80%;display:flex;flex-direction:column;gap:{{gap}};align-items:center;\"><div style=\"font-size:10px;text-transform:uppercase;letter-spacing:0.18em;color:{{mt}};font-weight:600;\">cognitive supply chain mesh</div><div style=\"font-family:'{{hf}}',serif;font-weight:{{hw}};font-size:64px;line-height:1.05;letter-spacing:-0.02em;\">{{prompt_headline}}</div><div style=\"width:40px;height:2px;background:{{ac}};\"></div><div style=\"font-size:16px;color:{{mt}};max-width:65%;line-height:1.7;\">{{prompt_sub}} — where intelligence meets logistics.</div><div style=\"display:flex;gap:{{gap}};flex-wrap:wrap;justify-content:center;width:100%;\"><div style=\"background:{{fg3}};border-radius:{{cr}};padding:{{pad}};flex:1;min-width:200px;max-width:280px;box-shadow:{{shadow}};\"><div style=\"font-size:11px;color:{{mt}};text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px;\">stores</div><div style=\"font-size:48px;font-family:'{{hf}}',serif;font-weight:{{hw}};color:{{ac}};font-variant-numeric:tabular-nums;\">2,847</div><div style=\"font-size:11px;color:{{mt}};margin-top:4px;\">connected globally</div></div><div style=\"background:{{fg3}};border-radius:{{cr}};padding:{{pad}};flex:1;min-width:200px;max-width:280px;box-shadow:{{shadow}};\"><div style=\"font-size:11px;color:{{mt}};text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px;\">agents</div><div style=\"font-size:48px;font-family:'{{hf}}',serif;font-weight:{{hw}};color:{{fg}};font-variant-numeric:tabular-nums;\">7</div><div style=\"font-size:11px;color:{{mt}};margin-top:4px;\">intelligent types</div></div></div><div style=\"border:1px solid {{fg8}};border-radius:{{cr}};padding:14px {{pad}};width:100%;max-width:500px;\"><div style=\"font-size:12px;color:{{mt}};line-height:1.5;\">\"The supply chain runs itself — we just watch.\"</div><div style=\"font-size:10px;color:{{ac}};margin-top:4px;\">— VP of Operations</div></div><div style=\"display:flex;gap:{{gap}};flex-wrap:wrap;justify-content:center;\"><div style=\"background:{{ac}};color:{{bg}};border:none;border-radius:{{cr}};padding:12px 28px;font-size:12px;font-weight:600;\">Request Demo</div><div style=\"border:1px solid {{fg15}};color:{{fg}};border-radius:{{cr}};padding:12px 28px;font-size:12px;\">Read Whitepaper</div></div></div></div>"
    },
    {
        "name": "Split Frame",
        "description": "Side-by-side layout contrasting data and narrative — information panel and visual story in one frame",
        "tag": "split / comparison / dashboard",
        "mood": "Dual perspective. Data meets story in one unified frame.",
        "components": "Left: data panels, metrics, code. Right: narrative, quotes, CTAs. Divider: vertical rule.",
        "dos": "Keep left data-dense, right spacious. Contrast the two halves intentionally.",
        "preview_html": "<div style=\"background:{{bg}};color:{{fg}};padding:{{pad}};min-height:100vh;font-family:'{{bf}}',sans-serif;font-weight:{{bw}};display:flex;gap:{{gap}};flex-wrap:wrap;\"><div style=\"flex:1;min-width:280px;display:flex;flex-direction:column;gap:{{gap}};\"><div style=\"font-size:9px;text-transform:uppercase;letter-spacing:0.12em;color:{{mt}};\">intelligence layer</div><div style=\"background:{{fg3}};border-radius:{{cr}};padding:{{pad}};border:1px solid {{fg8}};box-shadow:{{shadow}};\"><div style=\"font-size:11px;color:{{mt}};margin-bottom:8px;\">network status</div><div style=\"display:flex;gap:8px;flex-wrap:wrap;\"><div style=\"flex:1;min-width:100px;text-align:center;\"><div style=\"font-size:28px;font-weight:700;color:{{ac}};font-variant-numeric:tabular-nums;\">156</div><div style=\"font-size:9px;color:{{mt}};\">agents online</div></div><div style=\"flex:1;min-width:100px;text-align:center;\"><div style=\"font-size:28px;font-weight:700;color:{{fg}};font-variant-numeric:tabular-nums;\">4.2s</div><div style=\"font-size:9px;color:{{mt}};\">avg response</div></div></div></div><div style=\"background:{{fg3}};border-radius:{{cr}};padding:{{pad}};border:1px solid {{fg8}};box-shadow:{{shadow}};\"><div style=\"font-size:11px;color:{{mt}};margin-bottom:6px;\">recent activity</div><div style=\"font-size:10px;color:{{fg}};line-height:2;\">▸ store-284 → restock triggered<br>▸ wh-03 → picking in progress<br>▸ truck-12 → en route · ETA 14m</div></div><div style=\"background:{{ac3}};border-radius:{{cr}};padding:10px {{pad}};display:flex;align-items:center;gap:8px;\"><span style=\"color:{{ac}};font-size:14px;\">●</span><span style=\"font-size:10px;color:{{mt}};\">All systems operational</span></div></div><div style=\"width:1px;background:{{g}};align-self:stretch;\"></div><div style=\"flex:1;min-width:280px;display:flex;flex-direction:column;gap:{{gap}};justify-content:center;\"><div style=\"font-family:'{{hf}}',serif;font-weight:{{hw}};font-size:48px;line-height:1.1;letter-spacing:-0.02em;\">{{prompt_headline}}</div><div style=\"font-size:16px;color:{{mt}};line-height:1.6;\">{{prompt_sub}}</div><div style=\"display:flex;gap:{{gap}};\"><div style=\"background:{{ac}};color:{{bg}};border:none;border-radius:{{cr}};padding:10px 20px;font-size:12px;font-weight:600;\">See It Live</div><div style=\"border:1px solid {{fg15}};color:{{fg}};border-radius:{{cr}};padding:10px 20px;font-size:12px;\">Watch Demo</div></div></div></div>"
    }
]

PALETTES = [
    {
        "name": "Neural Blue",
        "description": "Dark canvas with cyan electric accent — the AI-native palette for intelligent systems",
        "background": "#0a0a12",
        "foreground": "#e8e8ed",
        "accent": "#06b6d4",
        "muted": "#63637a",
        "mid": "#38384a"
    },
    {
        "name": "Retail Amber",
        "description": "Warm light canvas with amber glow — inviting, human-centered, retail-friendly",
        "background": "#faf6f0",
        "foreground": "#1a1a1a",
        "accent": "#d97706",
        "muted": "#8a7a6a",
        "mid": "#c4b8ac"
    },
    {
        "name": "Core Orange",
        "description": "Dark industrial canvas with bold orange — logistics power and operational intensity",
        "background": "#0d0d0d",
        "foreground": "#f0ece4",
        "accent": "#ea580c",
        "muted": "#6b6560",
        "mid": "#3a3530"
    },
    {
        "name": "Merchant Gold",
        "description": "Deep warm dark with gold accent — premium commerce and enterprise retail",
        "background": "#0d0d0a",
        "foreground": "#f0ece4",
        "accent": "#d4a017",
        "muted": "#706a5c",
        "mid": "#3a362c"
    },
    {
        "name": "Signal Teal",
        "description": "Clean light canvas with teal accent — data-driven clarity for dashboards and metrics",
        "background": "#f5f8f7",
        "foreground": "#1a1a1a",
        "accent": "#0d9488",
        "muted": "#6b7a77",
        "mid": "#b8c4c0"
    },
    {
        "name": "Night Violet",
        "description": "Deep dark canvas with violet accent — futuristic, speculative, innovation-forward",
        "background": "#0a0a0f",
        "foreground": "#e0dce8",
        "accent": "#8b5cf6",
        "muted": "#5c5a6e",
        "mid": "#363550"
    }
]

TYPEPAIRS = [
    {
        "headline": {"family": "Fraunces", "weight": 800},
        "body": {"family": "Space Grotesk", "weight": 400},
        "preview": "Supply Chain. Reimagined.",
        "body_preview": "Seven intelligent agents coordinating through a shared knowledge graph."
    },
    {
        "headline": {"family": "STIX Two Text", "weight": 600},
        "body": {"family": "Albert Sans", "weight": 400},
        "preview": "Supply Chain. Reimagined.",
        "body_preview": "From demand sensing to last-mile delivery — every link connected."
    },
    {
        "headline": {"family": "Archivo Black", "weight": 400},
        "body": {"family": "DM Mono", "weight": 300},
        "preview": "SUPPLY CHAIN. REIMAGINED.",
        "body_preview": "// agents online: 156 · latency: 4.2ms · uptime: 99.97%"
    },
    {
        "headline": {"family": "Abril Fatface", "weight": 400},
        "body": {"family": "DM Sans", "weight": 400},
        "preview": "Supply Chain. Reimagined.",
        "body_preview": "Where intelligence meets logistics at enterprise scale."
    },
    {
        "headline": {"family": "Bricolage Grotesque", "weight": 700},
        "body": {"family": "JetBrains Mono", "weight": 300},
        "preview": "Supply Chain. Reimagined.",
        "body_preview": "cscm deploy --mesh --agents 7 --runtime production"
    }
]

MOODBOARDS = [
    {
        "name": "Neural Pulse",
        "description": "Dark, AI-driven, data-immersive. Cyan electron trails across a deep blue-black canvas. Stats pulse like neural signals.",
        "theme": "dark",
        "arch_index": 0,
        "palette_index": 0,
        "type_index": 0,
        "corners_index": 1,
        "density_index": 1,
        "depth_index": 2,
        "easing_index": 0,
        "corners": "4px",
        "padding": "24px",
        "gap": "16px",
        "shadow": "0 4px 24px rgba(6,182,212,0.12)"
    },
    {
        "name": "Retail Flow",
        "description": "Warm, approachable, consumer-side. Amber tones and serif type tell a human story of commerce made invisible.",
        "theme": "light",
        "arch_index": 1,
        "palette_index": 1,
        "type_index": 1,
        "corners_index": 2,
        "density_index": 1,
        "depth_index": 1,
        "easing_index": 2,
        "corners": "12px",
        "padding": "32px",
        "gap": "16px",
        "shadow": "0 2px 12px rgba(0,0,0,0.04)"
    },
    {
        "name": "Logistics Core",
        "description": "Industrial, precise, CLI-forward. Orange-hot data on a dark floor. Technical authority with a punk edge.",
        "theme": "dark",
        "arch_index": 2,
        "palette_index": 2,
        "type_index": 2,
        "corners_index": 0,
        "density_index": 0,
        "depth_index": 1,
        "easing_index": 1,
        "corners": "0px",
        "padding": "16px",
        "gap": "12px",
        "shadow": "0 2px 12px rgba(234,88,12,0.1)"
    },
    {
        "name": "Connected Commerce",
        "description": "Refined, premium, enterprise. Gold on deep warm dark — the confidence of a system that never fails.",
        "theme": "dark",
        "arch_index": 3,
        "palette_index": 3,
        "type_index": 3,
        "corners_index": 1,
        "density_index": 2,
        "depth_index": 2,
        "easing_index": 2,
        "corners": "4px",
        "padding": "40px",
        "gap": "24px",
        "shadow": "0 4px 32px rgba(212,160,23,0.08)"
    },
    {
        "name": "Signal Mesh",
        "description": "Clean, data-clear, dashboard-native. Teal on off-white — the view from the control room.",
        "theme": "light",
        "arch_index": 4,
        "palette_index": 4,
        "type_index": 4,
        "corners_index": 1,
        "density_index": 0,
        "depth_index": 1,
        "easing_index": 3,
        "corners": "4px",
        "padding": "16px",
        "gap": "12px",
        "shadow": "0 2px 8px rgba(13,148,136,0.08)"
    }
]

# Replace placeholders
html = html.replace("__ARCHITECTURES_JSON__", json.dumps(ARCHITECTURES))
html = html.replace("__PALETTES_JSON__", json.dumps(PALETTES))
html = html.replace("__TYPEPAIRS_JSON__", json.dumps(TYPEPAIRS))
html = html.replace("__MOODBOARDS_JSON__", json.dumps(MOODBOARDS))
html = html.replace("__PROMPT_JSON__", json.dumps(PROMPT))

with open(r"C:\Users\bhuwan.bhawarlal\Desktop\projects\cscm\.hyperframes\pick-design.html", "w", encoding="utf-8") as f:
    f.write(html)

print("Design picker generated successfully!")
print(f"File size: {len(html)} bytes")
