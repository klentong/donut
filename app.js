const CDN='https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/';
const ST=['Pending','Confirmed','Preparing','Ready','Out for Delivery','Completed','Cancelled'],PAY=['Cash on Delivery','GCash','Card'],FEE=50;
let db,user=null,cart=[],S={v:'menu',cat:0,qs:'',sort:'name',edit:null,img:'🍩'};
const $=s=>document.querySelector(s),app=$('#app');
const money=n=>'₱'+Number(n).toFixed(2);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const toast=(m,e)=>{const t=document.createElement('div');t.className='toast'+(e?' err':'');t.textContent=m;document.body.append(t);setTimeout(()=>t.remove(),2400)};
const q=(sql,p=[])=>{const st=db.prepare(sql);st.bind(p);const r=[];while(st.step())r.push(st.getAsObject());st.free();return r};
const STORE='donut-shop-state',STORE_DB='databases';
function openStore(){return new Promise((resolve,reject)=>{const r=indexedDB.open(STORE,1);r.onupgradeneeded=()=>r.result.createObjectStore(STORE_DB);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
async function loadSaved(){const idb=await openStore();return new Promise((resolve,reject)=>{const r=idb.transaction(STORE_DB,'readonly').objectStore(STORE_DB).get('database');r.onsuccess=()=>{idb.close();resolve(r.result)};r.onerror=()=>{idb.close();reject(r.error)}})}
const save=async()=>{const idb=await openStore();return new Promise((resolve,reject)=>{const tx=idb.transaction(STORE_DB,'readwrite');tx.objectStore(STORE_DB).put(db.export(),'database');tx.oncomplete=()=>{idb.close();resolve()};tx.onerror=()=>{idb.close();reject(tx.error)};tx.onabort=()=>{idb.close();reject(tx.error)}})};
const exec=async(sql,p=[])=>{db.run(sql,p);await save()};
const hash=async s=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))].map(x=>x.toString(16).padStart(2,'0')).join('');
const pic=i=>i&&i.startsWith('data:image/')?`<img src="${i}">`:esc(i||'🍩');
const lastId=()=>q('SELECT last_insert_rowid() id')[0].id;

/* ---------- start / auth ---------- */
function splash(){app.innerHTML=`<div class="splash"><div class="logo">🍩</div><h1>Donut Shop</h1><div class="bar"><i></i></div><p>Loading shop...</p></div>`}
async function start(){
 splash();
 try{
  const SQL=await initSqlJs({locateFile:f=>CDN+f}),stored=await loadSaved();
  if(stored)db=new SQL.Database(new Uint8Array(stored));
  else{const response=await fetch('database.sql');if(!response.ok)throw new Error('Could not load database.sql');db=new SQL.Database();db.run(await response.text());await save()}
  q('SELECT 1 FROM users LIMIT 1');authView()
 }catch(e){console.error(e);app.innerHTML=`<div class="splash"><div class="logo">🍩</div><h1>Could not start</h1><p>${esc(e.message||'Check that database.sql is available and reload.')}</p><button class="btn" onclick="start()">Retry</button></div>`}
}
function authView(reg){app.innerHTML=`<div class="auth"><div class="logo">🍩</div><h1>${reg?'Create account':'Welcome back'}</h1>
${reg?'<input id="n" placeholder="Full name">':''}<input id="e" type="email" placeholder="Email"><input id="p" type="password" placeholder="Password">
${reg?'<input id="p2" type="password" placeholder="Confirm password"><input id="ph" placeholder="Phone"><input id="ad" placeholder="Address">':''}
<button class="btn" onclick="${reg?'register()':'login()'}">${reg?'Register':'Login'}</button><br><br>
<button class="btn ghost" onclick="authView(${!reg})">${reg?'Back to login':'Register'}</button></div>`}
async function login(){
 const r=q('SELECT * FROM users WHERE email=? AND password=?',[$('#e').value.trim().toLowerCase(),await hash($('#p').value)])[0];
 if(!r)return toast('Invalid email or password',1);
 if(r.status!=='active')return toast('Account deactivated',1);
 user=r;cart=[];S.v=r.role==='admin'?'dash':'menu';render()}
