const fs = require('fs');
const path = require('path');
const messagingLayer = require('../../messaging');
const CustomerDemandApiService = require('./services/apiService');

/**
 * Customer Demand Agent
 * 
 * This agent senses demand from multiple sources, analyzes trends,
 * and models promotional impacts using advanced AI/ML models.
 */
class CustomerDemandAgent {
  constructor() {
    this.state = {
      demandSignals: {},
      trendAnalysis: {},
      promotionalEffects: {},
      customerSegments: {},
      externalFactors: {},
      lastUpdated: new Date()
    };
    this.storagePath = path.join(__dirname, '..', '..', '..', 'data', 'customer_demand_state.json');
    this.loadState();
    this.apiService = new CustomerDemandApiService();
  }

  /**
   * Load agent state from local storage
   */
  loadState() {
    try {
      if (fs.existsSync(this.storagePath)) {
        const data = fs.readFileSync(this.storagePath, 'utf8');
        this.state = JSON.parse(data);
        console.log('Customer Demand Agent: State loaded successfully');
      } else {
        console.log('Customer Demand Agent: No existing state found, using defaults');
      }
    } catch (error) {
      console.error('Customer Demand Agent: Failed to load state:', error.message);
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
      console.log('Customer Demand Agent: State saved successfully');
    } catch (error) {
      console.error('Customer Demand Agent: Failed to save state:', error.message);
    }
  }

  /**
   * Initialize the agent and connect to messaging layer
   */
  async initialize() {
    try {
      console.log('Customer Demand Agent: Initializing...');
      
      // Subscribe to sales data from multiple sources
      await messagingLayer.subscribeToTopic(
        'sales.data.*', 
        this.handleSalesData.bind(this),
        'kafka'
      );
      
      // Subscribe to external signals (weather, events, etc.)
      await messagingLayer.subscribeToTopic(
        'external.signals.*', 
        this.handleExternalSignals.bind(this),
        'kafka'
      );
      
      // Subscribe to promotional events
      await messagingLayer.subscribeToTopic(
        'promotions.active.*', 
        this.handlePromotions.bind(this),
        'kafka'
      );
      
      // Subscribe to customer behavior data
      await messagingLayer.subscribeToTopic(
        'customer.behavior.*', 
        this.handleCustomerBehavior.bind(this),
        'kafka'
      );
      
      // Subscribe to market research data
      await messagingLayer.subscribeToTopic(
        'market.research.*', 
        this.handleMarketResearch.bind(this),
        'kafka'
      );
      
      console.log('Customer Demand Agent: Initialized successfully');
    } catch (error) {
      console.error('Customer Demand Agent: Initialization failed:', error.message);
    }
  }

  /**
   * Handle sales data from multiple sources
   */
  async handleSalesData(topic, message) {
    try {
      console.log('Customer Demand Agent: Received sales data', message);
      
      // Update demand signals
      const { storeId, productId, sales, timestamp, source } = message;
      
      if (!this.state.demandSignals[storeId]) {
        this.state.demandSignals[storeId] = {};
      }
      
      if (!this.state.demandSignals[storeId][productId]) {
        this.state.demandSignals[storeId][productId] = [];
      }
      
      // Add new sales data point
      this.state.demandSignals[storeId][productId].push({
        sales,
        timestamp: timestamp || new Date().toISOString(),
        source
      });
      
      // Keep only last 90 days of data
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      
      this.state.demandSignals[storeId][productId] = this.state.demandSignals[storeId][productId]
        .filter(record => new Date(record.timestamp) > ninetyDaysAgo);
      
      this.saveState();
      
      // Trigger trend analysis
      this.analyzeTrends(storeId, productId);
      
    } catch (error) {
      console.error('Customer Demand Agent: Failed to handle sales data:', error.message);
    }
  }

  /**
   * Handle external signals (weather, events, economic indicators)
   */
  async handleExternalSignals(topic, message) {
    try {
      console.log('Customer Demand Agent: Received external signals', message);
      
      const { signalType, data, timestamp, location } = message;
      
      if (!this.state.externalFactors[signalType]) {
        this.state.externalFactors[signalType] = [];
      }
      
      // Add new external factor data
      this.state.externalFactors[signalType].push({
        data,
        timestamp: timestamp || new Date().toISOString(),
        location
      });
      
      this.saveState();
      
    } catch (error) {
      console.error('Customer Demand Agent: Failed to handle external signals:', error.message);
    }
  }

  /**
   * Handle promotional events
   */
  async handlePromotions(topic, message) {
    try {
      console.log('Customer Demand Agent: Received promotional data', message);
      
      const { promotionId, storeId, productId, discount, startDate, endDate, type } = message;
      
      if (!this.state.promotionalEffects[promotionId]) {
        this.state.promotionalEffects[promotionId] = {};
      }
      
      this.state.promotionalEffects[promotionId] = {
        storeId,
        productId,
        discount,
        startDate,
        endDate,
        type,
        createdAt: new Date().toISOString()
      };
      
      this.saveState();
      
      // Trigger promotional impact analysis
      this.analyzePromotionalImpact(promotionId);
      
    } catch (error) {
      console.error('Customer Demand Agent: Failed to handle promotions:', error.message);
    }
  }

