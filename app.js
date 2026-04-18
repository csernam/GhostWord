const STORAGE_KEY = 'ghostwords-state';
const reader = document.getElementById('reader');
const fileInput = document.getElementById('fileInput');
const dropZone = document.getElementById('dropZone');
const fileInfo = document.getElementById('fileInfo');
const ghostSlider = document.getElementById('ghostSlider');
const ghostValue = document.getElementById('ghostValue');
const revealBlockButton = document.getElementById('revealBlock');
const revealParagraphButton = document.getElementById('revealParagraph');
const revealAllButton = document.getElementById('revealAll');
const themeToggle = document.getElementById('themeToggle');
const modeExamToggle = document.getElementById('modeExamToggle');
const tooltip = document.getElementById('tooltip');
const loadDemoButton = document.getElementById('loadDemoButton');
const readerFooter = document.getElementById('readerFooter');
const currentBlockLabel = document.getElementById('currentBlockLabel');
const floatingRevealBlock = document.getElementById('floatingRevealBlock');
const floatingRevealParagraph = document.getElementById('floatingRevealParagraph');
const floatingRevealAll = document.getElementById('floatingRevealAll');
let holdTimeout = null;
let holdTargetIndex = null;
const tempRevealBlocks = new Set();
const tempRevealTimeouts = new Map();

const STOPWORDS = new Set([
  'de','la','el','que','y','a','en','un','ser','se','no','haber','por','con','para','como','estar','tener','le','lo','todo','pero','más','sus','mi','sin','sobre','este','ya','entre','cuando','muy','solo','sí','o','u','al','del','las','los','nos','ni','su','mientras','antes','después','durante','contra','desde','hasta','tras','versus','via','el','ella','ellos','ellas','esto','esta','estos','estas','ese','esa','esos','esas','otro','otra','otros','otras','cada','él','ella','ello','ellos','ellas','estos','estas','era','eran','fue','fueron','será','serán','está','están','estaba','estaban','era','eran','tiene','tienen','tengo','tienes','tenía','tenían','más','menos','sobre','entre','hasta','desde','durante','contra','sin','para','por','ante','tras','donde','quien','quienes','cual','cuales','cuál','cuáles','porque','porqué','como','cómo','qué','qué','cuando','cuándo','donde','dónde','quien','quién','quienes','cuanto','cuánto','cuantos','cuántos'
]);

let state = {
  rawText: '',
  fileName: '',
  fileType: 'text',
  blocks: [],
  ghostPercent: 40,
  currentBlock: 0,
  revealedBlocks: new Set(),
  revealAll: false,
  modeExam: false,
  theme: 'light',
  scrollTop: 0,
};

function saveState() {
  const data = {
    rawText: state.rawText,
    fileName: state.fileName,
    fileType: state.fileType,
    ghostPercent: state.ghostPercent,
    currentBlock: state.currentBlock,
    revealedBlocks: Array.from(state.revealedBlocks),
    revealAll: state.revealAll,
    modeExam: state.modeExam,
    theme: state.theme,
    scrollTop: reader.scrollTop,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function restoreState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw);
    if (parsed.rawText) {
      state.rawText = parsed.rawText;
      state.fileName = parsed.fileName || 'Documento guardado';
      state.fileType = parsed.fileType || 'text';
      state.ghostPercent = parsed.ghostPercent ?? 40;
      state.currentBlock = parsed.currentBlock ?? 0;
      state.revealedBlocks = new Set(parsed.revealedBlocks || []);
      state.revealAll = parsed.revealAll || false;
      state.modeExam = parsed.modeExam || false;
      state.theme = parsed.theme || 'light';
      renderDocument(state.rawText, state.fileType);
    }
  } catch (error) {
    console.warn('No se pudo restaurar el estado:', error);
  }
}

function setTheme(theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  themeToggle.textContent = theme === 'dark' ? 'Modo claro' : 'Modo oscuro';
  state.theme = theme;
  saveState();
}

