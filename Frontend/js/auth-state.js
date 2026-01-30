// Check auth state and show admin link on pages that include it
(async function(){
  const adminLink = document.getElementById('btnAdmin');
  if(!adminLink) return;
  try{
    const token = localStorage.getItem('token');
    if(!token) { adminLink.style.display = 'none'; return; }
    const res = await fetch('http://localhost:5000/api/auth/me', { headers: { 'Authorization': `Bearer ${token}` } });
    if(!res.ok) { adminLink.style.display='none'; return; }
    const me = await res.json();
    adminLink.style.display = (me.role === 'admin') ? 'inline-block' : 'none';
  }catch(e){ adminLink.style.display='none'; }
})();