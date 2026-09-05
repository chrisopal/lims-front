import assert from 'node:assert/strict';

/** Drive visible Element Plus controls, retaining normal pointer actionability.
 * The native checkbox is intentionally visually hidden by Element Plus.
 * Each select list is resolved by aria-controls, not by a global text match
 * that can collide with the previous dropdown during its exit animation.
 */
export async function chooseOption(page, select, label) {
  const control = select.locator('input[role="combobox"]');
  const listId = await control.getAttribute('aria-controls');
  assert(listId, 'Select must expose its associated listbox');
  await select.locator('.el-select__wrapper').click();
  await page.locator(`[id="${listId}"]`).getByRole('option', {name:label, exact:true}).click();
}
export async function setCheckbox(label, checked) {
  const input = label.locator('input[type="checkbox"]');
  if (await input.isChecked() !== checked) await label.click();
  assert.equal(await input.isChecked(), checked, 'Visible checkbox interaction did not change native checked state');
}
