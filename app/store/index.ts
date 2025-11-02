import { configureStore } from "@reduxjs/toolkit";
import comandasReducer from "../features/comandas/comandas.slice";
import mesasReducer from "../features/mesas/mesas.slice";

export const store = configureStore({
  reducer: {
    comandas: comandasReducer,
    mesas: mesasReducer,
  },
  devTools: process.env.NODE_ENV !== "production",
});

// Definição de tipos TypeScript
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
