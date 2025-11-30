import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { User, Trip, TripStatus, UserRole, ChatMessage, RideOffer } from '../types';

interface AppContextType {
  user: User | null;
  passengerBalance: number;
  driverBalance: number;
  appVault: number;
  trips: Trip[];
  rideOffers: RideOffer[];
  login: (role: UserRole, data: Omit<User, 'role'>) => void;
  updateUser: (data: Partial<User>) => void;
  logout: () => void;
  bookTrip: (tripDetails: Omit<Trip, 'id' | 'status' | 'passengerId' | 'driverName' | 'vehicleNo' | 'messages'> & { driverName?: string; vehicleNo?: string }, cost: number, offerId?: number) => boolean;
  publishRide: (offer: Omit<RideOffer, 'id' | 'driverName' | 'driverId' | 'bookedSeats' | 'rating'>) => void;
  updateTripStatus: (tripId: number, status: TripStatus) => void;
  releaseFunds: (tripId: number, cost: number) => void;
  depositToWallet: (amount: number) => void;
  sendMessage: (tripId: number, text: string) => void;
  rateTrip: (tripId: number, rating: number) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [appVault, setAppVault] = useState(0);
  const [trips, setTrips] = useState<Trip[]>([]);
  
  // Marketplace state: Available rides posted by drivers
  const [rideOffers, setRideOffers] = useState<RideOffer[]>([
    // Initial Mock Data for instant results
    {
        id: 101, driverName: 'Tenzin Norbu', driverId: 'mock1', vehicleNo: 'JK-10-B-1234', vehicleType: 'Innova Crysta',
        from: 'Leh', to: 'Srinagar', date: new Date().toISOString().split('T')[0], time: '07:00 AM',
        pricePerSeat: 3500, totalSeats: 6, bookedSeats: [1], rating: 4.8
    },
    {
        id: 102, driverName: 'Stanzin Dorje', driverId: 'mock2', vehicleNo: 'JK-10-A-5678', vehicleType: 'Mahindra Xylo',
        from: 'Leh', to: 'Srinagar', date: new Date().toISOString().split('T')[0], time: '08:30 AM',
        pricePerSeat: 3000, totalSeats: 7, bookedSeats: [], rating: 4.5
    }
  ]);
  
  // Simulated Wallets
  const [passengerBalance, setPassengerBalance] = useState(15000);
  const [driverBalance, setDriverBalance] = useState(2500);

  const login = useCallback((role: UserRole, data: Omit<User, 'role'>) => {
    setUser({ ...data, role });
  }, []);

  const updateUser = useCallback((data: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...data } : null);
  }, []);

  const logout = useCallback(() => setUser(null), []);

  const depositToWallet = useCallback((amount: number) => {
    setPassengerBalance(prev => prev + amount);
  }, []);

  const publishRide = useCallback((offerData: Omit<RideOffer, 'id' | 'driverName' | 'driverId' | 'bookedSeats' | 'rating'>) => {
    if (!user || user.role !== 'owner') return;
    
    const newOffer: RideOffer = {
      id: Date.now(),
      driverName: user.name,
      driverId: user.mobile,
      bookedSeats: [],
      rating: 5.0, // New driver default
      ...offerData
    };
    
    setRideOffers(prev => [newOffer, ...prev]);
  }, [user]);

  const bookTrip = useCallback((tripDetails: Omit<Trip, 'id' | 'status' | 'passengerId' | 'driverName' | 'vehicleNo' | 'messages'> & { driverName?: string; vehicleNo?: string }, cost: number, offerId?: number) => {
    if (passengerBalance >= cost && user) {
      setPassengerBalance(prev => prev - cost);
      setAppVault(prev => prev + cost);
      
      const newTrip: Trip = {
        id: Date.now(),
        ...tripDetails,
        cost,
        status: 'BOOKED',
        passengerId: user.name,
        driverName: tripDetails.driverName || 'Assigned Driver',
        vehicleNo: tripDetails.vehicleNo || 'JK-XX-TEMP',
        messages: [],
        offerId
      };
      
      setTrips(prev => [...prev, newTrip]);

      // If booked from a real offer, update the available seats
      if (offerId) {
        setRideOffers(prev => prev.map(offer => {
            if (offer.id === offerId) {
                return { ...offer, bookedSeats: [...offer.bookedSeats, ...tripDetails.seats] };
            }
            return offer;
        }));
      }

      return true;
    }
    return false;
  }, [passengerBalance, user]);

  const updateTripStatus = useCallback((tripId: number, status: TripStatus) => {
    setTrips(prev => prev.map(t => t.id === tripId ? { ...t, status } : t));
  }, []);

  const rateTrip = useCallback((tripId: number, rating: number) => {
    setTrips(prev => prev.map(t => t.id === tripId ? { ...t, userRating: rating } : t));
  }, []);

  const releaseFunds = useCallback((tripId: number, cost: number) => {
    setAppVault(prev => prev - cost);
    setDriverBalance(prev => prev + cost);
    updateTripStatus(tripId, 'COMPLETED');
  }, [updateTripStatus]);

  const sendMessage = useCallback((tripId: number, text: string) => {
    if (!user) return;
    const newMessage: ChatMessage = {
      id: Date.now().toString() + Math.random().toString(),
      senderId: user.name,
      text,
      timestamp: Date.now()
    };
    setTrips(prev => prev.map(t => t.id === tripId ? 
      { ...t, messages: [...(t.messages || []), newMessage] } : t
    ));
  }, [user]);

  return (
    <AppContext.Provider value={{ 
      user, login, updateUser, logout, 
      passengerBalance, driverBalance, appVault, 
      trips, rideOffers, bookTrip, publishRide, updateTripStatus, releaseFunds, depositToWallet,
      sendMessage, rateTrip
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};