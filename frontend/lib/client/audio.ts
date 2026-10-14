let audioCtx: AudioContext | null = null;
let userHasInteracted = false;
let unlockListenersAttached = false;

export function markUserInteracted(): void {
  userHasInteracted = true;
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {
      // Ignore suspension resume errors
    });
  }
}

export function setupAudioUnlocker(): void {
  if (typeof window === "undefined" || unlockListenersAttached) return;
  unlockListenersAttached = true;

  const handleInteraction = () => {
    markUserInteracted();
    window.removeEventListener("pointerdown", handleInteraction);
    window.removeEventListener("keydown", handleInteraction);
    window.removeEventListener("touchstart", handleInteraction);
  };

  window.addEventListener("pointerdown", handleInteraction, { passive: true });
  window.addEventListener("keydown", handleInteraction, { passive: true });
  window.addEventListener("touchstart", handleInteraction, { passive: true });
}

export function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!userHasInteracted) return null;

  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }

  return audioCtx;
}

let lastTickTime = 0;
const MIN_TICK_INTERVAL_MS = 32;

export function playTakeTick(pitchMultiplier = 1): void {
  if (typeof window === "undefined") return;

  const now = performance.now();
  if (now - lastTickTime < MIN_TICK_INTERVAL_MS) {
    return;
  }
  lastTickTime = now;

  // Lazily ensure listener is set up
  if (!unlockListenersAttached) {
    setupAudioUnlocker();
  }

  // Do not play if user has not interacted yet (prevents browser autoplay policy warnings)
  if (!userHasInteracted) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(800 * pitchMultiplier, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(160, ctx.currentTime + 0.035);

    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.035);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.04);
  } catch {
    // Ignore audio permission/context errors gracefully
  }
}

export function playClickSound(): void {
  playTakeTick(1.25);
}

export function playDirectionalTick(direction: "forward" | "backward" | number): void {
  const isForward = direction === "forward" || (typeof direction === "number" && direction > 0);
  const isBackward = direction === "backward" || (typeof direction === "number" && direction < 0);
  const multiplier = isForward ? 1.35 : isBackward ? 0.75 : 1.0;
  playTakeTick(multiplier);
}

export function playSuccessChime(): void {
  if (typeof window === "undefined" || !userHasInteracted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume().catch(() => {});

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); // E5
    osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.16); // G5

    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch {
    // Ignore audio errors gracefully
  }
}

export function playThemeSound(theme: "dark" | "light"): void {
  if (theme === "dark") {
    playTakeTick(0.8);
  } else {
    playTakeTick(1.4);
  }
}

// Reset helper for testing environments
export function resetAudioStateForTesting(): void {
  audioCtx = null;
  userHasInteracted = false;
  unlockListenersAttached = false;
}


