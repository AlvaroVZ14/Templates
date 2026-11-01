import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {APP_NAME,appName,BRAND_ASSETS} from '../src/brand.js';
const publicFile=name=>new URL(`../public/${name}`,import.meta.url);
test('Olympia reemplaza solo el nombre predeterminado y conserva identidades personalizadas',()=>{
 assert.equal(APP_NAME,'Olympia');for(const value of [null,undefined,'',' BLOOD & GUTS ','blood & guts'])assert.equal(appName(value),'Olympia');
 assert.equal(appName(' Mi gimnasio '),'Mi gimnasio');assert.equal(appName('X'.repeat(40)).length,32);
});
test('manifest conserva identidad y ruta, separa maskable y declara las dimensiones reales',()=>{
 const manifest=JSON.parse(readFileSync(publicFile('manifest.webmanifest'),'utf8'));
 assert.equal(manifest.id,'./');assert.equal(manifest.scope,'./');assert.equal(manifest.start_url,'./');assert.equal(manifest.name,'Olympia');assert.equal(manifest.short_name,'Olympia');
 assert.equal(manifest.background_color,'#0B0B0D');
 for(const icon of manifest.icons){const bytes=readFileSync(publicFile(icon.src)),size=Number(icon.sizes.split('x')[0]);assert.equal(bytes.readUInt32BE(16),size);assert.equal(bytes.readUInt32BE(20),size);assert.ok(['any','maskable'].includes(icon.purpose));}
 assert.equal(readFileSync(publicFile('apple-touch-icon.png')).readUInt32BE(16),180);
 for(const asset of BRAND_ASSETS)assert.ok(existsSync(publicFile(asset)),asset);
});
test('SVG autónomos sin scripts ni imágenes externas; el splash respeta movimiento reducido',()=>{
 for(const name of BRAND_ASSETS.filter(name=>name.endsWith('.svg'))){const svg=readFileSync(publicFile(name),'utf8');assert.match(svg,/<title[^>]*>Olympia<\/title>/);assert.doesNotMatch(svg,/<script|<image|<text\b|(?:href|src)=["'](?:https?:|\/\/)/i);}
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');assert.match(html,/apple-touch-icon\.png/);assert.match(html,/prefers-reduced-motion:reduce/);assert.doesNotMatch(html,/BLOOD/);
});