async function register(){
 const g=x=>$('#'+x).value.trim(),email=g('e').toLowerCase();
 if(!g('n')||!/^\S+@\S+\.\S+$/.test(email)||g('p').length<6)return toast('Fill all fields (password 6+ chars)',1);
 if(g('p')!==$('#p2').value)return toast('Passwords do not match',1);
 if(q('SELECT 1 FROM users WHERE email=?',[email]).length)return toast('Email already used',1);
 await exec('INSERT INTO users(name,email,password,phone,address,role,status) VALUES(?,?,?,?,?,?,?)',[g('n'),email,await hash(g('p')),g('ph'),g('ad'),'customer','active']);
 toast('Account created! Please log in');authView()}
const logout=()=>{user=null;cart=[];authView()};

/* ---------- shell ---------- */
const ADMIN=['dash','dd','df','ao','au'];
function go(v){S.v=v;S.qs='';render()}
function goq(v,qs){S.v=v;S.qs=qs;render()}
function render(){
 const a=user.role==='admin';
 if(ADMIN.includes(S.v)&&!a)S.v='menu';
 if(a&&!ADMIN.includes(S.v))S.v='dash';
 if(a){
  const tabs=[['dash','🏠','Dashboard'],['dd','🍩','Donuts'],['ao','📦','Orders'],['au','👥','Users']];
  app.innerHTML=`
   <button class="adm-menu-btn" onclick="toggleSidebar()">☰</button>
   <div class="adm-overlay" id="admOverlay" onclick="closeSidebar()"></div>
   <div class="adm-shell">
    <aside class="adm-sidebar" id="admSidebar">
     <div class="brand"><span class="brand-icon">🍩</span><span class="brand-name">Donuts</span></div>
     <nav class="adm-nav">
      ${tabs.map(t=>`<button class="${S.v===t[0]?'on':''}" onclick="go('${t[0]}');closeSidebar()"><span class="nav-icon">${t[1]}</span>${t[2]}</button>`).join('')}
     </nav>
     <div class="sidebar-footer"><div class="donut-deco">🍩</div><p>Sweet moments<br>make a better day!</p></div>
    </aside>
    <div class="adm-content">${V[S.v]()}</div>
   </div>`;
  if(S.v==='dash')setTimeout(initChart,50);
 } else {
  const tabs=[['menu','🏠','Menu'],['cart','🛒','Cart'+(cart.length?` (${cart.length})`:'')],['orders','🧾','Orders'],['me','👤','Profile']];
  app.innerHTML=`<div class="customer-wrap">${V[S.v]()}</div><nav class="bottom-nav">${tabs.map(t=>`<button class="${S.v===t[0]?'on':''}" onclick="go('${t[0]}')">${t[1]}<small>${t[2]}</small></button>`).join('')}</nav>`;
 }
}
function toggleSidebar(){document.getElementById('admSidebar').classList.toggle('open');document.getElementById('admOverlay').classList.toggle('open')}
function closeSidebar(){const s=document.getElementById('admSidebar'),o=document.getElementById('admOverlay');if(s)s.classList.remove('open');if(o)o.classList.remove('open')}
const search=ph=>`<input placeholder="${ph}" value="${esc(S.qs)}" onchange="S.qs=this.value;render()">`;
const empty=t=>`<div class="empty">🍩<br>${t}</div>`;

