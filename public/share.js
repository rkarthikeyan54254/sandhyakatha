/* Share + follow actions for the story, festival and corpus pages.
 * This lives in an external file on purpose: the site's CSP is
 * script-src 'self' with no 'unsafe-inline', so an inline handler is
 * silently blocked and the button does nothing.
 */
(function () {
  function waShare(text, url) {
    window.open('https://wa.me/?text=' + encodeURIComponent(text + '\n\n' + url),
                '_blank', 'noopener');
  }

  document.addEventListener('click', function (ev) {
    var btn = ev.target.closest && ev.target.closest('button[data-share]');
    if (!btn) return;

    var data;
    try {
      data = JSON.parse(btn.getAttribute('data-share'));
    } catch (e) {
      return;
    }

    /* The native sheet is the right experience on a phone, which is where this
     * button matters. It rejects on desktop, when no share target exists, and
     * when the person backs out — only the last of those should stay silent. */
    if (navigator.share) {
      navigator.share({ text: data.text, url: data.url }).catch(function (err) {
        if (err && err.name === 'AbortError') return;
        waShare(data.text, data.url);
      });
      return;
    }

    waShare(data.text, data.url);
  });
})();
