// Follow the compact UI explicitly; no automatic expansion in the shared fixture.
export const activeExercise=page=>page.locator('.session-list .exercise-card.expanded');
export async function quickTab(page,name){await activeExercise(page).getByRole('tab',{name:new RegExp(`^${name}`)}).click();}
export async function quickDetails(page,selector){
  const details=activeExercise(page).locator(selector);
  if(!await details.evaluate(element=>element.open))await details.locator(':scope > summary').click();
}
