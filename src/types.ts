export type RideCategory = 'eco' | 'comfort' | 'suv' | 'island_tour';

export interface LocationPoint {
  id: string;
  name: string;
  region: string;
  description?: string;
  isPopular?: boolean;
}

export interface RideRequest {
  pickup: LocationPoint;
  dropoff: LocationPoint;
  category: RideCategory;
  passengerCount: number;
  promoCode?: string;
  tipUSD: number;
  paymentMethod: 'cash' | 'card' | 'apple_pay' | 'local_pay';
}

export interface Driver {
  id: string;
  name: string;
  rating: number;
  ridesCount: number;
  carModel: string;
  carColor: string;
  licensePlate: string;
  photoUrl: string;
  phone: string;
  lat: number;
  lng: number;
}

export interface ChatMessage {
  id: string;
  sender: 'passenger' | 'driver' | 'system';
  text: string;
  timestamp: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
}
