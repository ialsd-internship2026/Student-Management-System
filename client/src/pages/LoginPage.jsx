import React from 'react';
import LoginForm from '../features/auth/components/LoginForm';

export default function LoginPage({ onLogin, branding }) {
  return <LoginForm onLogin={onLogin} branding={branding} />;
}