/* ---------- customer ---------- */
const V={
menu(){
 const cats=q('SELECT * FROM categories'),
 ds=q(`SELECT d.*,c.name cat FROM donuts d JOIN categories c ON c.id=d.category_id WHERE d.status!='archived' AND (?=0 OR d.category_id=?) AND d.name LIKE ? ORDER BY ${S.sort==='price'?'d.price':'d.name'}`,[S.cat,S.cat,'%'+S.qs+'%']);
 return `<h1>Hi ${esc(user.name.split(' ')[0])}! 🍩</h1><small>What are you craving today?</small>${search('Search donuts...')}
 <div class="box" style="background:var(--a)">🎉 <b>Fresh batch daily</b> – order before they're gone!</div>
 <div class="chips"><button class="chip ${S.cat?'':'on'}" onclick="S.cat=0;render()">All</button>${cats.map(c=>`<button class="chip ${S.cat==c.id?'on':''}" onclick="S.cat=${c.id};render()">${esc(c.name)}</button>`).join('')}
 <select style="width:auto" onchange="S.sort=this.value;render()"><option value="name">A–Z</option><option value="price" ${S.sort=='price'?'selected':''}>Price</option></select></div>
 ${ds.length?`<div class="grid">${ds.map(d=>{const ok=d.status==='available'&&d.stock>0;return `<div class="card"><div class="img">${pic(d.image)}</div><b>${esc(d.name)}</b><br><small>${esc(d.cat)}</small><p>${esc(d.description)}</p>
 <div class="row"><b>${money(d.price)}</b>${ok?`<button class="btn sm" onclick="add(${d.id})">+ Add</button>`:`<span class="tag">${d.status==='available'?'Sold out':'Unavailable'}</span>`}</div></div>`}).join('')}</div>`:empty('No donuts found')}`},
cart(){
 if(!cart.length)return `<h1>Cart</h1>${empty('Your cart is empty')}`;
 const rows=cart.map((c,i)=>({i,n:c.qty,d:q('SELECT * FROM donuts WHERE id=?',[c.id])[0]})),sub=rows.reduce((s,r)=>s+r.d.price*r.n,0);
 return `<h1>Cart</h1>${rows.map(r=>`<div class="card row"><div class="img" style="width:60px;height:60px;font-size:34px;margin:0">${pic(r.d.image)}</div>
 <div style="flex:1"><b>${esc(r.d.name)}</b><br><small>${money(r.d.price)} × ${r.n} = ${money(r.d.price*r.n)}</small><br>
 <button class="chip" onclick="chg(${r.i},-1)">−</button> ${r.n} <button class="chip" onclick="chg(${r.i},1)">+</button></div><button class="chip" onclick="cart.splice(${r.i},1);render()">🗑</button></div>`).join('')}
 <div class="box"><div class="row"><span>Subtotal</span>${money(sub)}</div><div class="row"><span>Delivery fee</span>${money(FEE)}</div><div class="row"><b>Total</b><b>${money(sub+FEE)}</b></div></div>
 <h2>Checkout</h2><input id="ad" placeholder="Delivery address" value="${esc(user.address)}"><input id="ph" placeholder="Contact number" value="${esc(user.phone)}">
 <select id="pm">${PAY.map(p=>`<option>${p}</option>`).join('')}</select><button class="btn" onclick="place()">Place Order</button>`},
orders(){
 const os=q('SELECT * FROM orders WHERE user_id=? ORDER BY id DESC',[user.id]);
 return `<h1>My Orders</h1>${os.length?os.map(o=>ordCard(o)).join(''):empty('No orders yet')}`},
me(){
 const n=q('SELECT COUNT(*) n FROM orders WHERE user_id=?',[user.id])[0].n;
 return `<h1>Profile</h1><div class="box"><div class="logo" style="font-size:48px;animation:none">👤</div><small>${esc(user.email)} · ${n} orders</small>
 <input id="n" value="${esc(user.name)}"><input id="ph" value="${esc(user.phone)}" placeholder="Phone"><input id="ad" value="${esc(user.address)}" placeholder="Address">
 <input id="np" type="password" placeholder="New password (optional)"><button class="btn" onclick="saveMe()">Save profile</button></div><button class="btn red" onclick="logout()">Logout</button>`},

/* ---------- admin ---------- */
dash(){
 const n=x=>q(x)[0].n;
 const totalOrders=n('SELECT COUNT(*) n FROM orders');
 const pending=n("SELECT COUNT(*) n FROM orders WHERE order_status='Pending'");
 const totalDonuts=n("SELECT COUNT(*) n FROM donuts WHERE status!='archived'");
 const totalSales=money(n("SELECT COALESCE(SUM(total_amount),0) n FROM orders WHERE order_status!='Cancelled'"));
 const recentOrders=q(`SELECT o.id,o.order_status,o.total_amount,o.created_at,d.name dname,d.image dimg
  FROM orders o
  JOIN order_items oi ON oi.order_id=o.id
  JOIN donuts d ON d.id=oi.donut_id
  GROUP BY o.id ORDER BY o.id DESC LIMIT 5`);
 const statusClass=s=>s==='Completed'?'completed':s==='Cancelled'?'cancelled':'pending';
 const roRows=recentOrders.length?recentOrders.map(o=>{
  const t=o.created_at?o.created_at.slice(11,16):'';
  const ico=o.dimg&&o.dimg.startsWith('data:image/')?`<img src="${o.dimg}" style="width:100%;height:100%;object-fit:cover;border-radius:8px">`:(o.dimg||'🍩');
  return `<div class="recent-order-row">
   <div class="ro-icon">${ico}</div>
   <div class="ro-info"><div class="ro-name">${esc(o.dname)}</div><div class="ro-time">${t}</div></div>
   <span class="ro-status ${statusClass(o.order_status)}">${esc(o.order_status)}</span>
   <span class="ro-price">${money(o.total_amount)}</span>
  </div>`;}).join(''):`<div class="empty" style="padding:20px">No orders yet</div>`;
 return `
 <div class="dash-header">
  <h1>Dashboard</h1>
  <p>Here's a quick look at your donut shop today.</p>
 </div>
 <div class="stat-cards">
  <div class="stat-card sc-blue">
   <div class="sc-icon">🛒</div>
   <div class="sc-info"><div class="sc-label">Total Orders</div><div class="sc-value">${totalOrders}</div></div>
   <span class="sc-trend">📈</span>
  </div>
  <div class="stat-card sc-green">
   <div class="sc-icon">⏳</div>
   <div class="sc-info"><div class="sc-label">Pending</div><div class="sc-value">${pending}</div></div>
   <span class="sc-trend">🕐</span>
  </div>
  <div class="stat-card sc-purple">
   <div class="sc-icon">🍩</div>
   <div class="sc-info"><div class="sc-label">Total Donuts</div><div class="sc-value">${totalDonuts}</div></div>
   <span class="sc-trend">🍩</span>
  </div>
  <div class="stat-card sc-orange">
   <div class="sc-icon">📊</div>
   <div class="sc-info"><div class="sc-label">Total Sales</div><div class="sc-value">${totalSales}</div></div>
   <span class="sc-trend">📊</span>
  </div>
 </div>
 <div class="dash-banner">
  <div class="banner-text">
   <h2>Keep Your Donut Shop<br><span>Running Sweetly!</span></h2>
   <p>Track orders, manage donuts, and see your business grow — all in one place.</p>
   <button class="btn logout-btn" onclick="logout()" style="margin-top:14px">⏏ Logout</button>
  </div>
  <div class="banner-donut">🍩</div>
 </div>
 <div class="dash-bottom">
  <div class="dash-panel">
   <div class="dash-panel-header">
    <h3>📈 Sales Overview</h3>
    <span style="font-size:13px;color:var(--muted)">This Week</span>
   </div>
   <canvas id="salesChart"></canvas>
  </div>
  <div class="dash-panel">
   <div class="dash-panel-header">
    <h3>📋 Recent Orders</h3>
    <a href="#" onclick="go('ao');return false">View All ›</a>
   </div>
   ${roRows}
  </div>
 </div>`},
dd(){
 const ds=q('SELECT d.*,c.name cat FROM donuts d JOIN categories c ON c.id=d.category_id WHERE d.name LIKE ? ORDER BY d.id DESC',['%'+S.qs+'%']);
 return `<div class="row"><h1>Donuts</h1><button class="btn sm" onclick="S.edit=null;S.v='df';render()">+ Add Donut</button></div>${search('Search donuts...')}
 <div style="overflow:auto"><table><tr><th></th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th></th></tr>${ds.map(d=>`<tr><td>${d.image&&d.image.startsWith('data:')?`<img src="${d.image}" width="32">`:esc(d.image)}</td><td>${esc(d.name)}</td><td>${esc(d.cat)}</td><td>${money(d.price)}</td>
 <td><input type="number" min="0" style="width:70px" value="${d.stock}" onchange="upd(${d.id},'stock',Math.max(0,parseInt(this.value)||0))"></td>
 <td><select onchange="upd(${d.id},'status',this.value)">${['available','unavailable','archived'].map(s=>`<option ${s==d.status?'selected':''}>${s}</option>`).join('')}</select></td>
 <td><button class="chip" onclick="S.edit=${d.id};S.v='df';render()">✏️</button><button class="chip" onclick="delD(${d.id})">🗑</button></td></tr>`).join('')}</table></div>`},
df(){
 const d=S.edit?q('SELECT * FROM donuts WHERE id=?',[S.edit])[0]:{name:'',description:'',price:'',stock:'',status:'available',category_id:1,image:'🍩'};S.img=d.image;
 return `<h1>${S.edit?'Edit':'Add New'} Donut</h1><div class="box"><div class="img" id="pv">${pic(d.image)}</div><input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onchange="pick(this)"><small>Or emoji:</small><input value="${d.image&&d.image.startsWith('data:')?'':esc(d.image)}" maxlength="4" oninput="S.img=this.value||'🍩';$('#pv').textContent=S.img">
 <input id="dn" placeholder="Donut name" value="${esc(d.name)}"><select id="dc">${q('SELECT * FROM categories').map(c=>`<option value="${c.id}" ${c.id==d.category_id?'selected':''}>${esc(c.name)}</option>`).join('')}</select>
 <textarea id="dx" placeholder="Description">${esc(d.description)}</textarea><input id="dp" type="number" step="0.01" min="0" placeholder="Price" value="${d.price}"><input id="ds" type="number" min="0" placeholder="Stock" value="${d.stock}">
 <select id="dt">${['available','unavailable','archived'].map(s=>`<option ${s==d.status?'selected':''}>${s}</option>`).join('')}</select>
 <div class="row"><button class="btn ghost" onclick="go('dd')">Cancel</button><button class="btn" onclick="saveD()">Save Donut</button></div></div>`},
ao(){
 const k=S.qs.toLowerCase(),os=q('SELECT o.*,u.name cname,u.email FROM orders o JOIN users u ON u.id=o.user_id ORDER BY o.id DESC').filter(o=>!k||('#'+(1000+o.id)).includes(k)||o.cname.toLowerCase().includes(k));
 return `<h1>Orders</h1>${search('Search order # or customer...')}${os.length?os.map(o=>ordCard(o,1)).join(''):empty('No orders')}`},
au(){
 const k='%'+S.qs+'%',us=q("SELECT u.*,(SELECT COUNT(*) FROM orders WHERE user_id=u.id) oc FROM users u WHERE role='customer' AND (name LIKE ? OR email LIKE ?)",[k,k]);
 return `<h1>Users</h1>${search('Search customers...')}${us.length?`<div style="overflow:auto"><table><tr><th>Name</th><th>Email</th><th>Orders</th><th>Status</th><th></th></tr>${us.map(u=>`<tr><td>${esc(u.name)}</td><td>${esc(u.email)}</td><td><a href="#" onclick="goq('ao','${esc(u.name).replace(/'/g,'')}');return false">${u.oc} view</a></td><td>${u.status}</td>
 <td><button class="chip" onclick="toggleU(${u.id})">${u.status=='active'?'Deactivate':'Activate'}</button></td></tr>`).join('')}</table></div>`:empty('No customers')}`}
};

