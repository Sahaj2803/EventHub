export interface User {
  _id: string;
  id?: string; // Keep for backward compatibility
  name: string;
  email: string;
  role: 'user' | 'organizer' | 'admin';
  avatar?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  preferences?: {
    notifications: {
      email: boolean;
      sms: boolean;
    };
    categories: string[];
  };
  wallet?: {
    balance: number;
    currency: string;
    transactions: WalletTransaction[];
  };
}

export interface WalletTransaction {
  _id: string;
  type: 'credit' | 'debit' | 'refund';
  amount: number;
  description: string;
  bookingId?: string;
  paymentMethod: 'stripe' | 'paypal' | 'bank_transfer' | 'wallet' | 'refund';
  transactionId?: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  createdAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role?: 'user' | 'organizer';
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}
