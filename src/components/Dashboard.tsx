import React, { useState, useEffect } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc, addDoc, serverTimestamp, where, getDocs } from 'firebase/firestore';
import { ScanBarcode, Search, Edit3, Trash2, Scale, Database, Settings2, Info, Droplet, Thermometer, Box, Wifi, LayoutGrid, List, Plus } from 'lucide-react';
import Scanner from './Scanner';
import { Link } from 'react-router-dom';
import { guessColorHex, getBrandLogo, getColorStyle } from '../lib/helpers';

export default function Dashboard() {
  const [spools, setSpools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBrand, setFilterBrand] = useState('');
  const [filterMaterial, setFilterMaterial] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [updateModal, setUpdateModal] = useState<{ id: string, currentWeight: number, emptyWeight: number } | null>(null);
  const [viewSpool, setViewSpool] = useState<any | null>(null);
  const [newTotalWeight, setNewTotalWeight] = useState<number | ''>('');
  const [isSeeding, setIsSeeding] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(collection(db, 'spools'), where('ownerId', '==', auth.currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const spoolsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSpools(spoolsData);
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'spools'));
    return () => unsubscribe();
  }, []);

  const handleScan = (code: string) => {
    setSearchQuery(code);
    setShowScanner(false);
    
    // Check if there's an exact barcode match and open it immediately
    const exactMatch = spools.find(s => s.barcode === code);
    if (exactMatch) {
      const actualColorHex = guessColorHex(exactMatch.color, exactMatch.colorHex);
      const actualLogoUrl = getBrandLogo(exactMatch.brandName, exactMatch.brandLogoUrl);
      setViewSpool({...exactMatch, colorHex: actualColorHex, brandLogoUrl: actualLogoUrl});
    }
  };

  const handleUpdateWeight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateModal || newTotalWeight === '') return;

    const remaining = Number(newTotalWeight) - updateModal.emptyWeight;
    const finalRemaining = Math.max(0, remaining);

    try {
      await updateDoc(doc(db, 'spools', updateModal.id), {
        remainingWeight: finalRemaining
      });
      setUpdateModal(null);
      setNewTotalWeight('');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `spools/${updateModal.id}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Czy na pewno chcesz usunąć tę szpulę?')) return;
    try {
      await deleteDoc(doc(db, 'spools', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `spools/${id}`);
    }
  };

  const handleWriteRFID = async (spool: any) => {
    if (!('NDEFReader' in window)) {
      alert('Twoja przeglądarka lub urządzenie nie obsługuje Web NFC. Funkcja ta wymaga przeglądarki Chrome na systemie Android.');
      return;
    }
    
    try {
      const ndef = new (window as any).NDEFReader();
      await ndef.write({
        records: [{
          recordType: "text",
          data: JSON.stringify({
            cfs_compatible: true,
            id: spool.id,
            brand: spool.brandName,
            material: spool.material,
            color: spool.color,
            weight: spool.initialWeight
          })
        }]
      });
      alert('Pomyślnie zaprogramowano tag RFID! Zbliż tag do czytnika CFS.');
    } catch (error) {
      console.error(error);
      alert('Błąd podczas programowania tagu: ' + (error as Error).message + '\nUpewnij się, że masz włączone NFC i zbliżyłeś tag do telefonu.');
    }
  };

  const loadInitialDataset = async () => {
    if (!auth.currentUser) return;
    setIsSeeding(true);
    try {
      const uid = auth.currentUser.uid;
      
      const brandsData = [
        { name: 'JAYO', defaultEmptySpoolWeight: 145, defaultSpoolType: 'plastic', logoUrl: '', ownerId: uid },
        { name: 'eSUN', defaultEmptySpoolWeight: 225, defaultSpoolType: 'plastic', logoUrl: '', ownerId: uid },
        { name: 'Smart Print', defaultEmptySpoolWeight: 250, defaultSpoolType: 'plastic', logoUrl: '', ownerId: uid },
        { name: 'Professional LAB', defaultEmptySpoolWeight: 140, defaultSpoolType: 'cardboard', logoUrl: '', ownerId: uid },
        { name: 'Fiberlogy', defaultEmptySpoolWeight: 250, defaultSpoolType: 'plastic', logoUrl: '', ownerId: uid },
        { name: 'Rosa3D', defaultEmptySpoolWeight: 240, defaultSpoolType: 'plastic', logoUrl: '', ownerId: uid },
        { name: 'Devil Design', defaultEmptySpoolWeight: 260, defaultSpoolType: 'plastic', logoUrl: '', ownerId: uid },
        { name: 'Spectrum', defaultEmptySpoolWeight: 250, defaultSpoolType: 'plastic', logoUrl: '', ownerId: uid },
        { name: 'Bambu Lab', defaultEmptySpoolWeight: 250, defaultSpoolType: 'plastic', logoUrl: '', ownerId: uid },
        { name: 'Prusament', defaultEmptySpoolWeight: 200, defaultSpoolType: 'plastic', logoUrl: '', ownerId: uid },
        { name: 'Polymaker', defaultEmptySpoolWeight: 140, defaultSpoolType: 'cardboard', logoUrl: '', ownerId: uid },
        { name: 'Sunlu', defaultEmptySpoolWeight: 145, defaultSpoolType: 'plastic', logoUrl: '', ownerId: uid },
        { name: 'Overture', defaultEmptySpoolWeight: 140, defaultSpoolType: 'cardboard', logoUrl: '', ownerId: uid },
        { name: 'Anycubic', defaultEmptySpoolWeight: 200, defaultSpoolType: 'plastic', logoUrl: '', ownerId: uid },
        { name: 'Creality', defaultEmptySpoolWeight: 200, defaultSpoolType: 'plastic', logoUrl: '', ownerId: uid },
        { name: 'Eryone', defaultEmptySpoolWeight: 150, defaultSpoolType: 'cardboard', logoUrl: '', ownerId: uid },
        { name: 'Print-Me', defaultEmptySpoolWeight: 250, defaultSpoolType: 'plastic', logoUrl: '', ownerId: uid },
        { name: 'Nebula', defaultEmptySpoolWeight: 250, defaultSpoolType: 'plastic', logoUrl: '', ownerId: uid },
        { name: 'PlastSpaw', defaultEmptySpoolWeight: 250, defaultSpoolType: 'plastic', logoUrl: '', ownerId: uid },
        { name: 'Noctuo', defaultEmptySpoolWeight: 250, defaultSpoolType: 'plastic', logoUrl: '', ownerId: uid },
        { name: 'Colorfil', defaultEmptySpoolWeight: 250, defaultSpoolType: 'plastic', logoUrl: '', ownerId: uid },
        { name: '3D Kordo', defaultEmptySpoolWeight: 250, defaultSpoolType: 'plastic', logoUrl: '', ownerId: uid },
        { name: 'F3D Filament', defaultEmptySpoolWeight: 250, defaultSpoolType: 'plastic', logoUrl: '', ownerId: uid },
        { name: 'Wolfix', defaultEmptySpoolWeight: 250, defaultSpoolType: 'plastic', logoUrl: '', ownerId: uid },
        { name: 'Zortrax', defaultEmptySpoolWeight: 300, defaultSpoolType: 'plastic', logoUrl: '', ownerId: uid },
        { name: 'Hatchbox', defaultEmptySpoolWeight: 225, defaultSpoolType: 'plastic', logoUrl: '', ownerId: uid },
        { name: 'Amolen', defaultEmptySpoolWeight: 200, defaultSpoolType: 'plastic', logoUrl: '', ownerId: uid },
        { name: 'Flashforge', defaultEmptySpoolWeight: 250, defaultSpoolType: 'plastic', logoUrl: '', ownerId: uid },
        { name: 'Geeetech', defaultEmptySpoolWeight: 200, defaultSpoolType: 'plastic', logoUrl: '', ownerId: uid },
        { name: 'Kingroon', defaultEmptySpoolWeight: 150, defaultSpoolType: 'plastic', logoUrl: '', ownerId: uid },
        { name: 'Elegoo', defaultEmptySpoolWeight: 140, defaultSpoolType: 'cardboard', logoUrl: '', ownerId: uid },
        { name: 'Sovol', defaultEmptySpoolWeight: 200, defaultSpoolType: 'plastic', logoUrl: '', ownerId: uid },
        { name: 'NinjaTek', defaultEmptySpoolWeight: 200, defaultSpoolType: 'plastic', logoUrl: '', ownerId: uid },
        { name: 'MatterHackers', defaultEmptySpoolWeight: 250, defaultSpoolType: 'plastic', logoUrl: '', ownerId: uid },
        { name: 'ColorFabb', defaultEmptySpoolWeight: 250, defaultSpoolType: 'plastic', logoUrl: '', ownerId: uid },
        { name: 'Fillamentum', defaultEmptySpoolWeight: 250, defaultSpoolType: 'plastic', logoUrl: '', ownerId: uid },
        { name: 'Formfutura', defaultEmptySpoolWeight: 250, defaultSpoolType: 'cardboard', logoUrl: '', ownerId: uid }
      ];

      const brandIds: Record<string, string> = {};
      
      // Fetch existing brands
      const existingBrandsQuery = query(collection(db, 'brands'), where('ownerId', '==', uid));
      const existingBrandsSnap = await getDocs(existingBrandsQuery);
      const existingBrands = existingBrandsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      
      for (const b of existingBrands) {
        brandIds[b.name] = b.id;
      }

      for (const b of brandsData) {
        if (!brandIds[b.name]) {
          const docRef = await addDoc(collection(db, 'brands'), b);
          brandIds[b.name] = docRef.id;
        }
      }

      // Fetch existing spools
      const existingSpoolsQuery = query(collection(db, 'spools'), where('ownerId', '==', uid));
      const existingSpoolsSnap = await getDocs(existingSpoolsQuery);
      const existingSpools = existingSpoolsSnap.docs.map(doc => doc.data() as any);

      const spoolsData = [
        { brandName: 'JAYO', material: 'TPU 95A', color: 'Czarny', colorHex: '#222222', nozzleTemp: '210-230°C', bedTemp: '40-60°C', initialWeight: 1000 },
        { brandName: 'JAYO', material: 'PETG', color: 'Czarny', colorHex: '#222222', nozzleTemp: '220-250°C', bedTemp: '70-80°C', initialWeight: 1100 },
        { brandName: 'JAYO', material: 'PLA+', color: 'Czerwony', colorHex: '#ef4444', nozzleTemp: '205-230°C', bedTemp: '50-65°C', initialWeight: 1100 },
        { brandName: 'JAYO', material: 'PLA+', color: 'Niebieski', colorHex: '#3b82f6', nozzleTemp: '205-230°C', bedTemp: '50-65°C', initialWeight: 1100 },
        { brandName: 'JAYO', material: 'PLA+', color: 'Zielony', colorHex: '#22c55e', nozzleTemp: '205-230°C', bedTemp: '50-65°C', initialWeight: 1100 },
        { brandName: 'JAYO', material: 'PLA', color: 'Przezroczysty', colorHex: '#e0f2fe', nozzleTemp: '200-230°C', bedTemp: '50-65°C', initialWeight: 1100 },
        { brandName: 'JAYO', material: 'Matte PLA', color: 'Czarny', colorHex: '#222222', nozzleTemp: '200-230°C', bedTemp: '50-65°C', initialWeight: 1100 },
        { brandName: 'eSUN', material: 'PLA+', color: 'Bone White', colorHex: '#f8f9fa', nozzleTemp: '205-225°C', bedTemp: '60-80°C', initialWeight: 1000 },
        { brandName: 'eSUN', material: 'PLA Basic', color: 'Cold White', colorHex: '#ffffff', nozzleTemp: '190-220°C', bedTemp: '60-80°C', initialWeight: 1000 },
        { brandName: 'eSUN', material: 'PLA+', color: 'Żółty', colorHex: '#eab308', nozzleTemp: '205-225°C', bedTemp: '60-80°C', initialWeight: 1000 },
        { brandName: 'Smart Print', material: 'Silk PLA', color: 'Tri Color Oceans Embrace', colorHex: '#008080', nozzleTemp: '190-220°C', bedTemp: '50-60°C', initialWeight: 1000 },
        { brandName: 'Smart Print', material: 'PETG', color: 'Oak / Dębowy', colorHex: '#8b5a2b', nozzleTemp: '230-250°C', bedTemp: '70-80°C', initialWeight: 1000 },
        { brandName: 'Smart Print', material: 'PETG', color: 'Czarny', colorHex: '#222222', nozzleTemp: '230-250°C', bedTemp: '70-80°C', initialWeight: 1000 },
        { brandName: 'Premium Filament', material: 'PLA', color: 'Wood / Drewniany', colorHex: '#8b5a2b', nozzleTemp: '190-220°C', bedTemp: '50-60°C', initialWeight: 1000 },
        { brandName: 'Premium Filament', material: 'PLA', color: 'Czarny', colorHex: '#222222', nozzleTemp: '190-220°C', bedTemp: '50-60°C', initialWeight: 1000 },
        { brandName: 'Premium Filament', material: 'PLA', color: 'Niebieski', colorHex: '#3b82f6', nozzleTemp: '190-220°C', bedTemp: '50-60°C', initialWeight: 1000 }
      ];

      for (const s of spoolsData) {
        // Check if spool already exists
        const exists = existingSpools.some(es => 
          es.brandName === s.brandName && 
          es.material === s.material && 
          es.color === s.color
        );

        if (exists) continue;

        const brand = brandsData.find(b => b.name === s.brandName);
        if (!brand) continue;
        
        await addDoc(collection(db, 'spools'), {
          brandId: brandIds[s.brandName],
          brandName: s.brandName,
          brandLogoUrl: brand.logoUrl || '',
          material: s.material,
          color: s.color,
          colorHex: s.colorHex,
          nozzleTemp: s.nozzleTemp,
          bedTemp: s.bedTemp,
          barcode: '',
          initialWeight: s.initialWeight,
          remainingWeight: s.initialWeight,
          emptySpoolWeight: brand.defaultEmptySpoolWeight,
          spoolType: brand.defaultSpoolType,
          ownerId: uid,
          createdAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error("Błąd podczas ładowania danych:", error);
      alert("Nie udało się załadować danych początkowych.");
    } finally {
      setIsSeeding(false);
    }
  };

  const uniqueBrands = Array.from(new Set(spools.map(s => s.brandName))).sort();
  const uniqueMaterials = Array.from(new Set(spools.map(s => s.material))).sort();

  const filteredSpools = spools.filter(s => {
    const matchesSearch = s.brandName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.material.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.color.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (s.barcode && s.barcode.includes(searchQuery));
    const matchesBrand = filterBrand ? s.brandName === filterBrand : true;
    const matchesMaterial = filterMaterial ? s.material === filterMaterial : true;
    
    return matchesSearch && matchesBrand && matchesMaterial;
  });

  if (loading) return <div className="p-8 text-center text-zinc-500 dark:text-zinc-400">Ładowanie magazynu...</div>;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Magazyn</h1>
        <div className="flex w-full sm:w-auto gap-2">
          <button 
            onClick={loadInitialDataset} 
            disabled={isSeeding}
            className="hidden sm:flex bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 px-4 py-2 rounded-xl text-sm font-medium items-center gap-2 transition-colors disabled:opacity-50"
            title="Wgraj brakujące domyślne szpule"
          >
            <Database className="w-4 h-4" />
            <span>Synchronizuj domyślne</span>
          </button>
          <div className="relative flex-1 sm:w-64">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
            <input 
              type="text" 
              placeholder="Szukaj lub skanuj kod..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
            />
          </div>
          <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-zinc-900 shadow-sm text-blue-600 dark:text-blue-400' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
              title="Widok siatki"
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-zinc-900 shadow-sm text-blue-600 dark:text-blue-400' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
              title="Widok listy"
            >
              <List className="w-5 h-5" />
            </button>
          </div>
          <button 
            onClick={() => setShowScanner(true)}
            className="bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 p-2 rounded-xl transition-colors"
            title="Skanuj kod kreskowy"
          >
            <ScanBarcode className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Filters */}
      {spools.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-6">
          <select 
            value={filterBrand} 
            onChange={e => setFilterBrand(e.target.value)} 
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none shadow-sm transition-colors"
          >
            <option value="">Wszystkie marki</option>
            {uniqueBrands.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <select 
            value={filterMaterial} 
            onChange={e => setFilterMaterial(e.target.value)} 
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none shadow-sm transition-colors"
          >
            <option value="">Wszystkie materiały</option>
            {uniqueMaterials.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      )}

      {spools.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 p-12 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 text-center transition-colors">
          <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <Scale className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold mb-2 text-zinc-900 dark:text-white">Brak szpul</h2>
          <p className="text-zinc-500 dark:text-zinc-400 mb-6 max-w-sm mx-auto">Rozpocznij śledzenie filamentów dodając pierwszą szpulę do magazynu.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/add" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium inline-block hover:bg-blue-700 transition-colors">
              Dodaj Pierwszą Szpulę
            </Link>
            <button 
              onClick={loadInitialDataset} 
              disabled={isSeeding}
              className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-6 py-3 rounded-xl font-medium inline-flex items-center gap-2 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
            >
              <Database className="w-5 h-5" />
              {isSeeding ? 'Ładowanie...' : 'Wgraj dane początkowe'}
            </button>
          </div>
        </div>
      ) : filteredSpools.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 p-12 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800 text-center transition-colors">
          <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <Search className="w-10 h-10 text-zinc-400" />
          </div>
          <h2 className="text-xl font-bold mb-2 text-zinc-900 dark:text-white">Brak wyników</h2>
          <p className="text-zinc-500 dark:text-zinc-400 mb-8 max-w-xs mx-auto">
            Nie znaleźliśmy żadnej szpuli pasującej do Twoich kryteriów wyszukiwania.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {searchQuery && (
              <Link 
                to={`/add?barcode=${searchQuery}`}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-500/20"
              >
                <Plus className="w-5 h-5" /> Dodaj szpulę z tym kodem
              </Link>
            )}
            <button 
              onClick={() => { setSearchQuery(''); setFilterBrand(''); setFilterMaterial(''); }}
              className="bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 px-6 py-3 rounded-2xl font-bold transition-colors"
            >
              Wyczyść filtry
            </button>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSpools.map(spool => {
            const percentage = Math.min(100, Math.max(0, (spool.remainingWeight / spool.initialWeight) * 100));
            const isLow = percentage < 20;
            const radius = 28;
            const circumference = 2 * Math.PI * radius;
            const strokeDashoffset = circumference - (percentage / 100) * circumference;

            const actualColorHex = guessColorHex(spool.color, spool.colorHex);
            const actualLogoUrl = getBrandLogo(spool.brandName, spool.brandLogoUrl);

            return (
              <div 
                key={spool.id} 
                onClick={() => setViewSpool({...spool, colorHex: actualColorHex, brandLogoUrl: actualLogoUrl})}
                className="bg-white dark:bg-zinc-900 p-5 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col relative overflow-hidden cursor-pointer hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all group"
              >
                {/* Prominent Color Representation */}
                <div className="absolute top-0 left-0 w-2 h-full border-r border-black/5 dark:border-white/5" style={getColorStyle(actualColorHex, spool.isMultiColor, spool.colorHexes)}></div>
                
                <div className="flex justify-between items-start mb-4 pl-3">
                  <div className="flex items-center gap-3">
                    {actualLogoUrl ? (
                      <div className="w-16 h-8 flex items-center justify-center bg-white rounded px-1">
                        <img src={actualLogoUrl} alt={spool.brandName} className="max-w-full max-h-full object-contain" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400 font-bold border border-zinc-200 dark:border-zinc-700 shadow-sm">
                        {spool.brandName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{spool.brandName}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <h3 className="text-lg font-bold leading-tight text-zinc-900 dark:text-white">{spool.material}</h3>
                        <span className="text-sm font-medium px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full shadow-sm border border-black/10 dark:border-white/10" style={getColorStyle(actualColorHex, spool.isMultiColor, spool.colorHexes)}></span>
                          {spool.color}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link 
                      to={`/edit/${spool.id}`} 
                      onClick={(e) => e.stopPropagation()}
                      className="p-1.5 text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors" 
                      title="Edytuj"
                    >
                      <Edit3 className="w-4 h-4" />
                    </Link>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDelete(spool.id); }} 
                      className="p-1.5 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors" 
                      title="Usuń"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-4 mb-4 pl-3">
                  <div className="relative flex items-center justify-center w-16 h-16 shrink-0">
                    <svg className="transform -rotate-90 w-16 h-16">
                      <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-zinc-100 dark:text-zinc-800" />
                      <circle 
                        cx="32" cy="32" r="28" 
                        stroke="currentColor" 
                        strokeWidth="6" 
                        fill="transparent" 
                        strokeDasharray={circumference} 
                        strokeDashoffset={strokeDashoffset} 
                        className={isLow ? 'text-red-500 transition-all duration-500' : 'text-blue-500 transition-all duration-500'} 
                        strokeLinecap="round" 
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className={`text-sm font-bold ${isLow ? 'text-red-600 dark:text-red-400' : 'text-zinc-900 dark:text-white'}`}>{Math.round(percentage)}%</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-zinc-500 dark:text-zinc-400 font-medium">Pozostało</span>
                      <span className={`font-bold ${isLow ? 'text-red-600 dark:text-red-400' : 'text-zinc-900 dark:text-white'}`}>
                        {spool.remainingWeight}g <span className="text-zinc-400 dark:text-zinc-500 font-normal">/ {spool.initialWeight}g</span>
                      </span>
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 space-y-1">
                      {spool.nozzleTemp && <p className="flex items-center gap-1"><Thermometer className="w-3 h-3"/> Dysza: <span className="font-medium text-zinc-700 dark:text-zinc-300">{spool.nozzleTemp}</span></p>}
                      {spool.bedTemp && <p className="flex items-center gap-1"><Settings2 className="w-3 h-3"/> Stół: <span className="font-medium text-zinc-700 dark:text-zinc-300">{spool.bedTemp}</span></p>}
                    </div>
                  </div>
                </div>

                <div className="mt-auto pt-2 border-t border-zinc-100 dark:border-zinc-800 pl-3">
                  <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-3">
                    <span>Szpula: {spool.spoolType === 'plastic' ? 'Plastikowa' : spool.spoolType === 'cardboard' ? 'Kartonowa' : spool.spoolType === 'metal' ? 'Metalowa' : 'Inna'} ({spool.emptySpoolWeight}g)</span>
                    {spool.barcode && <span className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">#{spool.barcode.slice(-6)}</span>}
                  </div>

                  <button 
                    onClick={(e) => { e.stopPropagation(); setUpdateModal({ id: spool.id, currentWeight: spool.remainingWeight, emptyWeight: spool.emptySpoolWeight }); }}
                    className="w-full bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                  >
                    <Scale className="w-4 h-4" /> Aktualizuj Wagę
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredSpools.map(spool => {
            const percentage = Math.min(100, Math.max(0, (spool.remainingWeight / spool.initialWeight) * 100));
            const isLow = percentage < 20;
            const actualColorHex = guessColorHex(spool.color, spool.colorHex);
            const actualLogoUrl = getBrandLogo(spool.brandName, spool.brandLogoUrl);
            const radius = 14;
            const circumference = 2 * Math.PI * radius;
            const strokeDashoffset = circumference - (percentage / 100) * circumference;

            return (
              <div
                key={spool.id}
                onClick={() => setViewSpool({...spool, colorHex: actualColorHex, brandLogoUrl: actualLogoUrl})}
                className="bg-white dark:bg-zinc-900 p-3 sm:p-4 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex items-center gap-3 sm:gap-4 cursor-pointer hover:border-blue-300 dark:hover:border-blue-700 transition-all relative overflow-hidden group"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1.5" style={getColorStyle(actualColorHex, spool.isMultiColor, spool.colorHexes)}></div>
                
                <div className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 flex items-center justify-center bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 ml-1 sm:ml-2">
                  {actualLogoUrl ? (
                    <img src={actualLogoUrl} alt={spool.brandName} className="max-w-full max-h-full p-1 object-contain" />
                  ) : (
                    <span className="font-bold text-zinc-500 dark:text-zinc-400">{spool.brandName.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 truncate">{spool.brandName}</span>
                    {spool.barcode && <span className="hidden sm:inline-block text-[10px] font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-500 dark:text-zinc-400">#{spool.barcode.slice(-6)}</span>}
                  </div>
                  <h3 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-white truncate flex items-center gap-1.5">
                    {spool.material}
                    <span className="text-zinc-300 dark:text-zinc-600">•</span>
                    <span className="truncate">{spool.color}</span>
                  </h3>
                </div>

                <div className="hidden md:flex flex-col items-end text-xs text-zinc-500 dark:text-zinc-400 px-4 border-r border-zinc-200 dark:border-zinc-800">
                  <span className="flex items-center gap-1"><Thermometer className="w-3 h-3"/> {spool.nozzleTemp || '-'}</span>
                  <span className="flex items-center gap-1"><Settings2 className="w-3 h-3"/> {spool.bedTemp || '-'}</span>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                  <div className="text-right">
                    <div className={`font-bold text-sm sm:text-base ${isLow ? 'text-red-600 dark:text-red-400' : 'text-zinc-900 dark:text-white'}`}>{spool.remainingWeight}g</div>
                    <div className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400">{Math.round(percentage)}%</div>
                  </div>
                  <div className="relative flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10">
                    <svg className="transform -rotate-90 w-8 h-8 sm:w-10 sm:h-10">
                      <circle cx="50%" cy="50%" r={radius} stroke="currentColor" strokeWidth="3" fill="transparent" className="text-zinc-100 dark:text-zinc-800" />
                      <circle 
                        cx="50%" cy="50%" r={radius} 
                        stroke="currentColor" 
                        strokeWidth="3" 
                        fill="transparent" 
                        strokeDasharray={circumference} 
                        strokeDashoffset={strokeDashoffset} 
                        className={isLow ? 'text-red-500 transition-all duration-500' : 'text-blue-500 transition-all duration-500'} 
                        strokeLinecap="round" 
                      />
                    </svg>
                  </div>
                </div>

                <div className="hidden sm:flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setUpdateModal({ id: spool.id, currentWeight: spool.remainingWeight, emptyWeight: spool.emptySpoolWeight }); }}
                    className="p-2 text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                    title="Aktualizuj wagę"
                  >
                    <Scale className="w-4 h-4" />
                  </button>
                  <Link 
                    to={`/edit/${spool.id}`} 
                    onClick={(e) => e.stopPropagation()}
                    className="p-2 text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors" 
                    title="Edytuj"
                  >
                    <Edit3 className="w-4 h-4" />
                  </Link>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDelete(spool.id); }} 
                    className="p-2 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors" 
                    title="Usuń"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* View Spool Modal */}
      {viewSpool && (
        <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setViewSpool(null)}>
          <div 
            className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden relative max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Header with Color Banner and Spool Graphic */}
            <div className="h-40 w-full relative overflow-hidden" style={getColorStyle(viewSpool.colorHex, viewSpool.isMultiColor, viewSpool.colorHexes)}>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10"></div>
              
              {/* Decorative Spool Graphic in Background */}
              <svg className="absolute -right-10 -top-10 w-64 h-64 text-white opacity-10 transform rotate-12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/>
              </svg>

              <button 
                onClick={() => setViewSpool(null)}
                className="absolute top-4 right-4 p-2 bg-black/30 hover:bg-black/50 rounded-full text-white backdrop-blur-md transition-colors z-20"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
              
              <div className="absolute bottom-4 left-6 flex items-end gap-4 z-20">
                <div className="w-24 h-24 bg-white rounded-2xl shadow-xl p-3 flex items-center justify-center border-4 border-white/20">
                  {viewSpool.brandLogoUrl ? (
                    <img src={viewSpool.brandLogoUrl} alt={viewSpool.brandName} className="max-w-full max-h-full object-contain" />
                  ) : (
                    <span className="text-2xl font-bold text-zinc-400">{viewSpool.brandName.charAt(0)}</span>
                  )}
                </div>
                <div className="text-white pb-1">
                  <p className="text-sm font-medium opacity-90 drop-shadow-md">{viewSpool.brandName}</p>
                  <h2 className="text-3xl font-bold drop-shadow-md">{viewSpool.material}</h2>
                </div>
              </div>
            </div>

            <div className="p-6 pt-8">
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 mb-1">
                    <Droplet className="w-4 h-4" />
                    <span className="text-sm font-medium">Kolor</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full shadow-inner border border-zinc-200 dark:border-zinc-700" style={getColorStyle(viewSpool.colorHex, viewSpool.isMultiColor, viewSpool.colorHexes)}></div>
                    <span className="font-bold text-xl text-zinc-900 dark:text-white">{viewSpool.color}</span>
                  </div>
                </div>

                <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 mb-1">
                    <Scale className="w-4 h-4" />
                    <span className="text-sm font-medium">Pozostało</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-bold text-2xl text-zinc-900 dark:text-white">{viewSpool.remainingWeight}g</span>
                    <span className="text-sm text-zinc-500 dark:text-zinc-400">z {viewSpool.initialWeight}g</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <h4 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider">Ustawienia Druku</h4>
                <div className="flex gap-4">
                  <div className="flex-1 flex items-center gap-3 p-3 rounded-xl border border-orange-100 dark:border-orange-900/30 bg-orange-50/50 dark:bg-orange-900/10">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400 rounded-lg">
                      <Thermometer className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-orange-600/80 dark:text-orange-400/80 font-medium">Dysza</p>
                      <p className="font-bold text-orange-900 dark:text-orange-300">{viewSpool.nozzleTemp || 'Brak danych'}</p>
                    </div>
                  </div>
                  <div className="flex-1 flex items-center gap-3 p-3 rounded-xl border border-blue-100 dark:border-blue-900/30 bg-blue-50/50 dark:bg-blue-900/10">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
                    </div>
                    <div>
                      <p className="text-xs text-blue-600/80 dark:text-blue-400/80 font-medium">Stół</p>
                      <p className="font-bold text-blue-900 dark:text-blue-300">{viewSpool.bedTemp || 'Brak danych'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4 border border-zinc-100 dark:border-zinc-800 text-sm">
                <div className="flex justify-between py-2 border-b border-zinc-200/60 dark:border-zinc-700/60 last:border-0">
                  <span className="text-zinc-500 dark:text-zinc-400">Typ szpuli</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {viewSpool.spoolType === 'plastic' ? 'Plastikowa' : viewSpool.spoolType === 'cardboard' ? 'Kartonowa' : viewSpool.spoolType === 'metal' ? 'Metalowa' : 'Inna'} 
                    <span className="text-zinc-400 dark:text-zinc-500 ml-1">({viewSpool.emptySpoolWeight}g)</span>
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-zinc-200/60 dark:border-zinc-700/60 last:border-0">
                  <span className="text-zinc-500 dark:text-zinc-400">Kod kreskowy</span>
                  <span className="font-mono text-zinc-900 dark:text-zinc-100">{viewSpool.barcode || 'Brak'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-zinc-200/60 dark:border-zinc-700/60 last:border-0">
                  <span className="text-zinc-500 dark:text-zinc-400">Dodano</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {viewSpool.createdAt ? new Date(viewSpool.createdAt.toDate()).toLocaleDateString('pl-PL') : 'Brak danych'}
                  </span>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3">
                <div className="flex gap-3">
                  <button 
                    onClick={() => {
                      setViewSpool(null);
                      setUpdateModal({ id: viewSpool.id, currentWeight: viewSpool.remainingWeight, emptyWeight: viewSpool.emptySpoolWeight });
                    }}
                    className="flex-1 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
                  >
                    <Scale className="w-5 h-5" /> Aktualizuj Wagę
                  </button>
                  <Link 
                    to={`/edit/${viewSpool.id}`}
                    className="px-6 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 py-3 rounded-xl font-medium flex items-center justify-center transition-colors"
                  >
                    Edytuj
                  </Link>
                </div>
                
                <button 
                  onClick={() => handleWriteRFID(viewSpool)}
                  className="w-full bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <Wifi className="w-5 h-5" /> Programuj tag RFID (CFS)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showScanner && <Scanner onScan={handleScan} onClose={() => setShowScanner(false)} />}

      {updateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl max-w-sm w-full p-6">
            <h2 className="text-xl font-bold mb-2 text-zinc-900 dark:text-white">Aktualizuj Wagę</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
              Połóż całą szpulę na wadze i wprowadź całkowitą wagę. Automatycznie odejmiemy {updateModal.emptyWeight}g (waga pustej szpuli).
            </p>
            
            <form onSubmit={handleUpdateWeight}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Całkowita waga na wadze (g)</label>
                <input 
                  type="number" 
                  autoFocus
                  value={newTotalWeight}
                  onChange={e => setNewTotalWeight(e.target.value === '' ? '' : Number(e.target.value))}
                  required
                  min={updateModal.emptyWeight}
                  className="w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl px-4 py-3 text-lg focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                  placeholder="np. 850"
                />
                {newTotalWeight !== '' && Number(newTotalWeight) >= updateModal.emptyWeight && (
                  <p className="text-sm text-green-600 dark:text-green-400 mt-2 font-medium">
                    Nowa waga filamentu: {Number(newTotalWeight) - updateModal.emptyWeight}g
                  </p>
                )}
              </div>
              
              <div className="flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setUpdateModal(null)}
                  className="flex-1 px-4 py-2.5 text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl font-medium transition-colors"
                >
                  Anuluj
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2.5 text-white bg-blue-600 hover:bg-blue-700 rounded-xl font-medium transition-colors"
                >
                  Zapisz
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
