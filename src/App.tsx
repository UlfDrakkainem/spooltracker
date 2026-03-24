import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { auth } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import AddSpool from './components/AddSpool';
import EditSpool from './components/EditSpool';
import Brands from './components/Brands';
import { Package, PlusCircle, Settings, LogOut, Moon, Sun } from 'lucide-react';
import { logout } from './lib/firebase';
import { ThemeProvider, useTheme } from './components/ThemeProvider';

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  
  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="text-zinc-600 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400 flex items-center justify-center p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
      title="Zmień motyw"
    >
      {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">Ładowanie...</div>;
  }

  if (!user) {
    return (
      <ThemeProvider defaultTheme="system">
        <Auth />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider defaultTheme="system">
      <Router>
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col relative transition-colors duration-200">
          {/* Background Pattern */}
          <div className="absolute inset-0 z-0 pointer-events-none bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          
          <header className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-10 transition-colors duration-200">
            <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
              <Link to="/" className="font-bold text-lg flex items-center gap-2 text-zinc-900 dark:text-white">
                <Package className="w-5 h-5 text-blue-600 dark:text-blue-500" />
                SpoolTracker
              </Link>
              <nav className="flex items-center gap-2 sm:gap-4">
                <Link to="/add" className="text-zinc-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 text-sm font-medium p-2 sm:p-0 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 sm:hover:bg-transparent sm:dark:hover:bg-transparent transition-colors">
                  <PlusCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">Dodaj szpulę</span>
                </Link>
                <Link to="/brands" className="text-zinc-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 text-sm font-medium p-2 sm:p-0 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 sm:hover:bg-transparent sm:dark:hover:bg-transparent transition-colors">
                  <Settings className="w-4 h-4" />
                  <span className="hidden sm:inline">Marki</span>
                </Link>
                <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-700 mx-1 hidden sm:block"></div>
                <ThemeToggle />
                <button onClick={logout} className="text-zinc-600 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 flex items-center justify-center p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors" title="Wyloguj się">
                  <LogOut className="w-4 h-4" />
                </button>
              </nav>
            </div>
          </header>

          <main className="flex-1 max-w-5xl mx-auto w-full p-4 relative z-10">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/add" element={<AddSpool />} />
              <Route path="/edit/:id" element={<EditSpool />} />
              <Route path="/brands" element={<Brands />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </Router>
    </ThemeProvider>
  );
}
