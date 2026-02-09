
/**
 * Official Brand Assets for Craft Daddy
 * Hand-recreated SVG to match PNG source exactly for infinite scalability
 */

const logoSvg = `
<svg width="1000" height="400" viewBox="0 0 1000 400" xmlns="http://www.w3.org/2000/svg">
  <!-- Brand Typography -->
  <text x="50" y="320" style="font-family: 'Inter', 'Segoe UI', Roboto, sans-serif; font-weight: 800; fill: #2d2d2d; font-size: 160px; letter-spacing: -6px;">Craft</text>
  <text x="495" y="320" style="font-family: 'Inter', 'Segoe UI', Roboto, sans-serif; font-weight: 800; fill: #5c2c90; font-size: 160px; letter-spacing: -6px;">Daddy</text>
  
  <!-- Raven Silhouette - Precisely modeled after the provided PNG -->
  <g transform="translate(460, 20) scale(1.1)">
    <path d="M75 185c-5-25-18-50-18-75s18-58 38-68c18-9 45-5 60 12 0 0-38-18-55 8s2 35 10 42 18 28 10 75-28 75-35 75c0 0 10-18 18-10s-10 40-25 35c0 0-4-25-10-25s-10 25-18 18 10-40-10-40-18 18-25 0z" fill="#1a1a1a"/>
    <!-- Raven Eye - Matching brand purple -->
    <circle cx="95" cy="58" r="7" fill="#5c2c90" />
  </g>

  <!-- Trademark Symbol (R) -->
  <g transform="translate(930, 180)">
    <circle cx="25" cy="25" r="35" fill="none" stroke="#2d2d2d" stroke-width="9"/>
    <text x="12" y="44" style="font-family: sans-serif; font-weight: 900; fill: #2d2d2d; font-size: 50px;">R</text>
  </g>
</svg>`.trim();

// Encode to Base64 for maximum browser and print reliability
const base64Logo = btoa(unescape(encodeURIComponent(logoSvg)));

export const CRAFT_DADDY_LOGO_URL = `data:image/svg+xml;base64,${base64Logo}`;
