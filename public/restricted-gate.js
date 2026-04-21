/* public/restricted-gate.js
   Simple client-side password gate. Toggle by commenting out the RESTRICTED line at the top.
   Password (as provided): Tramburg
   Note: This is a client-side gate — not suitable for sensitive content. */

(function(){
  // Toggle protection: comment out or set to false to disable the gate
  const RESTRICTED = true;

  // PASSWORD: provided by repository owner. This file contains the plain password so it can be used immediately.
  // If you'd rather store only a hash, let me know and I can update the file to store a SHA-256 hash instead.
  const PASSWORD_PLAIN = "Tramburg";
  const STORAGE_KEY = 'site_pw_auth_v1';

  // small helper to create elements
  function el(tag, attrs, children){
    const e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(k => e.setAttribute(k, attrs[k]));
    if (children) children.forEach(c => e.appendChild(c));
    return e;
  }

  function injectStyles(){
    const css = `
#pw-gate{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(10,10,15,0.75);z-index:99999;font-family:system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial}
#pw-gate .card{background:#fff;max-width:420px;width:92%;padding:20px;border-radius:8px;box-shadow:0 10px 30px rgba(0,0,0,0.35);text-align:center}
#pw-gate input[type=password]{width:100%;padding:10px;margin:12px 0;border:1px solid #ddd;border-radius:6px;font-size:16px}
#pw-gate button{padding:10px 16px;border:none;background:#0366d6;color:#fff;border-radius:6px;cursor:pointer;font-size:15px}
#pw-gate .error{color:#b00020;margin-top:8px;font-size:14px;display:none}
.pw-logout-btn{position:fixed;right:12px;top:12px;z-index:99998;background:rgba(255,255,255,0.95);border:1px solid #ddd;padding:6px 10px;border-radius:6px;cursor:pointer;font-size:13px}
`;
    const s = document.createElement('style'); s.textContent = css; document.head.appendChild(s);
  }

  function createGateNodes(){
    const wrap = el('div',{id:'pw-gate','aria-hidden':'true',style:'display:none'});
    const card = el('div',{class:'card',role:'dialog','aria-modal':'true','aria-labelledby':'pw-title'});
    const title = el('h2',{id:'pw-title'}); title.textContent = 'Enter password to continue';
    const input = el('input',{id:'pw-input',type:'password',placeholder:'Password',autocomplete:'current-password'});
    const btnWrap = el('div');
    const btn = el('button',{id:'pw-submit'}); btn.textContent = 'Unlock';
    const err = el('div',{class:'error',id:'pw-error'}); err.textContent = 'Wrong password — try again';
    const note = el('div',null); note.style.marginTop='8px'; note.style.fontSize='13px'; note.style.color='#666'; note.textContent='This is a client-side gate (not cryptographically secure).';
    btnWrap.appendChild(btn);
    card.appendChild(title);
    card.appendChild(input);
    card.appendChild(btnWrap);
    card.appendChild(err);
    card.appendChild(note);
    wrap.appendChild(card);
    document.body.appendChild(wrap);

    const logoutBtn = el('button',{class:'pw-logout-btn',id:'pw-logout',title:'Clear saved auth',style:'display:none'});
    logoutBtn.textContent = 'Logout';
    document.body.appendChild(logoutBtn);
  }

  function showGate(){
    const g = document.getElementById('pw-gate'); if(!g) return;
    g.style.display = 'flex'; g.setAttribute('aria-hidden','false');
    const input = document.getElementById('pw-input'); if(input) input.focus();
  }
  function hideGate(){
    const g = document.getElementById('pw-gate'); if(!g) return;
    g.style.display = 'none'; g.setAttribute('aria-hidden','true');
    const l = document.getElementById('pw-logout'); if(l) l.style.display = 'block';
  }
  function showError(msg){ const e=document.getElementById('pw-error'); if(!e) return; e.textContent=msg; e.style.display='block'; setTimeout(()=>e.style.display='none',3000); }

  document.addEventListener('DOMContentLoaded', function(){
    try{
      if (!RESTRICTED) return; // protection disabled by toggle
      injectStyles(); createGateNodes();
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && stored === '1') { hideGate(); return; }
      showGate();
      const input = document.getElementById('pw-input'); const submit = document.getElementById('pw-submit');
      async function trySubmit(){
        const val = (input && input.value) ? input.value : '';
        if (val === PASSWORD_PLAIN) {
          localStorage.setItem(STORAGE_KEY,'1'); hideGate();
        } else {
          showError('Wrong password — try again');
        }
      }
      if (submit) submit.addEventListener('click', trySubmit);
      if (input) input.addEventListener('keydown', (e)=>{ if (e.key==='Enter') trySubmit(); });
      const logout = document.getElementById('pw-logout'); if (logout) logout.addEventListener('click', ()=>{ localStorage.removeItem(STORAGE_KEY); location.reload(); });
    }catch(err){ console.error('restricted-gate error',err); }
  });
})();
