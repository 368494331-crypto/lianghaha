# GitHub Pages 静态博客

这个文件夹可以直接上传到 GitHub 仓库并使用 GitHub Pages 发布。

## 文件

- `index.html`：网站首页
- `styles.css`：页面样式
- `app.js`：文章的新增、阅读、编辑和删除功能
- `.nojekyll`：让 GitHub Pages 直接发布静态文件

## 注意

文章保存在浏览器的 `localStorage` 中，只在当前浏览器可见。清除浏览器数据、换电脑或换浏览器后，文章不会自动同步。

## 发布

1. 在 GitHub 创建一个 Public 仓库。
2. 将本文件夹内的全部文件上传到仓库根目录。
3. 打开仓库的 Settings → Pages。
4. Source 选择 Deploy from a branch。
5. Branch 选择 main，目录选择 /(root)，然后保存。
