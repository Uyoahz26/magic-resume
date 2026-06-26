# Magic Resume 部署指南 (Cloudflare Workers + D1 + 腾讯云 COS)

## 一、前置准备

1. Cloudflare 账号
2. 腾讯云账号 + 已开通 COS + 创建存储桶(私有读写)
3. DeepSeek API Key
4. Node.js 20+,pnpm 10+

## 二、本地初始化

```bash
pnpm install
cp .env.example .env   # 可选,本地调试用
```

## 三、创建 Cloudflare D1

```bash
# 登录 Cloudflare
pnpm dlx wrangler login

# 创建 D1 数据库
pnpm dlx wrangler d1 create magic-resume
# 把返回的 database_id 填到 wrangler.toml 的 [[d1_databases]] 段

# 应用 migration
pnpm dlx wrangler d1 migrations apply DB --remote
# 本地开发:
pnpm dlx wrangler d1 migrations apply DB --local
```

## 四、创建第一个管理员

注册任意账号 → 在 D1 里把该 user_id 加入 admins 表:

```bash
pnpm dlx wrangler d1 execute DB --remote --command \
  "INSERT INTO admins(user_id, granted_at) VALUES('<你的-user-id>', $(date +%s000));"
```

或者写一个一次性脚本 `scripts/create-admin.ts`。

## 五、注入 Secrets

```bash
pnpm dlx wrangler secret put DEEPSEEK_API_KEY
# 粘贴你的 DeepSeek API key

pnpm dlx wrangler secret put TENCENT_COS_SECRET_ID
# 腾讯云 API 密钥 ID

pnpm dlx wrangler secret put TENCENT_COS_SECRET_KEY
# 腾讯云 API 密钥 Key
```

## 六、配置腾讯云 COS

1. 创建一个私有读写 Bucket(例:`magic-resume-1300000000`)
2. 区域选上海/北京/广州都行,记录 region
3. 修改 `wrangler.toml` 的 `[vars]`:
   ```toml
   TENCENT_COS_REGION = "ap-shanghai"
   TENCENT_COS_BUCKET = "magic-resume-1300000000"
   ```
4. (可选) 在腾讯云 CAM 给这个子账号授权该 Bucket 的 `PutObject / GetObject / DeleteObject / HeadObject / ListBucket`

## 七、配置 DeepSeek Model (可选)

`wrangler.toml` 默认 `DEEPSEEK_MODEL = "deepseek-chat"`,如要换模型(如 deepseek-reasoner)直接改 vars 重部署。

## 八、部署

```bash
pnpm build       # 本地构建(可选,wrangler 也会构建)
pnpm dlx wrangler deploy
```

部署成功后 wrangler 会输出 Worker URL,即可访问。

## 九、首次验证清单

- [ ] 打开首页能看到 Hero/Features/FAQ/CTASection/Footer,极简黑白风
- [ ] 点击「免费注册」能创建账号
- [ ] 注册后自动登录,跳到 `/app/dashboard`
- [ ] 创建一份简历 → 自动保存到 COS(腾讯云控制台 COS 对象能看到 `users/.../resumes/...json`)
- [ ] 退出登录 → 重新登录 → 简历还在
- [ ] 在工作台点「AI 润色」,文本流式出现 → D1 `ai_quota.used` + 1
- [ ] 在另一台设备登录同一账号,看到相同简历
- [ ] 管理员账号访问 `/app/admin` 看到统计页 → 进入用户列表能封禁/改配额
- [ ] 封禁后该账号再访问 dashboard 跳转 403

## 十、Wrangler 常用命令

```bash
# 查看 secrets
pnpm dlx wrangler secret list

# 查看日志
pnpm dlx wrangler tail

# 数据库查询
pnpm dlx wrangler d1 execute DB --remote --command "SELECT COUNT(*) FROM users;"

# 本地调试 (使用本地 D1 + miniflare)
pnpm dlx wrangler dev
```

## 十一、安全提示

- **永远不要**把 SECRET 写在 `wrangler.toml` 或 git 里
- 腾讯云 COS Bucket 保持私有读写,所有访问走 Worker 网关
- 注册接口已做时序枚举防护(无论用户是否存在都做一次 bcrypt 比较)
- 管理员后台路由有 admin 表检查,普通用户访问会被踢回 `/app/dashboard`
- 封禁会立即清空该用户的所有 session
- 生产环境建议加上 CSRF 防护(本项目 v1 简化,后续阶段补)
