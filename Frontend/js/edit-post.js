const API='http://localhost:5000/api';
const qs=(s)=>document.querySelector(s);
function getQuery(name){ return new URL(location.href).searchParams.get(name); }
async function apiFetch(path, opts={}){ opts.headers=opts.headers||{}; const token=localStorage.getItem('token'); if(token) opts.headers['Authorization']=`Bearer ${token}`; const res=await fetch(`${API}${path}`, opts); return { ok: res.ok, data: await res.json().catch(()=>({})) }; }
async function init(){ const id = getQuery('id'); if(!id){ qs('#form').innerHTML='<div class="placeholder">No post specified</div>'; return; }
  const res = await apiFetch(`/posts/${id}`); if(!res.ok){ qs('#form').innerHTML='<div class="placeholder">Unable to load</div>'; return; }
  const p = res.data; qs('#form').innerHTML = `<div class="post"><textarea id="content" rows="4" style="width:100%">${p.content}</textarea><input id="image" placeholder="Image URL" value="${p.image||''}" /><div style="margin-top:8px"><button id="btnSave">Save</button></div></div>`;
  qs('#btnSave').onclick = async ()=>{ const content = qs('#content').value.trim(); const image = qs('#image').value.trim(); const r = await apiFetch(`/posts/${id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ content, image }) }); if(!r.ok){ qs('#msg').textContent = r.data.message || 'Failed'; return; } qs('#msg').textContent = 'Saved'; }
}
init();