import React from 'react';
import LoginForm from '../features/auth/components/LoginForm';

export default function LoginPage({ onLogin }) {
  return <LoginForm onLogin={onLogin} />;
}
