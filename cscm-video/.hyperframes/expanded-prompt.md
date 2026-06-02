# CSCM Product Demo — Expanded Production Brief

## Title + Style Block

- **Palette:** Primary #0a0a12, On-primary #e8e8ed, Accent #06b6d4, Muted #63637a
- **Headline:** Fraunces 800 — variable serif, authoritative yet warm
- **Body:** Space Grotesk 400 — clean geometric sans
- **Corners:** 4px rounded
- **Spacing:** 24px padding, 16px gaps
- **Entry ease:** power3.out | **Exit ease:** power4.in | **Ambient:** sine.inOut
- **Energy:** Moderate — intentional, unhurried
- **Atmosphere:** Radial glow, grid lines, particle field
- **Canvas:** Dark (1920x1080)

## Rhythm Declaration

hook → SENSE → ROUTE → EXECUTE → DELIVER → RESOLVE

- Scene 1 (hook): 0-7s — slow atmospheric build, single focal point
- Scene 2 (sense): 7-16s — data pulse, medium energy, staggered entrances
- Scene 3 (route): 16-26s — network reveal, wide frame, deliberate reveals
- Scene 4 (execute): 26-36s — efficient precision, mechanical rhythm
- Scene 5 (deliver): 36-46s — resolving energy, warm arrival
- Scene 6 (resolve): 46-60s — grand reveal, slow pull-back, fade to black

## Global Rules

- All entrances: gsap.from() or gsap.fromTo() with power3.out
- Transition style: overlapping crossfade, 0.6-0.8s, sine.inOut
- Ambient motion: slow pulse on glows, slow drift on grid/particles
- No exit animations except Scene 6 final fade
- 3+ different eases per scene
- Tabular-nums on all stat values
- Never center-everything — zone-based layout, anchor to edges

## Per-Scene Beats

### Scene 1: The Trigger (0-7s)

**Concept:** A lone product on a dark shelf. The last one. A customer takes it. The empty space glows — the supply chain is awake. The viewer feels: "something just happened."

**Mood direction:** Cinematic product shot. Dark, minimal, single light source. Think Apple product photography meets noir atmosphere.

