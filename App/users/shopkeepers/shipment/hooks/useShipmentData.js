import { useState, useEffect } from 'react';
import { SHIPMENT_CONSTANTS } from '../constants';

export const useShipmentData = () => {
  const [shipments, setShipments] = useState(SHIPMENT_CONSTANTS.SAMPLE_SHIPMENTS);
  const [activeFilter, setActiveFilter] = useState('active');
  const [isMapViewEnabled, setIsMapViewEnabled] = useState(true);
  const [recentDeliveries, setRecentDeliveries] = useState(SHIPMENT_CONSTANTS.RECENT_DELIVERIES);

  const filteredShipments = shipments.filter(shipment => {
    switch (activeFilter) {
      case 'active':
        return ['in_transit', 'arriving_soon', 'out_for_delivery'].includes(shipment.status);
      case 'delivered':
        return shipment.status === 'delivered';
      case 'delayed':
        return shipment.status === 'delayed';
      default:
        return true;
    }
  });

  const getStatusStyle = (status) => {
    switch (status) {
      case 'in_transit':
        return SHIPMENT_CONSTANTS.SHIPMENT_STATUS.IN_TRANSIT;
      case 'arriving_soon':
        return SHIPMENT_CONSTANTS.SHIPMENT_STATUS.ARRIVING_SOON;
      case 'delayed':
        return SHIPMENT_CONSTANTS.SHIPMENT_STATUS.DELAYED;
      case 'out_for_delivery':
        return SHIPMENT_CONSTANTS.SHIPMENT_STATUS.OUT_FOR_DELIVERY;
      case 'delivered':
        return SHIPMENT_CONSTANTS.SHIPMENT_STATUS.DELIVERED;
      default:
        return SHIPMENT_CONSTANTS.SHIPMENT_STATUS.IN_TRANSIT;
    }
  };

  const updateShipmentStatus = (shipmentId, newStatus) => {
    setShipments(prevShipments =>
      prevShipments.map(shipment =>
        shipment.id === shipmentId ? { ...shipment, status: newStatus } : shipment
      )
    );
  };

  const confirmDelivery = (shipmentId) => {
    updateShipmentStatus(shipmentId, 'delivered');
  };

  return {
    shipments: filteredShipments,
    activeFilter,
    setActiveFilter,
    isMapViewEnabled,
    setIsMapViewEnabled,
    recentDeliveries,
    getStatusStyle,
    updateShipmentStatus,
    confirmDelivery,
  };
};
