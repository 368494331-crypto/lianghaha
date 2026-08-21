const SUPABASE_URL = "https://aypsenqwkwhmetdpwebo.supabase.co";
const SUPABASE_KEY = "sb_publishable_uRm4OmspwhIPw7MdzLTedA_CCDJ4b-z";
const BUCKET = "111";
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const $ = selector => document.querySelector(selector);
const views = [$("#list-view"), $("#detail-view"), $("#editor-view")];
let posts = [], currentUser = null, authMode = "login", pendingPhotos = [], selectedFiles = [], sortHot = false;
const THEME_KEY = "blog-theme";
function setTheme(theme) {
  const eyeCare = theme === "eye-care";
  document.documentElement.dataset.theme = eyeCare ? "eye-care" : "default";
  $("#theme-button").textContent = eyeCare ? "☀️ 普通模式" : "🌿 护眼模式";
  $("#theme-button").setAttribute("aria-pressed", String(eyeCare));
  localStorage.setItem(THEME_KEY, eyeCare ? "eye-care" : "default");
}

function esc(value) { return String(value ?? "").replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c])); }
function date(value) { return new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }
function heat(post) { return (post.likes?.[0]?.count || 0) * 5 + Number(post.views || 0); }
function canEdit(post) { return currentUser?.id === post.user_id; }
function show(view) { views.forEach(v => v.classList.add("hidden")); view.classList.remove("hidden"); scrollTo({ top: 0, behavior: "smooth" }); }
function toast(message) { const el = $("#toast"); el.textContent = message; el.classList.remove("hidden"); clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.add("hidden"), 2600); }
function errorMessage(error) { return error?.message || "操作失败，请稍后再试"; }

function renderAccount() {
  $("#account-area").innerHTML = currentUser
    ? `<span>你好，${esc(currentUser.email?.split("@")[0])}</span><button class="button nav-button" data-action="logout">退出</button>`
    : `<button class="button nav-button" data-action="open-auth">登录 / 注册</button>`;
}

async function loadPosts() {
  const { data, error } = await db.from("posts").select("*, likes(count)").order("created_at", { ascending: false });
  if (error) { toast("数据库读取失败：" + errorMessage(error)); return; }
  posts = data || [];
}

async function renderList(reload = true) {
  if (reload) await loadPosts();
  const ordered = [...posts].sort((a, b) => sortHot ? heat(b) - heat(a) : new Date(b.created_at) - new Date(a.created_at));
  $("#post-count").textContent = `${posts.length} 篇文章`;
  $("#sort-button").textContent = sortHot ? "按时间排序" : "按热度排序";
  $("#post-list").innerHTML = ordered.length ? ordered.map(post => `
    <article class="post-card">
      ${post.photos?.[0] ? `<img class="cover" src="${post.photos[0]}" alt="文章封面">` : ""}
      <div class="post-card-body"><h3>${esc(post.title)}</h3>
        <div class="meta">${esc(post.author)} · ${date(post.created_at)} · 👁 ${post.views || 0} · ❤ ${post.likes?.[0]?.count || 0} · 🔥 ${heat(post)}</div>
        <p class="excerpt">${esc(post.content)}</p>
        <div class="card-footer"><button class="button read-button" data-action="read" data-id="${post.id}">阅读全文 →</button>
          ${canEdit(post) ? `<div class="card-actions"><button class="button button-ghost button-small" data-action="edit" data-id="${post.id}">编辑</button><button class="button button-danger button-small" data-action="delete" data-id="${post.id}">删除</button></div>` : ""}
        </div>
      </div>
    </article>`).join("") : `<div class="empty"><h3>还没有文章</h3><p>登录后开始创作。</p></div>`;
  show($("#list-view"));
}

async function readPost(id, countView = true) {
  if (countView) await db.rpc("increment_post_views", { post_id: id });
  const { data: post, error } = await db.from("posts").select("*, likes(count)").eq("id", id).single();
  if (error) return toast(errorMessage(error));
  let liked = false;
  if (currentUser) {
    const { data } = await db.from("likes").select("post_id").eq("post_id", id).eq("user_id", currentUser.id).maybeSingle();
    liked = Boolean(data);
  }
  $("#detail-view").innerHTML = `<p class="eyebrow dark">ARTICLE</p><h2>${esc(post.title)}</h2>
    <div class="meta">${esc(post.author)} · ${date(post.created_at)} · 👁 ${post.views || 0} · ❤ ${post.likes?.[0]?.count || 0} · 🔥 ${heat(post)}</div>
    ${post.photos?.length ? `<div class="gallery">${post.photos.map((photo, i) => `<img src="${photo}" alt="文章照片 ${i + 1}">`).join("")}</div>` : ""}
    <div class="detail-content">${esc(post.content)}</div>
    <div class="detail-actions"><button class="button button-ghost" data-action="back">← 返回首页</button><div class="action-group">
      <button class="button ${liked ? "button-liked" : "button-primary"}" data-action="like" data-id="${post.id}">${liked ? "♥ 已点赞" : "♡ 点赞"}</button>
      ${canEdit(post) ? `<button class="button button-primary" data-action="edit" data-id="${post.id}">编辑文章</button>` : ""}
    </div></div>`;
  show($("#detail-view"));
}

