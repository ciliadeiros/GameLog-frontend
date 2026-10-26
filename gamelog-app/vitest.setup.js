import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Vitest não expõe `afterEach` global por padrão: limpar o DOM explicitamente.
afterEach(() => {
  cleanup();
});
