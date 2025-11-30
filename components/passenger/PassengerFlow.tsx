import React, { useState, useMemo, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { SearchParams, VehicleDef, RideOffer } from '../../types';
import { VEHICLES, BASE_RATES, CITIES, DESTINATION_IMAGES } from '../../constants';
import { Header } from '../common/Header';
import { ChatScreen } from '../common/ChatScreen';
import { DatePicker } from '../common/DatePicker';
import { 
  Navigation, Calendar, Search, Wallet, User, 
  Car, ShieldCheck, MapPin, CheckCircle, LogOut, Info,
  MessageCircle, ArrowRightLeft, Star, Fuel, CreditCard, Plus, X,
  Filter, SlidersHorizontal, Download, FileText, Clock, ChevronDown, ChevronUp, Gift, Briefcase, Heart, Key, Mail, Phone, Edit3, ChevronRight, Camera
} from 'lucide-react';

type ViewState = 'search' | 'results' | 'seats' | 'vault_pay' | 'history' | 'chat' | 'profile';

// --- UTILS ---

const downloadDocument = (type: 'Ticket' | 'Invoice', tripDetails: any) => {
  const content = `
    LADAKH CONNECT - ${type.toUpperCase()}
    -------------------------------------
    Date: ${new Date().toDateString()}
    Trip ID: #${tripDetails.id}
    
    Passenger: ${tripDetails.passengerId}
    Driver: ${tripDetails.driverName}
    Vehicle: ${tripDetails.vehicleType} (${tripDetails.vehicleNo})
    
    Route: ${tripDetails.from} -> ${tripDetails.to}
    Travel Date: ${tripDetails.date}
    
    Seats: ${tripDetails.seats.join(', ')}
    Total Amount: ₹${tripDetails.cost}
    Payment Status: ${type === 'Invoice' ? 'PAID (Funds Released)' : 'PAID (Held in Vault)'}
    
    -------------------------------------
    Thank you for choosing Ladakh Connect.
    Safe Travels!
  `;

  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `LadakhConnect_${type}_${tripDetails.id}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// --- VISUAL ASSETS & SUB-COMPONENTS ---

// 1. Realistic Seat Component (SVG)
const RealSeat = ({ status, seatNum, onClick }: { status: 'available' | 'selected' | 'driver' | 'booked', seatNum?: number, onClick?: () => void }) => {
  const isDriver = status === 'driver';
  const isBooked = status === 'booked';
  const isSelected = status === 'selected';
  
  // Colors for Beige Leather Look
  const baseColor = isDriver ? '#4a4a4a' : isBooked ? '#d1d5db' : isSelected ? '#22c55e' : 'url(#leatherGradient)'; 
  const strokeColor = isDriver ? '#2d2d2d' : isBooked ? '#9ca3af' : isSelected ? '#16a34a' : '#C7B299';
  const textColor = isSelected ? 'white' : isBooked ? '#9ca3af' : '#8B735B';

  return (
    <div 
      onClick={!isDriver && !isBooked ? onClick : undefined}
      className={`relative w-16 h-20 flex flex-col items-center justify-center transition-transform duration-200 
        ${!isDriver && !isBooked ? 'cursor-pointer active:scale-95' : ''} 
        ${isSelected ? 'scale-105' : ''}
        ${isBooked ? 'opacity-80 cursor-not-allowed' : ''}
      `}
    >
      <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-md">
        <defs>
          <linearGradient id="leatherGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{stopColor: '#F5E6D3', stopOpacity: 1}} />
            <stop offset="100%" style={{stopColor: '#DBC3A3', stopOpacity: 1}} />
          </linearGradient>
          <filter id="insetShadow">
            <feOffset dx="0" dy="2" />
            <feGaussianBlur stdDeviation="2" result="offset-blur" />
            <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse" />
            <feFlood floodColor="black" floodOpacity="0.2" result="color" />
            <feComposite operator="in" in="color" in2="inverse" result="shadow" />
            <feComposite operator="over" in="shadow" in2="SourceGraphic" />
          </filter>
        </defs>

        {/* Headrest */}
        <path d="M20 15 Q20 5 50 5 Q80 5 80 15 L80 25 Q80 32 50 32 Q20 32 20 25 Z" fill={baseColor} stroke={strokeColor} strokeWidth="1.5" />
        
        {/* Main Body */}
        <path d="M10 40 Q10 30 20 30 L80 30 Q90 30 90 40 L95 100 Q95 110 85 110 L15 110 Q5 110 5 100 Z" fill={baseColor} stroke={strokeColor} strokeWidth="1.5" />
        
        {/* Center Stitching/Pattern */}
        {!isDriver && !isBooked && !isSelected && (
            <>
                <path d="M30 30 L30 110" stroke={strokeColor} strokeWidth="0.5" strokeDasharray="2,2" opacity="0.5" />
                <path d="M70 30 L70 110" stroke={strokeColor} strokeWidth="0.5" strokeDasharray="2,2" opacity="0.5" />
                <path d="M10 70 Q50 80 90 70" stroke={strokeColor} strokeWidth="1" opacity="0.3" fill="none" />
            </>
        )}

        {/* Armrests Hint */}
        {!isDriver && (
            <>
            <path d="M5 50 L2 80" stroke={strokeColor} strokeWidth="2" opacity="0.4" fill="none" />
            <path d="M95 50 L98 80" stroke={strokeColor} strokeWidth="2" opacity="0.4" fill="none" />
            </>
        )}

        {/* Steering Wheel for Driver */}
        {isDriver && (
            <circle cx="50" cy="70" r="25" fill="none" stroke="#999" strokeWidth="4" />
        )}
        {isDriver && (
            <path d="M50 70 L28 85 M50 70 L72 85 M50 70 L50 45" stroke="#999" strokeWidth="4" />
        )}

      </svg>
      
      {/* Seat Number Overlay */}
      {!isDriver && (
        <span className={`absolute top-[60%] left-1/2 -translate-x-1/2 -translate-y-1/2 font-black text-sm ${textColor}`}>
          {seatNum}
        </span>
      )}
    </div>
  );
};

// 2. Filter Modal Component
const FilterModal = ({ 
  isOpen, onClose, filters, setFilters, maxPriceLimit 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  filters: any, 
  setFilters: any,
  maxPriceLimit: number
}) => {
  if (!isOpen) return null;

  const toggleList = (list: string[], item: string) => {
    return list.includes(item) ? list.filter(i => i !== item) : [...list, item];
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom duration-300 flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-lg text-gray-800">Filter & Sort</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {/* Price Range */}
          <div>
            <h4 className="text-sm font-bold text-gray-400 uppercase mb-4">Price Range</h4>
            <div className="px-2">
               <input 
                 type="range" 
                 min="0" max={maxPriceLimit} step="100"
                 value={filters.maxPrice}
                 onChange={(e) => setFilters({...filters, maxPrice: parseInt(e.target.value)})}
                 className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-mmt-red"
               />
               <div className="flex justify-between mt-2 font-bold text-gray-700">
                 <span>₹0</span>
                 <span>₹{filters.maxPrice}</span>
               </div>
            </div>
          </div>

          {/* Vehicle Type */}
          <div>
            <h4 className="text-sm font-bold text-gray-400 uppercase mb-3">Vehicle Type</h4>
            <div className="flex flex-wrap gap-2">
              {['Innova Crysta', 'Mahindra Xylo', 'Toyota Innova', 'Tempo Traveler'].map(type => (
                <button
                  key={type}
                  onClick={() => setFilters({...filters, vehicleTypes: toggleList(filters.vehicleTypes, type)})}
                  className={`px-4 py-2 rounded-full text-xs font-bold border transition
                    ${filters.vehicleTypes.includes(type) ? 'bg-mmt-blue text-white border-mmt-blue' : 'bg-white text-gray-600 border-gray-200'}
                  `}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Departure Time */}
          <div>
            <h4 className="text-sm font-bold text-gray-400 uppercase mb-3">Departure Time</h4>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Morning', icon: <Clock size={14}/>, sub: '6AM - 12PM' },
                { label: 'Afternoon', icon: <Clock size={14}/>, sub: '12PM - 6PM' },
                { label: 'Evening', icon: <Clock size={14}/>, sub: 'After 6PM' },
              ].map(time => (
                <button
                  key={time.label}
                  onClick={() => setFilters({...filters, timeOfDay: toggleList(filters.timeOfDay, time.label)})}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition
                    ${filters.timeOfDay.includes(time.label) ? 'bg-red-50 border-mmt-red text-mmt-red' : 'bg-white border-gray-200 text-gray-500'}
                  `}
                >
                  {time.icon}
                  <span className="font-bold text-xs">{time.label}</span>
                  <span className="text-[9px] opacity-70">{time.sub}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 flex gap-3">
          <button 
            onClick={() => setFilters({ maxPrice: maxPriceLimit, vehicleTypes: [], timeOfDay: [] })}
            className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-50 rounded-xl"
          >
            Clear All
          </button>
          <button 
            onClick={onClose}
            className="flex-1 py-3 bg-gradient-to-r from-mmt-red to-mmt-darkRed text-white font-bold rounded-xl shadow-lg"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};


