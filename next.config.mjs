/** @type {import('next').NextConfig} */
const nextConfig = {
  // 启用静态导出以支持GitHub Pages等静态托管
  output: 'export',
  
  // 禁用图像优化（静态导出不支持）
  images: {
    unoptimized: true
  },
  
  // 如果部署在子路径下，取消注释下面的配置
  // basePath: '/your-repo-name',
  
  // 确保所有页面都能静态生成
  trailingSlash: true,
  
  // 环境变量（如果需要）
  env: {
    CUSTOM_KEY: 'value',
  },
}

export default nextConfig