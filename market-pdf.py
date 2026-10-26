import re, json, io, urllib.request, pathlib, datetime, sys
from pypdf import PdfReader

SOURCE='https://www.msci.com/documents/10199/255599/msci-world-index-usd-net.pdf'
def parse_pdf(data):
    reader=PdfReader(io.BytesIO(data))
    text='\n'.join(p.extract_text() or '' for p in reader.pages)
    if 'MSCI World Index (USD)' not in text: raise ValueError('Índice distinto')
    match=re.search(r'FUNDAMENTALS\s*\(([A-Z]{3})\s+(\d{1,2}),\s*(\d{4})\)\s*Div Yld \(%\)\s*P/E\s*P/E Fwd\s*P/BV\s*(?:MSCI World\s*)?(\d+\.\d+)\s+(\d+\.\d+)\s+(\d+\.\d+)\s+(\d+\.\d+)',text)
    if not match: raise ValueError('Formato de fundamentos desconocido')
    date=datetime.datetime.strptime(' '.join(match.group(1,2,3)),'%b %d %Y').date()
    dy,pe,forward,pb=map(float,match.group(4,5,6,7))
    names=['NVIDIA','MICROSOFT CORP','META PLATFORMS A','APPLE','AMAZON.COM','ALPHABET A','ALPHABET C']
    top=text.split('TOP 10 CONSTITUENTS',1)[1].split('FACTORS',1)[0]
    def weight(name):
        m=re.search(r'^'+re.escape(name)+r'\s+[\d,.]+\s+(\d+\.\d+)\s',top,re.M)
        return float(m.group(1))/100 if m else None
    w=list(map(weight,names));w=w[:5]+[None if None in w[5:] else sum(w[5:])]
    if not (0<pe<=100 and 0<forward<=100 and 0<pb<=50 and 0<=dy<=20):raise ValueError('Ratios inválidos')
    if any(x is not None and not 0<=x<=1 for x in w):raise ValueError('Pesos inválidos')
    return dict(date=date.isoformat(),pe=pe,forward=forward,pb=pb,dy=dy/100,weights=w)

if __name__=='__main__':
    if len(sys.argv)>1:
        print(json.dumps(parse_pdf(pathlib.Path(sys.argv[1]).read_bytes())))
    else:
        with urllib.request.urlopen(SOURCE,timeout=30) as r:data=r.read()
        p=parse_pdf(data);now=datetime.datetime.now(datetime.timezone.utc)
        age=(now.date()-datetime.date.fromisoformat(p['date'])).days
        if not 0<=age<=45:raise ValueError('Fecha de publicación antigua o futura')
        p.update(schemaVersion=1,source=SOURCE,fetchedAt=now.isoformat())
        pathlib.Path('data').mkdir(exist_ok=True)
        pathlib.Path('data/msci.json').write_text(json.dumps(p,indent=2),encoding='utf8')
        print('MSCI validado: '+p['date'])
