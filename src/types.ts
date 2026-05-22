export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  name: string;
  mobile: string;
  email: string;
  registered_at: string;
  role: UserRole;
  avatar: string;
  pin: string; // 4-digit PIN for login/OTP verification simulation
  is_verified: boolean;
}

export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  points: number;
  savings: number;
}

export type TransactionType = 'send' | 'receive' | 'cash_in' | 'bills' | 'load' | 'reward';
export type TransactionStatus = 'success' | 'pending' | 'failed';

export interface Transaction {
  id: string;
  wallet_id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  sender_name?: string;
  sender_mobile?: string;
  receiver_name?: string;
  receiver_mobile?: string;
  reference_no: string;
  status: TransactionStatus;
  category: string; // e.g. "Meralco", "Gcash Send", "7-Eleven Cash In", "Steam Wallet Load"
  created_at: string;
}

export type NotificationType = 'payment' | 'cashback' | 'alert' | 'promo';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  description: string;
  type: NotificationType;
  read: boolean;
  created_at: string;
}

export interface Reward {
  id: string;
  title: string;
  description: string;
  points_cost: number;
  type: 'cashback' | 'daily' | 'referral';
  claimed: boolean;
  value: number; // Peso reward value
  created_at: string;
}

export interface QRPayment {
  id: string;
  merchant_name: string;
  merchant_id: string;
  qr_code: string;
  amount: number;
  status: 'pending' | 'success' | 'failed';
  created_at: string;
}

export interface Referral {
  id: string;
  referrer_id: string;
  referee_mobile: string;
  status: 'pending' | 'completed';
  reward_amount: number;
  created_at: string;
}
