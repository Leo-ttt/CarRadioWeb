# Automotive Electronics Official Website + Knowledge Base

**Repository:** [github.com/Leo-ttt/Official-Website](https://github.com/Leo-ttt/Official-Website)

[English](#english) | [中文](#中文)

---

<a id="english"></a>

## English

A modern knowledge base management system for automotive electronics companies. Product showcase, technical documentation, installation guides, and AI-powered Q&A.

Built for aftermarket products: car head units, CarPlay/Android Auto systems, etc.

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript |
| Build | Vite 7 |
| Styling | Tailwind CSS 3.4 + CSS Variables |
| Maps (admin) | Leaflet + OpenStreetMap (system settings map picker) |
| UI | PrimeReact 10 + Custom Components |
| State | TanStack Query + React Context |
| Routing | React Router DOM 7 |
| Animation | Framer Motion |
| i18n | react-i18next (en / zh) |
| Backend | Node.js + Express 4 + TypeScript |
| Database | MongoDB + Mongoose 8 |
| Cache | Redis (ioredis) |
| Storage | Alibaba Cloud OSS |
| AI | OpenAI SDK / DeepSeek |
| Monitoring | Sentry |
| Logging | Pino |

### Features

#### Public Frontend

- Multi-language support (English / Chinese)
- Knowledge base with document search
- Product catalog with vehicle compatibility
- Video tutorials (YouTube / Bilibili embed)
- AI assistant with knowledge-indexed answers
- Document feedback system with admin replies
- Contact form with DingTalk notification
- SEO optimized (JSON-LD, Open Graph, sitemap.xml, hreflang)
- Dark / Light theme toggle
- Responsive design
- **Footer map**: embedded map in the global footer — when the **About** page is enabled (nav entry), the map shows only on `/about`; when About is **disabled**, the same map appears on `/contact` so the location stays visible
- **Tools** (optional nav): Audio EQ reference (`/audio-equalizer`), audio file generator (`/audio-generator`)

#### Admin Panel (`/admin`)

| Module | Description |
|--------|-------------|
| Document Management | Rich text editor, video tutorials, structured articles, draft system |
| Product Management | Product CRUD, vehicle compatibility matrix |
| Category Management | Hierarchical categories with sorting |
| Hero Banners | Homepage banner carousel configuration |
| AI Configuration | 18+ AI providers, custom model, usage tracking |
| Visitor Analytics | Geo-location, device stats, page views dashboard |
| User Management | Invite admins by email, fine-grained permissions (super_admin only) |
| Audit Log | Operation history tracking (super_admin only, 30-day retention) |
| Feedback Management | Document feedback with admin replies, user avatars |
| Announcements | Site-wide announcements |
| Site Settings | Site name, description, copyright, social links, **default map** (Leaflet picker + OSM tiles + optional Nominatim reverse geocode for address text, zh/en), allow Chinese UI toggle on the public site |
| SEO Settings | Per-page meta tags, keywords, Open Graph |
| Module Settings | Toggle frontend modules on/off, **Forum** (Flarum deploy + plugin management) |
| Storage Settings | Alibaba Cloud OSS configuration |
| CAN Bus Settings | Vehicle CAN bus parameter management |
| **Forum (Flarum)** | One-click Docker deploy, install/uninstall extensions, one-click fix, view logs; supports self-hosted extensions (e.g. Notify Push from GitHub) |
| **Compliance & Leads** | Cookie banner + legal page paths (privacy/terms/disclaimer); editable legal HTML (en/zh); legal version registry (privacy/terms/disclaimer); newsletter subscribers + CSV; **campaigns** (draft / schedule / send now, SMTP + auto-unsubscribe footer) |
| **Notifications** | Message push / SMTP settings for transactional and campaign email (where implemented) |

**Public API (no auth):** `GET /api/legal-versions/public?docType=privacy|terms|disclaimer`, `GET /api/legal-versions/content/public?docType=…&locale=en|zh`, `POST /api/newsletter/subscribe`, `POST /api/newsletter/unsubscribe` (body: `{ token }`). Newsletter confirmation and campaigns use SMTP when enabled under **Notifications** in the admin panel.

### Authentication

Admin login uses **email verification code + password**. No external OAuth dependencies required.

#### First Deployment

1. Configure SMTP in `backend/config.env` for sending verification codes
2. Visit `/admin` and click "Register"
3. Enter email → receive verification code → set password
4. **The first registered user automatically becomes `super_admin`** (cannot be deleted)
5. Subsequent registrations default to `admin` role, requiring super_admin approval

#### SMTP Configuration

Required for sending verification codes. Configure in `backend/config.env`:

| Variable | Description | Example |
|----------|-------------|---------|
| `SMTP_HOST` | SMTP server address | `smtp.163.com` |
| `SMTP_PORT` | SMTP port | `465` (SSL) or `587` (TLS) |
| `SMTP_SECURE` | Use SSL | `true` |
| `SMTP_USER` | SMTP username (usually email) | `your-email@163.com` |
| `SMTP_PASS` | Password or authorization code | Authorization code (not login password) |
| `SMTP_FROM` | Sender address | `noreply@example.com` |

**Common email providers:**

| Provider | SMTP Host | Notes |
|----------|-----------|-------|
| NetEase 163 | `smtp.163.com` | Requires authorization code |
| NetEase 126 | `smtp.126.com` | Requires authorization code |
| QQ Mail | `smtp.qq.com` | Requires authorization code |
| Gmail | `smtp.gmail.com` | Requires app password |
| Outlook | `smtp.office365.com` | Requires app password |
| Aliyun Enterprise | `smtp.aliyun.com` | Enterprise email |

> **Note:** For NetEase/QQ mail, enable SMTP service in email settings and get an authorization code (not your login password). For Gmail/Outlook, use an app-specific password.

#### Roles

| Role | Description |
|------|-------------|
| `super_admin` | Full access. Manage other admins, view audit logs |
| `admin` | Granular permissions assigned by super_admin |

#### Role-based access control (RBAC)

Permission strings are defined in `backend/src/config/permissions.ts` and stored on each `admin` user. `super_admin` bypasses all checks.

- **Page visibility (`pages:*`)** — Controls which sidebar items appear in `/admin` and prevents staying on a tab the user is not allowed to open (the UI redirects to the first allowed tab).
- **Resource permissions** — e.g. `documents:read`, `products:update`, `settings:read`. Protected management routes use the `requirePermission` middleware so the API returns **403** when the JWT user lacks the required permission.
- **Using a module fully** — Assign both the matching `pages:…` entry and the operations you need (`create` / `read` / `update` / `delete`, etc.) in **User Management**. Page-only access can show the screen but save actions may still be denied without resource permissions.
- **Public site** — Unauthenticated **GET** APIs used by the public frontend (e.g. published documents and products) generally remain open; administrative **writes** are what RBAC locks down.

### Project Structure

```
/
├── src/                    # Frontend React app
│   ├── components/         # Components (ui/ admin/ seo/ layout/ ai/)
│   ├── pages/              # Route pages
│   │   ├── admin/modules/  # Admin feature modules
│   │   └── knowledge/      # Knowledge base pages
│   ├── services/           # API client services
│   ├── hooks/              # Custom React Hooks
│   ├── contexts/           # React Context providers
│   ├── config/             # Routes, QueryClient, auth
│   ├── i18n/locales/       # Translation files
│   ├── types/              # TypeScript types
│   ├── styles/             # Global CSS + theme
│   └── utils/              # Utilities
├── backend/                # Express API server
│   └── src/
│       ├── routes/         # API routes (incl. forum)
│       ├── services/      # Business logic (incl. forumService)
│       ├── models/        # Mongoose schemas
│       ├── data/          # Static data (e.g. forumExtensions.ts)
│       ├── middleware/    # Auth, validation, audit log, visitor tracking
│       ├── config/        # OAuth (Passport.js), permissions, OSS
│       ├── jobs/          # Scheduled tasks
│       ├── scripts/       # Database migrations
│       └── utils/          # Logger, cache, image processing, JWT
├── scripts/                # Forum deploy (deploy-flarum.sh/ps1, cancel-deploy)
├── docker-compose.flarum.yml  # Flarum + MariaDB (optional)
├── public/                 # Static assets (robots.txt, OG images)
└── deploy-package/         # Deployment template
```

### Quick Start

#### Prerequisites

- Node.js >= 18
- MongoDB >= 6
- Redis (optional, falls back to in-memory cache)

#### Install

```bash
npm install
cd backend && npm install && cd ..
```

#### Environment Variables

```bash
cp .env.example .env.local
cp backend/config.env.example backend/config.env
```

**Backend** (`backend/config.env`):

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | JWT signing secret |
| `SESSION_SECRET` | Yes | Express session secret |
| `SMTP_HOST` | Yes | SMTP server for verification codes |
| `SMTP_PORT` | Yes | SMTP port (usually 465 for SSL) |
| `SMTP_SECURE` | Yes | Use SSL (`true`/`false`) |
| `SMTP_USER` | Yes | SMTP username (usually email) |
| `SMTP_PASS` | Yes | SMTP password or authorization code |
| `SMTP_FROM` | No | Sender address (defaults to SMTP_USER) |
| `OSS_ACCESS_KEY_ID` / `OSS_ACCESS_KEY_SECRET` | For file upload | Alibaba Cloud OSS keys |
| `OSS_BUCKET` / `OSS_REGION` / `OSS_ENDPOINT` | For file upload | OSS bucket config |
| `OPENAI_API_KEY` | For AI | OpenAI / DeepSeek API key |
| `CORS_ORIGIN` | Yes | Allowed origins (comma-separated) |
| `REDIS_URL` | No | Redis URL |
| `SENTRY_DSN` | No | Sentry DSN |
| `DINGTALK_WEBHOOK` / `DINGTALK_SECRET` | No | DingTalk notification bot |
| `HTTPS_PROXY` | No | HTTP proxy for China mainland dev |

**Frontend** (`.env.local`):

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | API base path (default: `/api`) |
| `VITE_SITE_URL` | Site URL for SEO structured data |
| `VITE_ENABLE_AI_ASSISTANT` | Enable AI chat (`true`/`false`) |
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps key (optional) |
| `VITE_SENTRY_DSN` | Frontend Sentry DSN (optional) |

#### Development

```bash
# Recommended: start both backend + frontend (backend starts first, frontend waits until backend is ready)
npm run dev:all

# Or run separately (two terminals):
npm run dev:backend   # Backend only (port 3000)
npm run dev           # Frontend only (port 3001; requires backend already running)
```

- `dev:all` uses `wait-on` to start the frontend only after the backend is listening on port 3000, avoiding proxy `ECONNREFUSED` on first load.
- Vite proxy: `/api` -> `localhost:3000`

#### Build & Commands

```bash
npm run build         # Build frontend + backend
npm run lint          # ESLint check
npm run lint:fix      # ESLint auto-fix
npm run format        # Prettier format
npm run type-check    # TypeScript check
npm run test:run      # Vitest single run
```

### API Routes

| Route | Description |
|-------|-------------|
| `/api/auth` | Authentication (login, register, verification codes, password reset) |
| `/api/users` | Admin user management (super_admin only) |
| `/api/documents` | Document CRUD, search |
| `/api/products` | Product management |
| `/api/categories` | Category management |
| `/api/upload` | File upload (OSS) |
| `/api/ai` | AI chat (18+ providers) |
| `/api/feedback` | Feedback system |
| `/api/document-feedback` | Document-level feedback with replies |
| `/api/visitors` | Visitor analytics |
| `/api/site-settings` | Site configuration |
| `/api/seo-settings` | SEO configuration |
| `/api/audit-logs` | Audit logs (super_admin only) |
| `/api/announcements` | Announcements |
| `/api/hero-banners` | Homepage banners |
| `/api/v1/forum/*` | Forum status, deploy, extensions (install/uninstall), one-click fix, logs (super_admin) |
| `/sitemap.xml` | Dynamic sitemap (no auth required) |

### SEO

| Feature | Detail |
|---------|--------|
| `robots.txt` | Blocks `/admin`, `/api` |
| `sitemap.xml` | Dynamic, includes all published documents + static pages |
| `SEOHead` | Per-page title / description / keywords |
| `hreflang` | Multi-language alternate links (en + x-default) |
| Open Graph | OG tags + default OG image (1200x630) |
| JSON-LD | Organization / Product / FAQ / Breadcrumb / Article schemas |

### Deployment

#### PM2

```bash
npm run build
cd backend && pm2 start dist/index.js --name your-app
```

#### Server Update (one-liner)

```bash
cd /var/www/your-project && git stash && git pull origin main && npm install && cd backend && npm install && cd .. && npm run build && pm2 restart your-app
```

#### Docker

```bash
cp .env.docker.example .env
docker-compose up -d
```

| Service | Image | Port | Description |
|---------|-------|------|-------------|
| `web` | Custom | 3000 | Node.js app |
| `mongo` | mongo:6 | 27017 | MongoDB |
| `redis` | redis:7-alpine | 6379 | Redis cache |
| `nginx` | nginx:alpine | 80/443 | Reverse proxy |

#### Forum (Flarum, optional)

The admin panel can one-click deploy a Flarum forum via Docker (`docker-compose.flarum.yml` + `.env.flarum`). After deployment, you can install/uninstall extensions (Flarum official + FoF + Afrux, etc.), filter by installed/not installed, run a one-click fix (permissions + cache + boot repair), and view Flarum logs. Self-developed extensions (e.g. [Notify Push](https://github.com/Leo-ttt/Notify-Push)) can be added to the list and installed from GitHub (VCS) without Packagist.

### License & permitted use

This repository may be **public** (open source) for transparency and learning. **Making source code public does not, by itself, grant you any license** to use, copy, modify, merge, publish, distribute, sublicense, sell, or create derivative works from this software.

**Any use beyond personal study** — including commercial use, redistribution, or deployment — **requires prior written permission from the copyright holder** (the repository owner), unless they have issued a separate written license.

See the [`LICENSE`](LICENSE) file in the repository root. If a separate license file is added later, that file governs where it applies.

---

<a id="中文"></a>

## 中文

面向汽车电子公司的现代化知识库管理系统，提供产品展示、技术文档、安装指南、AI 智能问答等功能。

适用于售后市场产品：车载主机、CarPlay/Android Auto 系统等。

### 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | React 19 + TypeScript |
| 构建工具 | Vite 7 |
| 样式 | Tailwind CSS 3.4 + CSS Variables |
| 地图（后台） | Leaflet + OpenStreetMap（系统设置中选点） |
| UI 组件 | PrimeReact 10 + 自定义组件 |
| 状态管理 | TanStack Query + React Context |
| 路由 | React Router DOM 7 |
| 动画 | Framer Motion |
| 国际化 | react-i18next (en / zh / ru) |
| 后端 | Node.js + Express 4 + TypeScript |
| 数据库 | MongoDB + Mongoose 8 |
| 缓存 | Redis (ioredis) |
| 文件存储 | 阿里云 OSS |
| AI 集成 | OpenAI SDK / DeepSeek |
| 错误监控 | Sentry |
| 日志 | Pino |

### 功能特性

#### 前台（公开页面）

- 多语言支持（英文 / 中文）
- 知识库文档搜索与浏览
- 产品目录 + 车辆兼容性查询
- 视频教程（YouTube / Bilibili 嵌入）
- AI 助手（基于知识库内容索引回答）
- 文档反馈系统（支持管理员回复）
- 联系表单（钉钉机器人通知）
- SEO 优化（JSON-LD 结构化数据、Open Graph、sitemap.xml、hreflang）
- 深色 / 浅色主题切换
- 响应式设计
- **页脚地图**：全站页脚嵌入地图；**关于我们**在后台启用时仅在 `/about` 显示；**关闭关于我们**后改为在 **`/contact`（联系我们）** 页脚显示，避免无入口时地图消失
- **工具页**（可选导航）：音频均衡器参考 (`/audio-equalizer`)、音频文件生成器 (`/audio-generator`)

#### 管理后台 (`/admin`)

| 模块 | 说明 |
|------|------|
| 文档管理 | 富文本编辑器、视频教程、结构化文章、草稿系统 |
| 产品管理 | 产品增删改查、车辆兼容性矩阵 |
| 分类管理 | 层级分类、排序 |
| 首页横幅 | 轮播图配置 |
| AI 配置 | 18+ AI 供应商、自定义模型、用量追踪 |
| 访客分析 | 地理位置、设备统计、页面浏览量仪表盘 |
| 用户管理 | 邮箱邀请管理员、细粒度权限控制（仅超管） |
| 操作日志 | 操作历史记录追踪（仅超管，保留 30 天） |
| 反馈管理 | 文档反馈、管理员回复、用户头像 |
| 公告系统 | 全站公告发布 |
| 系统设置 | 站点名称、描述、版权、社交媒体链接（YouTube/Facebook/Instagram/TikTok/Telegram/WhatsApp/VK）、**默认地图**（Leaflet 选点 + OSM 瓦片 + Nominatim 逆地理填充地址，中/英）、前台是否显示中文 UI 切换 |
| SEO 设置 | 页面级 meta 标签、关键词、Open Graph 配置 |
| 模块开关 | 前台功能模块启用/禁用，**论坛**（Flarum 部署与插件管理） |
| 存储设置 | 阿里云 OSS 配置 |
| CAN Bus 设置 | 车辆 CAN 总线参数管理 |
| **论坛（Flarum）** | 一键 Docker 部署、插件一键安装/卸载、一键修复、查看日志；支持自研扩展（如从 GitHub 安装 Notify Push） |
| **合规与线索** | Cookie 横幅与法律页路径（隐私/条款/免责声明）；法律正文富文本（中/英）；法律版本备案（含免责声明）；邮件订阅列表与 CSV；**群发活动**（草稿/定时/立即发送，SMTP + 自动退订链接） |
| **消息推送** | SMTP / 通知相关配置（与订阅确认、群发等配合） |

**公开 API（无需登录）：** `GET /api/legal-versions/public?docType=privacy|terms|disclaimer`、`GET /api/legal-versions/content/public?docType=…&locale=en|zh`、`POST /api/newsletter/subscribe`、`POST /api/newsletter/unsubscribe`（body：`{ token }`）。订阅确认与群发邮件在 **消息推送** 中启用 SMTP 时发送。

### 认证系统

管理后台使用 **邮箱验证码 + 密码** 登录，无需外部 OAuth 依赖。

#### 首次部署

1. 在 `backend/config.env` 中配置 SMTP（用于发送验证码）
2. 访问 `/admin`，点击「注册」
3. 输入邮箱 → 接收验证码 → 设置密码
4. **第一个注册的用户自动成为超级管理员（`super_admin`）**，不可被删除
5. 后续注册默认为 `admin` 角色，需超级管理员审批

#### SMTP 配置

用于发送验证码，在 `backend/config.env` 中配置：

| 变量 | 说明 | 示例 |
|------|------|------|
| `SMTP_HOST` | SMTP 服务器地址 | `smtp.163.com` |
| `SMTP_PORT` | SMTP 端口 | `465`（SSL）或 `587`（TLS） |
| `SMTP_SECURE` | 是否使用 SSL | `true` |
| `SMTP_USER` | SMTP 用户名（通常是邮箱） | `your-email@163.com` |
| `SMTP_PASS` | 密码或授权码 | 授权码（非登录密码） |
| `SMTP_FROM` | 发件人地址 | `noreply@example.com` |

**常用邮箱服务商：**

| 服务商 | SMTP 地址 | 说明 |
|--------|-----------|------|
| 网易 163 | `smtp.163.com` | 需在邮箱设置中获取授权码 |
| 网易 126 | `smtp.126.com` | 需在邮箱设置中获取授权码 |
| QQ 邮箱 | `smtp.qq.com` | 需在邮箱设置中获取授权码 |
| Gmail | `smtp.gmail.com` | 需使用应用专用密码 |
| Outlook | `smtp.office365.com` | 需使用应用专用密码 |
| 阿里企业邮箱 | `smtp.aliyun.com` | 企业邮箱 |

> **注意：** 网易/QQ 邮箱需在邮箱设置中开启 SMTP 服务并获取**授权码**（不是登录密码）。Gmail/Outlook 需使用**应用专用密码**。

#### 权限体系

| 角色 | 说明 |
|------|------|
| `super_admin` | 全部权限，可管理其他管理员、查看操作日志 |
| `admin` | 由超管分配的细粒度权限（页面可见性 + 操作权限） |

#### 基于角色的访问控制（RBAC）

权限字符串集中定义在 `backend/src/config/permissions.ts`，保存在每个 `admin` 用户的 `permissions` 数组中；`super_admin` 不受校验限制。

- **页面可见性（`pages:*`）** — 控制 `/admin` 侧栏是否显示对应入口，并在用户无权访问当前 tab 时自动跳转到首个有权的 tab。
- **资源类权限** — 如 `documents:read`、`products:update`、`settings:read` 等。受保护的管理接口通过中间件 `requirePermission` 校验 JWT 用户；不足则返回 **403**。
- **完整使用某模块** — 在「用户管理」中需同时勾选对应的 **`pages:…`** 与所需 **增删改查** 等操作权限；仅勾选页面时可能进入界面但保存接口仍会拒绝。
- **前台只读** — 面向公开站点、无需登录的 **GET** 接口（如已发布文档/产品列表）通常保持开放；**写入类**管理操作由 RBAC 约束。

### 快速开始

#### 环境要求

- Node.js >= 18
- MongoDB >= 6
- Redis（可选，不配置则使用内存缓存）

#### 安装

```bash
npm install
cd backend && npm install && cd ..
```

#### 环境变量

```bash
cp .env.example .env.local
cp backend/config.env.example backend/config.env
```

**后端关键变量** (`backend/config.env`)：

| 变量 | 必填 | 说明 |
|------|------|------|
| `MONGODB_URI` | 是 | MongoDB 连接字符串 |
| `JWT_SECRET` | 是 | JWT 签名密钥（使用强随机字符串） |
| `SESSION_SECRET` | 是 | Express Session 密钥 |
| `SMTP_HOST` | 是 | SMTP 服务器（发送验证码） |
| `SMTP_PORT` | 是 | SMTP 端口（SSL 通常为 465） |
| `SMTP_SECURE` | 是 | 是否使用 SSL（`true`/`false`） |
| `SMTP_USER` | 是 | SMTP 用户名（通常是邮箱） |
| `SMTP_PASS` | 是 | SMTP 密码或授权码 |
| `SMTP_FROM` | 否 | 发件人地址（默认使用 SMTP_USER） |
| `OSS_ACCESS_KEY_ID` / `OSS_ACCESS_KEY_SECRET` | 文件上传 | 阿里云 OSS 密钥 |
| `OSS_BUCKET` / `OSS_REGION` / `OSS_ENDPOINT` | 文件上传 | OSS 存储桶配置 |
| `OPENAI_API_KEY` | AI 功能 | OpenAI / DeepSeek API Key |
| `CORS_ORIGIN` | 是 | 允许的跨域来源（逗号分隔） |
| `REDIS_URL` | 否 | Redis 连接地址 |
| `SENTRY_DSN` | 否 | Sentry 错误监控 DSN |
| `DINGTALK_WEBHOOK` / `DINGTALK_SECRET` | 否 | 钉钉机器人（联系表单通知） |
| `HTTPS_PROXY` | 否 | HTTP 代理（国内开发环境访问外网，如 `http://127.0.0.1:7890`） |

**前端关键变量** (`.env.local`)：

| 变量 | 说明 |
|------|------|
| `VITE_API_BASE_URL` | API 基础路径（默认 `/api`） |
| `VITE_SITE_URL` | 站点 URL（SEO 结构化数据用） |
| `VITE_ENABLE_AI_ASSISTANT` | 启用 AI 助手（`true`/`false`） |
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps Key（可选，关于页面用） |
| `VITE_SENTRY_DSN` | 前端 Sentry DSN（可选） |

#### 开发

```bash
# 推荐：一条命令同时启动后端 + 前端（先启动后端，就绪后再启动前端）
npm run dev:all

# 或分开启动（两个终端）：
npm run dev:backend   # 仅后端（端口 3000）
npm run dev           # 仅前端（端口 3001，需先启动后端）
```

- `dev:all` 会先启动后端，待其监听 3000 端口后再启动前端，避免首屏请求出现代理 ECONNREFUSED。
- Vite 已配置代理：前端 `/api` 请求自动转发到 `localhost:3000`。

#### 构建与常用命令

```bash
npm run build         # 构建前端 + 后端
npm run lint          # ESLint 检查
npm run lint:fix      # ESLint 自动修复
npm run format        # Prettier 格式化
npm run type-check    # TypeScript 类型检查
npm run test:run      # Vitest 单次运行
```

### API 路由

| 路由 | 功能 |
|------|------|
| `/api/auth` | 认证（登录、注册、验证码、密码重置） |
| `/api/users` | 管理员用户管理（仅超管） |
| `/api/documents` | 文档增删改查、搜索 |
| `/api/products` | 产品管理 |
| `/api/categories` | 分类管理 |
| `/api/upload` | 文件上传（OSS） |
| `/api/ai` | AI 聊天（18+ 供应商） |
| `/api/feedback` | 反馈系统 |
| `/api/document-feedback` | 文档级反馈（含管理员回复） |
| `/api/visitors` | 访客统计 |
| `/api/site-settings` | 站点配置 |
| `/api/seo-settings` | SEO 配置 |
| `/api/audit-logs` | 操作日志（仅超管） |
| `/api/announcements` | 公告管理 |
| `/api/hero-banners` | 首页横幅 |
| `/api/v1/forum/*` | 论坛状态、部署、插件安装/卸载、一键修复、日志（仅超管） |
| `/sitemap.xml` | 动态 Sitemap（无需认证） |

### SEO 优化

| 功能 | 说明 |
|------|------|
| `robots.txt` | 禁止爬取 `/admin`、`/api` |
| `sitemap.xml` | 后端动态生成，包含所有已发布文档 + 静态页面 |
| `SEOHead` 组件 | 每个页面独立的 title / description / keywords |
| `hreflang` | 多语言 alternate 链接（en + x-default） |
| Open Graph | OG 标签 + 默认 OG 图片（1200x630） |
| JSON-LD | Organization / Product / FAQ / Breadcrumb / Article 结构化数据 |

### 生产部署

#### PM2

```bash
npm run build
cd backend && pm2 start dist/index.js --name your-app
```

#### 服务器更新（一键命令）

```bash
cd /var/www/your-project && git stash && git pull origin main && npm install && cd backend && npm install && cd .. && npm run build && pm2 restart your-app
```

> 将 `your-project` 和 `your-app` 替换为实际的部署目录名和 PM2 进程名。

#### Nginx 配置

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate     /etc/nginx/ssl/your-domain.com.pem;
    ssl_certificate_key /etc/nginx/ssl/your-domain.com.key;

    root /var/www/your-project/dist;
    index index.html;

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location = /sitemap.xml {
        proxy_pass http://127.0.0.1:3000/sitemap.xml;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_valid 200 1h;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

#### Docker

```bash
cp .env.docker.example .env
docker-compose up -d
```

| 服务 | 镜像 | 端口 | 说明 |
|------|------|------|------|
| `web` | 自构建 | 3000 | Node.js 应用 |
| `mongo` | mongo:6 | 27017 | MongoDB |
| `redis` | redis:7-alpine | 6379 | Redis 缓存 |
| `nginx` | nginx:alpine | 80/443 | 反向代理 |

#### 论坛（Flarum，可选）

管理后台支持通过 Docker（`docker-compose.flarum.yml` + `.env.flarum`）一键部署 Flarum 论坛。部署完成后可在「论坛插件管理」中一键安装/卸载扩展（Flarum 官方、FoF、Afrux 等），按已安装/未安装筛选，执行一键修复（权限 + 缓存 + 启动修复），并查看论坛日志。自研扩展（如 [Notify Push](https://github.com/Leo-ttt/Notify-Push)）可加入列表并从 GitHub（VCS）安装，无需上架 Packagist。

### 许可与使用约定

本仓库可能以 **公开（开源）** 形式托管，便于查阅与学习。**公开源代码本身并不自动授予任何许可**，包括但不限于使用、复制、修改、合并、发布、分发、再许可、销售或基于本软件创作衍生作品。

**除个人学习研究外的任何使用**（含商业使用、再分发、部署上线等），**须事先取得著作权人（仓库所有者）的书面同意**，除非其另行提供书面授权文件。

完整陈述见仓库根目录 [`LICENSE`](LICENSE) 文件；若日后增加其他许可文件，以不冲突为前提以该文件为准。