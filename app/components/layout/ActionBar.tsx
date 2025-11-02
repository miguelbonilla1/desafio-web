"use client";
import { useState } from "react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  selFiltros,
  selMesas,
  selAtendentesDisponiveis,
  setAtendente,
  setStatus,
  StatusMesa,
} from "../../features/mesas/mesas.slice";
import {
  selFiltrosComandas,
  selOrdersheets,
  setStatusComandas,
} from "../../features/comandas/comandas.slice";

type Status = "todos" | StatusMesa;

// Componente Dropdown de Acoes sempre mostra Acoes como rotulo
function ActionDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  
  const handleAction = (action: string) => {
    setIsOpen(false);
    
    switch (action) {
      case "juntar-transferir":
        console.log("Executando: Juntar/Transferir");
        // implementar logica para juntar e transferir mesas
        break;
      case "historico":
        console.log("Executando: Histórico");
        // implementar logica para visualizar historico
        break;
      case "servicos":
        console.log("Executando: Serviços");
        // implementar logica para gerenciar servicos
        break;
    }
  };
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-2 text-left bg-white border border-neutral-300 rounded-lg text-sm hover:bg-neutral-50 flex items-center justify-between min-w-20 cursor-pointer"
      >
        <span className="text-neutral-900">Ações</span>
        <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute bottom-full left-0 w-48 bg-white border border-neutral-200 rounded-lg shadow-lg z-50 max-h-70 pb-5 overflow-auto">
            <button
              onClick={() => handleAction("juntar-transferir")}
              className="w-full px-3 py-2 text-left text-sm hover:bg-neutral-50 whitespace-nowrap cursor-pointer"
            >
              Juntar/Transferir
            </button>
            <button
              onClick={() => handleAction("historico")}
              className="w-full px-3 py-2 text-left text-sm hover:bg-neutral-50 whitespace-nowrap cursor-pointer"
            >
              Histórico
            </button>
            <button
              onClick={() => handleAction("servicos")}
              className="w-full px-3 py-2 text-left text-sm bg-neutral-900 text-white whitespace-nowrap cursor-pointer"
            >
              Serviços
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// Componente Dropdown
function Dropdown({ 
  value, 
  options, 
  onChange, 
  placeholder,
  className = "",
  showColors = false
}: {
  value: string;
  options: { value: string; label: string; color?: string | null }[];
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
  showColors?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-2 text-left bg-white border border-neutral-300 rounded-lg text-sm hover:bg-neutral-50 flex items-center justify-between min-w-32 cursor-pointer"
      >
        <div className="flex items-center gap-2">
          {showColors && options.find(opt => opt.value === value)?.color && (
            <span className={`inline-block w-2 h-2 rounded-full ${options.find(opt => opt.value === value)?.color}`} />
          )}
          <span className={value === "todos" ? "text-neutral-500" : "text-neutral-900"}>
            {options.find(opt => opt.value === value)?.label || placeholder}
          </span>
        </div>
        <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute bottom-full left-0 mb-1 w-full bg-white border border-neutral-200 rounded-lg shadow-lg z-50 max-h-60 overflow-auto">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-neutral-50 flex items-center gap-2 cursor-pointer ${
                  value === option.value ? "bg-neutral-900 text-white" : ""
                }`}
              >
                {showColors && option.color && (
                  <span className={`inline-block w-2 h-2 rounded-full ${option.color}`} />
                )}
                {showColors && !option.color && (
                  <span className="inline-block w-2 h-2" />
                )}
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

interface ActionBarProps {
  activeTab: "comandas" | "locais";
  onNovaComanda: () => void;
}

export default function ActionBar({ activeTab, onNovaComanda }: ActionBarProps) {
  const dispatch = useAppDispatch();
  
  // seletores para mesas aba Locais
  const filtros = useAppSelector(selFiltros);
  const mesas = useAppSelector(selMesas);
  const atendentes = useAppSelector(selAtendentesDisponiveis);
  
  // seletores para comandas aba Comandas
  const filtrosComandas = useAppSelector(selFiltrosComandas);
  const ordersheets = useAppSelector(selOrdersheets);

  // handlers para mesas Locais
  const handleAtendenteChange = (value: string) => {
    dispatch(setAtendente(value));
  };

  const handleStatusChange = (value: string) => {
    dispatch(setStatus(value as Status));
  };

  // handlers para comandas Comandas
  const handleStatusComandaChange = (value: string) => {
    dispatch(setStatusComandas(value as "todos"));
  };

  // opcoes dinamicas segundo a pestana ativa
  const atendenteOptions = [
    { value: "todos", label: "Atendentes" },
    ...atendentes.map(atendente => ({ value: atendente, label: atendente }))
  ];

  const statusOptions = activeTab === "comandas" ? [
    { value: "todos", label: `Tudo ${ordersheets.length}` },
  ] : [
    { value: "todos", label: `Tudo ${mesas.length}` },
    { value: "disponiveis", label: "Disponíveis" },
    { value: "ocupada", label: "Ocupadas" },
    { value: "reservada", label: "Reservadas" },
  ];

  return (
    <div className="fixed bottom-12 left-[72px] md:left-[88px] right-0 z-40 border-t border-neutral-200 px-4 py-3" style={{ backgroundColor: '#F4F2F2' }}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Lado esquerdo - Dropdowns */}
        <div className="flex items-center gap-3">
          <Dropdown
            value={activeTab === "comandas" ? filtrosComandas.status : filtros.status}
            options={statusOptions}
            onChange={activeTab === "comandas" ? handleStatusComandaChange : handleStatusChange}
            placeholder="Tudo"
          />
          
          <Dropdown
            value={filtros.atendente}
            options={atendenteOptions}
            onChange={handleAtendenteChange}
            placeholder="Atendentes"
          />
        </div>

        {/* Lado direito - Dropdown de acoes e botao Nova comanda */}
        <div className="flex items-center gap-3">
          <ActionDropdown />
          
          <button
            onClick={onNovaComanda}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors cursor-pointer"
          >
            Nova comanda
          </button>
        </div>
      </div>
    </div>
  );
}