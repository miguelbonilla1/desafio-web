// Slice Redux para gerenciamento de estado das mesas do restaurante
import { createAsyncThunk, createSlice, PayloadAction, createSelector } from "@reduxjs/toolkit";
import type { RootState } from "../../store";

const API = "http://localhost:4000";

// Definições de tipos simplificadas
export type StatusMesa = "disponiveis" | "ocupada" | "reservada" | "inactive";

export type Mesa = {
  id: number;
  numero?: string;
  status: StatusMesa;
  modelo?: string;
  atendente?: string;
  cliente?: string;
  tempoMinSemPedido?: number;
  tempoOcupacao?: number;
  comandasAbertas?: number;
  valorTotal?: number;
  area?: string;
  activity?: string;
  modelIcon?: string;
};

// Tipo base para dados brutos da API (simplificado)
type ApiCheckpad = {
  id: number;
  hash: string;
  model: string;
  activity: string;
  hasOrder: 0 | 1;
  idleTime: number | null;
  subtotal: number | null;
  modelIcon?: string | null;
  authorName?: string | null;
  identifier: string;
  orderSheetIds?: number[];
  numberOfCustomers?: number | null;
};

// Tipo para areas completas
type AreaCompleta = {
  id: number;
  name: string;
  sheetLabel: string;
  description: string;
  maxIdleTime: number;
  serviceModel: "FIXED" | "FLEXIBLE";
  operationType: string;
  checkpadModels: Array<{
    id: number;
    icon: string;
    name: string;
  }>;
  checkpadQuantity: number;
  sheetLabelPlural: string;
  maxIdleTimeEnabled: number;
  checkpadModelQuantity: number;
  defaultVizualizationList: string;
};

// Helper para conversão de valores
const normalizeValue = (value: number | null) => {
  if (!value) return 0;
  return value > 100 ? value / 100 : value;
};

// Função única simplificada de mapeamento
function normalizeMesa(cp: ApiCheckpad, customValue?: number): Mesa {
  const modeloMap: Record<string, string> = {
    Mesa: "mesa",
    Barraca: "quiosque", 
    Apartamento: "quarto",
  };

  const ocupada = cp.hasOrder === 1 || (cp.orderSheetIds && cp.orderSheetIds.length > 0);
  const valorTotal = customValue ?? normalizeValue(cp.subtotal);

  return {
    id: cp.id,
    numero: cp.identifier,
    status: ocupada ? "ocupada" : (cp.activity === "inactive" ? "inactive" : "disponiveis"),
    modelo: modeloMap[cp.model] ?? "mesa",
    atendente: cp.authorName ?? undefined,
    cliente: undefined, // será calculado depois se necessário
    tempoMinSemPedido: cp.idleTime ?? undefined,
    comandasAbertas: cp.orderSheetIds?.length ?? 0,
    valorTotal,
    area: cp.model,
    activity: cp.activity,
    modelIcon: cp.modelIcon ?? undefined,
  };
}

type Filtros = {
  status: "todos" | StatusMesa;
  atendente: string | "todos";
  area: string | "todos"; // filtro de visao geral
  estadoMesa: "todos" | "em-atendimento" | "ociosas" | "sem-pedidos" | "disponiveis";
  query: string;
};

type MesasState = {
  lista: Mesa[];
  loading: boolean;
  error?: string;
  filtros: Filtros;
  areasFull: AreaCompleta[];
};

// Estado inicial
const initialState: MesasState = {
  lista: [],
  loading: false,
  filtros: {
    status: "todos",
    atendente: "todos",
    area: "todos",
    estadoMesa: "todos",
    query: "",
  },
  areasFull: [],
};

