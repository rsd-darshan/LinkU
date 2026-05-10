import { describe, expect, it } from "vitest";
import { badRequest, forbidden, notFound, ok, unauthorized } from "./http";

describe("http helpers", () => {
  it("ok sets JSON body and status", async () => {
    const res = ok({ n: 1 }, 201);
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ n: 1 });
  });

  it("badRequest includes optional code", async () => {
    const res = badRequest("bad", "ERR");
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "bad", code: "ERR" });
  });

  it("maps auth errors", async () => {
    expect((await unauthorized().json()).error).toBeTruthy();
    expect((await forbidden().json()).error).toBeTruthy();
    expect((await notFound().json()).error).toBeTruthy();
  });
});
