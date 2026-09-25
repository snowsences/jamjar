// Shared motion helpers: platform detection, spring easings, haptics, and
// the Android press ripple.
const ua = navigator.userAgent;
export const platform = /android/i.test(ua)
  ? "android"
  : /iPad|iPhone|iPod/.test(ua) ||
      (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
    ? "ios"
    : "other";
document.documentElement.dataset.platform = platform;

export const reducedMotion = () =>
  matchMedia("(prefers-reduced-motion: reduce)").matches;
export const phone = () => matchMedia("(max-width: 680px)").matches;

// Damped springs sampled into linear(); older engines get a close cubic.
const linearEasing = CSS.supports?.("transition-timing-function", "linear(0, 1)");
export const SPRING = linearEasing
  ? "linear(0, 0.0356 3.6%, 0.1179 7.1%, 0.2208 10.7%, 0.3285 14.3%, 0.4318 17.9%, 0.5261 21.4%, 0.6092 25%, 0.6807 28.6%, 0.7411 32.1%, 0.7915 35.7%, 0.833 39.3%, 0.8669 42.9%, 0.8943 46.4%, 0.9164 50%, 0.9341 53.6%, 0.9482 57.1%, 0.9594 60.7%, 0.9683 64.3%, 0.9752 67.9%, 0.9807 71.4%, 0.985 75%, 0.9884 78.6%, 0.991 82.1%, 0.993 85.7%, 0.9946 89.3%, 0.9958 92.9%, 0.9968 96.4%, 1)"
  : "cubic-bezier(0.2, 0.9, 0.25, 1)";
export const BOUNCE = linearEasing
  ? "linear(0, 0.0528 3.6%, 0.1767 7.1%, 0.3311 10.7%, 0.489 14.3%, 0.6335 17.9%, 0.7559 21.4%, 0.8531 25%, 0.9258 28.6%, 0.9767 32.1%, 1.0095 35.7%, 1.0282 39.3%, 1.0368 42.9%, 1.0383 46.4%, 1.0355 50%, 1.0304 53.6%, 1.0243 57.1%, 1.0183 60.7%, 1.0129 64.3%, 1.0085 67.9%, 1.0049 71.4%, 1.0023 75%, 1.0006 78.6%, 0.9994 82.1%, 0.9988 85.7%, 0.9986 89.3%, 0.9985 92.9%, 0.9987 96.4%, 1)"
  : "cubic-bezier(0.34, 1.4, 0.64, 1)";
export const EASE_IN = "cubic-bezier(0.3, 0, 0.8, 0.15)";

// Android vibrates; iOS 18+ ticks when a switch toggles, so flip a hidden one.
let hapticSwitch = null;
export function haptic(ms = 10) {
  if (navigator.vibrate) return void navigator.vibrate(ms);
  if (platform !== "ios") return;
  if (!hapticSwitch) {
    hapticSwitch = document.createElement("label");
    hapticSwitch.className = "haptic-switch";
    hapticSwitch.setAttribute("aria-hidden", "true");
    hapticSwitch.innerHTML = '<input type="checkbox" switch tabindex="-1">';
    document.body.append(hapticSwitch);
  }
  hapticSwitch.click();
}

// Tracks recent pointer positions so a quick flick can count as a swipe.
export function velocityTracker() {
  let samples = [];
  return {
    reset() {
      samples = [];
    },
    add(x, y = 0) {
      const t = performance.now();
      samples.push({ x, y, t });
      while (samples.length > 2 && t - samples[0].t > 100) samples.shift();
    },
    // px per ms over the last ~100ms
    velocity() {
      if (samples.length < 2) return { x: 0, y: 0 };
      const a = samples[0],
        b = samples[samples.length - 1],
        dt = Math.max(b.t - a.t, 1);
      return { x: (b.x - a.x) / dt, y: (b.y - a.y) / dt };
    },
  };
}

const RIPPLE_HOSTS =
  ".item-row, .tab-trigger, .fab, .btn, .settings-row:not(.static), .category-choice, .pantry-category-tab, .pantry-to-groceries, .history-undo, .toast-undo, .screen-head button";
// Material ripple. The dot is marked to survive re-renders of its button.
export function ripple(event) {
  if (platform !== "android" || reducedMotion() || event.button !== 0) return;
  const host = event.target.closest(RIPPLE_HOSTS);
  if (!host) return;
  const rect = host.getBoundingClientRect(),
    size = Math.hypot(rect.width, rect.height) * 2,
    dot = document.createElement("span");
  dot.className = "ripple";
  dot.dataset.transient = "keep";
  dot.style.cssText = `left:${event.clientX - rect.left - size / 2}px;top:${event.clientY - rect.top - size / 2}px;width:${size}px;height:${size}px`;
  host.append(dot);
  dot.animate([{ transform: "scale(0)" }, { transform: "scale(1)" }], {
    duration: 500,
    easing: "cubic-bezier(0.2, 0, 0, 1)",
    fill: "forwards",
  });
  const release = () => {
    removeEventListener("pointerup", release);
    removeEventListener("pointercancel", release);
    dot
      .animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: 300,
        delay: 80,
        fill: "forwards",
      })
      .finished.then(() => dot.remove(), () => dot.remove());
  };
  addEventListener("pointerup", release);
  addEventListener("pointercancel", release);
}
