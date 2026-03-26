export async function onRequest(context) {
  const request = context.request
  const url = new URL(request.url)

  // ✅ 伪装首页（防封）
  if (url.pathname === "/") {
    return fetch("https://www.cloudflare.com")
  }

  // ✅ 只允许 tosh
  if (url.pathname !== "/tosh") {
    return new Response("Not Found", { status: 404 })
  }

  // ✅ 限制方法
  if (request.method !== "GET" && request.method !== "POST") {
    return new Response("Forbidden", { status: 403 })
  }

  // ✅ 多上游（防挂）
  const upstreams = [
    "https://1.1.1.1/dns-query",
    "https://dns.google/dns-query"
  ]

  const headers = new Headers(request.headers)
  headers.set("user-agent", "Mozilla/5.0")

  for (let upstream of upstreams) {
    try {
      const resp = await fetch(upstream, {
        method: request.method,
        headers: headers,
        body: request.body,
        cf: {
          // 👉 这里填你的优选域名（没有可以先删掉这一行）
          resolveOverride: "cdn.tszh.us.ci",
          cacheTtl: 300
        }
      })

      if (resp.ok) return resp
    } catch (e) {}
  }

  return new Response("DNS Error", { status: 502 })
}
