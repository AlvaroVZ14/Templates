import {useState} from 'react';
import {exportBackup,updateState} from './db.js';
import {localDate} from './domain.js';

export default function BackupButton(){
  const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState('');
  async function download(){setBusy(true);setMessage('');setError('');try{const backup=await exportBackup(),blob=new Blob([JSON.stringify(backup,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=`heavy-duty-${localDate()}.json`;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);setMessage('Descarga de copia iniciada. Comprueba que el archivo JSON se guardó en tus descargas.');try{const next=await updateState(state=>({...state,backupSettings:{...state.backupSettings,lastExportMonth:localDate().slice(0,7),lastExportAt:new Date().toISOString()}}));window.dispatchEvent(new CustomEvent('heavy-duty-backup-exported',{detail:next.backupSettings}));}catch{setError('La descarga se inició, pero no se pudo actualizar el recordatorio. Comprueba el archivo descargado.');}}catch{setError('No se pudo crear la copia. Tus datos no se han modificado; vuelve a intentar.');}finally{setBusy(false);}}
  return <div className="backup-control"><button className="secondary" disabled={busy} onClick={download}>{busy?'Preparando copia…':'Exportar respaldo'}</button><p className="field-note">Archivo JSON con todos los datos y versiones, guardado fuera del navegador. No se envía a ningún servidor.</p>{message&&<p className="success" role="status">{message}</p>}{error&&<p className="error" role="alert">{error}</p>}</div>;
}
