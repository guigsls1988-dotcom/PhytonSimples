// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";

import { token } from "./api";

describe("sessão", () => {
  afterEach(() => sessionStorage.clear());

  it("lê o token JWT da sessão", () => {
    sessionStorage.setItem("access_token", "jwt-de-teste");
    expect(token()).toBe("jwt-de-teste");
  });

  it("retorna null sem uma sessão autenticada", () => {
    expect(token()).toBeNull();
  });
});
