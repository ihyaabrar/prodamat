import { aikoIcons, aikoPoses, type AikoIcon as AikoIconName, type AikoPose } from "@/lib/aiko-art";

// Pose Aiko dari paket aset 2D. SVG ditanam langsung agar animasinya (sekali jalan) diputar ulang setiap pose berganti.
export function Aiko({ pose = "idle", className = "" }: { pose?: AikoPose; className?: string }) {
  return <span className={`robot aiko-${pose}${className ? ` ${className}` : ""}`} dangerouslySetInnerHTML={{ __html: aikoPoses[pose] }}/>;
}

export function AikoIcon({ name, className = "" }: { name: AikoIconName; className?: string }) {
  return <span className={`aiko-icon${className ? ` ${className}` : ""}`} dangerouslySetInnerHTML={{ __html: aikoIcons[name] }}/>;
}

export function AikoSays({ children, pose = "idle", live = false, figure }: { children: React.ReactNode; pose?: AikoPose; live?: boolean; figure?: React.ReactNode }) {
  return <div className="aiko-says">
    {figure ?? <Aiko pose={pose}/>}
    <p className="aiko-bubble" role={live ? "status" : undefined}><span className="sr-only">Aiko: </span>{children}</p>
  </div>;
}
