# 项目设计规范（AGENTS.md）

## 设计方向

本应用采用 **飞书 UD（Lark Design）浅色风格** 作为视觉主题系统，遵循飞书官方设计语言，确保与飞书生态产品一致的用户体验。

### 主题系统

- **主题模式**：浅色模式（Light Mode）
- **主色调**：`#1456f0`（飞书蓝）— 用于主按钮、链接、选中态、品牌表达
- **文字层级**：
  - 标题色 `#1f2329`（一级文字）
  - 正文辅助色 `#646a73`（二级文字 / 描述）
  - 占位色 `#8f959e`（三级文字 / 占位符）
  - 禁用色 `#bbbfc4`（四级文字 / 禁用态）
- **背景层级**：
  - 页面背景 `#ffffff`（body）
  - 内容背景 `#f8f9fa`（content）
  - 基底背景 `#f2f3f5`（base）
  - 侧栏背景 `#f9f9f9`（sidebar）
- **边框层级**：
  - 卡片边框 `#dee0e3`（line-card）
  - 组件边框 `#d0d3d6`（line-component）
  - 分割线 `rgba(31,35,41,0.15)`（divider）
- **功能色**：
  - 成功 `#35bd4b`
  - 警告 `#ff811a`
  - 危险 `#f54a45`

### 字体与字号

- **字体栈**：`LarkCircular, -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif`
- **基准字号**：14px / 行高 22px
- **字号层级**：遵循飞书 UD 标准字号体系

### 圆角规范

- `4px`（radius-s）— 标签、徽章等小组件
- `6px`（radius-m）— 按钮、输入框等交互组件
- `8px`（radius-l）— 卡片、弹窗等容器
- `10px`（radius-xl）— 大型面板、侧栏等

### 实现方式

- 所有设计 token 以 HSL 格式定义在 `client/src/tailwind-theme.css` 的 `:root` 变量中
- 通过 `@theme inline` 映射到 Tailwind CSS v4 语义 token（`--color-primary`、`--color-background` 等）
- 业务组件统一使用 Tailwind 语义类名（`bg-primary`、`text-foreground`、`rounded-lg` 等），禁止直接使用十六进制颜色值
- 飞书 UD 专属扩展 token（如 `--title`、`--caption`、`--line-card`、`--primary-soft`）通过 CSS 变量直接引用
