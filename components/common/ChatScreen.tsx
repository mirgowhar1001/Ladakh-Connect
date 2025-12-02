import React, { useState, useEffect, useRef } from 'react';
import { Send, ChevronLeft } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface ChatScreenProps {
  tripId: string;
  onBack: () => void;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({ tripId, onBack }) => {
  const { trips, user, sendMessage } = useApp();
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const trip = trips.find(t => t.id === tripId);
  
  // Determine the other person's name
  const otherName = user?.role === 'passenger' ? trip?.driverName : trip?.passengerId;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [trip?.messages]);

  const handleSend = () => {
    if (inputText.trim()) {
      sendMessage(tripId, inputText);
      setInputText('');
    }
  };

  if (!trip) return null;

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Chat Header */}
      <div className="bg-white p-4 shadow-sm flex items-center gap-3 sticky top-0 z-50">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition">
          <ChevronLeft size={24} className="text-gray-600" />
        </button>
        <div>
           <h2 className="font-bold text-gray-800">{otherName}</h2>
           <p className="text-xs text-green-600 flex items-center gap-1">
             <span className="w-2 h-2 rounded-full bg-green-500"></span> Active Trip
           </p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#e5ddd5]">
        {trip.messages && trip.messages.length > 0 ? (
           trip.messages.map(msg => {
             const isMe = msg.senderId === user?.name;
             return (
               <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                 <div className={`max-w-[80%] p-3 rounded-2xl text-sm shadow-sm relative ${isMe ? 'bg-[#dcf8c6] text-gray-800 rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none'}`}>
                   <p>{msg.text}</p>
                   <p className={`text-[10px] mt-1 text-right text-gray-400`}>
                     {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                   </p>
                 </div>
               </div>
             );
           })
        ) : (
          <div className="text-center mt-10">
            <div className="bg-white/60 inline-block px-4 py-2 rounded-lg text-xs text-gray-500 shadow-sm">
              Start chatting with your {user?.role === 'passenger' ? 'driver' : 'passenger'}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 bg-white border-t border-gray-100 pb-8">
        <div className="flex items-center gap-2 bg-gray-100 px-2 py-2 rounded-3xl">
          <input 
            type="text" 
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            className="flex-1 bg-transparent px-4 py-2 outline-none text-sm text-gray-800"
          />
          <button 
            onClick={handleSend} 
            disabled={!inputText.trim()}
            className={`p-3 rounded-full text-white shadow-md transition transform active:scale-95 ${inputText.trim() ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400'}`}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};