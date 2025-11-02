// app/features/comandas/comandas.slice.ts
import { createAsyncThunk, createSlice, PayloadAction, createSelector } from "@reduxjs/toolkit";
import type { RootState } from "../../store";
import { selFiltros } from "../mesas/mesas.slice";

const API = "http://localhost:4000";

export type Comanda = {
  id: string;
  sourceId?: number;
  cliente?: string;
  telefone?: string;
  mesaId?: number;
  area?: string;
  tempoMin?: number;
  total?: number;
  qtdClientes?: number;
  atendente?: string;
};

export type NovaComanda = Omit<Comanda, "id"> & { id?: string };

// Tipo simplificado para dados da API  
type ApiOrdersheet = {
  id: number;
  contact?: string;
  hasOrder: number;
  idleTime: number;
  subtotal: number;
  identifier?: string | null;
  customerName?: string;
  mainIdentifier?: string;
  numberOfCustomers?: number;
  checkpad?: {
    id: number;
    hash?: string;  // mantido para compatibilidade
    model?: string;
    identifier?: string;
  } | null;
  author?: {
    id: number;
    name?: string;
    type?: string;  // mantido para compatibilidade
  } | null;
};

type ComandasState = {
  lista: Comanda[];
  ordersheets: ApiOrdersheet[];
  loading: boolean;
  error?: string;
  query: string;
  filtros: {
    status: "todos";
    area: string | "todos";
    atendente: string | "todos";
  };
};

const initialState: ComandasState = {
  lista: [],
  ordersheets: [],
  loading: false,
  query: "",
  // estado inicial dos filtros
  filtros: {
    status: "todos",
    area: "todos", 
    atendente: "todos",
  },
};

// Remover duplicação - usar ApiOrdersheet definido acima

export const fetchComandas = createAsyncThunk(
  "comandas/fetch",
  async () => {
  // tentativa 1: mock pigz-style ordersheets
  try {
    const rPigz = await fetch(`${API}/ordersheets`);
    const rCheckpads = await fetch(`${API}/checkpads`); // buscar checkpads para atendentes
    
    if (rPigz.ok && rCheckpads.ok) {


  const data = (await rPigz.json()) as ApiOrdersheet[] | Record<string, ApiOrdersheet>;
  const totalHeader = rPigz.headers.get("X-Total-Count");
  const totalParsed = totalHeader ? parseInt(totalHeader, 10) : 0;
      const allOrdersheets: ApiOrdersheet[] = Array.isArray(data) ? data : Object.values(data);
      
      // filtrar apenas ordersheets com pedidos lançados (subtotal > 0)
      // mesas sem pedidos não devem aparecer na aba comandas
      const arr: ApiOrdersheet[] = allOrdersheets.filter(o => 
        o.subtotal && o.subtotal > 0 // apenas comandas com pedidos lançados
      );
      
      // carregar checkpads para mapear atendentes
      const checkpadsData = await rCheckpads.json();
      const checkpads = Array.isArray(checkpadsData) ? checkpadsData : Object.values(checkpadsData);
      
      // criar mapa de checkpad.id para authorName para lookup rapido
      const checkpadAtendentes = new Map<string, string>();
      checkpads.forEach((cp: { id: number; authorName?: string }) => {
        if (cp.id && cp.authorName) {
          checkpadAtendentes.set(cp.id.toString(), cp.authorName);
        }
      });

      const list: Comanda[] = arr.map((o) => {
        const total = o.subtotal > 100 ? o.subtotal / 100 : o.subtotal;
        const mesaId = o.checkpad?.identifier ? Number.parseInt(o.checkpad.identifier, 10) : undefined;
        const idDisplay = o.mainIdentifier || o.identifier || String(o.id);
        return {
          id: idDisplay,
          sourceId: o.id,
          cliente: o.customerName || undefined,
          telefone: o.contact || undefined,
          mesaId: Number.isFinite(mesaId as number) ? (mesaId as number) : undefined,
          area: o.checkpad?.model,
          tempoMin: o.idleTime,
          total,
          qtdClientes: o.numberOfCustomers,
          atendente: o.author?.name || checkpadAtendentes.get(o.checkpad?.id?.toString() || '') || undefined, // mapear atendente do author ou checkpad
        } satisfies Comanda;
      });
      
      // devolver ambos comandas convertidas e ordersheets originais
      return { comandas: list, ordersheets: arr, total: totalParsed };
    }
  } catch {
    // fallback
  }

  // fallback: mock antigo comandas
  const r = await fetch(`${API}/comandas`);
  if (!r.ok) throw new Error("Erro ao carregar comandas");
  const totalHeader = r.headers.get("X-Total-Count");
  const totalParsed = totalHeader ? parseInt(totalHeader, 10) : 0;
  const comandas = (await r.json()) as Comanda[];
  return { comandas, ordersheets: [], total: totalParsed };
}
);

