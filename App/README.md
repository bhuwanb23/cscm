# CSCM - Cognitive Supply Chain Mesh

A React Native mobile application for the Cognitive Supply Chain Mesh system, designed to optimize retail supply chain operations through AI-powered digital twins and decentralized agents.

## Features

### 🔐 Authentication System
- **Role-based Login**: Separate interfaces for Shopkeepers and Transporters
- **Beautiful UI**: Modern, professional login interface with gradient backgrounds
- **Form Validation**: Input validation and error handling
- **Secure Authentication**: JWT-based authentication system

### 🏪 Shopkeeper Dashboard
- **Inventory Management**: Real-time inventory tracking with color-coded status indicators
- **Stock Requisition**: Easy ordering system with priority settings
- **Shipment Tracking**: Real-time delivery monitoring and confirmation
- **Quick Actions**: Fast access to common tasks
- **Alerts & Notifications**: Proactive alerts for low stock and delivery updates

### 🚚 Transporter Dashboard
- **Delivery Management**: Current and completed delivery tracking
- **Route Optimization**: GPS integration for efficient delivery routes
- **Status Updates**: Real-time delivery status management
- **Performance Metrics**: Daily performance statistics
- **Navigation**: Integrated mapping for delivery locations

## Project Structure

```
App/
├── components/           # Reusable UI components
│   └── Header.js        # Navigation header with logout
├── login/               # Authentication system
│   ├── components/
│   │   └── LoginForm.js # Login form component
│   └── login.js         # Main login screen
├── users/               # User-specific dashboards
│   ├── shopkeepers/
│   │   └── shopkeepers.js # Shopkeeper dashboard
│   └── transporters/
│       └── transporter.js # Transporter dashboard
├── App.js              # Main application component
└── package.json        # Dependencies and scripts
```

## Dependencies

- **React Native**: Cross-platform mobile development
- **Expo**: Development platform and tools
- **React Native Paper**: Material Design components
- **Expo Linear Gradient**: Beautiful gradient backgrounds
- **Expo Vector Icons**: Comprehensive icon library

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- Expo CLI
- iOS Simulator or Android Emulator (for testing)

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
1. **Select Role**: Choose between Shopkeeper or Transporter
2. **Enter Credentials**: Provide email and password
3. **Authentication**: System validates credentials and redirects to appropriate dashboard

### Shopkeeper Features
- **View Inventory**: Check current stock levels with color-coded indicators
- **Request Stock**: Order new inventory with priority settings
- **Track Deliveries**: Monitor incoming shipments in real-time
- **Quick Actions**: Fast access to common tasks

### Transporter Features
- **Manage Deliveries**: View current and completed deliveries
- **Update Status**: Real-time delivery status updates
- **Navigation**: GPS integration for efficient routing
- **Performance Tracking**: Monitor daily delivery metrics

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

---

**CSCM - Revolutionizing Supply Chain Management Through AI**
