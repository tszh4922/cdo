export async function onRequest(context) {

  const request = context.request
  const url = new URL(request.url)

  // 入口检测
  if (url.pathname !== "/dns-query") {
    return new Response("DoH Server Running")
  }

  // 上游DNS池（稳定版）
  const upstreams = [
    "https://cloudflare-dns.com/dns-query",
    "https://dns.google/dns-query",
    "https://1.0.0.1/dns-query"
  ]

  // 随机选一个（负载均衡）
  function getUpstream() {
    return upstreams[Math.floor(Math.random() * upstreams.length)]
  }

  let response

  try {

    // GET 请求（浏览器/部分客户端）
    if (request.method === "GET") {

      const dns = url.searchParams.get("dns")

      if (!dns) {
        return new Response("Bad Request", { status: 400 })
      }

      response = await fetch(getUpstream() + "?dns=" + dns, {
        headers: {
          "accept": "application/dns-message"
        },
        cf: {
          cacheTtl: 120
        }
      })

    }

    // POST 请求（标准DoH）
    else if (request.method === "POST") {

      response = await fetch(getUpstream(), {
        method: "POST",
        headers: {
          "content-type": "application/dns-message"
        },
        body: request.body
      })
    }

  } catch (e) {

    // fallback（兜底）
    response = await fetch("https://cloudflare-dns.com/dns-query", {
      method: request.method,
      headers: request.headers,
      body: request.body
    })
  }

  return new Response(await response.arrayBuffer(), {
    headers: {
      "content-type": "application/dns-message",
      "cache-control": "max-age=120"
    }
  })
}