export const criarComanda = createAsyncThunk(
  "comandas/create",
  async (payload: NovaComanda) => {
    // 1) tenta criar em ordersheets mock pigz
    try {
      // primeiro, encontrar o checkpad correto pelo identificador
      let checkpadData = null;
      if (payload.mesaId) {
        const checkpadsResponse = await fetch(`${API}/checkpads`);
        if (checkpadsResponse.ok) {
          const checkpads = await checkpadsResponse.json();
          type CheckpadType = { id: number; hash: string; model: string; identifier: string };
          const checkpad = checkpads.find((cp: CheckpadType) => cp.identifier === String(payload.mesaId));
          if (checkpad) {
            checkpadData = {
              id: checkpad.id,
              hash: checkpad.hash,
              model: checkpad.model,
              identifier: checkpad.identifier,
            };
          }
        }
      }
      // usar o tipo PigzOrdersheet definido acima

      const bodyPigz: Partial<ApiOrdersheet> = {
        contact: payload.telefone ?? undefined,
        hasOrder: 0,
        idleTime: 0,
        subtotal: 0,
        identifier: payload.id ?? null,
        mainIdentifier: payload.id ?? (payload.cliente || ""),
        customerName: (payload.cliente || "Cliente").trim(),
        numberOfCustomers: payload.qtdClientes ?? 1,
        checkpad: checkpadData,
      };

      const rOrder = await fetch(`${API}/ordersheets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPigz),
      });
      
      if (rOrder.ok) {
        const rawOrdersheet = await rOrder.json();
        // converter o formato da API ao tipo PigzOrdersheet
        const o: ApiOrdersheet = {
          ...rawOrdersheet,
          author: rawOrdersheet.author || undefined, // converter null para undefined
        };

        // atualizar o checkpad correspondente para marca-lo como ocupado
        if (checkpadData) {
          try {
            const updatePayload = {
              hasOrder: 1,
              hasOrderSheets: true,
              subtotal: o.subtotal,
              orderSheetIds: [String(o.id)], // garantir que seja string
              customerIdentifier: payload.cliente || o.customerName,
              authorName: payload.atendente || null,
              numberOfCustomers: o.numberOfCustomers,
              lastOrderCreated: new Date().toISOString().slice(0, 19).replace('T', ' ') + ".000000"
            };
            console.log("Updating checkpad:", checkpadData.id, "with payload:", updatePayload);
            
            const updateCheckpadResponse = await fetch(`${API}/checkpads/${checkpadData.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(updatePayload),
            });
            
            if (updateCheckpadResponse.ok) {
              const updatedCheckpad = await updateCheckpadResponse.json();
              console.log("Checkpad updated successfully:", updatedCheckpad);
            } else {
              const errorText = await updateCheckpadResponse.text();
              console.warn("Failed to update checkpad:", updateCheckpadResponse.status, errorText);
            }
          } catch (error) {
            console.warn("Error updating checkpad:", error);
          }
        }

        const total = o.subtotal > 100 ? o.subtotal / 100 : o.subtotal;
        const mesaId = o.checkpad?.identifier ? Number.parseInt(o.checkpad.identifier, 10) : undefined;
        const idDisplay = o.mainIdentifier || o.identifier || String(o.id);
        const mapped: Comanda = {
          id: idDisplay,
          sourceId: o.id,
          cliente: o.customerName || undefined,
          telefone: o.contact || undefined,
          mesaId: Number.isFinite(mesaId as number) ? (mesaId as number) : undefined,
          area: o.checkpad?.model,
          tempoMin: o.idleTime,
          total,
          qtdClientes: o.numberOfCustomers,
          atendente: undefined, // incluir atendente mesmo quando undefined
        };
        return { comanda: mapped, ordersheet: o };
      }
    } catch {
      // ignora e tenta fallback
    }

    // 2) Fallback em /comandas
    const r = await fetch(`${API}/comandas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        // defensivo: cero si no vino
        tempoMin: payload.tempoMin ?? 0,
        total: payload.total ?? 0,
        qtdClientes: payload.qtdClientes ?? 1,
      }),
    });
    if (!r.ok) throw new Error("Erro ao criar comanda");
    const comanda = (await r.json()) as Comanda;
    // para o fallback, criar um ordersheet basico a partir da comanda
    const fallbackOrdersheet: ApiOrdersheet = {
      id: Math.random() * 1000000 | 0, // ID temporario
      contact: comanda.telefone,
      hasOrder: 0,
      idleTime: comanda.tempoMin || 0,
      subtotal: (comanda.total || 0) * 100,
      identifier: comanda.id,
      customerName: comanda.cliente || "Cliente",
      mainIdentifier: comanda.id,
      numberOfCustomers: comanda.qtdClientes || 1,
      checkpad: comanda.mesaId ? {
        id: comanda.mesaId,
        hash: 'fallback',
        model: comanda.area || 'Mesa',  
        identifier: comanda.mesaId.toString()
      } : null,
    };
    return { comanda, ordersheet: fallbackOrdersheet };
  }
);

export const atualizarComanda = createAsyncThunk(
  "comandas/update",
  async ({ id, data }: { id: string; data: Partial<Comanda> }) => {
    console.log("🔄 Atualizando comanda:", { id, data });
    
    // 1) Tenta atualizar em /ordersheets (mock pigz)
    try {
      // mapeia campos Comanda -> Ordersheet
      const payloadPigz: Record<string, unknown> = {};
      if (data.total !== undefined) {
        const v = data.total ?? 0;
        payloadPigz.subtotal = v > 0 ? Math.round(v * 100) : 0; // em centavos
      }
      if (data.cliente !== undefined) payloadPigz.customerName = data.cliente ?? "";
      if (data.telefone !== undefined) payloadPigz.contact = data.telefone ?? null;
      if (data.qtdClientes !== undefined) payloadPigz.numberOfCustomers = data.qtdClientes ?? 1;

      console.log("📤 Enviando PATCH para /ordersheets:", { url: `${API}/ordersheets/${encodeURIComponent(id)}`, payload: payloadPigz });
      
      const rOrder = await fetch(`${API}/ordersheets/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadPigz),
      });
      
      console.log("📥 Resposta do servidor:", { status: rOrder.status, ok: rOrder.ok });
      
      if (rOrder.ok) {

        const o = (await rOrder.json()) as ApiOrdersheet;
        const total = o.subtotal > 100 ? o.subtotal / 100 : o.subtotal;
        const mesaId = o.checkpad?.identifier ? Number.parseInt(o.checkpad.identifier, 10) : undefined;
        const idDisplay = o.mainIdentifier || o.identifier || String(o.id);
        const mapped: Comanda = {
          id: idDisplay,
          sourceId: o.id,
          cliente: o.customerName || undefined,
          telefone: o.contact || undefined,
          mesaId: Number.isFinite(mesaId as number) ? (mesaId as number) : undefined,
          area: o.checkpad?.model,
          tempoMin: o.idleTime,
          total,
          qtdClientes: o.numberOfCustomers,
          atendente: undefined, // incluir atendente mesmo quando undefined
        };
        console.log("Comanda atualizada com sucesso:", mapped);
        return mapped;
      } else {
        console.log("Erro na resposta do ordersheets:", await rOrder.text());
      }
    } catch (error) {
      console.log("❌ Erro ao tentar ordersheets:", error);
      // ignora e tenta fallback
    }

    // 2) fallback para comandas
    const r = await fetch(`${API}/comandas/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!r.ok) throw new Error("Erro ao atualizar comanda");
    return (await r.json()) as Comanda;
  }
);

const comandasSlice = createSlice({
  name: "comandas",
  initialState,
  reducers: {
    setQuery(state, action: PayloadAction<string>) {
      state.query = action.payload;
    },

    // actions para filtros de comandas
    setStatusComandas(state, action: PayloadAction<"todos">) {
      state.filtros.status = action.payload;
    },
    setAreaComandas(state, action: PayloadAction<string>) {
      state.filtros.area = action.payload;
    },
    setAtendenteComandas(state, action: PayloadAction<string>) {
      state.filtros.atendente = action.payload;
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchComandas.pending, (s) => {
      s.loading = true;
      s.error = undefined;
    });
    b.addCase(fetchComandas.fulfilled, (s, a) => {
      s.loading = false;
      s.lista = a.payload.comandas;
      s.ordersheets = a.payload.ordersheets;
    });
    b.addCase(fetchComandas.rejected, (s, a) => {
      s.loading = false;
      s.error = a.error.message;
    });
    b.addCase(criarComanda.fulfilled, (s, a) => {
      // inserir no comeco para ver no topo
      s.lista.unshift(a.payload.comanda);
      // tambem atualizar ordersheets para que apareca na aba Comandas
      s.ordersheets.unshift(a.payload.ordersheet);
    });
    b.addCase(atualizarComanda.fulfilled, (s, a) => {
      const idx = s.lista.findIndex(
        (c) => c.sourceId != null ? c.sourceId === a.payload.sourceId : c.id === a.payload.id
      );
      if (idx !== -1) s.lista[idx] = a.payload;
    });
  },
});

export const { setQuery, setStatusComandas, setAreaComandas, setAtendenteComandas } = comandasSlice.actions;
export default comandasSlice.reducer;

/** Selectores */
export const selComandas = (s: RootState) => s.comandas.lista;
export const selOrdersheets = (s: RootState) => s.comandas.ordersheets;
export const selLoadingComandas = (s: RootState) => s.comandas.loading;
export const selQueryComandas = (s: RootState) => s.comandas.query;
export const selFiltrosComandas = (s: RootState) => s.comandas.filtros;

export const selComandasFiltradas = createSelector(
  [selComandas, selQueryComandas, selFiltros],
  (comandas, query, filtros) => {
    const q = query.trim().toLowerCase();
    const areaFilter = filtros.area;
    const atendenteFilter = filtros.atendente;
    const estadoFilter = filtros.estadoMesa;
    
    return comandas.filter((c) => {
      // filtrar por area usando o mesmo filtro das mesas
      if (areaFilter !== "todos" && (c.area ?? "") !== areaFilter) return false;
      
      // filtrar por atendente usando o mesmo filtro das mesas
      if (atendenteFilter !== "todos" && (c.atendente ?? "") !== atendenteFilter) return false;
      
      // filtrar por estado adaptado para comandas
      if (estadoFilter !== "todos") {
        const temTotal = (c.total ?? 0) > 0;
        const temAtendente = !!c.atendente;
        const tempoOcioso = (c.tempoMin ?? 0) > 15; // considera ociosa se mais de 15min
        
        switch (estadoFilter) {
          case "em-atendimento":
            // Comandas sendo atendidas (têm atendente e valor)
            if (!temTotal || !temAtendente) return false;
            break;
          case "ociosas":
            // comandas com muito tempo sem atividade
            if (!tempoOcioso || !temAtendente) return false;
            break;
          case "sem-pedidos":
            // Comandas sem valor/pedidos mas com atendente
            if (temTotal || !temAtendente) return false;
            break;
          case "disponiveis":
            // comandas sem atendente disponiveis para atender
            if (temAtendente) return false;
            break;
        }
      }
      
      // Filter by search query
      if (!q) return true;
      const id = c.id?.toLowerCase() ?? "";
      const cliente = c.cliente?.toLowerCase() ?? "";
      const tel = c.telefone?.toLowerCase() ?? "";
      const mesa = c.mesaId != null ? String(c.mesaId) : "";
      return (
        id.includes(q) ||
        cliente.includes(q) ||
        tel.includes(q) ||
        mesa.includes(q)
      );
    });
  }
);

// seletor para ordersheets filtrados
export const selOrdersheetsFiltrados = createSelector(
  [selOrdersheets, selQueryComandas, selFiltrosComandas],
  (ordersheets, query, filtros) => {
    const q = query.trim().toLowerCase();
    const areaFilter = filtros.area;
    const atendenteFilter = filtros.atendente;
    
    return ordersheets.filter((o) => {
      // Filter by area
      if (areaFilter !== "todos" && (o.checkpad?.model ?? "") !== areaFilter) return false;
      
      // Filter by atendente
      if (atendenteFilter !== "todos" && (o.author?.name ?? "") !== atendenteFilter) return false;
      
      // filtrar por status - apenas todos disponivel agora
      
      // Filter by search query
      if (!q) return true;
      const identifier = o.identifier?.toLowerCase() ?? "";
      const customerName = o.customerName?.toLowerCase() ?? "";
      const mainIdentifier = o.mainIdentifier?.toLowerCase() ?? "";
      const mesaId = o.checkpad?.identifier ?? "";
      
      return (
        identifier.includes(q) ||
        customerName.includes(q) ||
        mainIdentifier.includes(q) ||
        mesaId.includes(q)
      );
    });
  }
);
