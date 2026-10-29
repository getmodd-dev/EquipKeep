import { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import {
  X,
  Camera,
  Upload,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Flashlight,
  ExternalLink,
  QrCode,
} from 'lucide-react';
import { Equipment } from '../types';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipmentList: Equipment[];
  onSelectEquipment: (equipment: Equipment) => void;
  onEquipmentNotFound?: (scannedId: string) => void;
}

function parseScannedEquipmentId(rawText: string): string {
  const trimmed = rawText.trim();

  try {
    // If it's a full URL
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      const url = new URL(trimmed);
      const eqParam = url.searchParams.get('equipment') || url.searchParams.get('id');
      if (eqParam) return decodeURIComponent(eqParam.trim());

      // Check hash
      if (url.hash) {
        const hash = url.hash.replace(/^#\/?/, '').trim();
        if (hash.startsWith('equipment=')) {
          return decodeURIComponent(hash.split('equipment=')[1].split('&')[0].trim());
        }
        if (hash.startsWith('id=')) {
          return decodeURIComponent(hash.split('id=')[1].split('&')[0].trim());
        }
        if (hash.startsWith('equipment/')) {
          return decodeURIComponent(hash.replace(/^equipment\//, '').split(/[/?&#]/)[0].trim());
        }
        if (hash.startsWith('eq-')) {
          return decodeURIComponent(hash.split(/[/?&#]/)[0].trim());
        }
      }

      // Check path
      const match = url.pathname.match(/\/equipment\/([^/?#]+)/);
      if (match && match[1]) {
        return decodeURIComponent(match[1].trim());
      }
    }
  } catch {
    // Not a valid URL, treat as raw text/code
  }

  // If format is like #equipment=... or ?equipment=...
  if (trimmed.includes('equipment=')) {
    const after = trimmed.split('equipment=')[1];
    return decodeURIComponent(after.split(/[&#\s]/)[0].trim());
  }
  if (trimmed.includes('id=')) {
    const after = trimmed.split('id=')[1];
    return decodeURIComponent(after.split(/[&#\s]/)[0].trim());
  }

  return trimmed;
}

export function QRScannerModal({
  isOpen,
  onClose,
  equipmentList,
  onSelectEquipment,
  onEquipmentNotFound,
}: QRScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [detectedMatch, setDetectedMatch] = useState<Equipment | null>(null);
  const [unmatchedId, setUnmatchedId] = useState<string | null>(null);

  const scanIntervalRef = useRef<number | null>(null);

  // Start camera when opened
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setDetectedMatch(null);
      setUnmatchedId(null);
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError(null);
    setDetectedMatch(null);
    setUnmatchedId(null);
    setIsScanning(true);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera is not supported on this browser or connection. You can still upload a photo below.');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
      }

      // Check if torch/flashlight is supported
      const track = mediaStream.getVideoTracks()[0];
      const capabilities = track.getCapabilities?.() as any;
      if (capabilities && capabilities.torch) {
        setHasTorch(true);
      }

      startScanLoop();
    } catch (err: any) {
      console.warn('Camera access error:', err);
      let msg = 'Could not access camera. Please allow camera permissions or upload an image of the QR code.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Camera permission was denied. Tap "Take / Upload Photo" below or enable camera in browser settings.';
      }
      setCameraError(msg);
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }

    setIsScanning(false);
  };

  const toggleTorch = async () => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    try {
      await (track as any).applyConstraints({
        advanced: [{ torch: !torchOn }],
      });
      setTorchOn(!torchOn);
    } catch (e) {
      console.warn('Could not toggle flashlight:', e);
    }
  };

  const handleDetectedCode = (codeText: string) => {
    const rawId = parseScannedEquipmentId(codeText);
    if (!rawId) return;

    // Vibrate phone if supported
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(100);
      } catch {}
    }

    // Try finding in equipment list
    const found = equipmentList.find(
      (eq) =>
        eq.id.toLowerCase() === rawId.toLowerCase() ||
        (eq.serialNumber && eq.serialNumber.toLowerCase() === rawId.toLowerCase()) ||
        eq.name.toLowerCase() === rawId.toLowerCase()
    );

    if (found) {
      setDetectedMatch(found);
      stopCamera();
      // Auto open after brief animation
      setTimeout(() => {
        onSelectEquipment(found);
        onClose();
      }, 700);
    } else {
      setUnmatchedId(rawId);
      stopCamera();
    }
  };

  const startScanLoop = () => {
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);

    scanIntervalRef.current = window.setInterval(async () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2) return;

      const width = video.videoWidth;
      const height = video.videoHeight;
      if (width === 0 || height === 0) return;

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      ctx.drawImage(video, 0, 0, width, height);

      // 1. Try native BarcodeDetector API if supported
      if ('BarcodeDetector' in window) {
        try {
          const barcodeDetector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
          const barcodes = await barcodeDetector.detect(video);
          if (barcodes.length > 0 && barcodes[0].rawValue) {
            handleDetectedCode(barcodes[0].rawValue);
            return;
          }
        } catch {
          // Fall back to jsQR
        }
      }

      // 2. jsQR library decoding
      try {
        const imageData = ctx.getImageData(0, 0, width, height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });

        if (code && code.data) {
          handleDetectedCode(code.data);
        }
      } catch (err) {
        // Continue scanning
      }
    }, 200);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const img = new Image();
    const reader = new FileReader();

    reader.onload = (event) => {
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code && code.data) {
          handleDetectedCode(code.data);
        } else {
          alert('Could not find a clear QR code in this image. Please try taking a closer, well-lit photo of the label.');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center items-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-zinc-900 border border-zinc-800 rounded-t-2xl sm:rounded-2xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl max-h-[92dvh]">
        {/* Header */}
        <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/80">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-orange-600/20 text-orange-400 flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Scan Appliance QR</h3>
              <p className="text-[11px] text-zinc-400">Point phone camera at thermal label</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasTorch && (
              <button
                type="button"
                onClick={toggleTorch}
                className={`p-2 rounded-lg transition-colors ${
                  torchOn ? 'bg-amber-500 text-black font-bold' : 'bg-zinc-800 text-zinc-300 hover:text-white'
                }`}
                title="Toggle Flashlight"
              >
                <Flashlight className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
              aria-label="Close scanner"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewfinder Area */}
        <div className="relative bg-black flex-1 min-h-[300px] max-h-[420px] flex items-center justify-center overflow-hidden">
          {/* Hidden Canvas for Decoding */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Active Video Stream */}
          {!cameraError && (
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted
            />
          )}

          {/* Visual Scanner Crosshairs */}
          {!cameraError && !detectedMatch && !unmatchedId && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="relative w-64 h-64 border-2 border-orange-500/60 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                {/* Corner accents */}
                <span className="absolute -top-1 -left-1 w-5 h-5 border-t-3 border-l-3 border-orange-500 rounded-tl-lg" />
                <span className="absolute -top-1 -right-1 w-5 h-5 border-t-3 border-r-3 border-orange-500 rounded-tr-lg" />
                <span className="absolute -bottom-1 -left-1 w-5 h-5 border-b-3 border-l-3 border-orange-500 rounded-bl-lg" />
                <span className="absolute -bottom-1 -right-1 w-5 h-5 border-b-3 border-r-3 border-orange-500 rounded-br-lg" />

                {/* Laser scan line animation */}
                <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-orange-400 to-transparent animate-pulse top-1/2 -translate-y-1/2" />
              </div>
            </div>
          )}

          {/* Success Match Banner */}
          {detectedMatch && (
            <div className="absolute inset-0 bg-emerald-950/90 flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-white">Appliance Matched!</h4>
              <p className="text-sm font-semibold text-emerald-300 mt-1">{detectedMatch.name}</p>
              <p className="text-xs text-zinc-300 font-mono mt-0.5">
                {detectedMatch.brand} • {detectedMatch.modelNumber || 'N/A'}
              </p>
              <span className="text-[11px] text-zinc-400 mt-3">Opening service details...</span>
            </div>
          )}

          {/* Unmatched ID Card */}
          {unmatchedId && (
            <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mb-2">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-white">QR Code Recognized</h4>
              <p className="text-xs text-zinc-300 mt-1 font-mono break-all px-4 py-1.5 bg-zinc-900 rounded-lg border border-zinc-800">
                {unmatchedId}
              </p>
              <p className="text-xs text-zinc-400 mt-2">
                This item is not in your database yet.
              </p>
              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setUnmatchedId(null);
                    startCamera();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-200 text-xs font-semibold"
                >
                  Scan Again
                </button>
                {onEquipmentNotFound && (
                  <button
                    type="button"
                    onClick={() => {
                      onEquipmentNotFound(unmatchedId);
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-orange-600 text-white text-xs font-semibold"
                  >
                    Add Appliance
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Camera Permission / Error message */}
          {cameraError && !detectedMatch && !unmatchedId && (
            <div className="p-6 text-center max-w-sm">
              <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-white">Camera Unavailable</h4>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{cameraError}</p>
              <button
                type="button"
                onClick={startCamera}
                className="mt-4 px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Camera</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 border-t border-zinc-800 bg-zinc-950 flex flex-col sm:flex-row items-center justify-between gap-3 pb-safe">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-colors"
          >
            <Camera className="w-4 h-4 text-orange-400" />
            <span>Upload or Take Label Photo</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileUpload}
            className="hidden"
          />

          <span className="text-[11px] text-zinc-500 text-center">
            Compatible with 50x30mm thermal QR stickers
          </span>
        </div>
      </div>
    </div>
  );
}
