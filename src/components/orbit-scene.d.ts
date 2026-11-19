/** Tipos de orbit-scene.js (JavaScript puro para compartirlo con la vista previa de diseño). */

export type OrbitScene = {
  /** Vuelve a medir y redibuja (cambio de tamaño o de tema). */
  refresh(): void;
  destroy(): void;
};

export function mountOrbit(options: { root: HTMLElement; isDark: () => boolean; reducedMotion?: boolean }): OrbitScene | null;
