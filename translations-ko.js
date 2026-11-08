// Pixelmon spawn and evolution display-only Korean localization.
// Original wiki / JAR values are never mutated or written back to storage.
const glossary = Object.freeze({
  'Any':'제한 없음','Anytime':'시간 제한 없음','Any Time':'시간 제한 없음',
  'Morning':'아침','Dawn':'새벽','Day':'낮','Afternoon':'오후','Dusk':'해질녘',
  'Evening':'저녁','Night':'밤','Midnight':'한밤중',
  'Land':'지상','Seafloor':'해저 바닥','Underground':'지하','Air':'공중',
  'Sky':'하늘','Water':'물속','Lava':'용암','Fishing':'낚시',
  'Rock Smash':'바위깨기','Sweet Scent':'달콤한향기','Headbutt':'박치기',
  'Tree Top':'나무 꼭대기','Tree Tops':'나무 꼭대기','Cave':'동굴','Caves':'동굴',
  'Indoors':'실내','Surface':'지상','Cave Floor':'동굴 바닥',
  'Super Rod':'대단한낚싯대','Good Rod':'좋은낚싯대','Old Rod':'낡은낚싯대',
  'Rare':'희귀','Ultra Rare':'극히 희귀','Very Rare':'매우 희귀','Super Rare':'매우 희귀',
  'Uncommon':'드문 편','Common':'흔함','Frequent':'자주 등장','Abundant':'매우 흔함',
  'Clear':'맑음','Clear Weather':'맑은 날','Rain':'비','Rainy':'비 오는 날',
  'Rainy Weather':'비 오는 날','Storm':'폭풍우','Stormy Weather':'폭풍우',
  'Thunderstorm':'뇌우','Thunder':'천둥번개','Snow':'눈','Snowy Weather':'눈 오는 날',
  'Any Weather':'날씨 제한 없음','No Weather':'날씨 제한 없음',
  'Gravel':'자갈','Red Sandstone':'붉은 사암','Sandstone':'사암','Sand':'모래',
  'Stone':'돌','Moss Rock':'이끼 낀 바위','Ice Rock':'얼음 바위','Oak Planks':'참나무 판자',
  'Rock':'바위','Dirt':'흙','Grass Block':'잔디 블록','Water Block':'물 블록',
  'Graveyard':'묘지','Haunted Tower':'유령의 탑','Chalice':'성배 주변',
  'No Light':'빛이 없는 장소','Darkness':'어두운 장소',
  'Mushroom':'버섯 지형','Mushrooms':'버섯 지형',
  'Mesas':'메사 지형 계열','Mesa':'메사 지형',
  'Mountainous':'산악 지형','Freezing Mountains':'얼어붙은 산악 지형',
  'Roofed':'어두운 숲 계열','Taigas':'타이가 계열','Evil':'어둠 지형',
  'Arid':'건조 지형','Hellish':'지옥 지형','Oceanic':'해양 지형',
  'Glowing Grotto':'빛나는 동굴','Fungal Caves':'균류 동굴',
  'End Highlands':'엔드 고지대','Ultra Plant':'울트라 식물 지형',
  'Crimson Forest':'진홍빛 숲','Warped Forest':'뒤틀린 숲',
  'Bamboo Jungle Hills':'대나무 정글 언덕','Jungle Hills':'정글 언덕',
  'Modified Jungle':'변형된 정글','Guiana Shield':'기아나 고지',
  'Tropical Rainforest Hills':'열대우림 언덕','Rainforest Cliffs':'열대우림 절벽',
  'Twilight Valley':'황혼의 계곡','Twilight Valley Hills':'황혼의 계곡 언덕',
  'Weeping Witch Forest':'울부짖는 마녀 숲','Weeping Witch Clearing':'울부짖는 마녀 공터',
  'Mystic Grove':'신비로운 숲','Mystic Plains':'신비로운 평원',
  'Crimson Gardens':'진홍빛 정원','Glowstone Gardens':'발광석 정원',
  'Withering Woods':'시든 숲','Undergrowth':'덤불숲',
  'No Snowy Beach':'눈 덮인 해변 제외','No Frozen Ocean':'얼어붙은 바다 제외',
  'All Forests':'모든 숲','All Beaches':'모든 해변','All Oceans':'모든 바다',
  'Forest (Forge)':'Forge 태그 숲 지형',
  'None':'별도 조건 없음','N/A':'해당 없음','—':'별도 조건 없음'
});
// Additional wiki phrases. These are presentation-only translations.
const wikiAdditional=Object.freeze({
  'Lava Floor':'용암 표면','Water Floor':'물 표면',
  'Water Surface':'수면','Lava Surface':'용암 표면',
  'Good Rod (Lava)':'좋은낚싯대로 용암 낚시',
  'Old Rod (Lava)':'낡은낚싯대로 용암 낚시',
  'Super Rod (Lava)':'대단한낚싯대로 용암 낚시',
  'Good Rod (Water)':'좋은낚싯대로 물에서 낚시',
  'Old Rod (Water)':'낡은낚싯대로 물에서 낚시',
  'Super Rod (Water)':'대단한낚싯대로 물에서 낚시',
  'Good Rod Lava':'좋은낚싯대로 용암 낚시',
  'Old Rod Lava':'낡은낚싯대로 용암 낚시',
  'Super Rod Lava':'대단한낚싯대로 용암 낚시',
  'Good Rod Water':'좋은낚싯대로 물에서 낚시',
  'Old Rod Water':'낡은낚싯대로 물에서 낚시',
  'Super Rod Water':'대단한낚싯대로 물에서 낚시',
  'Near Coal Ore':'석탄 광석 근처','Coal Ore':'석탄 광석',
  'Iron Ore':'철 광석','Gold Ore':'금 광석',
  'Diamond Ore':'다이아몬드 광석',
  'Basalt Deltas':'현무암 삼각주','Nether Wastes':'네더 황무지',
  'Magma Wastes':'마그마 황무지',
  'Ultra Desert':'울트라 사막','Ultra Desert (PM)':'울트라 사막',
  'Ultra Crater':'울트라 크레이터','Ultra Forest':'울트라 숲',
  'Ultra Jungle':'울트라 정글','Arid':'건조 지형',
  'Savannas':'사바나 계열','Mesas':'메사 지형 계열',
  'Volcanic Plains':'화산 평원','Volcano':'화산',
  'Hellish':'지옥 지형','Any Biome':'모든 바이옴'
});
const normalized = new Map([...Object.entries(glossary),...Object.entries(wikiAdditional)].map(([k,v]) => [k.toLowerCase(),v]));
const words = Object.freeze({
  all:'모든', any:'모든', old:'오래된', ancient:'고대의', new:'새로운',
  forest:'숲', forests:'숲 계열', jungle:'정글', jungles:'정글 계열',
  hills:'언덕', hill:'언덕', mountains:'산', mountain:'산',
  ocean:'바다', oceans:'바다 계열', lake:'호수', lakes:'호수', river:'강', rivers:'강 계열',
  desert:'사막', deserts:'사막 계열', swamp:'늪지', swamps:'늪지 계열',
  beach:'해변', beaches:'해변 계열', plains:'평원', plain:'평원',
  cave:'동굴', caves:'동굴', valley:'계곡', valleys:'계곡',
  fields:'들판', field:'들판', island:'섬', islands:'섬',
  garden:'정원', gardens:'정원', grotto:'동굴', grove:'숲',
  clearing:'공터', woods:'숲', woodlands:'숲', cliffs:'절벽', cliff:'절벽',
  snowy:'눈 덮인', frozen:'얼어붙은', freezing:'추운', cold:'차가운',
  warm:'따뜻한', lukewarm:'미지근한', deep:'깊은', dark:'어두운',
  birch:'자작나무', bamboo:'대나무', oak:'참나무', taiga:'타이가',
  stone:'돌', rocky:'바위', stony:'돌이 많은', gravel:'자갈',
  red:'붉은', white:'하얀', rainbow:'무지개', crimson:'진홍빛',
  warped:'뒤틀린', glowing:'빛나는', glowstone:'발광석',
  mushroom:'버섯', fungal:'균류', flower:'꽃', lush:'무성한',
  tropical:'열대', volcanic:'화산', ultra:'울트라', jungle:'정글',
  surface:'지상', land:'지상', water:'물속', air:'공중',
  seafloor:'해저 바닥', underground:'지하'
});
function clean(value){return String(value ?? '').replace(/\s+/g,' ').trim()}
function translateWords(value){
  const text=clean(value).replace(/[_-]/g,' ');
  const direct=normalized.get(text.toLowerCase());
  if(direct)return direct;
  const tokens=text.split(' ');
  if(tokens.every(token => words[token.toLowerCase()]))return tokens.map(t=>words[t.toLowerCase()]).join(' ');
  return text;
}
function target(value){
  let v=clean(value).replace(/^minecraft:/i,'').replace(/^pixelmon:/i,'').replace(/_/g,' ');
  return translateWords(v);
}
export function translateSpawnPhrase(value,kind='general',pokemonName=()=>null){
  const raw=clean(value);
  if(!raw||raw==='-'||raw==='—')return '별도 조건 없음';
  if(/^any$/i.test(raw)){
    if(kind==='biome')return '모든 바이옴';
    if(kind==='location')return '장소 제한 없음';
    if(kind==='time')return '시간 제한 없음';
    if(kind==='weather')return '날씨 제한 없음';
    return '제한 없음';
  }
  const literal=normalized.get(raw.toLowerCase());if(literal)return literal;
  // Split compound wiki cells without translating numbers or rewriting source data.
  const groups=raw.split(/\s*[,;/|]\s*/).filter(Boolean);
  if(groups.length>1)return groups.map(x=>translateSpawnPhrase(x,kind,pokemonName)).join(' · ');

  // Rod names sometimes include a medium suffix (e.g. Good Rod (Lava)).
  let m=raw.match(/^(Old|Good|Super)\s+Rod(?:\s*\(\s*(Lava|Water)\s*\)|\s+(Lava|Water))?$/i);
  if(m){
    const rod=normalized.get((m[1]+' Rod').toLowerCase());
    const medium=(m[2]||m[3]||'').toLowerCase();
    return medium==='lava' ? rod+'로 용암 낚시' :
      medium==='water' ? rod+'로 물에서 낚시' : rod;
  }
  m=raw.match(/^(\d+(?:\.\d+)?)\s*[x×]\s*Spawn Rate(?:\s+(Near|Nearby|Around|In|During|At|Under)\s+(.+))?$/i);
  if(m){
    if(!m[2])return '출현 확률 '+m[1]+'배';
    const place=target(m[3]);
    if(/^(?:In|During|Under)$/i.test(m[2]))return place+'일 때 출현 확률 '+m[1]+'배';
    if(/^Clear Weather|Rainy Weather|Snowy Weather|Night|Day$/i.test(m[3]))return place+'에 출현 확률 '+m[1]+'배';
    return place+' 근처에서 출현 확률 '+m[1]+'배';
  }
  m=raw.match(/^(Min|Max)\s+(Y(?: Level)?|Height|Light Level|Light)\s*(-?\d+)$/i);
  if(m)return (m[2].toLowerCase().startsWith('light')?'밝기':'Y좌표')+' '+m[3]+(m[1].toLowerCase()==='min'?' 이상':' 이하');
  m=raw.match(/^Y\s*(<=|>=|<|>|≤|≥)\s*(-?\d+)$/i);
  if(m)return 'Y좌표 '+m[2]+' '+({'<=':'이하','≤':'이하','>=':'이상','≥':'이상','<':'미만','>':'초과'}[m[1]]);
  m=raw.match(/^Light(?:\s+Level)?\s*(<=|>=|<|>|≤|≥)\s*(\d+)$/i);
  if(m)return '밝기 '+m[2]+' '+({'<=':'이하','≤':'이하','>=':'이상','≥':'이상','<':'미만','>':'초과'}[m[1]]);
  m=raw.match(/^(Nearby|Near|Next to|Around|Beside)\s+(.+)$/i);
  if(m)return target(m[2])+' 근처';
  m=raw.match(/^No\s+(.+)$/i);
  if(m)return target(m[1])+' 제외';
  m=raw.match(/^Only\s+(?:In|Near|At)\s+(.+)$/i);
  if(m)return target(m[1])+'에서만 출현';
  m=raw.match(/^(.+?)\s+in\s+(?:the\s+)?first\s+(?:party\s+)?slot$/i);
  if(m)return (pokemonName(m[1])||target(m[1]))+'을(를) 파티 첫 번째 칸에 배치';
  m=raw.match(/^(.+?)\s+(?:in|on)\s+(?:the\s+)?party$/i);
  if(m)return '파티에 '+(pokemonName(m[1])||target(m[1]))+' 필요';
  m=raw.match(/^(?:Spawn(?:s)?|Only Spawn(?:s)?)\s+(?:In|At|Near)\s+(.+)$/i);
  if(m)return target(m[1])+'에서 출현';
  m=raw.match(/^(?:During|In)\s+(.+)$/i);
  if(m)return target(m[1])+'일 때';
  m=raw.match(/^(\d+(?:\.\d+)?)\s*[x×]\s*$/i);
  if(m)return m[1]+'배';
  // Namespaced biome identifiers are labels, never executable expressions.
  m=raw.match(/^([a-z0-9_]+):([a-z0-9_./-]+)$/i);
  if(m){
    const label=translateWords(m[2]);
    return label!==m[2].replace(/[_-]/g,' ')?label:raw;
  }
  return translateWords(raw);
}
const fieldNames=Object.freeze({
  biomes:'바이옴',biome:'바이옴',times:'시간',time:'시간',weather:'날씨',
  condition:'조건',conditions:'조건',spawnConditions:'출현 조건',
  location:'장소',locations:'장소',rarity:'희귀도',weight:'가중치',
  minY:'최소 Y좌표',maxY:'최대 Y좌표',minLight:'최소 밝기',maxLight:'최대 밝기',
  minLevel:'최소 레벨',maxLevel:'최대 레벨',level:'레벨',
  species:'포켓몬',pokemon:'포켓몬',type:'종류',method:'출현 방식',
  blocks:'블록',block:'블록',dimensions:'차원',dimension:'차원',
  structures:'구조물',structure:'구조물',neededNearbyBlocks:'주변에 필요한 블록',
  neededBaseBlocks:'필요한 바닥 블록',neededNearbyBiomes:'주변에 필요한 바이옴',
  canSeeSky:'하늘 노출 여부',isRaining:'비 여부',isThundering:'뇌우 여부'
});
export function translateSpawnValue(value,translator=translateSpawnPhrase,kind='general',depth=0){
  if(value===null||value===undefined||value==='')return '별도 조건 없음';
  if(typeof value==='boolean')return value?'예':'아니요';
  if(typeof value==='number')return String(value);
  if(typeof value==='string')return translator(value,kind);
  if(depth>=8)return '추가 조건 데이터';
  if(Array.isArray(value)){
    if(!value.length)return '별도 조건 없음';
    return value.map(x=>translateSpawnValue(x,translator,kind,depth+1)).join(' · ');
  }
  if(typeof value==='object'){
    const rows=Object.entries(value);
    if(!rows.length)return '별도 조건 없음';
    return rows.map(([k,v])=> (fieldNames[k]||k.replace(/([a-z])([A-Z])/g,'$1 $2'))+
      ': '+translateSpawnValue(v,translator,k==='biomes'||k==='biome'?'biome':k==='time'||k==='times'?'time':k==='location'||k==='locations'?'location':kind,depth+1)
    ).join(' · ');
  }
  return String(value);
}
