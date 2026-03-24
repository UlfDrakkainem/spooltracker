import React, { useState, useEffect } from 'react';
import { useZxing } from 'react-zxing';
import { X, Camera, RefreshCw, AlertCircle } from 'lucide-react';

interface ScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
}

export default function Scanner({ onScan, onClose }: ScannerProps) {
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [currentDeviceIndex, setCurrentDeviceIndex] = useState<number>(0);

  // Fallback constraints if we don't have devices yet
  const constraints = devices.length > 0 && devices[currentDeviceIndex]
    ? { video: { deviceId: { exact: devices[currentDeviceIndex].deviceId } } }
    : { video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } };

  const { ref } = useZxing({
    constraints,
    onDecodeResult(result) {
      onScan(result.getText());
    },
    onError(error) {
      // ZXing rzuca błędy co klatkę, gdy nie widzi kodu. Ignorujemy je.
      // Ale łapiemy błędy braku uprawnień (NotAllowedError)
      if (error.name === 'NotAllowedError') {
        setErrorMsg('Brak dostępu do aparatu. Zezwól na użycie kamery w ustawieniach przeglądarki.');
      } else if (error.name === 'NotFoundError') {
        setErrorMsg('Nie znaleziono aparatu w tym urządzeniu.');
      }
    },
  });

  // Pobierz listę aparatów DOPIERO gdy mamy uprawnienia (czyli po udanym starcie)
  useEffect(() => {
    const getDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter((device) => device.kind === 'videoinput');
        
        // Jeśli mają etykiety, to znaczy że mamy uprawnienia
        if (videoDevices.length > 0 && videoDevices[0].label !== '') {
          setDevices(videoDevices);
          
          // Znajdź główny aparat z tyłu (często ma 'back' lub '0' w nazwie, unikamy ultrawide)
          const backCameraIndex = videoDevices.findIndex(d => 
            (d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('environment')) && 
            !d.label.toLowerCase().includes('ultrawide')
          );
          
          if (backCameraIndex !== -1 && currentDeviceIndex === 0) {
            setCurrentDeviceIndex(backCameraIndex);
          }
        }
      } catch (e) {
        console.error('Błąd pobierania listy aparatów:', e);
      }
    };
    
    // Polling for devices until we get labels (permissions granted)
    const interval = setInterval(() => {
      if (devices.length === 0 || devices[0].label === '') {
        getDevices();
      } else {
        clearInterval(interval);
      }
    }, 2000);
    
    getDevices();
    return () => clearInterval(interval);
  }, [devices.length, currentDeviceIndex]);

  const switchCamera = () => {
    if (devices.length > 1) {
      setCurrentDeviceIndex((prev) => (prev + 1) % devices.length);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-4">
      <div className="relative w-full max-w-sm bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl border border-zinc-800">
        <div className="absolute top-4 right-4 z-20 flex gap-2">
          {devices.length > 1 && (
            <button onClick={switchCamera} className="p-3 bg-black/60 hover:bg-black/80 rounded-full text-white backdrop-blur-md transition-colors shadow-lg">
              <RefreshCw className="w-6 h-6" />
            </button>
          )}
          <button onClick={onClose} className="p-3 bg-black/60 hover:bg-black/80 rounded-full text-white backdrop-blur-md transition-colors shadow-lg">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="aspect-[3/4] w-full relative bg-black flex items-center justify-center overflow-hidden">
          {errorMsg ? (
            <div className="p-6 text-center flex flex-col items-center gap-4 z-10">
              <AlertCircle className="w-12 h-12 text-red-500" />
              <p className="text-red-400 font-medium">{errorMsg}</p>
            </div>
          ) : (
            <>
              <video ref={ref} className="w-full h-full object-cover" autoPlay muted playsInline />
              
              {/* Skaner UI */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-64 h-64 border-2 border-blue-500/30 rounded-xl relative overflow-hidden bg-blue-500/5">
                  {/* Animowana linia skanowania */}
                  <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 shadow-[0_0_15px_3px_rgba(59,130,246,0.6)] animate-scan"></div>
                  
                  {/* Narożniki */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500 -mt-0.5 -ml-0.5 rounded-tl-lg"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500 -mt-0.5 -mr-0.5 rounded-tr-lg"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500 -mb-0.5 -ml-0.5 rounded-bl-lg"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500 -mb-0.5 -mr-0.5 rounded-br-lg"></div>
                </div>
              </div>
            </>
          )}
        </div>
        
        <div className="p-6 text-center bg-zinc-900 border-t border-zinc-800">
          <div className="flex items-center justify-center gap-3 text-zinc-300">
            <Camera className="w-5 h-5 text-blue-400" />
            <p className="text-sm font-medium">Skieruj aparat na kod kreskowy</p>
          </div>
          <p className="text-xs text-zinc-500 mt-2">Upewnij się, że kod jest dobrze oświetlony i ostry.</p>
        </div>
      </div>
    </div>
  );
}
