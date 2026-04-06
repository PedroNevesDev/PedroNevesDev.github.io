/**
 * Site-wide keys (edit for production).
 * reCAPTCHA: create v2 “I’m not a robot” keys at https://www.google.com/recaptcha/admin
 * Default below is Google’s public test key (always passes) — replace with your site key for github.io.
 */
window.RECAPTCHA_SITE_KEY =
    typeof window.RECAPTCHA_SITE_KEY === 'string' && window.RECAPTCHA_SITE_KEY.length > 0
        ? window.RECAPTCHA_SITE_KEY
        : '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';
