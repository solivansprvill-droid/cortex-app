# Hermes Agent Mobile — Design Document

## Brand Identity

- **Primary Color**: `#6C47FF` (Nous Research 紫色)
- **Secondary**: `#1A1A2E` (深夜蓝，用于深色背景)
- **Accent**: `#00D4FF` (青色，用于工具调用高亮)
- **Surface Light**: `#F4F2FF`
- **Surface Dark**: `#1E1B2E`
- **Font**: System default (SF Pro on iOS, Roboto on Android)

---

## Screen List

1. **Chat Screen** (主屏) — 与 AI 进行对话的核心界面
2. **Conversations Screen** — 历史对话列表
3. **Settings Screen** — 模型配置（API Key、Base URL、模型名称、系统提示词等）
4. **About Screen** — 关于 Hermes Agent 和应用信息

---

## Primary Content and Functionality

### Chat Screen
- 顶部：当前对话标题 + 新建对话按钮 + 历史按钮
- 消息列表（FlatList）：支持 Markdown 渲染、代码块高亮、工具调用气泡
- 底部输入区：多行文本输入 + 发送按钮 + 停止生成按钮
- 消息气泡：用户消息（右侧，紫色）、AI 消息（左侧，白/深色卡片）
- 流式输出：打字机效果，实时显示 AI 回复
- 工具调用展示：折叠卡片，显示工具名称和参数

### Conversations Screen
- 对话列表（FlatList），每项显示：标题、最后消息预览、时间戳
- 左滑删除对话
- 顶部搜索栏
- 空状态引导

### Settings Screen
分为以下配置组：

**模型配置**
- Base URL（文本输入，默认 https://openrouter.ai/api/v1）
- API Key（密码输入，安全存储）
- 模型名称（文本输入，支持自定义，如 `nousresearch/hermes-3-llama-3.1-405b`）
- 最大 Token 数（滑块，100-8192）
- Temperature（滑块，0.0-2.0）

**系统提示词**
- 多行文本输入，可自定义 Agent 人格

**界面设置**
- 深色/浅色模式切换
- 字体大小

**数据管理**
- 清除所有对话
- 导出对话记录

---

## Key User Flows

### 首次使用
1. 打开应用 → Chat Screen（提示配置 API Key）
2. 点击设置图标 → Settings Screen
3. 填写 Base URL + API Key + 模型名称
4. 返回 Chat Screen → 开始对话

### 发送消息
1. 在输入框输入文字
2. 点击发送 → 消息出现在列表（右侧）
3. AI 开始流式回复（左侧气泡，打字机效果）
4. 回复完成 → 可继续输入

### 切换/新建对话
1. 点击顶部历史图标 → Conversations Screen
2. 选择历史对话 → 进入该对话
3. 点击 "+" → 新建空白对话

---

## Tab Bar

| Tab | Icon | Screen |
|-----|------|--------|
| 聊天 | message.fill | Chat Screen |
| 历史 | clock.fill | Conversations Screen |
| 设置 | gearshape.fill | Settings Screen |
