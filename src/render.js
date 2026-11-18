function nodeKey(node) {
  if (node.nodeType !== 1) return null;
  if (node.hasAttribute('data-key')) return node.getAttribute('data-key');
  if (node.id) return `id:${node.id}`;
  if (node.dataset.uid) return `instance:${node.dataset.side || ''}:${node.dataset.uid}`;
  if (node.dataset.action) return `action:${node.dataset.action}:${node.dataset.value || ''}:${node.dataset.screen || ''}:${node.dataset.card || ''}`;
  return null;
}

function sameType(current, next) {
  return current.nodeType === next.nodeType && current.nodeName === next.nodeName && current.namespaceURI === next.namespaceURI;
}

function patchNode(current, next) {
  if (current.nodeType !== 1) {
    if (current.nodeValue !== next.nodeValue) current.nodeValue = next.nodeValue;
    return;
  }
  for (const attribute of [...current.attributes]) {
    if (!next.hasAttribute(attribute.name)) current.removeAttribute(attribute.name);
  }
  for (const attribute of next.attributes) {
    if (current.getAttribute(attribute.name) !== attribute.value) current.setAttribute(attribute.name, attribute.value);
  }
  if (current.localName === 'input' && current.value !== next.value) current.value = next.value;
  patchChildren(current, next);
}

function patchChildren(parent, nextParent) {
  const previous = [...parent.childNodes];
  const incoming = [...nextParent.childNodes];
  const incomingKeys = new Set(incoming.map(nodeKey).filter(key => key !== null));
  const keyed = new Map(previous.map(node => [nodeKey(node), node]).filter(([key]) => key !== null));
  const used = new Set();
  // 先移除消耗掉的卡牌，剩余卡牌无需移动即可保持焦点和滚动锚点。
  for (const node of previous) {
    const key = nodeKey(node);
    if (key !== null && !incomingKeys.has(key)) node.remove();
  }
  let cursor = parent.firstChild;
  for (const next of incoming) {
    const key = nodeKey(next);
    let current = key === null
      ? previous.find(node => node.parentNode === parent && !used.has(node) && nodeKey(node) === null && sameType(node, next))
      : keyed.get(key);
    if (current && !sameType(current, next)) current = null;
    if (current) {
      if (current !== cursor) parent.insertBefore(current, cursor);
      patchNode(current, next);
    } else {
      current = next.cloneNode(true);
      parent.insertBefore(current, cursor);
    }
    used.add(current);
    cursor = current.nextSibling;
  }
  for (const node of previous) {
    if (!used.has(node) && node.parentNode === parent) node.remove();
  }
}

export function renderMarkup(parent, markup) {
  const template = document.createElement('template');
  template.innerHTML = markup;
  patchChildren(parent, template.content);
}
