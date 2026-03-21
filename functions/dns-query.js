export async function onRequest(context) {

  const request = context.request;
  const url = new URL(request.url);

  if (url.pathname !== "/dns-query") {
    return new Response("DoH OK");
  }

  const upstream = "https://cloudflare-dns.com/dns-query";

  try {

    // ===== JSON DoH（浏览器测试用）
    const name = url.searchParams.get("name");

    if (request.method === "GET" && name) {

      const type = url.searchParams.get("type") || "A";

      const resp = await fetch(
        `${upstream}?name=${name}&type=${type}`,
        {
          headers: {
            "accept": "application/dns-json"
          }
        }
      );

      return new Response(await resp.text(), {
        headers: {
          "content-type": "application/dns-json",
          "access-control-allow-origin": "*"
        }
      });
    }

    // ===== 标准 DoH（v2rayNG 用）
    if (request.method === "GET" && url.searchParams.get("dns")) {

      const resp = await fetch(
        `${upstream}?${url.searchParams}`,
        {
          headers: {
            "accept": "application/dns-message"
          }
        }
      );

      return new Response(await resp.arrayBuffer(), {
        headers: {
          "content-type": "application/dns-message"
        }
      });
    }

    // ===== POST（Clash / 高级客户端）
    if (request.method === "POST") {

      const resp = await fetch(upstream, {
        method: "POST",
        headers: {
          "content-type": "application/dns-message"
        },
        body: request.body
      });

      return new Response(await resp.arrayBuffer(), {
        headers: {
          "content-type": "application/dns-message"
        }
      });
    }

    return new Response("Bad Request", { status: 400 });

  } catch (e) {
    return new Response("DNS Error", { status: 500 });
  }
}
