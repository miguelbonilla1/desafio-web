// modal drawer para criacao de novas comandas
"use client";

import { useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  criarComanda,
  NovaComanda,
  selComandas,
} from "../../features/comandas/comandas.slice";
import {
  fetchMesas, // para refrescar as mesas depois de criar comanda
  Mesa,
  selMesasParaEntregaLivres, // usamos este seletor para popular o combo
} from "../../features/mesas/mesas.slice";

type Props = {
  open: boolean;
  onClose: () => void;
  /** Si se abrió desde una mesa disponível, viene preseleccionada */
  preMesaId?: number;
};

export default function NovaComandaDrawer({ open, onClose, preMesaId }: Props) {
  const dispatch = useAppDispatch();

  // opcoes para o combo de mesas apenas mesas nao ocupadas
  const opcoesMesas = useAppSelector(selMesasParaEntregaLivres);

  // lista de mesas para acessar dados extras area valorTotal etc
  const mesas = useAppSelector((s) => s.mesas.lista as Mesa[]);
  
  // lista de comandas para verificar duplicacoes
  const comandas = useAppSelector(selComandas);

  // Etapa 1: Dados do cliente
  const [identificador, setIdentificador] = useState("");
  const [cliente, setCliente] = useState("");
  const [telefone, setTelefone] = useState("");
  const [qtdClientes, setQtdClientes] = useState<number>(1);

  // Etapa 2: Seleção de mesa (inicializa com mesa pré-selecionada se veio de uma mesa disponível)
  const [mesaId, setMesaId] = useState<string>(() =>
    preMesaId != null ? String(preMesaId) : ""
  );
  const [observacoes, setObservacoes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // controle de etapas
  const [step, setStep] = useState<1 | 2>(1);
  const [atendenteError, setAtendenteError] = useState(false);



  //fix this!!

  const [atendente, setAtendente] = useState("");

  const mesaSelecionada = useMemo(
    () => mesas.find((m) => m.numero === mesaId),
    [mesas, mesaId]
  );

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // validar atendente obrigatorio (mínimo 4 caracteres) mesmo se chegou ao passo 2
    if (atendente.trim().length < 4) {
      setStep(1);
      setAtendenteError(true);
      alert("Informe o atendente (mínimo 4 caracteres).");
      return;
    }
    if (!mesaId) return; // obrigatório por UX, o <select> já tem required

    // Verificar se a mesa já possui comandas ativas
    const mesaNumero = mesaId;
    const comandaExistente = comandas.find(c => String(c.mesaId) === mesaNumero);
    if (comandaExistente) {
      alert(`Mesa ${mesaNumero} já possui uma comanda ativa (${comandaExistente.id}). Selecione outra mesa.`);
      return;
    }

    // Verificar se a mesa está realmente disponível
    const mesaAtual = mesas.find(m => m.numero === mesaNumero);
    if (mesaAtual?.status !== "disponiveis") {
      alert(`Mesa ${mesaNumero} não está disponível. Status: ${mesaAtual?.status || 'não encontrada'}.`);
      return;
    }

    setSubmitting(true);
    try {
      const payload: NovaComanda = {
        id: identificador || undefined,
        cliente: (cliente || identificador || "Cliente").trim(),
        telefone: telefone || undefined,
        mesaId: mesaId ? Number(mesaId) : undefined, // mesaId agora é o número identificador
        area: mesaSelecionada?.area,
        tempoMin: 0,
        total: 0,
        qtdClientes,
        atendente: atendente || undefined,
      };

      // 1) Criar a comanda
      await dispatch(criarComanda(payload)).unwrap();

      // 2) refrescar todas as mesas para que se veja a mudanca de status
      await dispatch(fetchMesas()).unwrap();

      // resetar formulario local conserva pre-selecao se veio de uma mesa
      setIdentificador("");
      setCliente("");
      setTelefone("");
  setQtdClientes(1);
  setAtendente("");
      setMesaId(preMesaId != null ? String(preMesaId) : "");
      setObservacoes("");
      setStep(1);

      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden
      />
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl overflow-auto">
        {step === 1 ? (
          <div className="p-6 space-y-6">
            <h2 className="text-2xl font-semibold">Abrir comanda</h2>

            {/* Identificação da comanda */}
            <div className="space-y-2">
              <label className="block text-sm font-medium">
                Identifique a comanda
              </label>
             
              <input
                className="w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none"
                placeholder="Número ou nome da comanda"
                value={identificador}
                onChange={(e) => setIdentificador(e.target.value)}
              />
            </div>

            {/* Identificação do cliente */}
            <div className="space-y-2">
              <label className="block text-sm font-medium">
                Identifique o cliente 
              </label>
              <div>
                <input
                  className="mt-2 w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none"
                  placeholder="Nome do cliente"
                  maxLength={32}
                  value={cliente}
                  onChange={(e) => setCliente(e.target.value)}
                />
                <div className="mt-1 text-right text-xs text-neutral-500">{cliente.length} de 32</div>
              </div>

              <label className="block text-sm font-medium mt-2">Celular</label>
              <input
                className="w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none"
                placeholder="95 9999-9999"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
              />

              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium">Atendente <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    className={`w-full rounded-xl border px-3 py-2 outline-none ${
                      atendenteError && atendente.trim().length < 4 ? "border-red-500" : "border-neutral-300"
                    }`}
                    placeholder="Nome do atendente"
                    value={atendente}
                    onChange={(e) => { setAtendente(e.target.value); if (atendenteError) setAtendenteError(false); }}
                  />
                  {atendenteError && atendente.trim().length < 4 && (
                    <p className="mt-1 text-xs text-red-600">Informe o atendente (mínimo 4 caracteres).</p>
                  )}
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Quantidade de clientes</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      aria-label="Diminuir"
                      className="w-9 h-9 rounded-lg border border-neutral-300 flex items-center justify-center cursor-pointer"
                      onClick={() => setQtdClientes((v) => Math.max(1, v - 1))}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={1}
                      className="w-20 text-center rounded-lg border border-neutral-300 px-3 py-2 outline-none"
                      value={qtdClientes}
                      onChange={(e) => setQtdClientes(Math.max(1, Number(e.target.value) || 1))}
                    />
                    <button
                      type="button"
                      aria-label="Aumentar"
                      className="w-9 h-9 rounded-lg border border-neutral-300 flex items-center justify-center cursor-pointer"
                      onClick={() => setQtdClientes((v) => v + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setStep(1); onClose(); }}
                className="px-4 py-2 rounded-xl border border-neutral-300 cursor-pointer"
                disabled={submitting}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="px-5 py-2 rounded-xl bg-emerald-600 text-white disabled:opacity-60 cursor-pointer"
                onClick={() => {
                  if (atendente.trim().length < 4) {
                    setAtendenteError(true);
                    return;
                  }
                  setStep(2);
                }}
                disabled={atendente.trim().length < 4}
              >
                Abrir comanda
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <h2 className="text-2xl font-semibold">Local de entrega</h2>

            <div className="space-y-3">
              <label className="block text-sm font-medium">
                Selecione o local <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none bg-white"
                value={mesaId}
                onChange={(e) => setMesaId(e.target.value)}
                required
              >
                <option value="" disabled>
                  Local de entrega
                </option>
                {opcoesMesas.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <label className="block text-sm font-medium">
                Descrição do motivo de envio para essa mesa 
              </label>
              <textarea
                className="w-full min-h-24 rounded-xl border border-neutral-300 px-3 py-2 outline-none"
                placeholder="Detalhes sobre o preparo ou instruções para a entrega"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setStep(1); onClose(); }}
                className="px-4 py-2 rounded-xl border border-neutral-300 cursor-pointer"
                disabled={submitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-600 text-white disabled:opacity-60 cursor-pointer"
                disabled={submitting || !mesaId}
              >
                {submitting ? "Lançando..." : "Lançar pedido"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
