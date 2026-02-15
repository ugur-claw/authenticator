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
      // Send message to content script to start selection
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) return;

      // Create a listener for the result
      const listener = (message: { action: string; uri?: string }) => {
        if (message.action === 'qrScanned' && message.uri) {
          setSecret(message.uri);
          chrome.runtime.onMessage.removeListener(listener);
        }
      };
      chrome.runtime.onMessage.addListener(listener);

      // Request QR scanning
      await chrome.tabs.sendMessage(tab.id, { action: 'startQrScan' });
    } catch (err) {
      console.error('QR scan error:', err);
      setError('Could not start QR scan. Please manually enter the secret.');
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
