import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Navigation, User, LogOut, MapPin, ShieldCheck, Wallet, ChevronRight, MessageCircle, Plus, Calendar, Clock, IndianRupee, X, ArrowRight, History, Home, Phone, Star } from 'lucide-react';
import { ChatScreen } from '../common/ChatScreen';
import { DatePicker } from '../common/DatePicker';
import { CITIES } from '../../constants';

type OwnerView = 'home' | 'history' | 'profile';

export const OwnerDashboard: React.FC = () => {
  const { user, trips, driverBalance, updateTripStatus, logout, publishRide } = useApp();
  const [activeChatTripId, setActiveChatTripId] = useState<string | null>(null);
  const [showAddRide, setShowAddRide] = useState(false);
  const [currentView, setCurrentView] = useState<OwnerView>('home');

  // Add Ride Form State
  const [newRide, setNewRide] = useState({
    from: 'Leh',
    to: 'Srinagar',
    date: new Date().toISOString().split('T')[0],
    time: '07:00 AM',
    price: 3000
  });

  const myTrips = trips.filter(t => t.driverName === user?.name);
  const activeTrips = myTrips.filter(t => t.status !== 'COMPLETED');
  const completedTrips = myTrips.filter(t => t.status === 'COMPLETED');
  const totalEarnings = myTrips.filter(t => t.status === 'COMPLETED').reduce((acc, t) => acc + t.cost, 0);

  const handlePublish = () => {
    publishRide({
      vehicleNo: user?.vehicleNo || '',
      vehicleType: user?.vehicleType || 'Taxi',
      from: newRide.from,
      to: newRide.to,
      date: newRide.date,
      time: newRide.time,
      pricePerSeat: newRide.price,
      totalSeats: user?.vehicleType === 'Tempo Traveler' ? 12 : 7,
    });
    setShowAddRide(false);
    alert('Ride Published Successfully! Passengers can now book your vehicle.');
  };

  if (activeChatTripId) {
    return <ChatScreen tripId={activeChatTripId} onBack={() => setActiveChatTripId(null)} />;
  }

  const DriverHeader = () => (
    <div className="bg-gradient-to-br from-mmt-red to-mmt-darkRed text-white p-6 pt-10 rounded-b-[2rem] shadow-xl mb-6 relative overflow-hidden">
        {/* Abstract shapes matching login/passenger */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full translate-x-10 -translate-y-10 blur-xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full -translate-x-5 translate-y-5 blur-lg"></div>
        
        <div className="relative z-10 flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
             <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-inner">
               <User className="text-white" size={28} />
             </div>
             <div>
               <h1 className="font-bold text-xl drop-shadow-md">{user?.name}</h1>
               <div className="flex items-center gap-2 text-xs text-white/80 font-medium">
                 <span className="bg-white/20 px-2 py-0.5 rounded border border-white/10">{user?.vehicleNo}</span>
                 <span>•</span>
                 <span>{user?.vehicleType}</span>
               </div>
             </div>
          </div>
        </div>

        <div className="flex gap-4">
           <div className="flex-1 bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/20 shadow-lg">
             <div className="flex items-center gap-2 mb-2 text-white/70">
               <Wallet size={16} />
               <p className="text-[10px] font-bold uppercase tracking-wider">Balance</p>
             </div>
             <p className="text-2xl font-bold text-white">₹ {driverBalance.toLocaleString()}</p>
           </div>
           <div className="flex-1 bg-black/20 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
             <p className="text-white/60 text-[10px] font-bold uppercase tracking-wider mb-2">Total Earned</p>
             <p className="text-2xl font-bold text-white">₹ {totalEarnings.toLocaleString()}</p>
           </div>
        </div>
      </div>
  );

  const HomeView = () => (
    <div className="px-6 animate-in slide-in-from-right duration-300">
        {/* Actions */}
        <div className="mb-6 flex justify-end">
           <button 
             onClick={() => setShowAddRide(true)}
             className="bg-mmt-red text-white px-5 py-3 rounded-2xl font-bold shadow-lg shadow-red-200 flex items-center gap-2 hover:bg-red-700 transition active:scale-95"
           >
             <Plus size={20} /> Post New Ride
           </button>
        </div>

        <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">
           <Navigation size={18} className="text-mmt-red" /> Active Assignments
        </h2>
        
        {activeTrips.length === 0 ? (
          <div className="text-center py-16 px-8 bg-white rounded-3xl shadow-sm border border-gray-100">
            <div className="bg-red-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Navigation size={32} className="text-mmt-red"/>
            </div>
            <p className="text-gray-800 font-bold mb-1">No Active Trips</p>
            <p className="text-gray-400 text-sm">Post a ride or wait for passengers to book.</p>
          </div>
        ) : (
          activeTrips.map(trip => (
             <div key={trip.id} className="bg-white rounded-3xl shadow-md p-6 border border-gray-100 mb-6 relative overflow-hidden">
               {/* Status Strip */}
               <div className="absolute top-0 left-0 w-1 h-full bg-mmt-blue"></div>

               <div className="flex justify-between mb-6">
                 <div>
                   <h3 className="font-bold text-xl text-gray-900">{trip.from} <span className="text-gray-400 mx-1">→</span> {trip.to}</h3>
                   <p className="text-xs text-gray-500 mt-1">Passenger: {trip.passengerId}</p>
                 </div>
                 <div className="text-right">
                   <span className="block text-2xl font-bold text-mmt-blue">₹ {trip.cost}</span>
                   <span className="text-[10px] text-gray-400 uppercase font-bold">Payout</span>
                 </div>
               </div>

               <div className="bg-green-50 p-4 rounded-xl mb-6 flex items-start gap-3 border border-green-100">
                 <ShieldCheck size={20} className="text-green-600 mt-0.5"/>
                 <div>
                   <p className="text-xs font-bold text-green-800 uppercase mb-0.5">Payment Secured</p>
                   <p className="text-[11px] text-green-700 leading-tight">
                     Funds are locked in the Vault. Complete the trip to receive payment.
                   </p>
                 </div>
               </div>

               <div className="space-y-3">
                 {/* Chat Button */}
                 <button 
                    onClick={() => setActiveChatTripId(trip.id)}
                    className="w-full bg-blue-50 text-blue-700 py-3 rounded-xl font-bold shadow-sm hover:bg-blue-100 transition flex items-center justify-center gap-2"
                  >
                    <MessageCircle size={18} /> Chat with Passenger
                  </button>

                {trip.status === 'BOOKED' && (
                   <button 
                     onClick={() => updateTripStatus(trip.id, 'EN_ROUTE')}
                     className="w-full bg-mmt-blue text-white py-4 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
                   >
                     Start Trip <ChevronRight size={18} />
                   </button>
                 )}
                 
                 {trip.status === 'EN_ROUTE' && (
                   <button 
                     onClick={() => updateTripStatus(trip.id, 'ARRIVED')}
                     className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 hover:bg-black transition"
                   >
                     <MapPin size={18} className="text-red-500" /> Confirm Arrival
                   </button>
                 )}

                {trip.status === 'ARRIVED' && (
                   <div className="w-full bg-gray-100 text-gray-400 py-4 rounded-xl font-bold text-sm text-center border-2 border-dashed border-gray-300 animate-pulse">
                     Waiting for passenger confirmation...
                   </div>
                 )}
               </div>
             </div>
          ))
        )}
    </div>
  );

  const HistoryView = () => (
    <div className="px-6 animate-in slide-in-from-right duration-300">
        <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">
           <History size={18} className="text-mmt-red" /> Completed Trips
        </h2>
        
        {completedTrips.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-2xl">
              <p className="text-gray-400">No completed trips yet.</p>
          </div>
        ) : (
          completedTrips.map(trip => (
              <div key={trip.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-4 flex justify-between items-center">
                  <div>
                      <h4 className="font-bold text-gray-800">{trip.from} → {trip.to}</h4>
                      <p className="text-xs text-gray-500">{new Date(trip.date).toDateString()}</p>
                  </div>
                  <div className="text-right">
                      <span className="block font-bold text-green-600">+ ₹{trip.cost}</span>
                      <span className="text-[10px] bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-bold">PAID</span>
                  </div>
              </div>
          ))
        )}
    </div>
  );

  const ProfileView = () => (
      <div className="px-6 animate-in slide-in-from-right duration-300 pb-20">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-6">
              <h3 className="font-bold text-lg text-gray-800 mb-4">Vehicle Details</h3>
              <div className="space-y-4">
                  <div className="flex justify-between border-b border-gray-50 pb-2">
                      <span className="text-gray-500 text-sm">Vehicle Number</span>
                      <span className="font-bold text-gray-800">{user?.vehicleNo}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-50 pb-2">
                      <span className="text-gray-500 text-sm">Vehicle Type</span>
                      <span className="font-bold text-gray-800">{user?.vehicleType}</span>
                  </div>
                  <div className="flex justify-between">
                      <span className="text-gray-500 text-sm">Driver Name</span>
                      <span className="font-bold text-gray-800">{user?.name}</span>
                  </div>
              </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-6">
              <h3 className="font-bold text-lg text-gray-800 mb-4">Statistics</h3>
              <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-2xl text-center">
                      <p className="text-2xl font-black text-mmt-red">{completedTrips.length}</p>
                      <p className="text-xs text-gray-500 font-bold uppercase">Trips Done</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-2xl text-center">
                      <p className="text-2xl font-black text-yellow-500 flex items-center justify-center gap-1">4.8 <Star size={16} fill="currentColor" /></p>
                      <p className="text-xs text-gray-500 font-bold uppercase">Rating</p>
                  </div>
              </div>
          </div>
          
           <button 
                onClick={logout}
                className="w-full bg-gradient-to-r from-mmt-red to-mmt-darkRed text-white py-5 rounded-2xl font-bold text-lg shadow-lg shadow-red-100 hover:shadow-red-200 hover:scale-[1.01] active:scale-95 transition flex items-center justify-center gap-2"
             >
                <LogOut size={22} /> LOGOUT
           </button>
      </div>
  );

  return (
    <div className="bg-gray-100 min-h-screen pb-24 relative">
      <DriverHeader />
      
      {currentView === 'home' && <HomeView />}
      {currentView === 'history' && <HistoryView />}
      {currentView === 'profile' && <ProfileView />}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-2 flex justify-around items-center z-50 pb-safe">
          <button 
            onClick={() => setCurrentView('home')} 
            className={`p-4 rounded-2xl flex flex-col items-center gap-1 transition-all ${currentView === 'home' ? 'text-mmt-red bg-red-50' : 'text-gray-400 hover:bg-gray-50'}`}
          >
              <Home size={24} fill={currentView === 'home' ? "currentColor" : "none"} />
              <span className="text-[10px] font-bold">Home</span>
          </button>
          <button 
            onClick={() => setCurrentView('history')} 
            className={`p-4 rounded-2xl flex flex-col items-center gap-1 transition-all ${currentView === 'history' ? 'text-mmt-red bg-red-50' : 'text-gray-400 hover:bg-gray-50'}`}
          >
              <History size={24} />
              <span className="text-[10px] font-bold">History</span>
          </button>
          <button 
            onClick={() => setCurrentView('profile')} 
            className={`p-4 rounded-2xl flex flex-col items-center gap-1 transition-all ${currentView === 'profile' ? 'text-mmt-red bg-red-50' : 'text-gray-400 hover:bg-gray-50'}`}
          >
              <User size={24} fill={currentView === 'profile' ? "currentColor" : "none"} />
              <span className="text-[10px] font-bold">Profile</span>
          </button>
      </div>

      {/* Add Ride Modal - Redesigned */}
      {showAddRide && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
           <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
             
             {/* Header */}
             <div className="bg-gradient-to-r from-mmt-red to-mmt-darkRed p-5 flex justify-between items-center text-white">
                <div className="flex items-center gap-2">
                   <Plus className="bg-white/20 p-1 rounded-lg" size={28} />
                   <div>
                      <h3 className="font-bold text-lg leading-tight">Post New Ride</h3>
                      <p className="text-xs text-red-100 opacity-90">Fill details to get passengers</p>
                   </div>
                </div>
                <button onClick={() => setShowAddRide(false)} className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition">
                   <X size={20} />
                </button>
             </div>

             <div className="p-6 space-y-5">
                
                {/* Route Section */}
                <div className="flex gap-3 items-center">
                   <div className="flex-1 bg-gray-50 p-3 rounded-xl border border-gray-200 focus-within:border-mmt-red focus-within:ring-1 focus-within:ring-red-100 transition-all">
                     <label className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1 mb-1">
                        <MapPin size={10} /> From
                     </label>
                     <select value={newRide.from} onChange={e => setNewRide({...newRide, from: e.target.value})} className="w-full font-bold text-gray-800 bg-transparent outline-none">
                       {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                     </select>
                   </div>
                   
                   <ArrowRight className="text-gray-300" size={20} />

                   <div className="flex-1 bg-gray-50 p-3 rounded-xl border border-gray-200 focus-within:border-mmt-red focus-within:ring-1 focus-within:ring-red-100 transition-all">
                     <label className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1 mb-1">
                        <MapPin size={10} /> To
                     </label>
                     <select value={newRide.to} onChange={e => setNewRide({...newRide, to: e.target.value})} className="w-full font-bold text-gray-800 bg-transparent outline-none">
                       {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                     </select>
                   </div>
                </div>

                {/* Date & Time */}
                <div className="flex gap-4">
                   <div className="flex-[2] border-b border-gray-200 pb-1">
                      <DatePicker 
                          label="Departure Date" 
                          selectedDate={newRide.date} 
                          onDateSelect={(d) => setNewRide({...newRide, date: d})} 
                      />
                   </div>
                   <div className="flex-1 bg-gray-50 p-3 rounded-xl border border-gray-200 focus-within:border-mmt-red transition-all">
                     <label className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1 mb-1">
                        <Clock size={10} /> Time
                     </label>
                     <select 
                        value={newRide.time}
                        onChange={e => setNewRide({...newRide, time: e.target.value})}
                        className="w-full font-bold text-gray-800 bg-transparent outline-none appearance-none"
                     >
                        <option value="06:00 AM">06:00 AM</option>
                        <option value="07:00 AM">07:00 AM</option>
                        <option value="08:00 AM">08:00 AM</option>
                        <option value="09:00 AM">09:00 AM</option>
                        <option value="10:00 AM">10:00 AM</option>
                        <option value="02:00 PM">02:00 PM</option>
                        <option value="05:00 PM">05:00 PM</option>
                        <option value="08:00 PM">08:00 PM</option>
                     </select>
                   </div>
                </div>

                {/* Price */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 focus-within:border-mmt-red transition-all flex items-center justify-between">
                   <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1 mb-1">
                        <IndianRupee size={10} /> Price Per Seat
                      </label>
                      <input 
                       type="number" 
                       value={newRide.price} 
                       onChange={e => setNewRide({...newRide, price: parseInt(e.target.value)})} 
                       className="font-bold text-2xl text-gray-800 bg-transparent outline-none w-32" 
                      />
                   </div>
                   <div className="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-xs font-bold">
                      Est. Earn: ₹{(newRide.price * (user?.vehicleType === 'Tempo Traveler' ? 12 : 7)).toLocaleString()}
                   </div>
                </div>

                <button 
                  onClick={handlePublish}
                  className="w-full bg-gradient-to-r from-mmt-red to-mmt-darkRed text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl active:scale-95 transition flex items-center justify-center gap-2"
                >
                  Publish Ride <ChevronRight size={20} />
                </button>
             </div>
           </div>
        </div>
      )}
    </div>
  );
};