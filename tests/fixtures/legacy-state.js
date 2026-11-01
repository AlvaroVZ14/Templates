import {initialState as currentInitialState} from '../../src/domain.js';
import legacy from './legacy-routine.json' with {type:'json'};

// Historical regression data is intentional. New-plan tests import domain.js directly.
export const LEGACY_TARGETS=legacy.targets;
export function initialState(){
 const state=currentInitialState(),copy=structuredClone(legacy);
 for(const exercise of copy.routine.flat())exercise.id=crypto.randomUUID();
 return {...state,...copy,routineVersion:'ppl-torso-leg-v1'};
}