/* ---------- shared order card ---------- */
function ordCard(o,adm){
 const it=q('SELECT oi.*,d.name FROM order_items oi JOIN donuts d ON d.id=oi.donut_id WHERE order_id=?',[o.id]),i=ST.indexOf(o.order_status);
 const trk=o.order_status==='Cancelled'?'<span class="tag">Cancelled</span>':`<div class="trk">${ST.slice(0,6).map((s,j)=>`<span class="${j<i?'d':j==i?'c':''}">${j<i?'✓':j==i?'●':'○'}<br>${s}</span>`).join('')}</div>`;
 return `<div class="box"><div class="row"><b>Order #${1000+o.id}</b><b>${money(o.total_amount)}</b></div>
 ${adm?`<small>👤 ${esc(o.cname)} · ${esc(o.contact_number)}</small><br>`:''}<small>📍 ${esc(o.delivery_address)} · 💳 ${esc(o.payment_method)} · ${o.created_at}</small>
 <p>${it.map(x=>`${x.quantity}× ${esc(x.name)} (${money(x.subtotal)})`).join('<br>')}</p>${trk}
 ${adm?`<select onchange="setSt(${o.id},this.value)">${ST.map(s=>`<option ${s==o.order_status?'selected':''}>${s}</option>`).join('')}</select>`:''}</div>`}

