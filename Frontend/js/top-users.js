const API = 'http://localhost:5000/api';
const qs = s => document.querySelector(s);

async function init(){
  const res = await fetch(`${API}/users/top-followed`);
  const data = await res.json().catch(()=>[]);
  if(!data || !data.length) { qs('#topList').innerHTML = '<div class="placeholder">No data</div>'; return; }
  const ul = document.createElement('ul');
  data.forEach(u => {
    const li = document.createElement('li');
    li.innerHTML = `<div><a href="./profile.html?id=${u._id||u._id}"><strong>${u.username}</strong></a><div class="small">Followers: ${u.followersCount||u.followersCount||0}</div></div>`;
    ul.appendChild(li);
  });
  qs('#topList').appendChild(ul);
}

init();