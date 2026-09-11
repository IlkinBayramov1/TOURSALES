import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { AdminAuthProvider } from './shared/context/AdminAuthContext';
import { router } from './app/router';

export const App: React.FC = () => {
  return (
    <AdminAuthProvider>
      <RouterProvider router={router} />
    </AdminAuthProvider>
  );
};

export default App;