/* ---------- actions ---------- */
function add(id){const d=q('SELECT stock FROM donuts WHERE id=?',[id])[0],c=cart.find(x=>x.id==id);
 if((c?c.qty:0)>=d.stock)return toast('No more stock',1);c?c.qty++:cart.push({id,qty:1});toast('Added to cart');render()}
function chg(i,n){cart[i].qty+=n;if(cart[i].qty<1)cart.splice(i,1);render()}
async function place(){
 const ad=$('#ad').value.trim(),ph=$('#ph').value.trim(),pm=$('#pm').value;
 if(!ad||!/^[0-9+\- ]{7,15}$/.test(ph)||!PAY.includes(pm))return toast('Enter valid address and phone',1);
 let total=FEE;const items=[];
 for(const c of cart){const d=q('SELECT * FROM donuts WHERE id=?',[c.id])[0]; // price & stock always re-read from DB
  if(!d||d.status!=='available'||c.qty<1||d.stock<c.qty)return toast(`${d?d.name:'Item'} unavailable or low stock`,1);items.push([d,c.qty]);total+=d.price*c.qty}
 db.run('INSERT INTO orders(user_id,total_amount,payment_method,delivery_address,contact_number,order_status) VALUES(?,?,?,?,?,?)',[user.id,total,pm,ad,ph,'Pending']);const oid=lastId();
 items.forEach(([d,n])=>{db.run('INSERT INTO order_items(order_id,donut_id,quantity,price,subtotal) VALUES(?,?,?,?,?)',[oid,d.id,n,d.price,d.price*n]);db.run('UPDATE donuts SET stock=stock-? WHERE id=?',[n,d.id])});
 await save();cart=[];toast(`Order #${1000+oid} placed! 🎉`);go('orders')}
