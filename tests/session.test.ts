import { describe, expect, it } from "vitest";

import { decodeSession, encodeSession } from "../lib/session";

describe("session encoding", () => {
  it("round-trips the session payload", async () => {
    const payload = {
      userId: "user-1",
      companyId: "company-1",
      email: "admin@presta.local",
      role: "ADMIN",
    };

    await expect(decodeSession(await encodeSession(payload))).resolves.toEqual(payload);
  });

  it("returns null for invalid values", async () => {
    await expect(decodeSession("not-a-session")).resolves.toBeNull();
  });
});
