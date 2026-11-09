import { notFound } from 'next/navigation';

// Cualquier ruta desconocida dentro de /es o /en muestra el 404 localizado.
export default function CatchAllPage() {
  notFound();
}
