async function requestJson(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message || "Request failed");
  }

  return payload.data;
}

export function login(values) {
  return requestJson("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(values),
  });
}

export function register(values) {
  return requestJson("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(values),
  });
}

export function me() {
  return requestJson("/api/auth/me", {
    method: "GET",
  });
}

export function logout() {
  return requestJson("/api/auth/logout", {
    method: "POST",
  });
}
