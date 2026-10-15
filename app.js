import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const $ = id => document.getElementById(id);
const genEnds=[151,251,386,493,649,721,809,905,1025];
const generation=i=>genEnds.findIndex(v=>i<=v)+1;
// 관리자 목록 및 왼쪽 하단에 사용할 표시 이름 (실제 인증 이메일은 변경하지 않음).
const DISPLAY_NAMES = Object.freeze({
  'prie4653@naver.com': 'Yeon',
  'prie4653@daum.net': 'Yeon2'
});
function accountDisplayName(email, metadata) {
  if (metadata?.username) return metadata.username;
  const normalized = String(email || '').trim().toLowerCase();
  if (DISPLAY_NAMES[normalized]) return DISPLAY_NAMES[normalized];
  // 직접 발급한 계정은 가상 이메일에 아이디가 UTF-8 16진수로 담겨 있음.
  const match = normalized.match(/^dexid-([0-9a-f]+)@pixelmon\.invalid$/);
  if (match) {
    try {
      const pairs = match[1].match(/.{2}/g) || [];
      return new TextDecoder('utf-8', {fatal:true}).decode(new Uint8Array(pairs.map(x=>parseInt(x,16))));
    } catch (_) {}
  }
  return email || '계정';
}

// V26: login ID preference and independent Supabase session persistence.
// A tab-only session uses sessionStorage; "로그인 유지" uses localStorage.
const LOGIN_ID_KEY='pixelmon_saved_login_id_v26';
const LOGIN_KEEP_KEY='pixelmon_keep_signed_in_v26';
const loginKept=()=>localStorage.getItem(LOGIN_KEEP_KEY)==='1';
function authStorage(){
  return {
    getItem(key){return (loginKept()?localStorage:sessionStorage).getItem(key)},
    setItem(key,value){(loginKept()?localStorage:sessionStorage).setItem(key,value)},
    removeItem(key){localStorage.removeItem(key);sessionStorage.removeItem(key)}
  };
}
function authTokenKey(url){try{return 'sb-'+new URL(url).hostname.split('.')[0]+'-auth-token'}catch{return ''}}
function initLoginOptions(){
  try{const saved=localStorage.getItem(LOGIN_ID_KEY);if(saved)$('loginIdentifier').value=saved;}catch{}
  $('rememberIdentifier').checked=!!localStorage.getItem(LOGIN_ID_KEY);
  $('keepSignedIn').checked=loginKept();
}
function saveLoginOptions(identifier){
  const previous=loginKept();
  const keep=$('keepSignedIn').checked;
  const key=state.client?.auth?.storageKey;
  // Keep the existing token only in the selected store, never both.
  if(key&&previous!==keep){try{localStorage.removeItem(key);sessionStorage.removeItem(key)}catch{}}
  if(keep)localStorage.setItem(LOGIN_KEEP_KEY,'1');else localStorage.removeItem(LOGIN_KEEP_KEY);
  if($('rememberIdentifier').checked)localStorage.setItem(LOGIN_ID_KEY,identifier);
  else localStorage.removeItem(LOGIN_ID_KEY);
}
initLoginOptions();
const state={client:null,user:null,profile:null,profiles:[],species:[],personal:new Set(),shared:new Set(),mode:'personal',progressMode:'personal',view:'dex',generation:0,statusFilter:'all',page:0,loading:false};
const URLS={species:'pokemon_species.csv',names:'pokemon_species_names.csv',types:'pokemon_types.csv',typeNames:'type_names.csv'};
const BASE='https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/';
const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const toast=msg=>{const e=$('toast');e.textContent=msg;e.classList.add('show');setTimeout(()=>e.classList.remove('show'),3600)};
function parseCSV(s){const rows=[];let row=[],buf='',quoted=false;for(let i=0;i<s.length;i++){let c=s[i];if(c==='"'){if(quoted&&s[i+1]==='"'){buf+='"';i++}else quoted=!quoted}else if(c===','&&!quoted){row.push(buf);buf=''}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&s[i+1]==='\n')i++;row.push(buf);if(row.some(x=>x!==''))rows.push(row);row=[];buf=''}else buf+=c}if(buf||row.length){row.push(buf);rows.push(row)}return rows}
async function pokemonData(){const cacheKey='pixelmonDexData_v3';try{const cache=JSON.parse(localStorage.getItem(cacheKey)||'null');if(cache?.length===1025){state.species=cache;render();return}}catch{}try{
const urls=Object.values(URLS);const all=await Promise.all(urls.map(async f=>{let r=await fetch(BASE+f);if(!r.ok)throw Error('PokéAPI 원본 다운로드 실패');return parseCSV(await r.text())}));
const [speciesCSV,namesCSV,typesCSV,typeNamesCSV]=all;
const speciesCols=speciesCSV.shift(),nameCols=namesCSV.shift(),typesCols=typesCSV.shift(),typeNameCols=typeNamesCSV.shift();
const index=(headers,name)=>headers.indexOf(name);
const get=(row,cols,key)=>row[index(cols,key)];
const ko=new Map(),en=new Map(),ids=new Map(),parent=new Map(),typeMap=new Map(),typeKo=new Map();
for(const r of namesCSV){const id=Number(get(r,nameCols,'pokemon_species_id')),lang=get(r,nameCols,'local_language_id');if(lang==='3')ko.set(id,get(r,nameCols,'name'));if(lang==='9')en.set(id,get(r,nameCols,'name'))}
for(const r of speciesCSV){const id=Number(get(r,speciesCols,'id'));if(id>1025)continue;parent.set(id,Number(get(r,speciesCols,'evolves_from_species_id'))||0);ids.set(id,true)}
for(const r of typeNamesCSV){const id=Number(get(r,typeNameCols,'type_id'));if(get(r,typeNameCols,'local_language_id')==='3')typeKo.set(id,get(r,typeNameCols,'name'))}
for(const r of typesCSV){let id=Number(get(r,typesCols,'pokemon_id')),slot=Number(get(r,typesCols,'slot'));if(id>1025)continue;if(!typeMap.has(id))typeMap.set(id,[]);typeMap.get(id).push([slot,Number(get(r,typesCols,'type_id'))])}
state.species=Array.from({length:1025},(_,ix)=>{let id=ix+1;return {id,name:ko.get(id)||en.get(id)||`#${id}`,english:en.get(id)||"",types:(typeMap.get(id)||[]).sort((a,b)=>a[0]-b[0]).map(x=>typeKo.get(x[1])||''),parent:parent.get(id)||0,children:[]}});
for(const mon of state.species){if(mon.parent&&mon.parent<=1025)state.species[mon.parent-1].children.push(mon.id)}
try{localStorage.setItem(cacheKey,JSON.stringify(state.species))}catch{}render();
}catch(e){$('dataStatus').textContent='도감 원본 데이터를 불러오지 못했습니다. 인터넷 연결 및 GitHub Raw 접근을 확인하고 새로고침하세요.';console.error(e);toast('포켓몬 데이터 연결 실패')}}
// V27: Shared public connection settings embedded for all visitors.
// This is a publishable key, never a service-role/secret key.
const PIXELMON_PUBLIC_CONFIG = Object.freeze({
  url: 'https://tdmrakyoldxphefmuqvb.supabase.co',
  key: 'sb_publishable_OTNAy1oHhOD59ChsioKtWQ_aG0kWGe2'
});
function applyConfig(){
  const config=PIXELMON_PUBLIC_CONFIG;
  $('setup').hidden=true;
  $('settingsBtn').hidden=true;
  try{
    const tokenKey=authTokenKey(config.url);
    if(tokenKey&&!loginKept())localStorage.removeItem(tokenKey);
    state.client=createClient(config.url,config.key,{auth:{persistSession:true,autoRefreshToken:true,storage:authStorage(),storageKey:tokenKey}});
    $('connectStatus').textContent='● 연결됨';
    state.client.auth.onAuthStateChange(event=>{
      if(['SIGNED_IN','SIGNED_OUT','TOKEN_REFRESHED'].includes(event))setTimeout(()=>loadAccount(),0);
    });
    loadAccount();
  }catch(e){console.error(e);toast('서버 연결에 실패했습니다. 새로고침 후 다시 시도해 주세요.');showAuth()}
}
async function loadAccount(){if(!state.client)return;const {data:{user},error}=await state.client.auth.getUser();if(error||!user){state.user=null;state.profile=null;showAuth();return}state.user=user;$('logoutBtn').hidden=false;const {data:profile,error:err}=await state.client.from('profiles').select('id,nickname,role,approved').eq('id',user.id).maybeSingle();if(err){toast('프로필 불러오기 실패: '+err.message);showAuth();return}state.profile=profile;$('accountLabel').textContent=profile?.nickname || '사용자';if(!profile?.approved){$('authPanel').hidden=true;$('pendingPanel').hidden=false;$('mainContent').hidden=true;$('adminNav').hidden=true;return}
$('authPanel').hidden=true;$('pendingPanel').hidden=true;$('mainContent').hidden=false;$('adminNav').hidden=profile.role!=='admin';await refreshCollections();if(state.view==='rank')loadProgress();if(state.view==='admin'&&profile.role!=='admin')setView('dex');render()}
function showAuth(){$('adminNav').hidden=true;if(state.view==='admin')state.view='dex';$('authPanel').hidden=false;$('pendingPanel').hidden=true;$('mainContent').hidden=true;$('logoutBtn').hidden=true;$('accountLabel').textContent='로그인이 필요합니다'}
async function refreshCollections(){let [p,c]=await Promise.all([state.client.from('personal_catches').select('pokemon_id').eq('user_id',state.user.id),state.client.from('shared_catches').select('pokemon_id')]);if(p.error||c.error){toast('수집 기록 불러오기 오류');return}state.personal=new Set((p.data||[]).map(x=>x.pokemon_id));state.shared=new Set((c.data||[]).map(x=>x.pokemon_id))}
function setView(view){if(view==='admin' && !(state.profile?.approved && state.profile?.role==='admin')){view='dex';}state.view=view;document.querySelectorAll('.nav').forEach(e=>e.classList.toggle('active',e.dataset.view===view));$('dexView').hidden=view!=='dex';$('rankView').hidden=view!=='rank';$('adminView').hidden=view!=='admin';let titles={dex:'포켓몬 도감',rank:'수집 현황',admin:'사용자 관리'};$('viewTitle').textContent=titles[view];if(view==='rank')loadProgress();if(view==='admin')loadUsers();if(view==='dex')render()}
function render(){if(!state.profile?.approved)return;renderStats();updateCollectionActions();if(state.view!=='dex')return;const mons=state.species;if(!mons.length)return;$('dataStatus').textContent=`전국도감 ${mons.length.toLocaleString('ko-KR')}종 · 기본 포켓몬 종 기준 (Pixelmon Reforged 버전에 따라 구현 여부가 다를 수 있습니다)`;
const q=$('search').value.trim().toLowerCase(),g=state.generation,f=state.statusFilter,selected=state.mode==='shared'?state.shared:state.personal;
const list=mons.filter(m=>(!q||String(m.id)===q||m.name.toLowerCase().includes(q))&&(!g||generation(m.id)===g)&&(f==='all'||(f==='caught'?selected.has(m.id):!selected.has(m.id))));let visible=list;
$('dataStatus').textContent=`${g ? g+'세대' : '전체 세대'} · ${list.length.toLocaleString('ko-KR')}마리 표시 / 전국도감 ${mons.length.toLocaleString('ko-KR')}마리`;
$('dexGrid').innerHTML=visible.map(m=>{let caught=selected.has(m.id);let parent=m.parent?mons[m.parent-1]?.name:'';let child=m.children.map(i=>mons[i-1].name).join(' · ');return `<article class="pokemon ${caught?'iscaught':''}" data-details="${m.id}" tabindex="0" role="button" aria-label="${escapeHTML(m.name)} 상세 정보"><span class="number">#${String(m.id).padStart(4,'0')}</span><span class="caughticon">${caught?'✔':''}</span><img loading="lazy" alt="${escapeHTML(m.name)}" src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${m.id}.png"><div class="name">${escapeHTML(m.name)}</div><div class="types">${m.types.map(t=>`<span class="type ${escapeHTML(t)}">${escapeHTML(t)}</span>`).join('')}</div><div class="evo" title="진화 전: ${escapeHTML(parent||'없음')} / 진화 후: ${escapeHTML(child||'없음')}">${escapeHTML(parent?'← '+parent:child?'→ '+child:'최종 / 단일 진화')}</div><button class="catchbtn" data-id="${m.id}">${caught?'✓ 포획 완료':'○ 미포획'}</button></article>`}).join('')}
function renderStats(){let currentMode=state.view==='rank'?state.progressMode:state.mode;let sel=currentMode==='shared'?state.shared:state.personal;let total=state.species.length||1025;let cards=[['전체 포켓몬',total,'전국도감 기본 종'],['포획 완료',sel.size,'현재 '+(currentMode==='shared'?'공동':'개인')+' 도감'],['미포획',total-sel.size,'앞으로 채울 포켓몬'],['완성률',((sel.size/total)*100).toFixed(1)+'%','1~9세대 기준']];$('stats').innerHTML=cards.map(x=>`<div class="stat"><div class="key">${x[0]}</div><div class="num">${x[1]}</div><div class="sub">${x[2]}</div></div>`).join('')}
// V25: destructive actions always require an explicit typed confirmation.
let collectionOperationRunning=false;
function updateCollectionActions(){
  const isShared=state.mode==='shared';
  const admin=state.profile?.role==='admin';
  $('copyPersonalToShared').hidden=false;
  $('clearCollection').hidden=isShared&&!admin;
  $('clearCollection').textContent=isShared?'공동 도감 전체 체크 해제 (관리자 전용)':'내 개인 도감 전체 체크 해제';
  $('collectionActionHint').textContent=isShared
    ?'개인 도감의 체크 항목을 공동 도감에 추가할 수 있습니다. 공동 전체 해제는 관리자만 사용할 수 있습니다.'
    :'공동 도감에 합쳐도 개인 체크 기록은 유지됩니다.';
}
function confirmTyped(message,word){return prompt(`${message}\n\n계속하려면 ${word} 를 정확하게 입력하세요.`)===word;}
async function removeAllCaught(){
  if(collectionOperationRunning||!state.profile?.approved)return;
  const shared=state.mode==='shared';
  if(shared&&state.profile?.role!=='admin'){toast('공동 도감 초기화는 관리자만 할 수 있습니다.');return;}
  const set=shared?state.shared:state.personal;
  if(!set.size){toast('해제할 포켓몬이 없습니다.');return;}
  const scope=shared?'공동 도감 전체':'내 개인 도감 전체';
  if(!confirmTyped(`${scope}의 포획 기록 ${set.size}개를 모두 삭제합니다. 복구 기능은 없습니다.`, '전체해제'))return;
  collectionOperationRunning=true; $('clearCollection').disabled=true; $('copyPersonalToShared').disabled=true;
  try{
    // Delete only rows visible to this explicit scope, in batches to avoid oversized requests.
    const ids=[...set];
    for(let i=0;i<ids.length;i+=100){
      let q=state.client.from(shared?'shared_catches':'personal_catches').delete().in('pokemon_id',ids.slice(i,i+100));
      if(!shared)q=q.eq('user_id',state.user.id);
      const {error}=await q;if(error)throw error;
    }
    await refreshCollections();render();toast(`${scope}의 체크를 모두 해제했습니다.`);
  }catch(e){await refreshCollections();render();toast('전체 해제 중 오류가 발생했습니다: '+e.message);}
  finally{collectionOperationRunning=false; $('clearCollection').disabled=false; $('copyPersonalToShared').disabled=false;}
}
async function copyPersonalToShared(){
  if(collectionOperationRunning||!state.profile?.approved)return;
  const missing=[...state.personal].filter(id=>!state.shared.has(id));
  if(!missing.length){toast('공동 도감에 새로 추가할 포켓몬이 없습니다.');return;}
  if(!confirm(`내 개인 도감에서 공동 도감에 없는 ${missing.length}마리를 추가할까요?\n\n기존 공동 기록은 유지되고 개인 기록도 삭제되지 않습니다.`))return;
  collectionOperationRunning=true; $('clearCollection').disabled=true; $('copyPersonalToShared').disabled=true;
  try{
    for(let i=0;i<missing.length;i+=100){
      const rows=missing.slice(i,i+100).map(pokemon_id=>({pokemon_id,updated_by:state.user.id}));
      // Insert only; ignore duplicates from simultaneous contributions instead of overwriting them.
      const {error}=await state.client.from('shared_catches').upsert(rows,{onConflict:'pokemon_id',ignoreDuplicates:true});
      if(error)throw error;
    }
    await refreshCollections();render();toast(`공동 도감에 추가 완료! 공동 포획 ${state.shared.size}마리`);
  }catch(e){await refreshCollections();render();toast('공동 도감으로 합치는 중 오류: '+e.message);}
  finally{collectionOperationRunning=false; $('clearCollection').disabled=false; $('copyPersonalToShared').disabled=false;}
}
$('clearCollection').addEventListener('click',removeAllCaught);
$('copyPersonalToShared').addEventListener('click',copyPersonalToShared);

