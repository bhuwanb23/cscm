const fs = require('fs');
const path = require('path');
const messagingLayer = require('../messaging');

/**
 * Supplier Agent
 * 
 * This agent manages supplier relationships, lead time tracking,
 * performance monitoring, and risk assessment.
 */

class SupplierAgent {
  constructor(supplierId) {
    this.supplierId = supplierId;
    this.state = {
      supplierInfo: {},
      performanceMetrics: {
        onTimeDeliveryRate: 0,
        qualityScore: 0,
        responsiveness: 0,
        leadTimes: [],
        orderHistory: []
      },
      riskAssessment: {
        overallRisk: 'unknown',
        riskFactors: [],
        lastAssessed: null
      },
      sourcingRecommendations: [],
      lastUpdated: new Date()
    };
    this.storagePath = path.join(__dirname, '..', '..', 'data', `supplier_${supplierId}_state.json`);
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
        console.log(`Supplier Agent ${this.supplierId}: State loaded successfully`);
      } else {
        console.log(`Supplier Agent ${this.supplierId}: No existing state found, using defaults`);
      }
    } catch (error) {
      console.error(`Supplier Agent ${this.supplierId}: Failed to load state:`, error.message);
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
      console.log(`Supplier Agent ${this.supplierId}: State saved successfully`);
    } catch (error) {
      console.error(`Supplier Agent ${this.supplierId}: Failed to save state:`, error.message);
    }
  }

  /**
   * Initialize the agent and connect to messaging layer
   */
  async initialize() {
    try {
      console.log(`Supplier Agent ${this.supplierId}: Initializing...`);
      
      // Subscribe to relevant topics
      await messagingLayer.subscribeToTopic(
        `supplier.performance.update.${this.supplierId}`, 
        this.handlePerformanceUpdate.bind(this),
        'kafka'
      );
      
      await messagingLayer.subscribeToTopic(
        `supplier.order.status.${this.supplierId}`, 
        this.handleOrderStatusUpdate.bind(this),
        'kafka'
      );
      
      await messagingLayer.subscribeToTopic(
        `supplier.risk.assessment.request`, 
        this.handleRiskAssessmentRequest.bind(this),
        'kafka'
      );
      
      console.log(`Supplier Agent ${this.supplierId}: Initialized successfully`);
    } catch (error) {
      console.error(`Supplier Agent ${this.supplierId}: Initialization failed:`, error.message);
    }
  }

  /**
   * Handle supplier performance update messages
   */
  async handlePerformanceUpdate(topic, message) {
    try {
      console.log(`Supplier Agent ${this.supplierId}: Received performance update`, message);
      
      // Update supplier information
      if (message.supplierInfo) {
        this.state.supplierInfo = {
          ...this.state.supplierInfo,
          ...message.supplierInfo,
          lastUpdated: new Date().toISOString()
        };
      }
      
      // Update performance metrics
      if (message.metrics) {
        this.updatePerformanceMetrics(message.metrics);
      }
      
      this.saveState();
      
      // Trigger risk assessment if significant changes occurred
      if (message.triggerRiskAssessment) {
        this.performRiskAssessment();
      }
    } catch (error) {
      console.error(`Supplier Agent ${this.supplierId}: Failed to handle performance update:`, error.message);
    }
  }

  /**
   * Handle order status update messages
   */
  async handleOrderStatusUpdate(topic, message) {
    try {
      console.log(`Supplier Agent ${this.supplierId}: Received order status update`, message);
      
      // Update order history
      if (message.orderId) {
        // Add to order history
        this.state.performanceMetrics.orderHistory.push({
          ...message,
          updatedAt: new Date().toISOString()
        });
        
        // Keep only last 100 orders
        if (this.state.performanceMetrics.orderHistory.length > 100) {
          this.state.performanceMetrics.orderHistory = this.state.performanceMetrics.orderHistory.slice(-100);
        }
        
        // Update lead times if order is completed
        if (message.status === 'completed' && message.orderDate && message.deliveryDate) {
          const orderDate = new Date(message.orderDate);
          const deliveryDate = new Date(message.deliveryDate);
          const leadTimeDays = (deliveryDate - orderDate) / (1000 * 60 * 60 * 24);
          
          this.state.performanceMetrics.leadTimes.push({
            orderId: message.orderId,
            leadTimeDays: leadTimeDays,
            orderDate: message.orderDate,
            deliveryDate: message.deliveryDate,
            recordedAt: new Date().toISOString()
          });
          
          // Keep only last 50 lead times
          if (this.state.performanceMetrics.leadTimes.length > 50) {
            this.state.performanceMetrics.leadTimes = this.state.performanceMetrics.leadTimes.slice(-50);
          }
          
          // Recalculate performance metrics
          this.calculatePerformanceMetrics();
        }
        
        this.saveState();
      }
    } catch (error) {
      console.error(`Supplier Agent ${this.supplierId}: Failed to handle order status update:`, error.message);
    }
  }

  /**
   * Handle risk assessment request messages
   */
  async handleRiskAssessmentRequest(topic, message) {
    try {
      console.log(`Supplier Agent ${this.supplierId}: Received risk assessment request`, message);
      
      // Perform risk assessment
      const riskAssessment = this.performRiskAssessment();
      
      // Publish risk assessment results
      messagingLayer.publishMessage(
        `supplier.risk.assessment.result`,
        {
          supplierId: this.supplierId,
          riskAssessment: riskAssessment,
          timestamp: new Date().toISOString()
        },
        'kafka'
      );
    } catch (error) {
      console.error(`Supplier Agent ${this.supplierId}: Failed to handle risk assessment request:`, error.message);
    }
  }

  /**
   * Update performance metrics
   */
  updatePerformanceMetrics(metrics) {
    try {
      // Update individual metrics
      if (metrics.onTimeDeliveryRate !== undefined) {
        this.state.performanceMetrics.onTimeDeliveryRate = metrics.onTimeDeliveryRate;
      }
      
      if (metrics.qualityScore !== undefined) {
        this.state.performanceMetrics.qualityScore = metrics.qualityScore;
      }
      
      if (metrics.responsiveness !== undefined) {
        this.state.performanceMetrics.responsiveness = metrics.responsiveness;
      }
      
      // Recalculate overall performance score
      this.calculateOverallPerformanceScore();
    } catch (error) {
      console.error(`Supplier Agent ${this.supplierId}: Failed to update performance metrics:`, error.message);
    }
  }

  /**
   * Calculate performance metrics based on order history and lead times
   */
  calculatePerformanceMetrics() {
    try {
      // Calculate on-time delivery rate
      if (this.state.performanceMetrics.orderHistory.length > 0) {
        const completedOrders = this.state.performanceMetrics.orderHistory.filter(order => order.status === 'completed');
        const onTimeOrders = completedOrders.filter(order => {
          if (order.promisedDeliveryDate && order.deliveryDate) {
            return new Date(order.deliveryDate) <= new Date(order.promisedDeliveryDate);
          }
          return true; // Assume on-time if no promised date
        });
        
        this.state.performanceMetrics.onTimeDeliveryRate = completedOrders.length > 0 ? 
          onTimeOrders.length / completedOrders.length : 0;
      }
      
      // Calculate average lead time
      if (this.state.performanceMetrics.leadTimes.length > 0) {
        const totalLeadTime = this.state.performanceMetrics.leadTimes.reduce((sum, record) => sum + record.leadTimeDays, 0);
        const averageLeadTime = totalLeadTime / this.state.performanceMetrics.leadTimes.length;
        
        // Update supplier info with average lead time
        this.state.supplierInfo.averageLeadTime = averageLeadTime;
      }
      
      // Recalculate overall performance score
      this.calculateOverallPerformanceScore();
      
      this.saveState();
    } catch (error) {
      console.error(`Supplier Agent ${this.supplierId}: Failed to calculate performance metrics:`, error.message);
    }
  }

  /**
   * Calculate overall performance score
   */
  calculateOverallPerformanceScore() {
    try {
      // Weighted average of key metrics
      const weights = {
        onTimeDeliveryRate: 0.4,
        qualityScore: 0.3,
        responsiveness: 0.2,
        leadTimeConsistency: 0.1
      };
      
      // Calculate lead time consistency (lower variance = higher score)
      let leadTimeConsistency = 1.0;
      if (this.state.performanceMetrics.leadTimes.length > 1) {
        const leadTimes = this.state.performanceMetrics.leadTimes.map(lt => lt.leadTimeDays);
        const mean = leadTimes.reduce((sum, lt) => sum + lt, 0) / leadTimes.length;
        const variance = leadTimes.reduce((sum, lt) => sum + Math.pow(lt - mean, 2), 0) / leadTimes.length;
        const stdDev = Math.sqrt(variance);
        
        // Normalize consistency score (0-1, where 0 is high variance, 1 is low variance)
        leadTimeConsistency = Math.max(0, 1 - (stdDev / mean));
      }
      
      // Calculate weighted score
      const weightedScore = 
        (this.state.performanceMetrics.onTimeDeliveryRate * weights.onTimeDeliveryRate) +
        (this.state.performanceMetrics.qualityScore * weights.qualityScore) +
        (this.state.performanceMetrics.responsiveness * weights.responsiveness) +
        (leadTimeConsistency * weights.leadTimeConsistency);
      
      this.state.performanceMetrics.overallScore = weightedScore;
    } catch (error) {
      console.error(`Supplier Agent ${this.supplierId}: Failed to calculate overall performance score:`, error.message);
    }
  }

  /**
   * Perform risk assessment using AI/ML models
   */
  performRiskAssessment() {
    try {
      console.log(`Supplier Agent ${this.supplierId}: Performing risk assessment`);
      
      // Gather risk factors using AI/ML models
      const riskFactors = this.identifyRiskFactorsWithML();
      
      // Calculate overall risk score using ML-based approach
      const riskScore = this.calculateRiskScoreWithML(riskFactors);
      
      // Determine risk category
      const overallRisk = this.determineRiskCategory(riskScore);
      
      // Create risk assessment object
      const riskAssessment = {
        supplierId: this.supplierId,
        overallRisk: overallRisk,
        riskScore: riskScore,
        riskFactors: riskFactors,
        assessmentDate: new Date().toISOString(),
        nextAssessmentDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // Next week
      };
      
      // Update state
      this.state.riskAssessment = riskAssessment;
      this.saveState();
      
      // Generate sourcing recommendations if risk is high
      if (overallRisk === 'high') {
        this.generateSourcingRecommendationsWithML();
      }
      
      console.log(`Supplier Agent ${this.supplierId}: Risk assessment completed - Risk Level: ${overallRisk}`);
      return riskAssessment;
    } catch (error) {
      console.error(`Supplier Agent ${this.supplierId}: Failed to perform risk assessment:`, error.message);
      return null;
    }
  }

  /**
   * Identify risk factors using AI/ML models
   */
  identifyRiskFactorsWithML() {
    try {
      const riskFactors = [];
      
      // Use ML models to analyze supplier data and identify risk factors
      // This would interface with the AI/ML risk prediction models
      
      // 1. Use gradient boosted model for supplier risk prediction
      const gbRiskPrediction = this.predictRiskWithGradientBoostedModel();
      
      // 2. Use survival analysis for failure risk prediction
      const survivalRisk = this.predictFailureRiskWithSurvivalAnalysis();
      
      // 3. Use Bayesian networks for causal relationships
      const bayesianRiskFactors = this.analyzeCausalRelationshipsWithBayesianNetworks();
      
      // 4. Use graph embeddings for supplier network analysis
      const networkRisk = this.analyzeSupplierNetworkWithGraphEmbeddings();
      
      // Combine all ML-based risk factors
      riskFactors.push(...gbRiskPrediction, ...survivalRisk, ...bayesianRiskFactors, ...networkRisk);
      
      // Add traditional risk factors as well
      const traditionalRiskFactors = this.identifyTraditionalRiskFactors();
      riskFactors.push(...traditionalRiskFactors);
      
      return riskFactors;
    } catch (error) {
      console.error(`Supplier Agent ${this.supplierId}: Failed to identify risk factors with ML:`, error.message);
      // Fallback to traditional risk factors
      return this.identifyTraditionalRiskFactors();
    }
  }

  /**
   * Identify traditional risk factors (fallback method)
   */
  identifyTraditionalRiskFactors() {
    try {
      const riskFactors = [];
      
      // Delivery performance risk
      if (this.state.performanceMetrics.onTimeDeliveryRate < 0.8) {
        riskFactors.push({
          factor: 'delivery_performance',
          severity: this.state.performanceMetrics.onTimeDeliveryRate < 0.6 ? 'high' : 'medium',
          description: `On-time delivery rate is low: ${(this.state.performanceMetrics.onTimeDeliveryRate * 100).toFixed(1)}%`,
          impact: 'supply_chain_disruption',
          confidence: 0.8
        });
      }
      
      // Lead time variability risk
      if (this.state.performanceMetrics.leadTimes.length > 5) {
        const leadTimes = this.state.performanceMetrics.leadTimes.map(lt => lt.leadTimeDays);
        const mean = leadTimes.reduce((sum, lt) => sum + lt, 0) / leadTimes.length;
        const variance = leadTimes.reduce((sum, lt) => sum + Math.pow(lt - mean, 2), 0) / leadTimes.length;
        const stdDev = Math.sqrt(variance);
        
        if (stdDev > mean * 0.3) { // High variability if std dev > 30% of mean
          riskFactors.push({
            factor: 'lead_time_variability',
            severity: stdDev > mean * 0.5 ? 'high' : 'medium',
            description: `High lead time variability (std dev: ${stdDev.toFixed(1)} days)`,
            impact: 'planning_difficulty',
            confidence: 0.7
          });
        }
      }
      
      // Quality risk
      if (this.state.performanceMetrics.qualityScore < 0.8) {
        riskFactors.push({
          factor: 'quality_issues',
          severity: this.state.performanceMetrics.qualityScore < 0.6 ? 'high' : 'medium',
          description: `Quality score is low: ${(this.state.performanceMetrics.qualityScore * 100).toFixed(1)}%`,
          impact: 'return_costs',
          confidence: 0.85
        });
      }
      
      // Financial stability risk (based on supplier info)
      if (this.state.supplierInfo.financialHealth && this.state.supplierInfo.financialHealth < 0.6) {
        riskFactors.push({
          factor: 'financial_stability',
          severity: this.state.supplierInfo.financialHealth < 0.4 ? 'high' : 'medium',
          description: `Financial health score is low: ${(this.state.supplierInfo.financialHealth * 100).toFixed(1)}%`,
          impact: 'bankruptcy_risk',
          confidence: 0.9
        });
      }
      
      // Geographic risk (based on supplier location)
      if (this.state.supplierInfo.location) {
        // Check for political/economic instability in supplier region
        // This would typically integrate with external risk databases
        const highRiskRegions = ['region_a', 'region_b']; // Simplified for example
        if (highRiskRegions.includes(this.state.supplierInfo.location.region)) {
          riskFactors.push({
            factor: 'geographic_risk',
            severity: 'medium',
            description: `Supplier located in high-risk region: ${this.state.supplierInfo.location.region}`,
            impact: 'disruption_risk',
            confidence: 0.75
          });
        }
      }
      
      return riskFactors;
    } catch (error) {
      console.error(`Supplier Agent ${this.supplierId}: Failed to identify traditional risk factors:`, error.message);
      return [];
    }
  }

  /**
   * Predict risk using gradient boosted model
   */
  predictRiskWithGradientBoostedModel() {
    try {
      // In a real implementation, this would interface with the AI/ML gradient boosted risk predictor
      // For now, we'll simulate the ML prediction based on current data
      
      // Prepare features for the model
      const features = {
        onTimeDeliveryRate: this.state.performanceMetrics.onTimeDeliveryRate,
        qualityScore: this.state.performanceMetrics.qualityScore,
        leadTimeVariability: this.calculateLeadTimeVariability(),
        orderVolume: this.state.performanceMetrics.orderHistory.length,
        supplierAge: this.calculateSupplierAge(),
        financialHealth: this.state.supplierInfo.financialHealth || 0.5,
        geographicRisk: this.state.supplierInfo.location ? this.calculateGeographicRisk() : 0.5
      };
      
      // Simulate ML prediction (in reality, this would call the actual model)
      const riskProbability = this.simulateGradientBoostedPrediction(features);
      
      // Convert probability to risk factors
      const riskFactors = [];
      
      if (riskProbability > 0.7) {
        riskFactors.push({
          factor: 'ml_predicted_risk',
          severity: 'high',
          description: `ML model predicts high risk (${(riskProbability * 100).toFixed(1)}%)`,
          impact: 'overall_supply_chain_risk',
          confidence: 0.9,
          model: 'gradient_boosted'
        });
      } else if (riskProbability > 0.4) {
        riskFactors.push({
          factor: 'ml_predicted_risk',
          severity: 'medium',
          description: `ML model predicts medium risk (${(riskProbability * 100).toFixed(1)}%)`,
          impact: 'moderate_supply_chain_risk',
          confidence: 0.85,
          model: 'gradient_boosted'
        });
      }
      
      return riskFactors;
    } catch (error) {
      console.error(`Supplier Agent ${this.supplierId}: Failed to predict risk with gradient boosted model:`, error.message);
      return [];
    }
  }

  /**
   * Predict failure risk using survival analysis
   */
  predictFailureRiskWithSurvivalAnalysis() {
    try {
      // In a real implementation, this would interface with the AI/ML survival analysis models
      // For now, we'll simulate the prediction
      
      // Calculate supplier tenure and performance consistency
      const supplierAge = this.calculateSupplierAge();
      const performanceConsistency = this.calculatePerformanceConsistency();
      
      // Simulate survival analysis prediction
      const failureProbability = this.simulateSurvivalAnalysisPrediction(supplierAge, performanceConsistency);
      
      // Convert to risk factors
      const riskFactors = [];
      
      if (failureProbability > 0.6) {
        riskFactors.push({
          factor: 'survival_analysis_risk',
          severity: 'high',
          description: `Survival analysis predicts high failure risk (${(failureProbability * 100).toFixed(1)}%)`,
          impact: 'supplier_bankruptcy_or_exit',
          confidence: 0.85,
          model: 'survival_analysis'
        });
      } else if (failureProbability > 0.3) {
        riskFactors.push({
          factor: 'survival_analysis_risk',
          severity: 'medium',
          description: `Survival analysis predicts medium failure risk (${(failureProbability * 100).toFixed(1)}%)`,
          impact: 'potential_supplier_issues',
          confidence: 0.8,
          model: 'survival_analysis'
        });
      }
      
      return riskFactors;
    } catch (error) {
      console.error(`Supplier Agent ${this.supplierId}: Failed to predict failure risk with survival analysis:`, error.message);
      return [];
    }
  }

  /**
   * Analyze causal relationships with Bayesian networks
   */
  analyzeCausalRelationshipsWithBayesianNetworks() {
    try {
      // In a real implementation, this would interface with the AI/ML Bayesian network models
      // For now, we'll simulate the analysis
      
      // Analyze relationships between different performance metrics
      const causalFactors = this.identifyCausalRelationships();
      
      // Convert to risk factors
      const riskFactors = [];
      
      causalFactors.forEach(factor => {
        riskFactors.push({
          factor: `causal_factor_${factor.name}`,
          severity: factor.riskLevel,
          description: factor.description,
          impact: factor.impact,
          confidence: factor.confidence,
          model: 'bayesian_network'
        });
      });
      
      return riskFactors;
    } catch (error) {
      console.error(`Supplier Agent ${this.supplierId}: Failed to analyze causal relationships with Bayesian networks:`, error.message);
      return [];
    }
  }

  /**
   * Analyze supplier network with graph embeddings
   */
  analyzeSupplierNetworkWithGraphEmbeddings() {
    try {
      // In a real implementation, this would interface with the AI/ML graph embedding models
      // For now, we'll simulate the analysis
      
      // Analyze supplier's position in the supply network
      const networkMetrics = this.calculateNetworkMetrics();
      
      // Convert to risk factors
      const riskFactors = [];
      
      if (networkMetrics.centrality < 0.3) {
        riskFactors.push({
          factor: 'network_isolation',
          severity: 'medium',
          description: 'Supplier has low network centrality, indicating limited connections',
          impact: 'information_flow_risk',
          confidence: 0.7,
          model: 'graph_embeddings'
        });
      }
      
      if (networkMetrics.clusteringCoefficient < 0.4) {
        riskFactors.push({
          factor: 'network_fragmentation',
          severity: 'medium',
          description: 'Supplier belongs to poorly connected network cluster',
          impact: 'collaboration_risk',
          confidence: 0.65,
          model: 'graph_embeddings'
        });
      }
      
      return riskFactors;
    } catch (error) {
      console.error(`Supplier Agent ${this.supplierId}: Failed to analyze supplier network with graph embeddings:`, error.message);
      return [];
    }
  }

  /**
   * Calculate risk score using ML-based approach
   */
  calculateRiskScoreWithML(riskFactors) {
    try {
      if (riskFactors.length === 0) return 0.1; // Low baseline risk
      
      // Use ML ensemble approach to calculate risk score
      // Weight risk factors by model confidence and severity
      
      const severityWeights = {
        low: 0.3,
        medium: 0.6,
        high: 1.0
      };
      
      // Calculate weighted risk score with ML confidence weighting
      let totalWeightedRisk = 0;
      let totalConfidenceWeight = 0;
      
      riskFactors.forEach(factor => {
        const severityWeight = severityWeights[factor.severity] || 0.5;
        const confidenceWeight = factor.confidence || 0.5;
        const combinedWeight = severityWeight * confidenceWeight;
        
        totalWeightedRisk += combinedWeight;
        totalConfidenceWeight += confidenceWeight;
      });
      
      // Normalize to 0-1 scale
      const riskScore = totalConfidenceWeight > 0 ? totalWeightedRisk / totalConfidenceWeight : 0.1;
      
      return Math.min(1.0, riskScore);
    } catch (error) {
      console.error(`Supplier Agent ${this.supplierId}: Failed to calculate risk score with ML:`, error.message);
      return 0.5; // Default medium risk
    }
  }

  /**
   * Generate sourcing recommendations using ML models
   */
  generateSourcingRecommendationsWithML() {
    try {
      console.log(`Supplier Agent ${this.supplierId}: Generating sourcing recommendations with ML`);
      
      // In a real implementation, this would interface with the AI/ML backup recommendation models
      // For now, we'll enhance the basic recommendations with ML insights
      
      // 1. Use ML to identify similar suppliers with better risk profiles
      const similarSuppliers = this.findSimilarSuppliersWithML();
      
      // 2. Use ML to predict the impact of switching suppliers
      const impactPredictions = this.predictSwitchingImpactWithML(similarSuppliers);
      
      // 3. Generate enhanced recommendations
      const recommendations = this.createEnhancedRecommendations(similarSuppliers, impactPredictions);
      
      // Update state
      this.state.sourcingRecommendations = recommendations;
      this.saveState();
      
      // Publish recommendations
      messagingLayer.publishMessage(
        `supplier.sourcing.recommendations.${this.supplierId}`,
        {
          supplierId: this.supplierId,
          recommendations: recommendations,
          timestamp: new Date().toISOString()
        },
        'kafka'
      );
      
      console.log(`Supplier Agent ${this.supplierId}: Generated ${recommendations.length} ML-enhanced sourcing recommendations`);
      return recommendations;
    } catch (error) {
      console.error(`Supplier Agent ${this.supplierId}: Failed to generate sourcing recommendations with ML:`, error.message);
      // Fallback to basic recommendations
      return this.generateSourcingRecommendations();
    }
  }

  /**
   * Helper methods for ML-based risk assessment
   */

  calculateLeadTimeVariability() {
    try {
      if (this.state.performanceMetrics.leadTimes.length < 2) return 0;
      
      const leadTimes = this.state.performanceMetrics.leadTimes.map(lt => lt.leadTimeDays);
      const mean = leadTimes.reduce((sum, lt) => sum + lt, 0) / leadTimes.length;
      const variance = leadTimes.reduce((sum, lt) => sum + Math.pow(lt - mean, 2), 0) / leadTimes.length;
      return Math.sqrt(variance); // Standard deviation
    } catch (error) {
      console.error(`Supplier Agent ${this.supplierId}: Failed to calculate lead time variability:`, error.message);
      return 0;
    }
  }

  calculateSupplierAge() {
    try {
      if (!this.state.supplierInfo.registrationDate) return 0;
      
      const registrationDate = new Date(this.state.supplierInfo.registrationDate);
      const currentDate = new Date();
      const ageInDays = (currentDate - registrationDate) / (1000 * 60 * 60 * 24);
      return ageInDays / 365; // Age in years
    } catch (error) {
      console.error(`Supplier Agent ${this.supplierId}: Failed to calculate supplier age:`, error.message);
      return 0;
    }
  }

  calculateGeographicRisk() {
    try {
      // Simplified geographic risk calculation
      // In reality, this would integrate with external geopolitical risk databases
      return 0.5; // Neutral risk as default
    } catch (error) {
      console.error(`Supplier Agent ${this.supplierId}: Failed to calculate geographic risk:`, error.message);
      return 0.5;
    }
  }

  calculatePerformanceConsistency() {
    try {
      // Calculate consistency based on performance metrics over time
      const recentMetrics = this.state.performanceMetrics.orderHistory.slice(-20); // Last 20 orders
      if (recentMetrics.length < 5) return 0.5; // Neutral consistency
      
      // Calculate variance in delivery times
      const deliveryTimes = recentMetrics
        .filter(order => order.deliveryDate && order.orderDate)
        .map(order => {
          const orderDate = new Date(order.orderDate);
          const deliveryDate = new Date(order.deliveryDate);
          return (deliveryDate - orderDate) / (1000 * 60 * 60 * 24); // Days
        });
      
      if (deliveryTimes.length < 3) return 0.5;
      
      const mean = deliveryTimes.reduce((sum, time) => sum + time, 0) / deliveryTimes.length;
      const variance = deliveryTimes.reduce((sum, time) => sum + Math.pow(time - mean, 2), 0) / deliveryTimes.length;
      const stdDev = Math.sqrt(variance);
      
      // Consistency score: lower std dev = higher consistency (0-1 scale)
      return Math.max(0, 1 - (stdDev / mean));
    } catch (error) {
      console.error(`Supplier Agent ${this.supplierId}: Failed to calculate performance consistency:`, error.message);
      return 0.5;
    }
  }

  simulateGradientBoostedPrediction(features) {
    try {
      // Simplified simulation of gradient boosted model prediction
      // In reality, this would call the actual ML model
      
      // Weighted combination of features
      const weightedSum = 
        (features.onTimeDeliveryRate * -0.3) + // Lower delivery rate increases risk
        (features.qualityScore * -0.2) + // Lower quality increases risk
        (features.leadTimeVariability * 0.25) + // Higher variability increases risk
        (features.supplierAge * -0.1) + // Younger suppliers may be riskier
        ((1 - features.financialHealth) * 0.3) + // Lower financial health increases risk
        (features.geographicRisk * 0.2); // Higher geographic risk increases risk
      
      // Sigmoid function to convert to probability
      const probability = 1 / (1 + Math.exp(-weightedSum));
      
      return probability;
    } catch (error) {
      console.error(`Supplier Agent ${this.supplierId}: Failed to simulate gradient boosted prediction:`, error.message);
      return 0.5; // Neutral probability
    }
  }

  simulateSurvivalAnalysisPrediction(supplierAge, performanceConsistency) {
    try {
      // Simplified simulation of survival analysis prediction
      // In reality, this would call the actual ML model
      
      // Combination of age and consistency factors
      const riskScore = 
        (1 / (1 + supplierAge)) * 0.4 + // Younger suppliers are riskier
        (1 - performanceConsistency) * 0.6; // Lower consistency increases risk
      
      return Math.min(1.0, riskScore);
    } catch (error) {
      console.error(`Supplier Agent ${this.supplierId}: Failed to simulate survival analysis prediction:`, error.message);
      return 0.5; // Neutral probability
    }
  }

  identifyCausalRelationships() {
    try {
      // Simplified identification of causal relationships
      // In reality, this would use Bayesian network analysis
      
      const relationships = [];
      
      // Relationship between delivery performance and quality
      if (this.state.performanceMetrics.onTimeDeliveryRate < 0.7 && 
          this.state.performanceMetrics.qualityScore < 0.7) {
        relationships.push({
          name: 'delivery_quality_correlation',
          riskLevel: 'high',
          description: 'Poor delivery performance correlates with quality issues',
          impact: 'systemic_supplier_problems',
          confidence: 0.8
        });
      }
      
      // Relationship between lead time variability and order volume
      const leadTimeVar = this.calculateLeadTimeVariability();
      if (leadTimeVar > 5 && this.state.performanceMetrics.orderHistory.length > 50) {
        relationships.push({
          name: 'volume_complexity_risk',
          riskLevel: 'medium',
          description: 'High order volume with high lead time variability suggests capacity issues',
          impact: 'scaling_risk',
          confidence: 0.7
        });
      }
      
      return relationships;
    } catch (error) {
      console.error(`Supplier Agent ${this.supplierId}: Failed to identify causal relationships:`, error.message);
      return [];
    }
  }

  calculateNetworkMetrics() {
    try {
      // Simplified network metrics calculation
      // In reality, this would use graph embedding analysis
      
      return {
        centrality: 0.6, // Simulated centrality score
        clusteringCoefficient: 0.5, // Simulated clustering coefficient
        betweenness: 0.4, // Simulated betweenness score
        degree: 8 // Simulated degree (number of connections)
      };
    } catch (error) {
      console.error(`Supplier Agent ${this.supplierId}: Failed to calculate network metrics:`, error.message);
      return {
        centrality: 0.5,
        clusteringCoefficient: 0.5,
        betweenness: 0.5,
        degree: 5
      };
    }
  }

  findSimilarSuppliersWithML() {
    try {
      // Simulated ML-based supplier similarity search
      // In reality, this would use actual ML models
      
      return [
        {
          supplierId: 'backup_supplier_1',
          similarityScore: 0.85,
          riskProfile: 'low',
          capabilities: ['sku_a', 'sku_b'],
          leadTime: 5
        },
        {
          supplierId: 'backup_supplier_2',
          similarityScore: 0.78,
          riskProfile: 'medium',
          capabilities: ['sku_b', 'sku_c'],
          leadTime: 7
        }
      ];
    } catch (error) {
      console.error(`Supplier Agent ${this.supplierId}: Failed to find similar suppliers with ML:`, error.message);
      return [];
    }
  }

  predictSwitchingImpactWithML(similarSuppliers) {
    try {
      // Simulated ML-based impact prediction
      // In reality, this would use actual ML models
      
      return similarSuppliers.map(supplier => ({
        supplierId: supplier.supplierId,
        costImpact: Math.random() * 0.2 - 0.1, // -10% to +10% cost change
        qualityImpact: Math.random() * 0.15 - 0.05, // -5% to +10% quality change
        leadTimeImpact: Math.random() * 0.3 - 0.1 // -10% to +20% lead time change
      }));
    } catch (error) {
      console.error(`Supplier Agent ${this.supplierId}: Failed to predict switching impact with ML:`, error.message);
      return [];
    }
  }

  createEnhancedRecommendations(similarSuppliers, impactPredictions) {
    try {
      // Create enhanced recommendations based on ML insights
      
      const recommendations = [
        {
          type: 'backup_supplier',
          priority: 'high',
          description: 'Identify and qualify backup suppliers using ML similarity analysis',
          actionItems: [
            `Evaluate ${similarSuppliers.length} ML-identified similar suppliers`,
            'Validate quality and capability of backup suppliers',
            'Negotiate contracts with top 2 backup suppliers'
          ],
          timeline: '45 days',
          mlInsights: {
            similarSuppliersCount: similarSuppliers.length,
            avgSimilarityScore: similarSuppliers.reduce((sum, s) => sum + s.similarityScore, 0) / similarSuppliers.length
          }
        },
        {
          type: 'inventory_buffer',
          priority: 'medium',
          description: 'Adjust safety stock levels based on ML-predicted switching impact',
          actionItems: [
            'Recalculate safety stock using impact predictions',
            'Adjust inventory policies for critical SKUs',
            'Monitor inventory turnover and adjust as needed'
          ],
          timeline: '30 days',
          mlInsights: {
            predictedCostImpact: impactPredictions.reduce((sum, p) => sum + p.costImpact, 0) / impactPredictions.length,
            predictedLeadTimeImpact: impactPredictions.reduce((sum, p) => sum + p.leadTimeImpact, 0) / impactPredictions.length
          }
        },
        {
          type: 'contract_review',
          priority: 'high',
          description: 'Review contract terms with ML-identified risk factors',
          actionItems: [
            'Add penalty clauses based on identified risk factors',
            'Include quality guarantees tied to ML predictions',
            'Establish flexible exit strategies'
          ],
          timeline: '60 days',
          mlInsights: {
            riskFactorsCount: this.state.riskAssessment.riskFactors.length,
            highRiskFactors: this.state.riskAssessment.riskFactors.filter(f => f.severity === 'high').length
          }
        }
      ];
      
      return recommendations;
    } catch (error) {
      console.error(`Supplier Agent ${this.supplierId}: Failed to create enhanced recommendations:`, error.message);
      // Fallback to basic recommendations
      return this.generateSourcingRecommendations();
    }
  }

  /**
   * Generate sourcing recommendations for high-risk suppliers
   */
  generateSourcingRecommendations() {
    try {
      console.log(`Supplier Agent ${this.supplierId}: Generating sourcing recommendations`);
      
      // In a real implementation, this would interface with the AI/ML models
      // to find alternative suppliers with similar capabilities but lower risk
      
      // For now, we'll generate some basic recommendations
      const recommendations = [
        {
          type: 'backup_supplier',
          priority: 'high',
          description: 'Identify backup suppliers for critical SKUs',
          actionItems: [
            'Research alternative suppliers in low-risk regions',
            'Validate quality and capability of backup suppliers',
            'Negotiate contracts with backup suppliers'
          ],
          timeline: '30 days'
        },
        {
          type: 'inventory_buffer',
          priority: 'medium',
          description: 'Increase safety stock for items sourced from this supplier',
          actionItems: [
            'Calculate increased safety stock levels',
            'Adjust inventory policies',
            'Monitor inventory turnover'
          ],
          timeline: '15 days'
        },
        {
          type: 'contract_review',
          priority: 'high',
          description: 'Review contract terms for risk mitigation clauses',
          actionItems: [
            'Add penalty clauses for late delivery',
            'Include quality guarantees',
            'Establish exit strategies'
          ],
          timeline: '45 days'
        }
      ];
      
      // Update state
      this.state.sourcingRecommendations = recommendations;
      this.saveState();
      
      // Publish recommendations
      messagingLayer.publishMessage(
        `supplier.sourcing.recommendations.${this.supplierId}`,
        {
          supplierId: this.supplierId,
          recommendations: recommendations,
          timestamp: new Date().toISOString()
        },
        'kafka'
      );
      
      console.log(`Supplier Agent ${this.supplierId}: Generated ${recommendations.length} sourcing recommendations`);
      return recommendations;
    } catch (error) {
      console.error(`Supplier Agent ${this.supplierId}: Failed to generate sourcing recommendations:`, error.message);
      return [];
    }
  }

  /**
   * Determine risk category based on risk score
   */
  determineRiskCategory(riskScore) {
    try {
      if (riskScore < 0.3) return 'low';
      if (riskScore < 0.7) return 'medium';
      return 'high';
    } catch (error) {
      console.error(`Supplier Agent ${this.supplierId}: Failed to determine risk category:`, error.message);
      return 'unknown';
    }
  }

  /**
   * Get current agent state
   */
  getState() {
    return {
      supplierId: this.supplierId,
      ...this.state
    };
  }
}

// If run directly, start the agent
if (require.main === module) {
  const supplierId = process.argv[2] || 'default';
  const agent = new SupplierAgent(supplierId);
  
  // Initialize agent
  agent.initialize().then(() => {
    console.log(`Supplier Agent ${supplierId} is running...`);
  });
}

module.exports = SupplierAgent;