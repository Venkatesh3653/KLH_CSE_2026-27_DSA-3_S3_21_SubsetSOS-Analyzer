const P=[["Laptop","Computing","💻",65000],["Monitor","Computing","🖥️",14999],["Phone","Mobile","📱",29999],["Smartwatch","Mobile","⌚",12999],["Headphones","Audio","🎧",5999],["Earbuds","Audio","🎵",3999],["Mouse","Accessories","🖱️",999],["Keyboard","Accessories","⌨️",1999],["Webcam","Accessories","📷",3499],["Microphone","Audio","🎙️",4999],["Backpack","Accessories","🎒",2499],["Laptop Stand","Office","📐",1499],["USB Hub","Accessories","🔌",1999],["Power Bank","Mobile","🔋",2999],["SSD","Storage","💾",6999],["Router","Computing","📡",3499],["Desk Lamp","Office","💡",1799],["Office Chair","Office","🪑",12999],["Standing Desk","Office","🗄️",24999],["Speaker","Audio","🔊",4999]].map(([name,cat,ic,mrp])=>({name,cat,ic,mrp}));
const ix=n=>P.findIndex(p=>p.name==n);
const O=[["Laptop + Mouse",["Laptop","Mouse"],59999],["WFH Kit",["Laptop","Mouse","Backpack"],60999],["Desk Setup",["Keyboard","Monitor"],13999],["Pro Desk Kit",["Monitor","Keyboard","Mouse","Laptop Stand"],15499],["Streamer Pack",["Webcam","Microphone","Headphones"],10999],["Ergo Office",["Office Chair","Standing Desk","Desk Lamp"],31999],["Mobile Combo",["Phone","Earbuds","Power Bank"],31999],["Storage Upgrade",["SSD","USB Hub"],6999]].map(([name,it,price])=>({name,items:it.map(ix),price,mrp:it.reduce((a,n)=>a+P[ix(n)].mrp,0)}));
const A=[];O.forEach(o=>{const n=o.items.length,d=1-o.price/o.mrp;for(let m=1;m<1<<n;m++){const it=o.items.filter((_,b)=>m>>b&1),s=it.length;if(s<2)continue;const mrp=it.reduce((a,i)=>a+P[i].mrp,0);
 if(s==n){A.push({name:o.name,items:it,price:o.price,mrp});continue}
 const pr=Math.min(mrp-1,Math.round(mrp*(1-d*(s-1)/(n-1))/100)*100-1);A.push({name:it.map(i=>P[i].name).join(" + ")+" ("+o.name+" deal)",items:it,price:pr,mrp})}});
