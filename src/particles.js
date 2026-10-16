export const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
export const FIRE_COLORS=['#F1EDE4','#E1A0AA','#D83A50','#C8102E','#8B1327','#480B18'];
export function particleBudget(width,height,dpr=1,coarse=false,reduced=false){
  const mobile=coarse||width<=640,scale=reduced?.5:1;
  return {mobile,count:(mobile?20:200)*scale,minimum:(mobile?16:160)*scale,maxBursts:reduced?0:mobile?5:40,ratio:Math.min(Math.max(1,dpr),mobile?1.5:2,Math.sqrt(2500000/Math.max(1,width*height)))};
}
export function fireLanes(width){const edge=width<=640?12:Math.max(10,(width-1240)/2-16);return [{minX:0,maxX:edge},{minX:width-edge,maxX:width}];}
export function fireColor(progress){return FIRE_COLORS[Math.min(5,Math.floor(clamp(progress,0,1)*6))];}
function spawnParticle(side,width,height,random,burst=null){
  const lane=fireLanes(width)[side],spark=burst||random()<.62,travel=height*(.72+random()*.16),speed=spark?2.3+random()*2.6:.65+random()*.7;
  return {...lane,side,kind:spark?'spark':'ember',originX:burst?clamp(burst.x,lane.minX,lane.maxX):lane.minX+random()*(lane.maxX-lane.minX),originY:burst?burst.y:height+random()*8,travel,life:travel/speed,age:0,phase:random()*Math.PI*2,radius:spark?.45+random()*.65:1.7+random()*2,sway:Math.min((lane.maxX-lane.minX)*.3,spark?4:18),vx:burst?(random()-.5)*2.5:0,vy:0,offsetX:0,offsetY:0,trail:0,burst:!!burst};
}
function position(p){const t=p.age/p.life;p.progress=t;p.size=p.radius*Math.pow(Math.max(0,1-t),.65);p.alpha=Math.min(1,t*14)*Math.pow(Math.max(0,1-t),1.05);p.x=clamp(p.originX+Math.sin(t*(p.kind==='spark'?28:7)+p.phase)*p.sway+p.offsetX,p.minX,p.maxX);p.y=p.originY-p.travel*t+p.offsetY;}
export function createParticles(count,width,height,random=Math.random){return Array.from({length:count},(_,index)=>{const p=spawnParticle(index%2,width,height,random);p.age=random()*p.life;position(p);return p;});}
export function createBurst(x,y,width,height,count=12,random=Math.random){const lanes=fireLanes(width),side=lanes.findIndex(lane=>x>=lane.minX&&x<=lane.maxX);if(side<0)return [];return Array.from({length:count},()=>{const p=spawnParticle(side,width,height,random,{x,y});p.travel=Math.min(p.travel,Math.max(35,y*.6));p.life=24+random()*40;p.age=2;position(p);return p;});}
export function advanceParticles(particles,pointer,width,height,elapsed,random=Math.random){
  const dt=clamp(elapsed/16.667,0,2.4);
  for(let index=particles.length-1;index>=0;index--){let p=particles[index];p.previousX=p.x;p.previousY=p.y;p.age+=dt;
    if(p.age>=p.life){if(p.burst){particles.splice(index,1);continue;}p=particles[index]=spawnParticle(p.side,width,height,random);position(p);p.previousX=p.x;p.previousY=p.y;}
    if(pointer?.active){const dx=p.x-pointer.x,dy=p.y-pointer.y,distance=Math.hypot(dx,dy)||.01,influence=1-distance/(pointer.radius??100);if(influence>0){p.vx+=dx/distance*influence*.32*dt;p.vy+=dy/distance*influence*.16*dt;p.trail=10;}}
    p.vx*=Math.pow(.9,dt);p.vy*=Math.pow(.9,dt);p.offsetX=clamp(p.offsetX+p.vx*dt,-24,24);p.offsetY=clamp(p.offsetY+p.vy*dt,-20,20);p.offsetX*=Math.pow(.995,dt);p.offsetY*=Math.pow(.995,dt);p.trail=Math.max(0,p.trail-dt);position(p);
  }
}
