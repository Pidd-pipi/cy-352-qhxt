# 桌游吧社交平台

面向桌游爱好者，提供桌游库管理、组局拼车和战绩追踪的社交化桌游吧运营平台。

## Docker Compose 快速启动

首次启动前复制环境变量文件：

```bash
cp .env.example .env
docker compose up -d
```

访问地址：

- 前端：http://localhost:28512
- 后端健康检查：http://localhost:29512/health
- API 示例：http://localhost:28512/api/overview

## 项目主要功能

- **现场选游（前台快速开桌）**：前台录入到店人数、可用分钟与偏好难度，系统自动排除无库存、时长不够的桌游并列出具体原因；候选桌游按「人数适配 → 难度偏好 → 时长余量」排序，并展示每条排序依据和实时在库份数。一键开桌扣减一份库存，结桌归还后恢复；两人抢最后一份只能开一桌，重复结桌不会重复加库存。
- **桌游库管理与分类**：管理员录入桌游信息（名称、类型、最少/最多人数、单局时长、难度、简介），按类型（策略/聚会/角色扮演/卡牌）分类管理，维护在库总份数；页面实时展示「在库份数 / 总份数 / 已开桌数」。
- **组局拼车与缺人招募**：玩家发起组局（选择桌游、时间、人数），发布到拼车广场招募队友，其他玩家可报名加入，满员后自动锁定。
- **战绩记录与排行榜**：记录每局桌游的参与者、胜负结果、时长，生成个人胜率排行榜和常用桌游统计，玩家可查看自己的桌游生涯数据。
- **包厢预约与会员储值**：展示桌游吧包厢信息（容纳人数、设施），支持按时段预约，会员可充值储值，消费时享受会员折扣和积分累积。
- **活动赛事发布**：门店发布桌游赛事活动（如狼人杀锦标赛、剧本杀推理赛），玩家报名参赛，系统自动分组和记录比赛成绩，颁发虚拟奖牌。

## 本地开发方式

前端：

```bash
cd frontend
npm install
npm run dev
```

后端：

```bash
cd backend
npm install
npm run dev
```

后端自检脚本（验证推荐排序、抢库存、结桌归还与重复结桌幂等）：

```bash
cd backend
npm run verify
```

## 现场选游 API

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/games` | 桌游库列表（含总份数、已开桌数、在库份数） |
| POST | `/api/games` | 管理员录入桌游 |
| PUT | `/api/games/:id` | 管理员维护人数 / 时长 / 难度 / 总份数 |
| GET/POST | `/api/recommend` | 入参 `players`、`availableMinutes`、`preferredDifficulty`（1-5，可空），返回排序候选与排除原因 |
| POST | `/api/tables` | 开桌（body 传 `gameId`、`players`），原子扣减 1 份在库 |
| POST | `/api/tables/:id/close` | 结桌归还 1 份；重复结桌返回 409，不重复加库存 |
| GET | `/api/tables?status=open` | 桌台流水（`open` / `closed`） |

库存规则：在库份数 = 总份数 − 进行中桌数。并发开桌在服务端原子判定，最后一份只会被一桌抢到；库存为 0 或单局时长超过可用时间的桌游不出现在候选中，并返回明确原因。

> 说明：桌游库与桌台数据当前保存在后端进程内存中（重启后回到种子数据），便于现场演示与联调；`backend/src/modules/games/game.store.ts` 集中了全部读写，可平滑替换为 MongoDB 持久化。

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
├── backend/              # 后端服务（Express + TypeScript）
│   └── src/modules/games # 桌游库 / 现场推荐 / 开桌结桌
├── database/             # 数据库脚本
├── frontend/             # 前端应用（Vue 3 + Element Plus）
│   └── src/pages         # 总览 / 现场选游 / 桌游库管理 / 桌台流水
├── docker-compose.yml    # 一键部署编排
├── .env.example          # 环境变量示例
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
- 前端容器由 Nginx 托管静态资源，并把 `/api/` 反向代理到 `backend:29512`。
- 若本地端口冲突，可修改 `.env` 中的 `FRONTEND_PORT`、`BACKEND_PORT`、`DB_PORT`。

常用命令：

```bash
docker compose config --quiet
docker compose ps
docker compose down
```

## License

MIT
