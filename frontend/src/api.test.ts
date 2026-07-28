// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";

import { api } from "./api";

describe("cliente público da API", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("consulta o dashboard sem cabeçalho de autenticação", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ counts: {} }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    await api("/dashboard");
    const headers = fetchMock.mock.calls[0][1].headers as Headers;
    expect(headers.has("Authorization")).toBe(false);
  });
});
