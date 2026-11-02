import {initialState as currentInitialState} from '../../src/domain.js';
import legacy from './legacy-routine.json' with {type:'json'};
import {SYNTHETIC_MEASUREMENT} from './synthetic-measurements.js';

// Historical regression data is intentional. New-plan tests import domain.js directly.
export const LEGACY_TARGETS=legacy.targets;
export function initialState(){
 const state=currentInitialState(),copy=structuredClone(legacy);
 for(const exercise of copy.routine.flat())exercise.id=crypto.randomUUID();
 return {...state,...copy,measurements:[structuredClone(SYNTHETIC_MEASUREMENT)],phases:[
  {id:'fixture-bulk',kind:'bulk',startDate:'2026-10-01',deadline:'2026-12-31',targetWeight:80,startWeight:null,anchorDate:'2026-10-01',startWaist:null},
  {id:'fixture-cut',kind:'cut',startDate:'2027-01-01',deadline:'2027-03-31',windowStart:'2027-03-15',targetWeight:76,startWeight:null,anchorDate:'2027-01-01',startWaist:null,scheduled:true},
 ],routineVersion:'ppl-torso-leg-v1'};
}
