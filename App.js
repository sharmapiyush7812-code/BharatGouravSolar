'use strict';
const $=(s,e=document)=>e.querySelector(s), $$=(s,e=document)=>[...e.querySelectorAll(s)];
const inr=n=>'₹'+Math.round(n).toLocaleString('en-IN');
const store={get:(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}},set:(k,v)=>localStorage.setItem(k,JSON.stringify(v))};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function toast(msg,err){const t=document.createElement('div');t.className='toast'+(err?' err':'');t.textContent=msg;$('#toasts').append(t);setTimeout(()=>t.remove(),3200)}

/* ---------- Data (replace with API calls) ---------- */
const SOL=[['🏠','Residential Solar','Cut home bills up to 90%.','₹60,000/kW'],['🏢','Commercial Solar','Offices, malls & hospitals.',' ₹52,000/kW'],['🏭','Industrial Solar','High-capacity MW systems.','₹45,000/kW'],['🏘','Rooftop Solar','Use unused roof space.','₹55,000/kW'],['🌾','Ground Mounted','Large open-land plants.','₹42,000/kW'],['🔋','Off-Grid Solar','Power where grid is absent.','₹85,000/kW'],['🔌','On-Grid Solar','Net-metering enabled.','₹50,000/kW'],['⚡','Hybrid Solar','Grid + battery backup.','₹75,000/kW'],['💧','Solar Water Pump','Irrigation without diesel.','₹38,000'],['💡','Solar Street Light','Autonomous LED lighting.','₹14,500']];
const PRODS=[
['SN-PNL-550','Mono PERC 550W Panel','Panels',14500,18,4.7,212,12,'550W · 21.3% eff · 25yr warranty'],
['SN-INV-5K','5kW Hybrid Inverter','Inverters',48000,10,4.6,98,5,'MPPT · WiFi monitoring · 5yr'],
['SN-BAT-100','100Ah Lithium Battery','Batteries',39000,12,4.5,76,0,'LiFePO4 · 6000 cycles'],
['SN-MNT-GI','GI Mounting Structure','Mounting',6500,5,4.3,41,30,'Hot-dip galvanised · 10kW set'],
['SN-CC-60','60A MPPT Charge Controller','Controllers',7800,8,4.4,63,18,'12/24/48V auto'],
['SN-PMP-3HP','3HP Solar Water Pump','Pumps',72000,15,4.6,57,7,'DC surface · 60m head'],
['SN-SL-40','40W Solar Street Light','Street Lights',14500,10,4.5,120,25,'All-in-one · motion sensor'],
['SN-CBL-4','4mm² Solar Cable (100m)','Cables',4200,0,4.2,35,40,'UV resistant · TUV'],
['SN-ACC-KIT','MC4 Connector Kit','Accessories',950,0,4.4,88,100,'10 pairs · IP67']];
const price=p=>p[3]*(1-p[4]/100);

/* ---------- Render solutions & products ---------- */
$('#solGrid').innerHTML=SOL.map((s,i)=>`<article class="card reveal"><div class="ico">${String(i+1).padStart(2,"0")}</div><h3>${s[1]}</h3><p>${s[2]}</p><div class="price">From ${s[3]}</div><div class="row"><a class="btn alt" href="#calculator">Learn More</a><a class="btn" href="#quote" data-sol="${s[1]}">Get Quote</a></div></article>`).join('');
$$('[data-sol]').forEach(a=>a.onclick=()=>{$('#quoteForm [name=notes]').value='Interested in: '+a.dataset.sol});

