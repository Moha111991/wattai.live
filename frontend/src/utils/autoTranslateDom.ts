type TranslationMap = Record<string, string>;

const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA']);
const TRANSATABLE_ATTRIBUTES = ['title', 'aria-label', 'placeholder'];

let translationMap: TranslationMap = {};
let observer: MutationObserver | null = null;

// Tracks the CURRENT German original for each text node so DE-restore is always correct.
const originalTextNodes = new Map<Text, string>();
const originalAttributes = new Map<Element, Map<string, string>>();

// Fast O(1) lookup: set of all normalized English translation values.
// Used to distinguish "React just wrote new German content" from "we just wrote English content".
let englishValueSet: Set<string> = new Set();

const normalize = (value: string): string => value.replace(/\s+/g, ' ').trim();

const withOriginalSpacing = (original: string, translated: string): string => {
  const leading = original.match(/^\s*/)?.[0] ?? '';
  const trailing = original.match(/\s*$/)?.[0] ?? '';
  return `${leading}${translated}${trailing}`;
};

const replaceKnownGermanText = (value: string): string => {
  const normalized = normalize(value);
  if (!normalized) {
    return value;
  }

  const directTranslation = translationMap[normalized];
  if (directTranslation) {
    return withOriginalSpacing(value, directTranslation);
  }

  let updated = value;
  for (const [german, english] of Object.entries(translationMap)) {
    if (!german || german === english || !updated.includes(german)) {
      continue;
    }
    updated = updated.split(german).join(english);
  }
  return updated;
};

const shouldSkipElement = (element: Element | null): boolean =>
  !element || SKIP_TAGS.has(element.tagName) || element.closest('[data-no-auto-translate="true"]') !== null;

const translateTextNode = (textNode: Text) => {
  const parentElement = textNode.parentElement;
  if (shouldSkipElement(parentElement)) {
    return;
  }

  if (!originalTextNodes.has(textNode)) {
    originalTextNodes.set(textNode, textNode.textContent ?? '');
  }

  const currentValue = textNode.textContent ?? '';
  const translatedValue = replaceKnownGermanText(currentValue);
  if (translatedValue !== currentValue) {
    textNode.textContent = translatedValue;
  }
};

const translateElementAttributes = (element: Element) => {
  if (shouldSkipElement(element)) {
    return;
  }

  for (const attribute of TRANSATABLE_ATTRIBUTES) {
    const value = element.getAttribute(attribute);
    if (!value) {
      continue;
    }

    let savedAttributes = originalAttributes.get(element);
    if (!savedAttributes) {
      savedAttributes = new Map<string, string>();
      originalAttributes.set(element, savedAttributes);
    }
    if (!savedAttributes.has(attribute)) {
      savedAttributes.set(attribute, value);
    }

    const translatedValue = replaceKnownGermanText(value);
    if (translatedValue !== value) {
      element.setAttribute(attribute, translatedValue);
    }
  }
};

const translateNodeTree = (node: Node) => {
  if (node.nodeType === Node.TEXT_NODE) {
    translateTextNode(node as Text);
    return;
  }

  if (!(node instanceof Element) || shouldSkipElement(node)) {
    return;
  }

  translateElementAttributes(node);

  const walker = document.createTreeWalker(node, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
  let current: Node | null = walker.currentNode;
  while (current) {
    if (current.nodeType === Node.TEXT_NODE) {
      translateTextNode(current as Text);
    } else if (current instanceof Element) {
      translateElementAttributes(current);
    }
    current = walker.nextNode();
  }
};

const restoreOriginalGermanContent = () => {
  for (const [textNode, original] of originalTextNodes.entries()) {
    if (textNode.isConnected) {
      textNode.textContent = original;
    }
  }

  for (const [element, attributes] of originalAttributes.entries()) {
    if (!element.isConnected) {
      continue;
    }
    for (const [attribute, original] of attributes.entries()) {
      element.setAttribute(attribute, original);
    }
  }
};

const handleMutations = (mutations: MutationRecord[]) => {
  for (const mutation of mutations) {
    if (mutation.type === 'characterData') {
      if (mutation.target.nodeType === Node.TEXT_NODE) {
        const textNode = mutation.target as Text;
        const currentValue = textNode.textContent ?? '';
        const normalizedCurrent = normalize(currentValue);

        // If the new content is NOT an English translation value, it is new German content
        // written by React. Update the stored original so DE-restore is always fresh and correct.
        if (normalizedCurrent && !englishValueSet.has(normalizedCurrent)) {
          originalTextNodes.set(textNode, currentValue);
        }

        translateTextNode(textNode);
      }
      continue;
    }

    if (mutation.type === 'attributes' && mutation.target instanceof Element) {
      translateElementAttributes(mutation.target);
      continue;
    }

    for (const node of mutation.addedNodes) {
      translateNodeTree(node);
    }
  }
};

export const startDomAutoTranslation = (map: TranslationMap) => {
  if (typeof document === 'undefined') {
    return;
  }

  translationMap = map;
  // Build a Set of all normalized English values for O(1) "is this already English?" checks.
  englishValueSet = new Set(Object.values(map).map(normalize));

  translateNodeTree(document.body);

  observer?.disconnect();
  observer = new MutationObserver(handleMutations);
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: TRANSATABLE_ATTRIBUTES,
  });
};

export const stopDomAutoTranslation = () => {
  observer?.disconnect();
  observer = null;
  restoreOriginalGermanContent();
};