function updateControls() {
  ghostValue.textContent = `${state.ghostPercent}%`;
  ghostSlider.value = state.ghostPercent;
  modeExamToggle.textContent = state.modeExam ? 'Modo examen activado' : 'Modo examen';
  revealBlockButton.disabled = state.modeExam;
  revealParagraphButton.disabled = state.modeExam;
  revealAllButton.disabled = state.modeExam;
  floatingRevealBlock.disabled = state.modeExam;
  floatingRevealParagraph.disabled = state.modeExam;
  floatingRevealAll.disabled = state.modeExam;
  revealAllButton.textContent = state.revealAll ? 'Ocultar todo' : 'Mostrar todo';
  floatingRevealAll.textContent = state.revealAll ? 'Ocultar todo' : 'Mostrar todo';
  fileInfo.textContent = state.fileName ? `${state.fileName} · ${state.fileType.toUpperCase()}` : 'Ningún documento cargado';
}

function setCurrentBlock(index) {
  const previous = reader.querySelector('.block.current');
  if (previous) previous.classList.remove('current');
  state.currentBlock = index;
  const next = reader.querySelector(`.block[data-index="${index}"]`);
  if (next) next.classList.add('current');
  currentBlockLabel.textContent = `${index + 1}`;
  readerFooter.classList.toggle('hidden', !state.blocks.length);
  saveState();
}

function normalizeText(text) {
  return text.replace(/\r\n/g, '\n').replace(/\t/g, ' ').trim();
}

function parseMarkdown(text) {
  return marked.parse(text);
}

function makePlainHtml(text) {
  const paragraphs = text.split(/\n{2,}/g).map(line => {
    const content = line
      .split(/\n/g)
      .map(chunk => `<span>${escapeHtml(chunk)}</span>`)
      .join('<br>');
    return `<p>${content}</p>`;
  });
  return paragraphs.join('');
}

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function createBlocksFromHtml(html) {
  const container = document.createElement('div');
  container.innerHTML = html;
  const blocks = [];
  const nodes = Array.from(container.children);
  nodes.forEach(node => {
    if (node.tagName === 'H1' || node.tagName === 'H2' || node.tagName === 'H3' || node.tagName === 'H4' || node.tagName === 'H5') {
      const clone = node.cloneNode(true);
      blocks.push({
        type: 'title',
        node: clone,
        preserve: node.tagName === 'H1',
        text: clone.textContent || '',
      });
      return;
    }
    if (node.tagName === 'P') {
      const clone = node.cloneNode(true);
      blocks.push({ type: 'paragraph', node: clone, text: clone.textContent || '' });
      return;
    }
    if (node.tagName === 'UL' || node.tagName === 'OL') {
      const listClone = node.cloneNode(true);
      const listChildren = Array.from(listClone.children).map(item => ({
        type: 'list-item',
        node: item,
        listType: node.tagName,
        text: item.textContent || '',
      }));
      blocks.push({ type: 'list', node: listClone, items: listChildren });
      return;
    }
    const clone = node.cloneNode(true);
    blocks.push({ type: 'paragraph', node: clone, text: clone.textContent || '' });
  });
  return blocks;
}

function splitTextToTokens(text) {
  const regex = /([\wÀ-ÖØ-öø-ÿ'-–—]+|[^\wÀ-ÖØ-öø-ÿ'-–—]+)/g;
  return text.match(regex) || [];
}

