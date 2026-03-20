import { CONFIG } from "../config.js"

export async function onRequest(context) {

  const request = context.request
  const url = new URL(request.url)

  if (url.pathname !== "/api/dns") {
    return new Response("Pro DNS Running")
  }

  const upstreams = [
    "https://cloudflare-dns.com/dns-query",
    "https://dns.google/dns-query",
    "https://1.0.0.1/dns-query"
  ]

  // 打乱顺序（负载均衡）
  const shuffled = upstreams.sort(() => 0.5 - Math.random())

  let response

  for (let target of shuffled) {
    try {

      if (request.method === "GET") {

        const dns = url.searchParams.get("dns")

        response = await fetch(target + "?dns=" + dns, {
          headers: { "accept": "application/dns-message" },
          cf: { cacheTtl: 60 }
        })

      } else {

        response = await fetch(target, {
          method: "POST",
          headers: { "content-type": "application/dns-message" },
          body: request.body
        })
      }

      if (response.ok) break

    } catch (e) {
      continue
    }
  }

  return new Response(await response.arrayBuffer(), {
    headers: {
      "content-type": "application/dns-message"
    }
  })
}
