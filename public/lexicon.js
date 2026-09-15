/* The pronunciation card on a shared story page.
 *
 * This lived as an inline <script> in the prerendered page, where the site's
 * own CSP (script-src 'self', no unsafe-inline) silently refused to run it:
 * the buttons rendered, the CSS was there, and tapping a name did nothing.
 * Same trap report.js and gtag-init.js already exist to avoid. It is a file
 * now, so it runs.
 */
(() => {
  const pop = document.getElementById('lexpop');
  if (!pop) return;
  const say = pop.querySelector('b'), gloss = pop.querySelector('span'), native = pop.querySelector('i');

  document.addEventListener('click', e => {
    const el = e.target.closest?.('.name[data-term]');
    if (!el) return;
    say.textContent    = el.dataset.say || el.textContent || '';
    gloss.textContent  = el.dataset.gloss || '';
    native.textContent = el.dataset.native || '';
    pop.hidden = false;
  });

  pop.addEventListener('click', () => { pop.hidden = true; });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') pop.hidden = true; });
})();
