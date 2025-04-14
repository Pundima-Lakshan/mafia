export async function includeHTML(id: string, html: string) {
  try {
    const el = document.getElementById(id);
    if (el) {
      el.innerHTML = html;
    } else {
      throw `Element not found for id ${id}`;
    }
  } catch (err) {
    console.error(`Error setting element:`, err);
  }
}

export function getHTMLElementById<T extends HTMLElement>(
  id: string,
  type: { new (): T },
) {
  const el = document.getElementById(id);
  if (!el || !(el instanceof type)) {
    throw `Element not found by id ${id}`;
  }
  return el;
}
