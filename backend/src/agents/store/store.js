const fs = require('fs');
const path = require('path');
const messagingLayer = require('../../messaging');
const StoreApiService = require('./services/apiService');
const DemandForecaster = require('./sub-agents/DemandForecaster');
const InventoryOptimizer = require('./sub-agents/InventoryOptimizer');
const StockRecommender = require('./sub-agents/StockRecommender');
const ContinualLearner = require('./sub-agents/ContinualLearner');

class StoreAgent {
  constructor(storeId) {
    this.storeId = storeId;
    this.apiService = new StoreApiService();
    this.demandForecaster = new DemandForecaster(storeId, this.apiService);
    this.inventoryOptimizer = new InventoryOptimizer(storeId, this.apiService);
    this.stockRecommender = new StockRecommender(storeId, this.apiService);
    this.continualLearner = new ContinualLearner(storeId, this.apiService);
    this.state = {
      inventory: {},
      demandForecast: {},
      orders: [],
      lastUpdated: new Date(),
      // Add historical data for ML models
      historicalSales: {},
      productAttributes: {},
      // Add supplier information for restocking recommendations
      suppliers: {},
      // Add restocking history for analysis
      restockingHistory: []
    };
    this.storagePath = path.join(__dirname, '..', '..', '..', 'data', `store_${storeId}_state.json`);
    this.loadState();
  }

  /**
   * Load agent state from local storage
   */
  loadState() {
    try {
      if (fs.existsSync(this.storagePath)) {
        const data = fs.readFileSync(this.storagePath, 'utf8');
        this.state = JSON.parse(data);
        console.log(`Store Agent ${this.storeId}: State loaded successfully`);
      } else {
        console.log(`Store Agent ${this.storeId}: No existing state found, using defaults`);
      }
    } catch (error) {
      console.error(`Store Agent ${this.storeId}: Failed to load state:`, error.message);
    }
  }

