# 部署和生产环境优化指南

## 一、多人同时使用问题分析

### ✅ 当前实现的优势

**1. 无状态设计**
- 每个API请求都是独立的，处理完即释放资源
- 用户上传的文件通过 `formData` 传递，直接在内存中处理
- 生成的Word文档直接返回二进制流，不存储在服务器
- 不依赖服务器端会话状态

**2. 并发能力**
- Next.js API路由支持并发处理
- LLM调用使用 `fetch`，每个请求独立
- 文件解析和文档生成都在内存中完成，不会持久化

**3. 已添加的优化**
- ✅ 并发控制：最多同时处理5个请求，防止服务器过载
- ✅ 文件大小限制：每个文件最大10MB
- ✅ 文件类型验证：只允许上传 `.docx` 格式文件
- ✅ 参数验证：检查必要参数是否提供

### ⚠️ 潜在风险和解决方案

**1. LLM API限流**

**风险**：如果大量用户同时请求，可能会触发API限流

**解决方案**：
- ✅ 已实现：使用并发控制限制同时请求数量
- 建议：为每个用户添加请求频率限制（如每分钟最多3次）
- 建议：实现请求队列，当API限流时自动排队重试

```typescript
// 示例：用户请求频率限制
const userRequestCount = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const user = userRequestCount.get(userId);

  if (!user || now > user.resetTime) {
    userRequestCount.set(userId, { count: 1, resetTime: now + 60000 });
    return true;
  }

  if (user.count >= 3) {
    return false; // 超过限制
  }

  user.count++;
  return true;
}
```

**2. 内存占用**

**风险**：大文件处理和多个并发请求可能占用大量内存

**解决方案**：
- ✅ 已实现：限制文件大小（10MB）
- ✅ 已实现：限制并发请求数量（5个）
- 建议：监控服务器内存使用情况，设置告警阈值

**3. 请求超时**

**风险**：LLM响应慢或文件解析慢导致请求超时

**解决方案**：
- ✅ 已实现：LLM调用设置了 `timeout`（60秒）
- 建议：前端添加加载状态和重试机制
- 建议：实现WebSocket实时进度推送

## 二、存储问题分析

### ✅ 当前存储策略

**1. 临时文件处理**
```
用户上传文件 → 内存处理 → 立即返回结果 → 自动释放
```

**优点**：
- 不占用服务器存储空间
- 不会积累历史文件
- 隐私性好，处理完即销毁

**缺点**：
- 无法追溯历史记录
- 无法查看历史生成的文档
- 重现问题困难

**2. 永久文件存储**
- 模板文件：存储在 `public/templates/` 目录
- S3对象存储：已初始化但未使用（可用于存储历史记录）

### ⚠️ 潜在问题

**1. 无历史记录**
- 用户无法查看之前的生成记录
- 无法追溯生成内容
- 问题排查困难

**2. 日志存储**
- 当前使用 `console.log` 输出到控制台
- 日志文件会随时间增长，需要定期清理

### 🛡️ 存储优化方案

**方案1：对象存储历史记录**

将生成的Word文档上传到对象存储，保存下载链接和历史记录

```typescript
// 示例：上传文档到对象存储
async function saveToStorage(
  buffer: Buffer,
  filename: string,
  userId: string
): Promise<string> {
  const key = `weekly-plans/${userId}/${Date.now()}_${filename}`;

  const result = await storage.putObject({
    Key: key,
    Body: buffer,
    ContentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });

  // 生成签名URL（有效期7天）
  const url = await storage.getSignedUrl(key, 7 * 24 * 3600);

  // 保存到数据库（如PostgreSQL）
  await saveToDatabase({
    userId,
    filename,
    url,
    key,
    createdAt: new Date(),
  });

  return url;
}
```

**方案2：定期清理机制**

设置定时任务，定期清理过期文件和日志

```typescript
// 示例：清理7天前的日志
async function cleanOldLogs() {
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  // 清理对象存储中的过期文件
  const objects = await storage.listObjects({ Prefix: 'weekly-plans/' });
  for (const obj of objects) {
    const lastModified = new Date(obj.LastModified).getTime();
    if (lastModified < sevenDaysAgo) {
      await storage.deleteObject(obj.Key);
    }
  }
}

// 每天凌晨执行
setInterval(cleanOldLogs, 24 * 60 * 60 * 1000);
```

**方案3：数据库记录**

使用数据库保存生成记录，便于查询和统计

