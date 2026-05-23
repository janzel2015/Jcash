import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase, realtimeBroker } from '../supabase';
import { Transaction, Wallet, User } from '../types';
import { 
  Search, ArrowUpRight, ArrowDownLeft, FileText, ShoppingBag, 
  HelpCircle, Calendar, Sparkles, Filter, X, Smartphone, Landmark, Wifi, CheckCircle2
} from 'lucide-react';

interface TransactionsViewProps {
  currentUser: User;
  wallet: Wallet;
}

export default function TransactionsView({ currentUser, wallet }: TransactionsViewProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filterTab, setFilterTab] = useState<'all' | 'send_recv' | 'cashin_load' | 'bills'>('all');
  const [search, setSearch] = useState('');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [receiptSuccessMessage, setReceiptSuccessMessage] = useState<string | null>(null);

  const fetchTransactions = async () => {
    const { data } = await supabase.from('transactions').select();
    if (data) {
      // Filter for current user only
      setTransactions(data.filter((t: any) => t.user_id === currentUser.id));
    }
  };

  useEffect(() => {
    fetchTransactions();

    // Subscribe to dynamic transaction insertion
    const unsubscribe = realtimeBroker.subscribe('db_transactions_inserted', () => {
      fetchTransactions();
    });

    const unsubscribeUpdated = realtimeBroker.subscribe('db_transactions_updated', () => {
      fetchTransactions();
    });

    return () => {
      unsubscribe();
      unsubscribeUpdated();
    };
  }, [currentUser]);

  // Handle Filtering match
  const getFilteredTransactions = () => {
    return transactions.filter(tx => {
      // Search matches
      const referenceMatch = tx.reference_no.toLowerCase().includes(search.toLowerCase());
      const categoryMatch = tx.category.toLowerCase().includes(search.toLowerCase());
      const queryMatch = referenceMatch || categoryMatch;

      if (!queryMatch) return false;

      // Tab filters
      if (filterTab === 'all') return true;
      if (filterTab === 'send_recv') return tx.type === 'send' || tx.type === 'receive' || tx.type === 'reward';
      if (filterTab === 'cashin_load') return tx.type === 'cash_in' || tx.type === 'load';
      if (filterTab === 'bills') return tx.type === 'bills';
      return true;
    });
  };

  // Icon mapping helper with high contrast light colors
  const getTxIcon = (type: Transaction['type'], category: string) => {
    if (type === 'send') return <ArrowUpRight className="w-4 h-4 text-rose-600" />;
    if (type === 'receive') return <ArrowDownLeft className="w-4 h-4 text-emerald-600" />;
    if (type === 'cash_in') return <Landmark className="w-4 h-4 text-indigo-600" />;
    if (type === 'bills') return <FileText className="w-4 h-4 text-amber-600" />;
    if (type === 'load') return <Wifi className="w-4 h-4 text-pink-600" />;
    if (type === 'reward') return <Sparkles className="w-4 h-4 text-yellow-600" />;
    return <ShoppingBag className="w-4 h-4 text-sky-600" />;
  };

  const getTxBg = (type: Transaction['type']) => {
    if (type === 'send') return 'bg-rose-50 border-rose-100';
    if (type === 'receive') return 'bg-emerald-50 border-emerald-100';
    if (type === 'cash_in') return 'bg-indigo-50 border-indigo-100';
    if (type === 'bills') return 'bg-amber-50 border-amber-100';
    if (type === 'load') return 'bg-pink-50 border-pink-100';
    if (type === 'reward') return 'bg-yellow-50 border-yellow-100';
    return 'bg-sky-50 border-sky-100';
  };

  const listItems = getFilteredTransactions();

  const handleDownloadReceipt = (txId: string) => {
    setReceiptSuccessMessage("Compiled transaction PDF voucher receipt instantly sent to your email!");
    setTimeout(() => {
      setReceiptSuccessMessage(null);
    }, 4000);
  };

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex justify-between items-center px-1">
        <div>
          <h2 className="text-xl font-display font-extrabold text-slate-800">Ledger Book</h2>
          <p className="text-[10px] text-slate-500 font-mono">Realtime Ledger Synchronization</p>
        </div>
        <span className="text-[10px] px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-100 font-bold font-mono">
          {transactions.length} LOGS
        </span>
      </div>

      {/* Search Input widget */}
      <div className="relative">
        <Search className="absolute inset-y-0 left-3.5 my-auto w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by reference no, category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white border border-sky-100 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-200"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute inset-y-0 right-3.5 my-auto text-slate-400 hover:text-slate-600">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Filtering tabs */}
      <div className="flex gap-1 overflow-x-auto py-1 scrollbar-none">
        {[
          { id: 'all', name: 'All Activities' },
          { id: 'send_recv', name: 'Send & Rewards' },
          { id: 'cashin_load', name: 'Load & Cash In' },
          { id: 'bills', name: 'Utility Bills' }
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilterTab(tab.id as any)}
            className={`px-3.5 py-1.5 text-xs rounded-lg shrink-0 border transition cursor-pointer font-medium ${
              filterTab === tab.id
                ? 'bg-sky-600 text-white border-transparent shadow-sm'
                : 'bg-sky-50/60 text-slate-600 border-sky-100/70 hover:bg-sky-100/50'
            }`}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {/* Transaction List Card Grid */}
      <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
        {listItems.length > 0 ? (
          listItems.map((tx, index) => {
            const isNegative = tx.type === 'send' || tx.type === 'bills' || tx.type === 'load';
            const dateStr = new Date(tx.created_at).toLocaleString(undefined, { 
              month: 'short', 
              day: 'numeric', 
              hour: '2-digit', 
              minute: '2-digit' 
            });

            return (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.05, 0.4) }}
                key={tx.id}
                onClick={() => setSelectedTx(tx)}
                className="w-full p-3.5 rounded-xl bg-white border border-sky-100 flex items-center justify-between text-left hover:border-sky-200 hover:bg-sky-50/20 shadow-[0_1px_3px_rgba(14,165,233,0.02)] transition active:scale-[0.99] cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${getTxBg(tx.type)}`}>
                    {getTxIcon(tx.type, tx.category)}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-800 leading-snug">
                      {tx.category}
                    </h5>
                    <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1 font-medium">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {dateStr}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`text-sm font-extrabold tracking-tight ${isNegative ? 'text-slate-700' : 'text-emerald-600'}`}>
                    {isNegative ? '-' : '+'}&#8369;{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                  <p className="text-[9px] text-slate-400 font-mono tracking-wider truncate max-w-[80px]">
                    {tx.reference_no}
                  </p>
                </div>
              </motion.button>
            );
          })
        ) : (
          <div className="py-12 text-center p-4 bg-sky-50/50 rounded-2xl border border-sky-100 space-y-2">
            <Filter className="w-8 h-8 text-slate-400 mx-auto opacity-30" />
            <h4 className="text-sm font-bold text-slate-700">No transactions recorded</h4>
            <p className="text-xs text-slate-500 leading-normal max-w-[260px] mx-auto">Amend search criteria or proceed with send/receive quick transfers.</p>
          </div>
        )}
      </div>

      {/* Transaction Details Sheet Drawer */}
      <AnimatePresence>
        {selectedTx && (
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setSelectedTx(null);
                setReceiptSuccessMessage(null);
              }}
              className="absolute inset-0 bg-slate-900/45 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ y: "100%", opacity: 0.8 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0.8 }}
              className="relative w-full max-w-md bg-white rounded-t-2xl md:rounded-2xl border-t border-sky-100 md:border md:border-sky-100 p-5 z-10 text-xs font-mono text-slate-700 shadow-2xl"
            >
              <div className="flex justify-between items-center pb-3 border-b border-sky-100 mb-4 font-sans">
                <span className="text-slate-800 text-xs font-extrabold">AUDIT TRANSACTION RECEIPT</span>
                <button 
                  onClick={() => {
                    setSelectedTx(null);
                    setReceiptSuccessMessage(null);
                  }} 
                  className="w-7 h-7 rounded-full bg-sky-50 hover:bg-sky-100 flex items-center justify-center text-sky-700 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {receiptSuccessMessage && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-3.5 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 font-sans text-xs flex gap-2 items-center"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{receiptSuccessMessage}</span>
                </motion.div>
              )}

              <div className="space-y-3">
                <div className="text-center p-3 py-4 bg-sky-50/70 border border-sky-100 rounded-xl">
                  <span className="text-[10px] text-slate-500 font-sans font-medium">LEDGER BALANCE VALUE</span>
                  <h4 className="text-2xl font-extrabold font-sans text-slate-800 mt-1">
                    ₱{selectedTx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </h4>
                </div>

                <div className="space-y-2 text-[11px] pt-1.5 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">REFERENCE NO</span>
                    <span className="text-sky-600 font-bold">{selectedTx.reference_no}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">TX CATEGORY</span>
                    <span className="text-slate-800 font-bold">{selectedTx.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">TX LEDGER STATUS</span>
                    <span className="text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-[9px]">SUCCESS</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">CREATED TIME</span>
                    <span className="text-slate-600 font-mono">
                      {new Date(selectedTx.created_at).toLocaleString()}
                    </span>
                  </div>
                  {selectedTx.sender_name && (
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">SENDER</span>
                      <span className="text-slate-800 font-semibold">{selectedTx.sender_name}</span>
                    </div>
                  )}
                  {selectedTx.receiver_name && (
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">RECIPIENT</span>
                      <span className="text-slate-800 truncate font-semibold max-w-[200px]">{selectedTx.receiver_name}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-3.5 border-t border-sky-100 flex justify-between items-center">
                <span className="text-[10px] text-slate-400 font-sans font-medium">Regulatory ID: BSP_8372-9184</span>
                <button
                  type="button"
                  onClick={() => handleDownloadReceipt(selectedTx.id)}
                  className="px-3.5 py-1.5 text-[11px] font-sans font-bold text-white bg-sky-600 hover:bg-sky-500 rounded-lg cursor-pointer transition shadow-sm"
                >
                  Download E-Bill
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