function isGhostCandidate(token) {
  const normalized = token.toLowerCase();
  return /^[\wÀ-ÖØ-öø-ÿ'-–—]+$/.test(token)
    && token.length > 2
    && !STOPWORDS.has(normalized);
}

function ghostTokens(tokens, percent, preserveTitle = false) {
  if (preserveTitle) return tokens.map(token => ({ value: token, hidden: false }));
  const words = tokens.map((token, index) => ({ token, index })).filter(item => /^[\wÀ-ÖØ-öø-ÿ'-–—]+$/.test(item.token));
  const candidateWords = words.filter(item => isGhostCandidate(item.token));
  const targetCount = Math.round(words.length * (percent / 100));

  if (targetCount === 0 || candidateWords.length === 0) {
    return tokens.map(token => ({ value: token, hidden: false, original: token }));
  }

  const hideIndices = new Set();
  const chosenWords = candidateWords.slice(0, Math.max(1, candidateWords.length));

  const actualCount = Math.min(targetCount, chosenWords.length);
  if (actualCount >= chosenWords.length) {
    chosenWords.forEach(item => hideIndices.add(item.index));
  } else {
    const spacing = chosenWords.length / actualCount;
    for (let i = 0; i < actualCount; i += 1) {
      const position = Math.min(chosenWords.length - 1, Math.floor(i * spacing + spacing / 2));
      hideIndices.add(chosenWords[position].index);
    }
  }

  return tokens.map((token, index) => {
    const isWord = /^[\wÀ-ÖØ-öø-ÿ'-–—]+$/.test(token);
    return { value: token, hidden: isWord && hideIndices.has(index), original: token };
  });
}

function renderGhostText(tokens) {
  return tokens
    .map(part => {
      if (!part.hidden) return escapeHtml(part.value);
      const width = Math.min(10, Math.max(1.6, part.original.length * 0.72));
      return `<span class="ghost-word" data-original="${escapeHtml(part.original)}" tabindex="0" style="width:${width.toFixed(1)}ch">👻</span>`;
    })
    .join('');
}

function renderDocument(rawText, fileType) {
  const normalized = normalizeText(rawText);
  state.rawText = normalized;
  state.fileType = fileType;
  state.revealedBlocks = new Set();
  state.revealAll = false;
  const html = fileType === 'md' ? parseMarkdown(normalized) : makePlainHtml(normalized);
  const parsedBlocks = createBlocksFromHtml(html);
  state.blocks = parsedBlocks;
  reader.innerHTML = '';
  parsedBlocks.forEach((block, index) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'block';
    wrapper.dataset.index = index;
    wrapper.addEventListener('click', () => setCurrentBlock(index));
    wrapper.addEventListener('pointerdown', event => {
      if (event.target.closest('.ghost-word')) return;
      startHoldToReveal(index, wrapper);
    });
    wrapper.addEventListener('pointerup', cancelHoldToReveal);
    wrapper.addEventListener('pointerleave', cancelHoldToReveal);
    wrapper.addEventListener('pointercancel', cancelHoldToReveal);
    if (block.type === 'list') {
      wrapper.appendChild(block.node);
      wrapper.dataset.type = 'list';
      wrapper.dataset.preserve = 'false';
    } else {
      wrapper.appendChild(block.node);
      wrapper.dataset.type = block.type;
      wrapper.dataset.preserve = block.preserve ? 'true' : 'false';
    }
    reader.appendChild(wrapper);
  });
  setCurrentBlock(Math.min(state.currentBlock, state.blocks.length - 1));
  reader.scrollTop = state.scrollTop || 0;
  updateGhosting();
  updateControls();
  saveState();
}

function updateGhosting() {
  const blocks = Array.from(reader.querySelectorAll('.block'));
  blocks.forEach(blockElement => {
    const index = Number(blockElement.dataset.index);
    const block = state.blocks[index];
    const preserve = blockElement.dataset.preserve === 'true';
    if (block.type === 'list') {
      const nestedItems = blockElement.querySelectorAll('li');
      block.items.forEach((itemData, itemIndex) => {
        const tokens = splitTextToTokens(itemData.text);
        const ghostData = ghostTokens(tokens, state.ghostPercent, false);
        nestedItems[itemIndex].innerHTML = renderGhostText(ghostData);
      });
      if (state.revealedBlocks.has(index) || tempRevealBlocks.has(index)) {
        revealBlockElements(blockElement);
      }
      return;
    }
    const tokens = splitTextToTokens(block.text);
    const ghostData = ghostTokens(tokens, state.ghostPercent, preserve);
    blockElement.innerHTML = renderGhostText(ghostData);
    if (state.revealedBlocks.has(index) || tempRevealBlocks.has(index)) {
      revealBlockElements(blockElement);
    }
  });
  if (state.revealAll) {
    revealEntireDocument();
  }
  attachGhostListeners();
}

function revealEntireDocument() {
  reader.querySelectorAll('.ghost-word').forEach(span => {
    span.classList.add('revealed');
    span.textContent = span.dataset.original || '👻';
  });
}

function hideAllGhosts() {
  updateGhosting();
}

function toggleBlockReveal(index) {
  const block = reader.querySelector(`.block[data-index="${index}"]`);
  if (!block) return;
  if (state.revealedBlocks.has(index)) {
    state.revealedBlocks.delete(index);
    updateGhosting();
  } else {
    revealBlock(index, false);
  }
  saveState();
}

function revealBlock(index, scroll = true) {
  const block = reader.querySelector(`.block[data-index="${index}"]`);
  if (!block) return;
  revealBlockElements(block);
  if (scroll) {
    block.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  state.revealedBlocks.add(index);
}

function revealParagraph(index) {
  if (state.modeExam) return;
  if (state.revealedBlocks.has(index)) return;
  revealBlockTemporarily(index);
}

function revealBlockTemporarily(index) {
  const block = reader.querySelector(`.block[data-index="${index}"]`);
  if (!block) return;
  revealBlockElements(block);
  tempRevealBlocks.add(index);
  if (tempRevealTimeouts.has(index)) {
    clearTimeout(tempRevealTimeouts.get(index));
  }
  const timeoutId = window.setTimeout(() => {
    tempRevealBlocks.delete(index);
    tempRevealTimeouts.delete(index);
    if (!state.revealedBlocks.has(index)) {
      updateGhosting();
    }
  }, 1500);
  tempRevealTimeouts.set(index, timeoutId);
}

function revealBlockElements(blockElement) {
  blockElement.querySelectorAll('.ghost-word').forEach(span => {
    span.classList.add('revealed');
    span.removeAttribute('style');
    span.textContent = span.dataset.original || '👻';
  });
}

function toggleRevealAll() {
  state.revealAll = !state.revealAll;
  if (state.revealAll) {
    revealEntireDocument();
  } else {
    updateGhosting();
  }
  updateControls();
  saveState();
}

function attachGhostListeners() {
  reader.querySelectorAll('.ghost-word').forEach(element => {
    element.addEventListener('pointerdown', handlePointerDown);
    element.addEventListener('pointerup', handlePointerUp);
    element.addEventListener('pointerleave', hideTooltip);
    element.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        showTooltip(element, event.clientX, event.clientY);
        setTimeout(hideTooltip, 800);
      }
    });
  });
}

function handlePointerDown(event) {
  if (state.modeExam) return;
  const target = event.currentTarget;
  showTooltip(target, event.clientX, event.clientY);
}

function handlePointerUp() {
  hideTooltip();
}

function startHoldToReveal(index, blockElement) {
  if (state.modeExam) return;
  cancelHoldToReveal();
  holdTargetIndex = index;
  holdTimeout = window.setTimeout(() => {
    toggleBlockReveal(index);
    blockElement.classList.add('current');
    holdTimeout = null;
  }, 520);
}

function cancelHoldToReveal() {
  if (holdTimeout) {
    window.clearTimeout(holdTimeout);
    holdTimeout = null;
    holdTargetIndex = null;
  }
}

function showTooltip(target, x, y) {
  const original = target.dataset.original || '';
  tooltip.textContent = original;
  tooltip.style.left = `${x + 10}px`;
  tooltip.style.top = `${y - 48}px`;
  tooltip.classList.add('visible');
  tooltip.setAttribute('aria-hidden', 'false');
}

function hideTooltip() {
  tooltip.classList.remove('visible');
  tooltip.setAttribute('aria-hidden', 'true');
}

async function readFile(file) {
  const extension = file.name.split('.').pop().toLowerCase();
  state.fileName = file.name;
  if (extension === 'pdf') {
    const arrayBuffer = await file.arrayBuffer();
    return parsePdfFile(arrayBuffer);
  }
  if (extension === 'docx') {
    const arrayBuffer = await file.arrayBuffer();
    return parseDocxFile(arrayBuffer);
  }
  const text = await file.text();
  return { content: text, type: extension === 'md' ? 'md' : 'text' };
}

async function parsePdfFile(buffer) {
  if (window.pdfjsLib) {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.12.313/pdf.worker.min.js';
  }
  const loadingTask = window.pdfjsLib.getDocument({ data: buffer });
  const pdf = await loadingTask.promise;
  let text = '';
  for (let i = 1; i <= pdf.numPages; i += 1) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map(item => item.str).join(' ') + '\n\n';
  }
  return { content: text.trim(), type: 'text' };
}

