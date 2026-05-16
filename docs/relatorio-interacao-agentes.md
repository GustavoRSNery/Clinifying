# Relatório de Interação entre Agentes
**Projeto:** Sistema de Triagem Assistida por IA  
**Versão:** 1.0 | **Status:** Vigente  
**Regra:** Atualizar toda vez que o contrato de I/O entre agentes mudar.

---

## Agentes do projeto

| # | Agente | Ferramenta | Responsabilidade principal |
|---|--------|-----------|---------------------------|
| 1 | **Agente Backend** | GitHub Copilot / Cursor (Plan Mode) | API REST, lógica de prioridade, persistência H2, Swagger |
| 2 | **Agente Frontend** | GitHub Copilot / Cursor | Interface HTML/CSS/JS que consome a API |

---

## Contrato de I/O: Agente Backend → Agente Frontend

### O que o Backend produz

#### Endpoint 1 — Registrar Triagem

```
POST http://localhost:8080/api/triagem
Content-Type: application/json
```

**Request (enviado pelo Frontend):**
```json
{
  "nome": "João Silva",
  "idade": 67,
  "genero": "M",
  "motivoPrincipal": "dor no peito com falta de ar",
  "numeroComorbidades": 3,
  "historicoInternacoes": 2
}
```

**Response — Sucesso (HTTP 201 Created):**
```json
{
  "id": 1,
  "nome": "João Silva",
  "prioridade": "URGENTE",
  "timestamp": "2025-05-16T10:30:00"
}
```

**Response — Erro de validação (HTTP 400 Bad Request):**
```json
{
  "timestamp": "2025-05-16T10:30:00",
  "status": 400,
  "errors": {
    "nome": "não deve estar em branco",
    "idade": "deve ser maior ou igual a 0"
  }
}
```

---

#### Endpoint 2 — Listar Triagens

```
GET http://localhost:8080/api/triagem
```

**Response — Sucesso (HTTP 200 OK):**
```json
[
  {
    "id": 1,
    "nome": "João Silva",
    "idade": 67,
    "genero": "M",
    "motivoPrincipal": "dor no peito com falta de ar",
    "numeroComorbidades": 3,
    "historicoInternacoes": 2,
    "prioridade": "URGENTE",
    "timestamp": "2025-05-16T10:30:00"
  },
  {
    "id": 2,
    "nome": "Maria Costa",
    "idade": 45,
    "genero": "F",
    "motivoPrincipal": "dor de cabeça leve",
    "numeroComorbidades": 0,
    "historicoInternacoes": 0,
    "prioridade": "BAIXA",
    "timestamp": "2025-05-16T10:35:00"
  }
]
```

**Ordenação:** urgente primeiro, depois alta, media, baixa. Dentro da mesma prioridade, mais antigo primeiro (timestamp ASC).

---

### O que o Frontend consome

| Campo | Tipo | Usado para |
|-------|------|-----------|
| `id` | Long | Exibir na tabela (coluna ID) |
| `nome` | String | Exibir na tabela |
| `idade` | Integer | Exibir na tabela |
| `genero` | String | Exibir na tabela |
| `motivoPrincipal` | String | Exibir na tabela |
| `prioridade` | String (enum) | Definir cor da linha e badge |
| `timestamp` | String (ISO 8601) | Exibir na tabela formatado |

---

## Mapeamento de cores por prioridade

O Frontend DEVE usar exatamente estas cores:

| Prioridade | Cor de fundo | Cor de texto | Hex |
|------------|-------------|-------------|-----|
| `URGENTE` | Vermelho | Branco | `#dc3545` |
| `ALTA` | Laranja | Branco | `#fd7e14` |
| `MEDIA` | Amarelo | Preto | `#ffc107` |
| `BAIXA` | Verde | Branco | `#28a745` |

---

## Regras de contrato — NUNCA violar

1. **O Frontend NUNCA deve chamar endpoints não listados neste documento**
2. **O Frontend NUNCA deve assumir campos além dos listados no contrato**
3. **O Backend NUNCA deve alterar nomes de campos sem atualizar este documento**
4. **O Backend NUNCA deve alterar os valores possíveis do enum `prioridade` sem avisar o Frontend**
5. **As URLs são relativas** (`/api/triagem`) — sem hardcode de host ou porta

---

## Fluxo de interação completo

```
Recepcionista preenche formulário
    │
    ▼
Frontend coleta dados do formulário
    │  { nome, idade, genero, motivoPrincipal, numeroComorbidades, historicoInternacoes }
    ▼
fetch('POST /api/triagem', { body: JSON.stringify(dados) })
    │
    ▼
Agente Backend (TriagemController)
    │  valida entrada com @Valid
    ▼
Agente Backend (TriagemService)
    │  chama ClassificadorPrioridade → obtém Prioridade
    │  monta Atendimento + timestamp
    │  salva no H2
    ▼
Response 201: { id, nome, prioridade, timestamp }
    │
    ▼
Frontend exibe badge com cor da prioridade
    │
    ▼
Frontend chama GET /api/triagem para atualizar tabela
    │
    ▼
Tabela recarregada com novo atendimento no topo (se urgente)
```

---

## Tratamento de erros no Frontend

| Status HTTP | Ação esperada do Frontend |
|-------------|--------------------------|
| 201 | Exibir prioridade com cor, limpar formulário, recarregar tabela |
| 400 | Exibir mensagem de erro de validação em vermelho abaixo do formulário |
| 500 | Exibir mensagem genérica: "Erro interno. Tente novamente." |
| Sem resposta | Exibir: "Servidor indisponível. Verifique se o Spring Boot está rodando." |

---

## Histórico de versões do contrato

| Versão | Data | Mudança | Aprovado por |
|--------|------|---------|-------------|
| 1.0 | 2025-05-16 | Versão inicial — POST e GET `/api/triagem` | Equipe |

---

## Verificação de integridade

Antes de qualquer deploy ou apresentação, verificar:

- [ ] Swagger UI (`/swagger-ui.html`) mostra os mesmos campos definidos neste documento
- [ ] POST retorna 201 com o campo `prioridade` em maiúsculas
- [ ] GET retorna lista com todos os campos listados na seção "O que o Frontend consome"
- [ ] Frontend não usa nenhum campo além dos listados
- [ ] Cores no frontend batem com a tabela de cores deste documento
