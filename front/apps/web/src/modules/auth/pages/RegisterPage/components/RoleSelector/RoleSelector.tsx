import React from 'react';
import { User, Building } from 'lucide-react';
import './RoleSelector.css';

interface RoleSelectorProps {
  selectedRole: 'CUSTOMER' | 'VENDOR';
  onSelect: (role: 'CUSTOMER' | 'VENDOR') => void;
}

export const RoleSelector: React.FC<RoleSelectorProps> = ({ selectedRole, onSelect }) => {
  return (
    <div className="auth-role-selector">
      <button
        type="button"
        className={`auth-role-option ${selectedRole === 'CUSTOMER' ? 'active' : ''}`}
        onClick={() => onSelect('CUSTOMER')}
      >
        <User size={20} />
        <div>
          <strong>Müştəri</strong>
          <small>Tur sifariş etmək üçün</small>
        </div>
      </button>

      <button
        type="button"
        className={`auth-role-option ${selectedRole === 'VENDOR' ? 'active' : ''}`}
        onClick={() => onSelect('VENDOR')}
      >
        <Building size={20} />
        <div>
          <strong>Tur Şirkəti</strong>
          <small>Tur satışı və agentlik</small>
        </div>
      </button>
    </div>
  );
};
