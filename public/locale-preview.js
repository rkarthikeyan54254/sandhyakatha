(function () {
  function q(sel, root) { return (root || document).querySelector(sel); }
  function qa(sel, root) { return Array.from((root || document).querySelectorAll(sel)); }
  document.addEventListener('DOMContentLoaded', function () {
    var body = document.body;
    if (body.hasAttribute('data-locale-preview-root')) {
      var allowed = (body.getAttribute('data-allowed-langs') || '').split(',').filter(Boolean);
      var requestedRoot = (new URLSearchParams(window.location.search).get('lang') || '').toLowerCase();
      var fallbackRoot = (body.getAttribute('data-default-lang') || allowed[0] || 'ta').toLowerCase();
      var chosen = allowed.includes(requestedRoot) ? requestedRoot : fallbackRoot;
      window.location.replace('/preview/' + body.getAttribute('data-story-id') + '/' + chosen + '/');
      return;
    }
    var sections = qa('[data-locale-edition]');
    if (!sections.length) return;
    var params = new URLSearchParams(window.location.search);
    var requested = (params.get('lang') || '').toLowerCase();
    var fallback = (body.getAttribute('data-default-lang') || 'ta').toLowerCase();
    var active = sections.find(function (s) { return s.getAttribute('data-lang') === requested; }) || sections.find(function (s) { return s.getAttribute('data-lang') === fallback; }) || sections[0];
    sections.forEach(function (s) { s.hidden = s !== active; });
    var lang = active.getAttribute('data-lang');
    var locale = active.getAttribute('data-locale');
    document.documentElement.lang = lang || 'en';
    document.title = active.getAttribute('data-page-title') || document.title;
    qa('[data-lang-link]').forEach(function (a) {
      if (a.getAttribute('data-lang-link') === lang) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    try {
      if (typeof window.gtag === 'function') window.gtag('event', 'story_opened', { story_id: body.getAttribute('data-story-id'), corpus: body.getAttribute('data-story-corpus'), from: 'locale_preview', mode: 'short', locale: locale, repeat: false, one_more: false });
    } catch (_) {}
    qa('[data-share-preview]').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        var url = new URL(window.location.href);
        url.searchParams.set('lang', lang); url.searchParams.set('utm_source', 'parent_share'); url.searchParams.set('utm_medium', 'referral'); url.searchParams.set('utm_campaign', 'locale_preview'); url.searchParams.set('utm_content', body.getAttribute('data-story-id') + '-' + lang);
        var text = active.getAttribute('data-share-text') || 'An early Sandhya Katha language edition.';
        try { if (navigator.share) { await navigator.share({ title: active.getAttribute('data-title') + ' · Sandhya Katha', text: text, url: url.toString() }); return; } } catch (err) { if (err && err.name === 'AbortError') return; }
        try { await navigator.clipboard.writeText(url.toString()); var old = btn.textContent; btn.textContent = 'Preview link copied'; setTimeout(function () { btn.textContent = old; }, 1800); } catch (_) {}
      });
    });
  });
  document.addEventListener('submit', async function (e) {
    var form = e.target.closest && e.target.closest('form[data-locale-report]'); if (!form) return; e.preventDefault();
    var box = q('textarea', form), select = q('select[name=category]', form), btn = q('button[type=submit]', form), note = (box.value || '').trim();
    if (note.length < 4) { box.focus(); return; }
    btn.disabled = true; btn.textContent = 'Sending…';
    try {
      var r = await fetch('/api/correction', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ storyId: form.getAttribute('data-story-id'), version: Number(form.getAttribute('data-version')) || null, locale: form.getAttribute('data-locale'), category: select.value, surface: 'locale-preview', note: note, hp: (q('input[name=hp]', form) || {}).value || '' }) });
      if (!r.ok) throw new Error(String(r.status));
      form.textContent = ''; var p = document.createElement('p'); p.className = 'thanks'; p.textContent = 'Thank you. This goes into the language review queue, and every report is read.'; form.appendChild(p);
    } catch (_) { btn.disabled = false; btn.textContent = 'That did not send — try again'; }
  });
})();
