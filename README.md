# 🍽️ Sistema de Gestão de Restaurante - Desafio Pigz

**Painel de gerenciamento completo para restaurantes** com funcionalidades de mesas, comandas e otimizações de performance. Desenvolvido com **Next.js 16**, **TypeScript**, **Redux Toolkit** e **Tailwind CSS**.

## ✅ **Funcionalidades Principais**

- **Visualização de Mesas**: Dashboard completo com status, filtros e busca
- **Visualização de Comandas**: Lista completa com dados detalhados
- **Criação de Comandas**: Modal com validação e integração
- **Notificações Visuais**: Alertas para mesas +15min sem pedido
- **Filtros Avançados**: Por status, atendente, área e busca
- **Virtualização**: React-window para +500 mesas
- **Débouncing**: Busca otimizada com 300ms delay
- **TypeScript**: Tipagem completa em todo projeto
- **Redux Toolkit**: Estado global gerenciado
- **API Mock**: JSON Server simulando backend

## **Funcionalidades Implementadas**

### **Dashboard de Mesas**

- **Visualização em Grid**: Layout com status visual
- **Informações Completas**: Número, cliente, atendente, tempo, valor total
- **Status Dinâmico**: Disponível, Ocupada, Reservada, Inativa
- **Alertas Automáticos**: Destaque visual para mesas +15min sem pedido
- **Interatividade**: Click para criar comanda ou visualizar detalhes

### 🧾 **Sistema de Comandas**

- **Visualização**: Lista de todas as comandas ativas
- **Dados Detalhados**: Cliente, área, tempo, valor, quantidade de pessoas
- **Criação de Comandas**: Modal completo com validação
- **Integração com Mesas**: Seleção automática de mesa disponível
- **Identificação Flexível**: Por nome, telefone ou ID customizado

### 🔍 **Sistema de Filtros e Busca**

- **Filtros Múltiplos**: Status, atendente, área (todos independentes)
- **Busca em Tempo Real**: Debounce otimizado de 300ms
- **Busca Inteligente**: Por número da mesa, nome do cliente, atendente
- **Estado Persistente**: Filtros mantidos na navegação

### ⚡ **Otimizações de Performance**

- ✅ **Virtualização**: `react-window` para listas grandes (+500 itens)
- ✅ **Debouncing**: Busca com delay para evitar chamadas excessivas
- ✅ **Lazy Loading**: Componentes carregados sob demanda
- ✅ **Code Splitting**: Páginas separadas em chunks

## 🛠️ **Arquitetura e Tecnologias**

### **Stack Principal**

- **Framework**: Next.js 16.0.0 + Turbopack (desenvolvimento rápido)
- **Linguagem**: TypeScript 5+ (tipagem completa)
- **Styling**: Tailwind CSS 3+ (design system consistente)
- **Estado**: Redux Toolkit + RTK Query (gerenciamento robusto)
- **Performance**: React-Window (virtualização)
- **API**: JSON Server (mock backend realista)

### **Decisões Arquiteturais**

#### **1. Estrutura de Componentes**

```
📁 components/
├── 📁 cards/           # Componentes de cartão (átomo)
├── 📁 common/          # Componentes base reutilizáveis
├── 📁 dashboard/       # Componentes de visualização (organismo)
├── 📁 layout/          # Estrutura da aplicação (template)
└── 📁 modals/          # Componentes de modal (molécula)
```

#### **2. Gerenciamento de Estado Redux**

```
📁 features/
├── 📁 mesas/
│   ├── mesas.slice.ts     # Actions, reducers, selectors
│   └── types.ts           # Tipagens específicas
└── 📁 comandas/
    ├── comandas.slice.ts  # Estado de comandas
    └── types.ts           # Tipagens específicas
```

#### **3. Fluxo de Dados**

```
API Mock (JSON Server) → Redux Actions → Redux State → React Components
                      ↑                               ↓
               User Interactions ← UI Updates ← Selectors
```

## 📦 **Instalação e Execução**

### **Pré-requisitos**

- Node.js 18+
- npm/yarn/pnpm

### **Comandos de Setup**

```bash
# 1. Instalar dependências
npm install

# 2. Iniciar desenvolvimento (inclui API mock)
npm run dev

# 3. Ou iniciar separadamente:
# Terminal 1: Next.js
npx next dev

# Terminal 2: API Mock
npx json-server --watch app/mocks/db.json --port 4000
```

### **URLs da Aplicação**

- **Frontend**: http://localhost:3000
- **API Mock**: http://localhost:4000
- **API Endpoints**:
  - `GET /checkpads` - Dados das mesas
  - `GET /ordersheets` - Dados das comandas
  - `GET /areas` - Áreas do restaurante

## 🏗️ **Estrutura Detalhada do Projeto**

```
� desafio-pigz/
├── 📁 app/                    # Next.js App Router
│   ├── 📁 components/
│   │   ├── 📁 cards/
│   │   │   ├── CardMesa.tsx          # Card individual da mesa
│   │   │   └── CardOrdersheet.tsx    # Card individual da comanda
│   │   ├──
│   │   │   └── Pagination.tsx        # Componente de paginação
│   │   ├── 📁 dashboard/
│   │   │   ├── ComandasVista.tsx     # View das comandas
│   │   │   ├── MesasView.tsx         # View principal das mesas
│   │   │   └── MesasGridVirtualized.tsx # Grid virtualizado
│   │   ├── 📁 layout/
│   │   │   ├── ActionBar.tsx         # Barra de ações e filtros
│   │   │   ├── FooterBar.tsx         # Rodapé da aplicação
│   │   │   ├── Sidebar.tsx           # Menu lateral
│   │   │   └── TopBar.tsx            # Cabeçalho
│   │   └── 📁 modals/
│   │       └── NovaComandaDrawer.tsx # Modal nova comanda
│   ├── 📁 features/
│   │   ├── 📁 comandas/
│   │   │   └── comandas.slice.ts     # Redux slice comandas
│   │   └── 📁 mesas/
│   │       └── mesas.slice.ts        # Redux slice mesas
│   ├── 📁 mocks/
│   │   ├── db.json                   # Dados mock JSON Server
│   │   └── produtos.ts               # Produtos para comandas
│   ├── 📁 store/
│   │   ├── index.ts                  # Store Redux
│   │   └── hooks.ts                  # Hooks tipados
│   ├── 📁 pedido/[id]/
│   │   └── page.tsx                  # Página detalhes pedido
│   ├── layout.tsx                    # Layout principal
│   ├── page.tsx                      # Homepage
│   ├── providers.tsx                 # Providers React
│   └── globals.css                   # Estilos globais
├── 📁 public/                        # Assets estáticos
├── package.json                      # Dependências
├── tsconfig.json                     # Config TypeScript
├── tailwind.config.ts                # Config Tailwind
├── next.config.ts                    # Config Next.js
└── README.md                         # Documentação
```

## 🚀 **Scripts e Comandos**

```bash
# Desenvolvimento
npm run dev              # Next.js + API mock
npm run dev:next         # Apenas Next.js
npm run api              # Apenas JSON Server

# Produção
npm run build            # Build otimizado
npm run start            # Servidor produção
npm run preview          # Preview da build

**Tecnologias**: Next.js 16 • TypeScript • Redux Toolkit • Tailwind CSS • React-Window • JSON Server

**Tempo de desenvolvimento**: Otimizado para demonstrar expertise técnica e capacidade de entrega de soluções completas.
```
