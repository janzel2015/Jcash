import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase, realtimeBroker } from '../../supabase';
import { User, Wallet, Transaction, Notification } from '../../types';
import { 
  X, Send, QrCode, Smartphone, Landmark, FileText, ArrowDownLeft,
  ChevronRight, ArrowRight, CheckCircle2, AlertCircle, Sparkles,
  Search, Users, Landmark as BankIcon, Compass, Wifi, Copy, ShieldCheck
} from 'lucide-react';

interface ActionSheetsProps {
  isOpen: boolean;
  type: 'send' | 'receive' | 'qrpay' | 'cashin' | 'bills' | 'load' | null;
  onClose: () => void;
  currentUser: User;
  wallet: Wallet;
  onWalletUpdated: () => void;
}

// Simulated merchants for QR Pay select
const DEMO_MERCHANTS = [
  { id: 'm1', name: 'SM Megamall Hypermarket', category: 'Retail Grocery' },
  { id: 'm2', name: 'Jollibee Food Corp (BGC)', category: 'Fast Food Dining' },
  { id: 'm3', name: 'Starbucks Coffee Plaza', category: 'Cafe & Beverages' },
  { id: 'm4', name: '7-Eleven Tower Store', category: 'Convenience Retail' }
];

export default function ActionSheets({ 
  isOpen, 
  type, 
  onClose, 
  currentUser, 
  wallet,
  onWalletUpdated 
}: ActionSheetsProps) {
  const [step, setStep] = useState<number>(1); // 1 = Input, 2 = Confirm, 3 = Receipt Success
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [refNo, setRefNo] = useState<string>('');

  // Local state receivers for queries/mutations
  const [targetUsers, setTargetUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // SEND MONEY DATA STATE
  const [sendTargetUser, setSendTargetUser] = useState<User | null>(null);
  const [sendMobile, setSendMobile] = useState<string>('');
  const [sendAmount, setSendAmount] = useState<string>('');
  const [sendMessage, setSendMessage] = useState<string>('');

  // RECEIVE MONEY DATA STATE
  const [receiveRequestAmount, setReceiveRequestAmount] = useState<string>('');

  // QR PAY DATA STATE
  const [qrSelectedMerchant, setQrSelectedMerchant] = useState<typeof DEMO_MERCHANTS[0] | null>(null);
  const [qrAmount, setQrAmount] = useState<string>('');
  const [qrScanning, setQrScanning] = useState<boolean>(true);
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [scanProgress, setScanProgress] = useState<number>(0);

  // CASH IN DATA STATE
  const [cashInMethod, setCashInMethod] = useState<'bank' | 'overthecounter' | null>(null);
  const [cashInBankCode, setCashInBankCode] = useState<string>('BPI'); // Default
  const [cashInAmount, setCashInAmount] = useState<string>('');
  
  // BILLS DATA STATE
  const [billCategory, setBillCategory] = useState<string>('Electricity');
  const [billerName, setBillerName] = useState<string>('Meralco');
  const [billAcctNo, setBillAcctNo] = useState<string>('');
  const [billAmount, setBillAmount] = useState<string>('');

  // MOBILE LOAD DATA STATE
  const [loadMobile, setLoadMobile] = useState<string>('');
  const [loadNetwork, setLoadNetwork] = useState<'Globe' | 'Smart' | 'TNT' | 'DITO'>('Globe');
  const [loadPromo, setLoadPromo] = useState<{ id: string; name: string; price: number; description: string } | null>(null);

  const promosCollection = {
    Globe: [
      { id: 'g1', name: 'Go50', price: 50, description: '5GB All-Access Data + Unli Text to all Net, 3 Days' },
      { id: 'g2', name: 'Go90', price: 90, description: '8GB Data + Unli Text to all Net, 7 Days' },
      { id: 'g3', name: 'SuperX70', price: 170, description: '20GB High-Speed Data, GoWiFi voucher, 15 Days' }
    ],
    Smart: [
      { id: 's1', name: 'PowerAll99', price: 99, description: '8GB Data + Unli TikTok Every Day + Unli Texts, 7 Days' },
      { id: 's2', name: 'GigaVideo299', price: 299, description: '24GB data + 1GB Video every day (YouTube, Netflix), 30 Days' }
    ],
    TNT: [
      { id: 't1', name: 'SurfSaya30', price: 30, description: '1GB Data + Unli FB & Messenger, 3 Days' }
    ],
    DITO: [
      { id: 'd1', name: 'DitoValue99', price: 99, description: '7GB high speed data + Unli Call/Text Dito, 30 Days' }
    ]
  };

  // Pre-fetch search list
  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await supabase.from('users').select();
      if (data) {
        // Exclude current logged in user
        setTargetUsers(data.filter((u: User) => u.id !== currentUser.id));
      }
    };
    fetchUsers();

    // Event listener for updates inside user directory
    const unsubscribe = realtimeBroker.subscribe('db_users_updated', (updated: User[]) => {
      setTargetUsers(updated.filter((u: User) => u.id !== currentUser.id));
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Handle Search filtering
  const filteredUsers = targetUsers.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.mobile.includes(searchTerm)
  );

  // Generate nice 12-digit reference number for receipts
  const createReferenceNo = () => {
    return 'REF' + Math.floor(100000000 + Math.random() * 900000000).toString();
  };

  // Simulated Scanning Logic
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.value = 1350; // high crisp beep
      gainNode.gain.setValueAtTime(0.06, audioCtx.currentTime);
      oscillator.start();
      setTimeout(() => {
        oscillator.stop();
        audioCtx.close();
      }, 75);
    } catch (e) {
      console.log('Audio Context suppressed/unsupported:', e);
    }
  };

  const runSimulatedScan = () => {
    if (scanStatus === 'scanning') return;
    setScanStatus('scanning');
    setScanProgress(0);
    setError(null);
  };

  useEffect(() => {
    let interval: any;
    if (scanStatus === 'scanning') {
      interval = setInterval(() => {
        setScanProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            playBeep();
            
            // Randomly select merchant & prefill amount
            const randomMerchant = DEMO_MERCHANTS[Math.floor(Math.random() * DEMO_MERCHANTS.length)];
            const randomAmountVal = Math.floor(80 + Math.random() * 1200) + (Math.random() > 0.5 ? 0.5 : 0);
            
            setQrSelectedMerchant(randomMerchant);
            setQrAmount(randomAmountVal.toString());
            setQrScanning(false);
            setScanStatus('success');
            return 100;
          }
          return prev + 10;
        });
      }, 150);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [scanStatus]);

  // RESET FUNCTION
  const handleReset = () => {
    setStep(1);
    setLoading(false);
    setError(null);
    setRefNo('');
    setSearchTerm('');
    setSendTargetUser(null);
    setSendMobile('');
    setSendAmount('');
    setSendMessage('');
    setQrSelectedMerchant(null);
    setQrAmount('');
    setQrScanning(true);
    setScanStatus('idle');
    setScanProgress(0);
    setCashInMethod(null);
    setCashInAmount('');
    setBillAcctNo('');
    setBillAmount('');
    setLoadMobile(currentUser.mobile);
    setLoadPromo(null);
  };

  useEffect(() => {
    if (isOpen) {
      handleReset();
    }
  }, [isOpen, type]);

  // 1. PROCESS SEND MONEY WRITE
  const triggerSendMoney = async () => {
    const amount = parseFloat(sendAmount);
    if (!amount || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (amount > wallet.balance) {
      setError('Insufficient available balance');
      return;
    }
    if (!sendTargetUser && (!sendMobile || sendMobile.length < 11)) {
      setError('Please select a beneficiary or enter valid 11-digit mobile number');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create transaction ref
      const reference = createReferenceNo();
      setRefNo(reference);

      // Find user recipient id
      const recipientUser = sendTargetUser || targetUsers.find(u => u.mobile === sendMobile);
      const recipientName = recipientUser ? recipientUser.name : `Mobile User (${sendMobile})`;
      
      // Update sender balance via wallets table simulation
      const wallets: Wallet[] = JSON.parse(localStorage.getItem('jcash_wallets') || '[]');
      const senderIdx = wallets.findIndex(w => w.user_id === currentUser.id);
      
      if (senderIdx !== -1) {
        wallets[senderIdx].balance -= amount;
        // Reward 1 Jcash Point for every 50 Pesos sent!
        wallets[senderIdx].points += Math.floor(amount / 50);
        localStorage.setItem('jcash_wallets', JSON.stringify(wallets));
      }

      // If registered recipient, credit their balance
      if (recipientUser) {
        const receiverIdx = wallets.findIndex(w => w.user_id === recipientUser.id);
        if (receiverIdx !== -1) {
          wallets[receiverIdx].balance += amount;
          localStorage.setItem('jcash_wallets', JSON.stringify(wallets));
        }

        // Write recipient notification
        const notifications: Notification[] = JSON.parse(localStorage.getItem('jcash_notifications') || '[]');
        notifications.unshift({
          id: 'n_rec_' + Math.random().toString(36).substr(2, 9),
          user_id: recipientUser.id,
          title: '💸 Money Received!',
          description: `You received ₱${amount.toLocaleString(undefined, {minimumFractionDigits: 2})} from ${currentUser.name}. Msg: ${sendMessage || 'No message.'}`,
          type: 'payment',
          read: false,
          created_at: new Date().toISOString()
        });
        localStorage.setItem('jcash_notifications', JSON.stringify(notifications));
      }

      // Record transaction listings (Both send and receive)
      const transactions = JSON.parse(localStorage.getItem('jcash_transactions') || '[]');
      const newSendTx = {
        id: 'tx_snd_' + Math.random().toString(36).substr(2, 9),
        wallet_id: wallet.id,
        user_id: currentUser.id,
        type: 'send',
        amount: amount,
        sender_name: currentUser.name,
        sender_mobile: currentUser.mobile,
        receiver_name: recipientName,
        receiver_mobile: recipientUser?.mobile || sendMobile,
        reference_no: reference,
        status: 'success',
        category: 'Express Send',
        created_at: new Date().toISOString()
      };
      
      transactions.unshift(newSendTx);

      if (recipientUser) {
        const receiverWallet = wallets.find(w => w.user_id === recipientUser.id);
        const newRecTx = {
          id: 'tx_rcv_' + Math.random().toString(36).substr(2, 9),
          wallet_id: receiverWallet ? receiverWallet.id : 'w_rec',
          user_id: recipientUser.id,
          type: 'receive',
          amount: amount,
          sender_name: currentUser.name,
          sender_mobile: currentUser.mobile,
          receiver_name: recipientName,
          receiver_mobile: recipientUser.mobile,
          reference_no: reference,
          status: 'success',
          category: 'Express Send Received',
          created_at: new Date().toISOString()
        };
        transactions.unshift(newRecTx);
      }
      
      localStorage.setItem('jcash_transactions', JSON.stringify(transactions));

      // Notification to current user
      const currentNotifications = JSON.parse(localStorage.getItem('jcash_notifications') || '[]');
      currentNotifications.unshift({
        id: 'n_snd_' + Math.random().toString(36).substr(2, 9),
        user_id: currentUser.id,
        title: '💸 Money Transferred Successfully',
        description: `Sent ₱${amount.toLocaleString(undefined, {minimumFractionDigits: 2})} to ${recipientName}. Ref: ${reference}`,
        type: 'payment',
        read: false,
        created_at: new Date().toISOString()
      });
      localStorage.setItem('jcash_notifications', JSON.stringify(currentNotifications));

      // Dispatch Realtime Updates
      realtimeBroker.emit('db_wallets_updated', wallets);
      realtimeBroker.emit('db_transactions_inserted', [newSendTx]);
      realtimeBroker.emit('db_notifications_inserted', [currentNotifications[0]]);

      onWalletUpdated();
      setStep(3); // Go to receipt page
    } catch (e: any) {
      setError('Transaction processing failed: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. PROCESS QR PAYMENT WRITE
  const triggerQRPay = async () => {
    const amount = parseFloat(qrAmount);
    if (!amount || amount <= 0) {
      setError('Enter a valid payment checkout amount');
      return;
    }
    if (amount > wallet.balance) {
      setError('Insufficient wallet funds to complete this checkout');
      return;
    }
    if (!qrSelectedMerchant) {
      setError('An active merchant scanner is required');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const reference = createReferenceNo();
      setRefNo(reference);

      const wallets: Wallet[] = JSON.parse(localStorage.getItem('jcash_wallets') || '[]');
      const senderIdx = wallets.findIndex(w => w.user_id === currentUser.id);
      
      if (senderIdx !== -1) {
        wallets[senderIdx].balance -= amount;
        wallets[senderIdx].points += Math.floor(amount / 20); // More points for shopping and QR purchases!
        localStorage.setItem('jcash_wallets', JSON.stringify(wallets));
      }

      // Record transaction
      const transactions = JSON.parse(localStorage.getItem('jcash_transactions') || '[]');
      const newTx = {
        id: 'tx_qr_' + Math.random().toString(36).substr(2, 9),
        wallet_id: wallet.id,
        user_id: currentUser.id,
        type: 'send',
        amount: amount,
        receiver_name: qrSelectedMerchant.name,
        reference_no: reference,
        status: 'success',
        category: `QR Pay: ${qrSelectedMerchant.category}`,
        created_at: new Date().toISOString()
      };
      transactions.unshift(newTx);
      localStorage.setItem('jcash_transactions', JSON.stringify(transactions));

      // Add Notification
      const notifications = JSON.parse(localStorage.getItem('jcash_notifications') || '[]');
      notifications.unshift({
        id: 'n_qr_' + Math.random().toString(36).substr(2, 9),
        user_id: currentUser.id,
        title: `🏢 QR Payment Success`,
        description: `Successfully paid ₱${amount.toLocaleString(undefined, {minimumFractionDigits: 2})} at ${qrSelectedMerchant.name}.`,
        type: 'payment',
        read: false,
        created_at: new Date().toISOString()
      });
      localStorage.setItem('jcash_notifications', JSON.stringify(notifications));

      // Emit Realtime updates
      realtimeBroker.emit('db_wallets_updated', wallets);
      realtimeBroker.emit('db_transactions_inserted', [newTx]);

      onWalletUpdated();
      setStep(3);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // 3. PROCESS CASH IN WRITE
  const triggerCashIn = async () => {
    const amount = parseFloat(cashInAmount);
    if (!amount || amount <= 0) {
      setError('Please Enter a valid cash amount');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const reference = createReferenceNo();
      setRefNo(reference);

      const wallets: Wallet[] = JSON.parse(localStorage.getItem('jcash_wallets') || '[]');
      const senderIdx = wallets.findIndex(w => w.user_id === currentUser.id);
      
      if (senderIdx !== -1) {
        wallets[senderIdx].balance += amount;
        localStorage.setItem('jcash_wallets', JSON.stringify(wallets));
      }

      // Record transaction
      const transactions = JSON.parse(localStorage.getItem('jcash_transactions') || '[]');
      const newTx = {
        id: 'tx_ci_' + Math.random().toString(36).substr(2, 9),
        wallet_id: wallet.id,
        user_id: currentUser.id,
        type: 'cash_in',
        amount: amount,
        receiver_name: currentUser.name,
        reference_no: reference,
        status: 'success',
        category: cashInMethod === 'bank' ? `Cash In Linked: ${cashInBankCode}` : '7-Eleven OTC Cash-In',
        created_at: new Date().toISOString()
      };
      transactions.unshift(newTx);
      localStorage.setItem('jcash_transactions', JSON.stringify(transactions));

      // Notification
      const notifications = JSON.parse(localStorage.getItem('jcash_notifications') || '[]');
      notifications.unshift({
        id: 'n_ci_' + Math.random().toString(36).substr(2, 9),
        user_id: currentUser.id,
        title: `⚡ Wallet Reloaded`,
        description: `Successfully loaded ₱${amount.toLocaleString(undefined, {minimumFractionDigits: 2})} into your wallet via ${cashInMethod === 'bank' ? cashInBankCode : '7-Eleven'}.`,
        type: 'payment',
        read: false,
        created_at: new Date().toISOString()
      });
      localStorage.setItem('jcash_notifications', JSON.stringify(notifications));

      // Realtime trigger
      realtimeBroker.emit('db_wallets_updated', wallets);
      realtimeBroker.emit('db_transactions_inserted', [newTx]);

      onWalletUpdated();
      setStep(3);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // 4. PROCESS BILLS PAYMENT WRITE
  const triggerBillsPayment = async () => {
    const amount = parseFloat(billAmount);
    if (!amount || amount <= 0) {
      setError('Please Enter a valid bills payment amount');
      return;
    }
    if (amount > wallet.balance) {
      setError('Insufficient wallet balance to pay this biller');
      return;
    }
    if (billAcctNo.length < 8) {
      setError('Account / Reference Number must be at least 8 digits long');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const reference = createReferenceNo();
      setRefNo(reference);

      // Deduct balance
      const wallets: Wallet[] = JSON.parse(localStorage.getItem('jcash_wallets') || '[]');
      const idx = wallets.findIndex(w => w.user_id === currentUser.id);
      if (idx !== -1) {
        wallets[idx].balance -= amount;
        wallets[idx].points += 15; // Point bonus paying utilities
        localStorage.setItem('jcash_wallets', JSON.stringify(wallets));
      }

      // Record transaction
      const transactions = JSON.parse(localStorage.getItem('jcash_transactions') || '[]');
      const newTx = {
        id: 'tx_bill_' + Math.random().toString(36).substr(2, 9),
        wallet_id: wallet.id,
        user_id: currentUser.id,
        type: 'bills',
        amount: amount,
        reference_no: reference,
        status: 'success',
        category: `${billerName} Utility Bill`,
        created_at: new Date().toISOString()
      };
      transactions.unshift(newTx);
      localStorage.setItem('jcash_transactions', JSON.stringify(transactions));

      // Notification
      const notifications = JSON.parse(localStorage.getItem('jcash_notifications') || '[]');
      notifications.unshift({
        id: 'n_bill_' + Math.random().toString(36).substr(2, 9),
        user_id: currentUser.id,
        title: `🧾 Utilities Paid: ${billerName}`,
        description: `Successfully settled electricity or telecoms bill for ₱${amount.toLocaleString(undefined, {minimumFractionDigits: 2})} with account ${billAcctNo}.`,
        type: 'payment',
        read: false,
        created_at: new Date().toISOString()
      });
      localStorage.setItem('jcash_notifications', JSON.stringify(notifications));

      // Realtime emit
      realtimeBroker.emit('db_wallets_updated', wallets);
      realtimeBroker.emit('db_transactions_inserted', [newTx]);

      onWalletUpdated();
      setStep(3);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // 5. PROCESS MOBILE LOAD PURCHASE WRITE
  const triggerMobileLoad = async () => {
    if (!loadPromo) {
      setError('Please select a load promotion rate catalog');
      return;
    }
    if (loadPromo.price > wallet.balance) {
      setError('Insufficient wallet balance to buy this load offer');
      return;
    }
    if (loadMobile.length !== 11 || !loadMobile.startsWith('09')) {
      setError('Validate receiver mobile phone. Must be 11-digit starting with 09');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const reference = createReferenceNo();
      setRefNo(reference);

      // Deduct balance
      const wallets: Wallet[] = JSON.parse(localStorage.getItem('jcash_wallets') || '[]');
      const idx = wallets.findIndex(w => w.user_id === currentUser.id);
      if (idx !== -1) {
        wallets[idx].balance -= loadPromo.price;
        wallets[idx].points += Math.floor(loadPromo.price * 0.1); // 10% load rebate points!
        localStorage.setItem('jcash_wallets', JSON.stringify(wallets));
      }

      // Record transaction
      const transactions = JSON.parse(localStorage.getItem('jcash_transactions') || '[]');
      const newTx = {
        id: 'tx_load_' + Math.random().toString(36).substr(2, 9),
        wallet_id: wallet.id,
        user_id: currentUser.id,
        type: 'load',
        amount: loadPromo.price,
        reference_no: reference,
        status: 'success',
        category: `Load Reload: ${loadNetwork} ${loadPromo.name}`,
        created_at: new Date().toISOString()
      };
      transactions.unshift(newTx);
      localStorage.setItem('jcash_transactions', JSON.stringify(transactions));

      // Notification
      const notifications = JSON.parse(localStorage.getItem('jcash_notifications') || '[]');
      notifications.unshift({
        id: 'n_load_' + Math.random().toString(36).substr(2, 9),
        user_id: currentUser.id,
        title: `📶 Prepaid Load Reloaded`,
        description: `Purchased promo package '${loadPromo.name}' loaded for subscriber mobile ${loadMobile}. Cost: ₱${loadPromo.price}.00`,
        type: 'promo',
        read: false,
        created_at: new Date().toISOString()
      });
      localStorage.setItem('jcash_notifications', JSON.stringify(notifications));

      // Realtime emit
      realtimeBroker.emit('db_wallets_updated', wallets);
      realtimeBroker.emit('db_transactions_inserted', [newTx]);

      onWalletUpdated();
      setStep(3);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
        {/* Backdrop glass */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        />

        {/* Modal Container */}
        <motion.div 
          initial={{ y: "100%", opacity: 0.5 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0.5 }}
          transition={{ type: "spring", damping: 25, stiffness: 220 }}
          className="relative w-full max-w-md bg-white border-t border-sky-100 md:border md:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh] md:max-h-[85vh] text-slate-800 font-sans"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-sky-100 bg-sky-50/90 backdrop-blur sticky top-0 z-10">
            <div className="flex items-center gap-2.5">
              {type === 'send' && (
                <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                  <Send className="w-5 h-5" />
                </div>
              )}
              {type === 'receive' && (
                <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
                  <QrCode className="w-5 h-5" />
                </div>
              )}
              {type === 'qrpay' && (
                <div className="w-9 h-9 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-600">
                  <Compass className="w-5 h-5 animate-pulse" />
                </div>
              )}
              {type === 'cashin' && (
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                  <Landmark className="w-5 h-5" />
                </div>
              )}
              {type === 'bills' && (
                <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                  <FileText className="w-5 h-5" />
                </div>
              )}
              {type === 'load' && (
                <div className="w-9 h-9 rounded-xl bg-pink-50 border border-pink-200 flex items-center justify-center text-pink-600">
                  <Wifi className="w-5 h-5 animate-bounce" />
                </div>
              )}

              <div>
                <h3 className="text-base font-display font-extrabold text-slate-800">
                  {type === 'send' && 'Express Send Cash'}
                  {type === 'receive' && 'My Jcash QR Payload'}
                  {type === 'qrpay' && 'Scan & Pay Merchant'}
                  {type === 'cashin' && 'Cash In Channels'}
                  {type === 'bills' && 'Pay Bills Online'}
                  {type === 'load' && 'Reload Mobile Load'}
                </h3>
                <p className="text-[10px] text-slate-500 tracking-wide uppercase font-mono">
                  {step === 1 && 'Transaction Info'}
                  {step === 2 && 'Verification Preview'}
                  {step === 3 && 'Payment Success Receipt'}
                </p>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-sky-100 hover:bg-sky-200/80 flex items-center justify-center text-sky-700 hover:text-sky-900"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body Section */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-rose-700 text-xs flex gap-2 items-center">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{error}</span>
              </div>
            )}

            {/* A. EXPRESS SEND MONEY FLOW */}
            {type === 'send' && (
              <>
                {step === 1 && (
                  <div className="space-y-4">
                    {/* Select from Quick contacts list */}
                    <div>
                      <label className="text-[10px] text-slate-500 font-mono tracking-wider uppercase">Quick Transfer Recipients</label>
                      <div className="flex gap-3 overflow-x-auto py-2.5">
                        {targetUsers.slice(0, 3).map(u => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => {
                              setSendTargetUser(u);
                              setSendMobile(u.mobile);
                            }}
                            className={`flex flex-col items-center shrink-0 min-w-[70px] p-2 rounded-xl transition ${
                              sendTargetUser?.id === u.id 
                                ? 'bg-sky-100 border border-sky-400' 
                                : 'bg-sky-50/50 border border-sky-100 hover:bg-sky-100/50'
                            }`}
                          >
                            <img src={u.avatar} alt={u.name} className="w-10 h-10 rounded-full border border-sky-100 shrink-0" />
                            <span className="text-[10px] font-medium mt-1.5 text-center text-slate-700 truncate max-w-[65px]">{u.name.split(' ')[0]}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Manual inputs */}
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-slate-600 font-medium font-mono">Receiver Mobile (11 digits)</label>
                        <input
                          type="tel"
                          maxLength={11}
                          placeholder="e.g. 09187654321"
                          value={sendMobile}
                          onChange={(e) => {
                            setSendMobile(e.target.value.replace(/\D/g, ''));
                            // Check if mobile matches registered user to show metadata
                            const matched = targetUsers.find(u => u.mobile === e.target.value);
                            setSendTargetUser(matched || null);
                          }}
                          className="w-full bg-slate-50 border border-sky-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                        />
                        {sendTargetUser && (
                          <p className="text-[11px] text-sky-600 mt-1 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Checked Name: {sendTargetUser.name}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="text-xs text-slate-600 font-medium font-mono">Amount (₱)</label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 text-sm">₱</span>
                          <input
                            type="number"
                            placeholder="0.00"
                            value={sendAmount}
                            onChange={(e) => setSendAmount(e.target.value)}
                            className="w-full text-base font-bold bg-slate-50 border border-sky-200 rounded-xl pl-8 pr-4 py-3 text-slate-800 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                          />
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">Available balance: ₱{wallet.balance.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                      </div>

                      <div>
                        <label className="text-xs text-slate-600 font-medium font-mono">Optional Message</label>
                        <input
                          type="text"
                          placeholder="What is this for?"
                          value={sendMessage}
                          maxLength={40}
                          onChange={(e) => setSendMessage(e.target.value)}
                          className="w-full bg-slate-50 border border-sky-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      disabled={!sendAmount || (!sendMobile && !sendTargetUser)}
                      className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-medium text-xs flex items-center justify-center gap-2 cursor-pointer mt-4 disabled:opacity-50 text-white"
                    >
                      Retrieve Verification Summary
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-4">
                    <div className="text-center p-4 rounded-xl bg-sky-50/70 border border-sky-100 space-y-1.5">
                      <p className="text-xs text-slate-500">Total express send amount</p>
                      <h4 className="text-3xl font-display font-extrabold text-slate-850">
                        ₱{parseFloat(sendAmount).toLocaleString(undefined, {minimumFractionDigits: 2})}
                      </h4>
                      <p className="text-[11px] text-sky-600 font-mono font-semibold">Fee: ₱0.00 FREE</p>
                    </div>

                    <div className="bg-sky-50 border border-sky-100 rounded-xl p-3 space-y-2.5 text-xs text-slate-705">
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Recipient Name</span>
                        <span className="text-slate-800 font-semibold">{sendTargetUser?.name || 'Unverified Mobile'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Mobile Number</span>
                        <span className="text-slate-800 font-mono">{sendMobile}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Remarks</span>
                        <span className="text-slate-800 italic shrink-0 max-w-[200px] truncate">{sendMessage || 'n/a'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Source Account</span>
                        <span className="text-slate-800">Jcash Wallet</span>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-3">
                      <button 
                        onClick={() => setStep(1)} 
                        className="flex-1 py-3 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl"
                      >
                        Modify Details
                      </button>
                      <button 
                        onClick={triggerSendMoney} 
                        disabled={loading}
                        className="flex-1 py-3 text-xs bg-gradient-to-r from-blue-600 to-sky-500 hover:opacity-90 font-bold text-white rounded-xl flex items-center justify-center gap-1.5"
                      >
                        {loading ? 'Sending...' : 'Confirm & Transfer'}
                        <ShieldCheck className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* B. RECEIVE MONEY QR DISPLAY */}
            {type === 'receive' && (
              <div className="space-y-5 text-center">
                <div className="p-4 bg-white rounded-2xl w-52 h-52 mx-auto flex flex-col items-center justify-center shadow-lg relative border border-sky-100 bg-gradient-to-b from-sky-50/50 to-white">
                  {/* Real responsive vector mockup representation of a GCash/Jcash QR */}
                  <div className="grid grid-cols-5 grid-rows-5 gap-1.5 w-40 h-40 opacity-90 p-1 bg-white">
                    {[...Array(25)].map((_, idx) => (
                      <div 
                        key={idx} 
                        className={`rounded-[2px] ${
                          idx % 3 === 0 || idx % 7 === 0 || idx % 11 === 0 || idx < 5 || idx === 19 || idx === 24
                            ? 'bg-slate-800' 
                            : 'bg-slate-200'
                        }`} 
                      />
                    ))}
                  </div>
                  {/* Brand Center Logo inside QR */}
                  <div className="absolute top-[41%] left-[41%] w-10 h-10 bg-gradient-to-r from-blue-600 to-sky-500 rounded-lg flex items-center justify-center border-2 border-white text-white font-display font-extrabold text-sm">
                    J
                  </div>
                </div>

                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-slate-800">{currentUser.name}</h4>
                  <p className="text-xs text-slate-500 font-mono">{currentUser.mobile}</p>
                </div>

                {/* Input request amount generator */}
                <div className="max-w-[250px] mx-auto space-y-2">
                  <label className="text-[10px] text-slate-500 font-mono tracking-wider uppercase font-semibold">Request customized Amount (₱)</label>
                  <input
                    type="number"
                    placeholder="0.00 (optional)"
                    value={receiveRequestAmount}
                    onChange={(e) => setReceiveRequestAmount(e.target.value)}
                    className="w-full text-center bg-slate-50 border border-sky-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-sky-500"
                  />
                  {receiveRequestAmount && (
                    <motion.div 
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="p-2 rounded-lg bg-sky-50 border border-sky-100 text-sky-600 text-[11px] font-medium"
                    >
                      QR requests to transfer precisely ₱{parseFloat(receiveRequestAmount).toLocaleString()}
                    </motion.div>
                  )}
                </div>

                <div className="pt-2">
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(`jcash://transfer?mobile=${currentUser.mobile}&amount=${receiveRequestAmount}`);
                      alert('📋 Mock QR Code connection link copied to your clipboard!');
                    }}
                    className="w-full py-2.5 bg-sky-100 hover:bg-sky-200 text-sky-700 hover:text-sky-850 text-xs rounded-xl flex items-center justify-center gap-1.5 font-semibold cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copy Transfer Payload Link
                  </button>
                </div>
              </div>
            )}

            {/* C. QR PAY / MERCHANT DISCOVERY FLOW */}
            {type === 'qrpay' && (
              <>
                {step === 1 && (
                  <div className="space-y-4">
                    {/* Visual simulated viewfinder */}
                    {qrScanning ? (
                      <div className="space-y-3">
                        <div 
                          onClick={runSimulatedScan}
                          className="relative aspect-[4/3] w-full rounded-2xl bg-slate-900 border-2 border-sky-200 overflow-hidden flex flex-col justify-center items-center cursor-pointer group hover:border-sky-300 transition"
                        >
                          {/* Outer absolute scan framing overlay */}
                          <div className="absolute inset-0 bg-slate-900/40 mix-blend-overlay flex flex-col items-center justify-center">
                            {/* Sweeping scan laser bar */}
                            <div className={`w-11/12 h-[2px] bg-sky-400 absolute left-4 right-4 ${scanStatus === 'scanning' ? 'animate-bounce' : 'animate-pulse'} shadow-[0_0_10px_rgba(56,189,248,0.8)]`} style={{ top: scanStatus === 'scanning' ? undefined : '50%' }} />
                            
                            {/* Dynamic scanning progress layout overlay */}
                            <div className="w-48 h-48 border-2 border-dashed border-sky-400/40 rounded-xl relative flex flex-col justify-center items-center text-center p-3">
                              {scanStatus === 'scanning' ? (
                                <div className="space-y-2">
                                  <span className="text-[12px] font-mono text-sky-400 font-extrabold block animate-pulse">DECODING: {scanProgress}%</span>
                                  <div className="w-32 bg-sky-950/80 rounded-full h-1.5 overflow-hidden mx-auto border border-sky-800/30">
                                    <div className="bg-sky-450 bg-sky-400 h-full transition-all duration-150" style={{ width: `${scanProgress}%` }} />
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  <span className="text-[10px] text-sky-400 font-mono tracking-wide uppercase font-semibold">CAMERA EYE ACTIVE</span>
                                  <span className="text-[9px] text-slate-400 block mt-1 font-sans">Tap Frame to Auto-Scan</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <Compass className={`w-12 h-12 text-sky-400 ${scanStatus === 'scanning' ? 'animate-spin' : 'opacity-20'}`} />
                          
                          {/* Live Dynamic Status Labels */}
                          <p className="text-[10px] text-sky-300 mt-2 font-mono z-10 px-4 text-center">
                            {scanStatus === 'scanning' ? (
                              scanProgress < 30 ? "📷 Aligning Jcash camera lens focus..." :
                              scanProgress < 70 ? "🎯 Spotting matrix barcodes & patterns..." :
                              "🧩 Resolving certified merchants ledger..."
                            ) : (
                              "Aim camera at merchant QR code, or click to scan"
                            )}
                          </p>
                        </div>

                        {/* Interactive scan action button */}
                        <button
                          type="button"
                          onClick={runSimulatedScan}
                          disabled={scanStatus === 'scanning'}
                          className={`w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition cursor-pointer ${
                            scanStatus === 'scanning'
                              ? 'bg-sky-50 text-sky-400 border-sky-100'
                              : 'bg-gradient-to-r from-sky-600 to-blue-500 text-white border-transparent hover:from-sky-550 hover:to-blue-550 shadow-md shadow-sky-605 shadow-sky-600/15'
                          }`}
                        >
                          <QrCode className="w-4 h-4 shrink-0" />
                          {scanStatus === 'scanning' ? `Processing QR Decryption (${scanProgress}%)` : `⚡ Simulate Barcode/QR scan`}
                        </button>
                      </div>
                    ) : null}

                    {/* Quick Merchant Selection mock UI */}
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="text-[10px] text-slate-500 font-mono tracking-wider uppercase font-semibold">Select local Jcash Merchant Terminal</label>
                        <button onClick={() => setQrScanning(!qrScanning)} className="text-[10px] text-sky-600 font-semibold hover:text-sky-700">
                          {qrScanning ? 'Manual Terminal List' : 'Enable Scanner Viewfinder'}
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {DEMO_MERCHANTS.map(m => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => {
                              setQrSelectedMerchant(m);
                              setQrScanning(false);
                            }}
                            className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                              qrSelectedMerchant?.id === m.id
                                ? 'bg-sky-100 border-sky-400'
                                : 'bg-sky-50/50 border-sky-100 hover:bg-sky-100/50'
                            }`}
                          >
                            <h5 className="text-[11px] font-bold text-slate-800 truncate">{m.name}</h5>
                            <p className="text-[9px] text-slate-500 mt-0.5">{m.category}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {qrSelectedMerchant && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-3"
                      >
                        <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-100 flex justify-between items-center text-xs">
                          <div>
                            <span className="text-slate-500 text-[10px] uppercase font-mono font-medium">Paying Merchant</span>
                            <h4 className="text-slate-850 font-bold">{qrSelectedMerchant.name}</h4>
                          </div>
                          <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">QR Verified</span>
                        </div>

                        <div>
                          <label className="text-xs text-slate-600 font-medium font-mono">Bill Amount (₱)</label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 text-sm">₱</span>
                            <input
                              type="number"
                              placeholder="0.00"
                              value={qrAmount}
                              onChange={(e) => setQrAmount(e.target.value)}
                              className="w-full text-base font-bold bg-slate-50 border border-sky-200 rounded-xl pl-8 pr-4 py-3 text-slate-800 focus:outline-none focus:border-sky-500"
                            />
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1">Wallet balance: ₱{wallet.balance.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                        </div>

                        <button
                          type="button"
                          onClick={() => setStep(2)}
                          disabled={!qrAmount || parseFloat(qrAmount) <= 0}
                          className="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-500 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer text-white"
                        >
                          Confirm Merchant Price Checkout
                        </button>
                      </motion.div>
                    )}
                  </div>
                )}

                {step === 2 && qrSelectedMerchant && (
                  <div className="space-y-4">
                    <div className="text-center p-4 rounded-xl bg-sky-50/75 border border-sky-100 space-y-1.5">
                      <p className="text-xs text-slate-500">Paying Out Jcash QR Code</p>
                      <h4 className="text-3xl font-display font-extrabold text-slate-850">
                        ₱{parseFloat(qrAmount).toLocaleString(undefined, {minimumFractionDigits: 2})}
                      </h4>
                      <p className="text-[10px] text-sky-600 font-mono font-semibold uppercase">SECURE ZERO-FEE NFC TRANSIT</p>
                    </div>

                    <div className="bg-sky-50 border border-sky-100 rounded-xl p-3 space-y-2 text-xs text-slate-700">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Checkout Shop</span>
                        <span className="text-slate-800 font-medium">{qrSelectedMerchant.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Category Tag</span>
                        <span className="text-slate-850 font-mono">{qrSelectedMerchant.category}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Source account</span>
                        <span className="text-slate-800">Jcash Digital Wallet</span>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-3">
                      <button onClick={() => setStep(1)} className="flex-1 py-3 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer">
                        Cancel/Scan Again
                      </button>
                      <button 
                        onClick={triggerQRPay} 
                        disabled={loading}
                        className="flex-1 py-3 text-xs bg-cyan-600 hover:bg-cyan-500 font-bold text-white rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        {loading ? 'Authorizing...' : 'Settle Payment Now'}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* D. CASH IN METHOD SELECT */}
            {type === 'cashin' && (
              <>
                {step === 1 && (
                  <div className="space-y-4">
                    {!cashInMethod ? (
                      <div className="space-y-3">
                        <label className="text-[10px] text-slate-500 font-mono tracking-wider uppercase font-semibold">Select Preferred Wallet Funding Channel</label>
                        
                        <button
                          onClick={() => setCashInMethod('bank')}
                          className="w-full p-4 rounded-xl bg-sky-50/55 border border-sky-100 hover:bg-sky-100/50 text-left flex items-center justify-between cursor-pointer transition"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                              <BankIcon className="w-5 h-5" />
                            </div>
                            <div>
                              <h5 className="text-xs font-semibold text-slate-800">Linked Bank Accounts</h5>
                              <p className="text-[10px] text-slate-500">BPI, BDO, UnionBank. Instant settlement.</p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        </button>

                        <button
                          onClick={() => setCashInMethod('overthecounter')}
                          className="w-full p-4 rounded-xl bg-sky-50/55 border border-sky-100 hover:bg-sky-100/50 text-left flex items-center justify-between cursor-pointer transition"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600">
                              <Smartphone className="w-5 h-5" />
                            </div>
                            <div>
                              <h5 className="text-xs font-semibold text-slate-800">Over-The-Counter Cash Desk</h5>
                              <p className="text-[10px] text-slate-500">7-Eleven Barcode, Pawnshops, Palawan.</p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        </button>
                      </div>
                    ) : cashInMethod === 'bank' ? (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <label className="text-xs text-slate-500 font-semibold font-mono uppercase tracking-wider">Select Linked Partner Bank</label>
                          <button onClick={() => setCashInMethod(null)} className="text-[11px] text-sky-600 hover:underline cursor-pointer font-semibold">Change Method</button>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          {['BPI', 'BDO', 'UnionBank'].map(bank => (
                            <button
                              key={bank}
                              type="button"
                              onClick={() => setCashInBankCode(bank)}
                              className={`py-2 px-3 text-xs font-bold rounded-xl border cursor-pointer transition ${
                                cashInBankCode === bank
                                  ? 'bg-sky-100 border-sky-400 text-sky-700'
                                  : 'bg-slate-50 border-sky-200 hover:bg-slate-100 text-slate-600'
                              }`}
                            >
                              {bank}
                            </button>
                          ))}
                        </div>

                        <div>
                          <label className="text-xs text-slate-600 font-medium font-mono">Amount to Add (₱)</label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 text-sm">₱</span>
                            <input
                              type="number"
                              placeholder="0.00"
                              value={cashInAmount}
                              onChange={(e) => setCashInAmount(e.target.value)}
                              className="w-full text-base font-bold bg-slate-50 border border-sky-200 rounded-xl pl-8 pr-4 py-3 text-slate-800 focus:outline-none"
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setStep(2)}
                          disabled={!cashInAmount || parseFloat(cashInAmount) <= 0}
                          className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-sky-500 font-bold text-xs flex items-center justify-center gap-1 text-white cursor-pointer hover:opacity-95"
                        >
                          Review Cash In Fund
                        </button>
                      </div>
                    ) : (
                      // 7-Eleven QR Barcode generator
                      <div className="space-y-4 text-center pb-2">
                        <div className="p-4 bg-white rounded-xl max-w-[200px] mx-auto border border-sky-100 shadow-sm">
                          {/* Simulated Barcode */}
                          <div className="flex flex-col items-center gap-1.5 p-1 bg-white">
                            <div className="h-20 w-44 bg-[repeating-linear-gradient(90deg,#0f172a,#0f172a_4px,#ffffff_4px,#ffffff_10px)]" />
                            <span className="font-mono text-[9px] text-slate-800 tracking-widest font-bold font-mono">7770194857210</span>
                          </div>
                        </div>

                        <div className="text-xs text-slate-600 max-w-[300px] mx-auto leading-relaxed">
                          Please present this barcode to any <span className="font-semibold text-emerald-600">7-Eleven CLiQQ Machine</span> cashier. Pay the corresponding amount to load cash instantly.
                        </div>

                        <div>
                          <label className="text-xs text-slate-600 font-medium font-mono">Enter Loaded Amount for Simulation (₱)</label>
                          <input
                            type="number"
                            required
                            placeholder="e.g. 1000"
                            value={cashInAmount}
                            onChange={(e) => setCashInAmount(e.target.value)}
                            className="w-full text-center text-sm font-bold bg-slate-50 border border-sky-200 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none"
                          />
                        </div>

                        <div className="flex gap-2">
                          <button onClick={() => setCashInMethod(null)} className="flex-1 py-2.5 text-xs text-slate-500 hover:text-slate-800 bg-slate-100 rounded-xl cursor-pointer">Back</button>
                          <button 
                            onClick={triggerCashIn} 
                            disabled={!cashInAmount}
                            className="flex-1 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl cursor-pointer"
                          >
                            Simulate OTC Cashier Payment
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-4">
                    <div className="text-center p-4 rounded-xl bg-sky-50 border border-sky-100 space-y-1.5">
                      <p className="text-xs text-slate-500">Wallet Funding Value</p>
                      <h4 className="text-3xl font-display font-extrabold text-slate-850">
                        ₱{parseFloat(cashInAmount).toLocaleString(undefined, {minimumFractionDigits: 2})}
                      </h4>
                      <p className="text-[10px] text-emerald-600 font-mono font-semibold">No Convenience charges applied</p>
                    </div>

                    <div className="bg-sky-50 border border-sky-100 rounded-xl p-3 space-y-2 text-xs text-slate-700">
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Transfer Channel</span>
                        <span className="text-slate-850 font-semibold">{cashInBankCode} Linked account</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Payment recipient</span>
                        <span className="text-slate-800 font-semibold">{currentUser.name} (Myself)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Destination</span>
                        <span className="text-slate-800 font-semibold">Available Balance</span>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-3">
                      <button onClick={() => setStep(1)} className="flex-1 py-3 text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl cursor-pointer">
                        Cancel
                      </button>
                      <button 
                        onClick={triggerCashIn} 
                        disabled={loading}
                        className="flex-1 py-3 text-xs bg-emerald-600 hover:bg-emerald-500 font-bold text-white rounded-xl flex items-center justify-center gap-1 cursor-pointer"
                      >
                        {loading ? 'Processing...' : 'Authorize Transaction'}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* E. BILLS PAYMENT CATEGORIES */}
            {type === 'bills' && (
              <>
                {step === 1 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-4 gap-2.5">
                      {[
                        { key: 'Electricity', icon: '⚡', biller: 'Meralco' },
                        { key: 'Telecoms', icon: '📶', biller: 'PLDT DSL' },
                        { key: 'Water', icon: '💧', biller: 'Maynilad' },
                        { key: 'Govt Bills', icon: '🏛️', biller: 'SSS Loan' }
                      ].map(billType => (
                        <button
                          key={billType.key}
                          type="button"
                          onClick={() => {
                            setBillCategory(billType.key);
                            setBillerName(billType.biller);
                          }}
                          className={`p-2.5 rounded-xl border text-center flex flex-col items-center justify-center transition shrink-0 cursor-pointer ${
                            billCategory === billType.key
                              ? 'bg-amber-50 border-amber-400 text-amber-700 font-bold'
                              : 'bg-slate-50 border-sky-150 border-sky-100 hover:bg-sky-50 text-slate-600'
                          }`}
                        >
                          <span className="text-lg mb-1">{billType.icon}</span>
                          <span className="text-[9px] font-semibold leading-none text-center truncate w-full">{billType.key}</span>
                        </button>
                      ))}
                    </div>

                    <div className="space-y-3.5 pt-1">
                      <div className="p-3 bg-sky-50 border border-sky-100 rounded-xl flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-medium">Selected Utility Biller</span>
                        <span className="text-slate-800 font-bold">{billerName}</span>
                      </div>

                      <div>
                        <label className="text-xs text-slate-600 font-medium font-mono">Biller Reference / Card Number</label>
                        <input
                          type="text"
                          placeholder="e.g. 02938475810237"
                          value={billAcctNo}
                          onChange={(e) => setBillAcctNo(e.target.value.replace(/\D/g, ''))}
                          className="w-full bg-slate-50 border border-sky-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-sky-500"
                        />
                      </div>

                      <div>
                        <label className="text-xs text-slate-600 font-medium font-mono">Billing Amount (₱)</label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 text-sm">₱</span>
                          <input
                            type="number"
                            placeholder="0.00"
                            value={billAmount}
                            onChange={(e) => setBillAmount(e.target.value)}
                            className="w-full text-base font-bold bg-slate-50 border border-sky-200 rounded-xl pl-8 pr-4 py-3 text-slate-800 focus:outline-none focus:border-sky-500"
                          />
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">Wallet balance: ₱{wallet.balance.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      disabled={!billAmount || billAcctNo.length < 8}
                      className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 font-bold text-white text-xs flex items-center justify-center gap-1 cursor-pointer mt-2 disabled:opacity-50"
                    >
                      Retrieve Billings invoice
                    </button>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-4">
                    <div className="text-center p-4 rounded-xl bg-sky-50 border border-sky-100 space-y-1.5">
                      <p className="text-xs text-slate-500">Total Bill settlement cost</p>
                      <h4 className="text-3xl font-display font-extrabold text-slate-850">
                        ₱{parseFloat(billAmount).toLocaleString(undefined, {minimumFractionDigits: 2})}
                      </h4>
                      <p className="text-[10px] text-amber-600 font-mono font-semibold">Instant reference certification provided</p>
                    </div>

                    <div className="bg-sky-50 border border-sky-100 rounded-xl p-3 space-y-2 text-xs text-slate-705">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Utility Provider</span>
                        <span className="text-slate-800 font-medium">{billerName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Account No. / Card ID</span>
                        <span className="text-slate-855 font-mono">{billAcctNo}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Channel fee</span>
                        <span className="text-emerald-600 font-bold">₱0.00 FREE</span>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-3">
                      <button onClick={() => setStep(1)} className="flex-1 py-3 text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl cursor-pointer">
                        Modify
                      </button>
                      <button 
                        onClick={triggerBillsPayment} 
                        disabled={loading}
                        className="flex-1 py-3 text-xs bg-amber-500 hover:bg-amber-400 font-bold text-white rounded-xl flex items-center justify-center gap-1 cursor-pointer"
                      >
                        {loading ? 'Settling bill...' : 'Settle Bill Now'}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* F. MOBILE PREPAID LOAD RELOADS */}
            {type === 'load' && (
              <>
                {step === 1 && (
                  <div className="space-y-4">
                    {/* Select Network */}
                    <div>
                      <label className="text-[10px] text-slate-500 font-semibold font-mono tracking-wider uppercase">Select Carrier Network</label>
                      <div className="grid grid-cols-4 gap-2 py-1.5">
                        {['Globe', 'Smart', 'TNT', 'DITO'].map(net => (
                          <button
                            key={net}
                            type="button"
                            onClick={() => {
                              setLoadNetwork(net as any);
                              setLoadPromo(null);
                            }}
                            className={`py-2 px-1 text-xs font-bold rounded-xl border text-center transition cursor-pointer ${
                              loadNetwork === net
                                ? 'bg-pink-100 border-pink-400 text-pink-700'
                                : 'bg-slate-50 border-sky-100 hover:bg-slate-100 text-slate-600'
                            }`}
                          >
                            {net}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Mobile Input */}
                    <div>
                      <label className="text-xs text-slate-600 font-semibold font-mono">Prepaid Subscriber Mobile (11 digits)</label>
                      <input
                        type="tel"
                        maxLength={11}
                        value={loadMobile}
                        onChange={(e) => setLoadMobile(e.target.value.replace(/\D/g, ''))}
                        className="w-full bg-slate-50 border border-sky-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    {/* Promos Offer Menu */}
                    <div>
                      <label className="text-[10px] text-slate-555 text-slate-500 font-semibold font-mono tracking-wider uppercase">Choose Carrier Promo Package</label>
                      <div className="space-y-2 mt-1.5 max-h-[170px] overflow-y-auto pr-1">
                        {promosCollection[loadNetwork].map(promo => (
                          <button
                            key={promo.id}
                            type="button"
                            onClick={() => setLoadPromo(promo)}
                            className={`w-full p-2.5 rounded-xl border text-left flex items-start justify-between transition cursor-pointer ${
                              loadPromo?.id === promo.id
                                ? 'bg-pink-50 border-pink-400'
                                : 'bg-slate-50/50 border-sky-100 hover:bg-sky-50'
                            }`}
                          >
                            <div className="max-w-[70%]">
                              <h5 className="text-xs font-bold text-slate-800">{promo.name}</h5>
                              <p className="text-[9px] text-slate-500 leading-tight mt-0.5">{promo.description}</p>
                            </div>
                            <span className="text-xs font-mono font-bold text-pink-600">₱{promo.price}.00</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      disabled={!loadPromo}
                      className="w-full py-3 rounded-xl bg-pink-600 hover:bg-pink-500 font-bold text-white text-xs flex items-center justify-center gap-1 cursor-pointer mt-2 disabled:opacity-50"
                    >
                      Review Load Voucher
                    </button>
                  </div>
                )}

                {step === 2 && loadPromo && (
                  <div className="space-y-4">
                    <div className="text-center p-4 rounded-xl bg-sky-50 border border-sky-100 space-y-1.5">
                      <p className="text-xs text-slate-500 font-medium">Purchasing Carrier Data Load</p>
                      <h4 className="text-3xl font-display font-extrabold text-slate-800">
                        ₱{loadPromo.price}.00
                      </h4>
                      <p className="text-[10px] text-pink-600 font-mono font-semibold">{loadNetwork} e-Rebate: +{Math.floor(loadPromo.price * 0.1)} Points</p>
                    </div>

                    <div className="bg-sky-50 border border-sky-100 rounded-xl p-3 space-y-2 text-xs text-slate-700">
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Carrier Network</span>
                        <span className="text-slate-850 font-semibold">{loadNetwork}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium font-semibold">Offer Promo Type</span>
                        <span className="text-pink-600 font-bold">{loadPromo.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Subscriber Line</span>
                        <span className="text-slate-800 font-mono">{loadMobile}</span>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-3">
                      <button onClick={() => setStep(1)} className="flex-1 py-3 text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl cursor-pointer">
                        Modify
                      </button>
                      <button 
                        onClick={triggerMobileLoad} 
                        disabled={loading}
                        className="flex-1 py-3 text-xs bg-pink-600 hover:bg-pink-500 font-bold text-white rounded-xl flex items-center justify-center gap-1 cursor-pointer"
                      >
                        {loading ? 'Processing PIN...' : 'Confirm Load Buy'}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* G. UNIVERSAL RECEIPT SUCCESS SHOW WINDOW (STEP 3) */}
            {step === 3 && (
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center py-6 space-y-5"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                  <CheckCircle2 className="w-10 h-10 animate-[bounce_1s]" />
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-xl font-display font-extrabold text-slate-800">Transaction Success!</h4>
                  <p className="text-xs text-slate-500">The amount has been successfully credited instantly.</p>
                </div>

                {/* Voucher Receipt design */}
                <div className="bg-sky-50/55 rounded-xl p-4.5 border border-sky-100 text-left space-y-3 font-mono text-xs relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
                  
                  <div className="flex justify-between pb-2 border-b border-sky-100">
                    <span className="text-slate-500">PROVIDER</span>
                    <span className="text-slate-800 font-bold tracking-tight">JCASH PHILIPPINES</span>
                  </div>

                  <div className="space-y-1.5 pt-1 text-[11px] text-slate-700">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">REF NUMBER</span>
                      <span className="text-sky-600 font-bold font-mono">{refNo || 'TXN394851890'}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">AMOUNT PAID</span>
                      <span className="text-slate-800 font-bold">
                        {type === 'send' && `₱${parseFloat(sendAmount).toLocaleString(undefined, {minimumFractionDigits: 2})}`}
                        {type === 'qrpay' && `₱${parseFloat(qrAmount).toLocaleString(undefined, {minimumFractionDigits: 2})}`}
                        {type === 'cashin' && `₱${parseFloat(cashInAmount).toLocaleString(undefined, {minimumFractionDigits: 2})}`}
                        {type === 'bills' && `₱${parseFloat(billAmount).toLocaleString(undefined, {minimumFractionDigits: 2})}`}
                        {type === 'load' && `₱${loadPromo?.price}.00 (${loadPromo?.name})`}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">BENEFICIARY</span>
                      <span className="text-slate-800 truncate font-semibold">
                        {type === 'send' && (sendTargetUser?.name || sendMobile)}
                        {type === 'qrpay' && qrSelectedMerchant?.name}
                        {type === 'cashin' && currentUser.name}
                        {type === 'bills' && billerName}
                        {type === 'load' && `${loadNetwork} (${loadMobile})`}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">DATE & TIME</span>
                      <span className="text-slate-500 font-mono">
                        {new Date().toLocaleString(undefined, { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">CURRENCY</span>
                      <span className="text-slate-800">PHP (₱)</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 justify-center text-[10px] text-slate-500 font-mono">
                  <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                  <span>DEPOSIT CERTIFIED BY JCASH DIGITAL PLATFORM</span>
                </div>

                <div className="pt-2">
                  <button 
                    onClick={onClose} 
                    className="w-full py-3 bg-sky-600 text-white text-xs font-bold rounded-xl hover:bg-sky-500 transition cursor-pointer"
                  >
                    Done & Close Receipt
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
