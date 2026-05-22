import { useState } from 'react';
import { motion } from 'motion/react';
import { User, Wallet } from '../types';
import { supabase } from '../supabase';
import { 
  User as UserIcon, Shield, Sparkles, Smartphone, LogOut, CheckCircle2, CreditCard, KeyRound, Globe, ExternalLink
} from 'lucide-react';

interface ProfileViewProps {
  currentUser: User;
  wallet: Wallet;
  onLogout: () => void;
}

export default function ProfileView({ currentUser, wallet, onLogout }: ProfileViewProps) {
  // Toggle states
  const [biometricsEnabled, setBiometricsEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  
  const [bpiLinked, setBpiLinked] = useState(true);
  const [bdoLinked, setBdoLinked] = useState(false);

  const handleLinkToggle = (bank: 'bpi' | 'bdo') => {
    if (bank === 'bpi') {
      setBpiLinked(!bpiLinked);
      alert(`🏦 Bank adjustment: ${!bpiLinked ? 'Linked' : 'Removed'} BPI Account Connection.`);
    } else {
      setBdoLinked(!bdoLinked);
      alert(`🏦 Bank adjustment: ${!bdoLinked ? 'Linked' : 'Removed'} BDO Account Connection.`);
    }
  };

  const handleResetPin = () => {
    const newPin = prompt("Enter a new 4-digit security login PIN:", currentUser.pin);
    if (!newPin) return;

    if (newPin.length !== 4 || isNaN(Number(newPin))) {
      alert("⚠️ Error: Security PIN must be exactly 4 digits");
      return;
    }

    try {
      const users = JSON.parse(localStorage.getItem('jcash_users') || '[]');
      const idx = users.findIndex((u: any) => u.id === currentUser.id);
      if (idx !== -1) {
        users[idx].pin = newPin;
        localStorage.setItem('jcash_users', JSON.stringify(users));
        // Update session user copy
        const currentSession = { ...currentUser, pin: newPin };
        localStorage.setItem('jcash_current_user', JSON.stringify(currentSession));
        alert(`✅ Success: Your login security PIN was successfully changed to ${newPin}!`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const executeLogout = async () => {
    if (confirm("Are you sure you want to sign out from Jcash?")) {
      await supabase.auth.signOut();
      onLogout();
    }
  };

  return (
    <div className="space-y-4">
      {/* Account Info Header Card */}
      <div className="p-4 bg-slate-900 border border-slate-805 rounded-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img 
            src={currentUser.avatar} 
            alt={currentUser.name} 
            className="w-12 h-12 rounded-full border-2 border-cyan-400 shrink-0 object-cover" 
          />
          <div>
            <div className="flex items-center gap-1">
              <h4 className="text-sm font-bold text-white font-display leading-tight">{currentUser.name}</h4>
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" title="BSP KYC Verified Account" />
            </div>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">{currentUser.mobile}</p>
            <span className="text-[9px] mt-1 inline-block px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/30 font-semibold font-mono">
              KYC FULLY VERIFIED USER
            </span>
          </div>
        </div>

        <span className="text-[9px] px-2 py-1 bg-slate-800 border border-white/5 rounded-lg font-mono text-slate-400 uppercase font-semibold">
          {currentUser.role === 'admin' ? '⚜️ Admin' : '👤 User'}
        </span>
      </div>

      {/* Linked financial partners card */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-805 space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-white/5">
          <CreditCard className="w-4 h-4 text-cyan-400" />
          <h5 className="text-[11px] font-mono tracking-wider uppercase font-bold text-slate-300">Linked Funding sources</h5>
        </div>

        <div className="space-y-2.5">
          {/* BPI Linked */}
          <div className="flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-slate-200">Bank of the Philippine Islands (BPI)</span>
              <p className="text-[10px] text-slate-500">Account Ending in •••• 8291</p>
            </div>
            <button
              onClick={() => handleLinkToggle('bpi')}
              className={`px-3 py-1 rounded-lg text-[10px] font-bold transition ${
                bpiLinked 
                  ? 'bg-rose-950/40 text-rose-400 border border-rose-800/30' 
                  : 'bg-cyan-950/40 text-cyan-400 border border-cyan-800/30'
              }`}
            >
              {bpiLinked ? 'Unlink' : 'Link Account'}
            </button>
          </div>

          {/* BDO Linked */}
          <div className="flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-slate-200">Banco de Oro (BDO Unibank)</span>
              <p className="text-[10px] text-slate-500">Not linked. Add instant credentials.</p>
            </div>
            <button
              onClick={() => handleLinkToggle('bdo')}
              className={`px-3 py-1 rounded-lg text-[10px] font-bold transition ${
                bdoLinked 
                  ? 'bg-rose-950/40 text-rose-400 border border-rose-800/30' 
                  : 'bg-cyan-950/40 text-cyan-400 border border-cyan-800/30'
              }`}
            >
              {bdoLinked ? 'Unlink' : 'Link Account'}
            </button>
          </div>
        </div>
      </div>

      {/* Security Preferences Card */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-805 space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-white/5">
          <Shield className="w-4 h-4 text-cyan-400" />
          <h5 className="text-[11px] font-mono tracking-wider uppercase font-bold text-slate-300">Wallet Security Parameters</h5>
        </div>

        <div className="space-y-3">
          {/* Change PIN button trigger */}
          <button
            onClick={handleResetPin}
            className="w-full text-left py-1 text-xs flex justify-between items-center group hover:bg-slate-950/40"
          >
            <div>
              <span className="font-bold text-slate-200">Reset Security login PIN</span>
              <p className="text-[10px] text-slate-500">Configure your 4-digit biometric lock key.</p>
            </div>
            <KeyRound className="w-4 h-4 text-slate-400 group-hover:text-cyan-400" />
          </button>

          {/* Switch toggle 1 */}
          <div className="flex justify-between items-center text-xs">
            <div>
              <span className="font-bold text-slate-200">Biometric / Touch PIN Login</span>
              <p className="text-[10px] text-slate-500">Unlock Jcash using biometrics sensor.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={biometricsEnabled} 
                onChange={() => setBiometricsEnabled(!biometricsEnabled)} 
                className="sr-only peer" 
              />
              <div className="w-9 h-5 bg-slate-850 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500 peer-checked:after:bg-slate-950"></div>
            </label>
          </div>

          {/* Switch toggle 2 */}
          <div className="flex justify-between items-center text-xs">
            <div>
              <span className="font-bold text-slate-200">Realtime Push Alerts</span>
              <p className="text-[10px] text-slate-500">Receive SMS verification notices instantly.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={notificationsEnabled} 
                onChange={() => setNotificationsEnabled(!notificationsEnabled)} 
                className="sr-only peer" 
              />
              <div className="w-9 h-5 bg-slate-850 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500 peer-checked:after:bg-slate-950"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Corporate Info Footer list */}
      <div className="p-3 text-slate-500 text-[10px] space-y-1 bg-slate-900/30 rounded-xl">
        <div className="flex justify-between">
          <span>EMAIL REGISTRATION</span>
          <span className="text-slate-400 font-mono">{currentUser.email}</span>
        </div>
        <div className="flex justify-between">
          <span>COMPLIANCE STATUS</span>
          <span className="text-emerald-400">PASSED KYC</span>
        </div>
        <div className="flex justify-between">
          <span>JCASH CARD STATUS</span>
          <span className="text-cyan-400">VIRTUAL DEBIT CARD</span>
        </div>
      </div>

      {/* Sign Out Button */}
      <button
        onClick={executeLogout}
        className="w-full py-3.5 bg-rose-950/40 hover:bg-rose-950/80 hover:text-rose-200 border border-rose-800/30 text-rose-400 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
      >
        <LogOut className="w-4 h-4" />
        Log out from Jcash Session
      </button>
    </div>
  );
}
