import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, ShieldCheck, Loader2, ArrowRight, MapPin, AlertCircle, RefreshCw, Copy, ExternalLink } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { auth, googleProvider, db } from '../../firebase';
import { RecaptchaVerifier, signInWithPhoneNumber, signInWithPopup, ConfirmationResult } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

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
            // Don't show error immediately to user, just log it
        }
    };

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

  const handleAuthError = (err: any) => {
    console.error("Auth Error", err);
    if (err.code === 'auth/unauthorized-domain') {
      const domain = window.location.hostname;
      if (domain) {
        setError(`⚠️ Domain Blocked: "${domain}". If you JUST added this to Firebase, please wait 15 minutes for the settings to update everywhere.`);
      } else {
        setError(`⚠️ Domain Blocked. We cannot detect a valid domain name (it appears empty). This often happens in preview windows. Try opening the app in a full browser tab.`);
      }
    } else if (err.code === 'auth/popup-closed-by-user') {
      setError("Sign-in cancelled.");
    } else if (err.code === 'auth/invalid-phone-number') {
      setError("Invalid Phone Number.");
    } else if (err.code === 'auth/too-many-requests') {
      setError("Too many attempts. Try again later.");
    } else {
      setError(err.message || "Authentication failed. Please try again.");
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Check if user profile exists in Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (userDoc.exists()) {
        // AppContext will handle the state update automatically via onAuthStateChanged
        // But we wait a moment to ensure smooth transition
        setLoading(true); 
      } else {
        // New user - prefill name and go to details
        if (user.displayName) setName(user.displayName);
        setStep('DETAILS');
        setLoading(false);
      }
    } catch (err: any) {
      handleAuthError(err);
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

    if (!window.recaptchaVerifier) {
        try {
             const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', { 'size': 'invisible' });
             window.recaptchaVerifier = verifier;
        } catch(e) {
             setError("System initializing... please wait 2 seconds and click again.");
             setLoading(false);
             return;
        }
    }

    const appVerifier = window.recaptchaVerifier;
    if (!appVerifier) {
         setError("Security check failed. Please refresh.");
         setLoading(false);
         return;
    }

    try {
        const confirmation = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
        setConfirmResult(confirmation);
        setLoading(false);
        setStep('OTP');
    } catch (error: any) {
        handleAuthError(error);
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
        setError("Session expired. Request OTP again.");
        setStep('MOBILE');
        return;
    }

    setLoading(true);
    try {
        const result = await confirmResult.confirm(otpString);
        // Check if user exists
        const userDoc = await getDoc(doc(db, 'users', result.user.uid));
        if (userDoc.exists()) {
           // Auto login via listener
        } else {
           setLoading(false);
           setStep('DETAILS');
        }
    } catch (error: any) {
        setLoading(false);
        setError("Incorrect OTP. Please check.");
    }
  };

  const handleCompleteProfile = () => {
    setError(null);
    if (!name) {
        setError("Please enter your name");
        return;
    }
    if (!mobile && step === 'DETAILS') {
       // If coming from Google Login, mobile might be empty
       setError("Please enter your mobile number");
       return;
    }
    if (role === 'owner' && !vehicleNo) {
        setError("Please enter vehicle number");
        return;
    }
    
    setLoading(true);
    // Call login from AppContext to write to Firestore
    login(role, { 
      name, 
      mobile, 
      vehicleNo: role === 'owner' ? vehicleNo : undefined,
      vehicleType: role === 'owner' ? vehicleType : undefined
    }).catch(err => {
      setError("Failed to save profile.");
      setLoading(false);
    });
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
               <div className="flex-1">
                 <p className="leading-relaxed">{error}</p>
                 
                 {error.includes('Domain Blocked') && window.location.hostname && (
                   <div className="mt-2 bg-white/80 p-2 rounded border border-red-200 flex items-center justify-between">
                     <code className="text-[10px] font-bold bg-gray-100 px-1 py-0.5 rounded">{window.location.hostname}</code>
                     <button 
                       onClick={() => navigator.clipboard.writeText(window.location.hostname)}
                       className="text-[10px] bg-red-100 px-2 py-1 rounded font-bold hover:bg-red-200 flex items-center gap-1"
                     >
                       <Copy size={10} /> Copy
                     </button>
                   </div>
                 )}

                 {error.includes('Domain Blocked') && !window.location.hostname && (
                    <div className="mt-2 text-[10px] text-gray-500 bg-white/50 p-2 rounded border border-red-100">
                        <p className="font-bold mb-1">Why is it empty?</p>
                        <p>You are likely running this in a preview window that hides the address. Please open this app in a separate browser tab to fix it.</p>
                        {window.location.href && (
                            <div className="mt-2 pt-2 border-t border-red-100">
                                <p className="font-bold">Internal URL (for debugging):</p>
                                <code className="break-all">{window.location.href}</code>
                            </div>
                        )}
                    </div>
                 )}
               </div>
            </div>
          )}

          {/* Step 1: Mobile Number & Google */}
          {step === 'MOBILE' && (
            <div className="animate-in fade-in slide-in-from-right duration-300">
              <h2 className="text-xl font-bold text-gray-800 mb-2">Login or Signup</h2>
              <p className="text-gray-400 text-sm mb-6">Enter your mobile number to proceed</p>
              
              <div className="mb-6">
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
                {loading ? <Loader2 className="animate-spin" /> : 'Get OTP'} 
                {!loading && <ArrowRight size={20} />}
              </button>

              <div className="flex items-center gap-4 my-6">
                <div className="h-[1px] bg-gray-200 flex-1"></div>
                <span className="text-gray-400 text-xs font-bold uppercase">OR</span>
                <div className="h-[1px] bg-gray-200 flex-1"></div>
              </div>

              <button 
                onClick={handleGoogleLogin}
                className="w-full bg-white border border-gray-200 text-gray-700 py-3.5 rounded-xl font-bold text-base shadow-sm hover:bg-gray-50 active:scale-95 transition flex items-center justify-center gap-3"
              >
                 <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Sign in with Google
              </button>
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
               <h2 className="text-xl font-bold text-gray-800 mb-2">Complete Profile</h2>
               <p className="text-gray-400 text-xs mb-6">Just a few more details to get started.</p>
               
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
                 
                 {/* Ask for mobile if not already set (e.g. from Google Login) */}
                 {(!mobile || step === 'DETAILS') && (
                    <div>
                      <label className="text-xs font-bold text-gray-400 uppercase">Mobile Number</label>
                      <input 
                          type="tel" 
                          value={mobile}
                          onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                          className="w-full py-3 border-b-2 border-gray-200 focus:border-mmt-red outline-none font-bold text-gray-800 bg-transparent"
                          placeholder="99999 99999"
                          maxLength={10}
                      />
                    </div>
                 )}
                 
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