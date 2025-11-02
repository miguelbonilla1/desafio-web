"use client";

import { useEffect } from "react";
import { FixedSizeGrid as Grid } from "react-window";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { fetchMesas, selMesasFiltradas, Mesa } from "../../features/mesas/mesas.slice";
import CardMesa from "../cards/CardMesa";

// tipo para os dados passados ao Cell
interface CellData {
  mesas: Mesa[];
  columnsCount: number;
  onNovaFromMesa?: (mesaId: number) => void;
}

// componente para renderizar cada celula do grid virtualizado
const Cell = ({ columnIndex, rowIndex, style, data }: { 
  columnIndex: number; 
  rowIndex: number; 
  style: React.CSSProperties; 
  data: CellData;
}) => {
  const { mesas, columnsCount, onNovaFromMesa } = data;
  const index = rowIndex * columnsCount + columnIndex;
  
  if (index >= mesas.length) {
    return <div style={style} />; // celula vazia se nao ha mesa
  }

  const mesa = mesas[index];
  
  return (
    <div style={{ ...style, padding: '12px' }}>
      <div>
        <CardMesa {...mesa} onNovaFromMesa={onNovaFromMesa} />
      </div>
    </div>
  );
};

type MesasGridVirtualizedProps = {
  onNovaFromMesa?: (mesaId: number) => void;
};

export default function MesasGridVirtualized({ onNovaFromMesa }: MesasGridVirtualizedProps) {
  const dispatch = useAppDispatch();
  const mesas = useAppSelector(selMesasFiltradas);
  const loading = useAppSelector((s) => s.mesas.loading);

  useEffect(() => {
    dispatch(fetchMesas());
  }, [dispatch]);

  // configuracao fixa para desktop
  const columnsCount = 5; // Equivalente a 2xl:grid-cols-5
  const rowsCount = Math.ceil(mesas.length / columnsCount);
  const cardWidth = 280; // largura mais ampla para as cartas
  const cardHeight = 200; // altura para as cartas
  const containerWidth = columnsCount * cardWidth; // largura total do container
  const containerHeight = rowsCount * cardHeight; // altura total sem scroll

  return (
    <div className="py-2">
      {loading ? (
        <p className="text-sm text-neutral-600">Carregando…</p>
      ) : (
        <>
          <div style={{ height: containerHeight, width: containerWidth }}>
            <Grid
              columnCount={columnsCount}
              columnWidth={cardWidth}
              height={containerHeight}
              rowCount={rowsCount}
              rowHeight={cardHeight}
              width={containerWidth}
              itemData={{
                mesas,
                columnsCount,
                onNovaFromMesa
              }}
            >
              {Cell}
            </Grid>
          </div>
          
          {/* Mostrar contador total */}
          {mesas.length > 0 && (
            <div className="mt-4 text-center text-sm text-gray-600">
              Total: {mesas.length} mesas
            </div>
          )}
        </>
      )}
    </div>
  );
}