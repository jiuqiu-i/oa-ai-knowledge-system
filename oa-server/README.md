# OA AI Knowledge System - 后端服务

基于 NestJS + TypeScript + TypeORM + MySQL + Redis 的 OA + AI 知识库后端服务。

## 技术栈

- Node.js >= 18
- NestJS 10
- TypeScript 5
- TypeORM 0.3
- MySQL 8
- Redis 7
- @nestjs/jwt + Passport
- LangChain.js（OpenAI 扩展）

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

根据本地环境修改 `.env` 中的数据库、Redis、JWT 等配置。

### 3. 启动数据库（Docker）

```bash
docker-compose up -d
```

将启动 MySQL 8（3306）和 Redis 7（6379）。

### 4. 启动服务

开发模式：

```bash
npm run start:dev
```

生产构建：

```bash
npm run build
npm run start:prod
```

服务默认运行在 `http://localhost:3000`，Swagger 文档地址：`http://localhost:3000/api/docs`。

## 项目结构

```
oa-server/
├── src/
│   ├── main.ts                 # 应用入口
│   ├── app.module.ts           # 根模块
│   ├── config/                 # 配置模块
│   │   ├── app.config.ts
│   │   ├── database.config.ts
│   │   └── redis.config.ts
│   ├── entities/               # 数据库实体
│   │   ├── user.entity.ts
│   │   ├── approval.entity.ts
│   │   ├── kb.entity.ts
│   │   └── ai-conversation.entity.ts
│   ├── common/                 # 公共装饰器与守卫
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts
│   │   │   └── roles.decorator.ts
│   │   └── guards/
│   │       ├── jwt-auth.guard.ts
│   │       └── roles.guard.ts
│   ├── redis/                  # Redis 模块
│   │   ├── redis.module.ts
│   │   └── redis.service.ts
│   ├── auth/                   # 认证模块
│   ├── users/                  # 用户管理
│   ├── approvals/              # 审批管理
│   ├── knowledge-base/         # 知识库
│   ├── ai/                     # AI 助手
│   └── dashboard/              # 仪表盘统计
├── docker-compose.yml
├── .env.example
├── package.json
└── tsconfig.json
```

## API 概览

### 认证

- `POST /auth/register` - 注册
- `POST /auth/login` - 登录
- `GET /auth/profile` - 当前用户信息

### 用户管理

- `GET /users` - 用户列表（分页、部门筛选）
- `POST /users` - 创建用户（admin）
- `PATCH /users/:id` - 更新用户（admin）
- `DELETE /users/:id` - 删除用户（admin）
- `PATCH /users/:id/status` - 启用/禁用（admin）
- `GET /users/departments` - 部门列表

### 审批管理

- `POST /approvals` - 提交审批
- `GET /approvals` - 审批列表
- `GET /approvals/my` - 我的申请
- `GET /approvals/pending/stats` - 待处理统计
- `PATCH /approvals/:id` - 修改申请
- `PATCH /approvals/:id/review` - 审批通过/驳回

### 知识库

- `POST /knowledge-base` - 创建文档
- `GET /knowledge-base` - 文档列表/搜索
- `GET /knowledge-base/categories` - 分类列表
- `GET /knowledge-base/hot` - 热门文档
- `GET /knowledge-base/:id` - 文档详情
- `PATCH /knowledge-base/:id` - 更新文档
- `DELETE /knowledge-base/:id` - 删除文档

### AI 助手

- `GET /ai/conversations` - 会话列表
- `POST /ai/conversations` - 新建会话
- `GET /ai/conversations/:id` - 会话详情
- `DELETE /ai/conversations/:id` - 删除会话
- `POST /ai/chat` - 非流式对话
- `GET /ai/chat/stream` - 流式对话（SSE）

### 仪表盘

- `GET /dashboard/stats` - 核心统计
- `GET /dashboard/trends` - 趋势数据
- `GET /dashboard/dept-contributions` - 部门贡献
- `GET /dashboard/overview` - 总览

## AI 配置

在 `.env` 中配置：

```env
OPENAI_API_KEY=sk-xxxxxxxx
OPENAI_MODEL=gpt-3.5-turbo
```

未配置 `OPENAI_API_KEY` 时，AI 接口会返回模拟回复，并打印提示信息。

## 身份认证

大部分接口需要在请求头中携带 JWT Token：

```
Authorization: Bearer <token>
```

通过 `/auth/login` 获取 token。系统包含 `admin` 与 `user` 两种角色，部分管理接口需要 admin 权限。

## 数据库同步

开发环境下 TypeORM 会自动同步实体到数据库（`synchronize: true`）。生产环境建议关闭同步，使用迁移脚本管理数据库变更。
