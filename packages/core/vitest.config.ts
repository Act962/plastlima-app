import { baseVitestConfig } from "@plastlima-app/config/vitest";

/**
 * `core` é código puro: testes unitários rápidos, em paralelo, sem setup. Usa a
 * base sem alterações — a cobertura alta esperada aqui (spec §9) sai de `--coverage`.
 */
export default baseVitestConfig;
