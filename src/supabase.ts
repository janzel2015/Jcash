import { User, Wallet, Transaction, Notification, Reward, QRPayment, Referral } from './types';

// Initial Mock Data to seed localStorage if empty
const INITIAL_USERS: User[] = [
  {
    id: 'u1',
    name: 'Juan Dela Cruz',
    mobile: '09171234567',
    email: 'juan@jcash.com',
    registered_at: '2026-05-15T08:00:00Z',
    role: 'user',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
    pin: '0917',
    is_verified: true,
  },
  {
    id: 'u2',
    name: 'Marie Ramos',
    mobile: '09187654321',
    email: 'marie@jcash.com',
    registered_at: '2026-05-18T10:30:00Z',
    role: 'user',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    pin: '1111',
    is_verified: true,
  },
  {
    id: 'u3',
    name: 'Cardo Dalisay',
    mobile: '09223334444',
    email: 'cardo@jcash.com',
    registered_at: '2026-05-10T14:20:00Z',
    role: 'user',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=150&q=80',
    pin: '2222',
    is_verified: true,
  },
  {
    id: 'admin',
    name: 'Jcash Administrator',
    mobile: '09998887777',
    email: 'admin@jcash.com',
    registered_at: '2026-05-01T00:00:00Z',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
    pin: '8888',
    is_verified: true,
  }
];

const INITIAL_WALLETS: Wallet[] = [
  { id: 'w1', user_id: 'u1', balance: 7550.50, points: 240, savings: 3200.00 },
  { id: 'w2', user_id: 'u2', balance: 1240.25, points: 50, savings: 0.00 },
  { id: 'w3', user_id: 'u3', balance: 15800.00, points: 820, savings: 25000.00 },
  { id: 'w_admin', user_id: 'admin', balance: 999999.99, points: 99999, savings: 500000.00 }
];

const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx1',
    wallet_id: 'w1',
    user_id: 'u1',
    type: 'cash_in',
    amount: 5000,
    reference_no: 'TXN82749104',
    status: 'success',
    category: 'BPI Linked Account',
    created_at: '2026-05-20T09:15:00Z'
  },
  {
    id: 'tx2',
    wallet_id: 'w1',
    user_id: 'u1',
    type: 'bills',
    amount: 1850.25,
    reference_no: 'TXN91847101',
    status: 'success',
    category: 'Meralco Bills',
    created_at: '2026-05-21T18:40:00Z'
  },
  {
    id: 'tx3',
    wallet_id: 'w1',
    user_id: 'u1',
    type: 'send',
    amount: 1500,
    sender_name: 'Juan Dela Cruz',
    sender_mobile: '09171234567',
    receiver_name: 'Marie Ramos',
    receiver_mobile: '09187654321',
    reference_no: 'TXN30485910',
    status: 'success',
    category: 'Express Send',
    created_at: '2026-05-22T10:05:00Z'
  },
  {
    id: 'tx4',
    wallet_id: 'w2',
    user_id: 'u2',
    type: 'receive',
    amount: 1500,
    sender_name: 'Juan Dela Cruz',
    sender_mobile: '09171234567',
    receiver_name: 'Marie Ramos',
    receiver_mobile: '09187654321',
    reference_no: 'TXN30485910',
    status: 'success',
    category: 'Express Send Received',
    created_at: '2026-05-22T10:05:00Z'
  },
  {
    id: 'tx5',
    wallet_id: 'w1',
    user_id: 'u1',
    type: 'reward',
    amount: 50,
    reference_no: 'TXN_CASHBACK_01',
    status: 'success',
    category: 'Daily Jcash Check-in',
    created_at: '2026-05-22T06:00:00Z'
  },
  {
    id: 'tx6',
    wallet_id: 'w1',
    user_id: 'u1',
    type: 'load',
    amount: 100,
    reference_no: 'TXN38475917',
    status: 'success',
    category: 'Globe Prepaid Reload',
    created_at: '2026-05-22T13:45:00Z'
  }
];

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 'n1',
    user_id: 'u1',
    title: '🔒 Secure PIN Set',
    description: 'Your login security PIN was successfully updated. Never share your 4-digit PIN with anyone!',
    type: 'alert',
    read: false,
    created_at: '2026-05-15T08:05:00Z'
  },
  {
    id: 'n2',
    user_id: 'u1',
    title: '💸 Money Transferred',
    description: 'You sent ₱1,500.00 to Marie Ramos (09187654321) on May 22, 10:05 AM.',
    type: 'payment',
    read: false,
    created_at: '2026-05-22T10:05:30Z'
  },
  {
    id: 'n3',
    user_id: 'u1',
    title: '🎁 Cashback Awarded!',
    description: 'Earned ₱50.00 from your Jcash daily rewards streak! Keep it going.',
    type: 'cashback',
    read: false,
    created_at: '2026-05-22T06:01:00Z'
  },
  {
    id: 'n4',
    user_id: 'u1',
    title: '🔥 Promo: Free Grab Voucher',
    description: 'Pay bills worth ₱2,000+ this weekend and receive a ₱150 Grab voucher instantly!',
    type: 'promo',
    read: true,
    created_at: '2026-05-20T12:00:00Z'
  }
];

