import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { User, Wallet, Transaction } from '../types';
import { supabase, realtimeBroker } from '../supabase';
import { 
  Users, TrendingUp, ShieldCheck, Activity, Award, UserCheck, 
  Trash2, PlusCircle, Sparkles, RefreshCw, Layers, Compass
} from 'lucide-react';

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  
  // Stats
  const [totalReserves, setTotalReserves] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);

  // Form mock user
  const [newUserName, setNewUserName] = useState('');
  const [newUserMobile, setNewUserMobile] = useState('');

  const loadAdminMetricsData = () => {
    // Read directly from storage to represent general ledger state
    const loadedUsers: User[] = JSON.parse(localStorage.getItem('jcash_users') || '[]');
    const loadedWallets: Wallet[] = JSON.parse(localStorage.getItem('jcash_wallets') || '[]');
    const loadedTxs: Transaction[] = JSON.parse(localStorage.getItem('jcash_transactions') || '[]');

    setUsers(loadedUsers);
    setWallets(loadedWallets);
    setAllTransactions(loadedTxs);

    // Sum balance and points
    const sumBal = loadedWallets.reduce((acc, w) => acc + w.balance, 0);
    const sumPts = loadedWallets.reduce((acc, w) => acc + w.points, 0);
    setTotalReserves(sumBal);
    setTotalPoints(sumPts);
  };

  useEffect(() => {
    loadAdminMetricsData();

    // Subscribe to DB changes to maintain real-time metrics automatically
    const subUsers = realtimeBroker.subscribe('db_users_updated', () => loadAdminMetricsData());
    const subWallets = realtimeBroker.subscribe('db_wallets_updated', () => loadAdminMetricsData());
    const subTxs = realtimeBroker.subscribe('db_transactions_inserted', () => loadAdminMetricsData());

    return () => {
      subUsers();
      subWallets();
      subTxs();
    };
  }, []);

  // Modify user role toggle
  const toggleUserRole = (userId: string) => {
    const freshUsers = users.map(u => {
      if (u.id === userId) {
        const nextRole = u.role === 'admin' ? 'user' : 'admin';
        return { ...u, role: nextRole as any };
      }
      return u;
    });
    localStorage.setItem('jcash_users', JSON.stringify(freshUsers));
    realtimeBroker.emit('db_users_updated', freshUsers);
    alert(`⚜️ System update: Swapped user role access authorization.`);
  };

  // Modify user Verification status
  const toggleVerification = (userId: string) => {
    const freshUsers = users.map(u => {
      if (u.id === userId) {
        return { ...u, is_verified: !u.is_verified };
      }
      return u;
    });
    localStorage.setItem('jcash_users', JSON.stringify(freshUsers));
    realtimeBroker.emit('db_users_updated', freshUsers);
  };

  // Delete simulated user (will clean up their wallets too)
  const deleteUserProfile = (userId: string) => {
    if (userId === 'admin' || userId === 'u1') {
      alert("⚠️ Security directive: You cannot purge default super admin or active primary seed account.");
      return;
    }

    if (confirm("🚨 Warning: Purging user profile will permanently wipe their e-wallet values. Proceed?")) {
      const freshUsers = users.filter(u => u.id !== userId);
      const freshWallets = wallets.filter(w => w.user_id !== userId);
      
      localStorage.setItem('jcash_users', JSON.stringify(freshUsers));
      localStorage.setItem('jcash_wallets', JSON.stringify(freshWallets));

      realtimeBroker.emit('db_users_updated', freshUsers);
      realtimeBroker.emit('db_wallets_updated', freshWallets);
      alert("🗑️ User profile and e-wallet registers permanently purged.");
    }
  };

  // Create customized mock account in-app
  const handleCreateMockUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserMobile || newUserMobile.length !== 11) {
      alert("⚠️ Validate inputs: Complete mobile number is mandatory (11 digits).");
      return;
    }

    const randomId = 'u_' + Math.random().toString(36).substr(2, 9);
    const newUser: User = {
      id: randomId,
      name: newUserName,
      mobile: newUserMobile,
      email: `${newUserName.toLowerCase().replace(/\s/g, '')}@jcash.com`,
      registered_at: new Date().toISOString(),
      role: 'user',
      avatar: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 999999)}?auto=format&fit=crop&w=150&q=80`,
      pin: '0000',
      is_verified: true
    };

    const newWallet: Wallet = {
      id: 'w_' + Math.random().toString(36).substr(2, 9),
      user_id: randomId,
      balance: 1000.00, // Prepop balance
      points: 40,
      savings: 0.00
    };

    const freshUsers = [...users, newUser];
    const freshWallets = [...wallets, newWallet];

    localStorage.setItem('jcash_users', JSON.stringify(freshUsers));
    localStorage.setItem('jcash_wallets', JSON.stringify(freshWallets));

    realtimeBroker.emit('db_users_updated', freshUsers);
    realtimeBroker.emit('db_wallets_updated', freshWallets);

    setNewUserName('');
    setNewUserMobile('');
    alert(`👤 Realtime Database Sync: Registered mock user ${newUserName} carrying initial e-wallet deposit ₱1,040.00!`);
  };

  // Inject random incoming payment simulation event instantly to Juan's account
  const executeSimulationEvent = () => {
    const mockEvents = [
      { sender: 'Starbucks Coffee', amount: 500, type: 'cash_in', category: 'Linked Account Cash In' },
      { sender: 'Palawan Express', amount: 1200, type: 'cash_in', category: 'Palawan OTC Load' },
      { sender: 'Marie Ramos', amount: 350, type: 'receive', category: 'Direct Transfer' },
    ];
    const picked = mockEvents[Math.floor(Math.random() * mockEvents.length)];
    
    // Credit Juan's account (u1)
    const freshWallets = wallets.map(w => {
      if (w.user_id === 'u1') {
        return { ...w, balance: w.balance + picked.amount, points: w.points + 10 };
      }
      return w;
    });
    localStorage.setItem('jcash_wallets', JSON.stringify(freshWallets));
    realtimeBroker.emit('db_wallets_updated', freshWallets);

    // Write transaction
    const newTx: Transaction = {
      id: 'tx_admin_inj_' + Math.random().toString(36).substr(2, 9),
      wallet_id: 'w1',
      user_id: 'u1',
      type: picked.type as any,
      amount: picked.amount,
      sender_name: picked.sender,
      reference_no: 'TXNINJ' + Math.floor(100000 + Math.random() * 900000),
      status: 'success',
      category: picked.category,
      created_at: new Date().toISOString()
    };
    const freshTxs = [newTx, ...allTransactions];
    localStorage.setItem('jcash_transactions', JSON.stringify(freshTxs));
    realtimeBroker.emit('db_transactions_inserted', [newTx]);

    // Send notification
    const notifications = JSON.parse(localStorage.getItem('jcash_notifications') || '[]');
    notifications.unshift({
      id: 'n_admin_inj_' + Math.random().toString(36).substr(2, 9),
      user_id: 'u1',
      title: `⚡ System Event: +₱${picked.amount}.00`,
      description: `Administrator triggered mock transaction event from ${picked.sender}.`,
      type: 'payment',
      read: false,
      created_at: new Date().toISOString()
    });
    localStorage.setItem('jcash_notifications', JSON.stringify(notifications));
    realtimeBroker.emit('db_notifications_inserted', [notifications[0]]);

    alert(`⚡ Simulation Inject success:\nInjected ₱${picked.amount} from '${picked.sender}' into account 'Juan Dela Cruz'. Notice dispatched!`);
  };

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex justify-between items-center px-1">
        <div>
          <h2 className="text-xl font-display font-extrabold text-white flex items-center gap-1.5 uppercase">
            <Layers className="w-5 h-5 text-yellow-500 animate-pulse" />
            Jcash Core Admin
          </h2>
          <p className="text-[10px] text-slate-400 font-mono">SUPABASE REALTIME MONITOR PANEL</p>
        </div>
        <button 
          onClick={loadAdminMetricsData}
          className="p-2 bg-slate-900 border border-white/5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg"
          title="Force Refresh Registers"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Grid numbers */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-gradient-to-br from-indigo-950 to-slate-950 border border-slate-805 rounded-xl">
          <TrendingUp className="w-4 h-4 text-indigo-400 mb-1" />
          <h4 className="text-lg font-extrabold text-white tracking-tight">₱{totalReserves.toLocaleString(undefined, {minimumFractionDigits: 2})}</h4>
          <p className="text-[9px] text-slate-400 uppercase font-mono mt-0.5">Jcash Treasury Balance</p>
        </div>

        <div className="p-3 bg-gradient-to-br from-pink-950 to-slate-950 border border-slate-805 rounded-xl">
          <Award className="w-4 h-4 text-pink-400 mb-1" />
          <h4 className="text-lg font-extrabold text-white tracking-tight">{totalPoints}</h4>
          <p className="text-[9px] text-slate-400 uppercase font-mono mt-0.5">Total Granted Points pool</p>
        </div>
      </div>

      {/* Realtime Event trigger */}
      <div className="p-3 bg-slate-900 border border-white/5 rounded-xl flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-white block">Simulation Trigger Box</span>
          <p className="text-[9px] text-slate-400">Inject random incoming transfers to Juan instantly</p>
        </div>
        <button
          onClick={executeSimulationEvent}
          className="px-3.5 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold text-[10px] uppercase rounded-lg tracking-wider flex items-center gap-1 cursor-pointer transition"
        >
          <Sparkles className="w-3.5 h-3.5" />
          INJECT EVENT
        </button>
      </div>

      {/* System volume weekly trend visualization */}
      <div className="p-3 bg-slate-900 rounded-xl border border-white/5 space-y-2">
        <label className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">Weekly Fintech Velocity Analytics</label>
        
        {/* SVG Sparkline / Bar simulation representation */}
        <div className="h-24 flex items-end justify-between px-2 pt-3">
          {[
            { day: 'Mon', vol: 24000 },
            { day: 'Tue', vol: 32000 },
            { day: 'Wed', vol: 18000 },
            { day: 'Thu', vol: 54000 },
            { day: 'Fri', vol: 72000 },
            { day: 'Sat', vol: 45000 },
            { day: 'Sun', vol: 62000 }
          ].map((v, i) => {
            const barHeight = Math.max((v.vol / 75000) * 100, 10);
            return (
              <div key={i} className="flex flex-col items-center flex-1">
                <div className="relative group w-6 flex flex-col justify-end">
                  {/* Tooltip value display */}
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[8px] text-cyan-400 font-mono opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                    ₱{v.vol / 1000}k
                  </span>
                  <div 
                    className="w-full bg-cyan-700/60 group-hover:bg-cyan-400 border-t border-cyan-300 rounded-t-sm transition-all"
                    style={{ height: `${barHeight}px` }}
                  />
                </div>
                <span className="text-[8px] font-mono text-slate-500 mt-1">{v.day}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Manage Mock users */}
      <div className="p-4 bg-slate-900 rounded-xl border border-white/5 space-y-3">
        <div className="flex justify-between items-center pb-2 border-b border-white/5">
          <label className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">Registry of accounts ({users.length})</label>
          <span className="text-[9px] text-cyan-400">Manage Compliance</span>
        </div>

        {/* Form add custom user */}
        <form onSubmit={handleCreateMockUser} className="grid grid-cols-5 gap-2 pb-2">
          <input
            type="text"
            required
            placeholder="Account Name"
            value={newUserName}
            onChange={(e) => setNewUserName(e.target.value)}
            className="col-span-2 bg-slate-950 border border-white/5 px-2.5 py-1.5 rounded-lg text-[10px] text-white focus:outline-none"
          />
          <input
            type="tel"
            required
            maxLength={11}
            placeholder="Mobile Line"
            value={newUserMobile}
            onChange={(e) => setNewUserMobile(e.target.value.replace(/\D/g, ''))}
            className="col-span-2 bg-slate-950 border border-white/5 px-2.5 py-1.5 rounded-lg text-[10px] text-white focus:outline-none"
          />
          <button 
            type="submit"
            className="bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg flex items-center justify-center cursor-pointer"
            title="Inject simulated user"
          >
            <PlusCircle className="w-4 h-4" />
          </button>
        </form>

        {/* User list cards */}
        <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
          {users.map(u => {
            const uWallet = wallets.find(w => w.user_id === u.id);
            const bal = uWallet ? uWallet.balance : 0;
            const pts = uWallet ? uWallet.points : 0;

            return (
              <div 
                key={u.id}
                className="p-2.5 rounded-lg bg-slate-950 border border-slate-850 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-full border shrink-0 object-cover" />
                  <div>
                    <h5 className="text-[11px] font-bold text-white leading-none flex items-center gap-1">
                      {u.name}
                      {u.is_verified && <UserCheck className="w-3 h-3 text-cyan-400" />}
                    </h5>
                    <p className="text-[9px] text-slate-500 font-mono mt-1">{u.mobile} • {u.role.toUpperCase()}</p>
                    <p className="text-[9px] text-emerald-400 font-mono mt-0.5">₱{bal.toLocaleString(undefined, {minimumFractionDigits: 2})} ({pts} pts)</p>
                  </div>
                </div>

                <div className="flex gap-1.5">
                  <button
                    onClick={() => toggleVerification(u.id)}
                    className={`px-1.5 py-1 rounded text-[8px] font-mono font-bold ${
                      u.is_verified 
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/30' 
                        : 'bg-amber-950 text-amber-400 border border-amber-800/30'
                    }`}
                  >
                    {u.is_verified ? 'VERIFIED' : 'UNVERIFIED'}
                  </button>

                  <button
                    onClick={() => toggleUserRole(u.id)}
                    className="p-1 px-1.5 bg-slate-800 rounded text-[8px] font-mono hover:bg-slate-700 text-slate-300"
                    title="Change access role"
                  >
                    ROLE
                  </button>

                  <button
                    onClick={() => deleteUserProfile(u.id)}
                    className="p-1 text-slate-500 hover:text-red-400"
                    title="Purge profile registry"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Unified overall transaction logs */}
      <div className="p-4 bg-slate-900 rounded-xl border border-white/5 space-y-2">
        <label className="text-[10px] text-slate-400 font-mono tracking-wider uppercase px-1">Unified System Transactions list</label>
        <div className="space-y-1.5 max-h-[170px] overflow-y-auto pr-1">
          {allTransactions.slice(0, 15).map(tx => (
            <div 
              key={tx.id} 
              className="p-2 rounded-lg bg-slate-950 border border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-300"
            >
              <div>
                <span className="text-white font-bold">{tx.category}</span>
                <p className="text-[9px] text-slate-500 mt-0.5">REF: {tx.reference_no}</p>
              </div>
              <span className={`font-bold ${tx.type === 'send' || tx.type === 'bills' || tx.type === 'load' ? 'text-slate-400' : 'text-emerald-400'}`}>
                ₱{tx.amount.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
