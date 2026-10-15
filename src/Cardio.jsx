import { useState } from 'react';

export const CARDIO_TYPES = ['Caminata inclinada', 'Bici', 'Trote suave'];
export const INTENSITIES = ['Suave', 'Moderada', 'Alta'];

export default function Cardio({ data, date, change, saving }) {
  const [type, setType] = useState(CARDIO_TYPES[0]);
  const [minutes, setMinutes] = useState('');
  const [intensity, setIntensity] = useState('Suave');
  const [steps, setSteps] = useState(data.dailySteps[date] === undefined ? '' : String(data.dailySteps[date]));
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const sessions = data.cardio.filter(session => session.date === date);
  async function record(event) {
    event.preventDefault(); setMessage(''); setError('');
    const value = Number(minutes);
    if (!minutes || !Number.isInteger(value) || value < 1 || value > 600) { setError('Ingresa entre 1 y 600 minutos completos.'); return; }
    const session = { id: crypto.randomUUID(), date, type, minutes: value, intensity, createdAt: new Date().toISOString() };
    if (await change(state => ({ ...state, cardio: [...state.cardio, session] }))) { setMinutes(''); setMessage('Cardio guardado.'); }
  }
  async function saveSteps(event) {
    event.preventDefault(); setError(''); setMessage('');
    if (steps !== '' && (!Number.isInteger(Number(steps)) || Number(steps) < 0 || Number(steps) > 200000)) { setError('Ingresa entre 0 y 200000 pasos, o deja el campo vacío.'); return; }
    if (await change(state => { const dailySteps = { ...state.dailySteps }; if (steps === '') delete dailySteps[date]; else dailySteps[date] = Number(steps); return { ...state, dailySteps }; })) setMessage('Pasos diarios guardados.');
  }
  return <section className="cardio-section" aria-label="Cardio de la sesión"><div className="section-heading"><h2>Cardio y pasos</h2><span>{sessions.reduce((sum, session) => sum + session.minutes, 0)} min hoy</span></div>
    <p className="field-note">Para la fecha seleccionada. No suma series de musculación.</p>
    <form onSubmit={record} className="cardio-form"><label>Tipo de cardio<select value={type} onChange={event => setType(event.target.value)}>{CARDIO_TYPES.map(label => <option key={label}>{label}</option>)}</select></label><div className="input-pair"><label>Minutos<input aria-label="Minutos de cardio" type="number" min="1" max="600" inputMode="numeric" value={minutes} onChange={event => setMinutes(event.target.value)} required /></label><label>Intensidad<select value={intensity} onChange={event => setIntensity(event.target.value)}>{INTENSITIES.map(label => <option key={label}>{label}</option>)}</select></label></div><button className="primary full" disabled={saving}>Guardar cardio</button></form>
    {sessions.map(session => <div className="cardio-row" key={session.id}><div><strong>{session.type}</strong><small>{session.intensity}</small></div><b>{session.minutes} min</b><button className="icon-button" aria-label={`Eliminar cardio ${session.type}`} disabled={saving} onClick={() => change(state => ({ ...state, cardio: state.cardio.filter(item => item.id !== session.id) }))}>×</button></div>)}
    <form className="steps-form" onSubmit={saveSteps}><label>Pasos diarios (opcional)<input aria-label="Pasos diarios" type="number" min="0" max="200000" inputMode="numeric" placeholder="Sin registrar" value={steps} onChange={event => setSteps(event.target.value)} /></label><button className="secondary" disabled={saving}>Guardar pasos</button></form>
    {message && <p className="success" role="status">{message}</p>}{error && <p className="error" role="alert">{error}</p>}
  </section>;
}
