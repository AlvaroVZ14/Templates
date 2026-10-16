import {useRef,useState} from 'react';
import {localDate} from './domain.js';
import {generateSummary} from './summaries.js';
export default function SummaryTools({data}){
 const [date,setDate]=useState(localDate()),[text,setText]=useState(''),[message,setMessage]=useState(''),field=useRef(null);
 function generate(kind){setText(generateSummary(data,kind,date));setMessage('Resumen generado en este dispositivo. Revisa el texto antes de compartirlo.');}
 async function copy(){try{if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(text);else{field.current.focus();field.current.select();if(!document.execCommand('copy'))throw new Error();}setMessage('Resumen copiado.');}catch{field.current.focus();field.current.select();setMessage('Texto seleccionado. Usa Copiar en tu dispositivo.');}}
 return <section className="wellness-card summary-tools"><h2>Resúmenes para revisar</h2><p className="field-note">Texto local con registros y comparación. No se envía a ninguna API.</p><label>Fecha de corte<input aria-label="Fecha de corte del resumen" type="date" value={date} max={localDate()} onChange={event=>{if(event.target.value){setDate(event.target.value);setText('');setMessage('');}}}/></label><div className="program-actions"><button className="secondary" onClick={()=>generate('weekly')}>Resumen semanal</button><button className="secondary" onClick={()=>generate('monthly')}>Resumen mensual</button></div>{text&&<><label>Texto del resumen<textarea ref={field} aria-label="Texto del resumen" value={text} readOnly rows={14}/></label><button className="primary" onClick={copy}>Copiar</button></>}{message&&<p role="status" className="field-note">{message}</p>}</section>;
}
