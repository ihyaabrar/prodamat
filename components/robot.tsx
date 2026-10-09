import { useId } from "react";

export function Robot({ small = false, wave = false }: { small?: boolean; wave?: boolean }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  return <svg className={`robot${small ? " robot-small" : ""}${wave ? " robot-wave" : ""}`} viewBox="0 0 400 420" fill="none" aria-hidden="true">
    <defs>
      <linearGradient id={`${id}-body`} x1="139" y1="223" x2="276" y2="363" gradientUnits="userSpaceOnUse"><stop stopColor="#f5fcff"/><stop offset="1" stopColor="#c4e0ef"/></linearGradient>
      <linearGradient id={`${id}-head`} x1="118" y1="89" x2="276" y2="222" gradientUnits="userSpaceOnUse"><stop stopColor="#fff"/><stop offset="1" stopColor="#d1e7f5"/></linearGradient>
      <filter id={`${id}-shadow`} x="-30%" y="-30%" width="160%" height="180%"><feDropShadow dx="0" dy="8" stdDeviation="7" floodColor="#194e6c" floodOpacity=".13"/></filter>
    </defs>
    <ellipse cx="207" cy="393" rx="94" ry="14" fill="#1f2d44" opacity=".1"/>
    <g filter={`url(#${id}-shadow)`}>
      <path d="M161 335l-8 40c-3 16 4 21 19 21h16v-52M233 341l2 40c1 12 7 15 23 15h17c8 0 12-9 8-17l-17-39" fill="#a8c6dd" stroke="#6594b5" strokeWidth="3"/>
      <path d="M140 254c-26 4-46 20-61 32" stroke="#97bed7" strokeWidth="26" strokeLinecap="round"/>
      <path d="M73 281l-18-2m22 14l-15 8m24-1l-6 17" stroke="#7da9c9" strokeWidth="10" strokeLinecap="round"/>
      <g className="robot-arm">
        <path d="M270 254c28-6 43-29 55-51" stroke="#97bed7" strokeWidth="25" strokeLinecap="round"/>
        <path d="M316 192l5-18m12 20l11-18m-5 28l19-9" stroke="#7da9c9" strokeWidth="10" strokeLinecap="round"/>
      </g>
      <rect x="137" y="225" width="140" height="123" rx="47" fill={`url(#${id}-body)`} stroke="#a4c8df" strokeWidth="3"/>
      <path d="M186 218v18h42v-18" fill="#729dbb"/>
      <rect x="165" y="261" width="84" height="57" rx="21" fill="#f6fcff" stroke="#bedae9" strokeWidth="2"/>
      <path d="M207 275l3.7 9.1 9.8.7-7.5 6.4 2.3 9.5-8.3-5.2-8.3 5.2 2.3-9.5-7.5-6.4 9.8-.7z" fill="#3158df"/>
      <circle cx="94" cy="154" r="15" fill="#7aa7c6"/><circle cx="311" cy="154" r="15" fill="#7aa7c6"/>
      <path d="M200 87V59" stroke="#769db7" strokeWidth="9" strokeLinecap="round"/><circle cx="200" cy="49" r="13" fill="#ffc94d" stroke="#fff" strokeWidth="4"/>
      <rect x="102" y="87" width="203" height="140" rx="54" fill={`url(#${id}-head)`} stroke="#accddd" strokeWidth="3"/>
      <rect x="122" y="109" width="163" height="91" rx="33" fill="#193951"/>
      <path d="M150 148q10-17 20 0m66 0q10-17 20 0" stroke="#c3f5ef" strokeWidth="7" strokeLinecap="round"/>
      <path d="M184 167q20 21 40 0" stroke="#c3f5ef" strokeWidth="6" strokeLinecap="round"/>
      <ellipse cx="143" cy="170" rx="9" ry="5" fill="#ffb9ad" opacity=".85"/><ellipse cx="266" cy="170" rx="9" ry="5" fill="#ffb9ad" opacity=".85"/>
      <path d="M129 103q20-12 43-10" stroke="white" strokeWidth="6" strokeLinecap="round"/>
    </g>
  </svg>;
}

export function AikoSays({ children, wave = false, live = false }: { children: React.ReactNode; wave?: boolean; live?: boolean }) {
  return <div className="aiko-says">
    <Robot small wave={wave}/>
    <p className="aiko-bubble" role={live ? "status" : undefined}><span className="sr-only">Aiko: </span>{children}</p>
  </div>;
}
