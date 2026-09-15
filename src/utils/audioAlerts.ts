import { AccessibilitySettings } from '../types';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!audioCtx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  } catch (err) {
    console.warn('AudioContext initialization prevented:', err);
    return null;
  }
}

/**
 * Routine Operational Notification Sound
 * Melodic, gentle dual-tone maritime harmonic chime (587Hz -> 880Hz)
 * Used for: Gate boarding punch, schedule update, passenger boarding completed
 */
export function playRoutineNotificationSound(volumePercent: number = 70): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const gainNode = ctx.createGain();
    const normalizedVol = Math.max(0, Math.min(1, volumePercent / 100)) * 0.3;
    const now = ctx.currentTime;

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(normalizedVol, now + 0.04);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    gainNode.connect(ctx.destination);

    // Note 1: D5 (587.33 Hz)
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    osc1.connect(gainNode);
    osc1.start(now);
    osc1.stop(now + 0.2);

    // Note 2: A5 (880.00 Hz)
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880.0, now + 0.12);
    osc2.connect(gainNode);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.45);
  } catch (e) {
    console.warn('Failed to play routine chime:', e);
  }
}

/**
 * Emergency Distress Signal Sound (SOLAS / Maritime Chapter III standard)
 * High-intensity, high-urgency alternating two-tone siren (800Hz / 1050Hz warble)
 * Used for: MAYDAY distress, critical weather threshold breaches, fire/flooding emergency
 */
export function playMaritimeDistressAlarm(volumePercent: number = 95): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const normalizedVol = Math.max(0, Math.min(1, volumePercent / 100)) * 0.65;
    const duration = 1.6; // 1.6 second emergency blast sequence

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(normalizedVol, now);
    masterGain.gain.setValueAtTime(normalizedVol, now + duration - 0.1);
    masterGain.gain.linearRampToValueAtTime(0.001, now + duration);
    masterGain.connect(ctx.destination);

    // Warble oscillator 1 (800Hz to 1050Hz fast pulsing siren)
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';

    // Modulate pitch rapidly between 800 Hz and 1050 Hz (maritime alarm siren pattern)
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = 'square';
    lfo.frequency.setValueAtTime(4, now); // 4Hz siren alternation
    lfoGain.gain.setValueAtTime(250, now); // +/- 250 Hz deviation

    osc.frequency.setValueAtTime(900, now);
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    osc.connect(masterGain);
    lfo.start(now);
    osc.start(now);
    lfo.stop(now + duration);
    osc.stop(now + duration);
  } catch (e) {
    console.warn('Failed to play maritime distress alarm:', e);
  }
}

/**
 * Web Speech API Vocalizer for Bridge Announcements
 */
export function vocalizeBridgeAnnouncement(text: string): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel(); // Stop prior announcement
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.volume = 0.9;
    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('Speech synthesis notification prevented:', err);
  }
}

/**
 * Haptic feedback trigger for supported mobile devices
 */
export function triggerMaritimeHaptic(isEmergency: boolean = false): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      if (isEmergency) {
        navigator.vibrate([200, 100, 200, 100, 500]);
      } else {
        navigator.vibrate(60);
      }
    } catch {
      // Vibration not permitted
    }
  }
}
