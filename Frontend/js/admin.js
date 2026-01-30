const API='http://localhost:5000/api';
const el=(s)=>document.querySelector(s);
async function apiFetch(path, opts={}){opts.headers=opts.headers||{};const token=localStorage.getItem('token'); if(token) opts.headers['Authorization']=`Bearer ${token}`; const res=await fetch(`${API}${path}`, opts); return {ok:res.ok, status:res.status, data: await res.json().catch(()=>({}))};}

el('#btnDeleteNoLikes').onclick=async ()=>{
  const res = await apiFetch('/posts/without-likes', { method:'DELETE' });
  if(!res.ok) return el('#adminMsg').textContent = (res.data&&res.data.message)||'Failed';
  el('#adminMsg').textContent = `Deleted ${res.data.deletedCount}`;
};

el('#btnBulkUpdate').onclick=async ()=>{
  const f = el('#bulkFilter').value || '{}'; const s = el('#bulkSet').value || '{}';
  let filter,set;
  try{ filter = JSON.parse(f); set = JSON.parse(s); }catch(e){ el('#adminMsg').textContent='Invalid JSON'; return; }
  const res = await apiFetch('/posts/bulk-update', { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ filter, set }) });
  if(!res.ok) return el('#adminMsg').textContent = (res.data&&res.data.message)||'Failed';
  el('#adminMsg').textContent = `Matched ${res.data.matchedCount}, Modified ${res.data.modifiedCount}`;
};

el('#btnSetRole').onclick=async ()=>{
  const id = el('#roleUserId').value.trim(); const role = el('#roleSelect').value;
  if(!id) return el('#adminMsg').textContent='User id required';
  const res = await apiFetch(`/users/${id}/role`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ role }) });
  if(!res.ok) return el('#adminMsg').textContent = (res.data&&res.data.message)||'Failed';
  el('#adminMsg').textContent = `Role updated: ${res.data.username} → ${res.data.role}`;
};

el('#btnDeleteComments').onclick=async ()=>{
  const id = el('#delCommentsUserId').value.trim(); if(!id) return el('#adminMsg').textContent='User id required';
  const res = await apiFetch(`/posts/comments/by-user/${id}`, { method:'DELETE' });
  if(!res.ok) return el('#adminMsg').textContent = (res.data&&res.data.message)||'Failed';
  el('#adminMsg').textContent = `Deleted comments: ${res.data.deletedCount}`;
};