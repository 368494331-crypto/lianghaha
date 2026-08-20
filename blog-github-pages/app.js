const STORAGE_KEY = "github-pages-blog-posts-v1";

const starterPosts = [
  {
    id: "welcome",
    title: "欢迎来到我的博客",
    author: "博主",
    content: "这是博客的第一篇文章。\n\n你可以点击“写新文章”添加内容，也可以编辑或删除现有文章。文章会保存在当前浏览器中。",
    createdAt: new Date().toISOString(),
    views: 0
  }
];

const listView = document.querySelector("#list-view");
const detailView = document.querySelector("#detail-view");
const editorView = document.querySelector("#editor-view");
const postList = document.querySelector("#post-list");
const form = document.querySelector("#post-form");

function loadPosts() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(stored) ? stored : starterPosts;
  } catch {
    return starterPosts;
  }
}

let posts = loadPosts();
savePosts();

function savePosts() { localStorage.setItem(STORAGE_KEY, JSON.stringify(posts)); }
function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"})[char]);
}
function formatDate(value) { return new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }
function show(view) {
  [listView, detailView, editorView].forEach(item => item.classList.add("hidden"));
  view.classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderList() {
  document.querySelector("#post-count").textContent = `${posts.length} 篇文章`;
  postList.innerHTML = posts.length ? posts.map(post => `
    <article class="post-card">
      <h3>${escapeHtml(post.title)}</h3>
      <div class="meta">${escapeHtml(post.author)} · ${formatDate(post.createdAt)} · ${post.views || 0} 次阅读</div>
      <p class="excerpt">${escapeHtml(post.content)}</p>
      <div class="card-footer">
        <button class="button read-button" data-action="read" data-id="${post.id}">阅读全文 →</button>
        <div class="card-actions">
          <button class="button button-ghost button-small" data-action="edit" data-id="${post.id}">编辑</button>
          <button class="button button-danger button-small" data-action="delete" data-id="${post.id}">删除</button>
        </div>
      </div>
    </article>`).join("") : `<div class="empty"><h3>还没有文章</h3><p>点击上方“写新文章”开始创作。</p></div>`;
  show(listView);
}

function readPost(id) {
  const post = posts.find(item => item.id === id);
  if (!post) return;
  post.views = (post.views || 0) + 1;
  savePosts();
  detailView.innerHTML = `
    <p class="eyebrow dark">ARTICLE</p>
    <h2>${escapeHtml(post.title)}</h2>
    <div class="meta">${escapeHtml(post.author)} · ${formatDate(post.createdAt)} · ${post.views} 次阅读</div>
    <div class="detail-content">${escapeHtml(post.content)}</div>
    <div class="detail-actions">
      <button class="button button-ghost" data-action="back">← 返回首页</button>
      <button class="button button-primary" data-action="edit" data-id="${post.id}">编辑文章</button>
    </div>`;
  show(detailView);
}

function openEditor(id = "") {
  const post = posts.find(item => item.id === id);
  document.querySelector("#editor-title").textContent = post ? "编辑文章" : "写新文章";
  document.querySelector("#post-id").value = post?.id || "";
  document.querySelector("#title").value = post?.title || "";
  document.querySelector("#author").value = post?.author || "博主";
  document.querySelector("#content").value = post?.content || "";
  show(editorView);
  document.querySelector("#title").focus();
}

function deletePost(id) {
  if (!confirm("确定删除这篇文章吗？")) return;
  posts = posts.filter(item => item.id !== id);
  savePosts();
  renderList();
}

document.addEventListener("click", event => {
  const target = event.target.closest("[data-action]");
  if (!target) return;
  const { action, id } = target.dataset;
  if (action === "read") readPost(id);
  if (action === "edit") openEditor(id);
  if (action === "delete") deletePost(id);
  if (action === "back") renderList();
});

document.querySelector("#new-post-button").addEventListener("click", () => openEditor());
document.querySelector("#cancel-button").addEventListener("click", renderList);
form.addEventListener("submit", event => {
  event.preventDefault();
  const id = document.querySelector("#post-id").value;
  const values = {
    title: document.querySelector("#title").value.trim(),
    author: document.querySelector("#author").value.trim(),
    content: document.querySelector("#content").value.trim()
  };
  if (id) {
    posts = posts.map(post => post.id === id ? { ...post, ...values } : post);
  } else {
    posts.unshift({ id: `${Date.now()}`, ...values, createdAt: new Date().toISOString(), views: 0 });
  }
  savePosts();
  form.reset();
  renderList();
});

document.querySelector("#year").textContent = new Date().getFullYear();
renderList();
