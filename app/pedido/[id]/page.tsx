// pagina sistema de pedidos para comandas especificas
"use client";

import { useMemo, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { CATEGORIAS, PRODUTOS, Produto } from "../../mocks/produtos";
import {
  Search,
  ChevronLeft,
  ShoppingCart,
  Wallet,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  DollarSign,
  Landmark,
} from "lucide-react";

type CartItem = { produto: Produto; qty: number };

function currency(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/* ---- Botón de método FUERA del componente principal (evita el warning) ---- */
function MetodoBtn({
  active,
  onClick,
  label,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 rounded-xl border cursor-pointer ${
        active
          ? "bg-emerald-50 border-emerald-500 text-emerald-700"
          : "bg-white border-neutral-200"
      }`}
    >
      {icon} {label}
    </button>
  );
}

export default function PedidoPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const dispatch = useAppDispatch();

  const comanda = useAppSelector((s) =>
    s.comandas.lista.find((c) => String(c.id) === String(id))
  );

  const [tab, setTab] = useState<"cardapio" | "pagamento">("cardapio");
  const [categoria, setCategoria] = useState("Assados");
  const [q, setQ] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);

  const produtosFiltrados = useMemo(() => {
    return PRODUTOS.filter(
      (p) =>
        (categoria === "Mais vendidas" || p.categoria === categoria) &&
        p.nome.toLowerCase().includes(q.toLowerCase())
    );
  }, [categoria, q]);

  const subtotal = useMemo(
    () => cart.reduce((acc, it) => acc + it.produto.preco * it.qty, 0),
    [cart]
  );

  // feedback de sucesso para operacoes
  const [okMsg, setOkMsg] = useState<string>("");
  useEffect(() => {
    if (!okMsg) return;
    const t = setTimeout(() => setOkMsg(""), 2000);
    return () => clearTimeout(t);
  }, [okMsg]);

  const addToCart = (p: Produto) => {
    setCart((old) => {
      const i = old.findIndex((it) => it.produto.id === p.id);
      if (i === -1) return [...old, { produto: p, qty: 1 }];
      const copy = [...old];
      copy[i] = { ...copy[i], qty: copy[i].qty + 1 };
      return copy;
    });
  };
  const inc = (pid: string) =>
    setCart((old) =>
      old.map((it) => (it.produto.id === pid ? { ...it, qty: it.qty + 1 } : it))
    );
  const dec = (pid: string) =>
    setCart((old) =>
      old
        .map((it) =>
          it.produto.id === pid ? { ...it, qty: Math.max(0, it.qty - 1) } : it
        )
        .filter((it) => it.qty > 0)
    );
  const removeItem = (pid: string) =>
    setCart((old) => old.filter((it) => it.produto.id !== pid));

  return (
    <div className="flex h-screen">
      {/* MAIN */}
      <div className="flex-1 flex flex-col bg-neutral-50">
        {/* Top bar */}
        <div className="flex items-center gap-3 p-4">
          <button
            onClick={() => router.back()}
            className="rounded-xl border px-3 py-2 hover:bg-neutral-100 cursor-pointer"
            title="Voltar"
          >
            <ChevronLeft />
          </button>
          <h1 className="text-2xl font-semibold">
            {tab === "cardapio" ? "Cardápio" : "Pagamento"}
          </h1>

          <div className="ml-4 flex gap-2">
            <button
              onClick={() => setTab("cardapio")}
              className={`px-4 py-2 rounded-xl border cursor-pointer ${
                tab === "cardapio"
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "bg-white border-neutral-200"
              }`}
            >
              Cardápio
            </button>
            <button
              onClick={() => setTab("pagamento")}
              className={`px-4 py-2 rounded-xl border cursor-pointer ${
                tab === "pagamento"
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "bg-white border-neutral-200"
              }`}
            >
              Pagamento
            </button>
          </div>

          {/* resumen comanda na direita */}
          <div className="ml-auto text-right">
            <div className="font-semibold text-lg">
              {comanda?.cliente || comanda?.id || id}
            </div>
            <div className="text-sm text-neutral-500">
              {comanda?.telefone ? `${comanda.telefone} · ` : ""}
              {comanda?.mesaId ? `Mesa ${comanda.mesaId} · ` : ""}
              {comanda?.area || "—"}
            </div>
          </div>
        </div>

        {/* conteudo */}
        {tab === "cardapio" ? (
          <div className="p-4">
            {/* categorías + buscador */}
            <div className="flex flex-wrap items-center gap-2">
              {CATEGORIAS.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoria(cat)}
                  className={`px-4 py-2 rounded-xl border text-sm cursor-pointer ${
                    categoria === cat
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-white border-neutral-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
              <div className="ml-auto relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                <input
                  placeholder="Buscar item"
                  className="pl-9 pr-3 py-2 rounded-xl border border-neutral-200 bg-white outline-none"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>
            </div>

            {/* grid de produtos */}
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {produtosFiltrados.map((p) => (
                <button
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className="text-left bg-white rounded-2xl border border-neutral-200 p-4 hover:shadow-md transition cursor-pointer"
                >
                  <div className="font-medium">{p.nome}</div>
                  <div className="mt-3 text-neutral-800 font-semibold">
                    {currency(p.preco)}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <PagamentoView subtotal={subtotal} />
        )}
      </div>

      {/* SIDEBAR Carrito/Resumo */}
      <aside className="w-[360px] border-l bg-white flex flex-col">
        <div className="p-4 border-b">
          <div className="font-semibold text-lg flex items-center gap-2">
            <ShoppingCart size={18} /> Itens da comanda
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {cart.length === 0 ? (
            <div className="h-full flex items-center justify-center text-neutral-500 text-sm px-6 text-center">
              Vamos lá, é hora de adicionar produtos!
            </div>
          ) : (
            <ul className="divide-y">
              {cart.map((it) => (
                <li key={it.produto.id} className="p-4">
                  <div className="flex justify-between">
                    <div className="font-medium">{it.produto.nome}</div>
                    <div className="text-neutral-700">
                      {currency(it.produto.preco * it.qty)}
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      className="rounded border px-2 py-1 cursor-pointer"
                      onClick={() => dec(it.produto.id)}
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-7 text-center">{it.qty}</span>
                    <button
                      className="rounded border px-2 py-1 cursor-pointer"
                      onClick={() => inc(it.produto.id)}
                    >
                      <Plus size={14} />
                    </button>
                    <button
                      className="ml-auto text-red-600 hover:text-red-700 cursor-pointer"
                      onClick={() => removeItem(it.produto.id)}
                      title="Remover"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="p-4 border-t">
          <div className="flex justify-between text-sm text-neutral-600">
            <span>Subtotal</span>
            <span className="font-medium">{currency(subtotal)}</span>
          </div>

          {tab === "cardapio" ? (
            <button
              onClick={async () => {
                if (cart.length === 0) return;
                const atual = comanda?.total ?? 0;
                const novoTotal = Number((atual + subtotal).toFixed(2));
                try {
                  const { atualizarComanda } = await import("../../features/comandas/comandas.slice");
                  // usar sourceId quando disponivel ordersheets senao usar o id da comanda
                  const patchId = comanda?.sourceId != null ? String(comanda.sourceId) : (comanda?.id || String(id));
                  console.log("Atualizando comanda:", { patchId, novoTotal, comanda });
                  
                  await dispatch(
                    atualizarComanda({ id: patchId, data: { total: novoTotal } })
                  ).unwrap();
                  setOkMsg("Pedido lançado na comanda");
                  setCart([]); // limpa carrinho, mantém-se no Cardápio
                } catch (error) {
                  console.error("Erro ao lançar pedido:", error);
                  setOkMsg("Falha ao lançar pedido");
                }
              }}
              disabled={cart.length === 0}
              className="mt-3 w-full rounded-xl bg-emerald-600 text-white py-2 disabled:opacity-50 cursor-pointer"
            >
              Lançar pedido
            </button>
          ) : (
            <button className="mt-3 w-full rounded-xl bg-emerald-600 text-white py-2 cursor-pointer">
              Finalizar comanda
            </button>
          )}

          {okMsg && (
            <div className="mt-3 text-center text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl py-2">
              {okMsg}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

/* -------- Vista de Pagamento (lado esquerdo) -------- */
function PagamentoView({ subtotal }: { subtotal: number }) {
  const [metodo, setMetodo] = useState<
    "dinheiro" | "pix" | "debito" | "credito" | "fiado" | "outros"
  >("dinheiro");
  const [valorPagar, setValorPagar] = useState(subtotal.toFixed(2));
  const [trocoPara, setTrocoPara] = useState("");

  const troco = (() => {
    const v = parseFloat(trocoPara.replace(",", "."));
    const p = parseFloat(valorPagar.replace(",", "."));
    if (!isFinite(v) || !isFinite(p)) return 0;
    const diff = v - p;
    return diff > 0 ? diff : 0;
  })();

  return (
    <div className="p-4">
      <h2 className="text-2xl font-semibold">Pagamento</h2>

      <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
        <MetodoBtn
          active={metodo === "dinheiro"}
          onClick={() => setMetodo("dinheiro")}
          label="Dinheiro"
          icon={<DollarSign size={18} />}
        />
        <MetodoBtn
          active={metodo === "pix"}
          onClick={() => setMetodo("pix")}
          label="Pix"
          icon={<Landmark size={18} />}
        />
        <MetodoBtn
          active={metodo === "debito"}
          onClick={() => setMetodo("debito")}
          label="Débito"
          icon={<CreditCard size={18} />}
        />
        <MetodoBtn
          active={metodo === "credito"}
          onClick={() => setMetodo("credito")}
          label="Crédito"
          icon={<CreditCard size={18} />}
        />
        <MetodoBtn
          active={metodo === "fiado"}
          onClick={() => setMetodo("fiado")}
          label="Fiado"
          icon={<Wallet size={18} />}
        />
        <MetodoBtn
          active={metodo === "outros"}
          onClick={() => setMetodo("outros")}
          label="Outros"
          icon={<Wallet size={18} />}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4 mt-6">
        <div>
          <label className="block text-sm text-neutral-600 mb-2">
            Valor a pagar
          </label>
          <input
            value={valorPagar}
            onChange={(e) => setValorPagar(e.target.value)}
            className="w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none bg-white"
            placeholder="R$"
          />
        </div>
        <div>
          <label className="block text-sm text-neutral-600 mb-2">
            Troco para
          </label>
          <input
            value={trocoPara}
            onChange={(e) => setTrocoPara(e.target.value)}
            className="w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none bg-white"
            placeholder="R$"
          />
          <div className="mt-2 text-sm text-neutral-600">
            Troco {currency(troco)}
          </div>
        </div>
      </div>
    </div>
  );
}