const cart={};let filt="All";const $=id=>document.getElementById(id),R=n=>"₹"+n.toLocaleString("en-IN");
function draw(){
 $("chips").innerHTML=["All",...new Set(P.map(p=>p.cat))].map(c=>`<button class="${c==filt?"on":""}" onclick="filt='${c}';draw()">${c}</button>`).join("");
 $("grid").innerHTML=P.map((p,i)=>{if(filt!="All"&&p.cat!=filt)return"";const q=cart[i]||0;
  return `<div class="card ${q?"sel":""}"><div class="ic">${p.ic}</div><div class="info"><div class="nm">${p.name}</div><div class="ct">${p.cat}</div><div class="pr">${R(p.mrp)}</div></div>${q?`<div class="step"><button onclick="chg(${i},-1)">−</button><b>${q}</b><button onclick="chg(${i},1)">+</button></div>`:`<button class="add" onclick="chg(${i},1)">+</button>`}</div>`}).join("");
 $("combos").innerHTML=O.map((o,t)=>`<div class="combo ${o.items.every(i=>cart[i])?"on":""}"><h3>${o.name}</h3><div class="pills">${o.items.map(i=>`<em>${P[i].ic} ${P[i].name}</em>`).join("")}</div><div class="pline"><span class="old">${R(o.mrp)}</span><span class="new">${R(o.price)}</span></div><span class="save">SAVE ${R(o.mrp-o.price)} (${Math.round(100*(o.mrp-o.price)/o.mrp)}%)</span><div class="mu" style="margin-bottom:8px">Any 2+ items from this combo also get a discount</div><button onclick="addC(${t})">Add combo to cart</button></div>`).join("");
 const k=Object.keys(cart).map(Number).sort((a,b)=>a-b);$("cnt").textContent=k.length?`(${k.reduce((a,i)=>a+cart[i],0)} items)`:"";
 $("items").innerHTML=k.length?k.map(i=>`<div class="item"><span>${P[i].ic} ${P[i].name} × ${cart[i]}</span><b>${R(P[i].mrp*cart[i])}</b></div>`).join(""):'<div class="empty">Cart is empty. Add products or a combo.</div>';
 const u=k.reduce((a,i)=>a+cart[i],0),pc=Math.min(15,Math.max(0,u-1));
 $("ladder").innerHTML=`<div class="lad"><div><b>Item bonus: ${pc}% off</b><span>+1% for every extra item, up to 15%</span></div><div class="lbar"><i style="width:${pc/15*100}%"></i></div></div>`;
}
function chg(i,d){cart[i]=(cart[i]||0)+d;if(cart[i]<=0)delete cart[i];$("out").innerHTML="";draw()}
function addC(t){O[t].items.forEach(i=>cart[i]=(cart[i]||0)+1);$("out").innerHTML="";draw()}
function selAll(){P.forEach((_,i)=>cart[i]=cart[i]||1);$("out").innerHTML="";draw()}
function clr(){for(const k in cart)delete cart[k];$("out").innerHTML="";draw()}
function run(){
 const k=Object.keys(cart).map(Number).sort((a,b)=>a-b);
 if(!k.length){$("out").innerHTML='<div class="res empty">Cart is empty!</div>';return}
 const n=k.length,q=k.map(i=>cart[i]),st=[];let size=1;
 for(const x of q){st.push(size);size*=x+1;if(size>4e6){$("out").innerHTML='<div class="res empty">Too many combinations. Reduce quantities.</div>';return}}
 const t0=performance.now(),cnt=(m,j)=>Math.floor(m/st[j])%(q[j]+1);
 const offs=A.filter(o=>o.items.every(i=>k.includes(i))).map(o=>({...o,j:o.items.map(i=>k.indexOf(i))}));
 offs.forEach(o=>o.sub=o.j.reduce((a,j)=>a+st[j],0));
 const dp=new Float64Array(size),ch=new Int16Array(size).fill(-1),pr=k.map(i=>P[i].mrp);
 for(let m=1;m<size;m++){let lo=0;while(!cnt(m,lo))lo++;let best=pr[lo]+dp[m-st[lo]],c=-1;
  offs.forEach((o,t)=>{if(o.j.every(j=>cnt(m,j))){const v=o.price+dp[m-o.sub];if(v<best){best=v;c=t}}});dp[m]=best;ch[m]=c}
 let m=size-1;const used={},sing={};
 while(m){const c=ch[m];if(c<0){let lo=0;while(!cnt(m,lo))lo++;const nm=P[k[lo]].name;sing[nm]=(sing[nm]||0)+1;m-=st[lo]}else{used[c]=(used[c]||0)+1;m-=offs[c].sub}}
 const mrp=k.reduce((a,i)=>a+P[i].mrp*cart[i],0),best=dp[size-1],sv=mrp-best,units=k.reduce((a,i)=>a+cart[i],0),pct=Math.min(15,units-1),bonus=Math.round(best*pct/100),opt=best-bonus,tot=mrp-opt,ms=performance.now()-t0;
 let hint="";if(!sv){const o=O.find(o=>o.items.some(i=>cart[i])&&!o.items.every(i=>cart[i]));if(o)hint=`<div class="tip">💡 Add ${o.items.filter(i=>!cart[i]).map(i=>P[i].name).join(", ")} to unlock <b>${o.name}</b> and save ${R(o.mrp-o.price)}.</div>`}
 const plan=Object.entries(used).map(([t,c])=>`<div><span>🎁 ${c} × ${offs[t].name}</span></div>`).join("")+Object.entries(sing).map(([a,c])=>`<div><span>🛍️ ${c} × ${a} (single, no discount)</span></div>`).join("");
 $("out").innerHTML=`<div class="res"><h2>Best deal</h2><div class="plan">${plan}</div>
 <div class="row"><span>Total at MRP</span><s>${R(mrp)}</s></div>${sv?`<div class="row"><span>Combo savings</span><b class="gr">-${R(sv)}</b></div>`:""}${bonus?`<div class="row"><span>Item bonus (${pct}% for ${units} items)</span><b class="gr">-${R(bonus)}</b></div>`:""}<div class="row tot"><b>You pay</b><b>${R(opt)}</b></div>
 <div class="benefit ${tot?"":"none"}"><small>${tot?"Total benefit":"No discount yet"}</small><b>${tot?R(tot):"₹0"}</b><span>${tot?(100*tot/mrp).toFixed(1)+"% off MRP":"Add more items to start saving"}</span></div>${hint}
 <div class="mu">${size.toLocaleString("en-IN")} sub-carts checked in ${ms.toFixed(2)} ms</div></div>`}
draw();
