const API = 'http://localhost:5000/api';
const qs = s => document.querySelector(s);

async function init(){
  const res = await fetch(`${API}/posts/stats`);
  const data = await res.json().catch(()=>[]);
  if(!Array.isArray(data) || !data.length) { qs('#stats').innerHTML = '<div class="placeholder">No stats yet</div>'; return; }
  const tbl = document.createElement('table');
  tbl.innerHTML = `<thead><tr><th>User</th><th>Posts</th><th>Avg Likes</th><th>Avg Comments</th></tr></thead>`;
  const body = document.createElement('tbody');
  data.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td><a href="./profile.html?id=${r.authorId}">${r.username||'User'}</a></td><td>${r.posts}</td><td>${r.avgLikes}</td><td>${r.avgComments}</td>`;
    body.appendChild(tr);
  });
  tbl.appendChild(body);
  qs('#stats').appendChild(tbl);
}

init();