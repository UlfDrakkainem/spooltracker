import React from 'react';
import { useZxing } from 'react-zxing';
import { X, Camera } from 'lucide-react';

interface ScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
}

export default function Scanner({ onScan, onClose }: ScannerProps) {
  const { ref } = useZxing({
    onDecodeResult(result) {
      onScan(result.getText());
    },
    onError(error) {
      // Ignoruj błędy podczas ciągłego skanowania
    },
  });

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center p-4">
      <div className="relative w-full max-w-sm bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl">
        <div className="absolute top-4 right-4 z-10">
          <button onClick={onClose} className="p-2 bg-black/50 hover:bg-black/80 rounded-full text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="aspect-[3/4] w-full relative bg-black flex items-center justify-center">
          <video ref={ref} className="w-full h-full object-cover" />
          <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none">
            <div className="w-full h-full border-2 border-green-500/50 rounded-lg relative">
              <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-green-500 -mt-0.5 -ml-0.5"></div>
              <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-green-500 -mt-0.5 -mr-0.5"></div>
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-green-500 -mb-0.5 -ml-0.5"></div>
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-green-500 -mb-0.5 -mr-0.5"></div>
            </div>
          </div>
        </div>
        <div className="p-4 text-center text-white flex items-center justify-center gap-2">
          <Camera className="w-5 h-5 text-zinc-400" />
          <p className="text-sm font-medium text-zinc-300">Skieruj aparat na kod kreskowy</p>
        </div>
      </div>
    </div>
  );
}
