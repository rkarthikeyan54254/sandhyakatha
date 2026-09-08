// Analytics for a children's app: measurement only.
// Google Signals, ad personalisation and remarketing are switched off
// explicitly — DPDP prohibits behavioural advertising to children, and the
// defaults are not on our side. See PRIVACY.md before changing any of this.
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('consent', 'default', {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'granted'
});
gtag('config', 'G-8QPVB5L4QJ', {
  anonymize_ip: true,
  allow_google_signals: false,
  allow_ad_personalization_signals: false
});
