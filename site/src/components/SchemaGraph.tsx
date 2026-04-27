import { palette, fonts } from "../theme";

export default function SchemaGraph() {
  return (
    <svg
      viewBox="0 0 700 130"
      style={{ width: "100%", display: "block" }}
      role="img"
      aria-label="Star schema: identification and media link to occurrence"
    >
      <defs>
        <marker
          id="schema-arr"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
        >
          <path d="M0,0 L10,5 L0,10 z" fill={palette.moss} />
        </marker>
      </defs>

      <line x1="155" y1="65" x2="285" y2="65" stroke={palette.moss} strokeWidth="1" markerEnd="url(#schema-arr)" />
      <line x1="415" y1="65" x2="545" y2="65" stroke={palette.moss} strokeWidth="1" markerEnd="url(#schema-arr)" />
      <text x="220" y="58" fontSize="10" fill={palette.moss} fontFamily={fonts.mono} textAnchor="middle">
        occurrence
      </text>
      <text x="480" y="58" fontSize="10" fill={palette.moss} fontFamily={fonts.mono} textAnchor="middle">
        media[]
      </text>

      <g>
        <rect x="20" y="40" width="135" height="50" fill={palette.bg} stroke={palette.ink} strokeWidth="1" />
        <text x="32" y="60" fontSize="12" fontFamily={fonts.mono} fill={palette.ink}>identification</text>
        <text x="32" y="78" fontSize="10" fontFamily={fonts.mono} fill={palette.inkFaint}>claim</text>
      </g>
      <g>
        <rect x="285" y="30" width="130" height="70" fill={palette.forest} stroke={palette.forest} />
        <text x="297" y="52" fontSize="13" fontFamily={fonts.mono} fill={palette.bg}>occurrence</text>
        <text x="297" y="70" fontSize="10" fontFamily={fonts.mono} fill="rgba(251,250,246,0.7)">·eventDate</text>
        <text x="297" y="86" fontSize="10" fontFamily={fonts.mono} fill="rgba(251,250,246,0.55)">·lat ·lng ·media[]</text>
      </g>
      <g>
        <rect x="545" y="40" width="135" height="50" fill={palette.bg} stroke={palette.ink} strokeWidth="1" />
        <text x="557" y="60" fontSize="12" fontFamily={fonts.mono} fill={palette.ink}>media</text>
        <text x="557" y="78" fontSize="10" fontFamily={fonts.mono} fill={palette.inkFaint}>evidence</text>
      </g>
    </svg>
  );
}
