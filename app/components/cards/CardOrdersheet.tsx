// componente card ordersheet
"use client";

import { Clock, CreditCard, DollarSign, MapPin, Users, Phone } from "lucide-react";

export type OrdersheetData = {
  id: number;
  author?: {
    id: number;
    name?: string;
    type?: string;
  } | null;
  opened?: string;
  contact?: string;
  checkpad?: {
    id: number;
    hash?: string;
    model?: string;
    identifier?: string;
  } | null;
  hasOrder: number;
  idleTime: number;
  subtotal: number;
  identifier?: string | null;
  customerName?: string;
  mainIdentifier?: string;
  numberOfCustomers?: number;
};

type Props = OrdersheetData & {
  onOrdersheetClick?: (id: number) => void;
};

export default function CardOrdersheet({
  id,
  author,
  checkpad,
  idleTime,
  subtotal,
  identifier,
  customerName,
  mainIdentifier,
  numberOfCustomers,
  contact,
  opened,
}: Props) {
  const valorReal = subtotal ? subtotal / 100 : 0; // converter de centavos

  // identificador principal da comanda em ordem de prioridade
  // 1 identificador unico identifier
  // 2 nome do cliente customerName
  // 3 telefone do cliente contact
  // 4 ID da comanda mainIdentifier
  const identificadorPrincipal = identifier || customerName || contact || mainIdentifier || `#${id}`;

  // calcular tempo de ocupacao desde opened ate agora
  const getTempoOcupacao = () => {
    if (!opened) return idleTime || 0;
    const openedDate = new Date(opened);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - openedDate.getTime()) / (1000 * 60));
    return diffMinutes;
  };

  const tempoOcupacao = getTempoOcupacao();

  // area baseada no modelo do checkpad
  const getArea = () => {
    if (!checkpad) return "Sem área";
    switch (checkpad.model) {
      case "Mesa": return "Salão Principal";
      case "Barraca": return "Área Externa";
      case "Apartamento": return "Apartamentos";
      case "Quarto": return "Quartos";
      default: return checkpad.model;
    }
  };

  const area = getArea();

  return (
    <div
      className="w-full min-w-[220px] h-[150px] rounded-lg border p-3 shadow-sm hover:shadow-md transition cursor-default flex flex-col justify-between bg-white border-gray-200"
    >
      {/* secao superior */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-base font-semibold text-gray-900">
          <span className="text-lg">📋</span>
          <span className="truncate">{identificadorPrincipal}</span>
        </div>

        {/* nome e telefone do cliente */}
        <div className="flex flex-col gap-1 text-xs text-gray-600">
          {customerName && (
            <div className="flex items-center gap-1">
              <Users size={12} />
              <span className="truncate">{customerName}</span>
            </div>
          )}
          {contact && (
            <div className="flex items-center gap-1">
              <Phone size={12} />
              <span className="truncate">{contact}</span>
            </div>
          )}
        </div>

        {/* area e atendente */}
        <div className="flex flex-col gap-1 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <MapPin size={12} />
            <span className="truncate">{area}</span>
          </div>
          {author && (
            <div className="flex items-center gap-1">
              <CreditCard size={12} />
              <span className="truncate">{author.name}</span>
            </div>
          )}
        </div>
      </div>

      {/* secao inferior metricas */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center gap-1">
          <Clock size={14} />
          <span>{tempoOcupacao}min</span>
        </div>
        <div className="flex items-center gap-1">
          <Users size={14} />
          <span>{numberOfCustomers}</span>
        </div>
        <div className="flex items-center gap-1">
          <DollarSign size={14} />
          <span>R$ {valorReal.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}