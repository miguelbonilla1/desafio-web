"use client";
import { Suspense } from "react";
import dynamic from "next/dynamic";

// importar o componente virtualizado de forma dinamica para evitar problemas de SSR
const MesasGridVirtualized = dynamic(
  () => import("./MesasGridVirtualized"),
  { ssr: false }
);

type MesasViewProps = {
  onNovaFromMesa?: (mesaId: number) => void;
};

export default function MesasView({ onNovaFromMesa }: MesasViewProps) {
  // Mesas are now loaded in the main page component
  return (
    <Suspense fallback={<div>Carregando mesas...</div>}>
      <MesasGridVirtualized onNovaFromMesa={onNovaFromMesa} />
    </Suspense>
  );
}