  /**
   * Handle customer behavior data
   */
  async handleCustomerBehavior(topic, message) {
    try {
      console.log('Customer Demand Agent: Received customer behavior data', message);
      
      const { customerId, storeId, actions, timestamp } = message;
      
      // Update customer segments based on behavior
      await this.segmentCustomers(customerId, actions);
      
      this.saveState();
      
    } catch (error) {
      console.error('Customer Demand Agent: Failed to handle customer behavior:', error.message);
    }
  }

  /**
   * Handle market research data
   */
  async handleMarketResearch(topic, message) {
    try {
      console.log('Customer Demand Agent: Received market research data', message);
      
      // Store market research data for trend analysis
      // In a real implementation, this would be used to adjust forecasts
      
      this.saveState();
      
    } catch (error) {
      console.error('Customer Demand Agent: Failed to handle market research:', error.message);
    }
  }

  /**
   * Analyze demand trends using AI/ML models
   */
  async analyzeTrends(storeId, productId) {
    try {
      console.log(`Customer Demand Agent: Analyzing trends for store ${storeId}, product ${productId}`);

      const salesData = this.state.demandSignals[storeId]?.[productId] || [];
      if (salesData.length < 10) {
        console.log('Customer Demand Agent: Not enough data for trend analysis');
        return;
      }

      // Try AI/ML API for demand forecasting, fall back to inline simulation
      let trendAnalysis;
      try {
        const requestData = {
          store_id: storeId,
          product_id: productId,
          sales_data: salesData,
          forecast_days: 7
        };
        const result = await this.apiService.demandForecast(requestData);
        trendAnalysis = {
          trendDirection: result.trend || 'stable',
          trendPercentage: result.trend_percentage !== undefined ? result.trend_percentage : 0,
          recentAverage: result.recent_average !== undefined ? result.recent_average : 0,
          confidence: result.confidence || 0.5
        };
      } catch (apiError) {
        console.warn(`Customer Demand Agent: AI/ML API unavailable, using inline simulation: ${apiError.message}`);

        // Inline fallback
        const recentData = salesData.slice(-30);
        const olderData = salesData.slice(-60, -30);
        const recentAverage = recentData.reduce((sum, record) => sum + record.sales, 0) / recentData.length;
        const olderAverage = olderData.reduce((sum, record) => sum + record.sales, 0) / olderData.length;
        const trendPercentage = ((recentAverage - olderAverage) / olderAverage) * 100;
        let trendDirection = 'stable';
        if (trendPercentage > 5) trendDirection = 'increasing';
        else if (trendPercentage < -5) trendDirection = 'decreasing';
        trendAnalysis = {
          trendDirection,
          trendPercentage: parseFloat(trendPercentage.toFixed(2)),
          recentAverage: parseFloat(recentAverage.toFixed(2)),
          confidence: Math.min(0.9, salesData.length / 100)
        };
      }

      // Store trend analysis
      if (!this.state.trendAnalysis[storeId]) {
        this.state.trendAnalysis[storeId] = {};
      }
      this.state.trendAnalysis[storeId][productId] = {
        ...trendAnalysis,
        lastAnalyzed: new Date().toISOString()
      };

      this.saveState();

      // Publish trend analysis results
      messagingLayer.publishMessage(
        `demand.trend.analysis.${storeId}.${productId}`,
        this.state.trendAnalysis[storeId][productId],
        'kafka'
      );

      console.log(`Customer Demand Agent: Trend analysis complete for ${storeId}-${productId}: ${trendAnalysis.trendDirection} (${trendAnalysis.trendPercentage}%)`);
    } catch (error) {
      console.error('Customer Demand Agent: Failed to analyze trends:', error.message);
    }
  }

