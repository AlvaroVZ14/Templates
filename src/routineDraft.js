// Drafts may have unfinished names or out-of-range numbers, but their shape
// must still be safe to render. Final validation remains in validateRoutine.
export function parseRoutineDraft(text){
  try{
    const value=JSON.parse(text);
    if(!Array.isArray(value)||value.length!==7||!value.every(day=>Array.isArray(day)&&day.every(ex=>
      ex&&typeof ex==='object'&&!Array.isArray(ex)&&
      ['id','profileId','name','muscle','equipment','technique'].every(key=>typeof ex[key]==='string')&&
      ['sets','approaches','increment','dropCount','rpCount'].every(key=>Number.isFinite(ex[key]))&&
      ['compound','forced','negative'].every(key=>typeof ex[key]==='boolean')&&
      ex.rests&&['warmup','effective','rp','drop'].every(key=>Number.isFinite(ex.rests[key]))&&
      (ex.preparationJoint==null||typeof ex.preparationJoint==='string')
    )))return null;
    return value;
  }catch{return null;}
}