const INITIAL_REWARDS: Reward[] = [
  {
    id: 'r1',
    title: '₱50 GCash/Jcash Voucher',
    description: 'Redeem cold, hard cashback for 200 points.',
    points_cost: 200,
    type: 'cashback',
    claimed: false,
    value: 50,
    created_at: '2026-05-01T00:00:00Z'
  },
  {
    id: 'r2',
    title: '₱100 Bill discount voucher',
    description: 'Use on your next electricity or internet bills. Costs 350 points.',
    points_cost: 350,
    type: 'cashback',
    claimed: false,
    value: 100,
    created_at: '2026-05-02T00:00:00Z'
  },
  {
    id: 'r3',
    title: '₱20 Mobile Load Voucher',
    description: 'Instant load voucher for any network. Redemeable for 80 points.',
    points_cost: 80,
    type: 'cashback',
    claimed: false,
    value: 20,
    created_at: '2026-05-03T00:00:00Z'
  }
];

// Seed to LocalStorage helper
function initializeDatabase() {
  if (!localStorage.getItem('jcash_users')) {
    localStorage.setItem('jcash_users', JSON.stringify(INITIAL_USERS));
  }
  if (!localStorage.getItem('jcash_wallets')) {
    localStorage.setItem('jcash_wallets', JSON.stringify(INITIAL_WALLETS));
  }
  if (!localStorage.getItem('jcash_transactions')) {
    localStorage.setItem('jcash_transactions', JSON.stringify(INITIAL_TRANSACTIONS));
  }
  if (!localStorage.getItem('jcash_notifications')) {
    localStorage.setItem('jcash_notifications', JSON.stringify(INITIAL_NOTIFICATIONS));
  }
  if (!localStorage.getItem('jcash_rewards')) {
    localStorage.setItem('jcash_rewards', JSON.stringify(INITIAL_REWARDS));
  }
  if (!localStorage.getItem('jcash_qr_payments')) {
    localStorage.setItem('jcash_qr_payments', JSON.stringify([]));
  }
  if (!localStorage.getItem('jcash_referrals')) {
    localStorage.setItem('jcash_referrals', JSON.stringify([]));
  }
  // Store session user
  if (!localStorage.getItem('jcash_current_user')) {
    // Default logged in user for comfortable quick viewing (Juan)
    localStorage.setItem('jcash_current_user', JSON.stringify(INITIAL_USERS[0]));
  }
}

// Ensure database is initialized
initializeDatabase();

// Event Broker for Realtime simulations
type RealtimeCallback = (payload: any) => void;
class RealtimeBroker {
  private listeners: { [channel: string]: RealtimeCallback[] } = {};

  subscribe(channel: string, callback: RealtimeCallback) {
    if (!this.listeners[channel]) {
      this.listeners[channel] = [];
    }
    this.listeners[channel].push(callback);
    return () => {
      this.listeners[channel] = this.listeners[channel].filter(cb => cb !== callback);
    };
  }

  emit(channel: string, payload: any) {
    if (this.listeners[channel]) {
      this.listeners[channel].forEach(callback => {
        try {
          callback(payload);
        } catch (e) {
          console.error(`Error in realtime subscriber on channel ${channel}:`, e);
        }
      });
    }
  }
}

export const realtimeBroker = new RealtimeBroker();

