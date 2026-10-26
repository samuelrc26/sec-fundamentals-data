const {execFileSync}=require('node:child_process');
// Official monthly PDF avoids dependence on the interactive website rendering.
execFileSync('python',['-m','pip','install','--disable-pip-version-check','pypdf==6.10.0'],{stdio:'inherit'});
execFileSync('python',['market-pdf.py'],{stdio:'inherit'});
