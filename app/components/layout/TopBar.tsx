"use client";
import React, { useState, useCallback, useRef, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";

import {
  selFiltros,
  selAreasDisponiveis,
  selQueryMesas,
  setArea,
  setEstadoMesa,
  setQuery as setMesasQuery,
} from "../../features/mesas/mesas.slice";
import { 
  selQueryComandas,
  setQuery as setComandasQuery 
} from "../../features/comandas/comandas.slice";

export type Tab = "comandas" | "locais";

type Props = {
  activeTab: Tab;
  onChangeTab: (t: Tab) => void;
};

// Componente Dropdown Reutilizavel
function Dropdown({ 
  value, 
  options, 
  onChange, 
  placeholder,
  className = "" 
}: {
  value: string;
  options: { value: string; label: string; dotClass?: string }[];
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`text-left bg-transparent hover:bg-neutral-100 flex items-center justify-center cursor-pointer ${
          placeholder === "" 
            ? "p-1 rounded" 
            : "px-3 py-1.5 bg-white border border-neutral-300 rounded-lg min-w-28"
        }`}
      >
        {placeholder !== "" && (
          <span className={value === "todos" ? "text-neutral-500" : "text-neutral-900"}>
            {options.find(opt => opt.value === value)?.label || placeholder}
          </span>
        )}
        <svg className={`w-4 h-4 text-neutral-600 ${placeholder !== "" ? "ml-2" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-neutral-200 rounded-lg shadow-lg z-50 max-h-60 overflow-auto">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-neutral-50 flex items-center justify-between cursor-pointer ${
                  value === option.value ? "bg-neutral-900 text-white" : ""
                }`}
              >
                <span>{option.label}</span>
                {option.dotClass && (
                  <span
                    aria-hidden
                    className={`inline-block w-2.5 h-2.5 rounded-full ${
                      // quando selecionado manter o ponto visivel
                      value === option.value && option.dotClass.includes("bg-white")
                        ? "ring-1 ring-neutral-300"
                        : ""
                    } ${option.dotClass}`}
                  />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function TopBar({ activeTab, onChangeTab }: Props) {
  const dispatch = useAppDispatch();
  const filtros = useAppSelector(selFiltros);
  const areasDisponiveis = useAppSelector(selAreasDisponiveis);
  const queryComandas = useAppSelector(selQueryComandas);
  const queryMesas = useAppSelector(selQueryMesas);
  
  // estado local para o campo de busca
  const [searchValue, setSearchValue] = useState("");
  
  // obter o valor atual conforme a aba ativa
  const currentQuery = activeTab === "comandas" ? queryComandas : queryMesas;
  
  // atualizar o estado local quando mudar a aba ou query
  React.useEffect(() => {
    setSearchValue(currentQuery);
  }, [currentQuery, activeTab]);
  
  // debouncing para otimizar busca
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  
  const debouncedSearch = useCallback((value: string, tab: "comandas" | "locais") => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    debounceTimer.current = setTimeout(() => {
      if (tab === "comandas") {
        dispatch(setComandasQuery(value));
      } else {
        dispatch(setMesasQuery(value));
      }
    }, 500); // 500ms debounce delay
  }, [dispatch]);

  // funcao para gerenciar mudancas na busca
  const handleSearch = (value: string) => {
    setSearchValue(value); // atualizacao imediata de UI
    debouncedSearch(value, activeTab); // dispatch com debounce
  };

  // cleanup do timer quando componente desmonta
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  // opcoes para dropdown Visao Geral areas
  const visaoGeralOptions = [
    { value: "todos", label: "Visão Geral" },
    ...areasDisponiveis.map((area) => ({ value: area, label: area })),
  ];

  // opcoes para dropdown de Estados  
  const estadoOptions = [
    { value: "todos", label: "Todos os atendimentos" },
    // em atendimento equivale a ocupadas
    { value: "em-atendimento", label: "Ocupadas", dotClass: "bg-green-500" },
    // ociosas mesas ocupadas e sem novo pedido ha muito tempo
    { value: "ociosas", label: "Ociosas", dotClass: "bg-red-500" },
    // sem pedidos ocupadas mas sem comandas pedidos ativos
    { value: "sem-pedidos", label: "Sem pedidos", dotClass: "bg-yellow-400" },
    // disponiveis livres
    { value: "disponiveis", label: "Disponíveis", dotClass: "bg-white border border-neutral-400" },
  ];

  return (
    <header className="flex border-b border-neutral-200 sticky top-0 z-40 ml-[72px] md:ml-[88px] backdrop-blur" style={{ backgroundColor: '#F4F2F2' }}>
      <div className="w-full max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between gap-6">
  {/* Grupo izquierdo: Título + (Estados en Locais) */}
  <div className="flex items-center gap-4">
          {/* Visão Geral */}
          <div className="flex items-center">
            <h1 className="text-2xl font-bold">Visão Geral</h1>
            {/* Flechita (dropdown de área) */}
            <Dropdown
              value={filtros.area}
              options={visaoGeralOptions}
              onChange={(value) => dispatch(setArea(value))}
              placeholder=""
              className="ml-1 cursor-pointer"
            />
          </div>

          {/* Dropdown Estados al lado de Visão Geral (solo en Locais) */}
          {activeTab === "locais" && (
            <Dropdown
              value={filtros.estadoMesa}
              options={estadoOptions}
              onChange={(value) => dispatch(setEstadoMesa(value as "todos" | "em-atendimento" | "ociosas" | "sem-pedidos" | "disponiveis"))}
              placeholder="Todos os atendimentos"
              className="hover:shadow-sm transition cursor-pointer"
            />
          )}
        </div>

        {/* Grupo derecho: Tabs + Search + Help */}
        <div className="flex items-center gap-3">
          {/* Tabs al lado derecho */}
          <div className="flex mr-2">
            <button
              onClick={() => onChangeTab("comandas")}
              className={`px-7 py-2 rounded-2xl border relative z-10 cursor-pointer ${
                activeTab === "comandas"
                  ? "bg-neutral-900 text-white border-neutral-900"
                  : "bg-white border-neutral-200"
              }`}
            >
              Comandas
            </button>
            <button
              onClick={() => onChangeTab("locais")}
              className={`px-7 py-2 rounded-2xl border relative z-0 -ml-3 cursor-pointer ${
                activeTab === "locais"
                  ? "bg-neutral-900 text-white border-neutral-900"
                  : "bg-white border-neutral-200"
              }`}
            >
              Locais
            </button>
          </div>
          {/* Input de búsqueda ancho (desktop-first) */}
          <div className="relative w-[360px]">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0z" />
            </svg>
            <input
              placeholder={activeTab === "comandas" ? "Cliente, telefone, ID..." : "Cliente, mesa, atendente..."}
              className="w-full pl-10 pr-3 py-2 rounded-2xl border border-neutral-300 bg-white outline-none text-sm"
              value={searchValue}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>

          {/* Signo de interrogación (a la derecha) */}
          <div className="flex items-center">
            <button className="w-8 h-8 rounded-full border border-neutral-300 flex items-center justify-center text-neutral-600 hover:bg-neutral-50 cursor-pointer">
              ?
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