  /**
   * Analyze promotional impact using causal inference models
   */
  async analyzePromotionalImpact(promotionId) {
    try {
      console.log(`Customer Demand Agent: Analyzing promotional impact for ${promotionId}`);

      const promotion = this.state.promotionalEffects[promotionId];
      if (!promotion) {
        console.log(`Customer Demand Agent: Promotion ${promotionId} not found`);
        return;
      }

      const { storeId, productId, discount } = promotion;

      // Get sales data during promotion period
      const salesData = this.state.demandSignals[storeId]?.[productId] || [];
      if (salesData.length < 5) {
        console.log('Customer Demand Agent: Not enough data for promotional impact analysis');
        return;
      }

      // Try AI/ML API for causal inference, fall back to inline simulation
      let analysis;
      try {
        const requestData = {
          promotion_id: promotionId,
          store_id: storeId,
          product_id: productId,
          discount: discount,
          sales_data: salesData
        };
        const result = await this.apiService.causalInference(requestData);
        const liftPct = result.treatment_effect !== undefined ? result.treatment_effect * 100 : 0;
        analysis = {
          baselineSales: result.baseline_sales || 0,
          promotionSales: result.promotion_sales || 0,
          liftPercentage: parseFloat(liftPct.toFixed(2)),
          estimatedROI: result.roi !== undefined ? result.roi : 0,
          confidence: result.confidence || 0.5
        };
      } catch (apiError) {
        console.warn(`Customer Demand Agent: AI/ML API unavailable, using inline simulation: ${apiError.message}`);

        // Inline fallback
        const baselineSales = salesData
          .slice(0, Math.floor(salesData.length / 2))
          .reduce((sum, record) => sum + record.sales, 0) / Math.floor(salesData.length / 2);
        const promotionSales = salesData
          .slice(Math.floor(salesData.length / 2))
          .reduce((sum, record) => sum + record.sales, 0) / Math.floor(salesData.length / 2);
        const liftPercentage = ((promotionSales - baselineSales) / baselineSales) * 100;
        analysis = {
          baselineSales: parseFloat(baselineSales.toFixed(2)),
          promotionSales: parseFloat(promotionSales.toFixed(2)),
          liftPercentage: parseFloat(liftPercentage.toFixed(2)),
          estimatedROI: parseFloat((liftPercentage / (discount * 100)).toFixed(2)),
          confidence: 0.8
        };
      }

      // Store promotional analysis
      this.state.promotionalEffects[promotionId].analysis = {
        ...analysis,
        lastAnalyzed: new Date().toISOString()
      };

      this.saveState();

      // Publish promotional analysis results
      messagingLayer.publishMessage(
        `promotion.analysis.${promotionId}`,
        this.state.promotionalEffects[promotionId].analysis,
        'kafka'
      );

      console.log(`Customer Demand Agent: Promotional impact analysis complete for ${promotionId}: ${analysis.liftPercentage}% lift`);
    } catch (error) {
      console.error('Customer Demand Agent: Failed to analyze promotional impact:', error.message);
    }
  }

  /**
   * Segment customers based on behavior using ML models
   */
  async segmentCustomers(customerId, actions) {
    try {
      console.log(`Customer Demand Agent: Segmenting customer ${customerId}`);

      // Count different types of actions
      const viewCount = actions.filter(action => action.type === 'view').length;
      const addToCartCount = actions.filter(action => action.type === 'addToCart').length;
      const purchaseCount = actions.filter(action => action.type === 'purchase').length;

      // Try AI/ML API for NLP-based segmentation, fall back to rule-based
      let segment, metrics;
      try {
        const requestData = {
          customer_id: customerId,
          actions: actions,
          action_summary: { views: viewCount, cartAdds: addToCartCount, purchases: purchaseCount }
        };
        const result = await this.apiService.naturalLanguageProcessing(requestData);
        segment = result.segment || result.intent || 'casual';
        metrics = {
          views: viewCount,
          cartAdds: addToCartCount,
          purchases: purchaseCount
        };
      } catch (apiError) {
        console.warn(`Customer Demand Agent: AI/ML API unavailable, using rule-based fallback: ${apiError.message}`);

        // Rule-based fallback
        if (purchaseCount > 3 && addToCartCount > 5) {
          segment = 'loyal';
        } else if (purchaseCount > 1 && addToCartCount > 2) {
          segment = 'engaged';
        } else if (viewCount > 10) {
          segment = 'browsing';
        } else {
          segment = 'casual';
        }
        metrics = {
          views: viewCount,
          cartAdds: addToCartCount,
          purchases: purchaseCount
        };
      }

      // Store customer segment
      this.state.customerSegments[customerId] = {
        segment,
        metrics,
        lastSegmented: new Date().toISOString()
      };

      // Publish customer segmentation
      messagingLayer.publishMessage(
        `customer.segment.${customerId}`,
        this.state.customerSegments[customerId],
        'kafka'
      );

      console.log(`Customer Demand Agent: Customer ${customerId} segmented as ${segment}`);
    } catch (error) {
      console.error('Customer Demand Agent: Failed to segment customer:', error.message);
    }
  }

  /**
   * Get current agent state
   */
  getState() {
    return {
      ...this.state
    };
  }
}

// If run directly, start the agent
if (require.main === module) {
  const agent = new CustomerDemandAgent();
  
  // Initialize agent
  agent.initialize().then(() => {
    console.log('Customer Demand Agent is running...');
    
    // For demo purposes, simulate some sales data
    setInterval(() => {
      // Simulate random sales data
      const storeIds = ['STORE-1', 'STORE-2'];
      const productIds = ['product_a', 'product_b', 'product_c'];
      
      const randomStoreId = storeIds[Math.floor(Math.random() * storeIds.length)];
      const randomProductId = productIds[Math.floor(Math.random() * productIds.length)];
      const randomSales = Math.floor(Math.random() * 50) + 10; // 10-60 units
      const sources = ['pos', 'online', 'mobile'];
      const randomSource = sources[Math.floor(Math.random() * sources.length)];
      
      messagingLayer.publishMessage(
        `sales.data.${randomStoreId}`,
        {
          storeId: randomStoreId,
          productId: randomProductId,
          sales: randomSales,
          source: randomSource
        },
        'kafka'
      );
    }, 30000); // Every 30 seconds
  });
}

module.exports = CustomerDemandAgent;