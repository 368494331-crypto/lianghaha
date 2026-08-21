# GitHub Pages 静态博客

这个文件夹可以直接上传到 GitHub 仓库并使用 GitHub Pages 发布。

## 文件

- `index.html`：网站首页
- `styles.css`：页面样式
- `app.js`：文章的新增、阅读、编辑和删除功能
- `.nojekyll`：让 GitHub Pages 直接发布静态文件

## 新增功能

- 本地注册、登录和退出
- 登录后发布、编辑、删除自己的文章
- 阅读量、点赞数和综合热度（1 个点赞计 5 热度）
- 按发布时间或热度排序
- 每篇文章最多上传 6 张照片，自动压缩并展示为封面/相册
- 手机和桌面端响应式布局

## Supabase 云端版

网页仍然部署在 GitHub Pages，账户、文章、浏览量、点赞和照片已接入 Supabase。不同访客和设备可以共享数据。

Supabase 配置位于 `app.js` 顶部。Publishable key 可以放在前端；不要把 secret key 或 service_role key 写入网页。

## 发布

1. 在 GitHub 创建一个 Public 仓库。
2. 将本文件夹内的全部文件上传到仓库根目录。
3. 打开仓库的 Settings → Pages。
4. Source 选择 Deploy from a branch。
5. Branch 选择 main，目录选择 /(root)，然后保存。
