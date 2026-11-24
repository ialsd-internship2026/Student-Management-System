import React, { useEffect } from 'react';
import { CheckCircle2, X } from 'lucide-react';

export default function Toast({ message, onClose }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className="toast-notification">
      <div className="toast-icon-wrap">
        <CheckCircle2 size={18} />
      </div>
      <div className="toast-text">{message}</div>
      <button className="toast-close-btn" onClick={onClose}>
        <X size={14} />
      </button>
    </div>
  );
}
