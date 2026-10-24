// Draws the app icon and splash screen (the nine game pads) into app/assets. Run: node scripts/make-icons.cjs assets, then npm run assets.
const {chromium}=require('playwright');
const C=['#FF4D6D','#FF8C42','#FFC857','#2EE59D','#22D3EE','#4D8BFF','#8C6BFF','#C14DFF','#FF5CC8'];
// Pads that are "lit" in the icon: a short pattern, the rest dimmed like the game's idle pads.
const LIT=new Set([0,4,8,5]);
function grid(size,area,bg){ // area: fraction of canvas the grid fills
  const g=size*area, gap=g*0.06, pad=(g-2*gap)/3, off=(size-g)/2, r=pad*0.22;
  let s='';for(let i=0;i<9;i++){const x=off+(i%3)*(pad+gap),y=off+Math.floor(i/3)*(pad+gap);
    s+=`<rect x="${x}" y="${y}" width="${pad}" height="${pad}" rx="${r}" fill="${C[i]}" opacity="${LIT.has(i)?1:0.28}"/>`;}
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">${bg?`<rect width="100%" height="100%" fill="${bg}"/>`:''}${s}</svg>`;
}
const BG='#0E0F24';
const out=process.argv[2];
(async()=>{const b=await chromium.launch();const p=await b.newPage();
 async function shot(svg,size,file,transparent){await p.setViewportSize({width:size,height:size});
  await p.setContent(`<style>html,body{margin:0;background:transparent}</style>${svg}`);
  await p.screenshot({path:out+'/'+file,omitBackground:!!transparent});}
 await shot(grid(1024,0.66,BG),1024,'icon-only.png');
 await shot(grid(1024,0.46,null),1024,'icon-foreground.png',true); // Android adaptive icons crop to the centre ~66%
 await shot(`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024"><rect width="100%" height="100%" fill="${BG}"/></svg>`,1024,'icon-background.png');
 await shot(grid(2732,0.22,BG),2732,'splash.png');
 await shot(grid(2732,0.22,BG),2732,'splash-dark.png');
 await b.close();})();
