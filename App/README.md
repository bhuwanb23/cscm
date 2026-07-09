# CSCM - Cognitive Supply Chain Mesh

A React Native mobile application for the Cognitive Supply Chain Mesh system, designed to optimize retail supply chain operations through AI-powered digital twins and decentralized agents.

## Features

### 🔐 Role-based Login (Demo)
- **3-role picker**: Shopkeeper, Transporter, Wholesaler — each with dedicated shell, navigation, and screens
- **Demo-first**: No real auth; each role has hardcoded IDs and seeded mock data
- **Mesh Console**: Role-agnostic mesh-level views (alerts, knowledge graph, drift, network) accessible from any role's bottom nav

### 🏪 Shopkeeper (7 screens)
- **Dashboard**: Stock levels, active shipments, alerts, quick actions, KPI cards
- **Inventory**: Real-time tracking with color-coded status indicators
- **Stock Requisition**: Ordering system with priority settings
- **Shipments**: Incoming delivery tracking and confirmation
- **Analysis**: Demand forecast, inventory optimization, anomaly detection
- **Communication**: Alerts, notifications, channel activity
- **Profile**: Business info, stats, shop settings

### 🚚 Transporter (4 screens)
- **Dashboard**: Active deliveries, alerts, KPIs, quick stats
- **Tasks**: Current/completed delivery list with search, filter, task completion
- **Navigation**: Map-based routing with stops and ETAs
- **Profile**: Driver info, vehicle stats, performance metrics

### 🏭 Wholesaler (5 screens)
- **Dashboard**: Order summaries, inventory overview, supplier recommendations
- **Inventory**: Multi-warehouse stock levels
- **Orders**: Purchase orders, order history
- **Shipments**: In-transit and delivered shipment tracking
- **Profile**: Business info, distribution stats

### 📊 Mesh Console (4 sub-views)
- **Alerts**: Cross-role anomaly alerts from CENTRAL_PLANNER
- **Knowledge Graph**: Entity-relationship visualization (CENTRAL_PLANNER.kgQuery)
- **Drift**: Model drift monitoring (CENTRAL_PLANNER.driftCheck)
- **Network**: Supply chain network topology

## Project Structure

```
App/
├── src/                  # Shared application layer
│   ├── api/              # API client, endpoints, hooks
│   │   ├── config.js         # Backend URL resolution (EXPO_PUBLIC_* env vars)
│   │   ├── apiClient.js      # fetch wrapper with AbortController, timeouts
│   │   ├── endpoints.js      # 69-endpoint catalog across 11 families
│   │   ├── useApiQuery.js    # Single-query React hook
│   │   ├── useApiQueries.js  # Parallel-query React hook
│   │   └── ApiProvider.js    # Context + HealthGate (green/red screen)
│   ├── components/       # Shared UI components
│   │   ├── Header.js,
│   │   ├── LoadingScreen.js,
│   │   ├── ErrorScreen.js,
│   │   └── DemoChip.js       # Yellow "Demo data" badge
│   ├── demo/             # Centralized mock data (22+ exports, role-prefixed)
│   ├── utils/            # Shared utilities (parsePrice, etc.)
│   └── theme/            # Design tokens, status meta
├── login/                # 3-role picker (Shopkeeper / Transporter / Wholesaler)
│   ├── components/
│   │   └── LoginForm.js
│   └── login.js
├── users/                # Role-specific screens
│   ├── shopkeepers/  (7 screens)
│   ├── transporters/  (4 screens)
│   ├── wholesalers/   (5 screens)
│   └── mesh/          (4 sub-views)
├── App.js               # Root: ApiProvider → HealthGate → role router
└── package.json
```

## Dependencies

- **React Native 0.81.5** / **React 19.1.0**: Core framework
- **Expo SDK 54.0.13**: Development platform
- **React Native Paper 5.14.5**: Material Design 3 components
- **Expo Linear Gradient**: Gradient backgrounds
- **Expo Vector Icons**: Icon library
- **Expo Constants**: Backend URL resolution (hostUri → LAN IP) — see `src/api/config.js`

## Getting Started

### Prerequisites
- Node.js 18+
- Expo CLI (installed via `npx expo`)
- iOS Simulator or Android Emulator (for testing), or Expo Go on a physical device

### Installation

1. **Install dependencies:**
   ```bash
   cd App
   npm install
   ```

2. **Start the development server:**
   ```bash
   npx expo start
   ```

