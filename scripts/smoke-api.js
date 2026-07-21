const API_URL = (process.env.API_URL || "http://localhost:4000").replace(/\/$/, "");
const password = process.env.SMOKE_PASSWORD || "SmokeTest123";
const email = process.env.SMOKE_EMAIL || `smoke-${Date.now()}@example.com`;

async function request(path, { token, method = "GET", body } = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = response.status === 204 ? null : await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`${method} ${path} failed with ${response.status}: ${JSON.stringify(payload)}`);
  }
  return payload;
}

async function main() {
  const health = await request("/health");
  if (health.status !== "ok") throw new Error("Healthcheck did not return ok");

  const auth = await request("/api/auth/register", {
    method: "POST",
    body: { name: "Smoke Tester", email, password },
  });

  const token = auth.token;
  await request("/api/auth/me", { token });

  const { categories } = await request("/api/categories", { token });
  const category = categories.find((item) => item.type === "EXPENSE" || item.type == null);
  if (!category) throw new Error("No expense category available");

  await request("/api/transactions", {
    token,
    method: "POST",
    body: {
      type: "EXPENSE",
      amount: 12.34,
      description: "Smoke test expense",
      categoryId: category.id,
    },
  });

  await request(`/api/summary/monthly?month=${new Date().toISOString().slice(0, 7)}&timezone=UTC`, { token });
  console.log(`Smoke test passed against ${API_URL} with ${email}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