const cats=['All',...new Set(PRODS.map(p=>p[2]))];
$('#cat').innerHTML=cats.map(c=>`<option>${c}</option>`).join('');
function renderProducts(){
  const q=$('#search').value.toLowerCase(),c=$('#cat').value,s=$('#sort').value;
  let l=PRODS.filter(p=>(c==='All'||p[2]===c)&&(p[1]+p[0]+p[8]).toLowerCase().includes(q));
  if(s==='lo')l.sort((a,b)=>price(a)-price(b));if(s==='hi')l.sort((a,b)=>price(b)-price(a));if(s==='rt')l.sort((a,b)=>b[5]-a[5]);
  $('#prodGrid').innerHTML=l.length?l.map(p=>{const out=!p[7];const w=store.get('wish',[]).includes(p[0]);return `<article class="card"><div class="ico">${esc(p[2])}</div><h3>${esc(p[1])}</h3><p>SKU ${p[0]} · ${esc(p[8])}</p><p>⭐ ${p[5]} (${p[6]} reviews) · ${out?'<b style="color:#ff6b6b">Out of stock</b>':'In stock ('+p[7]+')'}</p><div class="price">${inr(price(p))}${p[4]?`<span class="old">${inr(p[3])}</span> -${p[4]}%`:''}</div><div class="row"><button class="btn" data-add="${p[0]}" ${out?'disabled style="opacity:.4"':''}>Add to Cart</button><button class="btn alt" data-buy="${p[0]}" ${out?'disabled style="opacity:.4"':''}>Buy Now</button><button class="ghost" data-wish="${p[0]}" aria-label="Wishlist">${w?'♥':'♡'}</button></div></article>`}).join(''):'<p class="empty">No products found. Try another search.</p>';
}
['input','change'].forEach(e=>['#search','#cat','#sort'].forEach(s=>$(s).addEventListener(e,renderProducts)));
renderProducts();
$('#prodGrid').addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  if(b.dataset.add)addCart(b.dataset.add);
  if(b.dataset.buy){addCart(b.dataset.buy);openCart()}
  if(b.dataset.wish){let w=store.get('wish',[]);const id=b.dataset.wish;w=w.includes(id)?w.filter(x=>x!==id):[...w,id];store.set('wish',w);renderProducts();toast('Wishlist updated')}
});

/* ---------- Cart ---------- */
let cart=store.get('cart',{});
function addCart(id){const p=PRODS.find(x=>x[0]===id);if(!p[7])return toast('Product unavailable',1);cart[id]=Math.min((cart[id]||0)+1,p[7]);saveCart();toast('Added to cart')}
function saveCart(){store.set('cart',cart);renderCart()}
let coupon=null;
function renderCart(){
  const ids=Object.keys(cart);$('#cartCount').textContent=ids.reduce((a,k)=>a+cart[k],0);
  if(!ids.length){$('#cartItems').innerHTML='<p class="empty">Your cart is empty.</p>';$('#cartTotals').innerHTML='';return}
  $('#cartItems').innerHTML=ids.map(id=>{const p=PRODS.find(x=>x[0]===id);return `<div class="ci"><span>${esc(p[1])}<br><small>${inr(price(p))}</small></span><span><button data-q="${id}:-1">−</button> ${cart[id]} <button data-q="${id}:1">+</button> <button data-q="${id}:0">🗑</button></span></div>`}).join('');
  const sub=ids.reduce((a,id)=>a+price(PRODS.find(x=>x[0]===id))*cart[id],0);
  const disc=coupon?sub*.1:0,ship=sub>50000?0:1500,gst=(sub-disc)*.12,tot=sub-disc+gst+ship;
  $('#cartTotals').innerHTML=`<div><span>Subtotal</span><span>${inr(sub)}</span></div><div><span>Discount</span><span>-${inr(disc)}</span></div><div><span>GST 12%</span><span>${inr(gst)}</span></div><div><span>Shipping</span><span>${ship?inr(ship):'Free'}</span></div><div><b>Total</b><b>${inr(tot)}</b></div><div><input id="cpn" placeholder="Coupon (SOLAR10)"><button class="btn alt" id="applyCpn">Apply</button></div><button class="btn" id="checkout">Proceed to Checkout</button>`;
}
$('#cartItems').addEventListener('click',e=>{const b=e.target.closest('[data-q]');if(!b)return;const [id,d]=b.dataset.q.split(':');
  if(d==='0'){if(confirm('Remove this item?'))delete cart[id]}else{const p=PRODS.find(x=>x[0]===id);cart[id]=Math.max(0,Math.min(cart[id]+ +d,p[7]));if(!cart[id])delete cart[id]}saveCart()});
$('#cartTotals').addEventListener('click',e=>{
  if(e.target.id==='applyCpn'){if($('#cpn').value.trim().toUpperCase()==='SOLAR10'){coupon=1;toast('10% coupon applied');renderCart()}else toast('Invalid coupon',1)}
  if(e.target.id==='checkout'){const u=store.get('session',null);if(!u){toast('Please login to checkout',1);return openAuth()}
    if(confirm('Place order? (Demo – payment gateway goes through your backend)')){const id='ORD-'+Date.now().toString(36).toUpperCase();const o=store.get('orders',[]);o.push({id,user:u.email,items:cart,date:new Date().toISOString()});store.set('orders',o);cart={};coupon=null;saveCart();toast('Order '+id+' confirmed')}}
});
const openCart=()=>$('#drawer').classList.add('open');
$('#cartBtn').onclick=openCart;$('#closeCart').onclick=()=>$('#drawer').classList.remove('open');
renderCart();

