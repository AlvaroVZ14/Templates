const sections = [
  {
    title: 'Filosofía',
    summary: 'Pocas series. Buena técnica. Mucha intención.',
    content: <><p>Esta app se inspira en el Heavy Duty y en el enfoque Blood and Guts de Dorian Yates: priorizar la intensidad sobre acumular series.</p><p>La adaptación para un deportista natural combina pocas series exigentes con ejecución controlada y recuperación. Fallo técnico significa que no puedes completar otra repetición con buena técnica; no necesitas perder el control para llegar a él.</p></>,
  },
  {
    title: 'Tipos de serie',
    summary: 'Preparar y estimular cumplen funciones distintas.',
    content: <><p><strong>Previas:</strong> preparan músculo, articulaciones y mente para la carga. Se hacen lejos del fallo y se guardan aparte; no cuentan como volumen efectivo.</p><p><strong>Efectivas:</strong> concentran el trabajo intenso del ejercicio, normalmente al fallo técnico. Son las que la app cuenta como volumen. Durante una descarga se mantienen lejos del fallo.</p></>,
  },
  {
    title: 'Técnicas de intensidad',
    summary: 'Una a la vez, con moderación.',
    content: <><ul><li><strong>Drop set:</strong> tras la efectiva, baja el peso y continúa. La app sugiere reducir un 20% por caída, con el redondeo de tu equipo.</li><li><strong>Rest-pause:</strong> conserva la carga, descansa 15–20 segundos y haz una mini-serie al fallo técnico.</li><li><strong>Forzadas:</strong> un compañero ayuda a completar repeticiones cuando ya no puedes hacerlas por tu cuenta.</li><li><strong>Negativas:</strong> enfatizan la fase de bajada con control; pueden requerir ayuda para colocar la carga.</li></ul><p>Introduce una técnica a la vez. Forzadas y negativas están desactivadas por defecto: solo se usan si las activas, en uno o dos ejercicios por sesión como máximo. Las caídas y mini-series se registran por separado; no suman otra efectiva al volumen.</p></>,
  },
  {
    title: 'Descansos',
    summary: 'Recupera antes de volver a exigir.',
    content: <><p>Antes de una efectiva pesada, descansa más: por defecto, 3–4 minutos en compuestos y 2–3 en aislamientos. Entre previas, 1–2 minutos.</p><p>Los descansos cortos se reservan para encadenar técnicas: 15–20 segundos en rest-pause y 10–15 segundos para cambiar el peso en un drop set. Puedes editar los descansos por ejercicio.</p></>,
  },
  {
    title: 'Recuperación',
    summary: 'Descansar también forma parte del entrenamiento.',
    content: <><p>El entrenamiento aporta el estímulo; el descanso permite recuperarte y adaptarte. Sueño, comida suficiente para tu fase y días libres forman parte del método.</p><p>Consulta el tiempo desde el último estímulo y el aviso de menos de 48 horas en Hoy. Registra sueño, energía y fatiga en Diario para observar tu recuperación, sin intentar compensar cada día difícil con más trabajo.</p></>,
  },
  {
    title: 'Progresión',
    summary: 'Mejora con registros, no con prisas.',
    content: <><p>Cuando llegues al tope de tu rango de repeticiones al fallo técnico, revisa la sugerencia de subir la carga. Al confirmarla, se actualiza el peso de referencia que alimenta tus previas, drop set y rest-pause.</p><p>Revisa una semana de descarga cada 6–8 semanas, o antes si acumulas fatiga, poco sueño y rendimiento a la baja. En esta app conserva la carga y las previas, reduce las series al 50% y retira técnicas y fallo. La recomendación no la activa por ti.</p></>,
  },
  {
    title: 'Cómo leer esta app',
    summary: 'Mira tendencias; una semana no decide el plan.',
    content: <><ul className="method-signals"><li><strong>✓ Verde:</strong> el indicador cumple sus reglas. Mantén la continuidad.</li><li><strong>= Gris acero:</strong> observa con calma y revisa el motivo antes de ajustar.</li><li><strong>! Rojo:</strong> hay una condición concreta que conviene revisar; no es una orden de cambiar todo.</li><li><strong>= Sin evaluación:</strong> faltan datos. Continúa registrando.</li></ul><p>Progreso no evalúa con menos de cuatro semanas de datos para evitar reaccionar a variaciones cortas. Rendimiento necesita además un bloque anterior de cuatro semanas para comparar; solo marca rojo tras dos descensos consecutivos superiores al 2%. Un estancamiento de una a tres semanas no basta.</p><p>Cuerpo se interpreta según tu fase; Constancia y recuperación reúnen sesiones, sueño y tiempo desde la descarga. Abre «Cómo se calcula» en cada tarjeta para ver su regla. La revisión mensual del mes cerrado queda guardada en Historial.</p></>,
  },
];

export default function Method() {
  return <div className="method-page">
    <div className="page-heading"><div><p className="eyebrow">ENTIENDE EL PLAN, SIGUE TU RITMO</p><h1>El método<span className="accent">.</span></h1></div></div>
    <p className="page-intro">Una guía breve para entrenar con intención y dejar espacio para recuperar. Abre solo lo que quieras consultar.</p>
    <section className="method-sections" aria-label="Guía del método">
      {sections.map(({title,summary,content},index)=><details key={title} open={index===0} className="method-section"><summary><span className="method-index" aria-hidden="true">{String(index+1).padStart(2,'0')}</span><span><h2>{title}</h2><small>{summary}</small></span><span className="method-chevron" aria-hidden="true">⌄</span></summary><div className="method-content">{content}</div></details>)}
    </section>
  </div>;
}
