import {fruitProgress} from './fruit.js';
import {setFruitConsumed} from './nutrition.js';
export default function FruitCheck({data,date,change,saving}){
  const {count,target,own}=fruitProgress(data,date),done=target>0&&count>=target;
  if(!data.foods.some(food=>food.id==='apple'))return <p className="field-note">Agrega la manzana a tu base mediante un respaldo para usar Fruta del día.</p>;
  return <div className="daily-fruit"><label className="check-label"><input aria-label="Fruta del día" type="checkbox" checked={done} disabled={saving||target===0||done&&!own} onChange={event=>{const checked=event.target.checked;change(state=>setFruitConsumed(state,date,checked));}}/><span>Fruta del día<small>{count} / {target} manzanas · fruta, fuera del presupuesto de snacks.</small></span></label><p className="field-note">{done&&!own?'Ya registrada en una comida. Edita ese consumo para ajustar la cantidad.':target===0?'Sin fruta prevista. Puedes registrar manzana desde la base de alimentos.':'Marcar añade solo las manzanas que faltan. Si marcas después la comida del plan, evita duplicarlas.'}</p></div>;
}
