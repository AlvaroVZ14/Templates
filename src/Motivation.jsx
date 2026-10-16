import {useEffect,useState} from 'react';
import {DEFAULT_MOTIVATION,MOTIVATION_CONTEXTS,motivationPhrases,saveMotivation,selectMotivation,validateMotivation} from './motivation.js';

export function MotivationHeading({data,date,motto}) {
  const phrase=selectMotivation(data,date);
  return <div className="page-heading motivation-heading"><div>
    <p className="eyebrow motivation-context">{phrase.label}</p>
    <h1 aria-label="Hoy" className="motivation-phrase">{phrase.text}</h1>
    {motto&&<p className="motivation-motto">{motto}</p>}
  </div></div>;
}

export function MotivationSettings({data,change,saving}) {
  const [phrases,setPhrases]=useState(()=>motivationPhrases(data));
  const [dirty,setDirty]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState('');
  const [newText,setNewText]=useState(''),[newContext,setNewContext]=useState('general');
  useEffect(()=>{if(!dirty)setPhrases(motivationPhrases(data));},[data.motivationSettings,dirty]);
  function update(next){setPhrases(next);setDirty(true);setMessage('');setError('');}
  function add(){
    if(!newText.trim()){setError('Escribe una frase antes de añadirla.');return;}
    update([...phrases,{id:crypto.randomUUID(),text:newText.trim(),context:newContext}]);setNewText('');
  }
  async function save(event){
    event.preventDefault();setMessage('');
    const invalid=validateMotivation(phrases);setError(invalid??'');if(invalid)return;
    if(await change(state=>saveMotivation(state,phrases))){setDirty(false);setMessage('Banco de frases guardado.');}
  }
  const options=Object.entries(MOTIVATION_CONTEXTS).map(([value,label])=><option value={value} key={value}>{label}</option>);
  return <section className="wellness-card motivation-settings">
    <details>
      <summary><span>Frases del día</span><small>{phrases.length} frases · Editar banco</small></summary>
      <p className="field-note">Textos originales, sin atribuciones. En descanso se eligen frases de recuperación. Al entrenar, la fecha alterna entre músculo de la sesión y fase; si faltan, usa el contexto disponible o una general. Se mantiene durante ese día mientras no cambies el banco o el plan.</p>
      <form onSubmit={save}>
        <div className="motivation-editor">
          {phrases.map((phrase,index)=><div className="motivation-editor-row" key={phrase.id}>
            <label>Frase {index+1}<textarea aria-label={`Frase ${index+1}`} maxLength="160" required value={phrase.text} disabled={saving} onChange={event=>update(phrases.map(item=>item.id===phrase.id?{...item,text:event.target.value}:item))}/></label>
            <label>Contexto<select aria-label={`Contexto de frase ${index+1}`} value={phrase.context} disabled={saving} onChange={event=>update(phrases.map(item=>item.id===phrase.id?{...item,context:event.target.value}:item))}>{options}</select></label>
            <button className="danger" type="button" disabled={saving} onClick={()=>update(phrases.filter(item=>item.id!==phrase.id))} aria-label={`Eliminar frase ${index+1}`}>Eliminar</button>
          </div>)}
        </div>
        {!phrases.length&&<p className="field-note">El banco está vacío. El inicio mostrará «Hoy también cuenta. Respeta tu plan.» hasta que añadas frases.</p>}
        <fieldset className="motivation-new">
          <legend>Añadir una frase</legend>
          <label>Nueva frase<textarea aria-label="Nueva frase" maxLength="160" value={newText} disabled={saving} onChange={event=>{setNewText(event.target.value);setMessage('');}}/></label>
          <label>Contexto nuevo<select aria-label="Contexto de nueva frase" value={newContext} disabled={saving} onChange={event=>setNewContext(event.target.value)}>{options}</select></label>
          <button className="secondary" type="button" disabled={saving} onClick={add}>Añadir al banco</button>
        </fieldset>
        <div className="motivation-editor-actions">
          <button className="primary" disabled={saving||!dirty}>Guardar frases</button>
          <button className="secondary" type="button" disabled={saving} onClick={()=>{if(window.confirm('¿Restablecer las 30 frases originales? Los cambios solo se aplican al guardar.'))update(DEFAULT_MOTIVATION.map(phrase=>({...phrase})));}}>Restablecer originales</button>
        </div>
        <p className="field-note">Añadir, editar, eliminar y restablecer se aplican al pulsar Guardar frases. Al salir sin guardar se descartan las ediciones de este banco.</p>
        {message&&<p className="success" role="status">{message}</p>}
        {error&&<p className="error" role="alert">{error}</p>}
      </form>
    </details>
  </section>;
}
