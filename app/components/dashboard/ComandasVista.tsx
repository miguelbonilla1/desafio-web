// app/components/dashboard/ComandasVista.tsx
"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchComandas,
  selOrdersheetsFiltrados,
  selLoadingComandas,
} from "../../features/comandas/comandas.slice";
import CardOrdersheet from "../cards/CardOrdersheet";

export default function ComandasVista() {
  const dispatch = useAppDispatch();
  const ordersheets = useAppSelector(selOrdersheetsFiltrados);
  const loading = useAppSelector(selLoadingComandas);

  useEffect(() => {
    dispatch(fetchComandas());
  }, [dispatch]);

  return (
    <div className="py-2 ">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {loading ? (
          <p className="text-sm text-neutral-600">Carregando…</p>
        ) : (
          ordersheets.map((ordersheet) => (
            <CardOrdersheet
              key={ordersheet.id}
              {...ordersheet}
            />
          ))
        )}
      </div>
    </div>
  );
}
