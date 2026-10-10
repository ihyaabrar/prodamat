import type { WebGLRenderer, Scene, OrthographicCamera, Group } from 'three';
export type AikoPose = 'Idle' | 'Wave' | 'Think' | 'Read' | 'Celebrate' | 'Reassure';
export interface AikoOptions { pose?: AikoPose; animate?: boolean; fallback?: string; onError?: (error: unknown) => void; onComplete?: () => void; }
export interface AikoViewer { available: true; renderer: WebGLRenderer; scene: Scene; camera: OrthographicCamera; root: Group; setPose(name: AikoPose, play?: boolean): void; play(): void; pause(): void; render(): void; dispose(): void; readonly pose: AikoPose; readonly reducedMotion: boolean; readonly playing: boolean; }
export interface AikoFallback { available: false; dispose(): void; }
export function mountAiko(container: HTMLElement, options?: AikoOptions): AikoViewer | AikoFallback;
