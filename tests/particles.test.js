import test from 'node:test';
import assert from 'node:assert/strict';
import {advanceParticles,createBurst,createParticles,fireColor,fireLanes,particleBudget} from '../src/particles.js';
function random(){let seed=15;return()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);}
test('fuego: presupuesto por lado, modo reducido a la mitad y retina limitado',()=>{
  for(const [width,height,dpr,coarse,count,limit] of [[390,844,3,false,20,1.5],[1440,900,3,false,200,2],[3840,2160,3,false,200,2],[1000,800,2,true,20,1.5]]){
    const budget=particleBudget(width,height,dpr,coarse),reduced=particleBudget(width,height,dpr,coarse,true);
    assert.equal(budget.count,count);assert.equal(reduced.count,count/2);assert.equal(reduced.maxBursts,0);assert.ok(budget.minimum<count);assert.ok(budget.ratio<=limit);assert.ok(width*height*budget.ratio**2<=2500001);
  }
});
test('dos especies, confinadas en laterales incluso con ventana estrecha',()=>{
  for(const width of [320,768,1440,1920]){const particles=createParticles(200,width,900,random());assert.ok(particles.some(p=>p.kind==='ember'));assert.ok(particles.some(p=>p.kind==='spark'));assert.equal(particles.filter(p=>p.side===0).length,100);
    for(const p of particles){assert.ok(p.x>=p.minX&&p.x<=p.maxX);if(p.kind==='ember')assert.ok(p.radius>=1.7);else assert.ok(p.radius<1.1);assert.ok(p.y>0);}
    assert.ok(fireLanes(width)[0].maxX<width/2);
  }
});
test('ciclo de vida: sube, se encoge, se apaga y renace abajo sin saltar al borde superior',()=>{
  const rng=random(),particles=createParticles(1,1920,900,rng),p=particles[0];p.age=p.life*.4;advanceParticles(particles,null,1920,900,0,rng);const before={y:p.y,size:p.size,alpha:p.alpha};p.age=p.life*.9;advanceParticles(particles,null,1920,900,0,rng);
  assert.ok(p.y<before.y);assert.ok(p.size<before.size);assert.ok(p.alpha<before.alpha);assert.ok(p.y>900*.1);
  p.age=p.life;advanceParticles(particles,null,1920,900,16,rng);assert.ok(particles[0].y>=900);assert.equal(particles[0].age,0);
  assert.equal(fireColor(0),'#FFD080');assert.equal(fireColor(.55),'#FF1A1A');assert.equal(fireColor(.7),'#C8102E');assert.equal(fireColor(1),'#480B18');
});
test('puntero aparta suavemente con estela, sin alterar el lateral lejano',()=>{
  const particles=createParticles(2,1920,900,random()),control=structuredClone(particles[1]),pointer={active:true,x:particles[0].x-8,y:particles[0].y};
  advanceParticles(particles,pointer,1920,900,16);advanceParticles([control],null,1920,900,16);
  assert.ok(particles[0].vx>0);assert.ok(particles[0].trail>0);assert.deepEqual(particles[1],control);
  for(let frame=0;frame<800;frame++)advanceParticles(particles,pointer,1920,900,16);
  assert.ok(particles.every(p=>[p.x,p.y,p.vx,p.vy].every(Number.isFinite)&&p.x>=p.minX&&p.x<=p.maxX));
});
test('ráfagas solo en márgenes, se agotan sin renacer y el paso temporal está acotado',()=>{
  assert.deepEqual(createBurst(960,700,1920,900),[]);
  const burst=createBurst(40,700,1920,900,16,random());assert.equal(burst.length,16);assert.ok(burst.every(p=>p.burst&&p.kind==='spark'));
  const before=burst[0].age;advanceParticles(burst,null,1920,900,600000);assert.ok(burst[0].age-before<=2.4+1e-9);
  for(let frame=0;frame<80;frame++)advanceParticles(burst,null,1920,900,16);
  assert.equal(burst.length,0);
});
