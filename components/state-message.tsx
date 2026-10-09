import { RotateCcw } from "lucide-react";

export function StateMessage({ title, detail, onRetry }: { title: string; detail?: string; onRetry?: () => void }) {
  return <div className="loading-screen" role={onRetry ? "alert" : "status"}><div><p className="state-title">{title}</p>{detail ? <p>{detail}</p> : null}{onRetry ? <button className="button primary" onClick={onRetry}><RotateCcw size={18}/>Coba lagi</button> : null}</div></div>;
}
