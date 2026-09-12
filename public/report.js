/* "Something isn't right here" — the correction form on a shared story page.
   A separate file, not an inline script, so script-src can stay 'self'. */

/* The static /s/<id>/ pages are real reading surfaces, not marketing shells.
   Reuse the same two product events as the React reader; no child/profile data,
   no free text, and no new behavioural event vocabulary. */
document.addEventListener('DOMContentLoaded', function () {
  var storyId = document.body.getAttribute('data-story-id');
  var corpus = document.body.getAttribute('data-story-corpus');
  if (!storyId || !corpus) return;

  function send(name) {
    try {
      if (typeof window.gtag !== 'function') return;
      window.gtag('event', name, {
        story_id: storyId,
        corpus: corpus,
        from: 'static_story',
        mode: 'full',
        repeat: false,
        one_more: false
      });
    } catch (_) { /* analytics must never break reading */ }
  }

  send('story_opened');
});

document.addEventListener('submit', async function (e) {
  var form = e.target.closest && e.target.closest('form[data-report]');
  if (!form) return;
  e.preventDefault();
  var box = form.querySelector('textarea');
  var btn = form.querySelector('button');
  var note = (box.value || '').trim();
  if (note.length < 4) { box.focus(); return; }
  btn.disabled = true;
  btn.textContent = 'Sending…';
  try {
    var r = await fetch('/api/correction', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        storyId: form.getAttribute('data-report'),
        version: Number(form.getAttribute('data-version')) || null,
        note: note,
        hp: (form.querySelector('input[name=hp]') || {}).value || ''
      })
    });
    if (!r.ok) throw new Error(String(r.status));
    form.textContent = '';
    var p = document.createElement('p');
    p.className = 'thanks';
    p.textContent = 'Thank you. That goes to the person who wrote the story, and every report is read.';
    form.appendChild(p);
  } catch (err) {
    btn.disabled = false;
    btn.textContent = 'That did not send — try again';
  }
});
