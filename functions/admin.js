import { CONFIG } from "../config.js"

export async function onRequest(context) {

  const request = context.request
  const url = new URL(request.url)

  // 简单密码验证
  const pwd = url.searchParams.get("pwd")

  if (pwd !== CONFIG.password) {
    return new Response("Unauthorized", { status: 401 })
  }

  return new Response(`
    <html>
    <body style="font-family:sans-serif">
      <h2>DoH 管理面板</h2>

      <h3>当前配置</h3>
      <pre>${JSON.stringify(CONFIG, null, 2)}</pre>

      <p>提示：修改 config.js 后重新部署即可生效</p>
    </body>
    </html>
  `, {
    headers: { "content-type": "text/html" }
  })
}
