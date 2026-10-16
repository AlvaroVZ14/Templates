import test from 'node:test';
import assert from 'node:assert/strict';
import {advanceParticles,createParticles,particleBudget} from '../src/particles.js';

test('presupuesto móvil y escritorio limita partículas y píxeles retina',()=>{
  for(const [width,height,dpr,coarse,count,limit] of [[390,844,3,false,40,1.5],[1440,900,3,false,80,2],[3840,2160,3,false,80,2],[1000,800,2,true,40,1.5]]){
    const budget=particleBudget(width,height,dpr,coarse);
    assert.equal(budget.count,count);assert.ok(budget.minimum<count);
    assert.ok(budget.ratio<=limit);assert.ok(width*height*budget.ratio**2<=2500001);
  }
});
test('cursor y onda empujan hacia fuera, con estela; no alteran partículas lejanas',()=>{
  const base=createParticles(1,600,800,()=>.5)[0];
  const near={...base,x:110,y:100},far={...base,x:500,y:700},control={...far};
  advanceParticles([near,far],[],{active:true,x:100,y:100},600,800,16.667,0);
  advanceParticles([control],[],null,600,800,16.667,0);
  assert.ok(near.vx>0);assert.ok(near.trail>0);assert.deepEqual(far,control);
  const waveParticle={...base,x:120,y:100};
  advanceParticles([waveParticle],[{x:100,y:100,radius:17,life:58}],null,600,800,16.667,0);
  assert.ok(waveParticle.vx>0);assert.ok(waveParticle.trail>0);
});
test('vuelve por los bordes, limita saltos de tiempo y elimina ondas agotadas',()=>{
  const particles=createParticles(40,390,844,()=>.5),waves=[{x:0,y:0,radius:10,life:.5}];
  particles[0].y=-14;
  advanceParticles(particles,waves,null,390,844,600000,0);
  assert.equal(particles[0].y,852);assert.equal(waves.length,0);
  assert.ok(Math.abs(particles[1].y-422)<2);
  for(let frame=0;frame<500;frame++)advanceParticles(particles,[],{active:true,x:195,y:422},390,844,16.667,frame*16.667);
  assert.ok(particles.every(p=>[p.x,p.y,p.vx,p.vy].every(Number.isFinite)));
});
