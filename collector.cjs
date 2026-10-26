// Public SEC data only. No spreadsheet IDs, holdings, email or credentials in output.
const fs=require('node:fs/promises');
const crypto=require('node:crypto');
const {COMPANIES,extract}=require('./core.cjs');
async function main(){
 const ua=process.env.SEC_USER_AGENT;
 if(!ua||!ua.includes('@'))throw Error('Set SEC_USER_AGENT as an Actions secret with application name and contact email.');
 const fetchedAt=new Date().toISOString(),cutoff=fetchedAt.slice(0,10),companies=[];
 for(const [ticker,cik] of COMPANIES){
  const url='https://data.sec.gov/api/xbrl/companyfacts/CIK'+cik+'.json';
  const response=await fetch(url,{headers:{'User-Agent':ua,Accept:'application/json'},signal:AbortSignal.timeout(30000)});
  if(!response.ok)throw Error('SEC '+ticker+' HTTP '+response.status+'; previous cache preserved.');
  const raw=await response.text(),j=JSON.parse(raw),d=extract(j,ticker,cik,cutoff);
  if(String(j.cik)!==String(Number(cik))||d.hist.length!==4||!Object.values(d.values).every(Number.isFinite)||d.values.shares<=0||d.values.assets<=0||d.values.revenue<=0)throw Error('Invalid SEC dataset for '+ticker);
  companies.push({...d,source:url,sha256:crypto.createHash('sha256').update(raw).digest('hex')});
  await new Promise(r=>setTimeout(r,1100));
 }
 const payload={schemaVersion:1,fetchedAt,companies};
 const serialized=JSON.stringify(payload,null,2);
 if(serialized.includes(ua)||serialized.includes('@'))throw Error('Unexpected contact data in public output.');
 await fs.mkdir('data',{recursive:true});await fs.writeFile('data/latest.json.tmp',serialized);await fs.rename('data/latest.json.tmp','data/latest.json');
 console.log('Validated and saved public data for '+companies.length+' companies.');
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
