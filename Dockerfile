# ==================== 第一阶段：构建前端 ====================
FROM node:18-alpine AS frontend-builder

WORKDIR /app

# 复制前端依赖文件
COPY package*.json ./
RUN npm ci --only=production

# 复制前端源码
COPY . .

# 构建前端
RUN npm run build

# ==================== 第二阶段：构建后端 ====================
FROM node:18-alpine AS backend-builder

WORKDIR /app

# 复制后端依赖文件
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --only=production

# 复制后端源码
COPY backend ./backend

# 编译 TypeScript
RUN cd backend && npx tsc

# ==================== 第三阶段：生产运行环境 ====================
FROM node:18-alpine

# 安装 PM2
RUN npm install -g pm2

WORKDIR /app

# 从构建阶段复制文件
COPY --from=frontend-builder /app/dist ./dist
COPY --from=backend-builder /app/backend/dist ./backend/dist
COPY --from=backend-builder /app/backend/node_modules ./backend/node_modules
COPY --from=backend-builder /app/backend/package.json ./backend/

# 复制 PM2 配置
COPY ecosystem.config.js ./

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# 更改所有权
RUN chown -R nodejs:nodejs /app

USER nodejs

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# 启动应用
CMD ["pm2-runtime", "start", "ecosystem.config.js"]

