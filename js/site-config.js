/**
 * Site-wide keys (edit for production).
 * reCAPTCHA: create v2 “I’m not a robot” keys at https://www.google.com/recaptcha/admin
 * Default below is Google’s public test key (always passes) — replace with your site key for github.io.
 */
window.RECAPTCHA_SITE_KEY =
    typeof window.RECAPTCHA_SITE_KEY === 'string' && window.RECAPTCHA_SITE_KEY.length > 0
        ? window.RECAPTCHA_SITE_KEY
        : '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';

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