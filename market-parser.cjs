function parseMSCI(html){
 const clean=x=>x.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<[^>]*>/g,' ').replace(/&nbsp;|&#160;/g,' ').replace(/\s+/g,' ').trim();
 const text=clean(html); if(!text.includes('MSCI World Index'))throw Error('Índice distinto');
 const tableRows=[...html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map(m=>clean(m[1]));
 const get=(label)=>{const row=tableRows.find(x=>x.startsWith(label+' '));if(!row)throw Error('Falta '+label);const n=Number(row.slice(label.length).trim().replace('%','').replace(/,/g,''));if(!Number.isFinite(n))throw Error('Valor inválido '+label);return n;};
 const tail=text.slice(text.indexOf('Benchmark administrator'));
 const m=tail.match(/Data as of\s+([A-Za-z.]+)\s+(\d{1,2}),?\s+(\d{4})/);if(!m)throw Error('Falta fecha MSCI');
 const months=['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];const mo=months.indexOf(m[1].slice(0,3).toLowerCase());if(mo<0)throw Error('Mes inválido');
 const date=m[3]+'-'+String(mo+1).padStart(2,'0')+'-'+m[2].padStart(2,'0');
 const pe=get('P/E'),forward=get('P/E Fwd'),pb=get('P/BV'),dy=get('Div Yld (%)')/100;
 if(pe<=0||pe>100||forward<=0||forward>100||pb<=0||pb>50||dy<0||dy>.2)throw Error('Ratios fuera de límites');
 const names=['NVIDIA','MICROSOFT CORP','META PLATFORMS A','APPLE','AMAZON.COM','ALPHABET A','ALPHABET C'];
 const weights=names.map(n=>{try{return get(n)/100;}catch(e){return null;}});
 if(weights.some(v=>v!==null&&(v<0||v>1)))throw Error('Pesos inválidos');
 return {date,pe,forward,pb,dy,weights:[...weights.slice(0,5),weights[5]===null||weights[6]===null?null:weights[5]+weights[6]]};
}
function parseGold(raw,now){
 const j=JSON.parse(raw),m=j.chart?.result?.[0]?.meta;if(j.chart?.error||!m||m.symbol!=='EGLN.L'||m.currency!=='EUR'||!/iShares Physical Gold/i.test(m.longName||''))throw Error('Identidad o divisa del oro inválida');
 const date=m.regularMarketTime*1000,price=m.regularMarketPrice,age=now-date;
 if(!Number.isFinite(price)||price<=0||!Number.isFinite(date)||age< -600000||age>4*86400000)throw Error('Precio oro inválido o antiguo');return {price,date};
}
if(typeof module!=='undefined')module.exports={parseMSCI,parseGold};
