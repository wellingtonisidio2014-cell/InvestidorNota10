import {feedback, reveal} from './motion.js';
let toastTimer;
export function toast(message, undo) {
  const container = document.getElementById('toast');
  container.replaceChildren();
  const label = document.createElement('span'); label.textContent = message; container.append(label);
  if (undo) {
    const button = document.createElement('button'); button.textContent = 'Desfazer';
    button.addEventListener('click', () => { undo(); container.hidden = true; }); container.append(button);
  }
  container.hidden = false; reveal(container);
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { container.hidden = true; }, 7000);
}
export function initInteractions() {
  const search = document.getElementById('search');
  const help = document.getElementById('help-dialog');
  document.getElementById('help-open').addEventListener('click', () => help.showModal());
  document.getElementById('help-close').addEventListener('click', () => help.close());
  document.getElementById('density').addEventListener('click', event => {
    const compact = document.body.classList.toggle('compact');
    event.currentTarget.setAttribute('aria-pressed', String(compact));
    event.currentTarget.textContent = compact ? 'Linhas confortáveis' : 'Linhas compactas';
  });
  document.addEventListener('keydown', event => {
    if (event.target.closest('input, textarea, select, [contenteditable="true"]') || document.querySelector('dialog[open]') || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key === '/') { event.preventDefault(); search.focus(); }
    if (event.key === '?') help.showModal();
  });
  const links = [...document.querySelectorAll('nav a[href^="#"]')];
  let scheduled = false;
  function updateNavigation() {
    scheduled = false;
    let current = links[0], closest = -Infinity;
    for (const link of links) {
      const section = document.querySelector(link.hash);
      const top = section?.getBoundingClientRect().top;
      if (top !== undefined && top <= 180 && top > closest) { current = link; closest = top; }
    }
    for (const link of links) {
      link.classList.toggle('active', link === current);
      if (link === current) link.setAttribute('aria-current','location'); else link.removeAttribute('aria-current');
    }
  }
  window.addEventListener('scroll', () => { if (!scheduled) { scheduled=true; requestAnimationFrame(updateNavigation); } }, {passive:true});
  updateNavigation();
  document.addEventListener('click', event => { const button = event.target.closest('.star'); if (button) feedback(button); });
}
