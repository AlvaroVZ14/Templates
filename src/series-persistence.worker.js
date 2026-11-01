import {saveSeriesOperation,saveTrainingMetadata} from './db.js';
self.onmessage=async event=>{
  const {id,operation,metadata}=event.data;
  try{self.postMessage({id,result:await (metadata?saveTrainingMetadata(metadata):saveSeriesOperation(operation))});}
  catch(error){self.postMessage({id,error:error.message??'No se pudo guardar la serie.'});}
};
self.postMessage({ready:true});
