# B2B Catalog

A Nuxt 3 product display catalog built with Vue 3, strict TypeScript, Tailwind CSS, and MySQL.

> This project is designed for product display and collection-list workflows. It avoids checkout, payment, and purchase-oriented wording in the UI.

## Requirements

- Node.js 20 or newer (Node.js 22 LTS recommended)
- npm 10 or newer

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

The development server runs at `http://localhost:3000`.

## Commands

```bash
npm run dev
npm run typecheck
npm run build
npm run preview
```

## MySQL

Copy `.env.mysql.example` to `.env.mysql` and add the server-only MySQL connection:

```env
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_DATABASE=wardrobe-miniprogram
MYSQL_USER=root
MYSQL_PASSWORD=
```

Never expose the MySQL password in public runtime config or commit `.env.mysql`.

## Luxury women bags crawler

The crawler reads only luxury women bag related categories from the captured source API and upserts products by their source `goods_id`.

1. Copy `.env.crawler.example` to `.env.crawler`.
2. Add a current authorized source API token.
3. Configure `.env.mysql`.
4. Run:

```bash
npm run crawl:women-bags
```

To verify one page per category without writing to MySQL:

```bash
$env:CRAWLER_DRY_RUN="true"
$env:CRAWLER_MAX_PAGES="1"
npm run crawl:women-bags
```

## Structure

- `assets/` — styles and static source assets
- `components/` — auto-imported reusable Vue components
- `composables/` — auto-imported reusable composition functions
- `layouts/` — shared page shells
- `pages/` — file-based routes
- `plugins/` — Nuxt plugins
- `public/` — files served from the site root
- `scripts/` — server-side data ingestion scripts
- `server/` — server routes and server-only utilities
- `types/` — shared TypeScript declarations

---

# B2B Catalog 中文说明

这是一个基于 Nuxt 3 的产品展示目录项目，使用 Vue 3、严格 TypeScript、Tailwind CSS 和 MySQL 构建。

> 本项目定位为“产品展示”和“收藏清单”场景，不包含结算、支付、下单等交易型功能描述。

## 环境要求

- Node.js 20 或更高版本（推荐 Node.js 22 LTS）
- npm 10 或更高版本

## 本地启动

```bash
npm install
cp .env.example .env
npm run dev
```

启动后访问：

```text
http://localhost:3000
```

## 常用命令

```bash
npm run dev        # 启动开发服务器
npm run typecheck  # TypeScript 类型检查
npm run build      # 生产构建
npm run preview    # 本地预览生产构建
```

## MySQL 配置

复制 `.env.mysql.example` 为 `.env.mysql`，填入仅供服务端使用的 MySQL 连接信息：

```env
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_DATABASE=wardrobe-miniprogram
MYSQL_USER=root
MYSQL_PASSWORD=
```

注意：

- `.env.mysql` 不要提交到 GitHub。
- `.env.crawler` 不要提交到 GitHub。
- MySQL 密码只能在服务端使用，不能暴露到浏览器端。
- 示例文件 `.env.crawler.example` 只保留变量名，不应填写真实 token。

## 奢侈女包数据爬虫

爬虫脚本会读取已授权来源接口中的奢侈女包相关分类，并按来源 `goods_id` 写入或更新商品数据。

使用步骤：

1. 复制 `.env.crawler.example` 为 `.env.crawler`。
2. 填入当前有效的来源 API token。
3. 配置 `.env.mysql`。
4. 执行：

```bash
npm run crawl:women-bags
```

如果只想测试抓取，不写入 MySQL：

```bash
$env:CRAWLER_DRY_RUN="true"
$env:CRAWLER_MAX_PAGES="1"
npm run crawl:women-bags
```

## 目录结构

- `assets/` — 样式和静态源文件
- `components/` — 自动导入的 Vue 组件
- `composables/` — 自动导入的组合式函数
- `layouts/` — 页面布局
- `pages/` — 基于文件的路由
- `plugins/` — Nuxt 插件
- `public/` — 网站根目录可访问的静态文件
- `scripts/` — 服务端数据采集脚本
- `server/` — 服务端路由和服务端工具
- `types/` — 共享 TypeScript 类型声明
