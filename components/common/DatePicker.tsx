import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface DatePickerProps {
  label: string;
  selectedDate: string;
  onDateSelect: (date: string) => void;
}

export const DatePicker: React.FC<DatePickerProps> = ({ label, selectedDate, onDateSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate || new Date()));

  const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const handleDateClick = (day: number) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    // Adjust for timezone offset to ensure the date string is correct locally
    const offset = newDate.getTimezoneOffset();
    const localDate = new Date(newDate.getTime() - (offset * 60 * 1000));
    const formatted = localDate.toISOString().split('T')[0];
    onDateSelect(formatted);
    setIsOpen(false);
  };

  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  // Generate calendar grid
  const renderCalendar = () => {
    const totalDays = daysInMonth(currentMonth);
    const startDay = firstDayOfMonth(currentMonth);
    const blanks = Array(startDay).fill(null);
    const days = Array.from({ length: totalDays }, (_, i) => i + 1);
    
    return [...blanks, ...days];
  };

  // Format display date (e.g., "12 Oct 23")
  const dateObj = new Date(selectedDate);
  const displayDate = dateObj.toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: '2-digit'
  });
  
  const displayDayName = dateObj.toLocaleDateString('en-GB', {
    weekday: 'long'
  });

  return (
    <div className="relative">
      <div 
        onClick={() => setIsOpen(true)}
        className="cursor-pointer"
      >
        <span className="text-[10px] text-gray-400 font-bold tracking-wider uppercase mb-1 block flex items-center gap-1">
             {label}
        </span>
        <div className="flex items-baseline gap-2">
          <span className="font-bold text-xl text-gray-800">{displayDate.split(' ')[0]}</span>
          <span className="text-lg font-medium text-gray-600">{displayDate.split(' ')[1]}</span>
          <span className="text-lg text-gray-400">'{displayDate.split(' ')[2]}</span>
        </div>
        <p className="text-xs text-gray-400 mt-0.5">{displayDayName}</p>
      </div>

      {/* Modal/Popup */}
      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 duration-300">
            <div className="bg-gradient-to-r from-mmt-red to-mmt-darkRed p-4 flex justify-between items-center text-white">
              <h3 className="font-bold">Select Date</h3>
              <button onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} className="p-1 hover:bg-white/20 rounded-full">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-full text-gray-600">
                  <ChevronLeft size={20} />
                </button>
                <span className="font-bold text-gray-800">
                  {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </span>
                <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-full text-gray-600">
                  <ChevronRight size={20} />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                  <div key={d} className="text-center text-xs font-bold text-gray-400 py-2">{d}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {renderCalendar().map((day, idx) => {
                  if (!day) return <div key={idx} className="h-10"></div>;
                  
                  const dateToCheck = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                  // Fix date string comparison by resetting hours
                  const today = new Date();
                  today.setHours(0,0,0,0);
                  
                  const offset = dateToCheck.getTimezoneOffset();
                  const localDate = new Date(dateToCheck.getTime() - (offset * 60 * 1000));
                  const dateStr = localDate.toISOString().split('T')[0];

                  const isSelected = dateStr === selectedDate;
                  const isToday = dateStr === new Date().toISOString().split('T')[0];
                  const isPast = dateToCheck < today;

                  return (
                    <button
                      key={idx}
                      disabled={isPast}
                      onClick={() => handleDateClick(day)}
                      className={`h-10 rounded-lg flex items-center justify-center text-sm font-medium transition-all
                        ${isSelected ? 'bg-mmt-red text-white font-bold shadow-md' : ''}
                        ${!isSelected && isToday ? 'border border-mmt-red text-mmt-red' : ''}
                        ${!isSelected && !isPast ? 'hover:bg-gray-100 text-gray-800' : ''}
                        ${isPast ? 'text-gray-300 cursor-not-allowed' : ''}
                      `}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
              
              <button 
                onClick={() => setIsOpen(false)}
                className="w-full mt-6 py-3 rounded-xl bg-gray-100 text-gray-600 font-bold hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};