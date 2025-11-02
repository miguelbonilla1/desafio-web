export type Produto = {
  id: string;
  nome: string;
  preco: number;
  categoria: string; // ex: "Assados", "Bebidas", etc.
};

export const CATEGORIAS = [
  "Mais vendidas",
  "Assados",
  "Espetos",
  "Executivos",
  "Parmegianas",
  "Entradas",
  "Guarnições",
  "Porções",
  "Bebidas",
];

export const PRODUTOS: Produto[] = [
  { id: "p1", nome: "Picanha na pedra", preco: 144.99, categoria: "Assados" },
  { id: "p2", nome: "Carne de sol na pedra 600g", preco: 105.99, categoria: "Assados" },
  { id: "p3", nome: "Misto Carne de sol e picanha 500g", preco: 120.99, categoria: "Assados" },
  { id: "p4", nome: "Picanha Fatiada", preco: 144.99, categoria: "Assados" },
  { id: "p5", nome: "Picanha tradicional assada no bafo 100g", preco: 17.99, categoria: "Assados" },
  { id: "p6", nome: "Costela de porco", preco: 45.99, categoria: "Assados" },
  { id: "p7", nome: "Maminha 100g", preco: 15.99, categoria: "Assados" },
  { id: "p8", nome: "Refeição", preco: 68.0, categoria: "Assados" },

  { id: "b1", nome: "Coca-cola lata", preco: 7.99, categoria: "Bebidas" },
  { id: "b2", nome: "Água 500ml", preco: 4.99, categoria: "Bebidas" },
];
