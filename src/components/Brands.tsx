import React, { useState, useEffect } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, onSnapshot, addDoc, deleteDoc, doc, updateDoc, where } from 'firebase/firestore';
import { Plus, Trash2, Edit2, Save, X, RefreshCw, Search } from 'lucide-react';
import { getBrandLogo } from '../lib/helpers';

const DEFAULT_BRANDS = [
  { name: 'JAYO', defaultEmptySpoolWeight: 145, defaultSpoolType: 'plastic' },
  { name: 'eSUN', defaultEmptySpoolWeight: 225, defaultSpoolType: 'plastic' },
  { name: 'Smart Print', defaultEmptySpoolWeight: 250, defaultSpoolType: 'plastic' },
  { name: 'Professional LAB', defaultEmptySpoolWeight: 140, defaultSpoolType: 'cardboard' },
  { name: 'Fiberlogy', defaultEmptySpoolWeight: 250, defaultSpoolType: 'plastic' },
  { name: 'Rosa3D', defaultEmptySpoolWeight: 240, defaultSpoolType: 'plastic' },
  { name: 'Devil Design', defaultEmptySpoolWeight: 260, defaultSpoolType: 'plastic' },
  { name: 'Spectrum', defaultEmptySpoolWeight: 250, defaultSpoolType: 'plastic' },
  { name: 'Bambu Lab', defaultEmptySpoolWeight: 250, defaultSpoolType: 'plastic' },
  { name: 'Prusament', defaultEmptySpoolWeight: 200, defaultSpoolType: 'plastic' },
  { name: 'Polymaker', defaultEmptySpoolWeight: 140, defaultSpoolType: 'cardboard' },
  { name: 'Sunlu', defaultEmptySpoolWeight: 145, defaultSpoolType: 'plastic' },
  { name: 'Overture', defaultEmptySpoolWeight: 140, defaultSpoolType: 'cardboard' },
  { name: 'Anycubic', defaultEmptySpoolWeight: 200, defaultSpoolType: 'plastic' },
  { name: 'Creality', defaultEmptySpoolWeight: 200, defaultSpoolType: 'plastic' },
  { name: 'Eryone', defaultEmptySpoolWeight: 150, defaultSpoolType: 'cardboard' },
  { name: 'Print-Me', defaultEmptySpoolWeight: 250, defaultSpoolType: 'plastic' },
  { name: 'Nebula', defaultEmptySpoolWeight: 250, defaultSpoolType: 'plastic' },
  { name: 'PlastSpaw', defaultEmptySpoolWeight: 250, defaultSpoolType: 'plastic' },
  { name: 'Noctuo', defaultEmptySpoolWeight: 250, defaultSpoolType: 'plastic' },
  { name: 'Colorfil', defaultEmptySpoolWeight: 250, defaultSpoolType: 'plastic' },
  { name: '3D Kordo', defaultEmptySpoolWeight: 250, defaultSpoolType: 'plastic' },
  { name: 'F3D Filament', defaultEmptySpoolWeight: 250, defaultSpoolType: 'plastic' },
  { name: 'Wolfix', defaultEmptySpoolWeight: 250, defaultSpoolType: 'plastic' },
  { name: 'Zortrax', defaultEmptySpoolWeight: 300, defaultSpoolType: 'plastic' },
  { name: 'Hatchbox', defaultEmptySpoolWeight: 225, defaultSpoolType: 'plastic' },
  { name: 'Amolen', defaultEmptySpoolWeight: 200, defaultSpoolType: 'plastic' },
  { name: 'Flashforge', defaultEmptySpoolWeight: 250, defaultSpoolType: 'plastic' },
  { name: 'Geeetech', defaultEmptySpoolWeight: 200, defaultSpoolType: 'plastic' },
  { name: 'Kingroon', defaultEmptySpoolWeight: 150, defaultSpoolType: 'plastic' },
  { name: 'Elegoo', defaultEmptySpoolWeight: 140, defaultSpoolType: 'cardboard' },
  { name: 'Sovol', defaultEmptySpoolWeight: 200, defaultSpoolType: 'plastic' },
  { name: 'NinjaTek', defaultEmptySpoolWeight: 200, defaultSpoolType: 'plastic' },
  { name: 'MatterHackers', defaultEmptySpoolWeight: 250, defaultSpoolType: 'plastic' },
  { name: 'ColorFabb', defaultEmptySpoolWeight: 250, defaultSpoolType: 'plastic' },
  { name: 'Fillamentum', defaultEmptySpoolWeight: 250, defaultSpoolType: 'plastic' },
  { name: 'Formfutura', defaultEmptySpoolWeight: 250, defaultSpoolType: 'cardboard' },
  { name: 'Premium Filament', defaultEmptySpoolWeight: 250, defaultSpoolType: 'plastic' }
];

