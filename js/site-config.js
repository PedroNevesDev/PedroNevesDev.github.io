/**
 * Site-wide keys (edit for production).
 * reCAPTCHA v2: https://www.google.com/recaptcha/admin — add your GitHub Pages hostname
 * (e.g. pedronevesdev.github.io) or the form stays blocked with “Invalid domain for site key”.
 *
 * Default is empty so the contact form works on github.io without setup. FormSubmit still has
 * a honeypot. Set a real site key string below when you want the checkbox.
 */
window.RECAPTCHA_SITE_KEY =
    typeof window.RECAPTCHA_SITE_KEY === 'string' && window.RECAPTCHA_SITE_KEY.length > 0
        ? window.RECAPTCHA_SITE_KEY
        : '';

/**
 * Ambient 3D background.
 *
 * AMBIENT_TEMPLATE — fallback wireframe template (0-5) used when no GLTF is found.
 *   0  icosahedron + torus-knot + octahedron   (default)
 *   1  dodecahedron + torus + tetrahedron
 *   2  faceted sphere + torus-knot + cone
 *   3  box + subdivided octahedron + icosahedron
 *   4  three torus-knot variants
 *   5  tetrahedron + smooth icosahedron + dodecahedron
 *
 * AMBIENT_GLTF — path to your .glb inside the ambient/ folder, e.g. 'ambient/mymodel.glb'
 * Set to null (or omit the file) to use the wireframe template above.
 */
window.AMBIENT_TEMPLATE = 2;
window.AMBIENT_GLTF     = null;