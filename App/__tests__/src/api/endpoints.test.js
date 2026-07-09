import { lookupEndpoint, resolveCall, ENDPOINTS, ROLE_ENDPOINTS } from '../../../src/api/endpoints';

describe('endpoints', () => {
  describe('lookupEndpoint', () => {
    it('returns endpoint for known family+action', () => {
      const ep = lookupEndpoint('STORE', 'demandForecast');
      expect(ep).not.toBeNull();
      expect(ep.path).toBe('/api/v1/demand/forecast');
      expect(ep.method).toBe('POST');
    });

    it('returns null for unknown family', () => {
      expect(lookupEndpoint('NONEXISTENT', 'action')).toBeNull();
    });

    it('returns null for unknown action', () => {
      expect(lookupEndpoint('STORE', 'nonexistent')).toBeNull();
    });

    it('returns all expected families', () => {
      const families = ['STORE', 'WAREHOUSE', 'TRANSPORT', 'SUPPLIER',
        'CUSTOMER_DEMAND', 'CENTRAL_PLANNER', 'SIMULATION', 'AUTH',
        'INVENTORY_CRUD', 'ORDERS', 'SHIPMENTS'];
      families.forEach((f) => {
        expect(ENDPOINTS[f]).toBeDefined();
      });
    });
  });

  describe('resolveCall', () => {
    it('resolves static paths', () => {
      const resolved = resolveCall('STORE', 'demandForecast');
      expect(resolved.path).toBe('/api/v1/demand/forecast');
      expect(resolved.method).toBe('POST');
    });

    it('substitutes path params', () => {
      const resolved = resolveCall('SHIPMENTS', 'get', { shipmentId: 'SHP-001' });
      expect(resolved.path).toBe('/api/v1/shipments/SHP-001');
    });

    it('throws for unknown endpoints', () => {
      expect(() => resolveCall('STORE', 'nope')).toThrow('Unknown endpoint');
    });
  });

  describe('ROLE_ENDPOINTS', () => {
    it('shopkeeper has store, central-planner, inventory, orders, shipments, customer-demand', () => {
      const sk = ROLE_ENDPOINTS.shopkeeper;
      expect(sk.demandForecast).toBeDefined();
      expect(sk.inventoryOptimization).toBeDefined();
      expect(sk.listByStore).toBeDefined();
      expect(sk.create).toBeDefined();
      expect(sk.get).toBeDefined();
    });

    it('transporter has transport, central-planner, shipments', () => {
      const tr = ROLE_ENDPOINTS.transporter;
      expect(tr.routingOptimization).toBeDefined();
      expect(tr.routingEta).toBeDefined();
      expect(tr.coordinationPlan).toBeDefined();
      expect(tr.listByStatus).toBeDefined();
    });

    it('wholesaler has supplier, inventory, orders, shipments', () => {
      const ws = ROLE_ENDPOINTS.wholesaler;
      expect(ws.supplierRiskAssessment).toBeDefined();
      expect(ws.listByStore).toBeDefined();
      expect(ws.listByStatus).toBeDefined();
    });

    it('mesh has central-planner and simulation', () => {
      const mesh = ROLE_ENDPOINTS.mesh;
      expect(mesh.coordinationPlan).toBeDefined();
      expect(mesh.anomalyAlertList).toBeDefined();
      expect(mesh.digitalTwinSimulation).toBeDefined();
    });
  });
});
