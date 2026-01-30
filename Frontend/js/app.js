const API = 'http://localhost:5000/api';

// Helpers
const qs = (sel) => document.querySelector(sel);
const qsa = (sel) => document.querySelectorAll(sel);
const fmtDate = (d) => new Date(d).toLocaleString();

// Toast helper
const toastEl = qs('#toast');
function showToast(message, type='info', duration=3000){
  if(!toastEl) return;
  toastEl.textContent = message;
  toastEl.className = 'toast ' + (type||'info');
  toastEl.style.display = 'block';
  clearTimeout(showToast._t);
  showToast._t = setTimeout(()=>{ toastEl.style.display='none'; }, duration);
}

// Auth state
let token = localStorage.getItem('token') || null;
let me = null;

// UI elements
const postsFeed = qs('#postsFeed');
const usersList = qs('#usersList');
const profileCard = qs('#profileCard');
const btnLogin = qs('#btnLogin');
const btnRegister = qs('#btnRegister');
const btnLogout = qs('#btnLogout');
const modalAuth = qs('#modalAuth');
const authTitle = qs('#authTitle');
const authUsername = qs('#authUsername');
const authEmail = qs('#authEmail');
const authPassword = qs('#authPassword');
const authSubmit = qs('#authSubmit');
const authCancel = qs('#authCancel');
const modalPost = qs('#modalPost');
const postDetails = qs('#postDetails');
const postContent = qs('#postContent');
const postImage = qs('#postImage');
const btnPost = qs('#btnPost');
const searchInput = qs('#searchInput');

// Initialize
async function init(){
  if(token) {btnLogout.style.display='inline-block'; btnLogin.style.display='none'; btnRegister.style.display='none';}
  bindEvents();
  await loadProfile();
  await loadUsers();
  await loadPosts();
}

function bindEvents(){
  btnLogin.onclick = () => openAuth('login');
  btnRegister.onclick = () => openAuth('register');
  authCancel.onclick = closeAuth;
  authSubmit.onclick = submitAuth;
  btnLogout.onclick = logout;
  btnPost.onclick = createPost;
  modalPost.onclick = (e) => { if (e.target === modalPost) closePostModal(); };
  document.addEventListener('click', (e) => {
    if (e.target.matches('.btn-like')) handleLike(e);
    if (e.target.matches('.btn-open')) openPostModal(e);
    if (e.target.matches('.btn-delete-post')) handleDeletePost(e);
    if (e.target.matches('.btn-follow')) handleFollow(e);
    if (e.target.matches('.btn-add-comment')) handleAddComment(e);
    if (e.target.matches('.btn-delete-comment')) handleDeleteComment(e);
  });
  searchInput.oninput = () => filterUsers(searchInput.value);
}

function openAuth(mode){
  modalAuth.style.display='flex';
  if(mode==='login'){
    authTitle.textContent='Log in'; authUsername.style.display='none'; authEmail.style.display='block';
  } else { authTitle.textContent='Register'; authUsername.style.display='block'; authEmail.style.display='block'; }
}
function closeAuth(){ modalAuth.style.display='none'; authUsername.value=''; authEmail.value=''; authPassword.value=''; }

async function submitAuth(){
  const isRegister = authTitle.textContent.toLowerCase().includes('register');
  const username = authUsername.value.trim(); const email = authEmail.value.trim(); const password = authPassword.value.trim();
  try{
    if(isRegister){
      const res = await fetch(`${API}/auth/register`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({username,email,password})});
      const data = await res.json();
      if(res.ok) {
        token = data.token;
        localStorage.setItem('token', token);
        me = data.user || null;
        if(me) profileCard.innerHTML = `<div><strong>${me.username}</strong><div class="small">${me.email}</div></div>`;
        btnLogout.style.display='inline-block'; btnLogin.style.display='none'; btnRegister.style.display='none';
        closeAuth();
        showToast('Registered successfully', 'success');
      } else showToast(data.message||'Error', 'error');
    } else {
      const res = await fetch(`${API}/auth/login`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email,password})});
      const data = await res.json();
      if(res.ok){
        token = data.token;
        localStorage.setItem('token', token);
        me = data.user || null;
        if(me) profileCard.innerHTML = `<div><strong>${me.username}</strong><div class="small">${me.email}</div></div>`;
        btnLogout.style.display='inline-block'; btnLogin.style.display='none'; btnRegister.style.display='none';
        closeAuth();
        showToast('Signed in', 'success');
      } else showToast(data.message||'Error', 'error');
    }
  }catch(err){ showToast('Network error', 'error'); }
}

async function logout(){ token=null; localStorage.removeItem('token'); me=null; btnLogout.style.display='none'; btnLogin.style.display='inline-block'; btnRegister.style.display='inline-block'; profileCard.innerHTML='<div class="placeholder">Not signed in</div>'; }

