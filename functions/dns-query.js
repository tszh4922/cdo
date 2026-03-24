export async function onRequest(context) {

  const request = context.request;
  const url = new URL(request.url);

  if (url.pathname !== "/dns-query") {
    return new Response("DoH OK");
  }

  // ===== 上游DNS池（核心）
  const upstreams = [
    "https://1.1.1.1/dns-query",
    "https://cloudflare-dns.com/dns-query",
    "https://dns.google/dns-query"
  ];

  // ===== 并发选最快（关键优化）
  async function fetchFastest(urls, options) {
    return Promise.any(
      urls.map(u =>
        fetch(u, options).then(r => {
          if (!r.ok) throw new Error("fail");
          return r;
        })
      )
    );
  }

  // ===== 广告过滤规则（可选）
  let rulesText = "";
  try {
    const r = await fetch(new URL("/data/rules.txt", request.url));
    rulesText = await r.text();
  } catch(e){}

  function isBlocked(domain) {
    return rulesText.split("\n").some(rule=>{
      rule = rule.trim();
      if(rule.startsWith("||")) {
        return domain.endsWith(rule.replace("||","").replace("^",""));
      }
      return false;
    });
  }

  try {

    const name = url.searchParams.get("name");
    const type = url.searchParams.get("type") || "A";

    // ===== JSON DoH（浏览器用）
    if (request.method === "GET" && name) {

      if (isBlocked(name)) {
        return new Response(JSON.stringify({
          Answer: [{ data: "0.0.0.0" }]
        }), {
          headers: {
            "content-type": "application/dns-json",
            "access-control-allow-origin": "*"
          }
        });
      }

      const resp = await fetchFastest(
        upstreams.map(u => `${u}?name=${name}&type=${type}`),
        { headers: { "accept": "application/dns-json" } }
      );

      return new Response(await resp.text(), {
        headers: {
          "content-type": "application/dns-json",
          "access-control-allow-origin": "*"
        }
      });
    }

    // ===== 标准 DoH（v2rayNG / Clash）
    const dns = url.searchParams.get("dns");

    if (request.method === "GET" && dns) {

      const resp = await fetchFastest(
        upstreams.map(u => `${u}?${url.searchParams}`),
        { headers: { "accept": "application/dns-message" } }
      );

      return new Response(await resp.arrayBuffer(), {
        headers: { "content-type": "application/dns-message" }
      });
    }

    // ===== POST（高级客户端）
    if (request.method === "POST") {

      const resp = await fetchFastest(
        upstreams,
        {
          method: "POST",
          headers: { "content-type": "application/dns-message" },
          body: request.body
        }
      );

      return new Response(await resp.arrayBuffer(), {
        headers: { "content-type": "application/dns-message" }
      });
    }

    return new Response("Bad Request", { status: 400 });

  } catch (e) {

    // ===== fallback（兜底）
    const fallback = await fetch("https://cloudflare-dns.com/dns-query", {
      method: request.method,
      headers: request.headers,
      body: request.body
    });

    return new Response(await fallback.arrayBuffer(), {
      headers: { "content-type": "application/dns-message" }
    });
  }
}
