import React, { useState, useEffect } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, onSnapshot, addDoc, serverTimestamp, where } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { ScanBarcode, Save, ArrowLeft, Plus, X } from 'lucide-react';
import Scanner from './Scanner';
import { guessColorHex } from '../lib/helpers';

const MATERIALS = [
  'PLA', 'PLA+', 'Matte PLA', 'Silk PLA', 'Wood PLA', 'PETG', 'PETG-CF', 'ABS', 'ASA', 'TPU 95A', 'TPU 85A', 'PC', 'Nylon (PA)', 'PA-CF', 'HIPS', 'PVA', 'Inny'
];

export default function AddSpool() {
  const navigate = useNavigate();
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showScanner, setShowScanner] = useState(false);

  // Form state
  const [brandId, setBrandId] = useState('');
  const [material, setMaterial] = useState('PLA');
  const [color, setColor] = useState('');
  const [colorHex, setColorHex] = useState('#000000');
  const [isMultiColor, setIsMultiColor] = useState(false);
  const [colorHexes, setColorHexes] = useState<string[]>(['#000000', '#ffffff']);
  const [nozzleTemp, setNozzleTemp] = useState('');
  const [bedTemp, setBedTemp] = useState('');
  const [barcode, setBarcode] = useState('');
  const [initialWeight, setInitialWeight] = useState(1000);
  const [emptySpoolWeight, setEmptySpoolWeight] = useState(200);
  const [spoolType, setSpoolType] = useState('plastic');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const barcodeParam = params.get('barcode');
    if (barcodeParam) {
      setBarcode(barcodeParam);
    }
  }, []);

  useEffect(() => {
    if (color && !isMultiColor && (colorHex === '#000000' || colorHex === '#cccccc')) {
      const guessed = guessColorHex(color);
      if (guessed !== '#cccccc') {
        setColorHex(guessed);
      }
    }
  }, [color, isMultiColor]);

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(collection(db, 'brands'), where('ownerId', '==', auth.currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const userBrands = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBrands(userBrands);
      if (userBrands.length > 0 && !brandId) {
        handleBrandChange(userBrands[0].id, userBrands);
      }
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'brands'));
    return () => unsubscribe();
  }, [brandId]);

  const handleBrandChange = (id: string, brandsList = brands) => {
    setBrandId(id);
    const selectedBrand = brandsList.find(b => b.id === id);
    if (selectedBrand) {
      setEmptySpoolWeight(selectedBrand.defaultEmptySpoolWeight);
      setSpoolType(selectedBrand.defaultSpoolType);
    }
  };

  const handleScan = (code: string) => {
    setBarcode(code);
    setShowScanner(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !brandId) return;

    const brand = brands.find(b => b.id === brandId);
    if (!brand) return;

    try {
      await addDoc(collection(db, 'spools'), {
        brandId,
        brandName: brand.name,
        brandLogoUrl: brand.logoUrl || '',
        material,
        color,
        colorHex: isMultiColor ? colorHexes[0] : colorHex,
        isMultiColor,
        colorHexes: isMultiColor ? colorHexes : [colorHex],
        nozzleTemp,
        bedTemp,
        barcode,
        initialWeight: Number(initialWeight),
        remainingWeight: Number(initialWeight),
        emptySpoolWeight: Number(emptySpoolWeight),
        spoolType,
        ownerId: auth.currentUser.uid,
        createdAt: serverTimestamp()
      });
      navigate('/');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'spools');
    }
  };

  if (loading) return <div className="p-8 text-center text-zinc-500 dark:text-zinc-400">Ładowanie...</div>;

  if (brands.length === 0) {
    return (
      <div className="max-w-xl mx-auto bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 text-center transition-colors">
        <h2 className="text-xl font-bold mb-2 text-zinc-900 dark:text-white">Brak Zdefiniowanych Marek</h2>
        <p className="text-zinc-500 dark:text-zinc-400 mb-6">Musisz dodać przynajmniej jedną markę filamentu, zanim dodasz szpulę.</p>
        <button onClick={() => navigate('/brands')} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-medium transition-colors">
          Przejdź do Marek
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button type="button" onClick={() => navigate('/')} className="p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
          <ArrowLeft className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
        </button>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Dodaj Nową Szpulę</h1>
      </div>
      
      <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 space-y-4 transition-colors">
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Marka</label>
            <select value={brandId} onChange={e => handleBrandChange(e.target.value)} className="w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-colors">
              {brands.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Materiał</label>
            <select value={material} onChange={e => setMaterial(e.target.value)} className="w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-colors">
              {MATERIALS.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Nazwa Koloru</label>
            <input type="text" value={color} onChange={e => setColor(e.target.value)} required placeholder="np. Czarny, Tri-Color, Tęczowy" className="w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-colors" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Podgląd Koloru</label>
              <label className="flex items-center gap-2 text-sm cursor-pointer text-zinc-700 dark:text-zinc-300">
                <input type="checkbox" checked={isMultiColor} onChange={e => setIsMultiColor(e.target.checked)} className="rounded border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-blue-600 focus:ring-blue-500 transition-colors" />
                Filament wielokolorowy
              </label>
            </div>
            {isMultiColor ? (
              <div className="flex gap-2 bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 flex-wrap transition-colors">
                {colorHexes.map((hex, i) => (
                  <div key={i} className="relative">
                    <input type="color" value={hex} onChange={e => {
                      const newHexes = [...colorHexes];
                      newHexes[i] = e.target.value;
                      setColorHexes(newHexes);
                    }} className="w-10 h-10 border border-zinc-300 dark:border-zinc-600 rounded-lg cursor-pointer p-0.5 bg-white dark:bg-zinc-700 transition-colors" />
                    {colorHexes.length > 2 && (
                      <button type="button" onClick={() => setColorHexes(colorHexes.filter((_, idx) => idx !== i))} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow-sm hover:bg-red-600 transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
                {colorHexes.length < 4 && (
                  <button type="button" onClick={() => setColorHexes([...colorHexes, '#ffffff'])} className="w-10 h-10 border-2 border-dashed border-zinc-300 dark:border-zinc-600 rounded-lg flex items-center justify-center text-zinc-400 dark:text-zinc-500 hover:border-blue-500 dark:hover:border-blue-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors bg-white dark:bg-zinc-800">
                    <Plus className="w-5 h-5" />
                  </button>
                )}
              </div>
            ) : (
              <input type="color" value={colorHex} onChange={e => setColorHex(e.target.value)} className="w-full h-10 border border-zinc-300 dark:border-zinc-700 rounded-xl cursor-pointer p-1 bg-white dark:bg-zinc-800 transition-colors" />
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Zalecana Temp. Dyszy</label>
            <input type="text" value={nozzleTemp} onChange={e => setNozzleTemp(e.target.value)} placeholder="np. 190-220°C" className="w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-colors" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Zalecana Temp. Stołu</label>
            <input type="text" value={bedTemp} onChange={e => setBedTemp(e.target.value)} placeholder="np. 50-70°C" className="w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-colors" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Kod Kreskowy (Opcjonalnie)</label>
          <div className="flex gap-2">
            <input type="text" value={barcode} onChange={e => setBarcode(e.target.value)} placeholder="Zeskanuj lub wpisz kod" className="flex-1 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-colors" />
            <button type="button" onClick={() => setShowScanner(true)} className="bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors">
              <ScanBarcode className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 transition-colors">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Waga Filamentu (g)</label>
            <input type="number" value={initialWeight} onChange={e => setInitialWeight(Number(e.target.value))} required min="1" className="w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-colors" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Waga Pustej Szpuli (g)</label>
            <input type="number" value={emptySpoolWeight} onChange={e => setEmptySpoolWeight(Number(e.target.value))} required min="0" className="w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-colors" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Typ Szpuli</label>
          <select value={spoolType} onChange={e => setSpoolType(e.target.value)} className="w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-colors">
            <option value="plastic">Plastikowa</option>
            <option value="cardboard">Kartonowa</option>
            <option value="metal">Metalowa</option>
            <option value="other">Inna</option>
          </select>
        </div>

        <div className="pt-4">
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors">
            <Save className="w-5 h-5" /> Zapisz Szpulę
          </button>
        </div>
      </form>

      {showScanner && <Scanner onScan={handleScan} onClose={() => setShowScanner(false)} />}
    </div>
  );
}
