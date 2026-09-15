// Vitest setup for jsdom environment
if (typeof window !== 'undefined') {
  // Mock window.AudioContext
  window.AudioContext = window.AudioContext || (class MockAudioContext {
    createOscillator() {
      return {
        connect: () => {},
        start: () => {},
        stop: () => {},
        frequency: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
        type: 'sine',
      };
    }
    createGain() {
      return {
        connect: () => {},
        gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
      };
    }
    close() { return Promise.resolve(); }
    state = 'running';
  } as any);

  // Mock window.speechSynthesis
  if (!window.speechSynthesis) {
    (window as any).speechSynthesis = {
      speak: () => {},
      cancel: () => {},
      pause: () => {},
      resume: () => {},
      getVoices: () => [],
    };
  }

  // Mock navigator.vibrate
  if (!navigator.vibrate) {
    (navigator as any).vibrate = () => true;
  }
}