  /**
   * Save agent state to local storage
   */
  saveState() {
    try {
      // Ensure data directory exists
      const dataDir = path.dirname(this.storagePath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      fs.writeFileSync(this.storagePath, JSON.stringify(this.state, null, 2));
      console.log(`Store Agent ${this.storeId}: State saved successfully`);
    } catch (error) {
      console.error(`Store Agent ${this.storeId}: Failed to save state:`, error.message);
    }
  }

  /**
   * Initialize the agent and connect to messaging layer
   */
  async initialize() {
    try {
      console.log(`Store Agent ${this.storeId}: Initializing...`);
      
      // Subscribe to relevant topics
      await messagingLayer.subscribeToTopic(
        `inventory.update.${this.storeId}`, 
        this.handleInventoryUpdate.bind(this),
        'kafka'
      );
      
      await messagingLayer.subscribeToTopic(
        `demand.forecast.${this.storeId}`, 
        this.handleDemandForecast.bind(this),
        'kafka'
      );
      
      // Subscribe to sales data updates
      await messagingLayer.subscribeToTopic(
        `sales.data.${this.storeId}`, 
        this.handleSalesData.bind(this),
        'kafka'
      );
      
      // Subscribe to product attribute updates
      await messagingLayer.subscribeToTopic(
        `product.attributes.${this.storeId}`, 
        this.handleProductAttributes.bind(this),
        'kafka'
      );
      
      // Subscribe to supplier information updates
      await messagingLayer.subscribeToTopic(
        `supplier.info.${this.storeId}`, 
        this.handleSupplierInfo.bind(this),
        'kafka'
      );
      
      // Subscribe to restocking response
      await messagingLayer.subscribeToTopic(
        `restock.response.${this.storeId}`, 
        this.handleRestockResponse.bind(this),
        'kafka'
      );
      
      console.log(`Store Agent ${this.storeId}: Initialized successfully`);
    } catch (error) {
      console.error(`Store Agent ${this.storeId}: Initialization failed:`, error.message);
    }
  }

  /**
   * Handle inventory update messages
   */
  async handleInventoryUpdate(topic, message) {
    try {
      console.log(`Store Agent ${this.storeId}: Received inventory update`, message);
      
      // Update local inventory state
      if (message.productId && message.quantity !== undefined) {
        this.state.inventory[message.productId] = {
          ...this.state.inventory[message.productId],
          quantity: message.quantity,
          lastUpdated: new Date()
        };
        
        this.saveState();
      }
    } catch (error) {
      console.error(`Store Agent ${this.storeId}: Failed to handle inventory update:`, error.message);
    }
  }

  /**
   * Handle sales data messages for demand forecasting
   */
  async handleSalesData(topic, message) {
    try {
      console.log(`Store Agent ${this.storeId}: Received sales data`, message);
      
      // Update historical sales data
      if (message.productId && message.sales !== undefined) {
        if (!this.state.historicalSales[message.productId]) {
          this.state.historicalSales[message.productId] = [];
        }
        
        // Add new sales data point
        this.state.historicalSales[message.productId].push({
          date: message.date || new Date().toISOString(),
          sales: message.sales,
          price: message.price,
          promotion: message.promotion
        });
        
        // Keep only last 90 days of data
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        
        this.state.historicalSales[message.productId] = this.state.historicalSales[message.productId]
          .filter(record => new Date(record.date) > ninetyDaysAgo);
        
        this.saveState();
        
        // Trigger demand forecast update
        this.updateDemandForecast(message.productId);
      }
    } catch (error) {
      console.error(`Store Agent ${this.storeId}: Failed to handle sales data:`, error.message);
    }
  }

  /**
   * Handle product attributes messages
   */
  async handleProductAttributes(topic, message) {
    try {
      console.log(`Store Agent ${this.storeId}: Received product attributes`, message);
      
      // Update product attributes
      if (message.productId) {
        this.state.productAttributes[message.productId] = {
          ...message,
          lastUpdated: new Date()
        };
        
        this.saveState();
      }
    } catch (error) {
      console.error(`Store Agent ${this.storeId}: Failed to handle product attributes:`, error.message);
    }
  }

  /**
   * Handle supplier information messages
   */
  async handleSupplierInfo(topic, message) {
    try {
      console.log(`Store Agent ${this.storeId}: Received supplier information`, message);
      
      // Update supplier information
      if (message.supplierId) {
        this.state.suppliers[message.supplierId] = {
          ...message,
          lastUpdated: new Date()
        };
        
        this.saveState();
      }
    } catch (error) {
      console.error(`Store Agent ${this.storeId}: Failed to handle supplier information:`, error.message);
    }
  }

  /**
   * Handle restock response messages
   */
  async handleRestockResponse(topic, message) {
    try {
      console.log(`Store Agent ${this.storeId}: Received restock response`, message);
      
      // Update restocking history
      if (message.productId && message.orderId) {
        this.state.restockingHistory.push({
          ...message,
          receivedDate: new Date().toISOString()
        });
        
        // Keep only last 100 restocking records
        if (this.state.restockingHistory.length > 100) {
          this.state.restockingHistory = this.state.restockingHistory.slice(-100);
        }
        
        this.saveState();
        
        // Update inventory with received quantity
        if (message.receivedQuantity !== undefined) {
          const currentInventory = this.state.inventory[message.productId] || { quantity: 0 };
          this.updateInventory(message.productId, currentInventory.quantity + message.receivedQuantity);
        }
      }
    } catch (error) {
      console.error(`Store Agent ${this.storeId}: Failed to handle restock response:`, error.message);
    }
  }

  /**
   * Handle demand forecast messages
   */
  async handleDemandForecast(topic, message) {
    try {
      console.log(`Store Agent ${this.storeId}: Received demand forecast`, message);
      
      // Update local demand forecast state
      if (message.productId && message.forecast) {
        this.state.demandForecast[message.productId] = {
          ...message.forecast,
          lastUpdated: new Date()
        };
        
        this.saveState();
        
        // Trigger restocking decision logic
        this.makeRestockingDecision(message.productId);
      }
    } catch (error) {
      console.error(`Store Agent ${this.storeId}: Failed to handle demand forecast:`, error.message);
    }
  }

  async updateDemandForecast(productId) {
    try {
      console.log(`Store Agent ${this.storeId}: Updating demand forecast for product ${productId}`);

      const salesData = this.state.historicalSales[productId] || [];

      const forecast = await this.demandForecaster.forecast(productId, salesData, 7);
      if (!forecast) return;

      this.state.demandForecast[productId] = forecast;
      this.saveState();

      messagingLayer.publishMessage(
        `demand.forecast.${this.storeId}`,
        { productId, forecast },
        'kafka'
      );

      console.log(`Store Agent ${this.storeId}: Updated demand forecast for product ${productId}: ${forecast.expectedDemand} units`);
      this.makeRestockingDecision(productId);
    } catch (error) {
      console.error(`Store Agent ${this.storeId}: Failed to update demand forecast:`, error.message);
    }
  }

  async makeRestockingDecision(productId) {
    try {
      const inventory = this.state.inventory[productId] || { quantity: 0 };
      const forecast = this.state.demandForecast[productId];

      if (!forecast) {
        console.log(`Store Agent ${this.storeId}: No forecast available for product ${productId}`);
        return;
      }

      const productAttrs = this.state.productAttributes[productId] || {};
      const currentStock = inventory.quantity || 0;

      const optimizationResult = await this.inventoryOptimizer.optimize(productId, currentStock, forecast, productAttrs, this.state.suppliers);
      const { optimal_quantity, reorder_point, service_level } = optimizationResult;

      if (this.inventoryOptimizer.needsRestock(currentStock, reorder_point)) {
        const recommendation = await this.stockRecommender.recommend(
          productId, optimal_quantity, reorder_point, forecast, productAttrs, this.state.suppliers
        );

        const urgency = this.inventoryOptimizer.urgencyLevel(currentStock, reorder_point);

        console.log(`Store Agent ${this.storeId}: Low stock for product ${productId}. Current: ${currentStock}, Reorder Point: ${reorder_point}. Requesting ${optimal_quantity} units`);

        messagingLayer.publishMessage(
          'inventory.restock.request',
          {
            storeId: this.storeId,
            productId,
            quantity: optimal_quantity,
            urgency,
            forecastPeriod: 7,
            expectedDemand: forecast.expectedDemand,
            safetyStock: forecast.safetyStock,
            serviceLevel: service_level,
            reorderPoint: reorder_point,
            recommendation
          },
          'kafka'
        );
      }
    } catch (error) {
      console.error(`Store Agent ${this.storeId}: Failed to make restocking decision:`, error.message);
    }
  }

  async generateRestockingRecommendation(productId, optimalQuantity, reorderPoint, forecast, productAttrs) {
    try {
      return await this.stockRecommender.recommend(
        productId, optimalQuantity, reorderPoint, forecast, productAttrs, this.state.suppliers
      );
    } catch (error) {
      console.error(`Store Agent ${this.storeId}: Failed to generate restocking recommendation:`, error.message);
      return {
        supplierAnalysis: "Standard supplier",
        adjustedQuantity: optimalQuantity,
        orderTiming: {
          recommendedOrderDate: new Date().toISOString().split('T')[0],
          expectedDeliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        },
        riskAssessment: {
          supplierRisk: "unknown",
          stockoutRisk: "unknown"
        }
      };
    }
  }

  /**
   * Calculate optimal order quantity using enhanced Newsvendor model
   */
  calculateOptimalOrderQuantityWithNewsvendor(productId, forecast, currentStock, holdingCost, shortageCost) {
    try {
      // Extract forecast information
      const expectedDemand = forecast.expectedDemand || 0;
      const safetyStock = forecast.safetyStock || 0;
      
      // Calculate critical ratio (Cu / (Cu + Co))
      const criticalRatio = shortageCost / (shortageCost + holdingCost);
      
      // For this implementation, we'll use a normal distribution approximation
      // In a real implementation with the AI/ML system, we would use the actual 
      // demand distribution from the ML models
      const meanDemand = expectedDemand;
      const stdDev = safetyStock / 2; // Rough approximation based on safety stock
      
      // Calculate optimal order quantity using inverse normal distribution
      const zScore = this.normalCDFInverse(criticalRatio);
      const optimalQuantity = Math.max(0, meanDemand + zScore * stdDev - currentStock);
      
      // Calculate reorder point (lead time demand + safety stock)
      // Assuming 3-day lead time for this example
      const leadTimeDays = 3;
      const dailyDemand = expectedDemand / 7; // 7-day forecast period
      const leadTimeDemand = dailyDemand * leadTimeDays;
      const reorderPoint = leadTimeDemand + safetyStock;
      
      // Calculate service level (probability of not stocking out)
      const serviceLevel = this.normalCDF((reorderPoint - leadTimeDemand) / stdDev);
      
      return {
        optimalQuantity: Math.ceil(optimalQuantity),
        reorderPoint: Math.ceil(reorderPoint),
        serviceLevel: serviceLevel,
        criticalRatio: criticalRatio
      };
    } catch (error) {
      console.error(`Store Agent ${this.storeId}: Failed to calculate optimal order quantity with Newsvendor model:`, error.message);
      // Fallback to simple calculation
      const safetyStock = forecast.safetyStock || 0;
      const expectedDemand = forecast.expectedDemand || 0;
      const requiredQuantity = Math.max(expectedDemand * 1.5 - currentStock, safetyStock * 2);
      
      return {
        optimalQuantity: Math.ceil(requiredQuantity),
        reorderPoint: safetyStock * 2,
        serviceLevel: 0.95, // Assumed service level
        criticalRatio: 0.8 // Assumed critical ratio
      };
    }
  }

  /**
   * Normal cumulative distribution function
   */
  normalCDF(x) {
    return 0.5 * (1 + this.erf(x / Math.sqrt(2)));
  }

  /**
   * Error function approximation
   */
  erf(x) {
    // Save the sign of x
    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x);
    
    // Constants
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;
    
    // A&S formula 7.1.26
    const t = 1.0/(1.0 + p*x);
    const y = 1.0 - (((((a5*t + a4)*t) + a3)*t + a2)*t + a1)*t*Math.exp(-x*x);
    
    return sign*y;
  }