/* ---------- Auth (DEMO: localStorage. Use real backend + bcrypt/JWT in production) ---------- */
let signup=false;
function updAuth(){const u=store.get('session',null);$('#loginBtn').textContent=u?`Logout (${u.name.split(' ')[0]})`:'Login'}
function openAuth(){$('#authDlg').showModal()}
async function hash(s){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}
$('#loginBtn').onclick=()=>{if(store.get('session',null)){localStorage.removeItem('session');updAuth();toast('Logged out')}else openAuth()};
$('#authClose').onclick=()=>$('#authDlg').close();
$('#toggleAuth').onclick=e=>{e.preventDefault();signup=!signup;$('#authTitle').textContent=signup?'Sign up':'Login';$('#aName').hidden=$('#aRole').hidden=!signup;$('#aName').required=signup;e.target.textContent=signup?'Have an account? Login':'New here? Sign up'};
$('#authForm').addEventListener('submit',async e=>{
  const f=Object.fromEntries(new FormData(e.target));const users=store.get('users',[]);const h=await hash(f.pass);
  if(signup){if(users.some(u=>u.email===f.email))return toast('Email already registered',1);users.push({name:f.name,email:f.email,role:f.role,h});store.set('users',users);store.set('session',{name:f.name,email:f.email,role:f.role});toast('Account created')}
  else{const u=users.find(u=>u.email===f.email&&u.h===h);if(!u)return toast('Login failed: wrong email or password',1);store.set('session',{name:u.name,email:u.email,role:u.role});toast('Welcome back, '+u.name)}
  updAuth();
});updAuth();

/* ---------- Calculator ---------- */
$('#calcForm').addEventListener('submit',e=>{
  e.preventDefault();const f=Object.fromEntries(new FormData(e.target));
  const units=f.bill/f.tariff,kw=Math.max(1,Math.ceil(units/120)),roofNeed=kw*100,maxKw=Math.floor(f.roof/100);
  const rate=f.type==='Residential'?60000:f.type==='Commercial'?52000:45000,cost=kw*rate;
  const mGen=kw*120,mSave=Math.min(mGen,units)*f.tariff,pay=cost/(mSave*12),co2=mGen*12*.82/1000;
  let h=`<div class="kpis"><div>Capacity<b>${kw} kW</b></div><div>System cost<b>${inr(cost)}</b></div><div>Monthly generation<b>${mGen} units</b></div><div>Annual generation<b>${(mGen*12).toLocaleString()} units</b></div><div>Monthly savings<b>${inr(mSave)}</b></div><div>Annual savings<b>${inr(mSave*12)}</b></div><div>Payback<b>${pay.toFixed(1)} yrs</b></div><div>CO₂ saved/yr<b>${co2.toFixed(1)} t</b></div><div>Roof needed<b>${roofNeed} sq ft</b></div></div>`;
  if(maxKw<kw)h+=`<p style="color:#ff9d9d;margin-top:10px">Note: your roof fits about ${maxKw} kW; consider a smaller system.</p>`;
  h+='<h3 style="margin-top:20px">Cumulative net savings (10 yrs)</h3><div class="bars">'+Array.from({length:10},(_,i)=>{const v=mSave*12*(i+1)-cost;return `<i data-v="${v}" title="Year ${i+1}: ${inr(v)}" class="${v<0?'neg':''}"></i>`}).join('')+'</div><p style="margin-top:14px"><a class="btn" href="#quote">Get Free Solar Quote</a></p>';
  const o=$('#calcOut');o.innerHTML=h;o.hidden=false;
  const vals=$$('.bars i',o).map(i=>+i.dataset.v),max=Math.max(...vals.map(Math.abs));
  requestAnimationFrame(()=>$$('.bars i',o).forEach((i,k)=>i.style.height=Math.max(6,Math.abs(vals[k])/max*100)+'%'));
  $('#quoteForm [name=notes]').value=`Calculator result: ${kw} kW system, ~${inr(cost)}`;
});

