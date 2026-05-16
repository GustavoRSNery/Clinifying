# PRD — Sistema de Triagem Assistida por IA
**Formato:** RTCCO | **Versão:** 1.0 | **Status:** Aprovado pela equipe

---

## R — Role (Papel)

Você é um engenheiro de software sênior com 15 anos de experiência em sistemas hospitalares críticos, especialista em Java 21, Spring Boot 3.x e desenvolvimento de APIs REST para o setor de saúde. Foi contratado por um hospital de emergência para desenvolver um sistema de triagem assistida por IA que organize o fluxo de atendimento com base na gravidade clínica do paciente. Você conhece profundamente as boas práticas de Clean Code, arquitetura em camadas (Controller → Service → Repository) e documentação de APIs com OpenAPI/Swagger.

---

## T — Task (Tarefa)

Desenvolver uma aplicação web funcional que:

1. Receba os dados do paciente via formulário HTML e API REST
2. Classifique automaticamente a prioridade de atendimento em: `baixa`, `media`, `alta` ou `urgente`
3. Persista cada atendimento (paciente + entrada + classificação + timestamp) no banco H2 via JPA
4. Exponha a API documentada via Swagger UI
5. Exiba a fila de atendimento ordenada por prioridade na interface

---

## C — Context (Contexto)

### O problema clínico
Hospitais de emergência enfrentam gargalos no atendimento por falta de triagem padronizada. Pacientes com casos graves podem aguardar na mesma fila que casos leves, colocando vidas em risco. O sistema resolve isso classificando automaticamente a prioridade com base no perfil clínico do paciente no momento da chegada.

### O dataset
O sistema foi concebido a partir da análise do dataset **Synthea** (`master_table.csv`), que contém registros sintéticos de pacientes americanos com dados demográficos, encontros clínicos, condições, medicamentos e procedimentos. As colunas utilizadas como referência para definir as regras de prioridade foram:

- `BIRTHDATE` → cálculo de idade
- `GENDER` → gênero do paciente
- `REASONDESCRIPTION` → motivo principal do atendimento
- `DESCRIPTION_condition` → comorbidades ativas (`STOP_condition` nulo = condição ativa)
- `ENCOUNTERCLASS` → classe do encontro (emergency, urgentcare, ambulatory, wellness)

### Usuários do sistema
- **Recepcionista:** cadastra o paciente na chegada via formulário web
- **Triador/Enfermeiro:** visualiza a fila ordenada por prioridade e chama o próximo

### Ambiente técnico
- Aplicação single-module Spring Boot servindo backend e frontend
- Banco H2 em memória com persistência via JPA (dados perdidos ao reiniciar — comportamento esperado)
- Frontend estático servido pelo próprio Spring Boot em `/src/main/resources/static/`

---

## C — Constraints (Restrições)

### Stack — IMUTÁVEL
| Camada | Obrigatório | Proibido |
|--------|-------------|---------|
| Backend | Java 21 + Spring Boot 3.x | Kotlin, Node, Python |
| Build | Maven | Gradle |
| Banco | H2 + JPA | PostgreSQL, MongoDB |
| Docs | springdoc-openapi | SpringFox |
| Frontend | HTML + CSS + JS puro | React, Vue, Angular, jQuery |
| Formato | JSON | XML |

### Restrições de escopo
- **NÃO** implementar autenticação/login nesta versão
- **NÃO** implementar prontuário, exames ou receitas
- **NÃO** implementar múltiplas salas ou múltiplos médicos
- **NÃO** usar banco de dados externo ou persistência em disco
- **NÃO** usar frameworks JavaScript no frontend

### Restrições éticas
- O sistema é **demonstrativo** — não deve ser usado em ambiente clínico real
- Os dados do dataset são **fictícios** (Synthea)
- Nenhum dado pessoal real deve ser coletado

### Restrições de processo
- Nenhum código gerado antes do `PLANO_IMPLEMENTACAO.md` estar aprovado
- Todo prompt registrado em `prompts.md` deve seguir o formato RTCCO
- Todo commit deve seguir Conventional Commits

