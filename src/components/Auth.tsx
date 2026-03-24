import React from 'react';
import { loginWithGoogle } from '../lib/firebase';
import { Package } from 'lucide-react';

export default function Auth() {
  const handleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error('Błąd logowania', error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 p-4 transition-colors">
      <div className="bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 max-w-sm w-full text-center transition-colors">
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-6">
          <Package className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold mb-2 text-zinc-900 dark:text-white">SpoolTracker</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mb-8">Zarządzaj swoimi filamentami do druku 3D na wszystkich urządzeniach.</p>
        <button
          onClick={handleLogin}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          Zaloguj się przez Google
        </button>
      </div>
    </div>
  );
}
