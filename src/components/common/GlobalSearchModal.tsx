import React, { useState, useEffect, useRef } from 'react';
import { useFerry } from '../../context/FerryContext';
import {
  Search,
  Ship,
  Navigation,
  MapPin,
  Ticket,
  ArrowRight,
  Mic,
  MicOff,
  Radio,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  Volume2,
} from 'lucide-react';

interface SpeechRecognitionEvent {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface WebSpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
}

export const GlobalSearchModal: React.FC = () => {
  const {
    isSearchOpen,
    setIsSearchOpen,
    ferries,
    routes,
    ports,
    trips,
    bookings,
    alerts,
    setSelectedFerryId,
    setActiveView,
    setIsStatusModalOpen,
  } = useFerry();

  const [query, setQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [voiceFeedback, setVoiceFeedback] = useState<string | null>(null);
  const [speechSupported, setSpeechSupported] = useState(true);

  const recognitionRef = useRef<WebSpeechRecognitionInstance | null>(null);
  const feedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Keyboard shortcut Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(!isSearchOpen);
      } else if (e.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, setIsSearchOpen]);

  // Clean up speech recognition on close or unmount
  useEffect(() => {
    if (!isSearchOpen && isListening) {
      stopVoiceRecognition();
    }
  }, [isSearchOpen]);

  // Initialize Speech Recognition
  const startVoiceRecognition = () => {
    const windowWithSpeech = window as unknown as {
      SpeechRecognition?: new () => WebSpeechRecognitionInstance;
      webkitSpeechRecognition?: new () => WebSpeechRecognitionInstance;
    };

    const SpeechRecConstructor =
      windowWithSpeech.SpeechRecognition || windowWithSpeech.webkitSpeechRecognition;

    if (!SpeechRecConstructor) {
      setSpeechSupported(false);
      triggerFallbackSimulation('Status updates');
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecConstructor();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceFeedback('Listening... Speak a ferry route, vessel name, or "status updates"');
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0]?.[0]?.transcript || '';
        if (transcript) {
          processVoiceInput(transcript);
        }
      };

      recognition.onerror = (err: { error: string }) => {
        console.warn('Speech recognition notice:', err.error);
        setIsListening(false);
        if (err.error === 'not-allowed' || err.error === 'audio-capture') {
          setVoiceFeedback('Microphone permission required. Click a quick command below:');
        } else {
          setVoiceFeedback('Listening timed out. Select a quick voice query below:');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.warn('Speech recognition init error:', e);
      setIsListening(false);
      triggerFallbackSimulation('Mandwa route');
    }
  };

  const stopVoiceRecognition = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    setIsListening(false);
  };

  // Fallback simulator for sandboxed iframes or browsers without microphone
  const triggerFallbackSimulation = (commandText: string) => {
    setIsListening(true);
    setVoiceFeedback(`Processing voice input: "${commandText}"...`);
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);

    feedbackTimeoutRef.current = setTimeout(() => {
      setIsListening(false);
      processVoiceInput(commandText);
    }, 600);
  };

  const processVoiceInput = (rawInput: string) => {
    const cleaned = rawInput.trim();
    const lower = cleaned.toLowerCase();
    setQuery(cleaned);

    let feedbackMsg = `Found matches for "${cleaned}"`;

    // Special voice commands
    if (lower.includes('status') || lower.includes('update') || lower.includes('delay')) {
      feedbackMsg = `Showing live status updates & route delays for: "${cleaned}"`;
    } else if (lower.includes('mandwa')) {
      feedbackMsg = `Route detected: Gateway to Mandwa (Alibaug)`;
    } else if (lower.includes('elephanta')) {
      feedbackMsg = `Route detected: Gateway to Elephanta Caves`;
    } else if (lower.includes('mora') || lower.includes('bhaucha')) {
      feedbackMsg = `Route detected: Bhaucha Dhakka to Mora Pier`;
    } else if (lower.includes('live') || lower.includes('track')) {
      feedbackMsg = `Opening live maritime transponders`;
    }

    setVoiceFeedback(feedbackMsg);

    // Optional synthesized audio confirmation
    try {
      if ('speechSynthesis' in window && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(
          lower.includes('status') ? 'Showing ferry status updates' : `Searching for ${cleaned}`
        );
        utter.rate = 1.1;
        utter.volume = 0.6;
        window.speechSynthesis.speak(utter);
      }
    } catch {
      // ignore
    }
  };

  if (!isSearchOpen) return null;

  const cleanQuery = query.toLowerCase().trim();

  const isStatusSearch =
    cleanQuery.includes('status') ||
    cleanQuery.includes('update') ||
    cleanQuery.includes('delay') ||
    cleanQuery.includes('alert') ||
    cleanQuery === 'live';

  const matchedFerries = cleanQuery
    ? ferries.filter(
        (f) =>
          f.name.toLowerCase().includes(cleanQuery) ||
          f.vesselId.toLowerCase().includes(cleanQuery) ||
          f.captainName.toLowerCase().includes(cleanQuery) ||
          (isStatusSearch && (f.status === 'delayed' || f.status === 'emergency'))
      )
    : ferries.slice(0, 3);

  const matchedRoutes = cleanQuery
    ? routes.filter(
        (r) =>
          r.name.toLowerCase().includes(cleanQuery) ||
          (isStatusSearch && r.status !== 'active')
      )
    : routes.slice(0, 2);

  const matchedPorts = cleanQuery
    ? ports.filter(
        (p) =>
          p.name.toLowerCase().includes(cleanQuery) ||
          p.city.toLowerCase().includes(cleanQuery) ||
          p.code.toLowerCase().includes(cleanQuery)
      )
    : ports.slice(0, 2);

  const matchedBookings = cleanQuery
    ? bookings.filter(
        (b) =>
          b.bookingRef.toLowerCase().includes(cleanQuery) ||
          b.passengers.some((p) => p.fullName.toLowerCase().includes(cleanQuery))
      )
    : bookings.slice(0, 2);

  const matchedAlerts = isStatusSearch || cleanQuery
    ? alerts.filter(
        (a) =>
          a.active &&
          (isStatusSearch ||
            a.title.toLowerCase().includes(cleanQuery) ||
            a.message.toLowerCase().includes(cleanQuery))
      )
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-20 bg-black/75 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-cyan-800/60 rounded-2xl max-w-2xl w-full p-4 shadow-2xl relative text-slate-200">
        {/* Search Input Bar with Microphone Voice Action */}
        <div
          className={`flex items-center gap-2.5 px-3 py-2.5 bg-slate-950/80 border rounded-xl transition-all ${
            isListening
              ? 'border-cyan-400 ring-2 ring-cyan-500/30 shadow-lg shadow-cyan-900/30'
              : 'border-slate-800 focus-within:border-cyan-500'
          }`}
        >
          <Search className="w-5 h-5 text-cyan-400 flex-shrink-0" />
          <input
            type="text"
            id="global-search-input"
            placeholder='Search or speak: "Mandwa route", "Status updates", "FV-101"...'
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (voiceFeedback) setVoiceFeedback(null);
            }}
            className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
            autoFocus
          />

          {/* Microphone Voice Command Button */}
          <button
            id="search-mic-btn"
            type="button"
            onClick={isListening ? stopVoiceRecognition : startVoiceRecognition}
            className={`p-2 rounded-lg transition-all flex items-center gap-1.5 ${
              isListening
                ? 'bg-cyan-500 text-slate-950 font-bold animate-pulse shadow-md shadow-cyan-400/40'
                : 'bg-slate-900 hover:bg-slate-800 text-cyan-400 hover:text-cyan-300 border border-slate-700'
            }`}
            title={isListening ? 'Click to stop listening' : 'Search by Voice Command (Microphone)'}
            aria-label="Search with voice input"
          >
            {isListening ? (
              <>
                <MicOff className="w-4 h-4" />
                <span className="text-[11px] font-mono tracking-tight hidden sm:inline">Listening...</span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                <span className="text-[11px] font-medium hidden sm:inline">Voice</span>
              </>
            )}
          </button>

          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono bg-slate-800 text-slate-400 border border-slate-700 rounded">
            ESC
          </kbd>
        </div>

        {/* Audio Waveform & Status Visualizer when Listening */}
        {isListening && (
          <div className="mt-2.5 p-3 rounded-xl bg-cyan-950/40 border border-cyan-700/50 flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                {[40, 75, 95, 60, 85, 50, 90, 65].map((h, idx) => (
                  <span
                    key={idx}
                    className="w-1 bg-cyan-400 rounded-full animate-pulse"
                    style={{
                      height: `${h * 0.25}px`,
                      animationDelay: `${idx * 0.1}s`,
                      animationDuration: '0.6s',
                    }}
                  />
                ))}
              </div>
              <div className="text-xs text-cyan-300 font-medium">
                Listening to microphone input... Speak now
              </div>
            </div>
            <button
              onClick={stopVoiceRecognition}
              className="text-xs px-2 py-0.5 rounded bg-slate-900 text-slate-300 hover:text-white border border-slate-700 font-mono"
            >
              Done
            </button>
          </div>
        )}

        {/* Voice Feedback Banner */}
        {voiceFeedback && !isListening && (
          <div className="mt-2 px-3 py-1.5 rounded-lg bg-slate-950/80 border border-cyan-900/60 flex items-center justify-between gap-2 text-xs text-cyan-300 animate-in fade-in">
            <div className="flex items-center gap-1.5 truncate">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
              <span className="truncate">{voiceFeedback}</span>
            </div>
            <button
              onClick={() => setVoiceFeedback(null)}
              className="text-slate-400 hover:text-white text-[10px] px-1 font-mono"
            >
              ✕
            </button>
          </div>
        )}

        {/* Quick Voice Command Suggestion Chips */}
        <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
          <span className="text-slate-500 font-medium flex items-center gap-1 flex-shrink-0">
            <Mic className="w-3 h-3 text-cyan-400" /> Voice Commands:
          </span>
          {[
            { label: 'Status updates', query: 'Status updates' },
            { label: 'Mandwa route', query: 'Mandwa route' },
            { label: 'Elephanta route', query: 'Elephanta route' },
            { label: 'Delayed ferries', query: 'Delayed ferries' },
            { label: 'Ocean Express', query: 'Ocean Express' },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => triggerFallbackSimulation(item.query)}
              className="px-2 py-0.5 rounded-full bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-cyan-800/60 text-slate-300 hover:text-cyan-300 whitespace-nowrap transition-colors"
            >
              "{item.label}"
            </button>
          ))}
        </div>

        {/* Search Results */}
        <div className="mt-4 max-h-[400px] overflow-y-auto space-y-4 pr-1 text-xs">
          {/* Live Status Updates Section (Triggered if query contains status/delay/updates) */}
          {(isStatusSearch || matchedAlerts.length > 0) && (
            <div className="bg-slate-950/70 border border-amber-500/40 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 text-[11px] font-semibold text-amber-300">
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Live System Status & Disruption Alerts ({matchedAlerts.length})</span>
                </div>
                <button
                  onClick={() => {
                    setIsStatusModalOpen(true);
                    setIsSearchOpen(false);
                  }}
                  className="text-[10px] text-cyan-400 hover:underline font-mono"
                >
                  View All Diagnostics →
                </button>
              </div>

              {matchedAlerts.length === 0 ? (
                <div className="flex items-center gap-2 text-emerald-400 text-xs py-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>All routes running on schedule. No critical service disruptions logged.</span>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {matchedAlerts.map((alt) => (
                    <div
                      key={alt.id}
                      className="p-2 rounded-lg bg-slate-900 border border-amber-500/30 flex items-start justify-between gap-2"
                    >
                      <div>
                        <div className="font-semibold text-white flex items-center gap-1.5">
                          <span>{alt.title}</span>
                          <span className="text-[9px] font-mono px-1 rounded bg-amber-500/20 text-amber-300 uppercase">
                            {alt.severity}
                          </span>
                        </div>
                        <div className="text-slate-300 text-[11px] mt-0.5">{alt.message}</div>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">
                        {alt.createdAt}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Ferries */}
          {matchedFerries.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold uppercase text-slate-400 px-2 mb-1.5 flex items-center gap-1.5">
                <Ship className="w-3.5 h-3.5 text-cyan-400" />
                <span>Ferries & Vessels ({matchedFerries.length})</span>
              </div>
              <div className="space-y-1">
                {matchedFerries.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => {
                      setSelectedFerryId(f.id);
                      setActiveView('live-tracking');
                      setIsSearchOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-800/80 transition-colors text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center text-cyan-400 font-mono font-bold text-xs">
                        {f.vesselId.replace('FV-', '')}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors">
                          {f.name} <span className="text-slate-500 font-normal">({f.vesselId})</span>
                        </div>
                        <div className="text-slate-400 text-[11px]">
                          {f.type} • {f.speedKnots} kts • {f.currentPassengers}/{f.capacity} pax
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`capitalize px-2 py-0.5 rounded text-[10px] font-mono ${
                          f.status === 'delayed'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold'
                            : f.status === 'emergency'
                            ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {f.status.replace('_', ' ')}
                      </span>
                      <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Routes */}
          {matchedRoutes.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold uppercase text-slate-400 px-2 mb-1.5 flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-sky-400" />
                <span>Maritime Routes ({matchedRoutes.length})</span>
              </div>
              <div className="space-y-1">
                {matchedRoutes.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => {
                      setActiveView('routes');
                      setIsSearchOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-800/80 transition-colors text-left group"
                  >
                    <div>
                      <div className="font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors">
                        {r.name}
                      </div>
                      <div className="text-slate-400 text-[11px]">
                        {r.distanceKm} km • ~{r.estimatedDurationMin} mins • Base fare ₹{r.baseFareInr}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Ports */}
          {matchedPorts.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold uppercase text-slate-400 px-2 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span>Ports & Terminals</span>
              </div>
              <div className="space-y-1">
                {matchedPorts.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setActiveView('ports');
                      setIsSearchOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-800/80 transition-colors text-left group"
                  >
                    <div>
                      <div className="font-semibold text-slate-200 group-hover:text-emerald-300 transition-colors">
                        {p.name} <span className="text-slate-500 font-mono">[{p.code}]</span>
                      </div>
                      <div className="text-slate-400 text-[11px]">
                        {p.city} • {p.activeFerriesCount} active ferries • {p.waitingPassengers} waiting
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bookings */}
          {matchedBookings.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold uppercase text-slate-400 px-2 mb-1.5 flex items-center gap-1.5">
                <Ticket className="w-3.5 h-3.5 text-amber-400" />
                <span>Bookings & Tickets</span>
              </div>
              <div className="space-y-1">
                {matchedBookings.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => {
                      setActiveView('my-tickets');
                      setIsSearchOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-800/80 transition-colors text-left group"
                  >
                    <div>
                      <div className="font-semibold text-slate-200 group-hover:text-amber-300 transition-colors">
                        {b.bookingRef} • {b.passengers[0]?.fullName}
                      </div>
                      <div className="text-slate-400 text-[11px]">
                        Total ₹{b.totalFareInr} • Seats {b.seatNumbers.join(', ')} • Status: {b.bookingStatus}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {matchedFerries.length === 0 && matchedRoutes.length === 0 && matchedPorts.length === 0 && matchedBookings.length === 0 && (
            <div className="text-center py-8 text-slate-400 space-y-2">
              <p>No matching vessels, routes, or tickets found for "{query}".</p>
              <p className="text-[11px] text-slate-500">
                Try asking by voice: <span className="text-cyan-400 font-mono">"Status updates"</span> or <span className="text-cyan-400 font-mono">"Mandwa route"</span>
              </p>
            </div>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
          <span>Click the microphone or command chips to search by voice</span>
          <span>Press ESC to close</span>
        </div>
      </div>
    </div>
  );
};