async function togglePokemon(id,btn){if(!state.client||!state.profile?.approved)return;btn.disabled=true;let shared=state.mode==='shared',set=shared?state.shared:state.personal,caught=set.has(id),table=shared?'shared_catches':'personal_catches';let response;
if(caught){{let query=state.client.from(table).delete().eq('pokemon_id',id);if(!shared)query=query.eq('user_id',state.user.id);response=await query}
}else response=await state.client.from(table).upsert(shared?{pokemon_id:id,updated_by:state.user.id}:{user_id:state.user.id,pokemon_id:id},{onConflict:shared?'pokemon_id':'user_id,pokemon_id'});
if(response?.error){toast('저장 실패: '+response.error.message);btn.disabled=false;return}if(caught)set.delete(id);else set.add(id);if(state.view==='rank')loadProgress();else render()}
function loadProgress(){
  // The switch controls the progress page only. It never rebuilds or hides the switch itself.
  const mode=state.progressMode;
  const selected=mode==='shared'?state.shared:state.personal;
  for (const [id, value] of [['progressPersonal','personal'],['progressShared','shared']]) {
    const button=$(id);
    button.hidden=false;
    button.classList.toggle('active',mode===value);
    button.setAttribute('aria-pressed',String(mode===value));
  }
  renderStats();
  $('genProgress').innerHTML=genEnds.map((end,i)=>{
    const start=i?genEnds[i-1]+1:1;
    let collected=0;
    for (const id of selected) if(id>=start&&id<=end)collected++;
    const total=end-start+1, rate=(collected/total*100).toFixed(1);
    return `<div class="progress-row"><span>${i+1}세대</span><div class="track"><div class="fill" style="width:${rate}%"></div></div><span>${collected}/${total} (${rate}%)</span></div>`;
  }).join('');
}
for(const [id,mode] of [['progressPersonal','personal'],['progressShared','shared']]){
  $(id).addEventListener('click',()=>{
    state.progressMode=mode;
    loadProgress();
  });
}
async function loadUsers(){
  if(state.profile?.role!=='admin')return;
  const {data,error}=await state.client.from('profiles').select('id,nickname,role,approved,created_at').order('created_at',{ascending:false});
  if(error){toast('사용자 목록 오류: '+error.message);return;}
  $('users').innerHTML=(data||[]).map(u=>`<div class="person"><span>♙</span><div class="label"><strong>${escapeHTML(u.nickname||'닉네임 없음')}</strong><br><small>${u.role==='admin'?'관리자':u.approved?'승인됨':'대기 / 차단'}</small></div>${u.role==='admin'?'':`<button class="minor" data-role="${u.id}" data-new-role="admin">관리자로 전환</button>`}<button class="minor" data-rename="${u.id}" data-name="${escapeHTML(u.nickname||'')}">닉네임 변경</button>${u.role==='admin'?'<b>관리자</b>':`<button data-approve="${u.id}" data-next="${!u.approved}">${u.approved?'접근 차단':'사용 승인'}</button>`}</div>`).join('');
}
$('users').addEventListener('click', async e => {
  const change=e.target.closest('[data-rename]');
  if(change){
    const proposed=prompt('새 닉네임을 입력하세요 (2~24자, 중복 불가).',change.dataset.name);
    if(proposed===null)return;
    const nickname=proposed.trim();
    if(nickname.length<2 || nickname.length>24){toast('닉네임은 2~24자로 입력하세요.');return;}
    if(!await nicknameAvailable(nickname) && nickname.toLocaleLowerCase('ko') !== change.dataset.name.toLocaleLowerCase('ko')){toast('이미 사용 중인 닉네임입니다.');return;}
    const {error}=await state.client.from('profiles').update({nickname}).eq('id',change.dataset.rename);
    if(error){toast(error.code==='23505'?'이미 사용 중인 닉네임입니다.':'닉네임 변경 실패: '+error.message);return;}
    toast('닉네임이 변경됐습니다.');if(change.dataset.rename===state.user?.id){state.profile.nickname=nickname;$('accountLabel').textContent=nickname;}
    await loadUsers();return;
  }
  const roleButton=e.target.closest('[data-role]');
  if(roleButton){
    const targetId=roleButton.dataset.role;
    const nextRole=roleButton.dataset.newRole;
    if(!confirm(`${nextRole==='admin'?'관리자 권한을 부여':'관리자 권한을 해제'}하시겠습니까?`))return;
    roleButton.disabled=true;
    const {error}=await state.client.rpc('dex_set_user_role',{target_user_id:targetId,new_role:nextRole});
    if(error){toast('권한 변경 실패: '+error.message);}else{
      toast(nextRole==='admin'?'관리자로 변경했습니다.':'일반 사용자로 변경했습니다.');
      if(targetId===state.user?.id)await loadAccount();
    }
    await loadUsers();return;
  }
  const btn=e.target.closest('[data-approve]');if(!btn)return;
  const approve=btn.dataset.next==='true';if(!confirm(`${approve?'승인':'접근 차단'}하시겠습니까?`))return;
  btn.disabled=true;const {error}=await state.client.from('profiles').update({approved:approve}).eq('id',btn.dataset.approve);
  if(error)toast('변경 실패: '+error.message);else toast('권한이 변경되었습니다.');await loadUsers();
});
async function nicknameAvailable(nickname){
  const {data,error}=await state.client.rpc('nickname_available',{candidate:nickname});
  if(error){toast('닉네임 중복 확인 실패: '+error.message);return false;}
  return data===true;
}
$('dexGrid').addEventListener('click',e=>{let b=e.target.closest('[data-id]');if(b){e.stopPropagation();togglePokemon(Number(b.dataset.id),b);return}let card=e.target.closest('[data-details]');if(card)showPokemonDetail(Number(card.dataset.details))});
$('dexGrid').addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('[data-details]')){e.preventDefault();showPokemonDetail(Number(e.target.dataset.details))}});
// V23: 잠금은 HTML 및 body 양쪽에 적용하고, 휠/터치 스크롤을 열린 대화상자 내부로 제한합니다.
let detailBackgroundScrollY=0;
let detailBackgroundLockCount=0;
let detailOriginalStyles=null;
const modalDialogs=[$('pokemonDialog'),$('spawnImportDialog')];
function currentModal(){return [...modalDialogs].reverse().find(dialog=>dialog.open) || null;}
function lockDetailBackground(){
  if(detailBackgroundLockCount++>0)return;
  detailBackgroundScrollY=window.scrollY;
  detailOriginalStyles={htmlOverflow:document.documentElement.style.overflow,bodyOverflow:document.body.style.overflow,bodyPosition:document.body.style.position,bodyTop:document.body.style.top,bodyLeft:document.body.style.left,bodyRight:document.body.style.right,bodyWidth:document.body.style.width};
  document.documentElement.style.overflow='hidden';
  document.body.style.overflow='hidden';
  document.body.style.position='fixed';
  document.body.style.top=`-${detailBackgroundScrollY}px`;
  document.body.style.left='0';document.body.style.right='0';document.body.style.width='100%';
  document.body.classList.add('detail-background-locked');
}
function unlockDetailBackground(){
  if(detailBackgroundLockCount===0)return;
  if(--detailBackgroundLockCount>0)return;
  document.body.classList.remove('detail-background-locked');
  const st=detailOriginalStyles;
  if(st){document.documentElement.style.overflow=st.htmlOverflow;document.body.style.overflow=st.bodyOverflow;document.body.style.position=st.bodyPosition;document.body.style.top=st.bodyTop;document.body.style.left=st.bodyLeft;document.body.style.right=st.bodyRight;document.body.style.width=st.bodyWidth;}
  window.scrollTo(0,detailBackgroundScrollY);
}
for(const dialog of modalDialogs)dialog.addEventListener('close',unlockDetailBackground);
// 모든 휠 입력을 차단한 뒤 모달 내부에서만 명시적으로 스크롤합니다.
document.addEventListener('wheel',event=>{
  const modal=currentModal();if(!modal)return;
  event.preventDefault();
  if(!modal.contains(event.target) && event.target!==modal)return;
  const factor=event.deltaMode===1?16:event.deltaMode===2?modal.clientHeight:1;
  modal.scrollTop+=event.deltaY*factor;
  if(event.deltaX)modal.scrollLeft+=event.deltaX*factor;
},{capture:true,passive:false});
let modalTouchX=0,modalTouchY=0;
document.addEventListener('touchstart',event=>{
  if(!currentModal()||!event.touches.length)return;
  modalTouchX=event.touches[0].clientX;modalTouchY=event.touches[0].clientY;
},{capture:true,passive:true});
document.addEventListener('touchmove',event=>{
  const modal=currentModal();if(!modal||!event.touches.length)return;
  event.preventDefault();
  const x=event.touches[0].clientX,y=event.touches[0].clientY;
  if(modal.contains(event.target)||event.target===modal){modal.scrollTop+=modalTouchY-y;modal.scrollLeft+=modalTouchX-x;}
  modalTouchX=x;modalTouchY=y;
},{capture:true,passive:false});
$('closePokemon').onclick=()=>$('pokemonDialog').close();$('pokemonDialog').addEventListener('click',e=>{if(e.target===$('pokemonDialog'))$('pokemonDialog').close()});
$('settingsBtn').onclick=()=>$('setup').hidden=!$('setup').hidden;
$('saveConfig').onclick=()=>{let url=$('sbUrl').value.trim().replace(/\/$/,''),key=$('sbKey').value.trim();if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url)||!key){toast('올바른 Supabase URL 및 공개 키를 입력하세요.');return}if(key.includes('service_role')||key.startsWith('sb_secret_')){toast('비밀 키는 절대 사용하면 안 됩니다.');return}localStorage.setItem('pixelmon_sb_config',JSON.stringify({url,key}));location.reload()};
$('clearConfig').onclick=()=>{if(confirm('저장된 연결 설정을 지울까요?')){localStorage.removeItem('pixelmon_sb_config');location.reload()}};
// Direct-issued usernames are mapped deterministically to a dedicated synthetic email.
// No account lookup/API with a secret key is needed in the public website.
// Only server-side admin code can create these pre-confirmed accounts.
const DIRECT_DOMAIN='pixelmon.invalid';
function usernameEmail(username){
  const name=username.normalize('NFC').trim();
  if(!name||name.length>32||!Array.from(name).every(ch=>/^[\p{L}\p{N}_.-]$/u.test(ch)))throw new Error('아이디는 1~32자의 한글·영문·숫자·밑줄·점·하이픈을 사용해 주세요.');
  const hex=Array.from(new TextEncoder().encode(name)).map(b=>b.toString(16).padStart(2,'0')).join('');
  return `dexid-${hex}@${DIRECT_DOMAIN}`;
}
$('signupBtn').onclick=async()=>{
  if(!state.client)return;
  if($('signupNicknameLabel').hidden){$('signupNicknameLabel').hidden=false;$('signupBtn').textContent='가입 요청 제출';$('signupNickname').focus();return;}
  const email=$('loginIdentifier').value.trim(),password=$('loginPassword').value,nickname=$('signupNickname').value.trim();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.toLowerCase().endsWith('@pixelmon.invalid')){
    $('authMessage').textContent='가입 요청은 인증 메일을 받을 수 있는 실제 이메일로 진행해 주세요.';return;
  }
  if(nickname.length<2 || nickname.length>24){$('authMessage').textContent='닉네임은 2~24자로 입력해 주세요.';return;}
  if(!await nicknameAvailable(nickname)){$('authMessage').textContent='이미 사용 중인 닉네임입니다.';return;}
  if(password.length<8){$('authMessage').textContent='비밀번호는 8자 이상 입력해 주세요.';return;}
  const {error}=await state.client.auth.signUp({email,password,options:{data:{nickname}}});
  $('authMessage').textContent=error?(error.message?.toLowerCase().includes('duplicate')?'이미 사용 중인 닉네임입니다.':error.message):'가입 요청이 전송됐습니다. 이메일 인증 후 관리자의 승인을 기다려 주세요.';
};
$('loginBtn').onclick=async()=>{
  if(!state.client)return;
  const input=$('loginIdentifier').value.trim(),password=$('loginPassword').value;
  if(!input||!password){$('authMessage').textContent='아이디(또는 이메일)와 비밀번호를 입력해 주세요.';return;}
  let email;
  try{email=input.includes('@')?input:usernameEmail(input)}
  catch(e){$('authMessage').textContent=e.message;return;}
  saveLoginOptions(input);
  const {error}=await state.client.auth.signInWithPassword({email,password});
  $('authMessage').textContent=error?'아이디 또는 비밀번호를 확인해 주세요.':'로그인 성공. 프로필 확인 중...';
  if(!error)await loadAccount();
};
// 비밀번호 입력 후 Enter 키로 로그인 (가입 요청은 클릭할 때만 실행).
$('loginPassword').addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.isComposing) {
    event.preventDefault();
    $('loginBtn').click();
  }
});
$('logoutBtn').onclick=async()=>{await state.client?.auth.signOut();location.reload()};$('refreshBtn').onclick=loadAccount;
document.querySelectorAll('.nav').forEach(b=>b.onclick=()=>{if(b.dataset.view==='admin' && state.profile?.role!=='admin')return;setView(b.dataset.view)});
document.querySelectorAll('.tab[data-mode]').forEach(b=>b.onclick=()=>{state.mode=b.dataset.mode;document.querySelectorAll('.tab[data-mode]').forEach(x=>x.classList.toggle('active',x===b));render()});
$('generationButtons').addEventListener('click',e=>{const button=e.target.closest('[data-generation]');if(!button)return;state.generation=Number(button.dataset.generation);document.querySelectorAll('.generation-btn').forEach(b=>{const isActive=Number(b.dataset.generation)===state.generation;b.classList.toggle('active',isActive);b.setAttribute('aria-pressed',String(isActive))});render()});
$('search').addEventListener('input',render);
$('statusButtons').addEventListener('click',e=>{const button=e.target.closest('[data-status]');if(!button)return;state.statusFilter=button.dataset.status;document.querySelectorAll('#statusButtons [data-status]').forEach(b=>{const active=b.dataset.status===state.statusFilter;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});render();});

