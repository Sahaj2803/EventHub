import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { walletAPI } from '../services/api';
import { WalletTransaction } from '../types/auth';

interface Wallet {
  balance: number;
  currency: string;
  transactions: WalletTransaction[];
}

interface WalletContextType {
  wallet: Wallet | null;
  loading: boolean;
  error: string | null;
  refreshWallet: () => Promise<void>;
  rechargeWallet: (
    amount: number,
    paymentMethod: string,
    description?: string
  ) => Promise<void>;
  transactions: WalletTransaction[];
  transactionsLoading: boolean;
  loadTransactions: (
    page?: number,
    limit?: number,
    type?: string
  ) => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

interface WalletProviderProps {
  children: ReactNode;
  userId: string;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({
  children,
  userId,
}) => {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 🧠 Prevent multiple fetches
  const fetchedRef = useRef(false);

  // 🔄 Refresh wallet details
  const refreshWallet = useCallback(async () => {
    if (!userId) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await walletAPI.getWallet(userId);
      setWallet(response.data.wallet);
    } catch (err: any) {
      console.error('WalletContext: Error loading wallet:', err);
      const errorMessage =
        err.response?.data?.message || 'Failed to load wallet';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // 📜 Load transactions
  const loadTransactions = useCallback(
    async (page = 1, limit = 20, type?: string) => {
      if (!userId) {
        return;
      }

      setTransactionsLoading(true);
      try {
        const response = await walletAPI.getTransactions(userId, {
          page,
          limit,
          type,
        });
        setTransactions(response.data.transactions);
      } catch (err: any) {
        console.error('WalletContext: Error loading transactions:', err);
        setError(
          err.response?.data?.message || 'Failed to load transactions'
        );
      } finally {
        setTransactionsLoading(false);
      }
    },
    [userId]
  );

  // 💳 Recharge wallet
  const rechargeWallet = useCallback(
    async (amount: number, paymentMethod: string, description?: string) => {
      if (!userId) {
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const response = await walletAPI.recharge(userId, {
          amount,
          paymentMethod,
          description,
        });
        setWallet(response.data.wallet);
        // Refresh transactions after recharge without causing infinite loop
        const transactionsResponse = await walletAPI.getTransactions(userId, {
          page: 1,
          limit: 20,
        });
        setTransactions(transactionsResponse.data.transactions);
      } catch (err: any) {
        console.error('WalletContext: Recharge error:', err);
        const errorMessage =
          err.response?.data?.message || 'Failed to recharge wallet';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [userId]
  );

  // 🪄 Auto-load wallet + transactions on mount
  useEffect(() => {
    if (!userId) {
      setWallet({
        balance: 0,
        currency: 'USD',
        transactions: [],
      });
      return;
    }

    if (fetchedRef.current) return; // ⛔ Prevent duplicate calls
    fetchedRef.current = true;

    const fetchData = async () => {
      try {
        await refreshWallet();
        await loadTransactions();
      } catch (error) {
        console.error('WalletContext: Failed to load wallet data:', error);
        setWallet({
          balance: 0,
          currency: 'USD',
          transactions: [],
        });
      }
    };

    fetchData();
  }, [userId, refreshWallet, loadTransactions]); // Include all dependencies

  const value: WalletContextType = {
    wallet,
    loading,
    error,
    refreshWallet,
    rechargeWallet,
    transactions,
    transactionsLoading,
    loadTransactions,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

// 🧩 Hook for components to access WalletContext
export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
