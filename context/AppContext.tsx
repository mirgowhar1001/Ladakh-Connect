import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, Trip, TripStatus, UserRole, ChatMessage, RideOffer } from '../types';
import { db, auth } from '../firebase';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  where, 
  doc, 
  updateDoc, 
  setDoc,
  getDoc,
  arrayUnion,
  orderBy
} from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';

interface AppContextType {
  user: User | null;
  passengerBalance: number;
  driverBalance: number;
  appVault: number;
  trips: Trip[];
  rideOffers: RideOffer[];
  login: (role: UserRole, data: Omit<User, 'role'>) => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
  logout: () => Promise<void>;
  bookTrip: (tripDetails: Omit<Trip, 'id' | 'status' | 'passengerId' | 'driverName' | 'vehicleNo' | 'messages'> & { driverName?: string; vehicleNo?: string }, cost: number, offerId?: string) => Promise<boolean>;
  publishRide: (offer: Omit<RideOffer, 'id' | 'driverName' | 'driverId' | 'bookedSeats' | 'rating'>) => Promise<void>;
  updateTripStatus: (tripId: string, status: TripStatus) => Promise<void>;
  releaseFunds: (tripId: string, cost: number) => Promise<void>;
  depositToWallet: (amount: number) => void;
  sendMessage: (tripId: string, text: string) => Promise<void>;
  rateTrip: (tripId: string, rating: number) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [appVault, setAppVault] = useState(0);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [rideOffers, setRideOffers] = useState<RideOffer[]>([]);
  
  // Simulated Wallets (In a real app, these would be in Firestore 'wallets' collection)
  const [passengerBalance, setPassengerBalance] = useState(15000);
  const [driverBalance, setDriverBalance] = useState(2500);

  // 1. Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Fetch user details from Firestore
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            setUser({ ...userDoc.data(), uid: firebaseUser.uid } as User);
          } else {
             // Basic fallback if doc doesn't exist yet (e.g. during sign up flow)
             setUser({ uid: firebaseUser.uid, name: firebaseUser.displayName || '', mobile: '', role: 'passenger' });
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      } else {
        setUser(null);
        setTrips([]);
        setRideOffers([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Real-time Data Listeners
  useEffect(() => {
    // Only subscribe to data if user is logged in to avoid Permission Denied errors 
    // when security rules require authentication.
    if (!user) return;

    // Listen to Ride Offers
    const offersQuery = query(collection(db, 'rideOffers'));
    const unsubOffers = onSnapshot(offersQuery, 
      (snapshot) => {
        const offers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RideOffer));
        setRideOffers(offers);
      },
      (error) => {
        console.warn("Permission denied for RideOffers. Check Firestore Rules in Console.", error.message);
      }
    );

    // Listen to Trips
    const tripsQuery = query(collection(db, 'trips'));
    const unsubTrips = onSnapshot(tripsQuery, 
      (snapshot) => {
        const tripsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Trip));
        setTrips(tripsData);
      },
      (error) => {
        console.warn("Permission denied for Trips. Check Firestore Rules in Console.", error.message);
      }
    );

    return () => {
      unsubOffers();
      unsubTrips();
    };
  }, [user]); // Re-run when user logs in/out

  const login = useCallback(async (role: UserRole, data: Omit<User, 'role'>) => {
    if (!auth.currentUser) return;
    
    const newUser: User = { 
        ...data, 
        role, 
        uid: auth.currentUser.uid 
    };
    
    // Save user to Firestore
    await setDoc(doc(db, 'users', auth.currentUser.uid), newUser, { merge: true });
    setUser(newUser);
  }, []);

  const updateUser = useCallback(async (data: Partial<User>) => {
    if (!user || !user.uid) return;
    
    await updateDoc(doc(db, 'users', user.uid), data);
    setUser(prev => prev ? { ...prev, ...data } : null);
  }, [user]);

  const logout = useCallback(async () => {
    await signOut(auth);
    setUser(null);
  }, []);

  const depositToWallet = useCallback((amount: number) => {
    setPassengerBalance(prev => prev + amount);
  }, []);

  const publishRide = useCallback(async (offerData: Omit<RideOffer, 'id' | 'driverName' | 'driverId' | 'bookedSeats' | 'rating'>) => {
    if (!user || user.role !== 'owner') return;
    
    const newOffer = {
      driverName: user.name,
      driverId: user.uid || user.mobile,
      bookedSeats: [],
      rating: 5.0,
      ...offerData
    };
    
    await addDoc(collection(db, 'rideOffers'), newOffer);
  }, [user]);

  const bookTrip = useCallback(async (tripDetails: Omit<Trip, 'id' | 'status' | 'passengerId' | 'driverName' | 'vehicleNo' | 'messages'> & { driverName?: string; vehicleNo?: string }, cost: number, offerId?: string) => {
    if (passengerBalance >= cost && user) {
      setPassengerBalance(prev => prev - cost);
      setAppVault(prev => prev + cost);
      
      const newTrip = {
        ...tripDetails,
        cost,
        status: 'BOOKED',
        passengerId: user.name,
        passengerUid: user.uid,
        driverName: tripDetails.driverName || 'Assigned Driver',
        vehicleNo: tripDetails.vehicleNo || 'JK-XX-TEMP',
        messages: [],
        offerId: offerId || null,
        createdAt: Date.now()
      };
      
      await addDoc(collection(db, 'trips'), newTrip);

      // If booked from a real offer, update the available seats in Firestore
      if (offerId) {
        const offerRef = doc(db, 'rideOffers', offerId);
        // We need to fetch current booked seats first or use arrayUnion if strict
        // Simple update for now:
        const currentOffer = rideOffers.find(o => o.id === offerId);
        if (currentOffer) {
            await updateDoc(offerRef, {
                bookedSeats: [...currentOffer.bookedSeats, ...tripDetails.seats]
            });
        }
      }
      return true;
    }
    return false;
  }, [passengerBalance, user, rideOffers]);

  const updateTripStatus = useCallback(async (tripId: string, status: TripStatus) => {
    const tripRef = doc(db, 'trips', tripId);
    await updateDoc(tripRef, { status });
  }, []);

  const rateTrip = useCallback(async (tripId: string, rating: number) => {
    const tripRef = doc(db, 'trips', tripId);
    await updateDoc(tripRef, { userRating: rating });
  }, []);

  const releaseFunds = useCallback(async (tripId: string, cost: number) => {
    setAppVault(prev => prev - cost);
    setDriverBalance(prev => prev + cost);
    await updateTripStatus(tripId, 'COMPLETED');
  }, [updateTripStatus]);

  const sendMessage = useCallback(async (tripId: string, text: string) => {
    if (!user) return;
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      senderId: user.name,
      text,
      timestamp: Date.now()
    };
    
    const tripRef = doc(db, 'trips', tripId);
    await updateDoc(tripRef, {
        messages: arrayUnion(newMessage)
    });
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