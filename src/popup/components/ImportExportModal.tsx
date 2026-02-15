// Import/Export Modal Component

import React, { useState, useRef } from 'react';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: () => Promise<string>;
  onImport: (data: string) => Promise<number>;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
  isOpen,
  onClose,
  onExport,
  onImport,
}) => {
  const [mode, setMode] = useState<'import' | 'export'>('export');
  const [importData, setImportData] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    try {
      const data = await onExport();
      
      // Create and download file
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `authenticator-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setSuccess('Accounts exported successfully!');
      setTimeout(() => {
        setSuccess('');
        onClose();
      }, 2000);
    } catch (err) {
      setError('Failed to export accounts');
    }
  };

  const handleImport = async () => {
    setError('');
    setSuccess('');
    
    if (!importData.trim()) {
      setError('Please paste the export data');
      return;
    }

    try {
      const count = await onImport(importData);
      setSuccess(`Successfully imported ${count} account(s)!`);
      setTimeout(() => {
        setSuccess('');
        onImport('');
        onClose();
      }, 2000);
    } catch (err) {
      setError('Invalid import data. Please check the format.');
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      setImportData(text);
      setError('');
    } catch {
      setError('Failed to read file');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Import / Export</h2>
          <button className="icon-btn" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="modal-body">
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <button
              className={`btn ${mode === 'export' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setMode('export')}
              style={{ flex: 1 }}
            >
              Export
            </button>
            <button
              className={`btn ${mode === 'import' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setMode('import')}
              style={{ flex: 1 }}
            >
              Import
            </button>
          </div>

          {mode === 'export' ? (
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Export all your accounts as a JSON file. The data is encoded in Base64.
              </p>
              <button className="btn btn-primary" onClick={handleExport}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7,10 12,15 17,10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Export Accounts
              </button>
            </div>
          ) : (
            <div>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Paste your exported data or select a file to import accounts.
              </p>
              
              <div className="form-group">
                <label className="form-label">Import Data</label>
                <textarea
                  className="form-input"
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  placeholder="Paste exported JSON data here..."
                  rows={4}
                  style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: '12px' }}
                />
              </div>

              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>or</span>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".json"
                style={{ display: 'none' }}
              />
              <button
                className="btn btn-secondary"
                style={{ width: '100%' }}
                onClick={() => fileInputRef.current?.click()}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17,8 12,3 7,8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                Select File
              </button>
              
              {importData && (
                <button
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '12px' }}
                  onClick={handleImport}
                >
                  Import Accounts
                </button>
              )}
            </div>
          )}

          {error && (
            <p style={{ color: 'var(--danger)', fontSize: '13px', marginTop: '12px' }}>
              {error}
            </p>
          )}
          
          {success && (
            <p style={{ color: 'var(--success)', fontSize: '13px', marginTop: '12px' }}>
              {success}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
