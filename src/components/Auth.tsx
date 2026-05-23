import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../supabase';
import { Smartphone, RefreshCw, KeyRound, Check, HelpCircle, ArrowRight, UserPlus, LogIn } from 'lucide-react';
import { User } from '../types';

interface AuthProps {
  onSuccess: (user: User) => void;
}

export default function Auth({ onSuccess }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Login variables
  const [mobileOrEmail, setMobileOrEmail] = useState('09171234567'); // Default demo account
  const [pin, setPin] = useState('');

  // Register variables
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regMobile, setRegMobile] = useState('');
  const [regPin, setRegPin] = useState('');
  const [refCode, setRefCode] = useState('');
  const [remember, setRemember] = useState(true);

  // OTP Verification Stage
  const [otpStage, setOtpStage] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [tempUserPayload, setTempUserPayload] = useState<{
    email: string;
    pin: string;
    name: string;
    mobile: string;
  } | null>(null);

  // FaceID/Biometrics Mock visual
  const [biometricScanning, setBiometricScanning] = useState(false);

  const handleKeypadPress = (val: string) => {
    if (pin.length < 4) {
      const newPin = pin + val;
      setPin(newPin);
      
      // Auto-submit if PIN reaches 4 digits on Login screen
      if (newPin.length === 4) {
        handleLogin(mobileOrEmail, newPin);
      }
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPin('');
  };

  const handleLogin = async (identifier: string, currentPin: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase.auth.signIn(identifier, currentPin);
      if (err) {
        setError(err.message);
        setPin('');
      } else if (data?.user) {
        if (!remember) {
          // If do not remember, clear session on reload (for sandbox simulation we keep track of storage)
        }
        onSuccess(data.user);
      }
    } catch (e: any) {
      setError(e.message || 'Verification failed');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  const triggerRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!regName || !regEmail || !regMobile || !regPin) {
      setError('Please fill in all general details');
      return;
    }
    if (regPin.length !== 4 || isNaN(Number(regPin))) {
      setError('Security PIN must be exactly 4 digits');
      return;
    }
    if (!regMobile.startsWith('09') || regMobile.length !== 11) {
      setError('Enter a valid 11-digit mobile number (e.g. 09171234567)');
      return;
    }

    // Trigger Simulated SMS Verification Flow
    const simulatedVerificationCode = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(simulatedVerificationCode);
    setTempUserPayload({
      name: regName,
      email: regEmail,
      mobile: regMobile,
      pin: regPin
    });

    // Alert / Event message so the user sees their code inside the sandbox preview!
    setTimeout(() => {
      // Create a nice styled system dialog simulated toast
      alert(`💬 SMS VERIFICATION CODE\nTo: ${regMobile}\nYour Jcash Security OTP registration code is: ${simulatedVerificationCode}`);
    }, 400);

    setOtpStage(true);
  };

  const handleOtpVerifySubmit = async () => {
    if (otpInput !== generatedOtp) {
      setError('Incorrect verification code. Please check your SMS and try again.');
      return;
    }

    if (!tempUserPayload) return;

    setLoading(true);
    setError(null);
    try {
      // Add referral tracking if refer code is specified
      if (refCode && refCode.trim().length > 0) {
        const referrals = JSON.parse(localStorage.getItem('jcash_referrals') || '[]');
        // Locate a referrer User
        const users = JSON.parse(localStorage.getItem('jcash_users') || '[]');
        const referrerUser = users.find((u: User) => u.name.toLowerCase().includes(refCode.toLowerCase()) || u.mobile === refCode);
        
        referrals.push({
          id: 'ref_' + Math.random().toString(36).substr(2, 9),
          referrer_id: referrerUser ? referrerUser.id : 'u1', // Default to Juan if not found to ensure rewards visual
          referee_mobile: tempUserPayload.mobile,
          status: 'pending', // Will switch to complete inside supabase.signUp implementation
          reward_amount: 100.00, // 100 PHP referee claim
          created_at: new Date().toISOString()
        });
        localStorage.setItem('jcash_referrals', JSON.stringify(referrals));
      }

      const { data, error: err } = await supabase.auth.signUp(
        tempUserPayload.email,
        tempUserPayload.pin,
        tempUserPayload.name,
        tempUserPayload.mobile
      );

      if (err) {
        setError(err.message);
        setOtpStage(false);
      } else if (data?.user) {
        onSuccess(data.user);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to complete registration');
    } finally {
      setLoading(false);
    }
  };

  const simulateBiometric = () => {
    setBiometricScanning(true);
    setTimeout(() => {
      setBiometricScanning(false);
      // Auto-log Juan Dela Cruz
      handleLogin('09171234567', '0917');
    }, 1500);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-sky-50 to-white text-slate-850 max-w-md mx-auto relative overflow-hidden md:rounded-[44px] md:border-8 md:border-slate-200 shadow-2xl font-sans">
      {/* Background gradients */}
      <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-sky-100 to-transparent pointer-events-none"></div>
      <div className="absolute top-1/3 right-4 w-48 h-48 bg-sky-200/20 rounded-full blur-3xl pointer-events-none"></div>

      {/* App Header Bar */}
      <div className="p-6 flex items-center justify-between border-b border-sky-100 bg-sky-50/85 backdrop-blur">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-600 to-sky-500 flex items-center justify-center font-display font-black text-white text-lg">
            J
          </div>
          <div>
            <h1 className="text-xl font-display font-extrabold text-slate-800">
              J<span className="text-sky-600">cash</span>
            </h1>
            <p className="text-[10px] text-slate-500 font-mono tracking-wider uppercase">e-Wallet</p>
          </div>
        </div>

        <button 
          onClick={() => {
            setIsLogin(!isLogin);
            setOtpStage(false);
            setError(null);
            setPin('');
          }}
          className="flex items-center gap-1 text-xs text-sky-600 font-medium px-2.5 py-1.5 rounded-lg bg-sky-100 border border-sky-200 hover:bg-sky-200"
        >
          {isLogin ? <UserPlus className="w-3.5 h-3.5" /> : <LogIn className="w-3.5 h-3.5" />}
          {isLogin ? 'Register' : 'Login'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col justify-center font-sans">
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs text-center"
          >
            {error}
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {/* OTP Verification Grid */}
          {otpStage ? (
            <motion.div
              key="otp"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-sky-100 border border-sky-200 flex items-center justify-center mx-auto text-sky-600">
                <Smartphone className="w-6 h-6 animate-bounce" />
              </div>

              <div>
                <h3 className="text-lg font-display font-bold text-slate-800">Verification Code</h3>
                <p className="text-xs text-slate-500 mt-1">
                  We have simulated sending an SMS OTP to <span className="text-sky-650 text-sky-600 font-semibold">{tempUserPayload?.mobile}</span>.
                </p>
              </div>

              <div className="space-y-4">
                <input
                  type="text"
                  maxLength={4}
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="0000"
                  className="w-full text-center tracking-[1.5em] font-mono text-2xl font-bold bg-white border border-sky-200 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-300 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />

                <div className="flex items-center justify-between text-xs text-slate-500">
                  <button 
                    onClick={() => {
                      const code = Math.floor(1000 + Math.random() * 9000).toString();
                      setGeneratedOtp(code);
                      alert(`💬 SMS VERIFICATION\nYour new Jcash verification OTP code is: ${code}`);
                    }}
                    className="flex items-center gap-1 hover:text-sky-700 text-sky-600 font-medium"
                  >
                    <RefreshCw className="w-3 h-3" /> Resend Code
                  </button>
                  <button 
                    onClick={() => setOtpStage(false)}
                    className="text-slate-500 hover:text-slate-700"
                  >
                    Change Details
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleOtpVerifySubmit}
                disabled={loading || otpInput.length !== 4}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 text-white font-medium text-sm flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition shadow-lg shadow-sky-500/10"
              >
                {loading ? 'Processing...' : 'Verify & Setup Wallet'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          ) : isLogin ? (
            /* Login Screen */
            <motion.div
              key="login"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="text-center space-y-1">
                <h2 className="text-2xl font-display font-extrabold text-slate-800">Welcome back</h2>
                <p className="text-slate-650 text-slate-500 text-xs">Enter your Jcash account & 4-digit PIN</p>
              </div>

              {/* Account selection input */}
              <div className="space-y-2">
                <label className="text-xs text-slate-600 font-medium">Mobile Number or Email</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs font-mono">PH</span>
                  <input
                    type="text"
                    value={mobileOrEmail}
                    onChange={(e) => setMobileOrEmail(e.target.value)}
                    placeholder="e.g. 09171234567 or email"
                    className="w-full bg-white border border-sky-200 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  />
                </div>
                {/* Demo quick selector */}
                <div className="flex gap-2 justify-end mt-1">
                  <button 
                    onClick={() => { setMobileOrEmail('09171234567'); setPin(''); }}
                    className="text-[10px] text-sky-600 hover:text-sky-700 hover:underline"
                  >
                    👤 Demo User
                  </button>
                  <span className="text-[10px] text-slate-300">•</span>
                  <button 
                    onClick={() => { setMobileOrEmail('admin@jcash.com'); setPin(''); }}
                    className="text-[10px] text-amber-600 hover:text-amber-700 hover:underline"
                  >
                    👑 Demo Admin
                  </button>
                </div>
              </div>

              {/* PIN circles indicator */}
              <div className="space-y-3 font-sans">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">Verify Security PIN</span>
                  <button onClick={() => setPin('')} className="text-slate-500 hover:text-slate-800 text-xs hover:underline">Reset</button>
                </div>
                <div className="flex justify-center gap-4 py-3 bg-sky-50/50 rounded-xl border border-sky-100">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-4.5 h-4.5 rounded-full border-2 transition-all duration-150 ${
                        pin.length > i
                          ? 'bg-gradient-to-r from-blue-500 to-sky-500 border-transparent scale-110 shadow-[0_0_10px_rgba(14,165,233,0.3)]'
                          : 'border-slate-300'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Credentials / Keypad Switch UI */}
              <div className="grid grid-cols-3 gap-3.5 max-w-[280px] mx-auto py-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleKeypadPress(val)}
                    disabled={loading || pin.length >= 4}
                    className="w-14 h-14 rounded-full bg-white border border-sky-100 flex items-center justify-center text-xl font-display font-medium text-slate-800 hover:bg-sky-50 cursor-pointer active:scale-95 transition shadow-sm"
                  >
                    {val}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={simulateBiometric}
                  className="w-14 h-14 rounded-full flex items-center justify-center text-slate-400 hover:text-sky-600 active:scale-95 transition"
                  title="Simulate Biometric Login"
                >
                  <KeyRound className={`w-6 h-6 ${biometricScanning ? 'text-sky-600 animate-spin' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={() => handleKeypadPress('0')}
                  disabled={loading || pin.length >= 4}
                  className="w-14 h-14 rounded-full bg-white border border-sky-100 flex items-center justify-center text-xl font-display font-medium text-slate-800 hover:bg-sky-50 cursor-pointer active:scale-95 transition shadow-sm"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handleBackspace}
                  className="w-14 h-14 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 active:scale-95 transition text-xs font-mono font-bold"
                >
                  DEL
                </button>
              </div>

              <div className="flex items-center justify-between text-xs px-2 text-slate-500">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="accent-sky-500"
                  />
                  <span>Remember user session</span>
                </label>
                <button 
                  type="button"
                  onClick={() => alert(`🔑 Security Help:\n\nDefault Demo User account:\n- Mobile: 09171234567\n- Security PIN: 0917\n\nDefault Admin account:\n- Email: admin@jcash.com\n- Security PIN: 8888`)}
                  className="text-slate-500 hover:text-slate-800 flex items-center gap-0.5"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-sky-600" />
                   PIN help?
                </button>
              </div>
            </motion.div>
          ) : (
            /* Register Screen */
            <motion.form
              key="register"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={triggerRegisterSubmit}
              className="space-y-4 text-left font-sans"
            >
              <div className="text-center space-y-0.5">
                <h2 className="text-xl font-display font-bold text-slate-800 font-sans">Create Account</h2>
                <p className="text-slate-500 text-xs font-sans">A 500 Peso signup bonus will be auto-credited!</p>
              </div>

              <div className="space-y-3.5">
                <div>
                  <label className="text-[11px] text-slate-600 font-mono tracking-wider uppercase font-semibold">Full legal name</label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Cardo Dalisay"
                    className="w-full bg-white border border-sky-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-600 font-mono tracking-wider uppercase font-semibold">Email address</label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="cardo@jcash.com"
                    className="w-full bg-white border border-sky-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-600 font-mono tracking-wider uppercase font-semibold">Mobile number</label>
                    <input
                      type="tel"
                      required
                      maxLength={11}
                      value={regMobile}
                      onChange={(e) => setRegMobile(e.target.value.replace(/\D/g, ''))}
                      placeholder="09171234567"
                      className="w-full bg-white border border-sky-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-600 font-mono tracking-wider uppercase font-semibold">Setup 4-digit PIN</label>
                    <input
                      type="password"
                      required
                      maxLength={4}
                      value={regPin}
                      onChange={(e) => setRegPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••"
                      className="w-full text-center tracking-widest bg-white border border-sky-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-slate-600 font-mono tracking-wider uppercase font-semibold">Referral Code (Optional)</label>
                  <input
                    type="text"
                    value={refCode}
                    onChange={(e) => setRefCode(e.target.value)}
                    placeholder="Enter referral code or friend name"
                    className="w-full bg-white border border-sky-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-sky-500"
                  />
                  <p className="text-[10px] text-sky-600 mt-1 font-medium">Get an extra ₱100.00 referral voucher upon setup.</p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 hover:opacity-95 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  Confirm Account Registration
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>

      {/* Safety Notice Footer */}
      <div className="p-4 bg-sky-50/50 text-center border-t border-sky-100 text-[10px] text-slate-500 font-sans">
        Jcash is regulated by Bangko Sentral ng Pilipinas (BSP). All wallets are protected by deposit guarantee insurances under Philippine legal directives.
      </div>
    </div>
  );
}
