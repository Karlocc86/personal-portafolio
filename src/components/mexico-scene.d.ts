/** Tipos de mexico-scene.js (la escena es JavaScript puro para compartirla con la vista previa de diseño). */

/** Tramo [inicio, fin] sobre el progreso de scroll de la sección (0–1). */
export type Span = [number, number];

export type Highlight = {
  /** Id ISO 3166-2 (MX-BCS) o nombre del estado. */
  id: string;
  tone: 'ink' | 'accent';
  /** Progreso en el que el estado se alza. */
  at: number;
  /** Etiqueta HTML que sigue al estado. */
  el?: HTMLElement | null;
  /** Clave de `places` en mexico-states.json para anclar la etiqueta. */
  place?: string;
};

export type MapScene = {
  setHeight(key: string, value: number): void;
  setHighlights(highlights: Highlight[]): void;
  refresh(): void;
  renderNow(): void;
  destroy(): void;
};

/** Guion compartido por la escena y la página. */
export const CHAPTERS: {
  captions: Span[];
  segments: Span[];
  raise: { origin: number; school: number };
  scrim: Span;
};

export function mountMexico(options: {
  canvas: HTMLCanvasElement;
  /** Sección alta que marca el scroll. */
  section: HTMLElement;
  /** Contenido de /geo/mexico-states.json. */
  data: unknown;
  isDark: () => boolean;
  captions?: { el: HTMLElement | null; at: Span }[];
  segments?: { el: HTMLElement | null; at: Span }[];
  rail?: HTMLElement | null;
  tooltip?: HTMLElement | null;
  highlights?: Highlight[];
  journey?: { home: string; from?: string; dest: string } | null;
  reducedMotion?: boolean;
}): MapScene | null;
