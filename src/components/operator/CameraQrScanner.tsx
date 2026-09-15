import React, { useState, useEffect, useRef, useCallback } from 'react';
import jsQR from 'jsqr';
import { useFerry } from '../../context/FerryContext';
import {
  Camera,
  CameraOff,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Zap,
  Volume2,
  VolumeX,
  FlipHorizontal,
  Upload,
  Sparkles,
  Ticket,
  User,
  Ship,
  Clock,
  ArrowRight,
} from 'lucide-react';

interface VerifiedTicketDetails {
  status: 'VALID' | 'ALREADY_USED' | 'CANCELLED' | 'INVALID';
  bookingRef: string;
  passengerName?: string;
  seatNumbers?: string[];
  vesselName?: string;
  tripNumber?: string;
  routeTitle?: string;
  fareInr?: number;
  timestamp: string;
}

interface CameraQrScannerProps {
  activeGateNumber?: string;
  onScanComplete?: (details: VerifiedTicketDetails) => void;
}

export const CameraQrScanner: React.FC<CameraQrScannerProps> = ({
  activeGateNumber = 'Gate 2',
  onScanComplete,
}) => {
  const { scanTicket, approveBoarding, bookings, trips, ferries } = useFerry();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasTorch, setHasTorch] = useState<boolean>(false);
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<VerifiedTicketDetails | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const lastScanTimestampRef = useRef<number>(0);

  // Play audio chime on valid/invalid scan
  const playScanChime = useCallback((isValid: boolean) => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      if (isValid) {
        // High double-tone positive chime
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(880, ctx.currentTime); // A5
        osc1.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.1); // D6

        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

        osc1.connect(gain);
        gain.connect(ctx.destination);
        osc1.start();
        osc1.stop(ctx.currentTime + 0.35);
      } else {
        // Low error buzz tone
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch {
      // AudioContext unavailable or autoplay restricted
    }
  }, [soundEnabled]);

  // Start Camera Stream
  const startCamera = async () => {
    setCameraError(null);
    setIsCameraActive(false);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera access is not supported by your browser or sandbox environment.');
      return;
    }

    try {
      // Stop any existing tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true'); // Required for iOS/Safari
        await videoRef.current.play();
      }

      // Check if torch/flashlight is supported
      const track = stream.getVideoTracks()[0];
      if (track) {
        const capabilities = (track.getCapabilities && track.getCapabilities()) as { torch?: boolean };
        if (capabilities && capabilities.torch) {
          setHasTorch(true);
        }
      }

      setIsCameraActive(true);
      requestAnimationFrame(scanLoop);
    } catch (err: unknown) {
      const e = err as Error;
      console.warn('Camera stream error:', e.name, e.message);
      if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
        setCameraError('Camera permission was denied. Please grant permission in browser settings.');
      } else if (e.name === 'NotFoundError' || e.name === 'DevicesNotFoundError') {
        setCameraError('No physical camera device detected on this system.');
      } else {
        setCameraError(`Camera initialization failed: ${e.message || 'Device in use or unavailable'}`);
      }
      setIsCameraActive(false);
    }
  };

  // Stop Camera Stream
  const stopCamera = useCallback(() => {
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsTorchOn(false);
  }, []);

  // Toggle Torch/Flashlight
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;

    try {
      const nextTorch = !isTorchOn;
      await (track as unknown as { applyConstraints: (c: unknown) => Promise<void> }).applyConstraints({
        advanced: [{ torch: nextTorch }],
      });
      setIsTorchOn(nextTorch);
    } catch (e) {
      console.warn('Failed to toggle torch:', e);
    }
  };

  // Flip Camera front/back
  const flipCamera = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    stopCamera();
    setTimeout(() => {
      startCamera();
    }, 200);
  };

  // Continuous QR Code Scanning Loop
  const scanLoop = () => {
    if (!videoRef.current || !canvasRef.current) {
      animationFrameIdRef.current = requestAnimationFrame(scanLoop);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code && code.data) {
        const now = Date.now();
        // Prevent duplicate spam within 2 seconds for the same code
        if (code.data !== lastScannedCode || now - lastScanTimestampRef.current > 2000) {
          lastScanTimestampRef.current = now;
          setLastScannedCode(code.data);
          handleVerifyScannedData(code.data);
        }
      }
    }

    animationFrameIdRef.current = requestAnimationFrame(scanLoop);
  };

  // Core Ticket Verification Pipeline
  const handleVerifyScannedData = (scannedString: string) => {
    setIsProcessing(true);
    const res = scanTicket(scannedString);

    let details: VerifiedTicketDetails;

    if (res.status === 'VALID' && res.booking) {
      // Approve boarding in state
      if (res.booking.passengers[0]) {
        approveBoarding(res.booking.id, res.booking.passengers[0].id);
      }

      playScanChime(true);
      details = {
        status: 'VALID',
        bookingRef: res.booking.bookingRef,
        passengerName: res.booking.passengers.map((p) => p.fullName).join(', '),
        seatNumbers: res.booking.seatNumbers,
        vesselName: res.ferry?.name || 'Assigned Ferry',
        tripNumber: res.trip?.tripNumber || `TRIP-${res.booking.tripId}`,
        fareInr: res.booking.totalFareInr,
        timestamp: new Date().toLocaleTimeString(),
      };
    } else if (res.status === 'ALREADY_USED') {
      playScanChime(false);
      details = {
        status: 'ALREADY_USED',
        bookingRef: res.booking?.bookingRef || scannedString,
        passengerName: res.booking?.passengers.map((p) => p.fullName).join(', '),
        vesselName: 'Commercial Ferry',
        timestamp: new Date().toLocaleTimeString(),
      };
    } else if (res.status === 'CANCELLED') {
      playScanChime(false);
      details = {
        status: 'CANCELLED',
        bookingRef: res.booking?.bookingRef || scannedString,
        timestamp: new Date().toLocaleTimeString(),
      };
    } else {
      playScanChime(false);
      details = {
        status: 'INVALID',
        bookingRef: scannedString.slice(0, 24),
        timestamp: new Date().toLocaleTimeString(),
      };
    }

    setScanResult(details);
    setIsProcessing(false);
    if (onScanComplete) {
      onScanComplete(details);
    }
  };

  // QR Code Image File Upload Scanner
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, img.width, img.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code && code.data) {
            handleVerifyScannedData(code.data);
          } else {
            alert('No QR barcode could be deciphered in this uploaded image.');
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-5">
      {/* Scanner Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white text-base">Live Camera Digital Ticket Scanner</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                {activeGateNumber}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Instant hardware camera optical recognition powered by jsQR & AIS manifest verification
            </p>
          </div>
        </div>

        {/* Audio Mute & Torch Controls */}
        <div className="flex items-center gap-2">
          {hasTorch && isCameraActive && (
            <button
              onClick={toggleTorch}
              className={`p-2 rounded-xl text-xs font-semibold border transition-colors ${
                isTorchOn
                  ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md shadow-amber-400/30'
                  : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
              }`}
              title="Toggle Flashlight / Torch"
            >
              <Zap className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors"
            title={soundEnabled ? 'Mute Turnstile Chime' : 'Enable Turnstile Chime'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          {isCameraActive && (
            <button
              onClick={flipCamera}
              className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors"
              title="Switch Camera (Front/Rear)"
            >
              <FlipHorizontal className="w-4 h-4 text-sky-400" />
            </button>
          )}
        </div>
      </div>

      {/* Video Viewport & Scanning Reticle */}
      <div className="relative w-full aspect-video sm:h-72 bg-slate-950 rounded-2xl border border-cyan-950 overflow-hidden flex items-center justify-center shadow-inner">
        {/* Hidden video & canvas elements for jsQR processing */}
        <video
          ref={videoRef}
          className={`w-full h-full object-cover ${isCameraActive ? 'block' : 'hidden'}`}
          muted
          autoPlay
          playsInline
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Overlay when Camera is Active */}
        {isCameraActive && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4">
            {/* Viewfinder Bounding Box */}
            <div className="w-48 sm:w-56 h-48 sm:h-56 border-2 border-cyan-400/80 rounded-2xl relative shadow-2xl shadow-cyan-950/80 flex items-center justify-center overflow-hidden">
              {/* Corner Accents */}
              <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-cyan-300" />
              <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-cyan-300" />
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-cyan-300" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-cyan-300" />

              {/* Animated Laser Scanning Line */}
              <div className="w-full h-0.5 bg-cyan-400 shadow-[0_0_15px_#22d3ee] absolute animate-[bounce_2s_infinite]" />

              <div className="text-[10px] font-mono text-cyan-300/70 bg-slate-950/60 px-2 py-0.5 rounded backdrop-blur-sm">
                ALIGN TICKET QR
              </div>
            </div>

            <div className="mt-3 px-3 py-1 rounded-full bg-slate-950/80 border border-slate-800 text-[11px] font-mono text-slate-300 backdrop-blur-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Optical Scanner Active • Point lens at passenger phone</span>
            </div>
          </div>
        )}

        {/* Standby State when Camera is Offline */}
        {!isCameraActive && (
          <div className="text-center p-6 space-y-4 max-w-sm">
            <div className="w-16 h-16 rounded-2xl bg-cyan-950/60 border border-cyan-800/40 flex items-center justify-center text-cyan-400 mx-auto">
              <QrCode className="w-8 h-8 text-cyan-400/80" />
            </div>

            <div>
              <h4 className="text-white font-bold text-sm">Optical Turnstile Cam Ready</h4>
              <p className="text-xs text-slate-400 mt-1">
                Activate your camera to scan mobile or printed boarding pass QR codes in real time.
              </p>
            </div>

            {cameraError && (
              <div className="p-2.5 rounded-xl bg-amber-950/60 border border-amber-800/60 text-amber-300 text-xs text-left flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                <span className="leading-tight">{cameraError}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <button
                onClick={startCamera}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-cyan-600/30 flex items-center gap-2"
              >
                <Camera className="w-4 h-4" />
                <span>Start Camera Scanner</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5"
                title="Scan QR barcode from an image file"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload QR</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>
        )}
      </div>

      {/* Camera Action Buttons when Running */}
      {isCameraActive && (
        <div className="flex items-center justify-between gap-3 text-xs">
          <button
            onClick={stopCamera}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 font-semibold flex items-center gap-1.5 transition-colors"
          >
            <CameraOff className="w-4 h-4 text-red-400" />
            <span>Pause Camera</span>
          </button>

          <span className="text-[11px] font-mono text-slate-500">
            Resolution: 640x480 • Mode: {facingMode}
          </span>
        </div>
      )}

      {/* Instant Test Simulator Chips (Ensures immediate verification without needing a physical phone/card) */}
      <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800/80 space-y-2">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span className="font-semibold flex items-center gap-1 text-cyan-400">
            <Sparkles className="w-3.5 h-3.5" /> Instant Test Ticket Payloads:
          </span>
          <span className="text-slate-500">Click to verify registered bookings</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {bookings.slice(0, 3).map((b) => (
            <button
              key={b.id}
              onClick={() =>
                handleVerifyScannedData(
                  `FERRYFLOW|TICKET|${b.bookingRef}|${b.tripId}|${b.passengers[0]?.id || 'P1'}|VALID`
                )
              }
              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-cyan-300 font-mono text-[11px] flex items-center gap-1.5 transition-colors"
            >
              <Ticket className="w-3 h-3 text-cyan-400" />
              <span>{b.bookingRef}</span>
              <span className="text-slate-400 text-[10px]">({b.passengers[0]?.fullName.split(' ')[0]})</span>
            </button>
          ))}

          <button
            onClick={() => handleVerifyScannedData('FERRYFLOW|TICKET|INVALID-TEST-REF|TRIP-99|PX|EXPIRED')}
            className="px-2.5 py-1 rounded-lg bg-red-950/50 hover:bg-red-900/60 border border-red-800/50 text-red-300 font-mono text-[11px] flex items-center gap-1.5 transition-colors"
          >
            <XCircle className="w-3 h-3 text-red-400" />
            <span>Simulate Invalid QR</span>
          </button>
        </div>
      </div>

      {/* Instant Digital Ticket Verification Result Card */}
      {scanResult && (
        <div
          className={`rounded-2xl p-4 sm:p-5 border transition-all animate-in fade-in ${
            scanResult.status === 'VALID'
              ? 'bg-emerald-950/40 border-emerald-500/60 shadow-lg shadow-emerald-950/40'
              : scanResult.status === 'ALREADY_USED'
              ? 'bg-amber-950/40 border-amber-500/60 shadow-lg shadow-amber-950/40'
              : 'bg-red-950/40 border-red-500/60 shadow-lg shadow-red-950/40'
          }`}
        >
          {/* Status Header Banner */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-2.5">
              {scanResult.status === 'VALID' ? (
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              ) : scanResult.status === 'ALREADY_USED' ? (
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400">
                  <XCircle className="w-5 h-5" />
                </div>
              )}

              <div>
                <h4
                  className={`text-sm sm:text-base font-extrabold tracking-tight ${
                    scanResult.status === 'VALID'
                      ? 'text-emerald-300'
                      : scanResult.status === 'ALREADY_USED'
                      ? 'text-amber-300'
                      : 'text-red-300'
                  }`}
                >
                  {scanResult.status === 'VALID'
                    ? 'TURNSTILE CLEARED: PASSENGER BOARDED'
                    : scanResult.status === 'ALREADY_USED'
                    ? 'WARNING: TICKET ALREADY BOARDED'
                    : 'BOARDING REJECTED: INVALID DIGITAL TICKET'}
                </h4>
                <div className="text-[11px] text-slate-400 font-mono">
                  Scan Time: {scanResult.timestamp} • Reference: {scanResult.bookingRef}
                </div>
              </div>
            </div>

            <button
              onClick={() => setScanResult(null)}
              className="text-slate-400 hover:text-white text-xs px-2 py-1 font-mono"
            >
              Dismiss
            </button>
          </div>

          {/* Ticket Detail Grid */}
          {scanResult.status === 'VALID' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 text-xs">
              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-500 text-[10px] block">PASSENGER NAME</span>
                <span className="font-bold text-white text-sm flex items-center gap-1 mt-0.5 truncate">
                  <User className="w-3.5 h-3.5 text-cyan-400" />
                  {scanResult.passengerName}
                </span>
              </div>

              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-500 text-[10px] block">SEAT NUMBER(S)</span>
                <span className="font-mono font-bold text-emerald-400 text-sm mt-0.5 block">
                  {scanResult.seatNumbers?.join(', ') || 'General Deck'}
                </span>
              </div>

              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-500 text-[10px] block">VESSEL & GATE</span>
                <span className="font-bold text-cyan-300 text-sm flex items-center gap-1 mt-0.5 truncate">
                  <Ship className="w-3.5 h-3.5 text-cyan-400" />
                  {scanResult.vesselName}
                </span>
              </div>

              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-500 text-[10px] block">FARE VERIFIED</span>
                <span className="font-mono font-bold text-white text-sm mt-0.5 block">
                  ₹{scanResult.fareInr} (Paid)
                </span>
              </div>
            </div>
          )}

          {scanResult.status === 'ALREADY_USED' && (
            <p className="text-xs text-amber-200/90 pt-2 leading-relaxed">
              This digital boarding pass was already authenticated and punched through the gate turnstile. Duplicate boarding attempts are flagged in the harbor security audit trail.
            </p>
          )}

          {scanResult.status === 'INVALID' && (
            <p className="text-xs text-red-200/90 pt-2 leading-relaxed">
              No matching booking reservation found in the harbor database for this barcode. Please ask the passenger to open their booking confirmation or consult the ticketing counter.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
