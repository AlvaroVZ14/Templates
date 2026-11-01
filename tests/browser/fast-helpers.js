import {expect} from '@playwright/test';
export const exerciseCard=(page,name)=>page.getByRole('article',{name,exact:true});
export async function editNumber(page,name,value,{row=1,field='Peso'}={}){
 const card=exerciseCard(page,name),label=`${field} de ${name}, serie ${row}`;
 await card.getByRole('button',{name:new RegExp(`^${label.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}:`)}).click();
 await card.getByRole('button',{name:'Teclado',exact:true}).click();await card.getByLabel(`Escribir ${label}`,{exact:true}).fill(String(value));await card.getByRole('button',{name:'Listo',exact:true}).click();
}
export async function confirmSet(page,name,row=1){
 await exerciseCard(page,name).getByRole('button',{name:`Confirmar ${name}, serie ${row}`,exact:true}).click();await expect(exerciseCard(page,name).getByRole('button',{name:`Guardada ${name}, serie ${row}`,exact:true})).toBeVisible();
}
export async function expectNumber(page,name,value,{row=1,field='Peso'}={}){
 const label=`${field} de ${name}, serie ${row}: ${Number(value).toLocaleString('es-CL',{maximumFractionDigits:2})}`;await expect(exerciseCard(page,name).getByRole('button',{name:label,exact:true})).toBeVisible();
}
