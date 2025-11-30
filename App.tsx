import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { LoginScreen } from './components/auth/LoginScreen';
import { PassengerFlow } from './components/passenger/PassengerFlow';
import { OwnerDashboard } from './components/owner/OwnerDashboard';

const LadakhConnectApp = () => {
  const { user } = useApp();

  if (!user) {
    return <LoginScreen />;
  }

  return user.role === 'passenger' ? <PassengerFlow /> : <OwnerDashboard />;
};

export default function App() {
  return (
    <AppProvider>
      <LadakhConnectApp />
    </AppProvider>
  );
}