async function saveMe(){
 const n=$('#n').value.trim();if(!n)return toast('Name required',1);
 db.run('UPDATE users SET name=?,phone=?,address=? WHERE id=?',[n,$('#ph').value.trim(),$('#ad').value.trim(),user.id]);
 const np=$('#np').value;if(np){if(np.length<6)return toast('Password 6+ chars',1);db.run('UPDATE users SET password=? WHERE id=?',[await hash(np),user.id])}
 await save();user=q('SELECT * FROM users WHERE id=?',[user.id])[0];toast('Profile saved');render()}
const adminOnly=()=>user&&user.role==='admin';
async function upd(id,f,v){if(!adminOnly()||!['stock','status'].includes(f))return;await exec(`UPDATE donuts SET ${f}=? WHERE id=?`,[v,id]);toast('Updated');render()}
async function delD(id){if(!adminOnly()||!confirm('Delete this donut?'))return;
 if(q('SELECT 1 FROM order_items WHERE donut_id=?',[id]).length){await exec("UPDATE donuts SET status='archived' WHERE id=?",[id]);toast('Has orders – archived instead')}
 else{await exec('DELETE FROM donuts WHERE id=?',[id]);toast('Deleted')}render()}
function pick(el){const f=el.files[0];if(!f)return;
 if(!/^image\/(png|jpeg|webp|gif)$/.test(f.type)||f.size>300000)return toast('Image only, max 300KB',1);
 const r=new FileReader();r.onload=()=>{S.img=r.result;$('#pv').innerHTML=`<img src="${S.img}">`};r.readAsDataURL(f)}
async function saveD(){
 if(!adminOnly())return;const g=x=>$('#'+x).value.trim(),p=parseFloat(g('dp')),s=parseInt(g('ds'));
 if(!g('dn')||!(p>=0)||!(s>=0))return toast('Check name, price and stock',1);
 const a=[+g('dc'),g('dn'),g('dx'),p,s,S.img,g('dt')];
 if(S.edit)await exec('UPDATE donuts SET category_id=?,name=?,description=?,price=?,stock=?,image=?,status=? WHERE id=?',[...a,S.edit]);
 else await exec('INSERT INTO donuts(category_id,name,description,price,stock,image,status) VALUES(?,?,?,?,?,?,?)',a);
 toast('Donut saved');go('dd')}
