import React, { useState, useRef, useEffect } from 'react';
import jsQR from 'jsqr';
import { useFerry } from '../../context/FerryContext';
import {
  Camera,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  X,
  Sparkles,
  ShieldCheck,
  Video,
  VideoOff,
  Ship,
  MapPin,
  Clock,
  UserCheck,
  Keyboard,
  Volume2,
  KeyRound,
  Eye,
} from 'lucide-react';

interface Props {
  onClose?: () => void;
  onVerified?: (bookingId: string) => void;
}

// Requirement: Audible beep sound notification on successful ticket scan via Web Audio API
const playScanBeep = (isSuccess: boolean = true) => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (isSuccess) {
      // Crisp, pleasant two-tone confirmation chime (880Hz then 1320Hz)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1320, ctx.currentTime + 0.07);
      gain.gain.setValueAtTime(0.22, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.28);
    } else {
      // Gentle warning buzz for invalid / already used pass
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(280, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.22);
    }
    setTimeout(() => {
      try {
        ctx.close();
      } catch {}
    }, 380);
  } catch {
    // Audio playback safely optional
  }
};

export const PassengerGateScanner: React.FC<Props> = ({ onClose, onVerified }) => {
  const { bookings, scanTicket, approveBoarding, theme } = useFerry();
  const isDark = theme === 'dark';

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const manualInputRef = useRef<HTMLInputElement>(null);

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(true);
  const [isManualOverrideActive, setIsManualOverrideActive] = useState<boolean>(false);
  const [scannedResult, setScannedResult] = useState<{
    code: string;
    status: 'VALID' | 'ALREADY_USED' | 'CANCELLED' | 'INVALID';
    booking?: any;
    passenger?: any;
    trip?: any;
    ferry?: any;
  } | null>(null);
  const [manualCode, setManualCode] = useState<string>(bookings[0]?.id || 'BK-2026-0901');

  // Start Camera Stream
  useEffect(() => {
    let activeStream: MediaStream | null = null;

    async function startCamera() {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Camera device API is not supported in this browser environment');
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
        });

        activeStream = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // Wait for video metadata to load
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch(() => {});
            setHasCameraPermission(true);
            setCameraError(null);
            scanLoop();
          };
        }
      } catch (err: any) {
        console.warn('Camera access unavailable or denied:', err.message);
        setHasCameraPermission(false);
        setCameraError(err.message || 'Camera access not permitted. Use demo gate validator below.');
      }
    }

    startCamera();

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Frame Scanning Loop using jsQR
  const scanLoop = () => {
    if (!videoRef.current || !canvasRef.current || !isScanning) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (ctx && video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code && code.data) {
        handleProcessQrCode(code.data);
        return; // Pause scanning while displaying result
      }
    }

    animFrameIdRef.current = requestAnimationFrame(scanLoop);
  };

  const handleProcessQrCode = (rawCode: string) => {
    const trimmed = rawCode.trim();
    // Validate ticket through FerryContext
    const verification = scanTicket(trimmed);
    setScannedResult({
      code: trimmed,
      status: verification.status,
      booking: verification.booking,
      passenger: verification.passenger,
      trip: verification.trip,
      ferry: verification.ferry,
    });
    setIsScanning(false);

    if (verification.status === 'VALID' && verification.booking) {
      if (onVerified) {
        onVerified(verification.booking.id);
      }
    }

    // Requirement: Audible beep sound notification when a ticket QR code is successfully scanned
    playScanBeep(verification.status === 'VALID');
  };

  const handleResetScan = () => {
    setScannedResult(null);
    setIsScanning(true);
    if (hasCameraPermission) {
      animFrameIdRef.current = requestAnimationFrame(scanLoop);
    }
  };

  const handleManualSimulate = (sampleCode: string) => {
    handleProcessQrCode(sampleCode);
  };

  return (
    <div
      id="passenger-gate-scanner-card"
      className={`p-6 rounded-2xl border shadow-2xl space-y-6 ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-tr from-cyan-600 to-sky-500 text-white shadow-lg shadow-cyan-900/30">
            <Camera className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">Gate Turnstile QR Scanner</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 font-semibold">
                Camera Scanner + Live Verification
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Verify digital boarding passes directly using your device camera or instant turnstile simulator
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Requirement: Manual Override Button in scanner */}
          <button
            type="button"
            id="scanner-manual-override-btn"
            onClick={() => {
              setIsManualOverrideActive((prev) => !prev);
              setTimeout(() => manualInputRef.current?.focus(), 100);
            }}
            className={`px-3.5 py-1.5 rounded-xl font-bold text-xs border transition-all flex items-center gap-1.5 ${
              isManualOverrideActive
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
            title="Switch to manual ticket code input if camera scan fails or lighting is insufficient"
          >
            <Keyboard className="w-4 h-4 text-amber-400" />
            <span>{isManualOverrideActive ? 'Camera Scanner' : 'Manual Override'}</span>
          </button>

          <span
            className="hidden sm:flex items-center gap-1 text-[11px] font-mono px-2.5 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-400"
            title="Audible beep sound notification confirmed on scan"
          >
            <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Audio Beep On</span>
          </span>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Camera Viewfinder / Simulator + Verification Result */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Camera Video Viewfinder / Manual Override Panel */}
        <div className="lg:col-span-7 space-y-3">
          {isManualOverrideActive ? (
            /* Requirement: Manual Override View for low light / camera failure */
            <div
              id="manual-override-panel"
              className="relative aspect-video rounded-2xl bg-slate-950 border border-amber-500/50 p-6 flex flex-col justify-between shadow-inner"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Manual Pass Code Override</h4>
                    <p className="text-xs text-slate-400">
                      Camera scan failing or environment too dark? Enter the alphanumeric reference directly:
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 bg-slate-900/90 p-4 rounded-xl border border-slate-800">
                <label className="text-[11px] font-mono text-amber-400 uppercase font-bold block">
                  Passenger Ticket Reference / Barcode Code:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    ref={manualInputRef}
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleManualSimulate(manualCode);
                    }}
                    placeholder="e.g. FF-BKG-89021 or book-001"
                    className="flex-1 bg-slate-950 border border-amber-500/60 text-white font-mono text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={() => handleManualSimulate(manualCode)}
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-md flex items-center gap-1.5 shrink-0"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Validate Code</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                <span>Turnstile gate will unlock upon valid hash match</span>
                {hasCameraPermission && (
                  <button
                    type="button"
                    onClick={() => setIsManualOverrideActive(false)}
                    className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Switch Back to Camera</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="relative aspect-video rounded-2xl bg-black border border-slate-800 overflow-hidden flex items-center justify-center shadow-inner">
              {/* Real Camera Video */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${hasCameraPermission ? 'block' : 'hidden'}`}
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Target Reticle Overlay */}
              {hasCameraPermission && isScanning && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-56 h-56 border-2 border-dashed border-cyan-400 rounded-2xl relative flex items-center justify-center bg-cyan-500/5">
                    {/* Corner brackets */}
                    <div className="absolute top-0 left-0 w-5 h-5 border-t-4 border-l-4 border-cyan-400 rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-5 h-5 border-t-4 border-r-4 border-cyan-400 rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-5 h-5 border-b-4 border-l-4 border-cyan-400 rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-5 h-5 border-b-4 border-r-4 border-cyan-400 rounded-br-lg" />

                    {/* Animated Laser Scan Line */}
                    <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent absolute animate-bounce" />
                  </div>
                </div>
              )}

              {/* Camera Unavailable / Denied State Fallback */}
              {!hasCameraPermission && (
                <div className="text-center p-6 space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-400">
                    <VideoOff className="w-7 h-7 text-amber-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Camera Device Restricted / Inactive</h4>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                      Device camera stream requires explicit user permissions or is sandboxed in iframe preview.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsManualOverrideActive(true);
                      setTimeout(() => manualInputRef.current?.focus(), 100);
                    }}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 mx-auto transition-colors"
                  >
                    <Keyboard className="w-4 h-4" />
                    <span>Open Manual Override</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Quick Select Buttons for Demo Bookings */}
          <div className="space-y-2">
            <span className="text-[11px] uppercase font-mono text-slate-400 block font-semibold">
              Test Instant Gate Verification with Available Bookings:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {bookings.slice(0, 3).map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => handleManualSimulate(b.id)}
                  className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-mono font-bold text-cyan-400 flex items-center gap-1.5 transition-colors"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Scan {b.id}</span>
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleManualSimulate('INVALID-TICKET-999')}
                className="px-3 py-1.5 rounded-lg bg-rose-950/50 hover:bg-rose-900 border border-rose-800 text-xs font-mono font-bold text-rose-300 transition-colors"
              >
                Scan Invalid Test
              </button>
            </div>
          </div>
        </div>

        {/* Right Col: Verification Outcome Display */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-mono uppercase text-slate-400 font-semibold">
                  Gate Verification Status
                </span>
                {scannedResult && (
                  <button
                    type="button"
                    onClick={handleResetScan}
                    className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Scan Next</span>
                  </button>
                )}
              </div>

              {/* Status Outcome */}
              {scannedResult ? (
                <div className="pt-4 space-y-4">
                  {scannedResult.status === 'VALID' ? (
                    <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-200 space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                        <div>
                          <div className="font-bold text-sm text-white">BOARDING PASS VERIFIED</div>
                          <div className="text-[11px] text-emerald-300 font-mono">
                            Turnstile Gate Cleared for Embarkation
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : scannedResult.status === 'ALREADY_USED' ? (
                    <div className="p-4 rounded-xl bg-amber-950/80 border border-amber-500/60 text-amber-200 space-y-2">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                        <div>
                          <div className="font-bold text-sm text-white">PASS ALREADY BOARDED</div>
                          <div className="text-[11px] text-amber-300">
                            This ticket has already cleared turnstile gate check.
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-500/60 text-rose-200 space-y-2">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                        <div>
                          <div className="font-bold text-sm text-white">UNRECOGNIZED PASS CODE</div>
                          <div className="text-[11px] text-rose-300">
                            Invalid signature or expired voyage barcode.
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Scanned Manifest Details */}
                  {scannedResult.booking && (
                    <div className="bg-slate-900/90 rounded-xl p-3.5 border border-slate-800 space-y-2.5 text-xs">
                      <div className="flex items-center justify-between font-mono text-[11px] pb-2 border-b border-slate-800 text-slate-400">
                        <span>PASS ID: {scannedResult.booking.id}</span>
                        <span className="text-cyan-400 font-bold">MMB VERIFIED</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Lead Passenger</span>
                          <span className="font-bold text-white">
                            {scannedResult.booking.passengers[0]?.fullName || 'Passenger'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Total Pax</span>
                          <span className="font-bold text-cyan-300">
                            {scannedResult.booking.passengers.length} Passenger(s)
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Gate Assignment</span>
                          <span className="font-bold text-amber-300">Gate #2 (Jetty A)</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Assigned Seat</span>
                          <span className="font-bold text-emerald-400">
                            {scannedResult.booking.passengers[0]?.seatNumber || 'Upper Deck General'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-12 text-center text-slate-500 space-y-2">
                  <QrCode className="w-10 h-10 mx-auto text-slate-600 animate-pulse" />
                  <p className="text-xs">
                    Align your printed ticket or phone screen QR pass within the viewfinder above to initiate turnstile gate clearance.
                  </p>
                </div>
              )}
            </div>

            {/* Manual Code Input Bar */}
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">
                Or Enter Ticket Reference Manually:
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="BK-2026-0901"
                  className="flex-1 bg-slate-900 border border-slate-700 text-white font-mono text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="button"
                  onClick={() => handleManualSimulate(manualCode)}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-md"
                >
                  Verify
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
