# 桌游吧社交平台

面向桌游爱好者，提供桌游库管理、组局拼车和战绩追踪的社交化桌游吧运营平台。当前版本核心为「现场选游工作台」：前台录入人数、可用分钟和偏好难度，系统从桌游库实时推荐候选并支持开桌/结桌的库存流转。

## Docker Compose 快速启动

首次启动前复制环境变量文件：

```bash
cp .env.example .env
docker compose up -d
```

访问地址：

- 前端：http://localhost:28512
- 后端健康检查：http://localhost:29512/health
- API 示例：http://localhost:28512/api/games

## 项目主要功能

- **现场选游（核心）**：前台录入人数、可用分钟、偏好难度；没库存或单局时长不够的桌游列入「暂不可选」并逐条给出原因，其余候选按 **人数适配 → 难度偏好差距 → 时长余量** 排序，卡片上直接展示排序依据和在库份数。
- **开桌 / 结桌库存流转**：开桌原子扣减一份在库库存（两人同时抢最后一份时只有一桌能开成功，另一个请求收到 409）；结桌归还一份库存，重复结桌幂等，不会重复加库存。
- **桌游库管理（管理员）**：维护名称、类型（策略/聚会/角色扮演/卡牌）、适合人数区间、单局时长、难度（1–5）、总份数与在库份数，校验「在库 ≤ 总份数」「最少人数 ≤ 最多人数」。
- 组局拼车与缺人招募、战绩记录与排行榜、包厢预约与会员储值、活动赛事发布：规划中。

## 本地开发方式

前端：

```bash
cd frontend
npm install
npm run dev
```

后端（需要先启动本地 MongoDB，或使用 `docker compose up -d db` 只起数据库）：

```bash
cd backend
npm install
npm run dev
```

后端首次连接空库时会自动写入 9 款示例桌游种子数据（含 0 库存、超长单局等边界样例，方便验证排除原因）。

## 主要 API

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/games` | 桌游库列表（含在库份数） |
| POST | `/api/games` | 新增桌游（管理员维护） |
| PUT | `/api/games/:id` | 修改适合人数、时长、难度、份数等 |
| POST | `/api/recommendations` | 现场选游：入参 `{ partySize, availableMinutes, preferredDifficulty }`，返回候选（含排序依据）与排除项（含原因） |
| GET | `/api/tables?status=open` | 当前开桌中的桌 |
| POST | `/api/tables` | 开桌：入参 `{ gameId, partySize }`，原子扣一份库存，无库存返回 409 |
| POST | `/api/tables/:id/close` | 结桌：归还一份库存；重复结桌返回 `alreadyClosed: true`，不再加库存 |

## 技术栈

| 分层 | 技术 |
| --- | --- |
| 前端 | Vue 3 + TypeScript、Element Plus、Vite |
| 后端 | Node.js + Express + TypeScript |
| 数据库 | MongoDB |
| 认证 | JWT |
| 依赖 | Mongoose、bcryptjs |

## 项目目录结构

```text
.
├── backend/                 # 后端服务
│   └── src/
│       ├── db/              # 连接与种子数据
│       └── modules/
│           ├── games/       # 桌游库 + 推荐引擎（recommendation.ts 为纯函数排序逻辑）
│           ├── tables/      # 开桌/结桌（原子库存扣减与幂等归还）
│           └── overview/    # 平台总览
├── database/                # 数据库参考脚本
├── frontend/                # 前端应用
│   └── src/
│       ├── components/      # PickerPanel（选游）/ OpenTablesPanel（开桌中）/ GameAdminPanel（库管理）
│       ├── api/             # API 客户端
│       └── types/           # 类型定义
├── docker-compose.yml       # 一键部署编排
├── .env.example             # 环境变量示例
└── README.md
```

## 环境变量说明

| 变量 | 说明 | 默认值 |
| --- | --- | --- |
| COMPOSE_PROJECT_NAME | Compose 项目名，避免中文目录名导致项目名为空 | lpboardgame |
| DB_NAME | 数据库名称 | app |
| DB_USER | 数据库用户 | app |
| DB_PASSWORD | 数据库密码 | app_pwd |
| DB_ROOT_PASSWORD | 数据库 root 密码 | root_pwd |
| JWT_SECRET | JWT 签名密钥 | change_me_to_a_long_random_string |
| FRONTEND_PORT | 前端宿主机端口 | 28512 |
| BACKEND_PORT | 后端宿主机端口 | 29512 |
| DB_PORT | 数据库宿主机端口 | 27017 |

## Docker 部署说明

- 使用 `docker compose up -d` 启动，不需要额外传入 `-p`。
- `docker-compose.yml` 顶层已声明 `name: lpboardgame`，并且 `.env` 包含 `COMPOSE_PROJECT_NAME=lpboardgame`，可在中文目录名下启动。
- 数据库数据保存在命名卷 `db_data` 中，不依赖当前目录名。
- 前端容器由 Nginx 托管静态资源，并把 `/api/` 反向代理到 `backend:29512`（剥掉 `/api` 前缀，后端路由同时兼容带前缀与不带前缀两种形态）。
- 后端通过 `depends_on: { db: { condition: service_healthy } }` 等待数据库就绪，启动后自动连接并写入种子数据。
- 若本地端口冲突，可修改 `.env` 中的 `FRONTEND_PORT`、`BACKEND_PORT`、`DB_PORT`。

常用命令：

```bash
docker compose config --quiet
docker compose ps
docker compose down
```

## License

MIT
