// Storage Utility Functions
// Handles Chrome storage for accounts

import { Account } from './totp';

const STORAGE_KEY = 'authenticator_accounts';

// Get all accounts from storage
export async function getAccounts(): Promise<Account[]> {
  return new Promise((resolve) => {
    chrome.storage.local.get(STORAGE_KEY, (result) => {
      const accounts = result[STORAGE_KEY] || [];
      resolve(accounts);
    });
  });
}

// Save accounts to storage
export async function saveAccounts(accounts: Account[]): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [STORAGE_KEY]: accounts }, () => {
      resolve();
    });
  });
}

// Add a new account
export async function addAccount(account: Account): Promise<void> {
  const accounts = await getAccounts();
  accounts.push(account);
  await saveAccounts(accounts);
}

// Update an existing account
export async function updateAccount(
  id: string,
  updates: Partial<Account>
): Promise<void> {
  const accounts = await getAccounts();
  const index = accounts.findIndex((a) => a.id === id);
  
  if (index !== -1) {
    accounts[index] = { ...accounts[index], ...updates };
    await saveAccounts(accounts);
  }
}

// Delete an account
export async function deleteAccount(id: string): Promise<void> {
  const accounts = await getAccounts();
  const filtered = accounts.filter((a) => a.id !== id);
  await saveAccounts(filtered);
}

// Export accounts to JSON
export async function exportAccounts(): Promise<string> {
  const accounts = await getAccounts();
  
  // Simple base64 encoding (no encryption for v1)
  const json = JSON.stringify(accounts);
  return btoa(json);
}

// Import accounts from JSON
export async function importAccounts(jsonString: string): Promise<number> {
  try {
    const decoded = atob(jsonString);
    const accounts: Account[] = JSON.parse(decoded);
    
    if (!Array.isArray(accounts)) {
      throw new Error('Invalid format');
    }
    
    // Validate accounts - check for required fields
    const validAccounts = accounts.filter(
      (a) => a && a.secret && a.accountName
    );
    
    if (validAccounts.length === 0) {
      throw new Error('No valid accounts found');
    }
    
    // Assign new IDs to avoid conflicts
    const mappedAccounts = validAccounts.map((a) => ({
      ...a,
      id: crypto.randomUUID(),
    }));
    
    const existingAccounts = await getAccounts();
    const merged = [...existingAccounts, ...mappedAccounts];
    
    await saveAccounts(merged);
    
    return mappedAccounts.length;
  } catch (err) {
    // Log the actual error for debugging but throw a cleaner one
    console.warn('Import warning:', err);
    throw new Error('Invalid import data. Please check the format.');
  }
}
