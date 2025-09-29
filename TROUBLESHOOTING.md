# 🛠️ 本地启动故障排除指南

## 常见启动问题与解决方案

### 问题1：`npm start` 失败
**症状**：运行 `npm start` 时出现错误
**原因**：静态导出配置与开发服务器冲突

**解决方案**：
```bash
# 使用开发命令启动
npm run dev

# 或者直接使用start（已修复）
npm start
```

### 问题2：路径错误 - ENOENT
**症状**：找不到 package.json 文件
**原因**：在错误的目录下运行命令

**解决方案**：
```bash
# 确保在项目根目录
cd paratrooper
npm start
```

### 问题3：依赖未安装
**症状**：Module not found 错误
**解决方案**：
```bash
# 重新安装依赖
rm -rf node_modules package-lock.json
npm install
```

### 问题4：端口被占用
**症状**：Port 3000 is already in use
**解决方案**：
```bash
# 方案1：使用不同端口
npm run dev -- -p 3001

# 方案2：杀死占用进程
lsof -ti :3000 | xargs kill -9
```

### 问题5：TypeScript 错误
**症状**：编译时类型错误
**解决方案**：
```bash
# 检查类型错误
npm run lint

# 强制启动（忽略类型错误）
npm run dev -- --no-ts-check
```

## ✅ 正确的启动流程

1. **确保在项目目录**
   ```bash
   cd paratrooper
   pwd  # 应该显示 .../paratrooper
   ```

2. **安装依赖（首次运行）**
   ```bash
   npm install
   ```

3. **启动开发服务器**
   ```bash
   npm run dev    # 推荐
   # 或
   npm start      # 也可以
   ```

4. **访问应用**
   打开浏览器访问 http://localhost:3000

## 🔧 配置说明

项目现在支持**双模式**：
- **开发模式**：完整的Next.js服务器，支持热重载
- **生产模式**：静态导出，适合部署到GitHub Pages

```javascript
// next.config.mjs - 智能配置
const nextConfig = {
  // 只在生产环境启用静态导出
  ...(process.env.NODE_ENV === 'production' ? { output: 'export' } : {}),
  // ...其他配置
}
```

## 🚀 验证启动成功

启动成功后应该看到：
```
▲ Next.js 15.5.4 (Turbopack)
- Local:        http://localhost:3000
- Network:      http://192.168.x.x:3000

✓ Starting...
✓ Ready in 1013ms
```

## 📱 访问测试

1. 打开 http://localhost:3000
2. 应该看到伞兵模拟系统界面
3. 点击"开始模拟"测试功能
4. 调整左侧参数验证响应

## 🆘 仍然有问题？

如果以上方法都不能解决，请：

1. **检查Node.js版本**
   ```bash
   node --version  # 需要 >= 18.0.0
   npm --version
   ```

2. **查看详细错误**
   ```bash
   npm run dev --verbose
   ```

3. **清理缓存**
   ```bash
   npm cache clean --force
   rm -rf .next
   ```

4. **重新创建项目**（最后手段）
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```