  /**
   * Normal cumulative distribution function inverse (approximation)
   */
  normalCDFInverse(p) {
    if (p < 0 || p > 1) {
      throw new Error("Probability must be between 0 and 1");
    }
    
    if (p === 0) return -Infinity;
    if (p === 1) return Infinity;
    
    // Approximation using Abramowitz and Stegun formula
    const a = [-3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.383577518672690e2, -3.066479806614716e1, 2.506628277459239e0];
    const b = [-5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1, -1.328068155288572e1];
    const c = [-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838e0, -2.549732539343734e0, 4.374664141464968e0, 2.938163982698783e0];
    const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996e0, 3.754408661907416e0];
    
    const p_low = 0.02425;
    const p_high = 1 - p_low;
    
    let q, r;
    
    if (0 < p && p < p_low) {
      q = Math.sqrt(-2 * Math.log(p));
      return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
             ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
    } else if (p_low <= p && p <= p_high) {
      q = p - 0.5;
      r = q * q;
      return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
             (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
    } else if (p_high < p && p < 1) {
      q = Math.sqrt(-2 * Math.log(1 - p));
      return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
              ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
    }
    
    return 0;
  }

  /**
   * Update inventory manually (for testing)
   */
  updateInventory(productId, quantity) {
    try {
      this.state.inventory[productId] = {
        ...this.state.inventory[productId],
        quantity: quantity,
        lastUpdated: new Date()
      };
      
      this.saveState();
      
      // Publish inventory update
      messagingLayer.publishMessage(
        `inventory.update.${this.storeId}`,
        {
          productId: productId,
          quantity: quantity,
          timestamp: new Date().toISOString()
        },
        'kafka'
      );
      
      console.log(`Store Agent ${this.storeId}: Updated inventory for product ${productId} to ${quantity} units`);
    } catch (error) {
      console.error(`Store Agent ${this.storeId}: Failed to update inventory:`, error.message);
    }
  }

  /**
   * Get current agent state
   */
  getState() {
    return {
      storeId: this.storeId,
      ...this.state
    };
  }
}

// If run directly, start the agent
if (require.main === module) {
  const storeId = process.argv[2] || 'default';
  const agent = new StoreAgent(storeId);
  
  // Initialize agent
  agent.initialize().then(() => {
    console.log(`Store Agent ${storeId} is running...`);
    
    // For demo purposes, simulate some inventory updates
    setInterval(() => {
      // Simulate random inventory changes
      const products = ['product_a', 'product_b', 'product_c'];
      const randomProduct = products[Math.floor(Math.random() * products.length)];
      const randomQuantity = Math.floor(Math.random() * 100);
      
      agent.updateInventory(randomProduct, randomQuantity);
    }, 30000); // Every 30 seconds
  });
}

module.exports = StoreAgent;