3. **Run on device/simulator:**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app on physical device

## Usage

### Login Process
1. **Select Role**: Choose Shopkeeper, Transporter, or Wholesaler
2. **Enter Credentials**: Provide email and password (demo mode accepts any input)
3. **Authentication**: Real auth deferred — app navigates directly to the chosen role's shell
4. **Mesh Console**: Accessible via the bottom nav from any role

### Shopkeeper Screens
- **Dashboard**: KPI cards (revenue, active orders, low stock alerts), quick actions, recent shipments
- **Inventory**: Searchable list with color-coded status, detail view per SKU
- **Stock Request**: Place orders with priority, AI-powered recommendations
- **Shipments**: Incoming deliveries grouped by status
- **Analysis**: Demand forecast, inventory optimization, anomaly detection results
- **Communication**: Alerts list, channel activity
- **Profile**: Business info, shop settings, monthly stats

### Transporter Screens
- **Dashboard**: Active deliveries, quick stats (stops, distance, packages), alerts
- **Tasks**: Filterable delivery list with search; tap to mark completed (optimistic update + PATCH)
- **Navigation**: Route progress bar, stop-by-stop directions, upcoming stops
- **Profile**: Driver info, vehicle stats, delivery history

### Wholesaler Screens
- **Dashboard**: Order summaries, low-stock inventory, supplier recommendations
- **Inventory**: Multi-warehouse stock levels with reorder alerts
- **Orders**: Purchase order list, order history
- **Shipments**: In-transit and delivered shipment tracking
- **Profile**: Business info, distribution network stats

### Mesh Console Sub-views
- **Alerts**: Centralized anomaly alerts from `CENTRAL_PLANNER.anomalyAlertList`
- **Graph**: Knowledge graph entity-relationship explorer (skipped — no endpoints yet)
- **Drift**: ML model drift monitoring (skipped)
- **Network**: Supply chain node topology explorer (skipped)

## Design Philosophy

### User-Centric Design
- **Mobile-First**: Optimized for mobile devices and field operations
- **Intuitive Navigation**: Simple, logical user flows
- **Real-Time Updates**: Live data synchronization across all platforms
- **Offline Capability**: Core functionality works without internet connection

### Professional Aesthetics
- **Modern UI**: Clean, professional interface design
- **Consistent Branding**: Unified color scheme and typography
- **Responsive Layout**: Adapts to different screen sizes
- **Accessibility**: Screen reader support and high contrast options

## Technical Features

### State Management
- React hooks for local state management
- Context API for global state (user authentication)
- Efficient re-rendering with proper state updates

### Performance Optimization
- Lazy loading for large datasets
- Image optimization and caching
- Efficient list rendering with proper keys
- Background sync for offline functionality

### Security
- Role-based access control
- Secure authentication tokens
- Input validation and sanitization
- Encrypted data transmission

## Future Enhancements

### Planned Features
- **Push Notifications**: Real-time alerts and updates
- **Barcode Scanning**: QR code and barcode scanning for inventory
- **Offline Sync**: Advanced offline data synchronization
- **Analytics Dashboard**: Advanced reporting and analytics
- **Multi-Store Support**: Support for chain store management

### Integration Points
- **ERP Systems**: Integration with existing enterprise systems
- **WMS Platforms**: Warehouse management system connectivity
- **GPS Services**: Advanced mapping and routing
- **AI Services**: Machine learning integration for predictions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is part of the Cognitive Supply Chain Mesh (CSCM) system and is proprietary software.

## Support

For technical support or questions about the CSCM system, please contact the development team.

## Windows / PowerShell Quirks

This project is developed on Windows with PowerShell 5.1. A few sharp edges to be aware of:

- **No `&&`**: Use `if ($?) { cmd }` to chain dependent commands.
- **No `VAR=value cmd`**: Use `$env:VAR = "value"` before the command.
- **`git commit -m` and paths**: A `/` inside the message is interpreted as a path separator by PowerShell. Use double quotes and avoid backslashes at the end of the string.
- **`Start-Process` lifecycle**: A child process spawned with `Start-Process` dies when the spawning shell exits. Start, test, and stop must be in the *same* shell block.
- **`cd` + `;`**: Changing directory with `cd` via `;` chaining does not actually change the working directory for subsequent commands when using the workdir parameter. Use the tool's `workdir` parameter instead.

---

**CSCM - Revolutionizing Supply Chain Management Through AI**