/* ---------- Quote + tracking ---------- */
const STAGES=['Requested','Assigned','Site Visit Scheduled','Survey Completed','Quote Generated'];
$('#quoteForm').addEventListener('submit',e=>{
  e.preventDefault();const f=e.target;let ok=true;
  $$('input,select,textarea',f).forEach(i=>i.classList.remove('invalid'));
  const bad=n=>{f[n].classList.add('invalid');ok=false};
  if(f.name.value.trim().length<2)bad('name');
  if(!/^[6-9]\d{9}$/.test(f.phone.value))bad('phone');
  if(!/^\S+@\S+\.\S+$/.test(f.email.value))bad('email');
  if(!f.city.value.trim())bad('city');
  if(!ok)return toast('Please fix the highlighted fields',1);
  const id='SN-'+Math.random().toString(36).slice(2,8).toUpperCase();
  const q=store.get('quotes',[]);q.push({id,...Object.fromEntries(new FormData(f)),status:0,at:Date.now()});store.set('quotes',q);
  // TODO: fetch('/api/quotes',{method:'POST',body:JSON.stringify(...)})
  f.reset();toast('Enquiry submitted. ID: '+id);alert('Your enquiry ID is '+id+'\nUse it to track below.');
});
$('#trackForm').addEventListener('submit',e=>{
  e.preventDefault();const id=e.target.id.value.trim().toUpperCase();const q=store.get('quotes',[]).find(x=>x.id===id);
  $('#trackOut').textContent=q?`${id}: ${STAGES[q.status]} (stage ${q.status+1}/${STAGES.length})`:'No enquiry found with this ID.';
});
$('#news').addEventListener('submit',e=>{e.preventDefault();toast('Subscribed!');e.target.reset()});

/* ---------- Nav, counters, reveal ---------- */
$('#menuBtn').onclick=e=>{const o=$('#links').classList.toggle('open');e.target.setAttribute('aria-expanded',o)};
$$('#links a').forEach(a=>a.onclick=()=>$('#links').classList.remove('open'));
const io=new IntersectionObserver(es=>es.forEach(x=>{if(x.isIntersecting){x.target.classList.add('in');io.unobserve(x.target)}}),{threshold:.15});
$$('.reveal').forEach(el=>io.observe(el));
const cio=new IntersectionObserver(es=>es.forEach(x=>{if(!x.isIntersecting)return;cio.unobserve(x.target);
  $$('[data-n]',x.target).forEach(b=>{const n=+b.dataset.n,t0=performance.now();(function f(t){const p=Math.min(1,(t-t0)/1600);b.textContent=Math.floor(n*(1-Math.pow(1-p,3))).toLocaleString()+(p===1?b.dataset.s:'');if(p<1)requestAnimationFrame(f)})(t0)})}),{threshold:.4});
cio.observe($('.stats'));