// Custom confirm dialog that returns a Promise<boolean>
const confirmModal = qs('#confirmModal');
const confirmText = qs('#confirmText');
const confirmYes = qs('#confirmYes');
const confirmNo = qs('#confirmNo');
function confirmAction(message){
  return new Promise((resolve) => {
    confirmText.textContent = message || 'Are you sure?';
    confirmModal.style.display = 'flex';
    function cleanup(){
      confirmModal.style.display = 'none';
      confirmYes.removeEventListener('click', onYes);
      confirmNo.removeEventListener('click', onNo);
      confirmModal.removeEventListener('click', onBackdrop);
    }
    function onYes(){ cleanup(); resolve(true); }
    function onNo(){ cleanup(); resolve(false); }
    function onBackdrop(e){ if(e.target === confirmModal){ cleanup(); resolve(false); } }
    confirmYes.addEventListener('click', onYes);
    confirmNo.addEventListener('click', onNo);
    confirmModal.addEventListener('click', onBackdrop);
  });
}

async function apiFetch(path, opts={}){
  opts.headers = opts.headers || {};
  if(token) opts.headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, opts);
  const json = await res.json().catch(()=>({}));
  // If token is invalid or missing, prompt login and clear token
  if (res.status === 401) {
    token = null;
    localStorage.removeItem('token');
    me = null;
    btnLogout.style.display = 'none';
    btnLogin.style.display = 'inline-block';
    btnRegister.style.display = 'inline-block';    showToast('Session expired. Please log in.', 'info');    openAuth('login');
  }
  return { ok: res.ok, status: res.status, data: json };
}

async function loadProfile(){
  if(!token) {
    profileCard.innerHTML = `<div class="placeholder">Not signed in</div>`;
    return;
  }

  const res = await apiFetch('/auth/me');
  if (res.ok) {
    me = res.data;
    profileCard.innerHTML = `<div><strong>${me.username}</strong><div class="small">${me.email}</div></div>`;
    btnLogout.style.display='inline-block'; btnLogin.style.display='none'; btnRegister.style.display='none';
    // show admin link when user has admin role
    const adminLink = document.getElementById('btnAdmin');
    if (adminLink) adminLink.style.display = (me.role === 'admin') ? 'inline-block' : 'none';
  } else {
    profileCard.innerHTML = `<div class="placeholder">Signed out</div>`;    showToast('Please sign in to access full features', 'info');  }
}

async function loadUsers(){
  const res = await apiFetch('/users');
  if(!res.ok) { usersList.innerHTML='<li class="placeholder">Unable to load users</li>'; return; }
  usersList.innerHTML = '';
  res.data.forEach(u => {
    const li = document.createElement('li');
    li.innerHTML = `<div><a href="./profile.html?id=${u._id}"><strong>${u.username}</strong></a><div class="small">${u.email}</div></div><div><button data-id="${u._id}" class="btn-follow">Follow</button></div>`;
    usersList.appendChild(li);
  });
}

// Debounced server-side search for users (works anonymously)
function debounce(fn, wait=300){ let t; return (...args)=>{ clearTimeout(t); t = setTimeout(()=>fn.apply(this, args), wait); }; }

async function performUserSearch(q){
  q = (q||'').trim();
  if (!q){ await loadUsers(); return; }
  usersList.innerHTML = '<li class="placeholder">Searching...</li>';
  const res = await apiFetch(`/users/search?q=${encodeURIComponent(q)}`);
  if(!res.ok){ usersList.innerHTML = '<li class="placeholder">Unable to search users</li>'; return; }
  usersList.innerHTML = '';
  if(!res.data.length) usersList.innerHTML = '<li class="placeholder">No users found</li>';
  res.data.forEach(u => {
    const li = document.createElement('li');
    li.innerHTML = `<div><a href="./profile.html?id=${u._id}"><strong>${u.username}</strong></a><div class="small">${u.email}</div></div><div><button data-id="${u._id}" class="btn-follow">Follow</button></div>`;
    usersList.appendChild(li);
  });
}

const debouncedUserSearch = debounce(performUserSearch, 300);

function filterUsers(query){ debouncedUserSearch(query); }

async function loadPosts(){
  postsFeed.innerHTML = '<div class="placeholder">Loading feed...</div>';
  const res = await apiFetch('/posts');
  if(!res.ok){ postsFeed.innerHTML = '<div class="placeholder">Unable to load posts</div>'; return; }
  postsFeed.innerHTML = '';
  res.data.forEach(post => postsFeed.appendChild(renderPost(post)));
}

function renderPost(p){
  const el = document.createElement('div'); el.className='post';
  el.innerHTML = `
    <div class="meta"><div><a href="./profile.html?id=${p.author?._id || p.author}"><strong>${p.author?.username||p.authorSnapshot?.username||'Unknown'}</strong></a></div><div class="small">${fmtDate(p.createdAt)}</div></div>
    <div class="content">${escapeHtml(p.content)} ${p.image?`<div class="small"><img src="${escapeHtml(p.image)}" style="max-width:100%;border-radius:8px;margin-top:8px"/></div>`:''}</div>
    <div class="actions">
      <button class="btn-open" data-id="${p._id}">💬 ${p.commentsCount||0}</button>
      <button class="btn-like" data-id="${p._id}">❤️ ${p.likes?p.likes.length:0}</button>
      <button class="btn-delete-post small delete" data-id="${p._id}">Delete</button>
    </div>
  `;
  return el;
}

