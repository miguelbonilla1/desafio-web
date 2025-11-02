"use client";

import { Provider } from "react-redux";
import { store } from "./store"; // caminho relativo para o store do projeto

export default function Providers({ children }: { children: React.ReactNode }) {
  return <Provider store={store}>{children}</Provider>;
}
