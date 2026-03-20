export let CONFIG = {

  password: "587412@tll", // 后台密码（一定要改）

  upstreams: {
    global: [
      "https://cloudflare-dns.com/dns-query",
      "https://dns.google/dns-query"
    ],
    backup: [
      "https://1.0.0.1/dns-query"
    ]
  },

  blocklist: [
    "doubleclick.net",
    "ads.google.com",
    "tracking."
  ],

  chinaDomains: [
    ".cn",
    "baidu.com",
    "qq.com"
  ],

  cacheTTL: 120
}