---

## O — Output (Entregáveis)

### 1. API REST

**Endpoint principal:**
```
POST /api/triagem
Content-Type: application/json
```

**Request body:**
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

**Response (201 Created):**
```json
{
  "id": 1,
  "nome": "João Silva",
  "prioridade": "urgente",
  "timestamp": "2025-05-16T10:30:00"
}
```

**Endpoint de consulta:**
```
GET /api/triagem
```
Retorna lista de todos os atendimentos ordenados por prioridade (urgente → alta → media → baixa) e por timestamp dentro da mesma prioridade.

### 2. Regras de classificação de prioridade

| Prioridade | Critérios |
|------------|-----------|
| `urgente`  | Motivo contém palavras-chave críticas (ex: "dor no peito", "falta de ar", "desmaio", "AVC", "convulsão") **OU** idade ≥ 70 com ≥ 2 comorbidades |
| `alta`     | ≥ 3 comorbidades **OU** histórico de ≥ 2 internações **OU** idade ≥ 60 com ≥ 1 comorbidade |
| `media`    | 1–2 comorbidades **OU** histórico de 1 internação **OU** idade ≥ 60 sem comorbidades |
| `baixa`    | Demais casos — paciente jovem, sem comorbidades, motivo não crítico |

### 3. Interface Web

Tela única (`index.html`) com duas seções:

**Seção 1 — Formulário de cadastro:**
- Campos: Nome, Idade, Gênero, Motivo Principal, Nº de Comorbidades, Histórico de Internações
- Botão "Registrar Triagem"
- Feedback visual do resultado (prioridade retornada pela API com cor correspondente)

**Seção 2 — Fila de atendimento:**
- Tabela com todos os atendimentos registrados
- Ordenada por prioridade (urgente no topo)
- Cores por prioridade: urgente=vermelho, alta=laranja, media=amarelo, baixa=verde
- Atualização automática após cada cadastro

### 4. Persistência

Entidade `Atendimento` com os campos:
- `id` (Long, auto-gerado)
- `nome` (String)
- `idade` (Integer)
- `genero` (String)
- `motivoPrincipal` (String)
- `numeroComorbidades` (Integer)
- `historicoInternacoes` (Integer)
- `prioridade` (Enum: BAIXA, MEDIA, ALTA, URGENTE)
- `timestamp` (LocalDateTime, auto-gerado)

### 5. Documentação

- Swagger UI acessível em `http://localhost:8080/swagger-ui.html`
- H2 Console acessível em `http://localhost:8080/h2-console`
- Todos os endpoints anotados com `@Operation` e `@ApiResponse`

### 6. Estrutura de pastas esperada

```
triagem-ia/
├── src/
│   ├── main/
│   │   ├── java/com/hackathon/triagem/
│   │   │   ├── controller/
│   │   │   │   └── TriagemController.java
│   │   │   ├── service/
│   │   │   │   └── TriagemService.java
│   │   │   ├── repository/
│   │   │   │   └── AtendimentoRepository.java
│   │   │   ├── model/
│   │   │   │   ├── Atendimento.java
│   │   │   │   └── Prioridade.java
│   │   │   ├── dto/
│   │   │   │   ├── TriagemRequest.java
│   │   │   │   └── TriagemResponse.java
│   │   │   └── TriagemApplication.java
│   │   └── resources/
│   │       ├── static/
│   │       │   └── index.html
│   │       └── application.properties
├── prd.md
├── PLANO_IMPLEMENTACAO.md
├── .cursorrules
├── DECISOES_ARQUITETURAIS.md
├── prompts.md
├── relatorio-interacao-agentes.md
├── README.md
└── pom.xml
```

### 7. Comando de execução

```bash
mvn spring-boot:run
```

A aplicação deve subir sem erros em `http://localhost:8080/`

---

## Mensagem de commit sugerida

```
docs: criar prd.md em formato RTCCO
```
