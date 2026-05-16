/* =========================================================
   app.js — Clinifying: Sistema de Triagem Assistida por IA
   Responsabilidade: comunicação com a API e manipulação do DOM
   ========================================================= */

/* ── CONSTANTES ── */
const API_BASE = '/api/triagem';

const PRIORIDADE_ORDEM = { urgente: 0, alta: 1, media: 2, baixa: 3 };

const PRIORIDADE_STYLE = {
  urgente: { bg: '#FCEBEB', border: '#F7C1C1', checkBg: '#F7C1C1', textColor: '#A32D2D' },
  alta:    { bg: '#FAEEDA', border: '#FAC775', checkBg: '#FAC775', textColor: '#633806' },
  media:   { bg: '#E6F1FB', border: '#B5D4F4', checkBg: '#B5D4F4', textColor: '#0C447C' },
  baixa:   { bg: '#EAF3DE', border: '#C0DD97', checkBg: '#C0DD97', textColor: '#27500A' },
};

/* Palavras-chave críticas — espelha exatamente a lógica do TriagemService.java */
const PALAVRAS_CRITICAS = [
  'dor no peito', 'falta de ar', 'desmaio', 'avc', 'convulsão',
  'infarto', 'parada', 'hemorragia', 'inconsciente', 'sangramento',
  'paralisia', 'dificuldade para respirar', 'overdose'
];

/* ── ESTADO LOCAL ── */
let fila = [];
let nextId = 1;

/* =========================================================
   RELÓGIO
   ========================================================= */
function atualizarRelogio() {
  const n = new Date();
  document.getElementById('clock').textContent =
    pad2(n.getHours()) + ':' + pad2(n.getMinutes()) + ':' + pad2(n.getSeconds());
}
setInterval(atualizarRelogio, 1000);
atualizarRelogio();

/* =========================================================
   CLASSIFICAÇÃO LOCAL
   Espelha a lógica do TriagemService.java.
   Usada apenas como fallback se o backend estiver offline.
   A classificação oficial sempre vem da resposta da API.
   ========================================================= */
function classificarLocal(idade, comorb, intern, motivo) {
  const m = motivo.toLowerCase();
  const ehCritico = PALAVRAS_CRITICAS.some(p => m.includes(p));

  if (ehCritico || (idade >= 70 && comorb >= 2)) return 'urgente';
  if (comorb >= 3 || intern >= 2 || (idade >= 60 && comorb >= 1)) return 'alta';
  if (comorb >= 1 || intern >= 1 || idade >= 60) return 'media';
  return 'baixa';
}

/* =========================================================
   VALIDAÇÃO DO FORMULÁRIO
   ========================================================= */
function validar() {
  const nome   = document.getElementById('f-nome').value.trim();
  const motivo = document.getElementById('f-motivo').value.trim();
  const idade  = parseInt(document.getElementById('f-idade').value);

  setError('f-nome',   'err-nome',   !nome,                     'Nome é obrigatório');
  setError('f-motivo', 'err-motivo', !motivo,                   'Motivo é obrigatório');
  setError('f-idade',  'err-idade',  isNaN(idade) || idade < 0, 'Informe uma idade válida');

  return nome && motivo && !isNaN(idade) && idade >= 0;
}

function setError(inputId, errId, hasError, msg) {
  const input = document.getElementById(inputId);
  const err   = document.getElementById(errId);

  if (hasError) {
    input.classList.add('error');
    err.textContent = msg;
    err.classList.add('visible');
  } else {
    input.classList.remove('error');
    err.classList.remove('visible');
  }
}

/* =========================================================
   REGISTRAR TRIAGEM — chama POST /api/triagem
   ========================================================= */
async function registrar() {
  if (!validar()) return;

  const nome   = document.getElementById('f-nome').value.trim();
  const idade  = parseInt(document.getElementById('f-idade').value) || 0;
  const genero = document.getElementById('f-genero').value || 'O';
  const motivo = document.getElementById('f-motivo').value.trim();
  const comorb = parseInt(document.getElementById('f-comorb').value) || 0;
  const intern = parseInt(document.getElementById('f-intern').value) || 0;

  setLoading(true);

  const payload = {
    nome:                 nome,
    idade:                idade,
    genero:               genero,
    motivoPrincipal:      motivo,
    numeroComorbidades:   comorb,
    historicoInternacoes: intern
  };

  try {
    const resp = await fetch(API_BASE, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload)
    });

    if (!resp.ok) throw new Error('Erro na API: ' + resp.status);

    const data = await resp.json();

    adicionarNaFilaLocal(data, nome, idade, motivo);
    mostrarResultado(data.prioridade, nome);
    limparFormulario();
    showToast('Triagem registrada com sucesso!');

    /* Sincroniza a fila completa com o backend */
    await carregarFila();

  } catch (err) {
    /* Fallback offline: classifica localmente sem depender do backend */
    console.warn('API indisponível — usando classificação local.', err.message);

    const prioridade = classificarLocal(idade, comorb, intern, motivo);
    const agora      = new Date();
    const hora       = pad2(agora.getHours()) + ':' + pad2(agora.getMinutes());

    fila.push({
      id:                   nextId++,
      nome,
      idade,
      genero,
      motivoPrincipal:      motivo,
      numeroComorbidades:   comorb,
      historicoInternacoes: intern,
      prioridade,
      timestamp:            agora.toISOString(),
      hora
    });

    ordenarFila();
    mostrarResultado(prioridade, nome);
    renderFila();
    limparFormulario();
    showToast('Triagem registrada (modo offline)');

  } finally {
    setLoading(false);
  }
}

