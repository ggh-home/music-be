# 使用官方 Node.js 镜像
FROM node:22-alpine

# 设置时区为 Asia/Shanghai
ENV TZ=Asia/Shanghai

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

RUN npm config set registry https://registry.npmmirror.com

# 安装依赖
RUN npm install --production

# 复制项目代码
COPY . .

# 构建项目
RUN npm run build

# 暴露服务端口（假设服务运行在 3000 端口）
EXPOSE 6000

# 启动应用
CMD ["npm", "run", "start:prod"]