async function parseDocxFile(buffer) {
  const result = await window.mammoth.extractRawText({ arrayBuffer: buffer });
  return { content: result.value.trim(), type: 'text' };
}

function setDropZoneState(active) {
  dropZone.classList.toggle('dragover', active);
}

dropZone.addEventListener('click', () => fileInput.click());

async function loadDemo() {
  try {
    const demoUrl = 'https://raw.githubusercontent.com/csernam/GhostWord/master/Documents/constitucion.md';
    const response = await fetch(demoUrl);
    if (!response.ok) throw new Error('Demo not found');
    const content = await response.text();
    renderDocument(content, 'md');
    state.fileName = 'constitucion.md (DEMO)';
    updateControls();
    saveState();
  } catch (error) {
    console.warn('No se pudo cargar el demo:', error);
    alert('No se pudo cargar el demo. Verifica que tengas conexión a internet.');
  }
}

loadDemoButton.addEventListener('click', loadDemo);

async function handleFileSelection(file) {
  if (!file) return;
  const documentData = await readFile(file);
  renderDocument(documentData.content, documentData.type);
  updateControls();
  saveState();
}


fileInput.addEventListener('change', event => {
  const file = event.target.files?.[0];
  if (file) handleFileSelection(file);
});

dropZone.addEventListener('dragenter', event => {
  event.preventDefault();
  setDropZoneState(true);
});

