/* =========================================================
   app.js — Clinifying: Sistema de Triagem Assistida por IA
   
   CONTRATO (relatorio-interacao-agentes.md v1.0):
   
   POST /api/triagem
     Request:  { nome, idade, genero, motivoPrincipal,
                 numeroComorbidades, historicoInternacoes }
     Response 201: { id, nome, prioridade, timestamp }
     Response 400: { timestamp, status, errors: { campo: msg } }
   
   GET /api/triagem
     Response 200: [{ id, nome, idade, genero, motivoPrincipal,
                      numeroComorbidades, historicoInternacoes,
                      prioridade, timestamp }]
     Ordenação: URGENTE → ALTA → MEDIA → BAIXA, mesmo nível → mais antigo primeiro
   
   prioridade retornada em MAIÚSCULAS: URGENTE | ALTA | MEDIA | BAIXA
   Cores: URGENTE=#dc3545(branco) ALTA=#fd7e14(branco)
          MEDIA=#ffc107(preto)    BAIXA=#28a745(branco)
   ========================================================= */

/* ── CONSTANTE: URL base da API (relativa — mesmo origin, sem CORS) ── */
const API_BASE = '/api/triagem';

/* ── ESTILOS DO RESULTADO por prioridade (maiúsculas conforme API) ── */
const PRIORIDADE_STYLE = {
  URGENTE: { bg: '#FCEBEB', border: '#F7C1C1', checkBg: '#dc3545', labelColor: '#A32D2D', nomeColor: '#A32D2D' },
  ALTA:    { bg: '#FAEEDA', border: '#FAC775', checkBg: '#fd7e14', labelColor: '#633806', nomeColor: '#633806' },
  MEDIA:   { bg: '#FFF8E1', border: '#ffc107', checkBg: '#a07800', labelColor: '#856404', nomeColor: '#856404' },
  BAIXA:   { bg: '#EAF3DE', border: '#C0DD97', checkBg: '#28a745', labelColor: '#27500A', nomeColor: '#27500A' },
};

/* ── ESTADO LOCAL (cache da fila para exibição offline) ── */
let fila = [];

/* =========================================================
   RELÓGIO — atualiza a cada segundo
   ========================================================= */
function atualizarRelogio() {
  const n = new Date();
  document.getElementById('clock').textContent =
    pad2(n.getHours()) + ':' + pad2(n.getMinutes()) + ':' + pad2(n.getSeconds());
}
setInterval(atualizarRelogio, 1000);
atualizarRelogio();

/* =========================================================
   VALIDAÇÃO DO FORMULÁRIO
   Retorna true se tudo ok, false se há erros.
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
   REGISTRAR TRIAGEM
   Chama POST /api/triagem com o payload exato do contrato.
   Em caso de erro de rede, exibe mensagem ao usuário.
   ========================================================= */
async function registrar() {
  if (!validar()) return;

  /* Lê os valores do formulário */
  const nome   = document.getElementById('f-nome').value.trim();
  const idade  = parseInt(document.getElementById('f-idade').value) || 0;
  const genero = document.getElementById('f-genero').value || 'O';
  const motivo = document.getElementById('f-motivo').value.trim();
  const comorb = parseInt(document.getElementById('f-comorb').value) || 0;
  const intern = parseInt(document.getElementById('f-intern').value) || 0;

  setLoading(true);

  /* Payload exato definido no relatorio-interacao-agentes.md */
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

    if (resp.status === 400) {
      /* Trata erros de validação do backend (Bean Validation) */
      const errData = await resp.json();
      tratarErro400(errData);
      return;
    }

    if (!resp.ok) {
      /* HTTP 500 ou outros erros */
      mostrarErroGenerico();
      return;
    }

    /* HTTP 201 — sucesso
       Response: { id, nome, prioridade, timestamp }
       prioridade em MAIÚSCULAS conforme contrato */
    const data = await resp.json();

    mostrarResultado(data.prioridade, data.nome);
    limparFormulario();
    showToast('Triagem registrada com sucesso!');

    /* Recarrega a fila completa do backend após cada registro */
    await carregarFila();

  } catch (err) {
    /* Sem resposta do servidor */
    mostrarErroServidor();
    console.error('Erro ao conectar com o backend:', err.message);
  } finally {
    setLoading(false);
  }
}

/* =========================================================
   CARREGAR FILA
   Chama GET /api/triagem e renderiza a tabela.
   Response: array de objetos com todos os campos do contrato.
   ========================================================= */
async function carregarFila() {
  try {
    const resp = await fetch(API_BASE);

    if (!resp.ok) return;

    const lista = await resp.json();

    /* Enriquece cada item com hora formatada (HH:MM) a partir do timestamp ISO */
    fila = lista.map(p => ({
      ...p,
      hora: formatarHora(p.timestamp)
    }));

    renderFila();

  } catch (_) {
    /* Mantém estado local em caso de falha de rede */
  }
}