function requireLogin(callback) { currentUser ? callback() : (openAuth(), toast("请先登录")); }
function openEditor(id = "") {
  const post = posts.find(p => p.id === id);
  if (post && !canEdit(post)) return toast("只能编辑自己的文章");
  $("#editor-title").textContent = post ? "编辑文章" : "写新文章";
  $("#post-id").value = post?.id || ""; $("#title").value = post?.title || "";
  $("#author").value = post?.author || currentUser.email.split("@")[0]; $("#content").value = post?.content || "";
  pendingPhotos = [...(post?.photos || [])]; selectedFiles = []; renderPhotos(); show($("#editor-view")); $("#title").focus();
}
function renderPhotos() {
  const previews = [...pendingPhotos, ...selectedFiles.map(item => item.preview)];
  $("#photo-preview").innerHTML = previews.map((photo, i) => `<div><img src="${photo}" alt="照片预览"><button type="button" data-action="remove-photo" data-index="${i}">×</button></div>`).join("");
}
function openAuth(mode = "login") {
  authMode = mode; $("#auth-title").textContent = mode === "login" ? "登录" : "注册";
  $("#auth-switch").textContent = mode === "login" ? "没有账户？立即注册" : "已有账户？返回登录";
  $("#auth-error").textContent = ""; $("#auth-modal").classList.remove("hidden");
}
function closeAuth() { $("#auth-modal").classList.add("hidden"); $("#auth-form").reset(); }

async function uploadPhotos() {
  const urls = [...pendingPhotos];
  for (const item of selectedFiles) {
    const ext = item.file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${currentUser.id}/${crypto.randomUUID()}.${ext}`;
    const { error } = await db.storage.from(BUCKET).upload(path, item.file, { upsert: false });
    if (error) throw error;
    urls.push(db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl);
  }
  return urls;
}

document.addEventListener("click", async event => {
  const target = event.target.closest("[data-action]"); if (!target) return;
  const { action, id, index } = target.dataset;
  if (action === "read") readPost(id);
  if (action === "edit") requireLogin(() => openEditor(id));
  if (action === "back") renderList();
  if (action === "open-auth") openAuth();
  if (action === "close-auth") closeAuth();
  if (action === "logout") { await db.auth.signOut(); toast("已退出登录"); }
  if (action === "remove-photo") {
    const i = Number(index);
    if (i < pendingPhotos.length) pendingPhotos.splice(i, 1); else selectedFiles.splice(i - pendingPhotos.length, 1);
    renderPhotos();
  }
  if (action === "delete" && confirm("确定删除这篇文章吗？")) {
    const { error } = await db.from("posts").delete().eq("id", id);
    error ? toast(errorMessage(error)) : (toast("文章已删除"), renderList());
  }
  if (action === "like") requireLogin(async () => {
    const { data } = await db.from("likes").select("post_id").eq("post_id", id).eq("user_id", currentUser.id).maybeSingle();
    const result = data ? await db.from("likes").delete().eq("post_id", id).eq("user_id", currentUser.id)
      : await db.from("likes").insert({ post_id: id, user_id: currentUser.id });
    result.error ? toast(errorMessage(result.error)) : readPost(id, false);
  });
});

$("#new-post-button").onclick = () => requireLogin(() => openEditor());
$("#theme-button").onclick = () => setTheme(document.documentElement.dataset.theme === "eye-care" ? "default" : "eye-care");
$("#cancel-button").onclick = () => renderList(false);
$("#sort-button").onclick = () => { sortHot = !sortHot; renderList(false); };
$("#auth-switch").onclick = () => openAuth(authMode === "login" ? "register" : "login");
$("#auth-modal").onclick = e => { if (e.target === $("#auth-modal")) closeAuth(); };
$("#photos").onchange = event => {
  const files = [...event.target.files];
  if (pendingPhotos.length + selectedFiles.length + files.length > 6) return toast("每篇文章最多 6 张照片");
  if (files.some(file => file.size > 2 * 1024 * 1024)) return toast("单张照片不能超过 2MB");
  selectedFiles.push(...files.map(file => ({ file, preview: URL.createObjectURL(file) }))); renderPhotos(); event.target.value = "";
};

$("#post-form").onsubmit = async event => {
  event.preventDefault(); const button = event.submitter; button.disabled = true; button.textContent = "保存中…";
  try {
    const photos = await uploadPhotos(), id = $("#post-id").value;
    const values = { title: $("#title").value.trim(), author: $("#author").value.trim(), content: $("#content").value.trim(), photos, updated_at: new Date().toISOString() };
    const result = id ? await db.from("posts").update(values).eq("id", id)
      : await db.from("posts").insert({ ...values, user_id: currentUser.id });
    if (result.error) throw result.error;
    event.target.reset(); pendingPhotos = []; selectedFiles = []; toast("文章已保存"); await renderList();
  } catch (error) { toast("保存失败：" + errorMessage(error)); }
  finally { button.disabled = false; button.textContent = "保存文章"; }
};

$("#auth-form").onsubmit = async event => {
  event.preventDefault(); const email = $("#username").value.trim(), password = $("#password").value;
  const result = authMode === "register" ? await db.auth.signUp({ email, password }) : await db.auth.signInWithPassword({ email, password });
  if (result.error) return $("#auth-error").textContent = errorMessage(result.error);
  closeAuth();
  toast(authMode === "register" && !result.data.session ? "注册成功，请打开邮箱完成确认" : "登录成功");
};

async function init() {
  setTheme(localStorage.getItem(THEME_KEY) || "default");
  const { data } = await db.auth.getSession(); currentUser = data.session?.user || null; renderAccount();
  db.auth.onAuthStateChange((_event, session) => { currentUser = session?.user || null; renderAccount(); renderList(); });
  $("#year").textContent = new Date().getFullYear(); await renderList();
}
init();