dropZone.addEventListener('dragover', event => {
  event.preventDefault();
  setDropZoneState(true);
});

dropZone.addEventListener('dragleave', event => {
  event.preventDefault();
  setDropZoneState(false);
});

dropZone.addEventListener('drop', event => {
  event.preventDefault();
  setDropZoneState(false);
  const file = event.dataTransfer.files?.[0];
  if (file) handleFileSelection(file);
});

ghostSlider.addEventListener('input', event => {
  state.ghostPercent = Number(event.target.value);
  updateControls();
  if (!state.revealAll) updateGhosting();
  saveState();
});

revealBlockButton.addEventListener('click', () => toggleBlockReveal(state.currentBlock));
revealParagraphButton.addEventListener('click', () => revealParagraph(state.currentBlock));
revealAllButton.addEventListener('click', toggleRevealAll);

floatingRevealBlock.addEventListener('click', () => toggleBlockReveal(state.currentBlock));
floatingRevealParagraph.addEventListener('click', () => revealParagraph(state.currentBlock));
floatingRevealAll.addEventListener('click', toggleRevealAll);

themeToggle.addEventListener('click', () => setTheme(state.theme === 'dark' ? 'light' : 'dark'));
modeExamToggle.addEventListener('click', () => {
  state.modeExam = !state.modeExam;
  if (state.modeExam) {
    state.revealAll = false;
    updateGhosting();
  }
  updateControls();
  saveState();
});

window.addEventListener('beforeunload', saveState);
reader.addEventListener('scroll', () => {
  state.scrollTop = reader.scrollTop;
  saveState();
});

function init() {
  restoreState();
  setTheme(state.theme);
  updateControls();
  if (state.rawText && !state.blocks.length) {
    renderDocument(state.rawText, state.fileType);
  }
  readerFooter.classList.toggle('hidden', !state.rawText);
}

init();
