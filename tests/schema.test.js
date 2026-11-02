import test from 'node:test';
import assert from 'node:assert/strict';
import {runSchemaMigrations,DATA_SCHEMA_VERSION} from '../src/schema.js';
import {initialState,migrateState} from '../src/domain.js';
test('esquema actual es idempotente y una versión futura no se reescribe',()=>{const s=initialState();assert.equal(s.schemaVersion,DATA_SCHEMA_VERSION);assert.equal(migrateState(s),s);assert.throws(()=>migrateState({...s,schemaVersion:DATA_SCHEMA_VERSION+1}),/nueva|compatible/);});
test('migraciones futuras son ordenadas, conservan historial y no mutan el origen al fallar',()=>{const s={schemaVersion:7,logs:[{id:'fictitious'}]},before=structuredClone(s);const up=runSchemaMigrations(s,{8:old=>({...old,schemaVersion:8,extra:true}),9:old=>({...old,schemaVersion:9})},9);assert.deepEqual(up.logs,s.logs);assert.equal(up.schemaVersion,9);assert.deepEqual(s,before);assert.throws(()=>runSchemaMigrations(s,{8:old=>{old.logs=[];throw new Error('fallo simulado');}},8),/fallo/);assert.deepEqual(s,before);assert.throws(()=>runSchemaMigrations(s,{},8),/Falta/);});
