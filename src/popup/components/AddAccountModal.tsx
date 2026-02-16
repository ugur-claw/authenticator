// Add/Edit Account Modal Component

import React, { useState, useEffect } from 'react';
import { Account, isValidSecret, parseOtpauthUri } from '../utils/totp';

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (account: Account) => void;
  editAccount?: Account | null;
}

export const AddAccountModal: React.FC<AddAccountModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editAccount,
}) => {
  const [issuer, setIssuer] = useState('');
  const [accountName, setAccountName] = useState('');
  const [secret, setSecret] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (editAccount) {
      setIssuer(editAccount.issuer);
      setAccountName(editAccount.accountName);
      setSecret(editAccount.secret);
    } else {
      setIssuer('');
      setAccountName('');
      setSecret('');
    }
    setError('');
  }, [editAccount, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Check if it's an otpauth URI
    const parsed = parseOtpauthUri(secret);
    if (parsed) {
      const account: Account = {
        id: editAccount?.id || crypto.randomUUID(),
        issuer: parsed.issuer || issuer,
        accountName: parsed.accountName || accountName,
        secret: parsed.secret,
      };
      onSave(account);
      onClose();
      return;
    }

    // Validate manually entered secret
    const cleanSecret = secret.toUpperCase().replace(/\s/g, '');
    
    if (!accountName.trim()) {
      setError('Account name is required');
      return;
    }
    
    if (!isValidSecret(cleanSecret)) {
      setError('Invalid secret key. Must be at least 16 characters and valid Base32.');
      return;
    }

    const account: Account = {
      id: editAccount?.id || crypto.randomUUID(),
      issuer: issuer.trim(),
      accountName: accountName.trim(),
      secret: cleanSecret,
    };

    onSave(account);
    onClose();
  };

  const handleQrScan = async () => {
    try {
      // First, check the active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab?.id) {
        setError('No active tab found. Please switch to a tab with a QR code.');
        return;
      }

      // Check if the tab URL is supported for content scripts
      const url = tab.url || '';
      if (url.startsWith('chrome://') || url.startsWith('about:') || url.startsWith('file://') || url.startsWith('chrome-extension://')) {
        setError('Cannot scan QR codes on this page. Please navigate to a webpage with a QR code.');
        return;
      }

      console.log('[QR Scan] Starting on tab:', tab.id, tab.url);

      // Create listeners for the result BEFORE sending the message
      const listener = (message: { action: string; uri?: string; error?: string }) => {
        console.log('[QR Scan] Message received:', message);
        if (message.action === 'qrScanned' && message.uri) {
          setSecret(message.uri);
          setError('');
          chrome.runtime.onMessage.removeListener(listener);
          chrome.runtime.onMessage.removeListener(errorListener);
        } else if (message.action === 'qrScanError' && message.error) {
          setError(message.error);
          chrome.runtime.onMessage.removeListener(listener);
          chrome.runtime.onMessage.removeListener(errorListener);
        }
      };
      
      const errorListener = (message: { action: string; error?: string }) => {
        console.log('[QR Scan] Error message:', message);
        if (message.action === 'qrScanError' && message.error) {
          setError(message.error);
          chrome.runtime.onMessage.removeListener(listener);
          chrome.runtime.onMessage.removeListener(errorListener);
        }
      };
      
      chrome.runtime.onMessage.addListener(listener);
      chrome.runtime.onMessage.addListener(errorListener);

      // Request QR scanning - send to content script
      await chrome.tabs.sendMessage(tab.id, { action: 'startQrScan' });
    } catch (err) {
      console.error('[QR Scan] Error:', err);
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(`Could not start QR scan: ${errorMsg}. Make sure you are on a webpage (not a Chrome internal page) and try again.`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {editAccount ? 'Edit Account' : 'Add Account'}
          </h2>
          <button className="icon-btn" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {!editAccount && (
              <button
                type="button"
                className="btn btn-secondary"
                style={{ width: '100%', marginBottom: '16px' }}
                onClick={handleQrScan}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <rect x="7" y="7" width="3" height="3" />
                  <rect x="14" y="7" width="3" height="3" />
                  <rect x="7" y="14" width="3" height="3" />
                  <rect x="14" y="14" width="3" height="3" />
                </svg>
                Scan QR Code
              </button>
            )}

            <div className="form-group">
              <label className="form-label">Issuer (optional)</label>
              <input
                type="text"
                className="form-input"
                value={issuer}
                onChange={(e) => setIssuer(e.target.value)}
                placeholder="e.g., Google, GitHub"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Account Name *</label>
              <input
                type="text"
                className="form-input"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="e.g., user@example.com"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Secret Key {editAccount ? '(leave empty to keep current)' : '*'}
              </label>
              <input
                type="text"
                className="form-input"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder="Base32 secret or otpauth:// URI"
              />
            </div>

            {error && (
              <p style={{ color: 'var(--danger)', fontSize: '13px', marginTop: '8px' }}>
                {error}
              </p>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editAccount ? 'Save Changes' : 'Add Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
