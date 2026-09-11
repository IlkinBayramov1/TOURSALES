import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { VendorAuthProvider } from './shared/context/VendorAuthContext';
import { router } from './app/router';

export const App: React.FC = () => {
  return (
    <VendorAuthProvider>
      <RouterProvider router={router} />
    </VendorAuthProvider>
  );
};

export default App;
