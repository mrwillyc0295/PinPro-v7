import React from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatedBackButton } from './AnimatedBackButton';

export const GlobalBackButton: React.FC = () => {
  const location = useLocation();

  // Define routes where we don't want a back button (usually root or splash screens)
  const hideOn = ['/', '/home', '/welcome', '/inicio-registro', '/client/dashboard', '/pro/dashboard', '/dashboard', '/profile', '/profile/cliente', '/profile/profesional', '/messages', '/admin', '/admin/reports', '/admin/communications', '/admin-panel'];

  if (hideOn.includes(location.pathname) || location.pathname.startsWith('/messages/')) return null;

  return <AnimatedBackButton className="fixed top-4 left-4 z-[100]" />;
};
