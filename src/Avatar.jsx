import { normalizeAvatar } from './avatar.js'

const colors = { oat: '#e9d4aa', sage: '#a8bb91', peach: '#efbfa6', cocoa: '#b58b6a' }
const backgrounds = { cream: '#f0ebdd', leaf: '#e0e8cc', sky: '#dce9ec', rose: '#f1dfdf' }

export default function Avatar({ config, className = '', label = '캐릭터 아바타' }) {
  const avatar = normalizeAvatar(config)
  const fill = colors[avatar.color]
  return <svg className={`character-avatar ${className}`} viewBox="0 0 240 240" role="img" aria-label={label}>
    <rect width="240" height="240" rx="120" fill={backgrounds[avatar.background]} />
    <ellipse cx="120" cy="237" rx="78" ry="52" fill="#526a50" />
    {avatar.character === 'rabbit' ? <g fill={fill} stroke="#594b3c" strokeWidth="3"><ellipse cx="85" cy="64" rx="20" ry="49" transform="rotate(-12 85 64)" /><ellipse cx="155" cy="64" rx="20" ry="49" transform="rotate(12 155 64)" /><g stroke="none" fill="#dba9a0"><ellipse cx="85" cy="62" rx="8" ry="31" /><ellipse cx="155" cy="62" rx="8" ry="31" /></g></g> : avatar.character === 'cat' ? <g fill={fill} stroke="#594b3c" strokeWidth="3" strokeLinejoin="round"><path d="M52 112 51 38 103 82M137 82 189 38 188 112" /></g> : <g fill={fill} stroke="#594b3c" strokeWidth="3"><circle cx="66" cy="78" r="28" /><circle cx="174" cy="78" r="28" /><g fill="#dba9a0" stroke="none"><circle cx="66" cy="78" r="14" /><circle cx="174" cy="78" r="14" /></g></g>}
    <ellipse cx="120" cy="132" rx="79" ry="72" fill={fill} stroke="#594b3c" strokeWidth="3" />
    <ellipse cx="120" cy="158" rx="35" ry="28" fill="#fff8e9" opacity=".7" />
    <g stroke="#443d32" strokeWidth="5" strokeLinecap="round" fill="none">
      {avatar.expression === 'happy' ? <><path d="m83 128 9-7 9 7M139 128l9-7 9 7" /></> : <><path d="M91 121v9" />{avatar.expression === 'wink' ? <path d="m140 126 9-4 8 4" /> : <path d="M149 121v9" />}</>}
      <path d="M109 158q11 14 22 0" strokeWidth="3" />
    </g>
    <path d="M114 144q6-5 12 0l-6 7z" fill="#443d32" />
    <g fill="#d68f83" opacity=".65"><ellipse cx="73" cy="146" rx="12" ry="7" /><ellipse cx="167" cy="146" rx="12" ry="7" /></g>
    {avatar.accessory === 'glasses' && <g fill="none" stroke="#394d3c" strokeWidth="4"><circle cx="91" cy="126" r="22" /><circle cx="149" cy="126" r="22" /><path d="M113 126h14M69 123l-16-4M171 123l16-4" /></g>}
    {avatar.accessory === 'flower' && <g fill="#f2dda0" stroke="#a78854" strokeWidth="1"><circle cx="173" cy="75" r="11" /><circle cx="188" cy="85" r="11" /><circle cx="183" cy="102" r="11" /><circle cx="166" cy="102" r="11" /><circle cx="159" cy="85" r="11" /><circle cx="174" cy="89" r="10" fill="#bc8b52" /></g>}
  </svg>
}
