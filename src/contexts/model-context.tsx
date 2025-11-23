"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import type { ModelConfig, Provider } from "@/lib/models";
import { DEFAULT_MODEL } from "@/lib/models";

interface ModelContextValue {
  selectedModel: ModelConfig;
  setSelectedModel: (model: ModelConfig) => void;
  provider: Provider;
  modelId: string;
}

const ModelContext = createContext<ModelContextValue | undefined>(undefined);

export function ModelProvider({ children }: { children: ReactNode }) {
  const [selectedModel, setSelectedModelState] =
    useState<ModelConfig>(DEFAULT_MODEL);

  const setSelectedModel = useCallback((model: ModelConfig) => {
    setSelectedModelState(model);
  }, []);

  const value: ModelContextValue = {
    selectedModel,
    setSelectedModel,
    provider: selectedModel.provider,
    modelId: selectedModel.id,
  };

  return (
    <ModelContext.Provider value={value}>{children}</ModelContext.Provider>
  );
}

export function useModel() {
  const context = useContext(ModelContext);
  if (context === undefined) {
    throw new Error("useModel must be used within a ModelProvider");
  }
  return context;
}
