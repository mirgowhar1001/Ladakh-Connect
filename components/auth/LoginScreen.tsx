import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, ShieldCheck, Loader2, ArrowRight, MapPin, AlertCircle, RefreshCw } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { auth } from '../../firebase';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';

declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier | null;
  }
}

export const LoginScreen: React.FC = () => {
  const { login } = useApp();
  const [step, setStep] = useState<'MOBILE' | 'OTP' | 'DETAILS'>('MOBILE');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form State
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [name, setName] = useState('');
  const [role, setRole] = useState<'passenger' | 'owner'>('passenger');
  const [vehicleNo, setVehicleNo] = useState('');
  const [vehicleType, setVehicleType] = useState('Innova Crysta');
  
  // Firebase State
  const [confirmResult, setConfirmResult] = useState<ConfirmationResult | null>(null);
  const verifierRef = useRef<RecaptchaVerifier | null>(null);

  // Initialize Recaptcha
  useEffect(() => {
    const initRecaptcha = () => {
        if (!auth) return;
        const container = document.getElementById('recaptcha-container');
        if (!container) return;

        try {
            // Clear existing verifier to prevent "reCAPTCHA has already been rendered in this element"
            if (window.recaptchaVerifier) {
                try {
                    window.recaptchaVerifier.clear();
                } catch (e) {
                    console.warn("Error clearing recaptcha", e);
                }
                window.recaptchaVerifier = null;
            }

            const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                'size': 'invisible',
                'callback': () => {
                    // reCAPTCHA solved
                    console.log("Recaptcha solved");
                },
                'expired-callback': () => {
                   setError("Recaptcha expired. Please refresh the page.");
                   setLoading(false);
                }
            });
            
            window.recaptchaVerifier = verifier;
            verifierRef.current = verifier;
            
        } catch (err) {
            console.error("Recaptcha Init Error", err);
            setError("Security check failed to initialize. Please refresh.");
        }
    };

    // Small timeout to ensure DOM is fully ready
    const timer = setTimeout(initRecaptcha, 500);

    return () => {
        clearTimeout(timer);
        if (window.recaptchaVerifier) {
            try {
                window.recaptchaVerifier.clear();
            } catch (e) {}
            window.recaptchaVerifier = null;
        }
    };
  }, []);

  // Auto-focus OTP
  const handleOtpChange = (element: HTMLInputElement, index: number) => {
    if (isNaN(Number(element.value))) return;
    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);
    if (element.nextSibling && element.value) {
      (element.nextSibling as HTMLElement).focus();
    }
  };

  const handleSendOtp = async () => {
    setError(null);
    if (mobile.length < 10) {
        setError("Please enter a valid 10-digit number");
        return;
    }
    
    setLoading(true);
    const phoneNumber = '+91' + mobile;

    // Robust check for verifier
    if (!window.recaptchaVerifier) {
        console.warn("Recaptcha not found, attempting re-init");
        try {
             const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', { 'size': 'invisible' });
             window.recaptchaVerifier = verifier;
        } catch(e) {
             console.error(e);
             setError("System initializing... please wait 2 seconds and click again.");
             setLoading(false);
             return;
        }
    }

    const appVerifier = window.recaptchaVerifier;
    if (!appVerifier) {
         setError("Critical Error: Security verifier failed. Please refresh the page.");
         setLoading(false);
         return;
    }

    try {
        const confirmation = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
        setConfirmResult(confirmation);
        setLoading(false);
        setStep('OTP');
    } catch (error: any) {
        console.error("Error sending OTP", error);
        setLoading(false);
        
        // Detailed Error Handling
        if (error.code === 'auth/internal-error') {
            setError("Configuration Error: This domain is not authorized in Firebase Console. Add it to Authentication > Settings > Authorized Domains.");
        } else if (error.code === 'auth/invalid-phone-number') {
            setError("Invalid Phone Number. Do not add +91 prefix manually.");
        } else if (error.code === 'auth/too-many-requests') {
            setError("Too many attempts. Please try again later.");
        } else if (error.message && error.message.includes('reCAPTCHA')) {
            setError("Verification failed. Please refresh and try again.");
        } else {
            setError(error.message || "Failed to send OTP. Please try again.");
        }

        // Force clear recaptcha on error so it can re-render
        if (window.recaptchaVerifier) {
            try {
                window.recaptchaVerifier.clear();
            } catch(e) {}
            window.recaptchaVerifier = null;
        }
    }
  };

  const handleVerifyOtp = async () => {
    setError(null);
    const otpString = otp.join('');
    if (otpString.length !== 4 && otpString.length !== 6) {
        setError("Please enter the complete OTP");
        return;
    }
    
    if (!confirmResult) {
        setError("Session expired. Please request OTP again.");
        setStep('MOBILE');
        return;
    }

    setLoading(true);
    try {
        await confirmResult.confirm(otpString);
        setLoading(false);
        setStep('DETAILS');
    } catch (error: any) {
        console.error("Error verifying OTP", error);
        setLoading(false);
        if (error.code === 'auth/invalid-verification-code') {
            setError("Incorrect OTP. Please check the SMS.");
        } else {
            setError("Verification failed. Please try again.");
        }
    }
  };

  const handleCompleteProfile = () => {
    setError(null);
    if (!name) {
        setError("Please enter your name");
        return;
    }
    if (role === 'owner' && !vehicleNo) {
        setError("Please enter vehicle number");
        return;
    }
    
    setLoading(true);
    // Simulate API call for profile update
    setTimeout(() => {
      if (role === 'passenger') {
        login('passenger', { name, mobile });
      } else {
        login('owner', { name, mobile, vehicleNo, vehicleType });
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col relative">
      <div id="recaptcha-container"></div>
      
      {/* Dynamic Background */}
      <div className="h-[45vh] bg-gradient-to-br from-mmt-red to-mmt-darkRed relative overflow-hidden rounded-b-[40px] shadow-2xl">
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black/10 to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full h-24 bg-white/10 skew-y-3 origin-bottom-left"></div>
        <div className="absolute bottom-10 right-0 w-full h-24 bg-white/10 -skew-y-3 origin-bottom-right"></div>
        
        <div className="relative z-10 flex flex-col items-center justify-center h-full pb-16 text-white">
          <div className="w-24 h-24 bg-white/20 backdrop-blur-md p-3 rounded-full mb-5 border border-white/30 shadow-2xl relative overflow-hidden ring-4 ring-white/10 flex items-center justify-center">
             <div className="w-full h-full rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 border-2 border-white/50 flex items-center justify-center shadow-inner">
                <MapPin className="text-white drop-shadow-md" size={32} fill="currentColor" />
             </div>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight drop-shadow-md">Ladakh Connect</h1>
          <p className="text-white/90 text-sm mt-2 tracking-[0.2em] uppercase font-bold drop-shadow-sm">Experience the Journey</p>
        </div>
      </div>

      {/* Card Content */}
      <div className="flex-1 px-6 -mt-20 relative z-20">
        <div className="bg-white rounded-[2rem] shadow-floating p-8 min-h-[340px]">
          
          {error && (
            <div className="mb-6 bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-xs font-medium flex items-start gap-3 animate-in slide-in-from-top-2">
               <AlertCircle size={18} className="mt-0.5 shrink-0" />
               <p className="leading-relaxed">{error}</p>
            </div>
          )}

          {/* Step 1: Mobile Number */}
          {step === 'MOBILE' && (
            <div className="animate-in fade-in slide-in-from-right duration-300">
              <h2 className="text-xl font-bold text-gray-800 mb-2">Login or Signup</h2>
              <p className="text-gray-400 text-sm mb-8">Enter your mobile number to proceed</p>
              
              <div className="mb-8">
                 <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Mobile Number</label>
                 <div className="flex items-center border-b-2 border-gray-200 focus-within:border-mmt-red transition-colors py-2">
                    <span className="text-gray-800 font-bold mr-3 text-xl">+91</span>
                    <input 
                      type="tel" 
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                      className="flex-1 outline-none font-bold text-2xl text-black bg-transparent placeholder-gray-300"
                      placeholder="99999 99999"
                      maxLength={10}
                    />
                 </div>
              </div>

              <button 
                onClick={handleSendOtp}
                disabled={loading || mobile.length < 10}
                className="w-full bg-gradient-to-r from-mmt-red to-mmt-darkRed text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl active:scale-95 transition flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="animate-spin" /> : 'Continue'} 
                {!loading && <ArrowRight size={20} />}
              </button>
              
              <p className="text-center text-xs text-gray-400 mt-6">
                By proceeding, you agree to our Terms & Privacy Policy
              </p>
            </div>
          )}

          {/* Step 2: OTP */}
          {step === 'OTP' && (
            <div className="animate-in fade-in slide-in-from-right duration-300">
              <button onClick={() => setStep('MOBILE')} className="text-gray-400 text-sm mb-4 flex items-center gap-1 hover:text-gray-600">
                <ChevronRight className="rotate-180" size={14} /> Edit Number
              </button>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Verify OTP</h2>
              <p className="text-gray-400 text-sm mb-8">Sent to <span className="font-bold text-gray-800">+91 {mobile}</span></p>

              <div className="flex justify-between gap-3 mb-8">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(e.target, index)}
                    onFocus={(e) => e.target.select()}
                    className="w-14 h-14 border-2 border-gray-200 rounded-xl text-center text-2xl font-bold focus:border-mmt-red focus:ring-4 focus:ring-red-50 outline-none transition-all bg-white text-black"
                  />
                ))}
              </div>

              <button 
                onClick={handleVerifyOtp}
                disabled={loading}
                className="w-full bg-gradient-to-r from-mmt-red to-mmt-darkRed text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl active:scale-95 transition flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {loading ? <Loader2 className="animate-spin" /> : 'Verify & Login'}
              </button>
              
              <div className="text-center mt-6">
                 <button 
                    onClick={handleSendOtp} 
                    disabled={loading}
                    className="text-mmt-red text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-1 mx-auto"
                 >
                    <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Resend OTP
                 </button>
              </div>
            </div>
          )}

          {/* Step 3: Profile Completion */}
          {step === 'DETAILS' && (
            <div className="animate-in fade-in slide-in-from-right duration-300">
               <h2 className="text-xl font-bold text-gray-800 mb-6">Complete Profile</h2>
               
               {/* Role Selector */}
               <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
                 <button 
                   onClick={() => setRole('passenger')}
                   className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${role === 'passenger' ? 'bg-white shadow text-mmt-red' : 'text-gray-400'}`}
                 >
                   Passenger
                 </button>
                 <button 
                   onClick={() => setRole('owner')}
                   className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${role === 'owner' ? 'bg-white shadow text-mmt-blue' : 'text-gray-400'}`}
                 >
                   Driver
                 </button>
               </div>

               <div className="space-y-4">
                 <div>
                   <label className="text-xs font-bold text-gray-400 uppercase">Full Name</label>
                   <input 
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full py-3 border-b-2 border-gray-200 focus:border-mmt-red outline-none font-bold text-gray-800 bg-transparent"
                      placeholder="e.g. Tenzin"
                   />
                 </div>
                 
                 {role === 'owner' && (
                   <div className="animate-in fade-in slide-in-from-top duration-300 space-y-4">
                      <div>
                        <label className="text-xs font-bold text-gray-400 uppercase">Vehicle Number</label>
                        <input 
                            type="text" 
                            value={vehicleNo}
                            onChange={(e) => setVehicleNo(e.target.value)}
                            className="w-full py-3 border-b-2 border-gray-200 focus:border-mmt-blue outline-none font-bold text-gray-800 uppercase bg-transparent"
                            placeholder="JK-10-XXXX"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-400 uppercase">Vehicle Type</label>
                        <select 
                            value={vehicleType}
                            onChange={(e) => setVehicleType(e.target.value)}
                            className="w-full py-3 border-b-2 border-gray-200 focus:border-mmt-blue outline-none font-bold text-gray-800 bg-transparent"
                        >
                            <option value="Innova Crysta">Innova Crysta</option>
                            <option value="Mahindra Xylo">Mahindra Xylo</option>
                            <option value="Tempo Traveler">Tempo Traveler</option>
                            <option value="Toyota Innova">Toyota Innova</option>
                        </select>
                      </div>
                   </div>
                 )}
               </div>

               <button 
                onClick={handleCompleteProfile}
                disabled={loading}
                className={`w-full mt-8 text-white py-4 rounded-xl font-bold text-lg shadow-lg active:scale-95 transition flex items-center justify-center gap-2 disabled:opacity-70 ${role === 'passenger' ? 'bg-mmt-red hover:bg-red-700' : 'bg-mmt-blue hover:bg-blue-700'}`}
              >
                {loading ? <Loader2 className="animate-spin" /> : 'Get Started'}
              </button>
            </div>
          )}

        </div>
      </div>
      
      {/* Footer Branding */}
      <div className="py-6 text-center">
        <div className="flex justify-center items-center gap-2 text-gray-400 mb-2">
           <ShieldCheck size={16} />
           <span className="text-xs font-medium">100% Secure Payments via App Vault</span>
        </div>
      </div>
    </div>
  );
};