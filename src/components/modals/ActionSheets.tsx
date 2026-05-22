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
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        />

        {/* Modal Container */}
        <motion.div 
          initial={{ y: "100%", opacity: 0.5 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0.5 }}
          transition={{ type: "spring", damping: 25, stiffness: 220 }}
          className="relative w-full max-w-md bg-slate-900 border-t border-slate-700/40 md:border md:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh] md:max-h-[85vh] text-slate-100 font-sans"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-white/5 bg-slate-900/60 backdrop-blur sticky top-0 z-10">
            <div className="flex items-center gap-2.5">
              {type === 'send' && (
                <div className="w-9 h-9 rounded-xl bg-blue-950/80 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Send className="w-5 h-5" />
                </div>
              )}
              {type === 'receive' && (
                <div className="w-9 h-9 rounded-xl bg-purple-950/80 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <QrCode className="w-5 h-5" />
                </div>
              )}
              {type === 'qrpay' && (
                <div className="w-9 h-9 rounded-xl bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Compass className="w-5 h-5 animate-pulse" />
                </div>
              )}
              {type === 'cashin' && (
                <div className="w-9 h-9 rounded-xl bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Landmark className="w-5 h-5" />
                </div>
              )}
              {type === 'bills' && (
                <div className="w-9 h-9 rounded-xl bg-amber-950/80 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <FileText className="w-5 h-5" />
                </div>
              )}
              {type === 'load' && (
                <div className="w-9 h-9 rounded-xl bg-pink-950/80 border border-pink-500/30 flex items-center justify-center text-pink-400">
                  <Wifi className="w-5 h-5 animate-bounce" />
                </div>
              )}

              <div>
                <h3 className="text-base font-display font-extrabold text-white">
                  {type === 'send' && 'Express Send Cash'}
                  {type === 'receive' && 'My Jcash QR Payload'}
                  {type === 'qrpay' && 'Scan & Pay Merchant'}
                  {type === 'cashin' && 'Cash In Channels'}
                  {type === 'bills' && 'Pay Bills Online'}
                  {type === 'load' && 'Reload Mobile Load'}
                </h3>
                <p className="text-[10px] text-slate-400 tracking-wide uppercase font-mono">
                  {step === 1 && 'Transaction Info'}
                  {step === 2 && 'Verification Preview'}
                  {step === 3 && 'Payment Success Receipt'}
                </p>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700/80 flex items-center justify-center text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body Section */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {error && (
              <div className="p-3 bg-red-950/50 border border-red-500/20 rounded-xl text-rose-300 text-xs flex gap-2 items-center">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
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
                      <label className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">Quick Transfer Recipients</label>
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
                                ? 'bg-cyan-950 border border-cyan-400' 
                                : 'bg-slate-800/40 border border-white/5 hover:bg-slate-800'
                            }`}
                          >
                            <img src={u.avatar} alt={u.name} className="w-10 h-10 rounded-full border border-white/10 shrink-0" />
                            <span className="text-[10px] font-medium mt-1.5 text-center text-slate-200 truncate max-w-[65px]">{u.name.split(' ')[0]}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Manual inputs */}
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-slate-400 font-medium font-mono">Receiver Mobile (11 digits)</label>
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
                          className="w-full bg-slate-900 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                        />
                        {sendTargetUser && (
                          <p className="text-[11px] text-cyan-400 mt-1 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Checked Name: {sendTargetUser.name}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="text-xs text-slate-400 font-medium font-mono">Amount (₱)</label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 text-sm">₱</span>
                          <input
                            type="number"
                            placeholder="0.00"
                            value={sendAmount}
                            onChange={(e) => setSendAmount(e.target.value)}
                            className="w-full text-base font-bold bg-slate-900 border border-white/5 rounded-xl pl-8 pr-4 py-3 text-white focus:outline-none"
                          />
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">Available balance: ₱{wallet.balance.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                      </div>

                      <div>
                        <label className="text-xs text-slate-400 font-medium font-mono">Optional Message</label>
                        <input
                          type="text"
                          placeholder="What is this for?"
                          value={sendMessage}
                          maxLength={40}
                          onChange={(e) => setSendMessage(e.target.value)}
                          className="w-full bg-slate-900 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      disabled={!sendAmount || (!sendMobile && !sendTargetUser)}
                      className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-medium text-xs flex items-center justify-center gap-2 cursor-pointer mt-4 disabled:opacity-50"
                    >
                      Retrieve Verification Summary
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-4">
                    <div className="text-center p-4 rounded-xl bg-slate-800/40 border border-white/5 space-y-1.5">
                      <p className="text-xs text-slate-400">Total express send amount</p>
                      <h4 className="text-3xl font-display font-extrabold text-white">
                        ₱{parseFloat(sendAmount).toLocaleString(undefined, {minimumFractionDigits: 2})}
                      </h4>
                      <p className="text-[11px] text-cyan-400 font-mono">Fee: ₱0.00 FREE</p>
                    </div>

                    <div className="bg-slate-900 rounded-xl p-3 border border-white/5 space-y-2.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Recipient Name</span>
                        <span className="text-white font-medium">{sendTargetUser?.name || 'Unverified Mobile'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Mobile Number</span>
                        <span className="text-white font-mono">{sendMobile}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Remarks</span>
                        <span className="text-white italic shrink-0 max-w-[200px] truncate">{sendMessage || 'n/a'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Source Account</span>
                        <span className="text-white">Jcash Wallet</span>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-3">
                      <button 
                        onClick={() => setStep(1)} 
                        className="flex-1 py-3 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl"
                      >
                        Modify Details
                      </button>
                      <button 
                        onClick={triggerSendMoney} 
                        disabled={loading}
                        className="flex-1 py-3 text-xs bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-90 font-bold text-white rounded-xl flex items-center justify-center gap-1.5"
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
                <div className="p-4 bg-white rounded-2xl w-52 h-52 mx-auto flex flex-col items-center justify-center shadow-lg relative">
                  {/* Real responsive vector mockup representation of a GCash/Jcash QR */}
                  <div className="grid grid-cols-5 grid-rows-5 gap-1.5 w-40 h-40 opacity-90 p-1 bg-white">
                    {[...Array(25)].map((_, idx) => (
                      <div 
                        key={idx} 
                        className={`rounded-[2px] ${
                          idx % 3 === 0 || idx % 7 === 0 || idx % 11 === 0 || idx < 5 || idx === 19 || idx === 24
                            ? 'bg-slate-900' 
                            : 'bg-slate-200'
                        }`} 
                      />
                    ))}
                  </div>
                  {/* Brand Center Logo inside QR */}
                  <div className="absolute top-[41%] left-[41%] w-10 h-10 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center border-2 border-white text-white font-display font-extrabold text-sm">
                    J
                  </div>
                </div>

                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-white">{currentUser.name}</h4>
                  <p className="text-xs text-slate-400 font-mono">{currentUser.mobile}</p>
                </div>

                {/* Input request amount generator */}
                <div className="max-w-[250px] mx-auto space-y-2">
                  <label className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">Request customized Amount (₱)</label>
                  <input
                    type="number"
                    placeholder="0.00 (optional)"
                    value={receiveRequestAmount}
                    onChange={(e) => setReceiveRequestAmount(e.target.value)}
                    className="w-full text-center bg-slate-900 border border-white/5 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none"
                  />
                  {receiveRequestAmount && (
                    <motion.div 
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="p-2 rounded-lg bg-cyan-950/40 border border-cyan-800/30 text-cyan-400 text-[11px] font-medium"
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
                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-xl flex items-center justify-center gap-1.5"
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
                      <div className="relative aspect-[4/3] w-full rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden flex flex-col justify-center items-center">
                        <div className="absolute inset-0 bg-slate-950/80 mix-blend-overlay flex flex-col items-center justify-center">
                          {/* Laser effect */}
                          <div className="w-52 h-[1px] bg-cyan-400 absolute animate-[ping_1.5s_infinite] shadow-[0_0_8px_cyan]" />
                          {/* Viewer corners */}
                          <div className="w-48 h-48 border-2 border-dashed border-cyan-500/50 rounded-xl relative flex flex-col justify-center items-center text-center p-2">
                            <span className="text-[10px] text-cyan-400 font-mono tracking-wide uppercase">CAMERA SCANNING ACTIVE</span>
                          </div>
                        </div>
                        <Compass className="w-12 h-12 text-cyan-400 animate-spin opacity-20" />
                        <p className="text-[10px] text-slate-500 mt-2">Aim camera at e-Bill or merchant QR terminal</p>
                      </div>
                    ) : null}

                    {/* Quick Merchant Selection mock UI */}
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">Select local Jcash Merchant Terminal</label>
                        <button onClick={() => setQrScanning(!qrScanning)} className="text-[10px] text-cyan-400">
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
                            className={`p-3 rounded-xl border text-left transition ${
                              qrSelectedMerchant?.id === m.id
                                ? 'bg-cyan-950 border-cyan-500'
                                : 'bg-slate-800/40 border-white/5 hover:bg-slate-800'
                            }`}
                          >
                            <h5 className="text-[11px] font-bold text-white truncate">{m.name}</h5>
                            <p className="text-[9px] text-slate-400 mt-0.5">{m.category}</p>
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
                        <div className="p-3.5 rounded-xl bg-slate-900 border border-white/5 flex justify-between items-center text-xs">
                          <div>
                            <span className="text-slate-400 text-[10px] uppercase font-mono">Paying Merchant</span>
                            <h4 className="text-white font-bold">{qrSelectedMerchant.name}</h4>
                          </div>
                          <span className="text-[10px] text-emerald-400 bg-emerald-950/50 border border-emerald-800/30 px-2 py-0.5 rounded-full">QR Verified</span>
                        </div>

                        <div>
                          <label className="text-xs text-slate-400 font-medium font-mono">Bill Amount (₱)</label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 text-sm">₱</span>
                            <input
                              type="number"
                              placeholder="0.00"
                              value={qrAmount}
                              onChange={(e) => setQrAmount(e.target.value)}
                              className="w-full text-base font-bold bg-slate-900 border border-white/5 rounded-xl pl-8 pr-4 py-3 text-white focus:outline-none"
                            />
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1">Wallet balance: ₱{wallet.balance.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                        </div>

                        <button
                          type="button"
                          onClick={() => setStep(2)}
                          disabled={!qrAmount || parseFloat(qrAmount) <= 0}
                          className="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                        >
                          Confirm Merchant Price Checkout
                        </button>
                      </motion.div>
                    )}
                  </div>
                )}

                {step === 2 && qrSelectedMerchant && (
                  <div className="space-y-4">
                    <div className="text-center p-4 rounded-xl bg-slate-800/40 border border-white/5 space-y-1.5">
                      <p className="text-xs text-slate-400">Paying Out Jcash QR Code</p>
                      <h4 className="text-3xl font-display font-extrabold text-white">
                        ₱{parseFloat(qrAmount).toLocaleString(undefined, {minimumFractionDigits: 2})}
                      </h4>
                      <p className="text-[10px] text-cyan-400 font-mono">SECURE ZERO-FEE NFC TRANSIT</p>
                    </div>

                    <div className="bg-slate-900 rounded-xl p-3 border border-white/5 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Checkout Shop</span>
                        <span className="text-white font-medium">{qrSelectedMerchant.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Category Tag</span>
                        <span className="text-white font-mono">{qrSelectedMerchant.category}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Source account</span>
                        <span className="text-white">Jcash Digital Wallet</span>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-3">
                      <button onClick={() => setStep(1)} className="flex-1 py-3 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl">
                        Cancel/Scan Again
                      </button>
                      <button 
                        onClick={triggerQRPay} 
                        disabled={loading}
                        className="flex-1 py-3 text-xs bg-cyan-500 hover:bg-cyan-400 font-bold text-white rounded-xl flex items-center justify-center gap-1.5"
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
                        <label className="text-[10px] text-[10px] text-slate-400 font-mono tracking-wider uppercase">Select Preferred Wallet Funding Channel</label>
                        
                        <button
                          onClick={() => setCashInMethod('bank')}
                          className="w-full p-4 rounded-xl bg-slate-800/40 border border-white/5 hover:bg-slate-800 text-left flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-indigo-950/80 border border-indigo-800/40 flex items-center justify-center text-indigo-400">
                              <BankIcon className="w-5 h-5" />
                            </div>
                            <div>
                              <h5 className="text-xs font-semibold text-white">Linked Bank Accounts</h5>
                              <p className="text-[10px] text-slate-400">BPI, BDO, UnionBank. Instant settlement.</p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-500" />
                        </button>

                        <button
                          onClick={() => setCashInMethod('overthecounter')}
                          className="w-full p-4 rounded-xl bg-slate-800/40 border border-white/5 hover:bg-slate-800 text-left flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-teal-950/80 border border-teal-800/40 flex items-center justify-center text-teal-400">
                              <Smartphone className="w-5 h-5" />
                            </div>
                            <div>
                              <h5 className="text-xs font-semibold text-white">Over-The-Counter Cash Desk</h5>
                              <p className="text-[10px] text-slate-400">7-Eleven Barcode, Pawnshops, Palawan.</p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-500" />
                        </button>
                      </div>
                    ) : cashInMethod === 'bank' ? (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <label className="text-xs text-slate-400 font-medium">Select Linked Partner Bank</label>
                          <button onClick={() => setCashInMethod(null)} className="text-[11px] text-cyan-400 hover:underline">Change Method</button>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          {['BPI', 'BDO', 'UnionBank'].map(bank => (
                            <button
                              key={bank}
                              type="button"
                              onClick={() => setCashInBankCode(bank)}
                              className={`py-2 px-3 text-xs font-bold rounded-xl border ${
                                cashInBankCode === bank
                                  ? 'bg-emerald-950 border-emerald-500 text-emerald-400'
                                  : 'bg-slate-800/80 border-white/5 hover:bg-slate-800 text-slate-300'
                              }`}
                            >
                              {bank}
                            </button>
                          ))}
                        </div>

                        <div>
                          <label className="text-xs text-slate-400 font-medium font-mono">Amount to Add (₱)</label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 text-sm">₱</span>
                            <input
                              type="number"
                              placeholder="0.00"
                              value={cashInAmount}
                              onChange={(e) => setCashInAmount(e.target.value)}
                              className="w-full text-base font-bold bg-slate-900 border border-white/5 rounded-xl pl-8 pr-4 py-3 text-white focus:outline-none"
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setStep(2)}
                          disabled={!cashInAmount || parseFloat(cashInAmount) <= 0}
                          className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 font-bold text-xs flex items-center justify-center gap-1 text-white cursor-pointer hover:opacity-95"
                        >
                          Review Cash In Fund
                        </button>
                      </div>
                    ) : (
                      // 7-Eleven QR Barcode generator
                      <div className="space-y-4 text-center">
                        <div className="p-4 bg-white rounded-xl max-w-[200px] mx-auto">
                          {/* Simulated Barcode */}
                          <div className="flex flex-col items-center gap-1.5 p-1 bg-white">
                            <div className="h-20 w-44 bg-[repeating-linear-gradient(90deg,#0f172a,#0f172a_4px,#ffffff_4px,#ffffff_10px)]" />
                            <span className="font-mono text-[9px] text-slate-800 tracking-widest font-bold">7770194857210</span>
                          </div>
                        </div>

                        <div className="text-xs text-slate-300 max-w-[300px] mx-auto">
                          Please present this barcode to any <span className="font-semibold text-emerald-400">7-Eleven CLiQQ Machine</span> cashier. Pay the corresponding amount to load cash instantly.
                        </div>

                        <div>
                          <label className="text-xs text-slate-400 font-medium font-mono">Enter Loaded Amount for Simulation (₱)</label>
                          <input
                            type="number"
                            required
                            placeholder="e.g. 1000"
                            value={cashInAmount}
                            onChange={(e) => setCashInAmount(e.target.value)}
                            className="w-full text-center text-sm font-bold bg-slate-900 border border-white/5 rounded-xl px-4 py-2.5 text-white focus:outline-none"
                          />
                        </div>

                        <div className="flex gap-2">
                          <button onClick={() => setCashInMethod(null)} className="flex-1 py-2.5 text-xs text-slate-400 hover:text-white bg-slate-800 rounded-xl">Back</button>
                          <button 
                            onClick={triggerCashIn} 
                            disabled={!cashInAmount}
                            className="flex-1 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl"
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
                    <div className="text-center p-4 rounded-xl bg-slate-800/40 border border-white/5 space-y-1.5">
                      <p className="text-xs text-slate-400">Wallet Funding Value</p>
                      <h4 className="text-3xl font-display font-extrabold text-white">
                        ₱{parseFloat(cashInAmount).toLocaleString(undefined, {minimumFractionDigits: 2})}
                      </h4>
                      <p className="text-[10px] text-emerald-400 font-mono">No Convenience charges applied</p>
                    </div>

                    <div className="bg-slate-900 rounded-xl p-3 border border-white/5 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Transfer Channel</span>
                        <span className="text-white font-medium">{cashInBankCode} Linked account</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Payment recipient</span>
                        <span className="text-white">{currentUser.name} (Myself)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Destination</span>
                        <span className="text-white">Available Balance</span>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-3">
                      <button onClick={() => setStep(1)} className="flex-1 py-3 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl">
                        Cancel
                      </button>
                      <button 
                        onClick={triggerCashIn} 
                        disabled={loading}
                        className="flex-1 py-3 text-xs bg-emerald-500 hover:bg-emerald-400 font-bold text-white rounded-xl flex items-center justify-center gap-1"
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
                          className={`p-2.5 rounded-xl border text-center flex flex-col items-center justify-center transition shrink-0 ${
                            billCategory === billType.key
                              ? 'bg-amber-950/60 border-amber-500 text-amber-400'
                              : 'bg-slate-850 border-white/5 hover:bg-slate-800 text-slate-300'
                          }`}
                        >
                          <span className="text-lg mb-1">{billType.icon}</span>
                          <span className="text-[9px] font-medium leading-none text-center truncate w-full">{billType.key}</span>
                        </button>
                      ))}
                    </div>

                    <div className="space-y-3.5 pt-1">
                      <div className="p-3 bg-slate-900 border border-white/5 rounded-xl flex items-center justify-between text-xs">
                        <span className="text-slate-400">Selected Utility Biller</span>
                        <span className="text-white font-bold">{billerName}</span>
                      </div>

                      <div>
                        <label className="text-xs text-slate-400 font-medium font-mono">Biller Reference / Card Number</label>
                        <input
                          type="text"
                          placeholder="e.g. 02938475810237"
                          value={billAcctNo}
                          onChange={(e) => setBillAcctNo(e.target.value.replace(/\D/g, ''))}
                          className="w-full bg-slate-900 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-xs text-slate-400 font-medium font-mono">Billing Amount (₱)</label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 text-sm">₱</span>
                          <input
                            type="number"
                            placeholder="0.00"
                            value={billAmount}
                            onChange={(e) => setBillAmount(e.target.value)}
                            className="w-full text-base font-bold bg-slate-900 border border-white/5 rounded-xl pl-8 pr-4 py-3 text-white focus:outline-none"
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
                    <div className="text-center p-4 rounded-xl bg-slate-800/40 border border-white/5 space-y-1.5">
                      <p className="text-xs text-slate-400">Total Bill settlement cost</p>
                      <h4 className="text-3xl font-display font-extrabold text-white">
                        ₱{parseFloat(billAmount).toLocaleString(undefined, {minimumFractionDigits: 2})}
                      </h4>
                      <p className="text-[10px] text-amber-500 font-mono">Instant reference certification provided</p>
                    </div>

                    <div className="bg-slate-900 rounded-xl p-3 border border-white/5 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Utility Provider</span>
                        <span className="text-white font-medium">{billerName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Account No. / Card ID</span>
                        <span className="text-white font-mono">{billAcctNo}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Channel fee</span>
                        <span className="text-white text-emerald-400 font-bold">₱0.00 FREE</span>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-3">
                      <button onClick={() => setStep(1)} className="flex-1 py-3 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl">
                        Modify
                      </button>
                      <button 
                        onClick={triggerBillsPayment} 
                        disabled={loading}
                        className="flex-1 py-3 text-xs bg-amber-500 hover:bg-amber-400 font-bold text-slate-950 rounded-xl flex items-center justify-center gap-1"
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
                      <label className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">Select Carrier Network</label>
                      <div className="grid grid-cols-4 gap-2 py-1.5">
                        {['Globe', 'Smart', 'TNT', 'DITO'].map(net => (
                          <button
                            key={net}
                            type="button"
                            onClick={() => {
                              setLoadNetwork(net as any);
                              setLoadPromo(null);
                            }}
                            className={`py-2 px-1 text-xs font-bold rounded-xl border text-center transition ${
                              loadNetwork === net
                                ? 'bg-pink-950 border-pink-500 text-pink-400'
                                : 'bg-slate-800/80 border-white/5 hover:bg-slate-800 text-slate-300'
                            }`}
                          >
                            {net}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Mobile Input */}
                    <div>
                      <label className="text-xs text-slate-400 font-medium font-mono">Prepaid Subscriber Mobile (11 digits)</label>
                      <input
                        type="tel"
                        maxLength={11}
                        value={loadMobile}
                        onChange={(e) => setLoadMobile(e.target.value.replace(/\D/g, ''))}
                        className="w-full bg-slate-900 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                      />
                    </div>

                    {/* Promos Offer Menu */}
                    <div>
                      <label className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">Choose Carrier Promo Package</label>
                      <div className="space-y-2 mt-1.5 max-h-[170px] overflow-y-auto pr-1">
                        {promosCollection[loadNetwork].map(promo => (
                          <button
                            key={promo.id}
                            type="button"
                            onClick={() => setLoadPromo(promo)}
                            className={`w-full p-2.5 rounded-xl border text-left flex items-start justify-between transition ${
                              loadPromo?.id === promo.id
                                ? 'bg-pink-950 border-pink-500'
                                : 'bg-slate-800/40 border-white/5 hover:bg-slate-850'
                            }`}
                          >
                            <div className="max-w-[70%]">
                              <h5 className="text-xs font-bold text-white">{promo.name}</h5>
                              <p className="text-[9px] text-slate-400 leading-tight mt-0.5">{promo.description}</p>
                            </div>
                            <span className="text-xs font-mono font-bold text-pink-400">₱{promo.price}.00</span>
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
                    <div className="text-center p-4 rounded-xl bg-slate-800/40 border border-white/5 space-y-1.5">
                      <p className="text-xs text-slate-400">Purchasing Carrier Data Load</p>
                      <h4 className="text-3xl font-display font-extrabold text-white">
                        ₱{loadPromo.price}.00
                      </h4>
                      <p className="text-[10px] text-pink-400 font-mono">{loadNetwork} e-Rebate: +{Math.floor(loadPromo.price * 0.1)} Points</p>
                    </div>

                    <div className="bg-slate-900 rounded-xl p-3 border border-white/5 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Carrier Network</span>
                        <span className="text-white font-medium">{loadNetwork}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Offer Promo Type</span>
                        <span className="text-white font-bold">{loadPromo.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Subscriber Line</span>
                        <span className="text-white font-mono">{loadMobile}</span>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-3">
                      <button onClick={() => setStep(1)} className="flex-1 py-3 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl">
                        Modify
                      </button>
                      <button 
                        onClick={triggerMobileLoad} 
                        disabled={loading}
                        className="flex-1 py-3 text-xs bg-pink-500 hover:bg-pink-400 font-bold text-slate-950 rounded-xl flex items-center justify-center gap-1"
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
                <div className="w-16 h-16 rounded-full bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-center mx-auto text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                  <CheckCircle2 className="w-10 h-10 animate-[bounce_1s]" />
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-xl font-display font-extrabold text-white">Transaction Success!</h4>
                  <p className="text-xs text-slate-400">The amount has been successfully credited instantly.</p>
                </div>

                {/* Voucher Receipt design */}
                <div className="bg-slate-950/60 rounded-xl p-4.5 border border-slate-800 text-left space-y-3 font-mono text-xs relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
                  
                  <div className="flex justify-between pb-2 border-b border-white/5">
                    <span className="text-slate-500">PROVIDER</span>
                    <span className="text-white font-bold tracking-tight">JCASH PHILIPPINES</span>
                  </div>

                  <div className="space-y-1.5 pt-1 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-500">REF NUMBER</span>
                      <span className="text-cyan-400 font-bold">{refNo || 'TXN394851890'}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-500">AMOUNT PAID</span>
                      <span className="text-white font-bold">
                        {type === 'send' && `₱${parseFloat(sendAmount).toLocaleString(undefined, {minimumFractionDigits: 2})}`}
                        {type === 'qrpay' && `₱${parseFloat(qrAmount).toLocaleString(undefined, {minimumFractionDigits: 2})}`}
                        {type === 'cashin' && `₱${parseFloat(cashInAmount).toLocaleString(undefined, {minimumFractionDigits: 2})}`}
                        {type === 'bills' && `₱${parseFloat(billAmount).toLocaleString(undefined, {minimumFractionDigits: 2})}`}
                        {type === 'load' && `₱${loadPromo?.price}.00 (${loadPromo?.name})`}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-500">BENEFICIARY</span>
                      <span className="text-white truncate">
                        {type === 'send' && (sendTargetUser?.name || sendMobile)}
                        {type === 'qrpay' && qrSelectedMerchant?.name}
                        {type === 'cashin' && currentUser.name}
                        {type === 'bills' && billerName}
                        {type === 'load' && `${loadNetwork} (${loadMobile})`}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-500">DATE & TIME</span>
                      <span className="text-slate-300">
                        {new Date().toLocaleString(undefined, { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-500">CURRENCY</span>
                      <span className="text-white">PHP (₱)</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 justify-center text-[10px] text-slate-500 font-mono">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
                  <span>DEPOSIT CERTIFIED BY SUPABASE LEDGER</span>
                </div>

                <div className="pt-2">
                  <button 
                    onClick={onClose} 
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs font-bold rounded-xl hover:opacity-90 transition cursor-pointer"
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
