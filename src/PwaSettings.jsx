export default function PwaSettings({pwa,onUpdate,saving}){
  const feedback=pwa.available&&!pwa.checking?'Actualización lista. Toca Actualizar ahora.':pwa.checkMessage;
  return <section className="wellness-card pwa-settings" aria-label="Actualizaciones de la app">
    <h2>Actualizaciones</h2>
    <p>Busca una versión publicada nueva sin reinstalar la app.</p>
    <p className="field-note pwa-build">Versión instalada: <strong>{pwa.build}</strong></p>
    <div className="program-actions">
      <button type="button" className="secondary" disabled={pwa.checking||pwa.updating} onClick={pwa.checkUpdates}>{pwa.checking?'Buscando actualizaciones…':'Buscar actualizaciones'}</button>
      {pwa.available&&<button type="button" className="primary" disabled={saving||pwa.updating||pwa.checking} onClick={onUpdate}>{pwa.updating?'Guardando y actualizando…':'Actualizar ahora'}</button>}
    </div>
    <p className="field-note" role={feedback?'status':undefined} aria-live="polite">{feedback||'Necesitas internet para buscar. Los registros y borradores se conservan al actualizar.'}</p>
  </section>;
}