**Depth layers:**
- BG: Deep navy (#0a0a12) with subtle radial glow in center
- MG: Shelf surface (horizontal rule), product silhouette, empty space indicator
- FG: Hairline grid lines, tiny monospace coord label bottom-right

**Elements (8):**
1. Shelf rule — horizontal 1px line at 60% height, color #ffffff at 8%
2. Product silhouette — simple geometric shape (box) on shelf, soft cyan edge glow
3. Hand silhouette — enters from right, reaches, takes product
4. Empty pulse — when product is taken, a cyan ring pulse expands from the empty spot
5. Scene title — "Inventory Running Low" in Space Grotesk 14px, muted color, bottom-left
6. Data tick — tiny monospace counter bottom-right, decreasing number
7. Grid background — subtle dot grid at 2% opacity
8. Glyph accent — decorative abstract shape top-right at 5% opacity

**Animation choreography:**
- Shelf rule: SLIDES in from left over 0.6s at t=0.3
- Product: FADES in at t=0.3, holds
- Hand: SLIDES from right (x:200→0) at t=1.5, ease power2.out
- Empty pulse: EXPANDS from center at t=3.0 (scale 0→3, opacity 0.6→0), ease expo.out
- Scene title: FADES in at t=0.8
- Data tick: TYPES ON (digit changes) at t=4.0

**Transition out:** Crossfade at t=6.5, duration 0.8s, sine.inOut

### Scene 2: The Store Agent Senses (7-16s)

**Concept:** Pull back from the shelf to see data flowing. The Store Agent activates — a digital intelligence that watches every item. Inventory numbers cascade, a forecast runs, a decision is made. The viewer feels: "there's an AI watching over this."

**Mood direction:** Data visualization meets AI interface. Grids, flowing numbers, neural pulse. Think Blade Runner UI but clean and readable.

**Depth layers:**
- BG: #0a0a12 + cyan radial glow bottom-left
- MG: Store node icon (circle), data stream lines flowing upward, stat cards
- FG: Grid lines, accent labels, status indicators

**Elements (9):**
1. Store icon — pulsing circle with store glyph, cyan accent, top-center area
2. Data stream — animated line paths flowing from store icon upward (3-4 paths)
3. Inventory counter — large Fraunces number animate from 42→38→35, tabular-nums
4. Forecast card — card with "Demand Forecast: +23%" text, 4px radius, glass background
5. Status indicator — "Store Agent: ACTIVE" with green dot, top-left
6. Decision badge — "RESTOCK TRIGGERED" badge pulses cyan at the end, bottom-center
7. Scene label — "Store Agent · Demand Sensing" bottom-left, 12px Space Grotesk mono
8. Secondary stat — "Threshold: 40 units" muted, below inventory counter
9. Hairline accent rule — vertical line left of scene label

**Animation choreography:**
- Store icon: PULSES in (scale 0→1) at t=7.3, ease back.out(1.4)
- Status indicator: TYPES ON (character by character or fade) at t=7.5
- Inventory counter: COUNTS DOWN (42→38→35) in steps at t=8.0, ease steps(1)
- Data streams: DRAW (SVG dashoffset→0) at t=7.5-9.0, staggered
- Forecast card: SLIDES up from y:30 at t=8.5, ease power3.out
- Decision badge: SLAMS in at t=10.0 (scale 2→1, opacity), ease expo.out
- Scene label: FADES in at t=7.8
- Hour lines: DRIFT (ambient sine x oscillation throughout scene)

**Transition out:** Crossfade at t=15.2, duration 0.8s

### Scene 3: The Network Routes (16-26s)

**Concept:** The camera zooms out to reveal the full network — a map of connected nodes. A signal travels from the trigger store, through the central planner, to the nearest warehouse. Lines animate, nodes pulse. The viewer feels: "this is a system. A smart one."

**Mood direction:** Network topology visualization. Clean lines, pulsing nodes, data flowing through a mesh. Think cyber-physical systems diagrams made cinematic.

**Depth layers:**
- BG: #0a0a12 + subtle grid pattern with line intersections glowing
- MG: Map with nodes (stores, warehouses, transport hubs) connected by animated lines
- FG: Node labels, data packets traveling along lines, stat panels

**Elements (10):**
1. Network map — 8-10 nodes arranged across the frame (stores small cyan dots, warehouses larger orange dots)
2. Connection lines — thin SVG paths between nodes, initially dim, animate bright when used
3. Signal pulse — a glowing dot travels along the route from store→planner→warehouse
4. Central Planner node — larger, central, pulsing with label "Planner"
5. Route highlight — the active route from store to warehouse glows brighter
6. Stat panel — "47 Warehouses · 2,847 Stores" card, 4px radius, top-right
7. Scene title — "Central Planner · Intelligent Routing" bottom-left
8. Route info card — "Route: Store #284 → WH-03 (14.2 km)" bottom-right
9. Packet labels — small monospace tags on data packets: "restock_284", "qty: 240"
10. Status bar — thin accent line bottom, with "SEARCHING → ROUTING → ASSIGNED" progress

**Animation choreography:**
- Network map: NODES FADE + SCALE IN staggered at t=16.3-17.5
- Connection lines: DRAW (dashoffset) from visible nodes at t=16.5-18.0
- Signal pulse: MOTIONPATH along route curve at t=17.5-19.0, ease none
- Route highlight: BRIGHTENS (opacity 0.1→0.6) at t=17.5
- Stat panel: SLIDES from right at t=16.8, ease power3.out
- Route info card: FADES in at t=18.0
- Status bar: FILLS (scaleX 0→1) left to right as status progresses at t=16.3-19.0
- Scene title: FADES in at t=16.5
- Pulse ambient: all nodes slow BREATHE (scale 1↔1.05) throughout

**Transition out:** Crossfade at t=25.2, duration 0.8s

### Scene 4: Warehouse in Action (26-36s)

**Concept:** Inside the warehouse — robotic precision. A picking list ticks down as items are gathered. Boxes move along a conveyor. Everything is organized, fast, silent. The viewer feels: "this is efficiency."

**Mood direction:** Industrial precision meets clean UI. Think automated warehouse dashboards, scannable lists, organized chaos made digital and serene.

**Depth layers:**
- BG: #0a0a12 + orange-brown radial warmth from bottom
- MG: Picking list panel, conveyor line visualization, pack station
- FG: Progress indicators, check marks, small data labels

**Elements (9):**
1. Picking list — list of 6 items with checkboxes, "Item A ✓" "Item B ✓" etc, left panel
2. Progress bar — fills as picking completes, 4px height, cyan accent
3. Conveyor icon — horizontal line with small rectangles moving along it
4. Pack station — box icon that fills/increments at center-right
5. Timer — "00:42" count-up, large Fraunces number, tabular-nums
6. Efficiency stat — "Pick Rate: 287/hr" card, bottom-right
7. Scene title — "Warehouse Agent · Picking & Packing" bottom-left
8. Check marks — each check mark STAMPS in when item is "picked"
9. Conveyor dots — small dots DRIFT right-to-left on conveyor line (ambient)

**Animation choreography:**
- Picking list panel: SLIDES from left at t=26.3, ease power3.out
- Items: each item reveals with CHECK STAMP staggered 0.4s apart starting at t=27.0
- Progress bar: FILLS (scaleX) in sync with check marks t=27.0-30.0
- Pack station: FADES in at t=28.0, box icon scales up incrementally
- Timer: COUNTS UP 00:00→00:42 at t=26.5-32.0, ease none (linear)
- Efficiency stat: SLIDES from right at t=29.0
- Conveyor dots: DRIFT right-to-left throughout
- Scene title: FADES in at t=26.5

**Transition out:** Crossfade at t=35.2, duration 0.8s

### Scene 5: Last Mile (36-46s)

**Concept:** A truck traverses a route on a map. The ETA ticks down. A customer's phone lights up: "Your delivery is arriving in 14 minutes." The viewer feels: "connected. Informed. In control."

**Mood direction:** Warm arrival. The journey's end. Think ride-share tracking but for supply chain. Clean map, satisfying progress.

**Depth layers:**
- BG: #0a0a12 + warm amber-teal gradient glow
- MG: Map with route line, truck icon moving, arrival destination pin
- FG: ETA display, customer notification card, status bar

**Elements (9):**
1. Map background — stylized road network (subtle gray lines)
2. Truck icon — small icon that moves along the route path
3. Route line — glowing line from warehouse to store, with traveled portion brighter
4. Destination pin — pulsing pin icon at store location, cyan accent
5. ETA counter — "14:32" → "00:00" counting down, large Fraunces, tabular-nums
6. Customer notification card — "Your item has arrived" with check mark, slides in
7. Route info — "WH-03 → Store #284" small label, top-right
8. Scene title — "Transport Agent · Last Mile Delivery" bottom-left
9. Progress tracker — 3 dots: Picked ● Packed ● Delivered ●, last one fills

**Animation choreography:**
- Map lines: FADE in at t=36.3
- Truck icon: MOVES along route path (motionPath or x/y tween) at t=36.5-41.0
- Route line: FILLS (draw traveled portion) as truck moves
- ETA counter: COUNTS DOWN 14:32→00:00 at t=37.0-42.0, ease steps(1)
- Customer notification: SLIDES up from bottom at t=41.0, ease power3.out
- Destination pin: PULSES (scale 1↔1.15) once reaches destination
- Scene title: FADES in at t=36.5
- Progress tracker: FILLS sequentially at t=36.5, 39.0, 42.0

**Transition out:** Crossfade at t=45.2, duration 0.8s

### Scene 6: The Big Picture (46-60s)

**Concept:** The camera zooms out to show EVERYTHING — the entire network, all the agents, all the data flowing. Stats emerge one by one. The brand comes together. The viewer feels: "this is the future of retail."

**Mood direction:** Grand reveal. Cinematic pull-back. Think Marvel Studios logo sequence — epic, earned, satisfying.

**Depth layers:**
- BG: #0a0a12 with wide cyan radial glow from center
- MG: Full network visualization, stat callouts arranged across the frame
- FG: Brand name, tagline, final CTA

**Elements (10):**
1. Full network map — same nodes from Scene 3 but ALL of them visible, all lines glowing
2. Large stat "3.2M+" — shipments optimized, Fraunces 80px, cyan, left
3. Large stat "99.7%" — fulfillment accuracy, Fraunces 80px, right
4. Large stat "7" — intelligent agents, Fraunces 80px, center-upper
5. Agent type list — "Store · Warehouse · Transport · Supplier · Demand · Planner · Simulation" appearing
6. Brand name — "Cognitive Supply Chain Mesh" in Fraunces 48px, center-bottom
7. Tagline — "Supply Chain. Reimagined." in Space Grotesk 20px, below brand name
8. CTA — "The best supply chain is invisible" fade in last
9. Scene title — "CSCM · Full Mesh" top-left
10. Final exit — entire frame fades to black at t=56.0

**Animation choreography:**
- Network map: EXPANDS IN (scale 0.8→1, opacity 0→1) at t=46.3-47.5
- All lines: GLOW UP (opacity 0.1→0.4) at t=47.0
- Stat "3.2M+": COUNTS UP from 0 or SLIDES from left at t=47.5, ease expo.out
- Stat "99.7%": SLIDES from right at t=48.5, ease expo.out
- Stat "7": SCALES IN (scale 3→1, opacity 0→1) at t=50.0, ease back.out(1.8)
- Agent list: STAGGERED FADE at t=51.0-53.0, each 0.15s apart
- Brand name: FADES in at t=53.0
- Tagline: FADES in at t=54.5
- CTA: FADES in at t=56.0

**Final exit (t=57.0-60.0):**
- All elements FADE to black at t=57.0, duration 2.5s, ease power2.in
- Frame is fully black by t=59.5

## Recurring Motifs

- **Grid lines** — present in every scene as background layer
- **Cyan glow** — accent color used for data emphasis, active paths, status indicators
- **Pulse rings** — used for events: empty shelf, restock trigger, delivery arrival
- **Mono labels** — every scene has a bottom-left scene label in Space Grotesk mono
- **Network nodes** — appear in scenes 3 and 6, connective visual thread
- **Data counters** — animated numbers with tabular-nums throughout

## Negative Prompt

- No gradient text (background-clip: text)
- No left-edge accent stripes on cards
- No pure #000 or #fff — tint toward palette
- No identical card grids
- No centered-and-floating layouts
- No banned fonts (Inter, Roboto, Nunito, etc.)
- No jump cuts between scenes — always crossfade
- No exit animations before transitions (except scene 6)
- No Math.random(), Date.now(), or time-based functions
- No async timeline construction