/* =========================================================
   CARREGAR FILA — chama GET /api/triagem
   ========================================================= */
async function carregarFila() {
  try {
    const resp = await fetch(API_BASE);
    if (!resp.ok) return;

    const lista = await resp.json();

    fila = lista.map(p => ({
      ...p,
      hora: p.timestamp ? p.timestamp.substring(11, 16) : '--:--'
    }));

    renderFila();
  } catch (_) {
    /* Mantém o estado local em caso de falha */
  }
}

/* =========================================================
   ADICIONAR NA FILA LOCAL (após POST bem-sucedido)
   ========================================================= */
function adicionarNaFilaLocal(data, nome, idade, motivo) {
  const hora = data.timestamp ? data.timestamp.substring(11, 16) : '--:--';

  /* Remove duplicata se já existir (por id) */
  fila = fila.filter(p => p.id !== data.id);

  fila.push({ ...data, nome, idade, motivoPrincipal: motivo, hora });
  ordenarFila();
}

/* =========================================================
   ORDENAÇÃO DA FILA
   Critério 1: prioridade (urgente → alta → media → baixa)
   Critério 2: timestamp de chegada (FIFO dentro da mesma prioridade)
   ========================================================= */
function ordenarFila() {
  fila.sort((a, b) =>
    PRIORIDADE_ORDEM[a.prioridade] - PRIORIDADE_ORDEM[b.prioridade] ||
    new Date(a.timestamp) - new Date(b.timestamp)
  );
}

/* =========================================================
   RENDERIZAR FILA NO DOM
   ========================================================= */
function renderFila() {
  /* Atualiza contadores */
  const cnt = { urgente: 0, alta: 0, media: 0, baixa: 0 };
  fila.forEach(p => { if (cnt[p.prioridade] !== undefined) cnt[p.prioridade]++; });

  document.getElementById('cnt-urgente').textContent = cnt.urgente;
  document.getElementById('cnt-alta').textContent    = cnt.alta;
  document.getElementById('cnt-media').textContent   = cnt.media;
  document.getElementById('cnt-baixa').textContent   = cnt.baixa;

  const tbody = document.getElementById('fila-body');

  if (fila.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-state">
          <i class="ti ti-inbox" aria-hidden="true"></i>
          Nenhum atendimento registrado
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = fila.map((p, i) => {
    const motivo = (p.motivoPrincipal || '').length > 42
      ? (p.motivoPrincipal || '').slice(0, 42) + '…'
      : (p.motivoPrincipal || '');

    return `
      <tr>
        <td><span class="pos-number ${i === 0 ? 'pos-1' : ''}">${i + 1}</span></td>
        <td class="nome-cell">${escHtml(p.nome || '—')}</td>
        <td>${p.idade ?? '—'}</td>
        <td class="motivo-cell">${escHtml(motivo)}</td>
        <td>
          <span class="badge badge-${p.prioridade}">
            <span class="badge-dot"></span>
            ${p.prioridade}
          </span>
        </td>
        <td class="hora-cell">${p.hora || '--:--'}</td>
      </tr>`;
  }).join('');
}

/* =========================================================
   MOSTRAR RESULTADO DA CLASSIFICAÇÃO
   ========================================================= */
function mostrarResultado(prioridade, nome) {
  const s   = PRIORIDADE_STYLE[prioridade] || PRIORIDADE_STYLE.baixa;
  const box = document.getElementById('resultado');
  const chk = document.getElementById('resultado-check');

  box.style.background = s.bg;
  box.style.border     = '0.5px solid ' + s.border;
  box.style.display    = 'flex';

  chk.style.background = s.checkBg;
  chk.style.color      = s.textColor;

  document.getElementById('resultado-label').style.color = s.textColor;
  document.getElementById('resultado-label').textContent = 'Prioridade classificada';
  document.getElementById('resultado-nome').style.color  = s.textColor;
  document.getElementById('resultado-nome').textContent  = prioridade.toUpperCase() + ' — ' + nome;
}

/* =========================================================
   LIMPAR FORMULÁRIO
   ========================================================= */
function limparFormulario() {
  ['f-nome', 'f-motivo'].forEach(id => {
    document.getElementById(id).value = '';
  });
  ['f-idade', 'f-comorb', 'f-intern'].forEach(id => {
    document.getElementById(id).value = '0';
  });
  document.getElementById('f-genero').selectedIndex = 0;

  ['f-nome', 'f-motivo', 'f-idade'].forEach(id => {
    document.getElementById(id).classList.remove('error');
  });
  ['err-nome', 'err-motivo', 'err-idade'].forEach(id => {
    document.getElementById(id).classList.remove('visible');
  });
}

/* =========================================================
   ESTADO DE LOADING DO BOTÃO
   ========================================================= */
function setLoading(on) {
  const btn     = document.getElementById('btn-submit');
  const spinner = document.getElementById('spinner');
  const icon    = document.getElementById('btn-icon');
  const label   = document.getElementById('btn-label');

  btn.disabled          = on;
  spinner.style.display = on ? 'block' : 'none';
  icon.style.display    = on ? 'none'  : 'inline';
  label.textContent     = on ? 'Registrando...' : 'Registrar Triagem';
}

/* =========================================================
   TOAST DE NOTIFICAÇÃO
   ========================================================= */
let toastTimer;

function showToast(msg) {
  const t = document.getElementById('toast');
  document.getElementById('toast-msg').textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3000);
}

/* =========================================================
   UTILITÁRIOS
   ========================================================= */
function pad2(v) {
  return String(v).padStart(2, '0');
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* =========================================================
   INICIALIZAÇÃO
   ========================================================= */
carregarFila();
