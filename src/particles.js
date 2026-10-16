export const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
export function particleBudget(width,height,dpr=1,coarse=false){
  const mobile=coarse||width<=640;
  return {count:mobile?40:80,minimum:mobile?30:60,ratio:Math.min(Math.max(1,dpr),mobile?1.5:2,Math.sqrt(2500000/Math.max(1,width*height)))};
}
export function createParticles(count,width,height,random=Math.random){
  return Array.from({length:count},(_,index)=>({x:random()*width,y:random()*height,vx:0,vy:0,radius:.5+random()*1.7,speed:.12+random()*.38,phase:random()*Math.PI*2,alpha:.25+random()*.5,kind:index%5<2?2:index%2,trail:0}));
}
export function advanceParticles(particles,waves,pointer,width,height,elapsed,time){
  const dt=clamp(elapsed/16.667,0,2.2);
  for(const wave of waves){wave.radius+=3.2*dt;wave.life-=dt;}
  for(const particle of particles){
    particle.previousX=particle.x;particle.previousY=particle.y;
    const push=(x,y,radius,strength,front=false)=>{
      const dx=particle.x-x,dy=particle.y-y,distance=Math.hypot(dx,dy)||.01;
      const influence=front?1-Math.abs(distance-radius)/24:1-distance/radius;
      if(influence>0){particle.vx+=dx/distance*influence*strength*dt;particle.vy+=dy/distance*influence*strength*dt;particle.trail=12;}
    };
    if(pointer?.active)push(pointer.x,pointer.y,pointer.radius??120,.12);
    for(const wave of waves)if(wave.life>0)push(wave.x,wave.y,wave.radius,.48,true);
    particle.vx*=Math.pow(.94,dt);particle.vy*=Math.pow(.94,dt);
    particle.x+=(Math.sin(time*.00022+particle.phase)*.08+particle.vx)*dt;
    particle.y+=(-particle.speed+particle.vy)*dt;
    particle.trail=Math.max(0,particle.trail-dt);
    if(particle.y< -12){particle.y=height+8;particle.x=(particle.x+width*.37)%width;particle.trail=0;}
    if(particle.y>height+16){particle.y=-8;particle.trail=0;}
    if(particle.x< -12){particle.x=width+8;particle.trail=0;}else if(particle.x>width+12){particle.x=-8;particle.trail=0;}
  }
  for(let index=waves.length-1;index>=0;index--)if(waves[index].life<=0)waves.splice(index,1);
}