export const PassengerFlow: React.FC = () => {
  const { passengerBalance, trips, bookTrip, user, logout, updateTripStatus, releaseFunds, rideOffers, depositToWallet, rateTrip, updateUser } = useApp();
  const [view, setView] = useState<ViewState>('search');
  
  const [searchParams, setSearchParams] = useState<SearchParams>({ 
    from: 'Leh', to: 'Srinagar', date: new Date().toISOString().split('T')[0] 
  });
  
  // Filter State
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    maxPrice: 10000,
    vehicleTypes: [] as string[],
    timeOfDay: [] as string[]
  });
  
  // Now supports both generic VehicleDef and specific RideOffer
  const [selectedRide, setSelectedRide] = useState<(VehicleDef & Partial<RideOffer> & { price: number, driver?: any }) | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [chatTripId, setChatTripId] = useState<number | null>(null);
  
  // Rating State
  const [ratingModal, setRatingModal] = useState<{tripId: number, driverName: string} | null>(null);

  const swapLocations = () => {
    setSearchParams(prev => ({ ...prev, from: prev.to, to: prev.from }));
  };

  // --- SCREENS ---

  const SearchWidget = () => (
    <div className="bg-white min-h-screen pb-20">
       {/* Header with MMT Red Branding */}
       <div className="bg-gradient-to-br from-mmt-red to-mmt-darkRed pb-16 pt-6 px-4 rounded-b-[2rem] relative shadow-lg overflow-hidden">
         {/* Abstract geometric shapes for visual interest */}
         <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-16 -mt-16 pointer-events-none blur-3xl"></div>
         <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full -ml-10 -mb-10 pointer-events-none blur-2xl"></div>

         <div className="flex justify-between items-center mb-6 text-white relative z-10">
            <button onClick={() => setView('profile')} className="flex items-center gap-2 hover:bg-white/10 p-2 rounded-lg transition">
               <div className="w-9 h-9 bg-white/20 p-0.5 rounded-full backdrop-blur-sm ring-1 ring-white/30 overflow-hidden">
                  {user?.profileImage ? (
                    <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                       <User className="text-white" size={20} />
                    </div>
                  )}
               </div>
               <div className="text-left">
                  <p className="text-[10px] text-white/70 font-medium uppercase tracking-wider">Welcome</p>
                  <span className="font-bold text-lg leading-none">{user?.name.split(' ')[0]}</span>
               </div>
            </button>
            <div className="flex gap-3">
              <button onClick={() => setView('history')} className="bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 backdrop-blur-md transition border border-white/20">
                <ShieldCheck size={14} /> Trips
              </button>
            </div>
         </div>

         <div className="text-white mb-6 relative z-10">
            <h1 className="text-3xl font-black drop-shadow-md">Where to next?</h1>
            <p className="text-white/80 text-sm mt-1">Explore the Himalayas safely.</p>
         </div>
       </div>

       {/* Floating Search Card */}
       <div className="px-4 -mt-12 relative z-10">
         <div className="bg-white rounded-2xl shadow-floating p-6 border border-gray-100">
           
           {/* Location Input Group */}
           <div className="flex flex-col gap-5">
             {/* FROM */}
             <div className="relative border-b border-gray-100 pb-2 hover:border-mmt-red transition-colors">
               <span className="text-[10px] text-gray-400 font-bold tracking-wider uppercase flex items-center gap-1"><MapPin size={10}/> From</span>
               <div className="flex items-center justify-between mt-1">
                 <select 
                    className="w-full font-black text-xl bg-transparent outline-none text-gray-800 py-1 appearance-none cursor-pointer"
                    value={searchParams.from}
                    onChange={(e) => setSearchParams({...searchParams, from: e.target.value})}
                  >
                    {CITIES.map(city => <option key={city} value={city}>{city}</option>)}
                  </select>
               </div>
               <p className="text-xs text-gray-400 truncate mt-1">Pick-up Location</p>
             </div>

             {/* Swap Button */}
             <div className="absolute top-[32%] right-6 z-20">
                <button onClick={swapLocations} className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-mmt-red shadow-lg border border-gray-100 hover:scale-110 transition hover:bg-gray-50">
                  <ArrowRightLeft size={16} className="rotate-90" />
                </button>
             </div>

             {/* TO */}
             <div className="relative border-b border-gray-100 pb-2 hover:border-mmt-red transition-colors">
               <span className="text-[10px] text-gray-400 font-bold tracking-wider uppercase flex items-center gap-1"><MapPin size={10}/> To</span>
                <select 
                  className="w-full font-black text-xl bg-transparent outline-none text-gray-800 py-1 appearance-none cursor-pointer mt-1"
                  value={searchParams.to}
                  onChange={(e) => setSearchParams({...searchParams, to: e.target.value})}
                >
                  {CITIES.map(city => <option key={city} value={city}>{city}</option>)}
                </select>
               <p className="text-xs text-gray-400 truncate mt-1">Drop-off Location</p>
             </div>

             {/* Date */}
             <div className="relative pb-2 hover:border-mmt-red transition-colors border-b border-transparent">
                <DatePicker 
                  label="DEPARTURE DATE"
                  selectedDate={searchParams.date}
                  onDateSelect={(d) => setSearchParams({...searchParams, date: d})}
                />
             </div>
           </div>

           {/* Search Button */}
           <button 
             onClick={() => setView('results')}
             className="w-full bg-gradient-to-r from-mmt-red to-mmt-darkRed text-white font-bold py-4 rounded-xl shadow-lg shadow-red-200 hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all mt-6 text-lg uppercase tracking-wide flex items-center justify-center gap-2"
           >
             <Search size={20} /> Search Cabs
           </button>
         </div>
       </div>

       {/* Offers / Wallet */}
       <div className="px-4 mt-6">
          <div onClick={() => setView('profile')} className="bg-white p-5 rounded-2xl shadow-card border border-gray-100 flex items-center justify-between mb-4 active:scale-95 transition cursor-pointer group">
             <div>
               <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Wallet Balance</p>
               <p className="text-2xl font-black text-gray-800 group-hover:text-mmt-red transition-colors">₹ {passengerBalance.toLocaleString()}</p>
             </div>
             <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 group-hover:bg-red-50 group-hover:text-mmt-red transition-colors">
                <Plus size={24} />
             </div>
          </div>
       </div>
    </div>
  );

  // MMT Style Profile
  const PassengerProfile = () => {
    const [isTopUpOpen, setIsTopUpOpen] = useState(false);
    const [amount, setAmount] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleTopUp = () => {
      const val = parseInt(amount);
      if (val > 0) {
        depositToWallet(val);
        setAmount('');
        setIsTopUpOpen(false);
        alert(`Successfully added ₹${val} to your wallet!`);
      }
    };

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          updateUser({ profileImage: reader.result as string });
        };
        reader.readAsDataURL(file);
      }
    };

    const triggerImageUpload = () => {
      fileInputRef.current?.click();
    };

    if (isTopUpOpen) {
       return (
          <div className="bg-white min-h-screen flex flex-col relative overflow-hidden animate-in slide-in-from-bottom duration-300">
             {/* Decorative Background */}
             <div className="absolute top-0 right-0 w-64 h-64 bg-mmt-red/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
             
             <div className="p-6 relative z-10 flex-1 flex flex-col">
                 <div className="flex items-center gap-3 mb-8">
                    <button onClick={() => setIsTopUpOpen(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition">
                        <ChevronDown className="rotate-90 text-gray-700" />
                    </button>
                    <h2 className="font-bold text-2xl text-gray-800">Add Money</h2>
                 </div>

                 <div className="bg-gradient-to-br from-gray-900 to-black text-white rounded-3xl p-8 mb-8 shadow-xl relative overflow-hidden transform transition hover:scale-[1.02]">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                   <p className="text-gray-400 text-sm font-medium mb-1 uppercase tracking-wider">Current Balance</p>
                   <h1 className="text-4xl font-black">₹ {passengerBalance.toLocaleString()}</h1>
                 </div>
                 
                 <div className="mb-8 flex-1">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Enter Amount</label>
                    <div className="flex items-center border-b-2 border-gray-200 focus-within:border-mmt-red transition-all pb-2 group mb-6">
                        <span className="text-3xl font-bold text-gray-300 mr-2 group-focus-within:text-mmt-red">₹</span>
                        <input 
                          type="number" 
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          className="w-full text-4xl font-bold text-black bg-transparent outline-none placeholder-gray-200"
                          placeholder="0"
                          autoFocus
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                       {[500, 1000, 2000].map(val => (
                         <button 
                           key={val}
                           onClick={() => setAmount(val.toString())}
                           className="py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-red-50 hover:border-mmt-red hover:text-mmt-red transition active:scale-95"
                         >
                           +₹{val}
                         </button>
                       ))}
                    </div>
                 </div>

                  <button 
                    onClick={handleTopUp}
                    className="w-full bg-gradient-to-r from-mmt-red to-mmt-darkRed text-white py-4 rounded-xl font-bold shadow-lg shadow-red-200 text-lg hover:shadow-xl active:scale-95 transition"
                  >
                    PROCEED TO PAY
                  </button>
             </div>
          </div>
       )
    }

    return (
      <div className="bg-gray-50 min-h-screen pb-24 relative">
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*"
          onChange={handleImageUpload}
        />

        {/* Hero Background - Red Theme Abstract */}
        <div className="h-[35vh] rounded-b-[40px] relative overflow-hidden shadow-lg group bg-gradient-to-br from-mmt-red to-mmt-darkRed">
            {/* Abstract geometric shapes similar to login screen */}
            <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black/20 to-transparent"></div>
            <div className="absolute bottom-0 left-0 w-full h-24 bg-white/10 skew-y-3 origin-bottom-left"></div>
            <div className="absolute bottom-10 right-0 w-full h-24 bg-white/10 -skew-y-3 origin-bottom-right"></div>
            
            {/* Subtle Texture */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>

            <div className="p-6 pt-10 relative z-10 text-white">
                <div className="flex justify-between items-start mb-6">
                   <button onClick={() => setView('search')} className="bg-white/10 hover:bg-white/20 p-2 rounded-full backdrop-blur-md transition border border-white/10">
                       <ChevronDown className="rotate-90 text-white" />
                   </button>
                </div>

                <div className="flex items-center gap-5">
                    <div className="w-20 h-20 bg-white p-1 rounded-full shadow-2xl relative">
                        <div className="w-full h-full bg-gray-100 rounded-full overflow-hidden flex items-center justify-center relative shadow-inner">
                             {user?.profileImage ? (
                               <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
                             ) : (
                               <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-mmt-red text-3xl font-black">
                                  {user?.name.charAt(0)}
                               </div>
                             )}
                        </div>
                        <button 
                          onClick={triggerImageUpload}
                          className="absolute bottom-0 right-0 w-8 h-8 bg-black text-white border-2 border-white rounded-full flex items-center justify-center hover:bg-gray-800 transition"
                        >
                          <Camera size={14} />
                        </button>
                    </div>
                    <div>
                        <h1 className="text-3xl font-black leading-tight tracking-tight drop-shadow-md">{user?.name}</h1>
                        <p className="text-white/90 text-sm flex items-center gap-1 mt-1 font-medium">
                            <Phone size={14} className="opacity-80"/> +91 {user?.mobile}
                        </p>
                        <button 
                          onClick={triggerImageUpload}
                          className="mt-3 text-[10px] font-bold bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full transition flex items-center gap-1 border border-white/20 uppercase tracking-wider"
                        >
                            Edit Profile <Edit3 size={10} />
                        </button>
                    </div>
                </div>
            </div>
        </div>

        {/* Floating Cards Container */}
        <div className="px-5 -mt-16 relative z-20 space-y-6 animate-in slide-in-from-bottom-10 duration-500 fade-in">
            
            {/* Wallet Card */}
            <div className="bg-white p-2 rounded-3xl shadow-card">
                 <div className="bg-gradient-to-r from-gray-50 to-white p-6 rounded-2xl flex items-center justify-between border border-gray-100">
                     <div>
                         <p className="text-xs font-bold text-gray-400 uppercase mb-2 tracking-wider">Wallet Balance</p>
                         <h2 className="text-4xl font-black text-gray-800 tracking-tight">₹ {passengerBalance.toLocaleString()}</h2>
                     </div>
                     <button 
                        onClick={() => setIsTopUpOpen(true)}
                        className="bg-black text-white px-6 py-4 rounded-2xl font-bold shadow-lg shadow-gray-300 hover:shadow-xl hover:scale-105 transition flex items-center gap-2 text-sm active:scale-95"
                     >
                        <Plus size={18} /> Add Money
                     </button>
                 </div>
            </div>

            {/* Simplified Menu Grid */}
            <div>
               <h4 className="text-xs font-bold text-gray-400 uppercase mb-4 ml-2 tracking-wider">My Toolkit</h4>
               <div className="grid grid-cols-1 gap-4">
                  <button onClick={() => setView('history')} className="bg-white p-5 rounded-3xl shadow-sm hover:shadow-md transition flex items-center gap-4 text-left group border border-gray-100 relative overflow-hidden">
                      <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-mmt-red group-hover:scale-110 transition relative z-10">
                          <Briefcase size={22} />
                      </div>
                      <div className="relative z-10 flex-1">
                        <h4 className="font-bold text-gray-800 text-lg">My Trips</h4>
                        <p className="text-xs text-gray-400 font-medium">View history & status</p>
                      </div>
                      <ChevronRight className="text-gray-300" />
                  </button>

                  {/* Support Section */}
                  <button className="bg-white p-5 rounded-3xl shadow-sm hover:shadow-md transition flex items-center gap-4 text-left group border border-gray-100 relative overflow-hidden">
                      <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition relative z-10">
                          <Phone size={22} />
                      </div>
                      <div className="relative z-10 flex-1">
                        <h4 className="font-bold text-gray-800 text-lg">Help & Support</h4>
                        <p className="text-xs text-gray-400 font-medium">24/7 Customer Care</p>
                      </div>
                      <ChevronRight className="text-gray-300" />
                  </button>
               </div>
            </div>

            <div className="pt-6 pb-8">
                 <button 
                    onClick={logout}
                    className="w-full bg-gradient-to-r from-mmt-red to-mmt-darkRed text-white py-5 rounded-2xl font-bold text-lg shadow-lg shadow-red-100 hover:shadow-red-200 hover:scale-[1.01] active:scale-95 transition flex items-center justify-center gap-2"
                 >
                    <LogOut size={22} /> LOGOUT
                 </button>
                 <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest text-center mt-6">Ladakh Connect v2.2</p>
            </div>
        </div>
      </div>
    );
  };

  const RatingModal = ({ tripId, driverName, onClose }: { tripId: number, driverName: string, onClose: () => void }) => {
    const [stars, setStars] = useState(0);
    
    const submitRating = () => {
      rateTrip(tripId, stars);
      onClose();
    };

    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-white w-full max-w-sm rounded-2xl p-6 text-center animate-in zoom-in-95 duration-200">
           <h3 className="text-lg font-bold text-gray-800 mb-2">Rate your trip</h3>
           <p className="text-sm text-gray-500 mb-6">How was your ride with <span className="font-bold text-gray-700">{driverName}</span>?</p>
           
           <div className="flex justify-center gap-3 mb-8">
             {[1, 2, 3, 4, 5].map(star => (
               <button 
                 key={star} 
                 onClick={() => setStars(star)}
                 className="transition-transform hover:scale-110"
               >
                 <Star 
                   size={32} 
                   className={`${star <= stars ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                 />
               </button>
             ))}
           </div>

           <div className="flex gap-3">
             <button onClick={onClose} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-50 rounded-xl">Skip</button>
             <button 
                onClick={submitRating}
                disabled={stars === 0}
                className="flex-1 py-3 bg-mmt-red text-white font-bold rounded-xl shadow-lg hover:bg-red-700 disabled:opacity-50"
             >
               Submit
             </button>
           </div>
        </div>
      </div>
    );
  };

  const ResultsList = () => {
    // 1. Filter by Route & Date
    let matchedOffers = rideOffers.filter(
        r => r.from === searchParams.from && r.to === searchParams.to && r.date === searchParams.date
    );

    // 2. Filter by Price
    matchedOffers = matchedOffers.filter(r => r.pricePerSeat <= filters.maxPrice);

    // 3. Filter by Vehicle Type
    if (filters.vehicleTypes.length > 0) {
      matchedOffers = matchedOffers.filter(r => filters.vehicleTypes.includes(r.vehicleType));
    }

    // 4. Filter by Departure Time
    if (filters.timeOfDay.length > 0) {
       matchedOffers = matchedOffers.filter(r => {
         const hour = parseInt(r.time.split(':')[0]); // Simplified parsing
         const ampm = r.time.includes('PM') ? 'PM' : 'AM';
         
         let actualHour = hour;
         if (ampm === 'PM' && hour !== 12) actualHour += 12;
         if (ampm === 'AM' && hour === 12) actualHour = 0;

         const isMorning = actualHour >= 6 && actualHour < 12;
         const isAfternoon = actualHour >= 12 && actualHour < 18;
         const isEvening = actualHour >= 18;

         if (filters.timeOfDay.includes('Morning') && isMorning) return true;
         if (filters.timeOfDay.includes('Afternoon') && isAfternoon) return true;
         if (filters.timeOfDay.includes('Evening') && isEvening) return true;
         return false;
       });
    }

    const dateDisplay = new Date(searchParams.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    const maxPriceLimit = Math.max(...rideOffers.map(r => r.pricePerSeat), 10000);

    return (
      <div className="bg-mmt-bg min-h-screen pb-24">
        <Header 
          title={`${searchParams.from} → ${searchParams.to}`} 
          subtitle={`${dateDisplay} | ${matchedOffers.length} Cabs Available`} 
          showBack 
          onBack={() => setView('search')}
        />
        
        {/* Date Filter Strip */}
        <div className="bg-white py-2 px-4 shadow-sm mb-4">
           <div className="flex gap-4 overflow-x-auto no-scrollbar">
              {[-1, 0, 1, 2].map(offset => {
                const d = new Date(searchParams.date);
                d.setDate(d.getDate() + offset);
                const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
                const dayNum = d.getDate();
                const isSelected = offset === 0;
                
                return (
                  <button key={offset} className={`flex flex-col items-center min-w-[3rem] ${isSelected ? 'text-mmt-red' : 'text-gray-500'}`}>
                     <span className="text-[10px] font-bold uppercase">{dayName}</span>
                     <span className={`text-lg font-bold ${isSelected ? 'border-b-2 border-mmt-red' : ''}`}>{dayNum}</span>
                  </button>
                )
              })}
           </div>
        </div>

        <div className="px-4 space-y-4">
            {matchedOffers.length === 0 && (
                <div className="text-center py-10">
                    <p className="text-gray-500">No cabs found matching your filters.</p>
                    <button onClick={() => setShowFilters(true)} className="text-mmt-blue font-bold text-sm mt-2">Modify Filters</button>
                </div>
            )}

          {matchedOffers.map((offer) => {
            const vehicleInfo = VEHICLES.find(v => v.type === offer.vehicleType) || VEHICLES[0];
            const availableSeatsCount = offer.totalSeats - (offer.bookedSeats ? offer.bookedSeats.length : 0);

            return (
              <div key={offer.id} className="bg-white rounded-xl shadow-card overflow-hidden">
                <div className="p-4 flex gap-4">
                  {/* Car Image */}
                  <div className="w-24 h-20 rounded-lg bg-gray-50 flex-shrink-0 overflow-hidden relative">
                    <img src={vehicleInfo.image} alt={offer.vehicleType} className="w-full h-full object-cover" />
                    <div className="absolute bottom-0 w-full bg-black/50 text-white text-[9px] text-center py-0.5">
                      {availableSeatsCount} Seats Left
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                       <div>
                         <h3 className="font-bold text-gray-800 text-lg">{offer.vehicleType}</h3>
                         <p className="text-xs text-gray-500">{offer.driverName} • <span className="text-green-600 font-bold">★ {offer.rating}</span></p>
                       </div>
                       <h3 className="font-bold text-xl text-black">₹{offer.pricePerSeat.toLocaleString()}</h3>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs text-gray-600">
                       <div className="flex items-center gap-1">
                         <span className="font-bold">{offer.time}</span>
                         <div className="w-10 h-[1px] bg-gray-300 mx-1 relative">
                           <div className="absolute w-1 h-1 rounded-full bg-gray-400 right-0 -top-0.5"></div>
                         </div>
                         <span>{searchParams.to.substring(0,3)}</span>
                       </div>
                       <div className="flex gap-2">
                          <span className="bg-green-50 text-green-700 px-1.5 py-0.5 rounded text-[10px] font-bold border border-green-100">AC</span>
                          <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-[10px] font-bold border border-blue-100">Vault</span>
                       </div>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="border-t border-gray-100 flex">
                  <div className="flex-1 px-4 py-3 text-xs text-gray-500 flex items-center gap-1 bg-gray-50">
                     <ShieldCheck size={14} className="text-green-600"/> Safety Verified
                  </div>
                  <button 
                    disabled={availableSeatsCount === 0}
                    onClick={() => {
                      setSelectedRide({ ...vehicleInfo, ...offer, price: offer.pricePerSeat });
                      setSelectedSeats([]); 
                      setView('seats');
                    }}
                    className={`flex-1 font-bold text-sm py-3 transition ${availableSeatsCount === 0 ? 'bg-gray-300 cursor-not-allowed text-gray-500' : 'bg-mmt-red text-white hover:bg-red-700'}`}
                  >
                    {availableSeatsCount === 0 ? 'SOLD OUT' : 'SELECT SEATS'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Sticky Filter Bar */}
        <div className="fixed bottom-0 w-full bg-white border-t border-gray-200 p-3 flex justify-center shadow-2xl z-40">
           <button 
             onClick={() => setShowFilters(true)}
             className="flex items-center gap-2 bg-gray-800 text-white px-6 py-3 rounded-full font-bold shadow-lg"
           >
             <SlidersHorizontal size={18} /> Filter & Sort
             {(filters.vehicleTypes.length > 0 || filters.timeOfDay.length > 0) && (
               <span className="w-2 h-2 bg-mmt-red rounded-full"></span>
             )}
           </button>
        </div>

        <FilterModal 
           isOpen={showFilters} 
           onClose={() => setShowFilters(false)}
           filters={filters}
           setFilters={setFilters}
           maxPriceLimit={maxPriceLimit}
        />
      </div>
    );
  };

  const SeatMap = () => {
    if (!selectedRide) return null;
    const { price, layout } = selectedRide;
    const bookedSeats = selectedRide.bookedSeats || [];
    
    const toggleSeat = (seatNum: number) => {
      if (bookedSeats.includes(seatNum)) return;
      setSelectedSeats(prev => 
        prev.includes(seatNum) ? prev.filter(s => s !== seatNum) : [...prev, seatNum]
      );
    };

    const renderRow = (count: number, startIndex: number, rowIndex: number) => (
      <div className="flex justify-center gap-8 mb-2">
        {Array.from({ length: count }).map((_, i) => {
          const seatNum = startIndex + i;
          const isBooked = bookedSeats.includes(seatNum);
          const isSelected = selectedSeats.includes(seatNum);
          
          return (
            <div key={seatNum} className="relative">
               <RealSeat 
                 seatNum={seatNum} 
                 status={isBooked ? 'booked' : isSelected ? 'selected' : 'available'} 
                 onClick={() => toggleSeat(seatNum)} 
               />
            </div>
          );
        })}
      </div>
    );

    return (
      <div className="bg-mmt-bg min-h-screen flex flex-col">
        <Header 
            title={selectedRide.type} 
            subtitle={`${selectedRide.seats} Seater • AC`}
            showBack onBack={() => setView('results')} 
        />
        
        <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center">
           
           {/* Car Chassis Container */}
           <div className="bg-white rounded-[3rem] shadow-xl border-4 border-gray-300 px-6 py-10 w-full max-w-[320px] relative mt-4">
             {/* Front Windshield Hint */}
             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-2 bg-blue-100/50 rounded-b-xl"></div>

             {/* Driver Row (Fixed) */}
             <div className="flex justify-between gap-8 mb-6 border-b border-dashed border-gray-200 pb-4">
                {/* Front Passenger Seat (Seat 1) */}
                {layout[0] === 1 && (
                  <RealSeat 
                    seatNum={1} 
                    status={bookedSeats.includes(1) ? 'booked' : selectedSeats.includes(1) ? 'selected' : 'available'} 
                    onClick={() => toggleSeat(1)} 
                  />
                )}
                {/* Driver Seat (Always Right in India) */}
                <RealSeat status="driver" />
             </div>

             {/* Passenger Rows */}
             <div className="space-y-4">
                {/* Skip first row in layout map if it was the front passenger */}
                {layout.slice(1).map((seatsInRow, idx) => {
                   const previousSeats = layout.slice(0, idx + 1).reduce((a, b) => a + b, 0);
                   return <div key={idx}>{renderRow(seatsInRow, 1 + previousSeats, idx + 1)}</div>;
                })}
             </div>
             
             {/* Rear of Car Hint */}
             <div className="mt-8 text-center">
               <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Rear</span>
             </div>
           </div>

           {/* Legend */}
           <div className="flex gap-4 mt-6">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-[#E8DCCA] border border-[#C7B299]"></div>
                <span className="text-xs text-gray-600">Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-500"></div>
                <span className="text-xs text-gray-600">Selected</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gray-300"></div>
                <span className="text-xs text-gray-600">Booked</span>
              </div>
           </div>
        </div>

        {/* Sticky Payment Footer */}
        <div className="bg-white p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] z-20">
          <div className="flex justify-between items-center mb-3">
             <div className="flex flex-col">
               <span className="text-xs text-gray-500 font-bold uppercase">Total Fare</span>
               <span className="text-2xl font-black text-black">₹ {(selectedSeats.length * price).toLocaleString()}</span>
             </div>
             <div className="text-right">
                <span className="text-xs text-gray-500 font-bold uppercase block">{selectedSeats.length} Seats</span>
                <span className="font-bold text-mmt-red text-sm">{selectedSeats.join(', ')}</span>
             </div>
          </div>
          <button 
            disabled={selectedSeats.length === 0}
            onClick={() => setView('vault_pay')}
            className={`w-full py-4 rounded-full font-bold text-lg transition-all shadow-lg
              ${selectedSeats.length > 0 ? 'bg-gradient-to-r from-mmt-red to-mmt-darkRed text-white hover:shadow-xl' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
          >
            CONTINUE
          </button>
        </div>
      </div>
    );
  };

  const VaultPayment = () => {
    if (!selectedRide) return null;
    const totalCost = selectedSeats.length * selectedRide.price;

    const handlePayment = () => {
      const success = bookTrip({
        from: searchParams.from,
        to: searchParams.to,
        date: searchParams.date,
        seats: selectedSeats,
        vehicleType: selectedRide.type,
        driverName: selectedRide.driverName,
        vehicleNo: selectedRide.vehicleNo,
        cost: totalCost
      }, totalCost, selectedRide.id);

      if (success) {
        setView('history');
      } else {
        alert("Insufficient Funds! Please add money to wallet.");
      }
    };

    return (
      <div className="bg-white min-h-screen flex flex-col">
        <Header title="Review Booking" showBack onBack={() => setView('seats')} />
        
        <div className="flex-1 p-4 bg-gray-50">
          {/* Journey Summary */}
          <div className="bg-white p-4 rounded-xl shadow-card mb-4 border-l-4 border-mmt-red">
             <div className="flex justify-between mb-2">
               <span className="font-bold text-lg text-gray-800">{searchParams.from}</span>
               <span className="text-gray-400">→</span>
               <span className="font-bold text-lg text-gray-800">{searchParams.to}</span>
             </div>
             <p className="text-sm text-gray-500">{new Date(searchParams.date).toDateString()} • {selectedSeats.length} Seats ({selectedSeats.join(',')})</p>
             <p className="text-sm font-bold text-gray-800 mt-1">{selectedRide.type}</p>
          </div>

          {/* Vault Info */}
          <div className="bg-white p-6 rounded-xl shadow-card mb-6 text-center">
             <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="text-mmt-blue" size={32} />
             </div>
             <h3 className="font-bold text-gray-800 mb-1">Secure Vault Payment</h3>
             <p className="text-xs text-gray-500 mb-4 px-4">
               Your money is safe. We hold the amount in the App Vault and transfer it to the driver only after you reach your destination.
             </p>
             
             <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                <div className="flex justify-between text-sm mb-2">
                   <span className="text-gray-600">Trip Cost</span>
                   <span className="font-bold">₹ {totalCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm mb-2 text-green-600">
                   <span>Convenience Fee</span>
                   <span className="font-bold">FREE</span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-lg">
                   <span>Total Payable</span>
                   <span>₹ {totalCost.toLocaleString()}</span>
                </div>
             </div>
          </div>
        </div>

        <div className="p-4 bg-white shadow-lg z-20">
           <div className="flex items-center gap-2 mb-4 text-xs bg-yellow-50 p-2 rounded text-yellow-800 border border-yellow-100">
              <Info size={14}/> <span>Cancellable until 2 hours before departure.</span>
           </div>
           <button 
            onClick={handlePayment}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-4 rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition"
          >
            PAY & BOOK
          </button>
        </div>
      </div>
    );
  };

  const BookingHistory = () => {
    const [expandedTripId, setExpandedTripId] = useState<number | null>(null);

    return (
      <div className="bg-[#f2f2f2] min-h-screen pb-20">
        <div className="bg-white p-4 sticky top-0 z-50 shadow-sm flex items-center justify-between">
           <div className="flex items-center gap-3">
             <button onClick={() => setView('search')}><ChevronDown className="rotate-90 text-gray-600" /></button>
             <h1 className="text-lg font-bold text-gray-800">My Trips</h1>
           </div>
           <button onClick={() => setView('search')} className="text-sm font-bold text-blue-600">+ Add Booking</button>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 pt-0 mb-4 flex gap-4 overflow-x-auto">
           {['Completed', 'Cancelled', 'Upcoming'].map((tab, i) => (
              <button key={tab} className={`pb-2 text-sm font-bold ${i === 0 ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400'}`}>
                {tab}
              </button>
           ))}
        </div>

        <div className="px-4 space-y-4">
           {trips.length === 0 && (
             <div className="text-center py-10">
               <p className="text-gray-500">No trips found.</p>
             </div>
           )}
           
           {trips.map(trip => {
             const isExpanded = expandedTripId === trip.id;
             const bgImage = DESTINATION_IMAGES[trip.to] || DESTINATION_IMAGES['default'];

             return (
               <div key={trip.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                 {/* Header Image */}
                 <div 
                    onClick={() => setExpandedTripId(isExpanded ? null : trip.id)}
                    className="h-28 bg-gray-200 relative cursor-pointer"
                  >
                    <img src={bgImage} alt={trip.to} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                    <div className="absolute bottom-3 left-4 text-white">
                       <h3 className="font-bold text-lg">{trip.from} & {trip.to}</h3>
                       <p className="text-xs opacity-90">{new Date(trip.date).toDateString()} • {trip.vehicleType}</p>
                    </div>
                    <button className="absolute top-3 right-3 bg-white/20 backdrop-blur-sm p-1.5 rounded-full text-white">
                       {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                 </div>
                 
                 {/* Collapsed/Expanded Content */}
                 {isExpanded && (
                    <div className="p-5 animate-in slide-in-from-top-4 duration-300">
                       <div className="flex items-center justify-between mb-4">
                          <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                             {trip.status}
                          </div>
                          <button className="text-blue-600 text-xs font-bold">View Details</button>
                       </div>

                       <div className="flex items-center gap-4 mb-6">
                          <img 
                            src={VEHICLES.find(v => v.type === trip.vehicleType)?.image} 
                            alt="car" 
                            className="w-10 h-10 rounded object-cover" 
                          />
                          <div>
                             <p className="font-bold text-sm text-gray-800">{trip.driverName}</p>
                             <p className="text-xs text-gray-500">{trip.vehicleType} ({trip.vehicleNo})</p>
                          </div>
                          <div className="ml-auto text-right">
                             <p className="font-bold text-gray-800">{trip.from}</p>
                             <p className="text-xs text-gray-500">08:00 AM</p>
                          </div>
                       </div>

                       {/* Timeline */}
                       <div className="relative pl-4 border-l-2 border-dashed border-gray-300 ml-2 space-y-6 mb-6">
                          <div className="relative">
                             <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-gray-400"></div>
                             <p className="text-sm font-bold text-gray-800">{trip.from}</p>
                             <p className="text-xs text-gray-500">{new Date(trip.date).toDateString()}</p>
                          </div>
                          <div className="relative">
                             <div className="absolute -left-[23px] top-1 w-4 h-4 rounded-full border-2 border-gray-400 bg-white"></div>
                             <p className="text-sm font-bold text-gray-800">{trip.to}</p>
                             <p className="text-xs text-gray-500">End of Trip</p>
                          </div>
                       </div>

                       <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg mb-4">
                          Booking ID: <span className="font-bold text-gray-800 uppercase">LC{trip.id}</span>
                       </div>
                       
                       <div className="flex gap-3">
                          <button 
                             onClick={() => downloadDocument('Invoice', trip)}
                             className="flex-1 py-3 border border-blue-600 text-blue-600 rounded-lg font-bold text-sm"
                          >
                             Download Invoice
                          </button>
                          <button 
                             onClick={() => setExpandedTripId(null)}
                             className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-bold text-sm"
                          >
                             Done
                          </button>
                       </div>
                    </div>
                 )}
               </div>
             )
           })}
        </div>
      </div>
    );
  }

  switch(view) {
    case 'search': return <SearchWidget />;
    case 'results': return <ResultsList />;
    case 'seats': return <SeatMap />;
    case 'vault_pay': return <VaultPayment />;
    case 'history': return <BookingHistory />;
    case 'chat': return chatTripId ? <ChatScreen tripId={chatTripId} onBack={() => setView('history')} /> : <BookingHistory />;
    case 'profile': return <PassengerProfile />;
    default: return <SearchWidget />;
  }
};