// Account Card Component

import React, { useEffect, useRef } from 'react';
import { Account } from '../utils/totp';
import { useTOTPCode } from '../hooks/useAuthenticator';

interface AccountCardProps {
  account: Account;
  onDelete: (id: string) => void;
  onEdit: (account: Account) => void;
}

export const AccountCard: React.FC<AccountCardProps> = ({
  account,
  onDelete,
  onEdit,
}) => {
  const { code, remaining } = useTOTPCode(account.secret);
  const progressRef = useRef<HTMLDivElement>(null);

  const progress = (remaining / 30) * 100;

  useEffect(() => {
    if (progressRef.current) {
      progressRef.current.style.transition = remaining === 30 ? 'none' : 'width 1s linear';
      progressRef.current.style.width = `${progress}%`;
    }
  }, [remaining, progress]);

  const getStatusClass = () => {
    if (remaining <= 5) return 'danger';
    if (remaining <= 10) return 'warning';
    return 'success';
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    // Dispatch custom event for copy feedback
    const event = new CustomEvent('copy-code');
    document.dispatchEvent(event);
  };

  return (
    <div
      className="account-card"
      onClick={handleCopy}
      title="Click to copy"
    >
      <div className="account-header">
        <div>
          <div className="account-issuer">{account.issuer || 'Unknown'}</div>
          <div className="account-name">{account.accountName}</div>
        </div>
        <div className="header-actions" onClick={(e) => e.stopPropagation()}>
          <button
            className="icon-btn"
            onClick={() => onEdit(account)}
            title="Edit"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button
            className="icon-btn"
            onClick={() => onDelete(account.id)}
            title="Delete"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3,6 5,6 21,6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </div>
      </div>
      
      <div className="account-code-container">
        <span className={`account-code ${getStatusClass()}`}>
          {code.slice(0, 3)} {code.slice(3)}
        </span>
      </div>
      
      <div className="progress-container">
        <div className="progress-bar">
          <div
            ref={progressRef}
            className={`progress-fill ${getStatusClass()}`}
          />
        </div>
        <span className="progress-text">{remaining}s</span>
      </div>
    </div>
  );
};
