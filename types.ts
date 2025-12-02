export type UserRole = 'passenger' | 'owner';

export type TripStatus = 'BOOKED' | 'EN_ROUTE' | 'ARRIVED' | 'COMPLETED';

export interface User {
  uid?: string; // Firebase Auth UID
  name: string;
  mobile: string;
  role: UserRole;
  vehicleNo?: string;
  vehicleType?: string;
  profileImage?: string;
}

export interface VehicleDef {
  type: string;
  rateMultiplier: number;
  seats: number;
  layout: number[]; // e.g., [1, 3, 3] for rows
  image: string;
}

export interface SearchParams {
  from: string;
  to: string;
  date: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: number;
}

export interface RideOffer {
  id: string; // Changed to string for Firestore
  driverName: string;
  driverId: string; // mobile or auth uid
  vehicleNo: string;
  vehicleType: string;
  from: string;
  to: string;
  date: string;
  time: string;
  pricePerSeat: number;
  totalSeats: number;
  bookedSeats: number[]; // Indices of booked seats
  rating: number;
}

export interface Trip {
  id: string; // Changed to string for Firestore
  from: string;
  to: string;
  date: string;
  cost: number;
  status: TripStatus;
  passengerId: string;
  driverName: string;
  vehicleNo: string;
  vehicleType: string;
  seats: number[];
  messages: ChatMessage[];
  offerId?: string; // Changed to string
  userRating?: number;
}

export interface RouteDef {
  id: number;
  from: string;
  to: string;
  dist: string;
}