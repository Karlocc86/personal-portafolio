/** Tipos de project-scenes.js (JavaScript puro para compartirlo con la vista previa de diseño). */

export type ProjectScenes = {
  refresh(): void;
  destroy(): void;
};

export function mountProjects(options: { root: HTMLElement }): ProjectScenes;
