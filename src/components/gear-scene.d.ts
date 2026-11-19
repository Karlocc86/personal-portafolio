/** Tipos de gear-scene.js (la escena es JavaScript puro para compartirla con la vista previa de diseño). */

export type GearScene = {
  /** Vuelve a medir el lienzo y redibuja (cambio de tema o de tamaño). */
  refresh(): void;
  /** Dibuja ya el cuadro del progreso actual. */
  renderNow(time?: number): void;
  destroy(): void;
};

export function mountGear(options: {
  canvas: HTMLCanvasElement;
  /** El hero. */
  section: HTMLElement;
  /** La sección que sigue al hero: activa la transición de portal. */
  portal?: HTMLElement | null;
  isDark: () => boolean;
  reducedMotion?: boolean;
}): GearScene | null;