```typescript
// 数据库表结构示例
CREATE TABLE weekly_plans (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  class_info VARCHAR(100),
  week_number VARCHAR(20),
  teacher VARCHAR(50),
  month_theme VARCHAR(200),
  monthly_plan TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  file_url VARCHAR(500),
  file_key VARCHAR(500)
);

CREATE TABLE daily_plans (
  id SERIAL PRIMARY KEY,
  weekly_plan_id INTEGER REFERENCES weekly_plans(id),
  date VARCHAR(20),
  activity_name VARCHAR(200),
  file_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 三、部署建议

### 1. 环境变量配置

```env
# LLM API配置
LLM_API_KEY=your_api_key_here

# 对象存储配置
COZE_BUCKET_ENDPOINT_URL=https://your-bucket-endpoint.com
COZE_BUCKET_NAME=your-bucket-name

# 并发控制
MAX_CONCURRENT_REQUESTS=5
MAX_FILE_SIZE=10485760  # 10MB

# 其他配置
NODE_ENV=production
```

### 2. 监控和告警

建议配置以下监控指标：

- **系统监控**：CPU使用率、内存使用率、磁盘使用率
- **应用监控**：请求数量、响应时间、错误率
- **业务监控**：生成的文档数量、用户活跃度、存储空间使用量

**推荐工具**：
- Prometheus + Grafana：系统监控
- Sentry：错误追踪
- 日志服务：如阿里云日志服务、腾讯云CLS

### 3. 性能优化建议

**前端优化**：
- 实现请求防抖（防止重复点击）
- 添加加载状态和进度提示
- 实现断点续传（大文件上传）

**后端优化**：
- 实现请求缓存（相同参数的请求缓存结果）
- 使用CDN加速文件下载
- 实现异步处理（将耗时操作放入队列）

**数据库优化**：
- 添加索引提高查询速度
- 定期备份和清理过期数据
- 使用连接池管理数据库连接

### 4. 安全建议

- **API密钥管理**：使用环境变量存储，不要硬编码
- **文件类型验证**：严格验证上传文件的MIME类型
- **大小限制**：限制文件大小防止DoS攻击
- **用户认证**：添加用户登录和权限管理
- **HTTPS加密**：使用HTTPS传输数据

## 四、当前状态总结

### ✅ 已实现
- 并发控制（最多5个同时请求）
- 文件大小限制（10MB）
- 文件类型验证（仅.docx）
- 参数验证
- 错误处理

### ⚠️ 待优化
- 用户认证和权限管理
- 历史记录存储
- 请求频率限制
- 日志管理和清理
- 监控和告警
- 数据库记录

### 📊 存储占用评估

**当前实现（无历史记录）**：
- 临时文件：0MB（处理完即释放）
- 模板文件：约50KB（3个模板）
- 日志文件：根据使用情况，建议定期清理
- 对象存储：未使用

**建议实现（有历史记录）**：
- 每个周计划：约30-50KB
- 每个日计划：约10-20KB
- 每周生成量（假设10个用户，每周5个计划）：约2-3MB
- 每月存储量：约8-12MB
- 每年存储量：约100-150MB

**结论**：即使有历史记录，存储空间占用也很小，不会造成存储压力。

## 五、快速行动建议

### 优先级P0（必须做）
1. ✅ 并发控制（已完成）
2. ✅ 文件大小和类型验证（已完成）
3. 添加用户认证（使用Auth0、Cognito等）

### 优先级P1（建议做）
4. 实现历史记录存储（对象存储+数据库）
5. 添加请求频率限制
6. 配置监控和告警

### 优先级P2（可选）
7. 实现定期清理机制
8. 优化前端用户体验（进度条、断点续传）
9. 添加统计分析功能

## 六、常见问题FAQ

**Q1: 100人同时使用会怎样？**
A: 由于已实现并发控制（最多5个），其他95个请求会排队等待，不会导致服务器崩溃。

**Q2: 文件上传失败怎么办？**
A: 系统会返回明确的错误信息（文件太大、格式不对等），用户可以根据提示修正后重试。

**Q3: 生成的文档会保存多久？**
A: 当前实现不保存历史记录，文档生成后直接返回给用户。如果需要保存，需要实现历史记录存储功能。

**Q4: 服务器存储空间够用吗？**
A: 当前实现几乎不占用存储空间。即使实现历史记录存储，每年也就100-150MB，完全可以接受。

**Q5: LLM API费用怎么算？**
A: 费用根据token数量计算。建议：
- 设置使用配额限制
- 监控API调用次数
- 考虑使用缓存减少重复调用
