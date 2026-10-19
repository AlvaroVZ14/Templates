import {test} from 'node:test';
import assert from 'node:assert/strict';
import {checkPublishedUpdate,waitForInstallation} from '../src/pwaUpdates.js';

class Worker extends EventTarget{
  state='installing';
  change(state){this.state=state;this.dispatchEvent(new Event('statechange'));}
}
class Registration extends EventTarget{
  installing=null;waiting=null;calls=0;
  async update(){this.calls++;await this.action?.();}
}

test('búsqueda manual espera la descarga completa y distingue una versión preparada',async()=>{
  const reg=new Registration(),worker=new Worker();
  reg.action=()=>{reg.installing=worker;reg.dispatchEvent(new Event('updatefound'));};
  let finished=false;const checking=checkPublishedUpdate(reg).then(result=>{finished=true;return result;});
  await new Promise(resolve=>setImmediate(resolve));assert.equal(finished,false);
  reg.waiting=worker;reg.installing=null;worker.change('installed');
  assert.equal(await checking,true);assert.equal(reg.calls,1);
});
test('sin cambios, espera ya existente y dos búsquedas seguidas sin límite automático',async()=>{
  const reg=new Registration();assert.equal(await checkPublishedUpdate(reg),false);
  reg.waiting=new Worker();reg.waiting.state='installed';
  assert.equal(await checkPublishedUpdate(reg),true);assert.equal(reg.calls,2);
});
test('error de red, instalación fallida o descarga agotada nunca dicen que está al día',async()=>{
  const reg=new Registration();reg.action=()=>{throw new Error('Red de prueba no disponible');};
  await assert.rejects(checkPublishedUpdate(reg),/Red de prueba/);
  const worker=new Worker(),installing=waitForInstallation(worker);
  worker.change('redundant');await assert.rejects(installing,/No se pudo instalar/);
  await assert.rejects(waitForInstallation(new Worker(),5),/descarga tarda/);
  const stalled=new Registration();stalled.action=()=>new Promise(()=>{});
  await assert.rejects(checkPublishedUpdate(stalled,5),/descarga tarda/);
});