applyConfig();pokemonData();


// Species details are fetched lazily; existing Supabase collection tables are unchanged.
const evoCache=new Map();
const sprite=id=>`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
const pretty=v=>v?String(v).replaceAll('-',' '):'';
const idFromURL=u=>Number(u?.match(/\/(\d+)\/?$/)?.[1])||0;
const monName=(id, fallback='')=>state.species[id-1]?.name||fallback||`#${id}`;
const itemKo={'fire-stone':'불꽃의돌','water-stone':'물의돌','thunder-stone':'천둥의돌','leaf-stone':'리프의돌','moon-stone':'달의돌','sun-stone':'태양의돌','dusk-stone':'어둠의돌','dawn-stone':'각성의돌','shiny-stone':'빛의돌','ice-stone':'얼음의돌','kings-rock':'왕의징표석','metal-coat':'금속코트','dragon-scale':'용의비늘','upgrade':'업그레이드','dubious-disc':'괴상한패치','protector':'프로텍터','electirizer':'에레키부스터','magmarizer':'마그마부스터','reaper-cloth':'영계의천','razor-claw':'예리한손톱','razor-fang':'예리한이빨','prism-scale':'고운비늘','oval-stone':'동글동글돌','deep-sea-tooth':'심해의이빨','deep-sea-scale':'심해의비늘','sweet-apple':'달콤한사과','tart-apple':'새콤한사과','sachet':'향기주머니','whipped-dream':'휘핑팝','linking-cord':'연결의끈'};
const typesKo={'dark':'악','water':'물','fire':'불꽃','grass':'풀','electric':'전기','ice':'얼음','rock':'바위','ground':'땅','flying':'비행','psychic':'에스퍼','fairy':'페어리','normal':'노말','ghost':'고스트','fighting':'격투','steel':'강철','bug':'벌레','dragon':'드래곤','poison':'독'};
function phrase(code){return itemKo[code]||typesKo[code]||pretty(code)+' (원어명 확인 필요)'}
const koMoveNames=new Map([['rage-fist','분노의주먹'],['psyshield-bash','배리어러시'],['barb-barrage','독침천발'],['dragon-cheer','드래곤옐'],['ancient-power','원시의힘'],['mimic','흉내내기'],['rollout','구르기'],['double-hit','더블어택']]);
function moveLabel(slug){return koMoveNames.get(slug)||'기술명 조회 실패 ('+slug+')'}
async function resolveEvoKorean(chain){
 const moves=new Set();function walk(node){for(const d of node.evolution_details||[])for(const m of [d.used_move,d.known_move])if(m?.name&&!koMoveNames.has(m.name))moves.add(m.name);for(const n of node.evolves_to||[])walk(n)}walk(chain);
 await Promise.all([...moves].map(async slug=>{try{const r=await fetch('https://pokeapi.co/api/v2/move/'+encodeURIComponent(slug)+'/');if(!r.ok)return;const obj=await r.json();const name=obj.names?.find(x=>x.language.name==='ko')?.name;if(name)koMoveNames.set(slug,name)}catch(e){console.warn('기술명 조회 오류',slug,e)}}));
}
// 조사 자동 선택: 받침이 없거나 ㄹ 받침이면 '로', 그 외 받침이면 '으로'.
function withEuroRo(name){
 const word=String(name||'').trim();
 if(!word)return '';
 const cp=word.codePointAt(word.length-1);
 if(cp>=0xAC00&&cp<=0xD7A3){
  const jong=(cp-0xAC00)%28;
  return word+(jong===0||jong===8?'로':'으로');
 }
 return word+'(으)로';
}
function evoCondition(d,sourceName=""){
 if(!d)return '진화 조건 정보가 없습니다.';
 let a=[],trigger=d.trigger?.name;
 if(trigger==='trade')a.push('다른 플레이어와 교환하면 진화');
 else if(trigger==='use-item')a.push('진화 도구를 사용하면 진화');
 else if(trigger==='level-up')a.push('조건을 만족한 뒤 레벨업하면 진화');
 else if(trigger==='shed')a.push('특정 조건에서 추가 포켓몬이 생기는 특수 진화');
 else if(trigger==='use-move')a.push('특정 기술을 정해진 횟수만큼 사용한 뒤 레벨업하면 진화');
 else if(trigger==='three-critical-hits')a.push('한 번의 배틀에서 급소를 3번 맞힌 뒤 진화');
 else if(trigger==='take-damage')a.push('배틀에서 일정 피해를 받은 후 진화');
 else if(trigger==='spin')a.push('특정 아이템을 지닌 뒤 회전하면 진화');
 else if(trigger)a.push('특수 진화 조건 확인 필요');
 if(d.min_level!=null)a.push(`${d.min_level}레벨 이상`);
 if(d.item)a.push(`${phrase(d.item.name)} 사용`);
 if(d.held_item)a.push(`${phrase(d.held_item.name)} 지닌 상태`);
 if(d.min_happiness!=null)a.push(`친밀도 ${d.min_happiness} 이상`);
 if(d.min_affection!=null)a.push(`포켓몬과의 애정도 ${d.min_affection} 이상`);
 if(d.min_beauty!=null)a.push(`아름다움 수치 ${d.min_beauty} 이상`);
 if(d.time_of_day)a.push(d.time_of_day==='day'?'낮에':d.time_of_day==='night'?'밤에':d.time_of_day==='dusk'?'해질녘에':`시간 조건: ${pretty(d.time_of_day)}`);
 if(d.known_move)a.push(`${moveLabel(d.known_move.name)} 기술을 배운 상태`);
 if(d.known_move_type)a.push(`${phrase(d.known_move_type.name)} 타입 기술을 배운 상태`);
 if(d.location)a.push(`${pretty(d.location.name)} 지역에서 (지역명 확인 필요)`);
 if(d.needs_overworld_rain)a.push('게임 안에서 비가 오는 날');
 if(d.needs_multiplayer)a.push('다른 플레이어와 함께 있는 상태');
 if(d.party_species)a.push(`파티에 ${pretty(d.party_species.name)}이(가) 있어야 함`);
 if(d.party_type)a.push(`파티에 ${phrase(d.party_type.name)} 타입 포켓몬이 있어야 함`);
 if(d.trade_species)a.push(`${pretty(d.trade_species.name)}과 교환`);
 if(d.gender===1)a.push('암컷만');else if(d.gender===2)a.push('수컷만');
 if(d.turn_upside_down)a.push('특수 자세 조건 (픽셀몬에서 적용되는 방식 별도 확인)');
 if(d.relative_physical_stats===1)a.push('공격이 방어보다 높아야 함');else if(d.relative_physical_stats===0)a.push('공격과 방어가 같아야 함');else if(d.relative_physical_stats===-1)a.push('방어가 공격보다 높아야 함');
 if(d.min_steps)a.push(`${d.min_steps}걸음 이상 이동`);
 if(d.used_move)a.push(`${sourceName?withEuroRo(sourceName)+' ':''}${moveLabel(d.used_move.name)} 기술을 ${d.min_move_count!=null?d.min_move_count+'회 이상':'일정 횟수'} 사용`);
 else if(d.min_move_count)a.push(`${sourceName?withEuroRo(sourceName)+' ':''}지정된 기술을 ${d.min_move_count}회 이상 사용`);
 if(d.min_damage_taken)a.push(`배틀 중 누적 피해 ${d.min_damage_taken} 이상 받은 뒤 진화`);
 return a.join(' · ')||'별도의 특수 진화 조건이 있습니다. 모드 데이터 확인 필요';
}
function evoMarkup(chain){
 const nodes=[];
 function walk(node,depth=0,parentName=""){const id=idFromURL(node.species?.url);if(!id||id>1025)return;
 const details=(node.evolution_details||[]).filter(Boolean);let conditions=details.map(d=>evoCondition(d,parentName));
 nodes.push(`<div class="evo-node" style="--depth:${Math.min(depth,4)}"><img loading="lazy" src="${sprite(id)}" alt=""><div class="evo-node-text"><b>#${String(id).padStart(4,'0')} ${escapeHTML(monName(id,node.species?.name))}</b>${depth?`<small>↳ ${escapeHTML(conditions.join(' / ')||'진화 조건 확인 필요')}</small>`:'<small>진화 시작</small>'}</div></div>`);
 for(const child of node.evolves_to||[])walk(child,depth+1,monName(id,node.species?.name))
 }
 walk(chain);return nodes.join('')||'<p>진화 정보가 없습니다.</p>';
}
async function getEvolution(id){
 if(evoCache.has(id))return evoCache.get(id);
 const r=await fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}/`);if(!r.ok)throw Error('포켓몬 종 정보 요청 실패');
 const species=await r.json();const url=species.evolution_chain?.url;if(!url)throw Error('진화 체인 없음');
 const r2=await fetch(url);if(!r2.ok)throw Error('진화 정보 요청 실패');const chain=await r2.json();evoCache.set(id,chain.chain);return chain.chain;
}
// 9.4.1 default spawn data can be loaded directly from the installed Pixelmon JAR.
// Unlike wiki links, this produces searchable in-page spawn conditions.
const spawnByName=new Map();
const spawnStore='pixelmonSpawnData941';
const legacySpawnStore='pixelmonSpawnLegacy';
let spawnOrigin='Pixelmon 9.4.1';
let legacySpawnByName=new Map();
try{const legacy=JSON.parse(localStorage.getItem(legacySpawnStore)||'null');if(legacy?.entries){spawnOrigin=legacy.version||'이전 버전';legacySpawnByName=new Map(Object.entries(legacy.entries))}}catch{}
try{const raw=JSON.parse(localStorage.getItem(spawnStore)||'null');if(raw)for(const [name,entries] of Object.entries(raw))spawnByName.set(name,entries)}catch{}
function stripName(v){return String(v||'').toLowerCase().replace(/[^a-z0-9]/g,'')}
function speciesKeys(item){let keys=[];for(const k of ['pokemon','species','spec','pokemonSpec','pokemonSpecification']){let v=item[k];if(typeof v==='string')keys.push(v);else if(v?.species)keys.push(v.species)}return keys}
function extractEntries(obj,path){let found=[];function walk(x,depth=0){if(!x||typeof x!=='object'||depth>10)return;if(Array.isArray(x)){x.forEach(z=>walk(z,depth+1));return}const spec=speciesKeys(x);if(spec.length)found.push({spec:spec.join(', '),biomes:x.biomes||x.biome||x.condition?.biomes||x.conditions?.biomes||x.spawnConditions?.biomes||[],time:x.time||x.times||x.condition?.times||x.conditions?.times||null,weather:x.weather||x.condition?.weather||x.conditions?.weather||null,method:path.split('/').slice(-2,-1)[0]||'기본 스폰',rarity:x.rarity||x.weight||'',raw:x});for(const [k,v] of Object.entries(x)){if(typeof v==='object'&&k!=='raw')walk(v,depth+1)}}walk(obj);return found}
function brief(v){if(v==null||v==='')return '별도 조건 없음';if(typeof v==='string')return escapeHTML(v.replaceAll('minecraft:','').replaceAll('pixelmon:',''));return escapeHTML(JSON.stringify(v).replaceAll('minecraft:','').replaceAll('pixelmon:',''))}
function showSpawn(mon){let entries=spawnByName.get(stripName(mon.english))||[];const old=legacySpawnByName.get(stripName(mon.english))||[];const isFallback=!entries.length&&old.length;if(isFallback)entries=old;if(!entries.length)return `<p class="muted">이 포켓몬의 출현 자료가 없습니다. 최신 모드 파일 또는 이전 버전 스폰 데이터를 등록할 수 있습니다. 야생에서 나오지 않는 포켓몬일 수도 있습니다.</p><button class="minor" id="importSpawnOpen">스폰 데이터 파일 등록하기</button>`;return `<p class="muted">${isFallback?`이전 자료 (${escapeHTML(spawnOrigin)}) 참고 · 최신 데이터에서 항목을 찾지 못함`:`최신으로 등록한 모드 파일 기준`} · 출현 항목 ${entries.length}개 · 서버 설정에 따라 다를 수 있음</p>${entries.map(e=>`<div class="spawn-row"><b>${brief(e.method)} · ${brief(e.spec)}</b><div>바이옴: ${brief(e.biomes)}</div><div>시간: ${brief(e.time)} · 날씨: ${brief(e.weather)}</div>${e.rarity?`<div>희귀도/가중치: ${brief(e.rarity)}</div>`:''}</div>`).join('')}<button class="minor" id="importSpawnOpen">스폰 데이터 파일 등록/갱신</button>`}
// Pixelmon Wiki's published per-species spawn tables. Inline data is kept for
// validated examples; other entries are fetched through the public MediaWiki API.
// Wiki entries are not guaranteed to match every server or a specific JAR revision.
const officialSpawnFallback={
  1:[['자작나무 숲 계열','아침','지상','별도 조건 없음','극히 희귀'],['숲 계열','아침','지상','별도 조건 없음','극히 희귀'],['울트라 포레스트','아침','지상','별도 조건 없음','극히 희귀'],['크래그 가든(BYG)','아침','지상','별도 조건 없음','극히 희귀']],
  4:[['산악 지형','낮','지상','맑은 날씨','극히 희귀'],['화산 지형','낮','지상','맑은 날씨','극히 희귀'],['침식된 악지 지형','낮','지상','맑은 날씨','극히 희귀'],['울트라 크레이터','낮','지상','별도 조건 없음','극히 희귀']],
  25:[['모든 숲','낮','지상','별도 조건 없음','희귀'],['모든 숲','낮','지상','폭풍우','드물지 않음'],['울트라 포레스트','낮','지상','별도 조건 없음','드물지 않음']],
  979:[['정글 계열','밤','나무 꼭대기','별도 조건 없음','극히 희귀'],['울트라 정글','밤','나무 꼭대기','별도 조건 없음','극히 희귀'],['크래그 가든(BYG)','밤','나무 꼭대기','별도 조건 없음','극히 희귀']]
};
const spawnKorean={
 Morning:'아침',Dawn:'새벽',Day:'낮',Dusk:'해질녘',Night:'밤',Afternoon:'오후',Evening:'저녁','All Times':'시간 제한 없음',Anytime:'시간 제한 없음',
 Land:'지상','Tree Top':'나무 위',Water:'물속',Seafloor:'해저 바닥',Air:'공중',Underground:'지하',Lava:'용암',Fishing:'낚시',Cave:'동굴','Cave Floor':'동굴 바닥',Surface:'지상',
 'Clear Weather':'맑은 날','Rainy Weather':'비 오는 날','Rainy':'비 오는 날',Rain:'비','Stormy Weather':'폭풍우','Thunderstorm':'천둥번개','Thunder':'천둥번개','Snowy Weather':'눈 오는 날',Snow:'눈','Any Weather':'날씨 제한 없음','No Weather':'날씨 제한 없음',
 'Ultra Rare':'극히 희귀','Very Rare':'매우 희귀','Super Rare':'매우 희귀',Rare:'희귀',Uncommon:'드문 편',Common:'흔함',Frequent:'자주 등장',Abundant:'매우 흔함','Extremely Rare':'극히 희귀',
 Forest:'숲',Forests:'숲 계열','All Forests':'모든 숲','Birch Forest':'자작나무 숲',Birches:'자작나무 숲 계열',Jungle:'정글',Jungles:'정글 계열',Mountainous:'산악 지형',Volcanic:'화산 지형',
 'Ultra Forest':'울트라 숲','Ultra Jungle':'울트라 정글','Ultra Crater':'울트라 크레이터','Ultra Space':'울트라 스페이스','Crag Gardens':'바위 정원','Crag Gardens (BYG)':'바위 정원','크래그 가든(BYG)':'바위 정원',
 Beach:'해변','Rainbow Beach':'무지개 해변','White Beach':'하얀 모래 해변','Tropic Beach':'열대 해변','Warm Beach':'따뜻한 해변','Snowy Beach':'눈 덮인 해변','Rocky Beach':'바위 해변','Gravel Beach':'자갈 해변',
 'All Beaches':'모든 해변','Beaches':'해변 계열','Ocean':'바다','Oceans':'바다 계열','Deep Ocean':'깊은 바다','Warm Ocean':'따뜻한 바다','Cold Ocean':'차가운 바다',
 'Plains':'평원','Sunflower Plains':'해바라기 평원','Savanna':'사바나','Savannas':'사바나 계열','Desert':'사막','Deserts':'사막 계열','Swamp':'늪지','Swamps':'늪지 계열','River':'강','Rivers':'강 계열',
 'Badlands':'악지','Eroded Badlands':'침식된 악지','Mesa':'메사 지형','Taiga':'타이가 숲','Dark Forest':'어두운 숲','Flower Forest':'꽃의 숲','Roofed':'어두운 숲 계열',
 'Frozen Ocean':'얼어붙은 바다','Lukewarm Ocean':'미지근한 바다','Snowy Taiga':'눈 덮인 타이가','Mushroom Fields':'버섯 들판','The Nether':'네더','The End':'엔드',
 'Volcano':'화산','Volcanic Plains':'화산 평원','Ultra Deep Sea':'울트라 심해','Rainforest':'열대우림','Tropical Rainforest':'열대우림','Grassland':'초원',
 'N/A':'해당 없음','None':'별도 조건 없음','—':'별도 조건 없음','-':'별도 조건 없음','':'별도 조건 없음'
};
const spawnBiomeHints={
 'Crag Gardens':'BYG(Oh The Biomes You’ll Go) 계열 지형 모드가 추가하는 바이옴이에요. 이끼 낀 바위 절벽과 열대 식물이 섞인 습한 정글형 지형이며, 해당 지형 모드가 없는 서버에서는 생성되지 않을 수 있어요.',
 'Crag Gardens (BYG)':'별도의 지형 추가 모드에서 생성되는 바이옴이에요. 이끼 낀 바위 절벽과 열대 식물이 섞인 습한 정글형 지형이며, 해당 지형 모드가 없으면 생성되지 않을 수 있어요.',
 '크래그 가든(BYG)':'별도의 지형 추가 모드에서 생성되는 바이옴이에요. 이끼 낀 바위 절벽과 열대 식물이 섞인 습한 정글형 지형이며, 해당 지형 모드가 없으면 생성되지 않을 수 있어요.',
 'Rainbow Beach':'무지개색 해변이 생성되는 별도 지형 모드 계열의 바이옴이에요. 일반 마인크래프트 해변과는 달라요.',
 'White Beach':'BYG 계열 지형 모드의 하얀 모래 해변이에요.',
 'Tropic Beach':'Biomes O’ Plenty 지형 모드의 열대 해변이에요.',
 'Warm Beach':'TerraForged 지형 모드 자료에 등장하는 따뜻한 해변이에요.'
};
const normalizeSpawnText=v=>String(v??'').replace(/\s+/g,' ').trim();
function koSpawn(v){
 const raw=normalizeSpawnText(v);if(!raw||raw==='—'||raw==='-'||raw==='None')return '별도 조건 없음';
 const direct=spawnKorean[raw];if(direct)return direct;
 const pieces=raw.split(/\s*[,;/|]\s*/);
 if(pieces.length>1)return pieces.map(koSpawn).join(' · ');
 const suffix=raw.match(/^(.+?)\s*\((BYG|BOP|Biomes O' Plenty|Terraforged|Terralith)\)$/i);
 if(suffix){let x=koSpawn(suffix[1]);return x.includes('(')?x:x+' ('+suffix[2]+')'}
 const generic={'Forest':'숲','Beach':'해변','Ocean':'바다','River':'강','Plains':'평원','Hills':'언덕','Mountains':'산악','Jungle':'정글','Desert':'사막','Swamp':'늪지','Taiga':'타이가','Island':'섬','Islands':'섬','Lake':'호수','Lakes':'호수','Cave':'동굴','Caves':'동굴','Valley':'계곡','Garden':'정원','Gardens':'정원','Shore':'해안','Snowy':'눈 덮인','Frozen':'얼어붙은','Warm':'따뜻한','Cold':'차가운','Deep':'깊은','Dark':'어두운','Flower':'꽃','Mushroom':'버섯','Rocky':'바위','Birch':'자작나무','Bamboo':'대나무','Tropical':'열대','Mountain':'산','Lush':'무성한','Ultra':'울트라','Gravel':'자갈','White':'하얀','Rainbow':'무지개','Crimson':'진홍빛','Warped':'뒤틀린','Basalt':'현무암','Stony':'돌이 많은','Meadow':'초원'};
 if(/^[A-Za-z][A-Za-z -]*$/.test(raw)){
  const words=raw.split(/\s+/);if(words.every(w=>generic[w]))return words.map(w=>generic[w]).join(' ');
 }
 return raw;
}
function spawnHint(v){const k=normalizeSpawnText(v);return spawnBiomeHints[k]||''}

// Biome origins are distinguished from translations: do not assume an
// unrecognized name is vanilla. Labels reflect the source wiki naming;
// servers and mod versions can change their actual availability.
const biomeModNames={
 byg:'Oh The Biomes You’ll Go (BYG)', biomeswevegone:'Oh The Biomes We’ve Gone (BWG)',
 bop:'Biomes O’ Plenty',biomesoplenty:'Biomes O’ Plenty',
 terralith:'Terralith',terraforged:'TerraForged',
 pixelmon:'Pixelmon Reforged',minecraft:'마인크래프트 기본'
};
const vanillaBiomes=new Set(`Beach Snowy Beach Stony Shore Plains Sunflower Plains Snowy Plains Ice Spikes Desert Swamp Mangrove Swamp Forest Flower Forest Birch Forest Old Growth Birch Forest Dark Forest Jungle Sparse Jungle Bamboo Jungle Taiga Snowy Taiga Old Growth Pine Taiga Old Growth Spruce Taiga Savanna Savanna Plateau Windswept Savanna Badlands Wooded Badlands Eroded Badlands Meadow Cherry Grove Grove Snowy Slopes Frozen Peaks Jagged Peaks Stony Peaks Windswept Hills Windswept Forest Windswept Gravelly Hills River Frozen River Ocean Deep Ocean Warm Ocean Lukewarm Ocean Cold Ocean Frozen Ocean Deep Lukewarm Ocean Deep Cold Ocean Deep Frozen Ocean Mushroom Fields Lush Caves Dripstone Caves Deep Dark Nether Wastes Crimson Forest Warped Forest Soul Sand Valley Basalt Deltas The End End Highlands End Midlands Small End Islands End Barrens`.split('|'));
const vanillaFullNames=[
 'Beach','Snowy Beach','Stony Shore','Plains','Sunflower Plains','Snowy Plains','Ice Spikes','Desert','Swamp','Mangrove Swamp','Forest','Flower Forest','Birch Forest','Old Growth Birch Forest','Dark Forest','Jungle','Sparse Jungle','Bamboo Jungle','Taiga','Snowy Taiga','Old Growth Pine Taiga','Old Growth Spruce Taiga','Savanna','Savanna Plateau','Windswept Savanna','Badlands','Wooded Badlands','Eroded Badlands','Meadow','Cherry Grove','Grove','Snowy Slopes','Frozen Peaks','Jagged Peaks','Stony Peaks','Windswept Hills','Windswept Forest','Windswept Gravelly Hills','River','Frozen River','Ocean','Deep Ocean','Warm Ocean','Lukewarm Ocean','Cold Ocean','Frozen Ocean','Deep Lukewarm Ocean','Deep Cold Ocean','Deep Frozen Ocean','Mushroom Fields','Lush Caves','Dripstone Caves','Deep Dark','Nether Wastes','Crimson Forest','Warped Forest','Soul Sand Valley','Basalt Deltas','The End','End Highlands','End Midlands','Small End Islands','End Barrens'
];
const vanillaNames=new Set(vanillaFullNames.map(x=>x.toLowerCase()));
const vanillaKorean=new Set(['해변','눈 덮인 해변','평원','해바라기 평원','사막','늪지','숲','자작나무 숲','정글','타이가 숲','사바나','악지','침식된 악지','바다','깊은 바다','따뜻한 바다','차가운 바다','얼어붙은 바다','미지근한 바다','강','눈 덮인 타이가','버섯 들판','네더','엔드','어두운 숲','꽃의 숲']);
const explicitModBiomes={
 'Crag Gardens':'byg','Crag Gardens (BYG)':'byg','크래그 가든(BYG)':'byg',
 'Rainbow Beach':'byg','White Beach':'byg','Tropic Beach':'bop','Warm Beach':'terraforged'
};
function biomeOrigin(value){
 const raw=normalizeSpawnText(value);let name=raw.replace(/\s*\([^)]*\)\s*$/,'').trim();
 const id=raw.match(/^([a-z_]+):[a-z0-9_]+$/i);
 if(id){const ns=id[1].toLowerCase();return ns==='minecraft'?{type:'basic',label:'기본 마인크래프트 바이옴'}:biomeModNames[ns]?{type:'mod',label:'추가 모드 바이옴 · '+biomeModNames[ns]}:{type:'unknown',label:'출처 확인 필요 · 모드 ID: '+ns}}
 if(/^울트라|^Ultra\s/i.test(raw))return {type:'special',label:'Pixelmon Reforged 특수 차원 · 울트라 스페이스'};
 const marker=raw.match(/\((BYG|BWG|BOP|Biomes O' Plenty|Biomes O’ Plenty|Terralith|TerraForged|Oh The Biomes You'll Go|Oh The Biomes We’ve Gone)\)/i);
 let mod=explicitModBiomes[raw]||explicitModBiomes[name];
 if(!mod&&marker){const m=marker[1].toLowerCase();mod=m==='bwg'||m.includes('we’ve gone')?'biomeswevegone':m==='bop'||m.includes('plenty')?'bop':m==='terralith'?'terralith':m==='terraforged'?'terraforged':'byg'}
 if(mod)return {type:'mod',label:'추가 모드 바이옴 · '+biomeModNames[mod]};
 if(vanillaNames.has(raw.toLowerCase())||vanillaKorean.has(raw))return {type:'basic',label:'기본 마인크래프트 바이옴'};
 // Tags such as 'All Forests' are biome groups, not precise biome IDs.
 if(/^(all |any |모든 |.+ 계열$)/i.test(raw))return {type:'group',label:'바이옴 그룹 · 실제 포함 지형은 서버/모드 구성에 따라 달라짐'};
 return {type:'unknown',label:'바이옴 출처 확인 필요 · 기본/추가 모드 여부 미확인'};
}
function spawnCell(v){
 const translated=koSpawn(v),hint=spawnHint(v),origin=biomeOrigin(v);
 // Only additional-mod biomes and special Pixelmon dimensions need an origin label.
 // Vanilla, general biome groups and undetermined names show the biome name alone.
 const needsOrigin=origin.type==='mod'||origin.type==='special';
 return escapeHTML(translated)+(needsOrigin?`<div class="biome-origin biome-origin-${origin.type}">${escapeHTML(origin.label)}</div>`:'')+(needsOrigin&&hint?`<div class="spawn-hint">📍 ${escapeHTML(hint)}</div>`:'');
}
const wikiCache=new Map();
function wikiTitle(mon){return mon.english.replaceAll(' ','_')}
function spawnRowsMarkup(rows,source){return `<p class="muted">${escapeHTML(source)} · 서버 설정에 따라 달라질 수 있음</p>`+rows.map(row=>`<div class="spawn-row"><b>바이옴: ${spawnCell(row[0])}</b><div>시간: ${escapeHTML(koSpawn(row[1]))} · 장소: ${escapeHTML(koSpawn(row[2]))}</div><div>조건: ${escapeHTML(koSpawn(row[3]))} · 희귀도: ${escapeHTML(koSpawn(row[4]))}</div></div>`).join('')}
function extractWikiSpawnRows(html){
 const doc=new DOMParser().parseFromString(html,'text/html');
 const heads=[...doc.querySelectorAll('h2,h3')];
 const h=heads.find(el=>/Spawn Biomes/i.test(el.textContent));
 if(!h)return [];
 let node=h.nextElementSibling,table=null;
 for(let k=0;node&&k<9;k++,node=node.nextElementSibling){if(node.matches('h2,h3'))break;if(node.matches('table')){table=node;break}table=node.querySelector('table');if(table)break}
 if(!table)return [];
 const trs=[...table.querySelectorAll('tr')];
 return trs.slice(1).map(tr=>[...tr.querySelectorAll('td')].map(td=>td.textContent.replace(/\s+/g,' ').trim())).filter(row=>row.length>=5).map(r=>[r[0],r[2],r[3],r[4]==='—'?'별도 조건 없음':r[4],r[5]||'확인 필요']);
}
async function getOfficialSpawn(mon){
 if(wikiCache.has(mon.id))return wikiCache.get(mon.id);
 const title=wikiTitle(mon);
 const endpoint='https://pixelmonmod.com/w/api.php?action=parse&format=json&prop=text&redirects=1&origin=*&page='+encodeURIComponent(title);
 const r=await fetch(endpoint,{mode:'cors',signal:AbortSignal.timeout(12000)});
 if(!r.ok)throw new Error('공식 위키 응답 오류');
 const j=await r.json();if(j.error)throw new Error('공식 위키 문서 조회 실패');
 const rows=extractWikiSpawnRows(j.parse?.text?.['*']||'');wikiCache.set(mon.id,rows);return rows;
}
function evolutionObtaining(mon){
 if(mon.parent){const n=monName(mon.parent);return `<div class="spawn-row"><b>진화로 획득</b><div>${escapeHTML(n)}의 진화 조건을 달성하면 획득할 수 있어요. 위 진화 트리에서 조건을 확인하세요.</div></div>`}
 return '';
}
async function updateOfficialSpawn(mon){
 const panel=$('spawnDetail');if(!panel)return;
 const parentAcquisition=evolutionObtaining(mon);
 const imported=spawnByName.get(stripName(mon.english))||legacySpawnByName.get(stripName(mon.english))||[];
 if(imported.length){panel.innerHTML=showSpawn(mon)+parentAcquisition;return;}
 const fallback=officialSpawnFallback[mon.id];
 panel.innerHTML=(fallback?spawnRowsMarkup(fallback,'Pixelmon 공식 위키 등록 정보'):'<p class="muted">Pixelmon 공식 위키에서 출현 조건을 확인하는 중...</p>')+parentAcquisition;
 try{const rows=await getOfficialSpawn(mon);if(!$('pokemonDialog').open||$('pokemonDialog').dataset.pokemonId!==String(mon.id))return;
   if(rows.length){panel.innerHTML=spawnRowsMarkup(rows,'Pixelmon 공식 위키 등록 정보')+parentAcquisition;return}
   if(fallback)return;
   panel.innerHTML=parentAcquisition+`<p class="muted">공식 위키의 출현 표에서 이 포켓몬의 야생 출현 조건을 확인하지 못했어요. 야생 미출현으로 확정한 것은 아닙니다. 화석·교배·이벤트 등 특수 획득 조건은 별도 확인이 필요해요.</p>`;
 }catch(err){if(!$('pokemonDialog').open||$('pokemonDialog').dataset.pokemonId!==String(mon.id)||fallback)return;
   panel.innerHTML=parentAcquisition+'<p class="muted">공식 출현 정보를 지금 불러오지 못했어요. 네트워크 또는 공식 위키의 외부 접근 제한 때문일 수 있습니다. 확인되지 않은 바이옴은 임의로 표시하지 않습니다.</p>';
 }
}
async function showPokemonDetail(id){
 if(!state.profile?.approved)return;const mon=state.species[id-1];if(!mon)return;const name=escapeHTML(mon.name);
 $('pokemonDetail').innerHTML=`<div class="detail-hero"><img src="${sprite(id)}" alt="${name}"><div><span class="number">#${String(id).padStart(4,'0')} · ${generation(id)}세대</span><h2>${name}</h2><div class="types">${mon.types.map(t=>`<span class="type ${escapeHTML(t)}">${escapeHTML(t)}</span>`).join('')}</div><p class="muted">${state.mode==='shared'?'공동':'개인'} 도감 · ${(state.mode==='shared'?state.shared:state.personal).has(id)?'포획 완료':'미포획'}</p></div></div><h3>진화 트리 및 진화 방법</h3><div id="evolutionDetail" class="evolution-detail">진화 데이터를 불러오는 중...</div><p class="note">진화는 일반 포켓몬 데이터 기반의 한국어 설명이며, Pixelmon 전용 예외와 특수 진화 조건은 모드 데이터에 따라 달라질 수 있습니다.</p><h3>Pixelmon 출현 바이옴 · 입수 방법</h3><div id="spawnDetail"><p class="muted">공식 출현 정보 확인 중...</p></div><p class="note">공식 위키에 등록된 출현 정보 기준이며, 서버 설정 또는 모드 파일의 최신 변경사항과 다를 수 있습니다. 화석·퀘스트·레이드 등 모든 특수 획득 경로를 포함하지는 않습니다.</p>`;
 $('pokemonDialog').dataset.pokemonId=String(id);
 lockDetailBackground();$('pokemonDialog').showModal();
 updateOfficialSpawn(mon);
 $('importSpawnOpen')?.addEventListener('click',()=>{lockDetailBackground();$('spawnImportDialog').showModal()});
 try{const chain=await getEvolution(id);await resolveEvoKorean(chain);if($('pokemonDialog').open)$('evolutionDetail').innerHTML=evoMarkup(chain)}catch(e){if($('pokemonDialog').open)$('evolutionDetail').textContent='진화 데이터를 가져오지 못했습니다. 다시 시도해 주세요.';console.warn(e)}
}
$('closeSpawnImport').onclick=()=>$('spawnImportDialog').close();
$('spawnFile').onchange=async e=>{const file=e.target.files?.[0];if(!file)return;const status=$('spawnImportStatus');status.textContent='스폰 데이터를 추출하고 있어요. 파일 크기에 따라 시간이 걸릴 수 있습니다.';
 try{if(!window.JSZip){await new Promise((res,rej)=>{const js=document.createElement('script');js.src='https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';js.onload=res;js.onerror=rej;document.head.append(js)})}
 const zip=await window.JSZip.loadAsync(file);const map=new Map();let count=0;for(const [path,entry] of Object.entries(zip.files)){if(entry.dir||!path.toLowerCase().endsWith('.json')||!path.includes('spawning/'))continue;let text=await entry.async('string');let obj;try{obj=JSON.parse(text)}catch{continue}for(const x of extractEntries(obj,path)){const match=x.spec.match(/(?:species\s*[:=]\s*|pokemon\s*[:=]\s*)?([A-Za-z][A-Za-z0-9._'-]*)/i);const key=stripName(match?.[1]||'');if(!key)continue;let arr=map.get(key)||[];arr.push({spec:x.spec,biomes:x.biomes,time:x.time,weather:x.weather,method:x.method,rarity:x.rarity});map.set(key,arr);count++}}
 if(!count)throw Error('spawning 폴더의 스폰 항목을 찾지 못했어요. 모드 JAR이나 데이터팩 파일인지 확인해 주세요.');const version=$('spawnVersion')?.value||'latest';if(version==='legacy'){legacySpawnByName=map;spawnOrigin=$('legacyVersion')?.value.trim()||'이전 버전 (번호 미입력)';try{localStorage.setItem(legacySpawnStore,JSON.stringify({version:spawnOrigin,entries:Object.fromEntries(map)}))}catch{status.textContent='저장 용량 제한으로 현재 탭에서만 사용할 수 있습니다.'}}else{spawnByName.clear();for(const [k,v] of map)spawnByName.set(k,v);try{localStorage.setItem(spawnStore,JSON.stringify(Object.fromEntries(map)))}catch{status.textContent='저장 용량 제한으로 현재 탭에서만 사용할 수 있습니다.'}}
 status.textContent=`불러오기 완료: 스폰 항목 ${count}개 · 포켓몬 ${map.size}종. 창을 닫고 포켓몬 상세창을 다시 열어주세요.`;
 }catch(err){status.textContent='가져오기 실패: '+err.message;console.error(err)}
};