/* =========================================================
   RENDERIZAR FILA NO DOM
   Usa os campos exatos do contrato GET:
   id, nome, idade, genero, motivoPrincipal,
   numeroComorbidades, historicoInternacoes, prioridade, timestamp
   ========================================================= */
function renderFila() {
  /* Contadores por prioridade */
  const cnt = { URGENTE: 0, ALTA: 0, MEDIA: 0, BAIXA: 0 };
  fila.forEach(p => {
    if (cnt[p.prioridade] !== undefined) cnt[p.prioridade]++;
  });

  document.getElementById('cnt-urgente').textContent = cnt.URGENTE;
  document.getElementById('cnt-alta').textContent    = cnt.ALTA;
  document.getElementById('cnt-media').textContent   = cnt.MEDIA;
  document.getElementById('cnt-baixa').textContent   = cnt.BAIXA;

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
    /* Trunca motivo longo para caber na célula */
    const motivo = (p.motivoPrincipal || '').length > 44
      ? p.motivoPrincipal.slice(0, 44) + '…'
      : (p.motivoPrincipal || '—');

    /* Badge usa classe .badge-{PRIORIDADE} — maiúsculas conforme API */
    return `
      <tr>
        <td>
          <span class="pos-number ${i === 0 ? 'pos-1' : ''}">${i + 1}</span>
        </td>
        <td class="nome-cell">${escHtml(p.nome || '—')}</td>
        <td>${p.idade ?? '—'}</td>
        <td class="motivo-cell">${escHtml(motivo)}</td>
        <td>
          <span class="badge badge-${p.prioridade}">
            ${p.prioridade}
          </span>
        </td>
        <td class="hora-cell">${p.hora || '--:--'}</td>
      </tr>`;
  }).join('');
}

/* =========================================================
   MOSTRAR RESULTADO DA CLASSIFICAÇÃO
   Usa a prioridade retornada pelo POST (maiúsculas).
   ========================================================= */
function mostrarResultado(prioridade, nome) {
  const s   = PRIORIDADE_STYLE[prioridade] || PRIORIDADE_STYLE.BAIXA;
  const box = document.getElementById('resultado');
  const chk = document.getElementById('resultado-check');

  box.style.background = s.bg;
  box.style.border     = '0.5px solid ' + s.border;
  box.style.display    = 'flex';

  chk.style.background = s.checkBg;

  document.getElementById('resultado-label').style.color = s.labelColor;
  document.getElementById('resultado-label').textContent = 'Prioridade classificada';

  document.getElementById('resultado-nome').style.color = s.nomeColor;
  document.getElementById('resultado-nome').textContent = prioridade + ' — ' + (nome || '');
}

/* =========================================================
   TRATAMENTO DE ERROS HTTP
   ========================================================= */

/* HTTP 400 — erros de validação do Bean Validation */
function tratarErro400(errData) {
  if (errData.errors) {
    /* Mapeia erros de campo para os inputs correspondentes */
    const mapa = {
      nome:                 ['f-nome',   'err-nome'],
      motivoPrincipal:      ['f-motivo', 'err-motivo'],
      idade:                ['f-idade',  'err-idade'],
    };
    Object.entries(errData.errors).forEach(([campo, msg]) => {
      if (mapa[campo]) {
        const [inputId, errId] = mapa[campo];
        setError(inputId, errId, true, msg);
      }
    });
  } else {
    showToast('Dados inválidos. Verifique o formulário.');
  }
}

/* HTTP 500 — erro interno do servidor */
function mostrarErroGenerico() {
  showToast('Erro interno. Tente novamente.');
}

/* Sem resposta — servidor indisponível */
function mostrarErroServidor() {
  showToast('Servidor indisponível. Verifique se o Spring Boot está rodando.');
}

/* =========================================================
   LIMPAR FORMULÁRIO após registro bem-sucedido
   ========================================================= */
function limparFormulario() {
  ['f-nome', 'f-motivo'].forEach(id => {
    document.getElementById(id).value = '';
  });
  ['f-idade', 'f-comorb', 'f-intern'].forEach(id => {
    document.getElementById(id).value = '0';
  });
  document.getElementById('f-genero').selectedIndex = 0;

  /* Remove classes de erro */
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
  toastTimer = setTimeout(() => t.classList.remove('show'), 3500);
}

/* =========================================================
   UTILITÁRIOS
   ========================================================= */

/* Formata "2025-05-16T10:30:00" → "10:30" */
function formatarHora(timestamp) {
  if (!timestamp) return '--:--';
  return timestamp.length >= 16 ? timestamp.substring(11, 16) : '--:--';
}

/* Garante dois dígitos: 9 → "09" */
function pad2(v) {
  return String(v).padStart(2, '0');
}

/* Escapa caracteres HTML para evitar XSS */
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* =========================================================
   INICIALIZAÇÃO — carrega a fila ao abrir a página
   ========================================================= */
carregarFila();
