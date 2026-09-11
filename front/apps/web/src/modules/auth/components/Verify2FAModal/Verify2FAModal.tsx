import React, { useState } from 'react';
import { Modal, Input, Button } from '@toursales/ui';
import { ShieldCheck } from 'lucide-react';
import './Verify2FAModal.css';

interface Verify2FAModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: (code: string) => Promise<void>;
  isLoading: boolean;
}

export const Verify2FAModal: React.FC<Verify2FAModalProps> = ({
  isOpen,
  onClose,
  onVerify,
  isLoading,
}) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError('6 rəqəmli təhlükəsizlik kodunu daxil edin');
      return;
    }
    setError('');
    await onVerify(code);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldCheck className="text-gradient" size={24} />
          <span>İki Mərhələli Doğrulama (2FA)</span>
        </div>
      }
      size="sm"
    >
      <form className="auth-2fa-form" onSubmit={handleSubmit}>
        <p className="auth-2fa-desc">
          Google Authenticator tətbiqinizdə göstərilən 6 rəqəmli birdəfəlik kodu daxil edin.
        </p>

        {error && <div className="auth-form-error">{error}</div>}

        <Input
          placeholder="123456"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          maxLength={6}
          style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5rem' }}
          autoFocus
          required
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isLoading}
          style={{ width: '100%' }}
        >
          Təsdiq et və Daxil ol
        </Button>
      </form>
    </Modal>
  );
};