/* ---------- 3D hero: realistic solar house + farm (Three.js, with low-end fallback) ---------- */
(function(){
  const cv=$('#scene');
  if(typeof THREE==='undefined'||matchMedia('(prefers-reduced-motion:reduce)').matches||navigator.hardwareConcurrency<=2){cv.remove();return}
  let r;try{r=new THREE.WebGLRenderer({canvas:cv,alpha:true,antialias:true})}catch{cv.remove();return}
  r.setPixelRatio(Math.min(devicePixelRatio,1.75));
  r.outputEncoding=THREE.sRGBEncoding;r.toneMapping=THREE.ACESFilmicToneMapping;r.toneMappingExposure=1.05;
  r.shadowMap.enabled=true;r.shadowMap.type=THREE.PCFSoftShadowMap;
  const sc=new THREE.Scene(),cam=new THREE.PerspectiveCamera(36,1,.1,100);cam.position.set(7.5,4.3,10.5);
  const canv=(w,h,fn)=>{const c=document.createElement('canvas');c.width=w;c.height=h;fn(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;t.anisotropy=8;return t};

  /* Sky environment -> realistic reflections on glass panels */
  const skyTex=canv(8,256,(x,w,h)=>{const g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,'#3f78c0');g.addColorStop(.45,'#bcd3ea');g.addColorStop(.52,'#f6dca8');g.addColorStop(.55,'#35423f');g.addColorStop(1,'#1b2422');x.fillStyle=g;x.fillRect(0,0,w,h)});
  const skyScene=new THREE.Scene();skyScene.add(new THREE.Mesh(new THREE.SphereGeometry(50,32,16),new THREE.MeshBasicMaterial({map:skyTex,side:THREE.BackSide})));
  const pm=new THREE.PMREMGenerator(r);sc.environment=pm.fromScene(skyScene).texture;pm.dispose();

  /* Lights + soft shadows */
  const sun=new THREE.DirectionalLight(0xfff0cf,2.6);sun.position.set(6,8,5);sun.castShadow=true;
  sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-9,right:9,top:9,bottom:-9,near:1,far:30});sun.shadow.bias=-.0004;sun.shadow.radius=4;
  sc.add(sun,new THREE.HemisphereLight(0x9fc2ff,0x2a3530,.5));

  /* Materials */
  const cellTex=canv(520,320,(x,w,h)=>{const g=x.createLinearGradient(0,0,w,h);g.addColorStop(0,'#10285a');g.addColorStop(1,'#0a1c40');x.fillStyle=g;x.fillRect(0,0,w,h);
    x.strokeStyle='rgba(185,205,235,.5)';x.lineWidth=2;for(let i=0;i<=10;i++){x.beginPath();x.moveTo(i*52,0);x.lineTo(i*52,h);x.stroke()}for(let j=0;j<=6;j++){x.beginPath();x.moveTo(0,j*53.3);x.lineTo(w,j*53.3);x.stroke()}
    x.strokeStyle='rgba(185,205,235,.18)';x.lineWidth=1;for(let i=0;i<10;i++)for(let k=1;k<3;k++){x.beginPath();x.moveTo(i*52+k*17.3,0);x.lineTo(i*52+k*17.3,h);x.stroke()}});
  const panelM=new THREE.MeshPhysicalMaterial({map:cellTex,metalness:.55,roughness:.22,clearcoat:1,clearcoatRoughness:.06,envMapIntensity:1.5});
  const frameM=new THREE.MeshStandardMaterial({color:0xc9ced6,metalness:.9,roughness:.35});
  const wallM=new THREE.MeshStandardMaterial({color:0xece5d6,roughness:.85});
  const roofM=new THREE.MeshStandardMaterial({color:0x394150,roughness:.7});
  const panelGeo=new THREE.BoxGeometry(.98,.04,.6),frameGeo=new THREE.BoxGeometry(1.04,.035,.66);
  const mkPanel=()=>{const g=new THREE.Group();g.add(new THREE.Mesh(frameGeo,frameM));const p=new THREE.Mesh(panelGeo,panelM);p.position.y=.012;g.add(p);return g};

  /* Ground with soft edge fade */
  const fade=canv(256,256,(x,w,h)=>{const g=x.createRadialGradient(128,128,20,128,128,128);g.addColorStop(0,'#fff');g.addColorStop(.55,'#fff');g.addColorStop(1,'#000');x.fillStyle=g;x.fillRect(0,0,w,h)});
  const world=new THREE.Group();sc.add(world);
  const gnd=new THREE.Mesh(new THREE.CircleGeometry(14,64),new THREE.MeshStandardMaterial({color:0x2e4a3a,roughness:1,transparent:true,alphaMap:fade}));
  gnd.rotation.x=-Math.PI/2;gnd.receiveShadow=true;world.add(gnd);

  /* House */
  const house=new THREE.Group();world.add(house);
  const body=new THREE.Mesh(new THREE.BoxGeometry(3.2,1.6,2.64),wallM);body.position.y=.8;house.add(body);
  const base=new THREE.Mesh(new THREE.BoxGeometry(3.3,.12,2.74),new THREE.MeshStandardMaterial({color:0x9a958a,roughness:.9}));base.position.y=.06;house.add(base);
  const sh=new THREE.Shape([new THREE.Vector2(-1.32,0),new THREE.Vector2(1.32,0),new THREE.Vector2(0,.72)]);
  const gGeo=new THREE.ExtrudeGeometry(sh,{depth:3.2,bevelEnabled:false});gGeo.translate(0,0,-1.6);gGeo.rotateY(Math.PI/2);
  const gable=new THREE.Mesh(gGeo,wallM);gable.position.y=1.6;house.add(gable);
  const a=.5;
  [[1,.66],[-1,-.66]].forEach(([s,z])=>{const slab=new THREE.Mesh(new THREE.BoxGeometry(3.5,.1,1.55),roofM);slab.position.set(0,1.96,z);slab.rotation.x=s*a;house.add(slab);
    if(s===1){const arr=new THREE.Group();arr.position.set(0,1.96,z);arr.rotation.x=a;house.add(arr);
      for(let i=-1;i<=1;i++)for(let j=-1;j<=0;j++){const p=mkPanel();p.position.set(i*1.08,.09,j*.7+.35);arr.add(p)}}});
  const win=new THREE.MeshStandardMaterial({color:0x223,emissive:0xffc872,emissiveIntensity:.9,roughness:.2,metalness:.3});
  [[-.9,.95],[0.9,.95]].forEach(([x,y])=>{const w=new THREE.Mesh(new THREE.BoxGeometry(.6,.55,.04),win);w.position.set(x,y,1.33);house.add(w)});
  const door=new THREE.Mesh(new THREE.BoxGeometry(.5,1,.05),new THREE.MeshStandardMaterial({color:0x5a3b25,roughness:.6}));door.position.set(0,.62,1.33);house.add(door);

  /* Solar farm behind house */
  const farm=new THREE.Group();farm.position.set(-4.6,0,-4.2);world.add(farm);
  for(let row=0;row<3;row++)for(let c=0;c<4;c++){const p=mkPanel();p.scale.set(1.1,1,1.1);p.position.set(c*1.25-1.9,.62,row*1.5);p.rotation.x=-.52;farm.add(p);
    const leg=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,.6),frameM);leg.position.set(c*1.25-1.9,.3,row*1.5);farm.add(leg)}
  const farm2=farm.clone();farm2.position.set(4.8,0,-5);farm2.scale.setScalar(.8);world.add(farm2);
  world.traverse(o=>{if(o.isMesh&&o!==gnd){o.castShadow=true;o.receiveShadow=true}});

  /* Sun glow (screen-space sprite, kept away from the headline) */
  const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:canv(256,256,(x,w,h)=>{const g=x.createRadialGradient(128,128,0,128,128,128);g.addColorStop(0,'rgba(255,250,225,1)');g.addColorStop(.12,'rgba(255,224,150,.9)');g.addColorStop(.4,'rgba(245,180,70,.25)');g.addColorStop(1,'rgba(245,180,70,0)');x.fillStyle=g;x.fillRect(0,0,w,h)}),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));
  glow.scale.set(7,7,1);glow.position.set(8,6.5,-7);sc.add(glow);

  /* Energy particles drifting up from the roof */
  const N=70,pp=new Float32Array(N*3),sp=new Float32Array(N);
  const reset=i=>{pp[i*3]=(Math.random()-.5)*3.2;pp[i*3+1]=1.8+Math.random()*.4;pp[i*3+2]=Math.random()*1.4-.2;sp[i]=.004+Math.random()*.008};
  for(let i=0;i<N;i++){reset(i);pp[i*3+1]+=Math.random()*3}
  const pg=new THREE.BufferGeometry();pg.setAttribute('position',new THREE.BufferAttribute(pp,3));
  const pts=new THREE.Points(pg,new THREE.PointsMaterial({color:0xffd27a,size:.07,transparent:true,opacity:.8,blending:THREE.AdditiveBlending,depthWrite:false}));world.add(pts);

  let mx=0,my=0,wide=true;addEventListener('pointermove',e=>{mx=e.clientX/innerWidth-.5;my=e.clientY/innerHeight-.5});
  function size(){const w=cv.clientWidth,h=cv.clientHeight;r.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix();wide=w>860;
    world.position.x=wide?2.7:0;world.position.y=wide?-.6:.2;world.scale.setScalar(wide?1:.7);cv.style.opacity=wide?1:.55}
  addEventListener('resize',size);size();
  let vis=true;new IntersectionObserver(e=>vis=e[0].isIntersecting).observe(cv);
  (function loop(t){requestAnimationFrame(loop);if(!vis)return;
    const ry=.55+mx*.7+Math.sin(t/5000)*.12+scrollY*.0018;world.rotation.y+=(ry-world.rotation.y)*.05;
    cam.position.x=7.5;cam.position.y+=((4.3-my*1.4)-cam.position.y)*.05;cam.position.z=10.5-Math.min(scrollY*.004,1.5);cam.lookAt(1.2,1.4,0);
    for(let i=0;i<N;i++){pp[i*3+1]+=sp[i];pp[i*3]+=Math.sin(t/900+i)*.0008;if(pp[i*3+1]>6)reset(i)}pg.attributes.position.needsUpdate=true;
    glow.material.opacity=.9+Math.sin(t/1400)*.1;
    r.render(sc,cam)})(0);
})();