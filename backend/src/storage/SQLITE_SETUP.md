# SQLite Local Data Storage Setup Guide

This guide explains how to set up and use SQLite for local data storage in the CSCM backend.

## Overview

SQLite is a lightweight, file-based database that's perfect for local development and testing. It provides a simple way to persist data without requiring a separate database server.

## Installation

SQLite support is already included in the project dependencies. If you need to reinstall:

```bash
npm install sqlite3
```

## Database Structure

The SQLite database includes the following tables:

### Inventory Table
Stores product inventory information for each store.

Columns:
- `id`: Primary key
- `product_id`: Product identifier
- `store_id`: Store identifier
- `quantity`: Current stock quantity
- `reserved_quantity`: Quantity reserved for pending orders
- `min_stock_level`: Minimum stock threshold
- `max_stock_level`: Maximum stock threshold
- `unit_cost`: Cost per unit
- `selling_price`: Selling price per unit
- `last_updated`: Timestamp of last update

### Orders Table
Stores customer order information.

Columns:
- `id`: Primary key
- `order_id`: Unique order identifier
- `store_id`: Store identifier
- `customer_id`: Customer identifier
- `total_amount`: Total order amount
- `status`: Order status (pending, confirmed, shipped, delivered, cancelled)
- `created_at`: Timestamp when order was created
- `updated_at`: Timestamp of last update

### Order Items Table
Stores individual items within orders.

Columns:
- `id`: Primary key
- `order_id`: Reference to order
- `product_id`: Product identifier
- `quantity`: Quantity ordered
- `unit_price`: Price per unit
- `total_price`: Total price for this item

### Shipments Table
Stores shipment information.

Columns:
- `id`: Primary key
- `shipment_id`: Unique shipment identifier
- `order_id`: Reference to order (optional)
- `from_location`: Origin location
- `to_location`: Destination location
- `status`: Shipment status (pending, shipped, in_transit, delivered, cancelled)
- `carrier`: Shipping carrier
- `tracking_number`: Carrier tracking number
- `estimated_delivery`: Expected delivery date
- `actual_delivery`: Actual delivery date
- `created_at`: Timestamp when shipment was created
- `updated_at`: Timestamp of last update

### Shipment Items Table
Stores individual items within shipments.

Columns:
- `id`: Primary key
- `shipment_id`: Reference to shipment
- `product_id`: Product identifier
- `quantity`: Quantity shipped

## Usage

### Initializing the Database

The database is automatically initialized when the application starts:

```javascript
const dataAccessLayer = require('./storage/dataAccessLayer');

await dataAccessLayer.initialize();
```

### Creating Records

Create inventory items:
```javascript
const inventoryItem = await dataAccessLayer.upsertInventory({
  product_id: 'PRODUCT-001',
  store_id: 'STORE-001',
  quantity: 100,
  reserved_quantity: 10,
  min_stock_level: 20,
  max_stock_level: 200,
  unit_cost: 15.50,
  selling_price: 25.99
});
```

Create orders:
```javascript
const order = await dataAccessLayer.createOrder({
  order_id: 'ORDER-001',
  store_id: 'STORE-001',
  customer_id: 'CUSTOMER-001',
  total_amount: 129.95,
  status: 'confirmed'
});
```

Create shipments:
```javascript
const shipment = await dataAccessLayer.createShipment({
  shipment_id: 'SHIPMENT-001',
  order_id: 'ORDER-001',
  from_location: 'WAREHOUSE-001',
  to_location: 'STORE-001',
  status: 'shipped',
  carrier: 'FedEx',
  tracking_number: '1234567890'
});
```

### Querying Records

Get inventory by store:
```javascript
const inventoryItems = await dataAccessLayer.getInventoryByStore('STORE-001');
```

Get shipments by status:
```javascript
const shipments = await dataAccessLayer.getShipmentsByStatus('shipped');
```

### Updating Records

Update shipment status:
```javascript
const updatedShipment = await dataAccessLayer.updateShipmentStatus(
  'SHIPMENT-001', 
  'delivered', 
  { actual_delivery: new Date().toISOString() }
);
```

## Testing

Run the SQLite test suite:

```bash
npm run test-sqlite
```

This will verify that all database operations work correctly.

## File Location

The SQLite database file is stored at:
```
data/cscm_local.db
```

This location is relative to the backend root directory.

## Troubleshooting

### Database Lock Issues

If you encounter database locking issues, ensure that:
1. Only one process is accessing the database at a time
2. All database connections are properly closed
3. The application has write permissions to the data directory

### Missing Tables

If you encounter missing table errors:
1. Delete the existing database file: `data/cscm_local.db`
2. Restart the application to recreate the database with all tables

## Best Practices

1. Always use the data access layer for database operations
2. Handle database errors gracefully
3. Close database connections when shutting down the application
4. Use transactions for operations that modify multiple records
5. Regularly backup the database file in production environments