async function setSt(id,st){
 if(!adminOnly()||!ST.includes(st))return;const o=q('SELECT order_status s FROM orders WHERE id=?',[id])[0].s;
 if(st==='Cancelled'&&o!=='Cancelled')q('SELECT donut_id,quantity FROM order_items WHERE order_id=?',[id]).forEach(x=>db.run('UPDATE donuts SET stock=stock+? WHERE id=?',[x.quantity,x.donut_id]));
 await exec('UPDATE orders SET order_status=? WHERE id=?',[st,id]);toast('Status updated');render()}
async function toggleU(id){if(!adminOnly())return;await exec("UPDATE users SET status=CASE status WHEN 'active' THEN 'inactive' ELSE 'active' END WHERE id=? AND role='customer'",[id]);render()}

/* ---------- sales chart ---------- */
function initChart(){
 const canvas=document.getElementById('salesChart');
 if(!canvas)return;
 const days=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
 // Try to get real weekly sales data grouped by day-of-week
 let raw=[];
 try{raw=q("SELECT strftime('%w',created_at) dow,COALESCE(SUM(total_amount),0) total FROM orders WHERE order_status!='Cancelled' AND created_at>=date('now','-7 days') GROUP BY dow")}catch(e){}
 const map={};raw.forEach(r=>map[r.dow]=Number(r.total));
 // Sunday=0 in SQLite; map to Mon-Sun display
 const vals=[1,2,3,4,5,6,0].map(d=>map[d]||0);
 // If all zeros, use a demo wave so the chart looks alive
 const hasData=vals.some(v=>v>0);
 const data=hasData?vals:[2,4,3,6,5,9,6];
 const W=canvas.offsetWidth||400,H=160;
 canvas.width=W;canvas.height=H;
 const ctx=canvas.getContext('2d');
 const maxV=Math.max(...data,1);
 const pad={t:16,b:28,l:32,r:12};
 const cW=W-pad.l-pad.r,cH=H-pad.t-pad.b;
 const pts=data.map((v,i)=>({x:pad.l+i*(cW/(data.length-1)),y:pad.t+cH-(v/maxV)*cH}));
 // Grid lines
 ctx.strokeStyle='#e2e8f0';ctx.lineWidth=1;
 for(let i=0;i<=3;i++){const y=pad.t+(i/3)*cH;ctx.beginPath();ctx.moveTo(pad.l,y);ctx.lineTo(W-pad.r,y);ctx.stroke()}
 // Gradient fill
 const grad=ctx.createLinearGradient(0,pad.t,0,H-pad.b);
 grad.addColorStop(0,'rgba(74,144,226,.25)');grad.addColorStop(1,'rgba(74,144,226,0)');
 ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);
 pts.forEach((p,i)=>{if(i>0){const prev=pts[i-1],cx=(prev.x+p.x)/2;ctx.bezierCurveTo(cx,prev.y,cx,p.y,p.x,p.y)}});
 ctx.lineTo(pts[pts.length-1].x,H-pad.b);ctx.lineTo(pts[0].x,H-pad.b);ctx.closePath();
 ctx.fillStyle=grad;ctx.fill();
 // Line
 ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);
 pts.forEach((p,i)=>{if(i>0){const prev=pts[i-1],cx=(prev.x+p.x)/2;ctx.bezierCurveTo(cx,prev.y,cx,p.y,p.x,p.y)}});
 ctx.strokeStyle='#4A90E2';ctx.lineWidth=2.5;ctx.stroke();
 // Dots
 pts.forEach(p=>{ctx.beginPath();ctx.arc(p.x,p.y,4,0,Math.PI*2);ctx.fillStyle='#4A90E2';ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.stroke()});
 // X labels
 ctx.fillStyle='#94a3b8';ctx.font='11px system-ui';ctx.textAlign='center';
 days.forEach((d,i)=>ctx.fillText(d,pts[i].x,H-6));
 // Y labels
 ctx.textAlign='right';
 [0,Math.round(maxV/2),Math.round(maxV)].forEach((v,i)=>{const y=pad.t+cH-(v/maxV)*cH;ctx.fillText(v,pad.l-4,y+4)});
}
start();
