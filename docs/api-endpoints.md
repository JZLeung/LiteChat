# API 接口文档

本文档整理了 llama-server-webui 项目中使用的所有后端 API 接口。

## 配置说明

通过 `.env` 文件配置 API 目标地址：

```bash
# 默认值
VITE_API_TARGET=http://localhost:8080

# 示例：指定远程服务器
VITE_API_TARGET=http://192.168.17.59:11434

# vLLM 示例
VITE_API_TARGET=http://localhost:8000
```

## vLLM / OpenAI 兼容后端支持

本 WebUI 支持多种后端：

| 后端 | 支持情况 | 说明 |
|------|---------|------|
| **llama.cpp** | ✅ 完整支持 | 所有接口 |
| **vLLM** | ✅ 兼容模式 | 仅 `/v1/chat/completions` + `/v1/models` |
| **OpenAI API** | ✅ 兼容模式 | 仅 `/v1/chat/completions` + `/v1/models` |

> **注意：** 当使用 vLLM 或 OpenAI 兼容后端时，`/props`、`/slots`、`/tools`、`/models/load`、`/models/unload`、`/cors-proxy` 等 llama.cpp 特有接口将自动回退到默认值，不影响基本聊天功能。

---

## 接口列表

### 1. Chat Completions（聊天补全）

| 项目 | 值 |
|------|-----|
| **路径** | `/v1/chat/completions` |
| **方法** | POST |
| **说明** | OpenAI 兼容的聊天补全接口，支持流式和非流式响应 |
| **Service** | `ChatService.sendMessage()` |
| **预编码** | `ChatService.preEncode()` |

**请求体：**
```json
{
  "model": "string (可选，ROUTER 模式必填)",
  "messages": [...],
  "stream": true,
  "temperature": 0.8,
  "max_tokens": -1,
  "tools": [...]
}
```

**流式响应 (SSE)：**
```
data: {"choices":[{"delta":{"content":"Hello"}}]}
data: {"choices":[{"delta":{"content":" world"}}]}
data: [DONE]
```

---

### 2. Models List（模型列表）

| 项目 | 值 |
|------|-----|
| **路径** | `/v1/models` |
| **方法** | GET |
| **说明** | 获取可用模型列表（OpenAI 兼容） |
| **Service** | `ModelsService.list()` / `ModelsService.listRouter()` |

**响应：**
```json
{
  "data": [
    {
      "id": "model-name",
      "object": "model",
      "owned_by": "...",
      "status": { "value": "loaded|loading" }
    }
  ]
}
```

---

### 3. Props（服务器属性）- llama.cpp 专用

| 项目 | 值 |
|------|-----|
| **路径** | `/props` |
| **方法** | GET |
| **说明** | 获取服务器配置、能力及默认生成参数（llama.cpp 专用） |
| **Service** | `PropsService.fetch()` / `PropsService.fetchForModel()` |
| **vLLM 兼容** | ⚠️ 404 时自动回退到默认配置 |

**查询参数：**
| 参数 | 类型 | 说明 |
|------|------|------|
| `model` | string | 模型 ID（ROUTER 模式） |
| `autoload` | boolean | 是否自动加载模型（默认 false） |

**响应：**
```json
{
  "version": "...",
  "role": "MODEL|ROUTER",
  "modalities": ["text", "image"],
  "default_gen_matrix_params": { ... }
}
```

---

### 4. Model Load（加载模型）

| 项目 | 值 |
|------|-----|
| **路径** | `/models/load` |
| **方法** | POST |
| **说明** | 加载指定模型（ROUTER 模式） |
| **Service** | `ModelsService.load()` |

**请求体：**
```json
{
  "model": "model-id",
  "extra_args": ["--n_ctx", "4096"]
}
```

---

### 5. Model Unload（卸载模型）

| 项目 | 值 |
|------|-----|
| **路径** | `/models/unload` |
| **方法** | POST |
| **说明** | 卸载指定模型（ROUTER 模式） |
| **Service** | `ModelsService.unload()` |

**请求体：**
```json
{
  "model": "model-id"
}
```

---

### 6. Tools List（内置工具列表）

| 项目 | 值 |
|------|-----|
| **路径** | `/tools` |
| **方法** | GET |
| **说明** | 获取服务器内置工具列表 |
| **Service** | `ToolsService.list()` |

---

### 7. Tools Execute（执行工具）

| 项目 | 值 |
|------|-----|
| **路径** | `/tools` |
| **方法** | POST |
| **说明** | 执行服务器内置工具 |
| **Service** | `ToolsService.executeTool()` |

**请求体：**
```json
{
  "tool": "tool-name",
  "params": { "key": "value" }
}
```

---

### 8. Slots（槽位状态）- llama.cpp 专用

| 项目 | 值 |
|------|-----|
| **路径** | `/slots` |
| **方法** | GET |
| **说明** | 检查服务器槽位是否空闲（llama.cpp 专用） |
| **Service** | `ChatService.areAllSlotsIdle()` |
| **vLLM 兼容** | ⚠️ 不可用时自动返回 true（假设空闲） |

**查询参数：**
| 参数 | 类型 | 说明 |
|------|------|------|
| `model` | string | 模型名称（ROUTER 模式） |

**响应：**
```json
[
  { "is_processing": false },
  { "is_processing": true }
]
```

---

### 9. CORS Proxy（跨域代理）

| 项目 | 值 |
|------|-----|
| **路径** | `/cors-proxy` |
| **方法** | HEAD / POST |
| **说明** | 为 MCP 服务器提供跨域代理支持 |
| **Service** | `MCPService` / `mcpStore` |

---

## 接口汇总表格

| # | 路径 | 方法 | 说明 | 使用位置 | vLLM 兼容 |
|---|------|------|------|----------|----------|
| 1 | `/v1/chat/completions` | POST | 聊天补全（流式/非流式） | ChatService | ✅ |
| 2 | `/v1/models` | GET | 模型列表 | ModelsService | ✅ |
| 3 | `/props` | GET | 服务器属性/能力 | PropsService, serverStore | ⚠️ 404 回退 |
| 4 | `/models/load` | POST | 加载模型 | ModelsService | ❌ |
| 5 | `/models/unload` | POST | 卸载模型 | ModelsService | ❌ |
| 6 | `/tools` | GET | 内置工具列表 | ToolsService | ❌ |
| 7 | `/tools` | POST | 执行内置工具 | ToolsService | ❌ |
| 8 | `/slots` | GET | 槽位状态检查 | ChatService | ⚠️ 异常回退 |
| 9 | `/cors-proxy` | HEAD/POST | MCP 跨域代理 | MCPService | ❌ |

---

## 认证

所有接口支持 Bearer Token 认证：
```
Authorization: Bearer <API_KEY>
```

API Key 可通过设置界面配置，或通过环境变量 `VITE_API_KEY` 预设。