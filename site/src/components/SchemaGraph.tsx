import { palette, fonts } from "../theme";

export default function SchemaGraph() {
  return (
    <svg
      viewBox="0 0 700 200"
      style={{ width: "100%", display: "block" }}
      role="img"
      aria-label="Star schema: identification links to occurrence by strongRef, occurrence links to media by strongRef, and occurrence and identification link to remark by at-uri"
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
      <line x1="350" y1="100" x2="350" y2="140" stroke={palette.moss} strokeWidth="1" strokeDasharray="4 3" markerEnd="url(#schema-arr)" />
      <line x1="120" y1="90" x2="285" y2="160" stroke={palette.moss} strokeWidth="1" strokeDasharray="4 3" markerEnd="url(#schema-arr)" />
      <text x="358" y="124" fontSize="10" fill={palette.moss} fontFamily={fonts.mono}>
        *RemarksID
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
      <g>
        <rect x="285" y="140" width="130" height="50" fill={palette.bg} stroke={palette.ink} strokeWidth="1" />
        <text x="297" y="160" fontSize="12" fontFamily={fonts.mono} fill={palette.ink}>remark</text>
        <text x="297" y="178" fontSize="10" fontFamily={fonts.mono} fill={palette.inkFaint}>prose</text>
      </g>

      <g>
        <line x1="545" y1="156" x2="575" y2="156" stroke={palette.moss} strokeWidth="1" />
        <text x="583" y="159" fontSize="10" fill={palette.moss} fontFamily={fonts.mono}>strongRef</text>
        <line x1="545" y1="176" x2="575" y2="176" stroke={palette.moss} strokeWidth="1" strokeDasharray="4 3" />
        <text x="583" y="179" fontSize="10" fill={palette.moss} fontFamily={fonts.mono}>at-uri</text>
      </g>
    </svg>
  );
}
