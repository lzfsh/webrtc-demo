# tsclt-starter

一个基于 typescript 和 bundler（如 tsup）的初始命令行项目。

## 目录结构

```shell
tree

├── .config # 存放其他 bundler 配置文件
├── dist # 存放打包后的文件
├── src # 项目源代码
│   ├── commands
│   ├── core
│   ├── index.ts
│   ├── providers
│   └── services
├── package.json
├── pnpm-lock.yaml
├── README.md
├── rollup.config.js
├── tsconfig.json
└── tsup.config.ts
```

## 使用

```shell
# 安装依赖
pnpm install

# 开发实时构建模式
pnpm dev

# 生产构建
pnpm build

# 测试命令行工具
pnpm clt

# 项目 ts 类型检查
pnpm typecheck
```

## 迁移

### 将打包工具迁移到 rollup

复制 `.config/rollup.config.js` 到项目根目录。

```shell
cp .config/rollup.config.js rollup.config.js
```

下载 rollup 及其插件，更新依赖。

```shell
pnpm add rollup @rollup/plugin-replace @rollup/plugin-node-resolve @rollup/plugin-commonjs @rollup/plugin-typescript @rollup/plugin-terser --save-dev
pnpm remove tsup
```

调整 package.json 中的 dev、build 脚本，使用 rollup 替代 tsup。

```json
{
  "scripts": {
    "dev": "rollup -c -w",
    "build": "rollup -c "
  }
}
```

删除文件 `tsup.config.ts`。

```shell
rm tsup.config.ts
```
