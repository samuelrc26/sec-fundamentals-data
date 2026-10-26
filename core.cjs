const COMPANIES=[['NVDA','0001045810'],['MSFT','0000789019'],['META','0001326801'],['AAPL','0000320193'],['AMZN','0001018724'],['GOOGL','0001652044']];
const TAGS={revenue:['RevenueFromContractWithCustomerExcludingAssessedTax','Revenues','SalesRevenueNet'],cfo:['NetCashProvidedByUsedInOperatingActivities'],capex:['PaymentsToAcquirePropertyPlantAndEquipment','PaymentsToAcquireProductiveAssets'],sbc:['ShareBasedCompensation'],net:['NetIncomeLoss'],op:['OperatingIncomeLoss'],assets:['Assets'],liabilities:['Liabilities'],equity:['StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest','StockholdersEquity'],shares:['WeightedAverageNumberOfDilutedSharesOutstanding']};
function extract(j,ticker,cik,cutoff){
 const audit=[];const day=(a,b)=>(new Date(a)-new Date(b))/86400000;
 function records(metric){return TAGS[metric].flatMap(tag=>(j.facts['us-gaap'][tag]?.units[metric==='shares'?'shares':'USD']||[]).filter(x=>x.filed<=cutoff&&['10-K','10-Q','10-K/A','10-Q/A'].includes(x.form)).map(x=>({...x,tag})));}
 const all=records('cfo'), annual=all.filter(x=>x.form.startsWith('10-K')&&day(x.end,x.start)>=330&&day(x.end,x.start)<=380).sort((a,b)=>b.end.localeCompare(a.end)||b.filed.localeCompare(a.filed))[0];
 const latest=all.filter(x=>x.start&&(x.start>annual.end||x.end===annual.end)&&day(x.end,x.start)<=380).sort((a,b)=>b.end.localeCompare(a.end)||b.filed.localeCompare(a.filed)||a.start.localeCompare(b.start))[0];
 const pick=(m,start,end)=>records(m).filter(x=>x.end===end&&(!start||x.start===start)).sort((a,b)=>b.filed.localeCompare(a.filed))[0];
 function use(m,x,sign){if(!x)throw Error(ticker+': falta '+m);audit.push([ticker,m,sign,x.val,x.start||'',x.end,x.filed,x.tag,x.accn,'https://www.sec.gov/Archives/edgar/data/'+Number(cik)+'/'+x.accn.replace(/-/g,'')+'/']);return x.val;}
 function flow(m){const a=pick(m,annual.start,annual.end);let v=use(m,a,1);if(latest.end!==annual.end){const current=pick(m,latest.start,latest.end);const prior=records(m).filter(x=>x.start&&Math.abs(day(latest.start,x.start)-365)<9&&Math.abs(day(latest.end,x.end)-365)<9&&Math.abs(day(x.end,x.start)-day(latest.end,latest.start))<9).sort((a,b)=>b.filed.localeCompare(a.filed))[0];v+=use(m,current,1)-use(m,prior,-1);}return v;}
 const values={};for(const m of ['revenue','cfo','capex','sbc','net','op'])values[m]=flow(m);
 for(const m of ['assets','liabilities','shares']){let a=records(m).filter(x=>x.end===latest.end).sort((a,b)=>b.filed.localeCompare(a.filed)||(day(a.end,a.start)-day(b.end,b.start)));values[m]=m==='liabilities'&&!a[0]?values.assets-use('equity',pick('equity',null,latest.end),-1):use(m,a[0],1);}
 const years=[...new Set(all.filter(x=>x.form.startsWith('10-K')&&x.start&&day(x.end,x.start)>330&&day(x.end,x.start)<380).map(x=>x.end))].sort().reverse().slice(0,4).reverse();
 const hist=years.map(end=>{const a=all.filter(x=>x.end===end&&x.start&&day(x.end,x.start)>330).sort((a,b)=>b.filed.localeCompare(a.filed))[0];const vals=['revenue','cfo','capex','sbc'].map(m=>{const p=pick(m,a.start,end);return p?use(m,p,1):null;});return [ticker,end,...vals];});
 return {ticker,cik,end:latest.end,filed:latest.filed,values,hist,audit};
}
if(typeof module!=='undefined')module.exports={COMPANIES,TAGS,extract};


