/** @type {import('next').NextConfig} */

// Cabeceras de seguridad aplicadas a todas las respuestas.
const securityHeaders = [
  // Evita que el navegador "adivine" el tipo MIME (previene ataques de sniffing).
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Anti-clickjacking: la app no puede ser embebida en un <iframe> externo.
  { key: "X-Frame-Options", value: "DENY" },
  // No filtrar el referrer completo a sitios externos.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Limita APIs sensibles del navegador que la app no usa.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  // Fuerza HTTPS durante 2 años (incluye subdominios). Vercel sirve por HTTPS.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false, // no revelar "X-Powered-By: Next.js"
  images: {
    remotePatterns: [{ protocol: "https", hostname: "lh3.googleusercontent.com" }],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

module.exports = nextConfig;
