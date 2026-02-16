// Custom React Hooks

import { useState, useEffect, useCallback } from 'react';
import { Account, generateTOTP, getRemainingSeconds } from '../utils/totp';
import * as storage from '../utils/storage';

// Hook for managing accounts
export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    const accs = await storage.getAccounts();
    setAccounts(accs);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const addAccount = useCallback(async (account: Account) => {
    await storage.addAccount(account);
    await loadAccounts();
  }, [loadAccounts]);

  const updateAccount = useCallback(
    async (id: string, updates: Partial<Account>) => {
      await storage.updateAccount(id, updates);
      await loadAccounts();
    },
    [loadAccounts]
  );

  const deleteAccount = useCallback(
    async (id: string) => {
      await storage.deleteAccount(id);
      await loadAccounts();
    },
    [loadAccounts]
  );

  const exportAccounts = useCallback(async () => {
    return storage.exportAccounts();
  }, []);

  const importAccounts = useCallback(
    async (data: string) => {
      const count = await storage.importAccounts(data);
      await loadAccounts();
      return count;
    },
    [loadAccounts]
  );

  return {
    accounts,
    loading,
    addAccount,
    updateAccount,
    deleteAccount,
    exportAccounts,
    importAccounts,
    refresh: loadAccounts,
  };
}

// Hook for TOTP codes with auto-refresh
export function useTOTPCode(secret: string) {
  const [code, setCode] = useState<string>('');
  const [remaining, setRemaining] = useState<number>(30);

  useEffect(() => {
    let mounted = true;

    const updateCode = async () => {
      if (!mounted) return;
      const newCode = await generateTOTP(secret);
      const newRemaining = getRemainingSeconds();
      
      if (mounted) {
        setCode(newCode);
        setRemaining(newRemaining);
      }
    };

    // Initial update
    updateCode();

    // Update every second
    const interval = setInterval(() => {
      const newRemaining = getRemainingSeconds();
      setRemaining(newRemaining);
      
      // Generate new code when period resets
      if (newRemaining >= 29) {
        updateCode();
      }
    }, 1000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [secret]);

  return { code, remaining };
}

// Hook for theme
export function useTheme() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check localStorage first
    const stored = localStorage.getItem('theme');
    if (stored) {
      setIsDark(stored === 'dark');
    } else {
      // Fall back to system preference
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setIsDark(mediaQuery.matches);
    }
  }, []);

  const toggle = useCallback(() => {
    setIsDark((prev) => {
      const newValue = !prev;
      localStorage.setItem('theme', newValue ? 'dark' : 'light');
      return newValue;
    });
  }, []);

  return { isDark, toggle };
}
