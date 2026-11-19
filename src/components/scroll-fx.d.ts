/** Tipos de scroll-fx.js (JavaScript puro para compartirlo con la vista previa de diseño). */

export type ScrollFx = {
  /** Vuelve a medir (cambio de tamaño, de tema o de contenido). */
  refresh(): void;
  destroy(): void;
};

export function mountScrollFx(options: {
  root: HTMLElement;
  hero?: HTMLElement | null;
  heroContent?: HTMLElement | null;
  reducedMotion?: boolean;
}): ScrollFx;
