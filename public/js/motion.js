// GSAP is self-hosted and optional: all controls work if it fails to load.
const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
let disabled = false;
try { disabled = localStorage.getItem('n10-motion') === 'off'; } catch {}
const active = () => window.gsap && !disabled && !preference.matches;
export function reveal(target) {
  if (active()) window.gsap.fromTo(target, {opacity: 0, y: 12}, {opacity: 1, y: 0, duration: .45, stagger: .055, ease: 'power2.out', clearProps: 'opacity,transform', overwrite: true});
}
export function drawLine(line) {
  if (!active() || !line) return;
  const length = line.getTotalLength();
  window.gsap.fromTo(line, {strokeDasharray: length, strokeDashoffset: length}, {strokeDashoffset: 0, duration: .85, ease: 'power2.out', clearProps: 'strokeDasharray,strokeDashoffset'});
}
export function feedback(target) {
  if (active()) window.gsap.fromTo(target, {scale: .85}, {scale: 1, duration: .3, ease: 'back.out(2)', clearProps: 'transform'});
}
export function initMotion() {
  const button = document.getElementById('motion-toggle');
  const update = () => {
    button.setAttribute('aria-pressed', String(disabled));
    button.textContent = preference.matches ? 'Movimento reduzido' : disabled ? 'Animações desativadas' : 'Animações ativadas';
    if (!active() && window.gsap) {
      window.gsap.globalTimeline.getChildren().forEach(tween => { tween.progress(1); tween.kill(); });
    }
  };
  button.addEventListener('click', () => { disabled = !disabled; try { localStorage.setItem('n10-motion', disabled ? 'off' : 'on'); } catch {} update(); });
  preference.addEventListener('change', update);
  update();
  reveal('.hero-copy, .hero-art, .summary-card, .dashboard > .card');
}
