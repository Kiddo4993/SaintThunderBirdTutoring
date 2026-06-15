export default function ThunderbirdLogo({ size = 32, color = "#d4a574", className = "", style = {} }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 240"
      width={size}
      height={Math.round(size * 1.2)}
      className={className}
      style={style}
      aria-hidden="true"
      fill={color}
    >
      {/* Left wing — 9 rays radiating from body center */}
      <polygon points="100,105 94.8,30.2 102.6,30.0"/>
      <polygon points="100,105 81.9,32.2 89.6,30.7"/>
      <polygon points="100,105 69.5,36.5 76.8,33.7"/>
      <polygon points="100,105 58.1,42.8 64.8,38.8"/>
      <polygon points="100,105 47.9,51.1 53.8,46.4"/>
      <polygon points="100,105 39.3,60.9 44.3,54.8"/>
      <polygon points="100,105 32.6,72.1 36.4,65.2"/>
      <polygon points="100,105 27.9,84.3 30.5,76.9"/>
      <polygon points="100,105 25.3,98.5 26.4,90.7"/>
      {/* Right wing — mirror of left */}
      <polygon points="100,105 105.2,30.2 97.4,30.0"/>
      <polygon points="100,105 118.1,32.2 110.4,30.7"/>
      <polygon points="100,105 130.5,36.5 123.2,33.7"/>
      <polygon points="100,105 141.9,42.8 135.2,38.8"/>
      <polygon points="100,105 152.1,51.1 146.2,46.4"/>
      <polygon points="100,105 160.7,60.9 155.7,54.8"/>
      <polygon points="100,105 167.4,72.1 163.6,65.2"/>
      <polygon points="100,105 172.1,84.3 169.5,76.9"/>
      <polygon points="100,105 174.7,98.5 173.6,90.7"/>
      {/* Head block */}
      <polygon points="87,105 113,105 113,120 87,120"/>
      {/* Shoulder flare */}
      <polygon points="87,120 113,120 115,135 85,135"/>
      {/* Chest body with 4 chevron cutouts (evenodd creates the V gaps) */}
      <path
        fillRule="evenodd"
        d="
          M85,135 L115,135 L112,195 L88,195 Z
          M88,150 L100,140 L112,150 L108,150 L100,144 L92,150 Z
          M88,162 L100,152 L112,162 L108,162 L100,156 L92,162 Z
          M88,174 L100,164 L112,174 L108,174 L100,168 L92,174 Z
          M88,186 L100,176 L112,186 L108,186 L100,180 L92,186 Z
        "
      />
      {/* Tail taper */}
      <polygon points="88,195 112,195 108,213 92,213"/>
      {/* Left talons */}
      <rect x="88" y="213" width="3" height="14" rx="1.5"/>
      <rect x="92" y="213" width="3" height="17" rx="1.5"/>
      <rect x="96" y="213" width="3" height="12" rx="1.5"/>
      {/* Right talons */}
      <rect x="101" y="213" width="3" height="12" rx="1.5"/>
      <rect x="105" y="213" width="3" height="17" rx="1.5"/>
      <rect x="109" y="213" width="3" height="14" rx="1.5"/>
    </svg>
  );
}
