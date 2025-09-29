# 军事伞兵模拟系统部署指南

## 🚀 快速部署选项

### 方案一：Vercel部署 (最推荐)

Vercel是Next.js的官方平台，部署最简单：

1. **准备Git仓库**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **部署到Vercel**
   - 访问 [vercel.com](https://vercel.com)
   - 使用GitHub账号登录
   - 点击"New Project"
   - 选择这个仓库
   - 点击"Deploy"

3. **自动部署**
   - Vercel会自动检测Next.js项目
   - 几分钟后获得部署链接
   - 每次推送代码都会自动重新部署

**免费额度：**
- 无限静态网站
- 每月100GB带宽
- 自定义域名支持

---

### 方案二：Netlify部署

1. **构建静态文件**
   ```bash
   npm run build
   ```

2. **部署到Netlify**
   - 访问 [netlify.com](https://netlify.com)
   - 拖拽`out`文件夹到部署区域
   - 或连接GitHub仓库自动部署

**免费额度：**
- 每月100GB带宽
- 300分钟构建时间

---

### 方案三：GitHub Pages

1. **配置basePath** (如果仓库不是主页)
   在`next.config.mjs`中取消注释：
   ```javascript
   basePath: '/your-repo-name',
   ```

2. **创建GitHub Actions工作流**
   ```bash
   mkdir -p .github/workflows
   ```
   
   创建`.github/workflows/deploy.yml`：
   ```yaml
   name: Deploy to GitHub Pages
   
   on:
     push:
       branches: [ main ]
   
   jobs:
     build-and-deploy:
       runs-on: ubuntu-latest
       
       steps:
       - name: Checkout
         uses: actions/checkout@v3
         
       - name: Setup Node.js
         uses: actions/setup-node@v3
         with:
           node-version: '18'
           cache: 'npm'
           
       - name: Install dependencies
         run: npm ci
         
       - name: Build
         run: npm run build
         
       - name: Deploy
         uses: peaceiris/actions-gh-pages@v3
         with:
           github_token: ${{ secrets.GITHUB_TOKEN }}
           publish_dir: ./out
   ```

3. **启用GitHub Pages**
   - 仓库Settings → Pages
   - Source选择"GitHub Actions"

---

## 🛠️ 本地测试部署版本

测试静态导出是否正常：

```bash
# 构建静态版本
npm run build

# 使用Python启动本地服务器测试
cd out
python -m http.server 8000

# 或使用Node.js
npx serve out
```

访问 http://localhost:8000 验证功能。

---

## 🎯 推荐部署流程

1. **首选Vercel** - 最简单，功能最完整
2. **备选Netlify** - 功能丰富，社区活跃  
3. **GitHub Pages** - 完全免费，适合开源项目

## 🔧 常见问题

**Q: Canvas动画在静态导出下能正常工作吗？**
A: 是的，Canvas动画是客户端渲染，不受静态导出影响。

**Q: 如何添加自定义域名？**
A: Vercel和Netlify都支持在控制台添加自定义域名。

**Q: 部署后看不到动画？**
A: 检查浏览器控制台是否有JavaScript错误，确保所有资源路径正确。

---

## 📞 需要帮助？

如果遇到部署问题，请检查：
1. 构建是否成功 (`npm run build`)
2. 控制台是否有错误信息
3. 网络连接和资源加载