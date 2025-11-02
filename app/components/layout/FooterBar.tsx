"use client";

type Props = {
  restaurante?: string;
  lojaAberta?: boolean;
  caixaAberto?: boolean;
  pedidosPendentes?: number;
  atendente?: string;
  versao?: string;
};

function Dot({ on = true, colorOn = "bg-emerald-500" }: { on?: boolean; colorOn?: string }) {
  return <span className={`inline-block w-2 h-2 rounded-full ${on ? colorOn : "bg-neutral-300"}`} />;
}

export default function FooterBar({
  restaurante = "Zigpi Restaurante",
  lojaAberta = true,
  caixaAberto = true,
  pedidosPendentes = 1,
  atendente = "Pedremi Sevrrais",
  versao = "2.2.2",
}: Props) {
  return (
    <footer
      className="
        fixed bottom-0 left-0 right-0 z-50
        bg-white border-t border-neutral-200
        px-3 sm:px-4 md:px-6 py-2
        text-[12px] sm:text-sm text-neutral-700
      "
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row gap-2 sm:gap-4 items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="font-medium">{restaurante}</span>
          <span className="flex items-center gap-2">
            <Dot on={lojaAberta} />
            Loja aberta
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <span className="flex items-center gap-2">
            <span className="inline-block w-4 text-center">🧾</span>
            {pedidosPendentes} Pedido pendentes
          </span>
          <span>{atendente}</span>
          <span className="flex items-center gap-2">
            <Dot on={caixaAberto} />
            Caixa aberto
          </span>
          <span className="opacity-70">Desligado</span>
          <span className="opacity-70">Versão {versao}</span>
        </div>
      </div>
    </footer>
  );
}