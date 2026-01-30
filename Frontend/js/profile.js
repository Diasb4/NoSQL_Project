const API = 'http://localhost:5000/api';
const qs = s => document.querySelector(s);
const fmtDate = d => new Date(d).toLocaleString();

async function apiFetch(path, opts={}){
  opts.headers = opts.headers || {};
  const res = await fetch(`${API}${path}`, opts);
  return { ok: res.ok, data: await res.json().catch(()=>({})) };
}

function getQuery(name){ const url = new URL(location.href); return url.searchParams.get(name); }

async function init(){
  const id = getQuery('id');
  if(!id){ qs('#profileSection').innerHTML = '<div class="placeholder">No user specified</div>'; return; }
  const res = await apiFetch(`/users/${id}`);
  if(!res.ok){ qs('#profileSection').innerHTML = '<div class="placeholder">Unable to load user</div>'; return; }
  const u = res.data;
  qs('#profileSection').innerHTML = `<div class="post"><h3>${u.username}</h3><div class="small">${u.email}</div><div style="margin-top:8px">Followers: ${u.followers?.length||0} • Following: ${u.following?.length||0}</div><div style="margin-top:8px">${u.bio||''}</div></div>`;

  // load user's posts
  const p = await apiFetch(`/posts/user/${id}`);
  if(!p.ok){ qs('#postsSection').innerHTML = '<div class="placeholder">Unable to load posts</div>'; return; }
  if(!p.data.length) qs('#postsSection').innerHTML = '<div class="placeholder">No posts</div>';
  else {
    qs('#postsSection').innerHTML = '';
    p.data.forEach(post => {
      const d = document.createElement('div'); d.className='post'; d.innerHTML = `<div class="meta"><strong>${post.author?.username||'Unknown'}</strong> • ${fmtDate(post.createdAt)}</div><div style="margin-top:8px">${post.content}</div><div class="small">❤️ ${post.likes?.length||0} • 💬 ${post.commentsCount||0}</div>`; qs('#postsSection').appendChild(d);
    });
  }
}

init();