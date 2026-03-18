export async function onRequest(context) {

  const request = context.request
  const url = new URL(request.url)

  if (url.pathname !== "/dns-query") {
    return new Response("DoH DNS Server Running")
  }

  let response

  if (request.method === "GET") {

    const query = url.searchParams.get("dns")

    if (!query) {
      return new Response("Bad Request", { status: 400 })
    }

    response = await fetch(
      "https://cloudflare-dns.com/dns-query?dns=" + query,
      {
        headers: {
          "accept": "application/dns-message"
        }
      }
    )

  } else if (request.method === "POST") {

    response = await fetch(
      "https://cloudflare-dns.com/dns-query",
      {
        method: "POST",
        headers: {
          "content-type": "application/dns-message"
        },
        body: request.body
      }
    )

  }

  return new Response(await response.arrayBuffer(), {
    headers: {
      "content-type": "application/dns-message"
    }
  })
}