function escapeHtml(str){ if(!str) return ''; return String(str).replace(/[&<>"']/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':"&#39;" }[c])); }

async function createPost(){
  if(!token) { openAuth('login'); return; }
  const content = postContent.value.trim(); const image = postImage.value.trim();
  if(!content){ showToast('Write something to post', 'error'); return; }
  const res = await apiFetch('/posts', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({content,image}) });
  if(!res.ok){ showToast(res.data.message||'Unable to create', 'error'); return; }
  postContent.value=''; postImage.value=''; await loadPosts();
}

async function handleLike(e){
  if(!token) { openAuth('login'); return; }
  const id = e.target.dataset.id; // naive toggle by checking button text / fetch latest
  // optimistic: call /posts/:id/like
  const res = await apiFetch(`/posts/${id}/like`, { method:'POST' });
  if(!res.ok) { // try unlike
    const res2 = await apiFetch(`/posts/${id}/unlike`, { method:'POST' }); if(!res2.ok) showToast(res2.data.message||'Action failed', 'error');
  }
  await loadPosts();
}

async function openPostModal(e){
  const id = e.target.dataset.id; const res = await apiFetch(`/posts/${id}`);
  if(!res.ok){ showToast('Unable to load post', 'error'); return; }
  const p = res.data;
  postDetails.innerHTML = `<div><h3>${escapeHtml(p.content)}</h3><div class="small">by ${p.author?.username||'unknown'} • ${fmtDate(p.createdAt)}</div><hr/></div>`;
  // comments
  const commentsRes = await apiFetch(`/posts/${id}/comments`);
  const list = document.createElement('div');
  list.innerHTML = '<h4>Comments</h4>';
  if(commentsRes.ok){
    commentsRes.data.forEach(c=>{
      const d = document.createElement('div'); d.className='post'; d.innerHTML = `<div class="small"><strong>${c.author?.username||'anon'}</strong> • ${fmtDate(c.createdAt)}</div><div style="margin-top:8px">${escapeHtml(c.text)}</div>${token?`<div style="margin-top:8px"><button data-id="${c._id}" class="btn-delete-comment small delete">Delete</button></div>`:''}`;
      list.appendChild(d);
    });
  } else list.innerHTML += '<div class="small">Unable to load comments</div>';

  // add comment area
  if(token){
    const add = document.createElement('div'); add.style.marginTop='8px'; add.innerHTML = `<textarea id="commentInput" rows="2" style="width:100%" placeholder="Add a comment"></textarea><div style="display:flex;justify-content:flex-end;margin-top:8px"><button data-id="${id}" class="btn-add-comment btn-primary">Comment</button></div>`;
    list.appendChild(add);
  }

  postDetails.appendChild(list);
  modalPost.style.display='flex';
}
function closePostModal(){ modalPost.style.display='none'; postDetails.innerHTML=''; }

async function handleDeletePost(e){
  if(!token) { showToast('Please login to delete posts', 'info'); openAuth('login'); return; }
  const ok = await confirmAction('Delete this post?'); if(!ok) return;
  const id = e.target.dataset.id;
  const res = await apiFetch(`/posts/${id}`, { method:'DELETE' });
  if(!res.ok){ showToast(res.data.message||'Delete failed', 'error'); return; }
  await loadPosts();
}

async function handleFollow(e){
  if(!token) { showToast('Please login to follow users', 'info'); openAuth('login'); return; }
  const id = e.target.dataset.id;
  const res = await apiFetch(`/users/${id}/follow`, { method:'POST' });
  if(!res.ok){ showToast(res.data.message||'Failed', 'error'); return; }
  showToast('Followed', 'success');
  await loadUsers();
}

async function handleAddComment(e){
  if(!token) { showToast('Please login to comment', 'info'); openAuth('login'); return; }
  const id = e.target.dataset.id;
  const txt = qs('#commentInput').value.trim(); if(!txt){ showToast('Write a comment', 'error'); return; }
  const res = await apiFetch(`/posts/${id}/comments`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({text:txt}) });
  if(!res.ok){ showToast(res.data.message||'Failed', 'error'); return; }
  openPostModal({ target: { dataset: { id } }});
}

async function handleDeleteComment(e){
  if(!token) { showToast('Please login to delete comments', 'info'); openAuth('login'); return; }
  const ok = await confirmAction('Delete comment?'); if(!ok) return;
  const id = e.target.dataset.id;
  const res = await apiFetch(`/posts/comments/${id}`, { method:'DELETE' });
  if(!res.ok){ showToast(res.data.message||'Failed', 'error'); return; }
  // refresh modal if open
  const openBtn = document.querySelector('.btn-open[data-id]'); if(openBtn) openPostModal({ target: openBtn });
}

init();

// Small helper to surface CORS helpful note
window.addEventListener('load', ()=>{ if(location.protocol==='file:') console.info('Tip: Open this file in the browser (file:// works) or serve it via a static server. Ensure backend running at http://localhost:5000'); });