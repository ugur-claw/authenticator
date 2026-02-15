// Main App Component

import React, { useState, useEffect } from 'react';
import {
  AccountCard,
  AddAccountModal,
  ImportExportModal,
  DeleteConfirmModal,
} from './components';
import { useAccounts, useTheme } from './hooks/useAuthenticator';
import { Account } from './utils/totp';
import './styles/index.css';

const App: React.FC = () => {
  const {
    accounts,
    loading,
    addAccount,
    updateAccount,
    deleteAccount,
    exportAccounts,
    importAccounts,
  } = useAccounts();
  
  const { isDark, toggle: toggleTheme } = useTheme();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportExport, setShowImportExport] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editAccount, setEditAccount] = useState<Account | null>(null);
  const [deleteAccountId, setDeleteAccountId] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute(
      'data-theme',
      isDark ? 'dark' : 'light'
    );
  }, [isDark]);

  const handleAddAccount = async (account: Account) => {
    if (editAccount) {
      await updateAccount(account.id, account);
    } else {
      await addAccount(account);
    }
    setEditAccount(null);
  };

  const handleEdit = (account: Account) => {
    setEditAccount(account);
    setShowAddModal(true);
  };

  const handleDelete = (id: string) => {
    setDeleteAccountId(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (deleteAccountId) {
      await deleteAccount(deleteAccountId);
    }
    setShowDeleteConfirm(false);
    setDeleteAccountId(null);
  };

  const handleCopyCode = () => {
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 1000);
  };

  // Listen for copy events from AccountCard
  useEffect(() => {
    const handleCardClick = () => handleCopyCode();
    document.addEventListener('copy-code', handleCardClick);
    return () => document.removeEventListener('copy-code', handleCardClick);
  }, []);

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <h1>Authenticator</h1>
        <div className="header-actions">
          <button
            className="icon-btn"
            onClick={() => setShowImportExport(true)}
            title="Import / Export"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17,8 12,3 7,8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </button>
          <button className="icon-btn" onClick={toggleTheme} title="Toggle theme">
            {isDark ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="content">
        {loading ? (
          <div className="empty-state">
            <p>Loading...</p>
          </div>
        ) : accounts.length === 0 ? (
          <div className="empty-state">
            <svg
              className="empty-state-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <h2 className="empty-state-title">No Accounts Yet</h2>
            <p className="empty-state-text">
              Add your first account to start generating TOTP codes.
            </p>
            <button
              className="btn btn-primary"
              onClick={() => setShowAddModal(true)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Account
            </button>
          </div>
        ) : (
          <>
            <div className="account-list">
              {accounts.map((account) => (
                <AccountCard
                  key={account.id}
                  account={account}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                />
              ))}
            </div>
            <button
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '16px' }}
              onClick={() => setShowAddModal(true)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Account
            </button>
          </>
        )}
      </main>

      {/* Modals */}
      <AddAccountModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditAccount(null);
        }}
        onSave={handleAddAccount}
        editAccount={editAccount}
      />

      <ImportExportModal
        isOpen={showImportExport}
        onClose={() => setShowImportExport(false)}
        onExport={exportAccounts}
        onImport={importAccounts}
      />

      <DeleteConfirmModal
        isOpen={showDeleteConfirm}
        accountName={
          accounts.find((a) => a.id === deleteAccountId)?.accountName || ''
        }
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setDeleteAccountId(null);
        }}
      />

      {/* Copy Feedback */}
      {copyFeedback && (
        <div className="copy-feedback">Code copied!</div>
      )}
    </div>
  );
};

export default App;