// Supabase Local Simulator API
export const supabase = {
  auth: {
    getUser: async () => {
      const stored = localStorage.getItem('jcash_current_user');
      if (stored) {
        return { data: { user: JSON.parse(stored) as User }, error: null };
      }
      return { data: { user: null }, error: null };
    },

    signUp: async (email: string, pin: string, name: string, mobile: string) => {
      await new Promise(resolve => setTimeout(resolve, 600));
      const users: User[] = JSON.parse(localStorage.getItem('jcash_users') || '[]');
      
      // Validation
      if (users.some(u => u.email === email)) {
        return { data: null, error: new Error('Email already registered') };
      }
      if (users.some(u => u.mobile === mobile)) {
        return { data: null, error: new Error('Mobile number already registered') };
      }

      const newUser: User = {
        id: 'u_' + Math.random().toString(36).substr(2, 9),
        name,
        email,
        mobile,
        registered_at: new Date().toISOString(),
        role: 'user',
        avatar: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 999999)}?auto=format&fit=crop&w=150&q=80`,
        pin,
        is_verified: true
      };

      // Add user
      users.push(newUser);
      localStorage.setItem('jcash_users', JSON.stringify(users));

      // Add wallet
      const wallets: Wallet[] = JSON.parse(localStorage.getItem('jcash_wallets') || '[]');
      const newWallet: Wallet = {
        id: 'w_' + Math.random().toString(36).substr(2, 9),
        user_id: newUser.id,
        balance: 500.00, // Welcome gift of 500 Pesos!
        points: 20,      // Welcome reward points
        savings: 0.00
      };
      wallets.push(newWallet);
      localStorage.setItem('jcash_wallets', JSON.stringify(wallets));

      // Welcome Notification
      const notifications: Notification[] = JSON.parse(localStorage.getItem('jcash_notifications') || '[]');
      const newNotif: Notification = {
        id: 'n_' + Math.random().toString(36).substr(2, 9),
        user_id: newUser.id,
        title: '🎉 Welcome to Jcash!',
        description: 'Thank you for registering. You have received a ₱500.00 welcome bonus in your wallet!',
        type: 'promo',
        read: false,
        created_at: new Date().toISOString()
      };
      notifications.unshift(newNotif);
      localStorage.setItem('jcash_notifications', JSON.stringify(notifications));

      // Check referals (to reward referrer if any)
      const referrals: Referral[] = JSON.parse(localStorage.getItem('jcash_referrals') || '[]');
      const pendingRefIndex = referrals.findIndex(r => r.referee_mobile === mobile && r.status === 'pending');
      if (pendingRefIndex !== -1) {
        const referral = referrals[pendingRefIndex];
        referral.status = 'completed';
        referrals[pendingRefIndex] = referral;
        localStorage.setItem('jcash_referrals', JSON.stringify(referrals));

        // Credit referral bonus to referrer
        const referrerWallet = wallets.find(w => w.user_id === referral.referrer_id);
        if (referrerWallet) {
          referrerWallet.balance += referral.reward_amount;
          referrerWallet.points += 50;
          localStorage.setItem('jcash_wallets', JSON.stringify(wallets));

          // Send notification to referrer
          const refUser = users.find(u => u.id === referral.referrer_id);
          if (refUser) {
            const refNotif: Notification = {
              id: 'n_' + Math.random().toString(36).substr(2, 9),
              user_id: referral.referrer_id,
              title: '👥 Referral Bonus Credited!',
              description: `Your friend with mobile ${mobile} has registered. You earned ₱${referral.reward_amount}.00!`,
              type: 'cashback',
              read: false,
              created_at: new Date().toISOString()
            };
            notifications.unshift(refNotif);
            localStorage.setItem('jcash_notifications', JSON.stringify(notifications));
            
            // Log transaction for referrer
            const transactions: Transaction[] = JSON.parse(localStorage.getItem('jcash_transactions') || '[]');
            transactions.unshift({
              id: 'tx_ref_' + Math.random().toString(36).substr(2, 9),
              wallet_id: referrerWallet.id,
              user_id: referral.referrer_id,
              type: 'reward',
              amount: referral.reward_amount,
              reference_no: 'TXNREF' + Math.floor(100000 + Math.random() * 900000),
              status: 'success',
              category: 'Referral Bonus',
              created_at: new Date().toISOString()
            });
            localStorage.setItem('jcash_transactions', JSON.stringify(transactions));
          }
        }
      }

      // Log welcome transaction
      const transactions: Transaction[] = JSON.parse(localStorage.getItem('jcash_transactions') || '[]');
      transactions.unshift({
        id: 'tx_welcome_' + Math.random().toString(36).substr(2, 9),
        wallet_id: newWallet.id,
        user_id: newUser.id,
        type: 'cash_in',
        amount: 500,
        reference_no: 'TXNWELCOME' + Math.floor(100000 + Math.random() * 900000),
        status: 'success',
        category: 'Jcash Sign-up Bonus',
        created_at: new Date().toISOString()
      });
      localStorage.setItem('jcash_transactions', JSON.stringify(transactions));

      // Auto login
      localStorage.setItem('jcash_current_user', JSON.stringify(newUser));
      realtimeBroker.emit('auth_state_change', newUser);

      return { data: { user: newUser }, error: null };
    },

    signIn: async (emailOrMobile: string, pin: string) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      const users: User[] = JSON.parse(localStorage.getItem('jcash_users') || '[]');
      
      const foundUser = users.find(
        u => (u.email.toLowerCase() === emailOrMobile.toLowerCase() || u.mobile === emailOrMobile) && u.pin === pin
      );

      if (!foundUser) {
        return { data: null, error: new Error('Invalid Credentials or security PIN') };
      }

      localStorage.setItem('jcash_current_user', JSON.stringify(foundUser));
      realtimeBroker.emit('auth_state_change', foundUser);

      return { data: { user: foundUser }, error: null };
    },

    signOut: async () => {
      localStorage.removeItem('jcash_current_user');
      realtimeBroker.emit('auth_state_change', null);
      return { error: null };
    }
  },

  // Simulating query interactions
  from: (table: string) => {
    // Read current collections
    const getCollection = (): any[] => {
      const data = localStorage.getItem(`jcash_${table}`);
      return data ? JSON.parse(data) : [];
    };

    const saveCollection = (data: any[]) => {
      localStorage.setItem(`jcash_${table}`, JSON.stringify(data));
      // Notify Realtime listeners for this specific table (for dynamic table updates)
      realtimeBroker.emit(`db_${table}_updated`, data);
    };

    return {
      select: () => {
        let items = getCollection();
        
        const chain = {
          // Filter matching email or ID etc.
          eq: (field: string, value: any) => {
            items = items.filter(item => item[field] === value);
            return chain;
          },
          // Sorting
          order: (field: string, direction: 'asc' | 'desc' = 'desc') => {
            items.sort((a, b) => {
              const valA = a[field];
              const valB = b[field];
              if (direction === 'desc') {
                return valA < valB ? 1 : valA > valB ? -1 : 0;
              } else {
                return valA > valB ? 1 : valA < valB ? -1 : 0;
              }
            });
            return chain;
          },
          // Return raw response in style of Supabase
          then: (callback: (response: { data: any[] | null; error: any }) => void) => {
            callback({ data: items, error: null });
            return Promise.resolve({ data: items, error: null });
          }
        };
        return chain;
      },

      insert: (record: any) => {
        const items = getCollection();
        const records = Array.isArray(record) ? record : [record];
        const newRecords = records.map(r => ({
          id: r.id || 'id_' + Math.random().toString(36).substr(2, 9),
          created_at: r.created_at || new Date().toISOString(),
          ...r,
        }));

        items.unshift(...newRecords);
        saveCollection(items);

        // Standard realtime changes trigger e.g. balance modification or transaction listing
        realtimeBroker.emit(`db_${table}_inserted`, newRecords);
        
        return Promise.resolve({ data: newRecords, error: null });
      },

      update: (updates: any) => {
        let items = getCollection();
        let updatedItems: any[] = [];
        
        const chain = {
          eq: (field: string, value: any) => {
            items = items.map(item => {
              if (item[field] === value) {
                const updated = { ...item, ...updates };
                updatedItems.push(updated);
                return updated;
              }
              return item;
            });
            saveCollection(items);
            realtimeBroker.emit(`db_${table}_updated_rows`, updatedItems);
            return chain;
          },
          then: (callback: (response: { data: any[] | null; error: any }) => void) => {
            callback({ data: updatedItems, error: null });
            return Promise.resolve({ data: updatedItems, error: null });
          }
        };
        return chain;
      },

      delete: () => {
        let items = getCollection();
        let deletedItems: any[] = [];

        const chain = {
          eq: (field: string, value: any) => {
            deletedItems = items.filter(item => item[field] === value);
            items = items.filter(item => item[field] !== value);
            saveCollection(items);
            return chain;
          },
          then: (callback: (response: { data: any[] | null; error: any }) => void) => {
            callback({ data: deletedItems, error: null });
            return Promise.resolve({ data: deletedItems, error: null });
          }
        };
        return chain;
      }
    };
  }
};

// Simulated Real-Time System Triggers (Background Cron actions for visual realism)
// Every 60 seconds, there is a 20% chance of an incoming cash-back check-in or notification trigger
// to simulate beautiful live Supabase Realtime activities of payment, cashback or money alerts
export function startSimulationEngine(currentUserId: string, onEvent: (title: string, details: string, type: string) => void) {
  const promos = [
    { title: "🎁 Cashback Claimed!", description: "You received ₱15.00 cashback on your last prepaid purchase!", type: "cashback", amount: 15.00 },
    { title: "⚡ Instant Reward!", description: "Referral code 'JCASHFREE' triggered a ₱50.00 points cash!", type: "cashback", amount: 50.00 },
    { title: "💳 Received Money!", description: "Marie Ramos sent you ₱250.00 with massage: 'Salamat sa ulam!'", type: "payment", amount: 250.00, sender: "Marie Ramos" },
  ];

  const intervalId = setInterval(() => {
    if (Math.random() > 0.45) { // 55% chance
      const randomPromo = promos[Math.floor(Math.random() * promos.length)];
      
      // Update database balance securely
      const wallets: Wallet[] = JSON.parse(localStorage.getItem('jcash_wallets') || '[]');
      const userWallet = wallets.find(w => w.user_id === currentUserId);
      if (userWallet) {
        userWallet.balance += randomPromo.amount;
        userWallet.points += Math.floor(randomPromo.amount * 0.1);
        localStorage.setItem('jcash_wallets', JSON.stringify(wallets));
        realtimeBroker.emit('db_wallets_updated', wallets);
      }

      // Record transaction
      const transactions: Transaction[] = JSON.parse(localStorage.getItem('jcash_transactions') || '[]');
      const isReceive = randomPromo.type === 'payment';
      const refNo = 'TXNSIM' + Math.floor(10000000 + Math.random() * 90000000);
      const newTx: Transaction = {
        id: 'tx_sim_' + Math.random().toString(36).substr(2, 9),
        wallet_id: userWallet ? userWallet.id : 'w1',
        user_id: currentUserId,
        type: isReceive ? 'receive' : 'reward',
        amount: randomPromo.amount,
        sender_name: isReceive ? 'Marie Ramos' : undefined,
        sender_mobile: isReceive ? '09187654321' : undefined,
        reference_no: refNo,
        status: 'success',
        category: randomPromo.title,
        created_at: new Date().toISOString()
      };
      transactions.unshift(newTx);
      localStorage.setItem('jcash_transactions', JSON.stringify(transactions));
      realtimeBroker.emit('db_transactions_inserted', [newTx]);

      // Record notification
      const notifications: Notification[] = JSON.parse(localStorage.getItem('jcash_notifications') || '[]');
      const newNotif: Notification = {
        id: 'n_sim_' + Math.random().toString(36).substr(2, 9),
        user_id: currentUserId,
        title: randomPromo.title,
        description: randomPromo.description,
        type: randomPromo.type as any,
        read: false,
        created_at: new Date().toISOString()
      };
      notifications.unshift(newNotif);
      localStorage.setItem('jcash_notifications', JSON.stringify(notifications));
      realtimeBroker.emit('db_notifications_inserted', [newNotif]);

      // Invoke visual popup toast in the client!
      onEvent(randomPromo.title, randomPromo.description, randomPromo.type);
    }
  }, 35000); // Check every 35 seconds for live activity feedback on balance and notifications

  return () => clearInterval(intervalId);
}
