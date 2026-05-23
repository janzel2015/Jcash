import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase, startSimulationEngine, realtimeBroker } from './supabase';
import { User, Wallet, Notification, Transaction } from './types';

// Page components imports
import Splash from './components/Splash';
import Auth from './components/Auth';
import TransactionsView from './components/TransactionsView';
import RewardsView from './components/RewardsView';
import ProfileView from './components/ProfileView';
import AdminDashboard from './components/AdminDashboard';
import ActionSheets from './components/modals/ActionSheets';

// Icons
import { 
  Home, Wallet as WalletIcon, History, Award, User as UserIcon, 
  QrCode, Bell, Eye, EyeOff, Plus, Landmark, ArrowUpRight, FileText,
  Shield, Check, Sparkles, Smartphone, Download, Battery, Wifi, Signal, Info, X
} from 'lucide-react';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'wallet' | 'transactions' | 'rewards' | 'profile' | 'admin'>('home');
  const [isLoading, setIsLoading] = useState(false);

  // States
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [unreadsCount, setUnreadsCount] = useState(0);

  // PWA Modal mockup
  const [showPwaBanner, setShowPwaBanner] = useState(true);

  // Current Live Clock
  const [currentTime, setCurrentTime] = useState('');

  // Floating Action Sheet trigger
  const [actionSheetOpen, setActionSheetOpen] = useState(false);
  const [actionSheetType, setActionSheetType] = useState<'send' | 'receive' | 'qrpay' | 'cashin' | 'bills' | 'load' | null>(null);

  // Live Toast Notifications from background events
  const [toast, setToast] = useState<{ title: string; description: string; type: string } | null>(null);

  // Compounding Savings Vault State
  const [vaultAmount, setVaultAmount] = useState('');
  const [vaultModal, setVaultModal] = useState<'deposit' | 'withdraw' | null>(null);

  // Fetch Session User
  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setCurrentUser(data.user);
      }
    };
    checkUser();
  }, []);

  // Sync Live Clock of Smartphone Notch
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      let hrs = d.getHours();
      const mins = d.getMinutes().toString().padStart(2, '0');
      const ampm = hrs >= 12 ? 'PM' : 'AM';
      hrs = hrs % 12 || 12;
      setCurrentTime(`${hrs}:${mins} ${ampm}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch Wallet & Notifications once Authenticated
  const fetchWalletDetails = async (userId: string) => {
    const { data: wallets } = await supabase.from('wallets').select().eq('user_id', userId);
    if (wallets && wallets.length > 0) {
      setWallet(wallets[0]);
    }
  };

  const fetchNotificationLogs = async (userId: string) => {
    const { data: notifs } = await supabase.from('notifications').select().eq('user_id', userId).order('created_at', 'desc');
    if (notifs) {
      setNotifications(notifs);
      setUnreadsCount(notifs.filter(n => !n.read).length);
    }
  };

  // Re-fetch all data states
  const refreshAllUserData = () => {
    if (currentUser) {
      fetchWalletDetails(currentUser.id);
      fetchNotificationLogs(currentUser.id);
    }
  };

  useEffect(() => {
    if (currentUser) {
      refreshAllUserData();

      // Start simulated supersonic Supabase Realtime Simulation Engine!
      const stopSim = startSimulationEngine(currentUser.id, (title, description, type) => {
        // Callback triggers on incoming realtime activity
        setToast({ title, description, type });
        // Auto-refresh states as balance ticks
        refreshAllUserData();
        
        // Auto dismiss toast after 5 seconds
        setTimeout(() => setToast(null), 5000);
      });

      // Listen to database events directly so standard client updates trigger instantly
      const unsubscribeWallets = realtimeBroker.subscribe('db_wallets_updated', () => refreshAllUserData());
      const unsubscribeNotifs = realtimeBroker.subscribe('db_notifications_inserted', () => refreshAllUserData());

      return () => {
        stopSim();
        unsubscribeWallets();
        unsubscribeNotifs();
      };
    }
  }, [currentUser]);

  // Handle Mark Notifications as Read
  const handleMarkAsRead = () => {
    if (!currentUser) return;
    
    // Read localnotifications, modify "read" property
    const notifs: Notification[] = JSON.parse(localStorage.getItem('jcash_notifications') || '[]');
    const modified = notifs.map(n => {
      if (n.user_id === currentUser.id) return { ...n, read: true };
      return n;
    });
    localStorage.setItem('jcash_notifications', JSON.stringify(modified));
    realtimeBroker.emit('db_notifications_inserted', modified);
    
    setUnreadsCount(0);
    alert('🧹 All notifications marked as read.');
  };

  // Handle Vault deposit & withdraw
  const handleVaultFundTransfer = (direction: 'deposit' | 'withdraw') => {
    if (!wallet || !currentUser) return;
    const amount = parseFloat(vaultAmount);
    if (!amount || amount <= 0) {
      alert("⚠️ Enter a valid amount");
      return;
    }

    try {
      const walletsTable = JSON.parse(localStorage.getItem('jcash_wallets') || '[]');
      const idx = walletsTable.findIndex((w: any) => w.user_id === currentUser.id);

      if (idx !== -1) {
        const sourceAmt = direction === 'deposit' ? walletsTable[idx].balance : walletsTable[idx].savings;
        if (amount > sourceAmt) {
          alert(`⚠️ Insufficient funds in source to completed this transfer.`);
          return;
        }

        if (direction === 'deposit') {
          walletsTable[idx].balance -= amount;
          walletsTable[idx].savings += amount;
          walletsTable[idx].points += Math.floor(amount * 0.05); // Earn points for saving money!
        } else {
          walletsTable[idx].balance += amount;
          walletsTable[idx].savings -= amount;
        }

        localStorage.setItem('jcash_wallets', JSON.stringify(walletsTable));
        realtimeBroker.emit('db_wallets_updated', walletsTable);

        // Append Ledger Transaction
        const transactionsTable = JSON.parse(localStorage.getItem('jcash_transactions') || '[]');
        transactionsTable.unshift({
          id: 'tx_vlt_' + Math.random().toString(36).substr(2, 9),
          wallet_id: wallet.id,
          user_id: currentUser.id,
          type: direction === 'deposit' ? 'send' : 'receive',
          amount: amount,
          reference_no: 'TXNVAULT' + Math.floor(100000 + Math.random() * 900000),
          status: 'success',
          category: direction === 'deposit' ? 'Transfer to Savings Vault' : 'Withdrawal from Savings Vault',
          created_at: new Date().toISOString()
        });
        localStorage.setItem('jcash_transactions', JSON.stringify(transactionsTable));
        realtimeBroker.emit('db_transactions_inserted', transactionsTable[0]);

        // Append Notification
        const notificationsTable = JSON.parse(localStorage.getItem('jcash_notifications') || '[]');
        notificationsTable.unshift({
          id: 'n_vlt_' + Math.random().toString(36).substr(2, 9),
          user_id: currentUser.id,
          title: direction === 'deposit' ? '🔒 Savings Vault Deposit' : '🔓 Vault Withdrawal',
          description: `Transferred ₱${amount.toLocaleString(undefined, {minimumFractionDigits: 2})} successfully. Compounding interest is active!`,
          type: 'cashback',
          read: false,
          created_at: new Date().toISOString()
        });
        localStorage.setItem('jcash_notifications', JSON.stringify(notificationsTable));
        realtimeBroker.emit('db_notifications_inserted', notificationsTable[0]);

        setVaultAmount('');
        setVaultModal(null);
        refreshAllUserData();
        alert(`🔒 Vault adjustment complete!\nAmount: ₱${amount.toLocaleString()}\nSavings balance compound updated.`);
      }
    } catch (e: any) {
      console.error(e);
    }
  };

  const selectTab = (tab: typeof activeTab) => {
    setIsLoading(true);
    setActiveTab(tab);
    // Mimic fast server-side loading states
    setTimeout(() => setIsLoading(false), 250);
  };

  const openQuickActionSheet = (sheetType: typeof actionSheetType) => {
    setActionSheetType(sheetType);
    setActionSheetOpen(true);
  };

  const claimVoucherFromSidebar = () => {
    if (!wallet || !currentUser) {
      alert("⚠️ Direct access error: Sign in first to claim your promo voucher!");
      return;
    }
    
    try {
      const walletsTable = JSON.parse(localStorage.getItem('jcash_wallets') || '[]');
      const idx = walletsTable.findIndex((w: any) => w.user_id === currentUser.id);
      
      if (idx !== -1) {
        walletsTable[idx].balance += 50.00;
        walletsTable[idx].points += 15;
        localStorage.setItem('jcash_wallets', JSON.stringify(walletsTable));
        realtimeBroker.emit('db_wallets_updated', walletsTable);
        
        // Transaction entry
        const transactionsTable = JSON.parse(localStorage.getItem('jcash_transactions') || '[]');
        transactionsTable.unshift({
          id: 'tx_vch_claim_' + Math.random().toString(36).substr(2, 9),
          wallet_id: wallet.id,
          user_id: currentUser.id,
          type: 'reward',
          amount: 50.00,
          reference_no: 'TXNVCH' + Math.floor(100000 + Math.random() * 900000),
          status: 'success',
          category: 'Claimed Promos Voucher',
          created_at: new Date().toISOString()
        });
        localStorage.setItem('jcash_transactions', JSON.stringify(transactionsTable));
        realtimeBroker.emit('db_transactions_inserted', transactionsTable[0]);
        
        // Notification entry
        const notificationsTable = JSON.parse(localStorage.getItem('jcash_notifications') || '[]');
        notificationsTable.unshift({
          id: 'n_vch_claim_' + Math.random().toString(36).substr(2, 9),
          user_id: currentUser.id,
          title: '🎁 ₱50.00 Voucher Credited!',
          description: 'Your promotional billing rebate voucher was claimed and deposited in your active wallet.',
          type: 'cashback',
          read: false,
          created_at: new Date().toISOString()
        });
        localStorage.setItem('jcash_notifications', JSON.stringify(notificationsTable));
        realtimeBroker.emit('db_notifications_inserted', notificationsTable[0]);
        
        refreshAllUserData();
        alert("🎉 Success! Your ₱50.00 promotional rebate voucher was successfully claimed and deposited onto your available balance.");
      }
    } catch(err) {
      console.error(err);
    }
  };

  // Splash Screen Guard
  if (showSplash) {
    return <Splash onComplete={() => setShowSplash(false)} />;
  }

  // Authentication Screen Guard
  if (!currentUser) {
    return (
      <div className="bg-sky-50 min-h-screen flex items-center justify-center p-4">
        <Auth onSuccess={(user) => {
          setCurrentUser(user);
          selectTab('home');
        }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-sky-200 to-sky-300 text-slate-800 flex flex-col items-center justify-center py-6 px-4 md:px-8 relative overflow-hidden selection:bg-sky-200 selection:text-slate-900 font-sans">
      {/* Background neon blurs */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-sky-300/20 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-300/20 rounded-full blur-[140px] pointer-events-none" />
      </div>

      {/* Main Container Wrapper */}
      <div className="relative z-10 w-full max-w-6xl flex flex-col lg:flex-row items-center lg:items-stretch lg:justify-center xl:justify-between gap-8 h-auto">
        
        {/* LEFT COLUMN: Brand presentation & live trackers (Desktop/Wide screens only) */}
        <div className="hidden lg:flex flex-col justify-between w-[240px] xl:w-[280px] shrink-0 text-left py-4 space-y-6 select-none font-sans">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-tr from-sky-500 to-blue-650 rounded-xl flex items-center justify-center shadow-md shadow-sky-400/20">
                <span className="font-extrabold text-white text-xl">J</span>
              </div>
              <h1 className="text-3xl font-black tracking-tight text-slate-800 font-display">
                Jcash<span className="text-sky-600">.</span>
              </h1>
            </div>
            
            <div className="p-3.5 rounded-2xl bg-white/80 border border-sky-100/75 shadow-xs backdrop-blur-md">
              <p className="text-xs text-slate-600 leading-relaxed">
                The next generation of Filipino digital banking. Real-time balance updates, automated yield farming, and P2P instant liquidity.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Live Telemetry monitor */}
            <div className="bg-white/80 border border-sky-100 shadow-sm backdrop-blur-md rounded-2xl p-4 space-y-3">
              <p className="text-[10px] uppercase tracking-widest text-sky-600 font-mono font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-ping" />
                Live Telemetry
              </p>
              
              <div className="space-y-2 text-xs font-mono text-slate-600">
                <div className="flex justify-between items-center">
                  <span>Connection:</span>
                  <span className="text-emerald-600 font-bold">CONNECTED</span>
                </div>
                <div className="flex justify-between items-center text-slate-500">
                  <span>Engine:</span>
                  <span className="text-slate-800 font-semibold">Supersonic Live</span>
                </div>
                <div className="flex justify-between items-center text-slate-500">
                  <span>Session:</span>
                  <span className="text-sky-600 font-bold truncate max-w-[100px]">{currentUser?.name.split(' ')[0]}</span>
                </div>
              </div>
            </div>

            <div className="bg-white/80 border border-sky-100 shadow-sm backdrop-blur-md rounded-2xl p-4 shadow-xl space-y-1">
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-mono font-bold">Reserves Pool</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-slate-600 font-medium font-sans">Peso Asset Base</span>
                <span className="text-slate-800 font-mono text-xs font-bold font-sans">
                  ₱{(wallet?.balance ? wallet.balance + 1128450 : 1238450).toLocaleString(undefined, {minimumFractionDigits: 2})}
                </span>
              </div>
              <div className="w-full bg-sky-100 h-1 rounded-full mt-2 overflow-hidden">
                <div className="bg-gradient-to-r from-sky-450 to-sky-600 h-full w-[85%]" />
              </div>
            </div>
          </div>

          <div className="space-y-1 text-slate-400 font-mono text-[9px] uppercase tracking-wider leading-normal">
            <p>BSP REGISTERED e-MONEY</p>
            <p>© 2026 JCASH INC.</p>
          </div>
        </div>

        {/* CENTER COLUMN: Central Smartphone containing active applet */}
        <div className="flex flex-col items-center shrink-0">
          {/* PWA Promo Install Bar on top (Desktop only context) */}
          {showPwaBanner && (
            <div className="hidden md:flex max-w-[350px] w-full bg-white/90 border border-sky-100 shadow-sm backdrop-blur-md mb-4 p-3 rounded-2xl items-center justify-between text-xs z-20">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-sky-100 border border-sky-200 flex items-center justify-center text-sky-700 font-bold shrink-0">
                  J
                </div>
                <div>
                  <p className="font-bold text-slate-805 text-slate-800 leading-tight text-[11px]">Install Jcash app</p>
                  <p className="text-[9px] text-slate-500 mt-0.5 font-sans">Launches standalone offline</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowPwaBanner(false)} className="px-2 py-1 text-slate-405 text-slate-400 hover:text-slate-600 text-[10px] cursor-pointer">Ignore</button>
                <button 
                  onClick={() => {
                    alert("⭐️ Jcash PWA:\nTo install this app on your device, click the Share / Install button in your browser navigation bar.");
                    setShowPwaBanner(false);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-550 text-white font-bold text-[10px] transition cursor-pointer"
                >
                  Install
                </button>
              </div>
            </div>
          )}

          {/* Primary Smartphone Mockup Enveloper wrapper */}
          <div className="w-[350px] min-h-[730px] max-h-[820px] bg-sky-50 border-[8px] border-slate-800 rounded-[44px] shadow-2xl flex flex-col relative overflow-hidden border-opacity-90">
        
        {/* Smartphone top status panel notches is simulated */}
        <div className="bg-sky-100/60 text-slate-700 px-6 py-3 flex items-center justify-between text-xs select-none relative z-20 shrink-0 border-b border-sky-200/50">
          <span className="font-bold font-mono tracking-wide">{currentTime || '12:00 PM'}</span>
          
          {/* Simulated centered punch-hole camera */}
          <div className="hidden md:block absolute left-1/2 -translate-x-1/2 top-2 w-28 h-[18px] bg-black rounded-full border border-slate-700" />
          
          <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-500">
            <Signal className="w-3.5 h-3.5 text-sky-600 font-bold" />
            <span className="font-bold tracking-tighter mr-1 text-[9px]">5G LTE</span>
            <Battery className="w-4 h-4 text-emerald-600 font-extrabold" />
          </div>
        </div>

        {/* Dynamic Live Toast alerts representing real-time pushes */}
        <AnimatePresence>
          {toast && (
            <motion.div 
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
              className="absolute top-11 inset-x-4 z-50 p-3 bg-white border border-sky-205 border-sky-205 border-sky-200 rounded-xl flex gap-3 text-xs shadow-xl animate-[pulse_3s_infinite] text-slate-800"
            >
              <span className="text-xl">
                {toast.type === 'payment' ? '💸' : toast.type === 'cashback' ? '🎁' : '🔔'}
              </span>
              <div className="flex-1">
                <h5 className="font-bold text-slate-800 leading-snug">{toast.title}</h5>
                <p className="text-slate-500 text-[11px] leading-relaxed mt-0.5">{toast.description}</p>
              </div>
              <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-600 shrink-0 self-start cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Global Wallet Main Window Wrapper */}
        <div className="flex-1 overflow-y-auto px-5 pt-3 pb-24 relative bg-sky-50 text-slate-800">
          
          {/* APP LEVEL REUSABLE NOTIFICATION BELL HEADER */}
          <div className="flex items-center justify-between pb-3.5 border-b border-sky-100 mb-4 sticky top-0 bg-sky-50/90 backdrop-blur z-15">
            <div className="flex items-center gap-2">
              <img 
                src={currentUser?.avatar} 
                alt={currentUser?.name} 
                className="w-9 h-9 rounded-full border border-sky-300 object-cover cursor-pointer hover:opacity-80"
                onClick={() => selectTab('profile')} 
              />
              <div>
                <p className="text-[10px] text-slate-500 font-bold tracking-wider font-mono">PHILIPPINE WALLET</p>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-slate-800">Hello, {currentUser?.name.split(' ')[0]}!</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Ledger Active Core" />
                </div>
              </div>
            </div>

            {/* Notification logs panel expand button */}
            <div className="flex gap-2">
              {currentUser?.role === 'admin' && (
                <button
                  onClick={() => selectTab('admin')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition flex items-center gap-1 border cursor-pointer ${
                    activeTab === 'admin' 
                      ? 'bg-yellow-500 text-slate-950 border-transparent shadow-xs font-extrabold' 
                      : 'bg-yellow-50 text-yellow-700 border-yellow-250 border-yellow-200 font-bold'
                  }`}
                >
                  ⚜️ Admin Panel
                </button>
              )}

              <button 
                onClick={() => setShowNotifPanel(!showNotifPanel)}
                className="w-9 h-9 bg-white border border-sky-100 rounded-xl flex items-center justify-center text-slate-500 hover:text-sky-600 hover:bg-sky-50 relative cursor-pointer shadow-xs animate-none"
              >
                <Bell className="w-4.5 h-4.5" />
                {unreadsCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-[9px] font-bold font-sans text-white flex items-center justify-center animate-bounce">
                    {unreadsCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* NOTIFICATION CENTER DROPDOWN Log list modal overlay sheet */}
          <AnimatePresence>
            {showNotifPanel && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute left-4 right-4 top-14 bg-white border border-sky-100 p-4 rounded-2xl z-40 shadow-2xl space-y-3 shrink-0 text-slate-800"
              >
                <div className="flex justify-between items-center pb-2 border-b border-sky-100">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800 uppercase font-display">
                    <Bell className="w-3.5 h-3.5 text-sky-600 animate-pulse" />
                    Fintech System Alerts
                  </div>
                  <div className="flex gap-2 font-semibold">
                    <button onClick={handleMarkAsRead} className="text-[10px] text-sky-600 hover:underline cursor-pointer">Mark read</button>
                    <span className="text-slate-300 text-[10px]">•</span>
                    <button onClick={() => setShowNotifPanel(false)} className="text-[10px] text-slate-400 hover:text-slate-655 cursor-pointer">Close</button>
                  </div>
                </div>

                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                  {notifications.length > 0 ? (
                    notifications.map(n => (
                      <div 
                        key={n.id} 
                        className={`p-2.5 rounded-lg text-xs leading-normal transition ${
                          n.read ? 'bg-sky-50 opacity-75' : 'bg-white border-l-2 border-sky-500 shadow-xs'
                        }`}
                      >
                        <h6 className="font-extrabold text-slate-850 text-slate-800 mb-0.5">{n.title}</h6>
                        <p className="text-slate-500 text-[11px] leading-tight font-medium">{n.description}</p>
                        <span className="text-[8px] text-slate-400 font-mono block mt-1.5 font-bold">
                          {new Date(n.created_at).toLocaleTimeString(undefined, {hour: '2-digit', minute: '2-digit'})}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="py-6 text-center text-slate-400 text-xs text-mono font-medium">
                      No live telemetry logs recorded
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* CONDITIONAL SUBVIEW SWITCHBOARDS DISPLAY */}
          {isLoading ? (
            <div className="space-y-4 py-8">
              {/* Premium Skeleton Loading components */}
              <div className="h-32 bg-white border border-sky-100 rounded-2xl animate-pulse p-4 flex flex-col justify-between">
                <div className="w-1/3 h-4 bg-sky-50 rounded" />
                <div className="w-1/2 h-8 bg-sky-50 rounded" />
                <div className="w-2/3 h-3 bg-sky-50 rounded" />
              </div>
              <div className="grid grid-cols-4 gap-3">
                {[...Array(4)].map((_, idx) => (
                  <div key={idx} className="h-16 bg-sky-50 rounded-xl animate-pulse" />
                ))}
              </div>
              <div className="h-40 bg-white border border-sky-100 rounded-2xl animate-pulse" />
            </div>
          ) : activeTab === 'home' ? (
            
            /* TAB 1: fintech HOME DASHBOARD VIEW */
            <div className="space-y-4">
              
              {/* PRIMARY WALLET BALANCE GLASS CARD */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-sky-600 to-blue-500 border border-sky-400/30 relative overflow-hidden text-left shadow-md">
                {/* Background glow ball inside balance */}
                <div className="absolute right-0 top-0 w-36 h-36 bg-white/15 rounded-full blur-2xl pointer-events-none" />

                <div className="space-y-4 relative z-10">
                  <div className="flex justify-between items-center text-sky-100">
                    <span className="text-xs font-mono font-bold tracking-wider uppercase flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-white" />
                      Jcash available Balance
                    </span>
                    <button 
                      onClick={() => setBalanceVisible(!balanceVisible)}
                      className="text-sky-100 hover:text-white cursor-pointer p-0.5"
                    >
                      {balanceVisible ? <EyeOff className="w-4.5 h-4.5 text-white" /> : <Eye className="w-4.5 h-4.5 text-white" />}
                    </button>
                  </div>

                  <div className="space-y-1">
                    <h2 className="text-3xl font-display font-black text-white tracking-tight flex items-baseline">
                      ₱
                      {balanceVisible ? (
                        wallet ? wallet.balance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '0.00'
                      ) : (
                        '••••••'
                      )}
                    </h2>
                    <p className="text-[10px] text-sky-100 font-mono font-medium">
                      Account Registered Line: {currentUser?.mobile}
                    </p>
                  </div>

                  {/* Micro dashboard stats */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 mt-1 text-[11px] font-mono text-white">
                    <div>
                      <span className="text-sky-100/80 text-[9px] uppercase font-bold">My Points Pool</span>
                      <p className="font-bold text-yellow-350 flex items-center gap-0.5">
                        <Sparkles className="w-3 h-3 text-yellow-300" /> 
                        {wallet ? wallet.points : 0} PTS
                      </p>
                    </div>
                    <div>
                      <span className="text-sky-100/80 text-[9px] uppercase font-bold">Compounding Vault</span>
                      <p className="font-bold text-white">
                        ₱{wallet ? wallet.savings.toLocaleString(undefined, {minimumFractionDigits: 2}) : '0.00'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* QUICK CHANNELS ACTION MENU GRID */}
              <div className="space-y-2">
                <label className="text-[10px] text-slate-500 font-bold tracking-wider uppercase px-1">Fintech Core services</label>
                
                <div className="grid grid-cols-4 gap-2.5">
                  {[
                    { label: 'Send Cash', icon: <ArrowUpRight className="w-4.5 h-4.5 text-blue-600" />, action: () => openQuickActionSheet('send') },
                    { label: 'Receive QR', icon: <QrCode className="w-4.5 h-4.5 text-purple-600" />, action: () => openQuickActionSheet('receive') },
                    { label: 'Cash In', icon: <Landmark className="w-4.5 h-4.5 text-emerald-600" />, action: () => openQuickActionSheet('cashin') },
                    { label: 'Pay Bills', icon: <FileText className="w-4.5 h-4.5 text-amber-600" />, action: () => openQuickActionSheet('bills') },
                    { label: 'Buy Load', icon: <Smartphone className="w-4.5 h-4.5 text-pink-600" />, action: () => openQuickActionSheet('load') },
                    { label: 'Claim Vouchers', icon: <Award className="w-4.5 h-4.5 text-yellow-600 font-bold" />, action: () => selectTab('rewards') },
                    { label: 'My Vault', icon: <Shield className="w-4.5 h-4.5 text-sky-600" />, action: () => selectTab('wallet') },
                    { label: 'History', icon: <History className="w-4.5 h-4.5 text-indigo-600" />, action: () => selectTab('transactions') }
                  ].map((act, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={act.action}
                      className="p-3 bg-white border border-sky-100/80 rounded-xl hover:bg-sky-100/55 hover:border-sky-305 hover:scale-105 active:scale-95 transition-all text-center flex flex-col items-center justify-center space-y-1.5 shrink-0 shadow-xs cursor-pointer"
                    >
                      <div className="w-9 h-9 rounded-lg bg-sky-50 flex items-center justify-center border border-sky-100 shadow-inner">
                        {act.icon}
                      </div>
                      <span className="text-[9px] font-bold text-slate-700 w-full truncate leading-tight">{act.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* SAVINGS COMPAUND COMPACT BANNER ADVERTISEMENT */}
              <div 
                onClick={() => selectTab('wallet')}
                className="p-3.5 bg-gradient-to-r from-teal-50 to-emerald-50/70 border border-teal-200/60 rounded-xl flex items-center justify-between text-left cursor-pointer shadow-xs"
              >
                <div className="space-y-0.5">
                  <span className="text-[9px] bg-teal-100 border border-teal-200 px-2 py-0.5 rounded-full text-teal-700 font-bold font-mono tracking-wider uppercase">Jcash Gvault</span>
                  <h4 className="text-xs font-bold text-slate-800 mt-1">Grow Savings at 6.50% p.a. compound!</h4>
                  <p className="text-[9px] text-slate-500 font-medium animate-none">Insured by BSP PDIC registries. Withdraw anytime.</p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-teal-600 animate-pulse" />
              </div>

              {/* QUICK TRANSACTION PREVIEW SECTION */}
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">Ledger highlights</label>
                  <button onClick={() => selectTab('transactions')} className="text-[10px] text-cyan-400 font-bold hover:underline">Show Entire Ledger</button>
                </div>
                <TransactionsView currentUser={currentUser} wallet={wallet!} />
              </div>
            </div>

          ) : activeTab === 'wallet' ? (
            
            /* TAB 2: fintech WALLET & SAVINGS VAULT VIEW */
            <div className="space-y-4">
              
              <div className="p-5 bg-gradient-to-br from-teal-600 to-teal-500 border border-teal-400/20 rounded-2xl relative text-left shadow-md">
                <div className="absolute top-3 right-3 opacity-10">
                  <Shield className="w-20 h-20 text-white" />
                </div>

                <div className="space-y-4">
                  <div className="flex gap-1.5 items-center">
                    <span className="text-xs text-teal-100 font-mono font-bold tracking-wider uppercase">Jcash Gvault Savings Account</span>
                  </div>

                  <div>
                    <h2 className="text-3xl font-display font-black text-white">
                      ₱{wallet ? wallet.savings.toLocaleString(undefined, {minimumFractionDigits: 2}) : '0.00'}
                    </h2>
                    <p className="text-[10px] text-teal-50 font-mono mt-1 font-medium">
                      Accruing interest monthly @ 6.50% per annum compound interest
                    </p>
                  </div>

                  {/* Vault action buttons */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      onClick={() => setVaultModal('deposit')}
                      className="py-2.5 bg-white text-teal-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1 cursor-pointer transition hover:bg-teal-50 shadow-xs"
                    >
                      Deposit to Vault
                    </button>
                    <button
                      onClick={() => setVaultModal('withdraw')}
                      className="py-2.5 bg-white/20 hover:bg-white/30 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1 cursor-pointer transition border border-white/10"
                    >
                      Withdraw to Balance
                    </button>
                  </div>
                </div>
              </div>

              {/* INTERACTIVE INVESTMENT CHART COMPONENT OR PROGRESS ACCRUEMENTS */}
              <div className="p-4 bg-white border border-sky-100 rounded-xl space-y-3.5 shadow-xs">
                <h5 className="text-[11px] font-mono tracking-wider uppercase font-bold text-slate-500">Vault Balance Projection</h5>
                
                <div className="space-y-2.5 text-xs text-slate-700 font-medium">
                  <div className="flex justify-between items-center bg-sky-50/50 p-2.5 rounded-lg">
                    <span>Baseline savings balance</span>
                    <span className="font-extrabold text-slate-800">₱{wallet ? wallet.savings.toLocaleString(undefined, {minimumFractionDigits: 2}) : '0.00'}</span>
                  </div>
                  <div className="flex justify-between items-center bg-sky-50/50 p-2.5 rounded-lg">
                    <span>Est. Monthly Accrual (+6.5%)</span>
                    <span className="font-extrabold text-teal-600">+₱{wallet ? ((wallet.savings * 0.065) / 12).toLocaleString(undefined, {minimumFractionDigits: 2}) : '0.00'}</span>
                  </div>
                  <div className="flex justify-between items-center bg-sky-50/50 p-2.5 rounded-lg">
                    <span>Estimated 1-Year valuation</span>
                    <span className="font-extrabold text-sky-600">₱{wallet ? (wallet.savings * 1.065).toLocaleString(undefined, {minimumFractionDigits: 2}) : '0.00'}</span>
                  </div>
                </div>

                <div className="p-3 bg-teal-50/80 border border-teal-150 border-teal-150 border-teal-250 border-teal-200 text-teal-800 rounded-lg text-[10px] leading-relaxed font-mono">
                  💡 Compound interest accumulates daily and pay schedules roll out on the 1st of every calendar month. Insured up to ₱500,000 via standard regional Philippine bank policies.
                </div>
              </div>

              {/* LEDGER FILTERED EXCLUSIVELY FOR VAULT MOVEMENTS */}
              <div className="space-y-2">
                <label className="text-[10px] text-slate-400 font-mono tracking-wider uppercase px-1">Vault history ledger</label>
                <div className="bg-white border border-sky-100 rounded-xl p-2 text-center py-6 text-xs text-slate-400 font-mono shadow-xs">
                  All Vault entries sync directly to primary dashboard Ledger index.
                </div>
              </div>
            </div>

          ) : activeTab === 'transactions' ? (
            
            /* TAB 3: transaction HISTORY VIEW */
            <TransactionsView currentUser={currentUser} wallet={wallet!} />

          ) : activeTab === 'rewards' ? (
            
            /* TAB 4: REWARDS CENTER VIEW */
            <RewardsView 
              currentUser={currentUser} 
              wallet={wallet!} 
              onRewardClaimed={refreshAllUserData} 
            />

          ) : activeTab === 'profile' ? (
            
            /* TAB 5: PROFILE SETTINGS VIEW */
            <ProfileView 
              currentUser={currentUser} 
              wallet={wallet!} 
              onLogout={() => {
                setCurrentUser(null);
                setWallet(null);
              }} 
            />

          ) : (
            /* TAB 6: ADMIN MONITORING VIEW */
            <AdminDashboard />
          )}
        </div>

        {/* COMPREHENSIVE SAVINGS VAULT MODAL SHEET */}
        <AnimatePresence>
          {vaultModal && (
            <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setVaultModal(null)}
                className="absolute inset-0 bg-black/45 backdrop-blur-xs"
              />
              <motion.div 
                initial={{ y: "100%", opacity: 0.8 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "100%", opacity: 0.8 }}
                className="relative w-full max-w-sm bg-white rounded-2xl border border-sky-100 p-5 z-10 space-y-4 shadow-2xl"
              >
                <div className="flex justify-between items-center pb-2 border-b border-sky-100">
                  <h4 className="text-sm font-bold text-slate-800 uppercase font-display flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-teal-600 animate-pulse" />
                    Vault {vaultModal === 'deposit' ? 'Deposit' : 'Withdrawal'}
                  </h4>
                  <button onClick={() => setVaultModal(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3 pt-2 text-left text-slate-850">
                  <div>
                    <label className="text-xs text-slate-500 font-bold font-mono">Amount (₱)</label>
                    <div className="relative mt-1">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 text-sm">₱</span>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={vaultAmount}
                        onChange={(e) => setVaultAmount(e.target.value)}
                        className="w-full text-base font-bold bg-sky-50/80 border border-sky-200 rounded-xl pl-8 pr-4 py-3 text-slate-800 focus:outline-none"
                      />
                    </div>
                    <p className="text-[10px] text-slate-505 text-slate-500 mt-1 font-mono font-medium">
                      {vaultModal === 'deposit' 
                        ? `Available Balance: ₱${wallet?.balance.toLocaleString(undefined, {minimumFractionDigits: 2})}` 
                        : `Compounding Savings: ₱${wallet?.savings.toLocaleString(undefined, {minimumFractionDigits: 2})}`
                      }
                    </p>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button onClick={() => setVaultModal(null)} className="flex-1 py-2.5 text-xs text-slate-500 hover:text-slate-705 bg-slate-100 hover:bg-slate-205 hover:bg-slate-200 rounded-lg cursor-pointer">Cancel</button>
                    <button 
                      onClick={() => handleVaultFundTransfer(vaultModal)} 
                      className="flex-1 py-2.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 rounded-lg cursor-pointer"
                    >
                      Authorize Transfer
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* BOTTOM RESPONSIVE DOCK FLOATING GLASS TAP NAVIGATOR */}
        <div className="absolute bottom-4 inset-x-4 bg-white/95 backdrop-blur-sm border border-sky-100 shadow-xl rounded-2xl p-2.5 flex justify-between items-center z-30 relative shrink-0">
          {[
            { id: 'home', icon: <Home className="w-5 h-5" />, label: 'Home' },
            { id: 'wallet', icon: <WalletIcon className="w-5 h-5" />, label: 'Savings' },
            { id: 'transactions', icon: <History className="w-5 h-5" />, label: 'Ledger' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => selectTab(tab.id as any)}
              className={`flex flex-col items-center flex-1 justify-center transition-all cursor-pointer ${
                activeTab === tab.id 
                  ? 'text-sky-600 font-bold scale-110 drop-shadow-[0_0_8px_rgba(2,132,199,0.15)]' 
                  : 'text-slate-400 hover:text-slate-600 font-medium'
              }`}
            >
              {tab.icon}
              <span className="text-[8px] font-bold mt-1 leading-none">{tab.label}</span>
            </button>
          ))}

          {/* CENTRAL KEYPAD FLOATING SCAN DRAWER TRIGGER */}
          <div className="relative -top-4 shrink-0 mx-2">
            <div className="absolute -inset-1.5 bg-gradient-to-r from-blue-500 to-sky-400 rounded-full blur opacity-45 pulse-slow" />
            <button
              onClick={() => openQuickActionSheet('qrpay')}
              className="w-12 h-12 bg-gradient-to-r from-blue-600 to-sky-500 rounded-full flex items-center justify-center text-white relative hover:scale-105 active:scale-95 transition shadow-lg shadow-sky-500/35 cursor-pointer border border-sky-300/30"
              title="Scan QR Code Merchant"
            >
              <QrCode className="w-5 h-5" />
            </button>
          </div>

          {[
            { id: 'rewards', icon: <Award className="w-5 h-5" />, label: 'Rewards' },
            { id: 'profile', icon: <UserIcon className="w-5 h-5" />, label: 'Profile' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => selectTab(tab.id as any)}
              className={`flex flex-col items-center flex-1 justify-center transition-all cursor-pointer ${
                activeTab === tab.id 
                  ? 'text-sky-600 font-bold scale-110 drop-shadow-[0_0_8px_rgba(2,132,199,0.15)]' 
                  : 'text-slate-400 hover:text-slate-600 font-medium'
              }`}
            >
              {tab.icon}
              <span className="text-[8px] font-bold mt-1 leading-none">{tab.label}</span>
            </button>
          ))}
        </div>

      </div> {/* Closes primary smartphone device chassis */}

    </div> {/* Closes CENTER COLUMN */}

      {/* RIGHT COLUMN: Interactive vouchers and trends */}
      <div className="hidden lg:flex flex-col w-[260px] xl:w-[300px] shrink-0 text-left py-4 space-y-5 select-none font-sans text-slate-800">
        {/* Promo Voucher box */}
        <div className="bg-gradient-to-br from-sky-50 to-blue-50/60 border border-sky-100 backdrop-blur-md rounded-3xl p-4.5 shadow-md space-y-3.5 relative overflow-hidden">
          <div className="absolute right-[-10px] top-[-10px] w-20 h-20 bg-sky-200/20 rounded-full blur-xl" />
          
          <div className="space-y-1">
            <span className="text-[9px] bg-sky-100 text-sky-700 border border-sky-200 px-2 py-0.5 rounded-full font-bold font-mono tracking-wider uppercase">Promos Active</span>
            <h4 className="text-sm font-bold text-slate-850 mt-1 leading-snug">₱50.00 Rebate Ready!</h4>
            <p className="text-[11px] text-slate-505 text-slate-550 leading-normal font-medium">
              You earned an instantaneous billing rebate. Tap claim below to credit your balance in real-time.
            </p>
          </div>

          <button
            onClick={claimVoucherFromSidebar}
            className="w-full py-2 bg-gradient-to-r from-sky-600 to-blue-500 hover:from-sky-550 hover:to-blue-450 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-sky-500/15 cursor-pointer"
          >
            Claim Rebate Item ₱50
          </button>
        </div>

        {/* Sparkline & trends card */}
        <div className="bg-white border border-sky-100 rounded-3xl p-4.5 shadow-xl space-y-4 font-sans shadow-xs">
          <div className="space-y-0.5">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-mono font-bold">Market Quotations</p>
            <p className="text-[9.5px] text-slate-400 font-mono font-medium">Live local standard quotes in Peso</p>
          </div>

          <div className="space-y-2.5">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-slate-600 font-medium font-sans">BTC / PHP</span>
              <span className="font-mono font-bold text-emerald-650 text-emerald-600 flex items-center gap-1 text-[11px]">
                ₱5,482,040 <span className="text-[9px] bg-emerald-50 text-emerald-650 px-1 py-0.2 rounded">+2.4%</span>
              </span>
            </div>
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-slate-600 font-medium font-sans">ETH / PHP</span>
              <span className="font-mono font-bold text-rose-650 text-rose-600 flex items-center gap-1 text-[11px]">
                ₱184,850 <span className="text-[9px] bg-rose-50 text-rose-655 px-1 py-0.2 rounded">-0.8%</span>
              </span>
            </div>
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-slate-650 text-slate-600 font-medium font-sans">USD / PHP</span>
              <span className="font-mono font-bold text-slate-800 flex items-center gap-1 text-[11px]">
                ₱56.42 <span className="text-[9px] text-slate-400 font-mono">STABLE</span>
              </span>
            </div>
          </div>

          {/* Sparkline chart bar visuals */}
          <div className="pt-3 border-t border-sky-100">
            <p className="text-[9px] uppercase tracking-widest text-slate-500 font-mono font-bold mb-2">Simulated Weekly Spend Outlay</p>
            <div className="flex items-end justify-between gap-1.5 h-12 pt-1 px-1">
              {[
                { d: 'Mon', h: 'h-4 bg-sky-200' },
                { d: 'Tue', h: 'h-8 bg-sky-300' },
                { d: 'Wed', h: 'h-5 bg-sky-200' },
                { d: 'Thu', h: 'h-10 bg-sky-400/80' },
                { d: 'Fri', h: 'h-12 bg-sky-500 shadow-[0_0_8px_rgba(2,132,199,0.15)] animate-none' },
                { d: 'Sat', h: 'h-7 bg-sky-305 bg-sky-300' },
                { d: 'Sun', h: 'h-6 bg-sky-250 bg-sky-200' }
              ].map((bar, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className={`w-full rounded-xs transition-all ${bar.h}`} />
                  <span className="text-[8px] text-slate-400 font-bold font-mono">{bar.d}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div> {/* Closes main Container Wrapper */}

      {/* QUICK ACTIONS MASTER MODAL SHEETS CONTROLLER WINDOW */}
      <ActionSheets 
        isOpen={actionSheetOpen}
        type={actionSheetType}
        onClose={() => {
          setActionSheetOpen(false);
          setActionSheetType(null);
        }}
        currentUser={currentUser}
        wallet={wallet!}
        onWalletUpdated={refreshAllUserData}
      />
    </div>
  );
}