// Thunks da API
export const fetchMesas = createAsyncThunk("mesas/fetch", async (): Promise<Mesa[]> => {
  // tentativa 1 buscar mock estilo pigz checkpads
  try {
    const rPigz = await fetch(`${API}/checkpads`);
    const rOrdersheets = await fetch(`${API}/ordersheets`);
    
    if (rPigz.ok) {
      const checkpadsData = (await rPigz.json()) as ApiCheckpad[] | Record<string, ApiCheckpad>;
      let checkpads: ApiCheckpad[];
      if (Array.isArray(checkpadsData)) checkpads = checkpadsData;
      else checkpads = Object.values(checkpadsData);

      // buscar ordersheets para calcular valor total correto
      type OrdersheetData = {
        id: string | number;
        subtotal: number;
        checkpad?: {
          id: string | number;
          hash?: string;
          model?: string;
          identifier?: string;
        } | null;
        contact?: string | null;
        customerName?: string;
        identifier?: string | null;
        mainIdentifier?: string;
      };
      
      let ordersheets: OrdersheetData[] = [];
      if (rOrdersheets.ok) {
        const ordersheetsData = await rOrdersheets.json();
        ordersheets = Array.isArray(ordersheetsData) ? ordersheetsData : Object.values(ordersheetsData);
      }

      // Processamento simplificado em um único passo
      const mesasMap = new Map<string, Mesa>();
      
      checkpads.forEach(cp => {
        // Calcular valor das ordersheets desta mesa
        const mesaOrdersheets = ordersheets.filter(os => 
          os.checkpad && String(os.checkpad.id) === String(cp.id)
        );
        const valorOrdersheets = mesaOrdersheets.reduce((total, os) => 
          total + normalizeValue(os.subtotal), 0
        );
        
        // Usar valor das ordersheets ou valor do checkpad
        const valorFinal = valorOrdersheets > 0 ? valorOrdersheets : normalizeValue(cp.subtotal);
        
        // Criar mesa normalizada
        const mesa = normalizeMesa(cp, valorFinal);
        const key = mesa.numero || String(mesa.id);
        
        // Consolidar se já existe (evitar duplicatas)
        const existente = mesasMap.get(key);
        if (!existente) {
          mesasMap.set(key, mesa);
        } else {
          // Manter a mesa ocupada se alguma estiver ocupada
          const statusPrioridade = { ocupada: 3, reservada: 2, inactive: 1, disponiveis: 0 };
          const melhorStatus = statusPrioridade[mesa.status] > statusPrioridade[existente.status] 
            ? mesa.status : existente.status;
          
          mesasMap.set(key, {
            ...mesa,
            status: melhorStatus,
            comandasAbertas: (existente.comandasAbertas ?? 0) + (mesa.comandasAbertas ?? 0),
            valorTotal: (existente.valorTotal ?? 0) + (mesa.valorTotal ?? 0),
          });
        }
      });

      return Array.from(mesasMap.values());
    }
  } catch (error) {
    console.error("Erro ao carregar mesas:", error);
  }
  
  return []; // retorna array vazio se não conseguir carregar
});

