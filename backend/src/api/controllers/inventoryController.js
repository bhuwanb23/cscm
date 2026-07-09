const InventoryModel = require('../../models/inventoryModel');
const logger = require('../../utils/logger');

async function getByStore(req, res) {
  try {
    const { storeId } = req.params;
    if (!storeId) {
      return res.status(400).json({ success: false, error: 'Store ID is required' });
    }
    const items = await InventoryModel.getByStore(storeId);
    res.json({ success: true, data: items });
  } catch (error) {
    logger.error('Failed to get inventory by store:', error);
    res.status(500).json({ success: false, error: 'Failed to get inventory' });
  }
}

async function getItem(req, res) {
  try {
    const { storeId, productId } = req.params;
    if (!storeId || !productId) {
      return res.status(400).json({ success: false, error: 'Store ID and Product ID are required' });
    }
    const item = await InventoryModel.get(productId, storeId);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Inventory item not found' });
    }
    res.json({ success: true, data: item });
  } catch (error) {
    logger.error('Failed to get inventory item:', error);
    res.status(500).json({ success: false, error: 'Failed to get inventory item' });
  }
}

async function upsert(req, res) {
  try {
    const body = req.body;
    const productId = body.productId || body.product_id;
    const storeId = body.storeId || body.store_id;
    if (!productId || !storeId) {
      return res.status(400).json({ success: false, error: 'Product ID and Store ID are required' });
    }
    const result = await InventoryModel.upsert({
      product_id: productId, store_id: storeId,
      quantity: body.quantity,
      reserved_quantity: body.reserved_quantity || body.reservedQuantity,
      min_stock_level: body.min_stock_level || body.minStockLevel,
      max_stock_level: body.max_stock_level || body.maxStockLevel,
      unit_cost: body.unit_cost || body.unitCost,
      selling_price: body.selling_price || body.sellingPrice
    });
    logger.info(`Inventory upserted: ${productId} at ${storeId}`);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    logger.error('Failed to upsert inventory:', error);
    res.status(500).json({ success: false, error: 'Failed to upsert inventory' });
  }
}

async function updateQuantity(req, res) {
  try {
    const { storeId, productId } = req.params;
    const { quantity } = req.body;
    if (!storeId || !productId) {
      return res.status(400).json({ success: false, error: 'Store ID and Product ID are required' });
    }
    if (typeof quantity !== 'number') {
      return res.status(400).json({ success: false, error: 'Quantity must be a number' });
    }
    const result = await InventoryModel.updateQuantity(productId, storeId, quantity);
    logger.info(`Inventory quantity updated: ${productId} at ${storeId} -> ${quantity}`);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Failed to update inventory quantity:', error);
    res.status(500).json({ success: false, error: 'Failed to update inventory quantity' });
  }
}

module.exports = { getByStore, getItem, upsert, updateQuantity };
