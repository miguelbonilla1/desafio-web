"use client";

import { useEffect, useState } from "react";
import TopBar from "./components/layout/TopBar";
import Sidebar from "./components/layout/Sidebar";
import FooterBar from "./components/layout/FooterBar";
import ActionBar from "./components/layout/ActionBar";

import ComandasVista from "./components/dashboard/ComandasVista";
import MesasView from "./components/dashboard/MesasView";
import NovaComandaDrawer from "./components/modals/NovaComandaDrawer";
import { useAppDispatch } from "./store/hooks";
import { fetchComandas } from "./features/comandas/comandas.slice";
import { fetchMesas } from "./features/mesas/mesas.slice";

export default function Home() {
  const [tab, setTab] = useState<"comandas" | "locais">("comandas");
  const [novaOpen, setNovaOpen] = useState(false);
  const [preMesa, setPreMesa] = useState<number | undefined>(undefined);

  const dispatch = useAppDispatch();

  useEffect(() => {
    // carregar comandas e mesas no inicio da aplicacao para popular os filtros
    dispatch(fetchComandas());
    dispatch(fetchMesas());
  }, [dispatch]);

  return (
    <main className="min-h-screen" style={{ backgroundColor: '#F4F2F2' }}>
      <Sidebar />
      <TopBar
        activeTab={tab}
        onChangeTab={setTab}
      />



      <div className="ml-[72px] md:ml-[88px]">
        <div className="max-w-7xl  px-4 sm:px-6 pb-48">
          {tab === "comandas" ? (
            <ComandasVista />
          ) : (
            <MesasView
              onNovaFromMesa={(id) => {
                setPreMesa(id);
                setNovaOpen(true);
              }}
            />
          )}
        </div>
      </div>

      <NovaComandaDrawer
        open={novaOpen}
        onClose={() => {
          setNovaOpen(false);
          setPreMesa(undefined);
        }}
        preMesaId={preMesa}
      />

      <ActionBar 
        activeTab={tab}
        onNovaComanda={() => setNovaOpen(true)}
      />

      <FooterBar />
    </main>
  );
}
