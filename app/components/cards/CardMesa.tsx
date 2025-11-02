// componente card mesa
"use client";

import { Mesa } from "../../features/mesas/mesas.slice";
import {User,  Clock, ReceiptText,  DollarSign } from "lucide-react";

type Props = Mesa & {
  onNovaFromMesa?: (mesaId: number) => void;
};

export default function CardMesa({
  id,
  numero,
  status,
  cliente,
  atendente,
  tempoMinSemPedido,
  tempoOcupacao, // para mostrar tempo de ocupacao
  comandasAbertas,
  valorTotal,
  area,

  onNovaFromMesa,
}: Props) {
  const cores: Record<typeof status, string> = {
    disponiveis: "bg-white",
    ocupada: "bg-white border-green-200",
    reservada: "bg-white border-indigo-400",
    inactive: "bg-white border-red-300",
  };

  // icones especificos por modelo
  const getModeloIcon = () => {
    switch (area?.toLowerCase()) {
      case "mesa": return "🪑";
      case "barraca": return "";
      case "apartamento": return "";
      default: return "🪑"; // default para mesa
    }
  };

  // destaque visual mesas ocupadas mais de 15min sem pedido
  const highlight =
    status === "ocupada" && (tempoMinSemPedido ?? 0) >= 15
      ? "ring-4 ring-red-400 bg-red-50 animate-pulse"
      : "";

  // determinar se a mesa tem pedidos ou nao
  const semPedidos = status === "ocupada" && (valorTotal ?? 0) <= 0.01;

  const statusLabel = (() => {
    if (semPedidos) return "Sem pedidos";
    
    switch (status) {
      case "disponiveis":
        return "Disponíveis";
      case "ocupada":
        return "Ocupada";
      case "reservada":
        return "Reservada";
      case "inactive":
        return "Inativa";
      default:
        return String(status);
    }
  })();

  const handleClick = () => {
    if (status === "disponiveis") {
      // mesa disponivel criar nova comanda
      onNovaFromMesa?.(id);
    } else if (status === "ocupada") {
      // mesa ocupada navegar para pagina de pedidos existente
      // assumindo que usamos o ID da mesa para navegar
      window.location.href = `/pedido/${id}`;
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`w-full min-w-[220px] h-[150px] rounded-lg border p-3 shadow-sm transition hover:shadow-md flex flex-col justify-between ${
        status === "disponiveis" || status === "ocupada" ? "cursor-pointer" : "cursor-default"
      } ${cores[status]} ${highlight}`}
    >
      {/* secao superior */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-base font-semibold text-gray-900">
            <span className="text-lg">{getModeloIcon()}</span>
            <span className="truncate">
              {area === "Mesa" ? "Mesa" : area} {numero || id}
            </span>
          </div>
    <span
  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
    semPedidos
      ? "bg-yellow-200 text-yellow-800"
      : status === "ocupada"
      ? "bg-green-200 text-green-800"
      : status === "reservada"
      ? "bg-indigo-200 text-indigo-800"
      : status === "disponiveis"
      ? "bg-white-200 text-emerald-800"
      : status === "inactive"
      ? "bg-red-200 text-red-800"
      : "bg-gray-200 text-gray-800"
  }`}
>


            
            {statusLabel}
          </span>
        </div>

        {cliente && (
          <div className="flex items-center text-sm text-gray-600 gap-2">
            <User size={14} />
            <span className="truncate">{cliente}</span>
          </div>
        )}

        {status === "ocupada" && (
          <div className="flex items-center text-sm text-gray-700 gap-2">
            <User size={14} />
            <span className="truncate"><span className="text-gray-500 mr-1">Atendente:</span>{atendente || ""}</span>
          </div>
        )}

        {area && (
          <div className="flex items-center text-sm text-gray-600 gap-2 pl-2">
            
            <span className="truncate">{area}</span>
          </div>
        )}
      </div>

      {/* secao inferior metricas */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center gap-1">
          <Clock size={14} />
          <span>
            {status === "ocupada" && tempoOcupacao !== undefined 
              ? `${tempoOcupacao}min` 
              : "0min"}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs"><ReceiptText /></span>
          <span>{comandasAbertas ?? 0}</span>
        </div>
        <div className="flex items-center gap-1">
          <DollarSign size={14} />
          <span>R$ {(valorTotal ?? 0).toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