interface Brand {
  id: string;
  name: string;
  defaultEmptySpoolWeight: number;
  defaultSpoolType: string;
  logoUrl?: string;
  ownerId: string;
}

export default function Brands() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [defaultEmptySpoolWeight, setDefaultEmptySpoolWeight] = useState(200);
  const [defaultSpoolType, setDefaultSpoolType] = useState('plastic');
  const [logoUrl, setLogoUrl] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) return;
    
    const q = query(collection(db, 'brands'), where('ownerId', '==', auth.currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const brandsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Brand));
      setBrands(brandsData);
      setLoading(false);

      // Auto-sync if user has very few brands (e.g., only the initial 5)
      if (brandsData.length > 0 && brandsData.length < 10 && !isSyncing) {
        const existingBrandNames = new Set(brandsData.map(b => b.name.toLowerCase()));
        const missingBrands = DEFAULT_BRANDS.filter(b => !existingBrandNames.has(b.name.toLowerCase()));
        
        if (missingBrands.length > 0) {
          missingBrands.forEach(async (brand) => {
            try {
              await addDoc(collection(db, 'brands'), {
                ...brand,
                logoUrl: '',
                ownerId: auth.currentUser!.uid
              });
            } catch (e) {
              console.error("Auto-sync error:", e);
            }
          });
        }
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'brands');
    });

    return () => unsubscribe();
  }, [isSyncing]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !name.trim()) return;

    try {
      await addDoc(collection(db, 'brands'), {
        name: name.trim(),
        defaultEmptySpoolWeight: Number(defaultEmptySpoolWeight),
        defaultSpoolType,
        logoUrl: logoUrl.trim(),
        ownerId: auth.currentUser.uid
      });
      setIsAdding(false);
      resetForm();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'brands');
    }
  };

  const handleUpdate = async (id: string) => {
    if (!auth.currentUser || !name.trim()) return;

    try {
      await updateDoc(doc(db, 'brands', id), {
        name: name.trim(),
        defaultEmptySpoolWeight: Number(defaultEmptySpoolWeight),
        defaultSpoolType,
        logoUrl: logoUrl.trim()
      });
      setEditingId(null);
      resetForm();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `brands/${id}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Czy na pewno chcesz usunąć tę markę?')) return;
    try {
      await deleteDoc(doc(db, 'brands', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `brands/${id}`);
    }
  };

  const startEdit = (brand: any) => {
    setEditingId(brand.id);
    setName(brand.name);
    setDefaultEmptySpoolWeight(brand.defaultEmptySpoolWeight);
    setDefaultSpoolType(brand.defaultSpoolType);
    setLogoUrl(brand.logoUrl || '');
  };

  const resetForm = () => {
    setName('');
    setDefaultEmptySpoolWeight(200);
    setDefaultSpoolType('plastic');
    setLogoUrl('');
  };

  const handleSyncBrands = async () => {
    if (!auth.currentUser) return;
    setIsSyncing(true);
    try {
      const existingBrandNames = new Set(brands.map(b => b.name.toLowerCase()));
      const missingBrands = DEFAULT_BRANDS.filter(b => !existingBrandNames.has(b.name.toLowerCase()));
      
      for (const brand of missingBrands) {
        await addDoc(collection(db, 'brands'), {
          ...brand,
          logoUrl: '',
          ownerId: auth.currentUser.uid
        });
      }
      if (missingBrands.length > 0) {
        alert(`Dodano ${missingBrands.length} brakujących marek.`);
      } else {
        alert('Wszystkie domyślne marki są już na liście.');
      }
    } catch (error) {
      console.error("Błąd podczas synchronizacji marek:", error);
      alert('Wystąpił błąd podczas synchronizacji.');
    } finally {
      setIsSyncing(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-zinc-500 dark:text-zinc-400">Ładowanie marek...</div>;

  const filteredBrands = brands.filter(b => b.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Zarządzaj Markami</h1>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={handleSyncBrands}
            disabled={isSyncing}
            className="flex-1 sm:flex-none bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 px-4 py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            title="Wgraj brakujące domyślne marki"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} /> 
            <span className="hidden sm:inline">Synchronizuj</span>
          </button>
          {!isAdding && (
            <button
              onClick={() => { setIsAdding(true); resetForm(); setEditingId(null); }}
              className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" /> Dodaj Markę
            </button>
          )}
        </div>
      </div>

      {(isAdding || editingId) && (
        <form onSubmit={isAdding ? handleAdd : (e) => { e.preventDefault(); handleUpdate(editingId!); }} className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 mb-6 transition-colors">
          <h2 className="text-lg font-semibold mb-4 text-zinc-900 dark:text-white">{isAdding ? 'Dodaj Nową Markę' : 'Edytuj Markę'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Nazwa Marki</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-colors" placeholder="np. eSUN" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">URL Logo (Opcjonalnie)</label>
              <input type="url" value={logoUrl} onChange={e => setLogoUrl(e.target.value)} className="w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-colors" placeholder="https://..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Waga pustej szpuli (g)</label>
              <input type="number" value={defaultEmptySpoolWeight} onChange={e => setDefaultEmptySpoolWeight(Number(e.target.value))} required min="0" className="w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Typ Szpuli</label>
              <select value={defaultSpoolType} onChange={e => setDefaultSpoolType(e.target.value)} className="w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-colors">
                <option value="plastic">Plastikowa</option>
                <option value="cardboard">Kartonowa</option>
                <option value="metal">Metalowa</option>
                <option value="other">Inna</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => { setIsAdding(false); setEditingId(null); }} className="px-4 py-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl font-medium text-sm transition-colors">Anuluj</button>
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium text-sm flex items-center gap-2 transition-colors">
              <Save className="w-4 h-4" /> Zapisz
            </button>
          </div>
        </form>
      )}

      <div className="mb-4 relative">
        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
        <input
          type="text"
          placeholder="Szukaj marki..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
        />
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden transition-colors">
        {filteredBrands.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 dark:text-zinc-400">Brak marek spełniających kryteria.</div>
        ) : (
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {filteredBrands.map(brand => {
              const actualLogoUrl = getBrandLogo(brand.name, brand.logoUrl);
              return (
              <li key={brand.id} className="p-4 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                <div className="flex items-center gap-4">
                  {actualLogoUrl ? (
                    <div className="w-16 h-10 bg-white rounded px-1 flex items-center justify-center border border-zinc-200 dark:border-zinc-700">
                      <img src={actualLogoUrl} alt={brand.name} className="max-w-full max-h-full object-contain" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400 font-bold border border-zinc-200 dark:border-zinc-700">
                      {brand.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-zinc-900 dark:text-white">{brand.name}</h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      Pusta szpula: {brand.defaultEmptySpoolWeight}g • Typ: {brand.defaultSpoolType === 'plastic' ? 'Plastikowa' : brand.defaultSpoolType === 'cardboard' ? 'Kartonowa' : brand.defaultSpoolType === 'metal' ? 'Metalowa' : 'Inna'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => startEdit(brand)} className="p-2 text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(brand.id)} className="p-2 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
