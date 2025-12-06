const decisionModels = require('../../ml/decisionModels');

describe('Decision Models Tests', () => {
  test('should generate simple forecast', () => {
    const historicalData = [10, 20, 30, 40, 50];
    const forecast = decisionModels.simpleForecast(historicalData, 3);
    
    expect(forecast).toHaveLength(3);
    expect(forecast.every(val => typeof val === 'number')).toBe(true);
  });

  test('should assess risk correctly', () => {
    const features = {
      inventoryLevel: 5,
      demandRate: 150,
      leadTime: 15,
      supplierReliability: 0.7
    };
    
    const risk = decisionModels.assessRisk(features);
    
    expect(['low', 'medium', 'high']).toContain(risk);
  });

  test('should optimize price', () => {
    const optimalPrice = decisionModels.optimizePrice(100, 1.2, 90);
    
    expect(typeof optimalPrice).toBe('number');
    expect(optimalPrice).toBeGreaterThan(0);
  });

  test('should segment customers', () => {
    const customers = [
      {
        id: 'CUSTOMER-1',
        purchaseFrequency: 15,
        averagePurchaseValue: 150
      },
      {
        id: 'CUSTOMER-2',
        purchaseFrequency: 3,
        averagePurchaseValue: 30
      }
    ];
    
    const segmented = decisionModels.segmentCustomers(customers);
    
    expect(segmented).toHaveLength(2);
    expect(segmented[0].segment).toBeDefined();
    expect(segmented[1].segment).toBeDefined();
  });

  test('should detect anomalies', () => {
    const data = [10, 12, 11, 13, 100, 12, 11]; // 100 is an anomaly
    const anomalies = decisionModels.detectAnomalies(data);
    
    expect(Array.isArray(anomalies)).toBe(true);
  });
});