export const atualizarMesa = createAsyncThunk(
  "mesas/update", 
  async ({ id, data }: { id: number; data: Partial<Mesa> }) => {
    // Mapear campos Mesa para API
    const statusToActivity: Record<StatusMesa, string> = {
      disponiveis: "empty",
      ocupada: "active", 
      reservada: "inactive",
      inactive: "inactive",
    };
    
    const payload: Record<string, unknown> = {};
    if (data.status) payload.activity = statusToActivity[data.status];
    if (data.atendente !== undefined) payload.authorName = data.atendente ?? null;
    if (data.tempoMinSemPedido !== undefined) payload.idleTime = data.tempoMinSemPedido ?? null;
    if (data.valorTotal !== undefined) payload.subtotal = Math.round((data.valorTotal ?? 0) * 100);

    const response = await fetch(`${API}/checkpads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) throw new Error("Erro ao atualizar mesa");
    
    const checkpad = await response.json();
    return normalizeMesa(checkpad as ApiCheckpad);
  }
);

/** Slice */
const mesasSlice = createSlice({
  name: "mesas",
  initialState,
  reducers: {
    setStatus(state, action: PayloadAction<Filtros["status"]>) {
      state.filtros.status = action.payload;
    },
    setAtendente(state, action: PayloadAction<string | "todos">) {
      state.filtros.atendente = action.payload;
    },
    setArea(state, action: PayloadAction<string | "todos">) {
      state.filtros.area = action.payload;
    },
    setEstadoMesa(state, action: PayloadAction<Filtros["estadoMesa"]>) {
      state.filtros.estadoMesa = action.payload;
    },
    setQuery(state, action: PayloadAction<string>) {
      state.filtros.query = action.payload;
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchMesas.pending, (s) => {
      s.loading = true;
      s.error = undefined;
    });
    b.addCase(fetchMesas.fulfilled, (s, a) => {
      s.loading = false;
      s.lista = a.payload;
    });
    b.addCase(fetchMesas.rejected, (s, a) => {
      s.loading = false;
      s.error = a.error.message;
    });

    b.addCase(atualizarMesa.fulfilled, (s, a) => {
      const idx = s.lista.findIndex((m) => m.id === a.payload.id);
      if (idx !== -1) s.lista[idx] = a.payload;
    });

    b.addCase(fetchAreas.fulfilled, (s, a) => {
      s.areasFull = a.payload;
    });
  },
});

export const { setStatus, setAtendente, setArea, setEstadoMesa, setQuery } = mesasSlice.actions;
export default mesasSlice.reducer;

/** Seletores */
export const selMesas = (s: RootState): Mesa[] => s.mesas.lista;
export const selMesasLoading = (s: RootState): boolean => s.mesas.loading;
export const selFiltros = (s: RootState): Filtros => s.mesas.filtros;
export const selQueryMesas = (s: RootState): string => s.mesas.filtros.query;

export const selMesasFiltradas = (s: RootState): Mesa[] => {
  const lista = selMesas(s);
  const f = selFiltros(s);
  const q = f.query.toLowerCase().trim();

  return lista.filter((m) => {
    // filtro por status basico
    if (f.status !== "todos" && m.status !== f.status) return false;
    
    // filtro por atendente
    if (f.atendente !== "todos" && (m.atendente ?? "") !== f.atendente) return false;
    
    // filtro por area visao geral
    if (f.area !== "todos" && (m.area ?? "") !== f.area) return false;
    
    // filtro por estado da mesa mais especifico
    if (f.estadoMesa !== "todos") {
      switch (f.estadoMesa) {
        case "em-atendimento":
          // mesas Ocupadas (hasOrder === 1)
          if (m.status !== "ocupada") return false;
          break;
        case "ociosas":
          // mesas com activity === "inactive" 
          if (m.activity !== "inactive") return false;
          break;
        case "sem-pedidos":
          // mesas ocupadas mas sem pedidos lançados (valor total zero ou muito baixo)
          if (m.status !== "ocupada" || (m.valorTotal ?? 0) > 0.01) return false;
          break;
        case "disponiveis":
          // mesas livres (hasOrder === 0)
          if (m.status !== "disponiveis") return false;
          break;
      }
    }

    // filtro por query de busca
    if (!q) return true;
    return (
      String(m.numero ?? m.id).includes(q) ||
      (m.cliente ?? "").toLowerCase().includes(q) ||
      (m.atendente ?? "").toLowerCase().includes(q) ||
      (m.area ?? "").toLowerCase().includes(q)
    );
  });
};

/** Seletores para filtros */
export const selAreasDisponiveis = createSelector(
  [selMesas],
  (mesas): string[] => {
    // As areas sao agora baseadas no campo model dos checkpads
    // Os valores possiveis sao: Mesa, Barraca, Apartamento
    return Array.from(new Set(mesas.map((m) => m.area).filter(Boolean))) as string[];
  }
);

// Thunk para buscar áreas completas
export const fetchAreas = createAsyncThunk("mesas/fetchAreas", async () => {
  const r = await fetch(`${API}/areas`);
  if (!r.ok) throw new Error("Erro ao carregar áreas");
  const data = await r.json();
  return Array.isArray(data) ? data : Object.values(data);
});

// Selector para obter areas completas do endpoint /areas  
export const selAreasFull = (s: RootState): AreaCompleta[] => s.mesas.areasFull ?? [];

export const selAtendentesDisponiveis = createSelector(
  [selMesas],
  (mesas): string[] => {
    return Array.from(new Set(mesas.map((m) => m.atendente).filter(Boolean))) as string[];
  }
);

/** Seletores para o select Local de entrega */
/** Se ja maneja status, mostra so mesas livres nao ocupadas */
export const selMesasParaEntregaLivres = createSelector(
  [selMesas],
  (mesas) => {
    return mesas
      .filter((m) => m.status === "disponiveis") // apenas mesas realmente livres
      .map((m) => ({
        value: String(m.numero), // usar identificador para o valor
        label: `Mesa ${m.numero}${m.area ? ` — ${m.area}` : ""}`,
      }));
  }
);

/** Se ainda nao usa status, mostra todas as mesas */
export const selMesasParaEntregaTodas = (s: RootState) => {
  const lista = s.mesas.lista;
  return lista.map((m) => ({
    value: String(m.numero), // usar identificador para o valor
    label: `Mesa ${m.numero}${m.area ? ` — ${m.area}` : ""}`,
  }));
};
