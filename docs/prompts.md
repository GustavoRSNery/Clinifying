# prompts.md — Registro de Prompts em Formato RTCCO
**Projeto:** Sistema de Triagem Assistida por IA  
**Regra:** Todo prompt de IA usado no projeto DEVE ser registrado aqui no formato RTCCO.  
**Penalidade:** Prompts fora do formato = −10 pts

---

## Formato obrigatório

```
**Role:** [papel da IA neste prompt]
**Task:** [tarefa específica e delimitada]
**Context:** [contexto necessário — arquivos lidos, estado atual, decisões tomadas]
**Constraints:** [o que a IA NÃO deve fazer]
**Output:** [formato esperado da resposta]
```

---

## PROMPT #001 — Geração do PRD em formato RTCCO

**Data:** 2025-05-16  
**Agente:** Backend  
**Objetivo:** Transformar o briefing do hackathon em PRD estruturado

---

**Role:** Você é um Product Manager sênior especializado em sistemas de saúde, experiente em escrever Product Requirements Documents no formato RTCCO (Role, Task, Context, Constraints, Output).

**Task:** Transformar o briefing do hackathon ADS em um PRD completo no formato RTCCO para o Sistema de Triagem Assistida por IA, cobrindo: regras de prioridade (urgente/alta/media/baixa), campos da API, estrutura de persistência, interface esperada e stack técnica.

**Context:** 
- O projeto é um hackathon com prazo curto
- Stack obrigatória: Java 21 + Spring Boot 3.x, Maven, H2, springdoc-openapi, HTML/CSS/JS puro
- Dataset base: Synthea (registros sintéticos de pacientes)
- Dois usuários: Recepcionista (cadastra) e Triador/Enfermeiro (visualiza fila)
- O sistema classifica prioridade com base em: idade, gênero, motivo, comorbidades, internações

**Constraints:**
- NÃO incluir autenticação, prontuário ou múltiplos médicos no escopo
- NÃO usar banco externo ou frameworks JS
- NÃO recomendar tecnologias fora da stack obrigatória
- NÃO inventar requisitos além do briefing fornecido

**Output:** Arquivo `prd.md` em Markdown, seções R/T/C/C/O claramente marcadas, com tabelas de regras de prioridade, schema de request/response JSON e estrutura de pastas esperada.

---

## PROMPT #002 — Geração do Plano de Implementação (Plan Mode)

**Data:** 2025-05-16  
**Agente:** Backend  
**Objetivo:** Criar o plano de desenvolvimento ANTES de qualquer código

---

**Role:** Você é um engenheiro de software sênior especialista em Java 21 e Spring Boot 3.x, com experiência em conduzir equipes júnior em desenvolvimento orientado a testes e planejamento antes de codificação.

**Task:** Gerar o `PLANO_IMPLEMENTACAO.md` completo para o Sistema de Triagem Assistida por IA, detalhando cada fase de desenvolvimento com tarefas, arquivos gerados, critérios de aceite e mensagens de commit sugeridas. O plano deve cobrir 8 fases: Setup → Modelo → DTOs → Repositório → Serviço → Controller → Frontend → Testes.

**Context:**
- PRD aprovado em `prd.md` v1.0
- `.cursorrules` definido com stack imutável e nomes canônicos de arquivos
- A lógica de prioridade está 100% definida no PRD (9 passos determinísticos)
- Equipe de nível júnior/intermediário — plano deve ser didático
- Este arquivo deve ser commitado ANTES de qualquer `.java` ou `.html`

**Constraints:**
- NÃO gerar código Java neste prompt — apenas o plano
- NÃO sugerir arquivos com nomes diferentes dos listados no `.cursorrules`
- NÃO propor fases fora da ordem Controller → Service → Repository
- NÃO incluir autenticação, paginação ou features fora do escopo do PRD

**Output:** Arquivo Markdown com tabelas de tarefas por fase, snippets de pseudo-código para as partes mais complexas (ClassificadorPrioridade), checklist de entrega final e sugestão de mensagens de commit.

---

## PROMPT #003 — Implementação do ClassificadorPrioridade

**Data:** 2025-05-16  
**Agente:** Backend  
**Objetivo:** Gerar a classe Java com o algoritmo de prioridade

---

**Role:** Você é um engenheiro de software sênior especialista em Java 21 com experiência em Clean Code e sistemas de saúde. Você implementa regras de negócio de forma clara, testável e sem side effects.

**Task:** Implementar a classe `ClassificadorPrioridade.java` no pacote `com.hackathon.triagem.service` com o algoritmo de 9 passos definido no `.cursorrules`, usando Java 21 (records, var, enhanced switch quando aplicável). A classe deve ser anotada com `@Component` para injeção Spring.

**Context:**
- Algoritmo de 9 passos definido no `.cursorrules` (IMUTÁVEL)
- Palavras-chave de urgência listadas no `.cursorrules`
- `TriagemRequest` é um Java Record com campos: nome, idade, genero, motivoPrincipal, numeroComorbidades, historicoInternacoes
- `Prioridade` é enum com BAIXA, MEDIA, ALTA, URGENTE
- Sem acesso a banco — lógica puramente funcional

**Constraints:**
- NÃO alterar o algoritmo — implementar exatamente os 9 passos do `.cursorrules`
- NÃO usar bibliotecas externas para matching de strings
- NÃO fazer chamadas a APIs ou banco de dados
- NÃO gerar logs de nível DEBUG com dados do paciente (risco de privacidade)
- NÃO usar `else if` excessivo — preferir early return para legibilidade

**Output:** Arquivo `ClassificadorPrioridade.java` completo, com a lista de palavras-chave como constante estática, método público `classificar(TriagemRequest)` e métodos privados `isUrgente()`, `isAlta()`, `isMedia()`. Cada método com um comentário de uma linha explicando o critério.

---

## PROMPT #004 — Implementação do TriagemService

**Data:** 2025-05-16  
**Agente:** Backend  
**Objetivo:** Gerar o service que orquestra classificação e persistência

---

**Role:** Você é um engenheiro de software sênior especialista em Spring Boot 3.x e arquitetura em camadas (Controller → Service → Repository). Você implementa services que orquestram operações sem conter regras de negócio próprias.

**Task:** Implementar `TriagemService.java` no pacote `com.hackathon.triagem.service` com dois métodos: `registrarTriagem(TriagemRequest)` e `listarTriagens()`. O service deve injetar `AtendimentoRepository` e `ClassificadorPrioridade` via construtor.

**Context:**
- `ClassificadorPrioridade` já implementado — recebe `TriagemRequest`, retorna `Prioridade`
- `Atendimento` é entidade JPA com todos os campos do PRD + `timestamp` auto-preenchido
- `AtendimentoRepository` estende `JpaRepository<Atendimento, Long>`
- Fluxo de `registrarTriagem()`: classificar → mapear para Atendimento → salvar → mapear para TriagemResponse
- Fluxo de `listarTriagens()`: buscar todos ordenados por prioridade DESC, timestamp ASC

**Constraints:**
- NÃO usar `@Autowired` em campo — usar injeção via construtor (`@RequiredArgsConstructor` do Lombok ou construtor manual)
- NÃO colocar lógica de prioridade no service — delegar para `ClassificadorPrioridade`
- NÃO retornar entidades JPA diretamente — sempre usar DTOs
- NÃO usar `@Transactional` em `listarTriagens()` sem necessidade

**Output:** Arquivo `TriagemService.java` completo, anotado com `@Service`, com construtor explícito para injeção, `registrarTriagem()` retornando `TriagemResponse` e `listarTriagens()` retornando `List<Atendimento>`.

---

## PROMPT #005 — Implementação do TriagemController

**Data:** 2025-05-16  
**Agente:** Backend  
**Objetivo:** Expor a API REST com Swagger

---

**Role:** Você é um engenheiro de software sênior especialista em Spring Boot REST e documentação OpenAPI/Swagger. Você cria controllers limpos, com validação de entrada, tratamento de erros adequado e documentação Swagger completa.

**Task:** Implementar `TriagemController.java` no pacote `com.hackathon.triagem.controller` com dois endpoints: `POST /api/triagem` (retorna 201) e `GET /api/triagem` (retorna 200). Adicionar anotações Swagger (`@Operation`, `@ApiResponse`) em todos os endpoints.

**Context:**
- `TriagemService` já implementado
- `TriagemRequest` tem Bean Validation (`@Valid` necessário no controller)
- API base: `http://localhost:8080/api/`
- Frontend é servido pelo mesmo Spring Boot, sem necessidade de CORS para desenvolvimento
- Swagger UI deve estar em `http://localhost:8080/swagger-ui.html`

**Constraints:**
- NÃO retornar stack traces em respostas de erro — usar `@ControllerAdvice` simples
- NÃO implementar autenticação
- NÃO usar `@RequestMapping` a nível de classe sem necessidade — preferir `@RestController` + anotações de método
- NÃO adicionar endpoints além dos especificados no PRD

**Output:** Arquivo `TriagemController.java` completo com `@RestController`, `@RequestMapping("/api/triagem")`, endpoints POST e GET com anotações Swagger, `@Valid` na entrada, retorno de `ResponseEntity` com status HTTP corretos.

---

## PROMPT #006 — Implementação do Frontend

**Data:** 2025-05-16  
**Agente:** Frontend  
**Objetivo:** Criar interface HTML que consuma a API

---

**Role:** Você é um desenvolvedor frontend especialista em HTML5, CSS3 e JavaScript vanilla (ES6+). Você cria interfaces funcionais, acessíveis e visualmente claras sem frameworks.

**Task:** Criar `index.html` em `src/main/resources/static/` com duas seções: (1) formulário de cadastro de triagem com feedback visual de prioridade; (2) tabela de fila de atendimento ordenada por prioridade, com atualização automática após cada cadastro.

**Context:**
- API disponível em `POST /api/triagem` e `GET /api/triagem` (mesmo origin, sem CORS)
- Swagger UI confirma os contratos em `http://localhost:8080/swagger-ui.html`
- Prioridades: URGENTE (vermelho), ALTA (laranja), MEDIA (amarelo), BAIXA (verde)
- Frontend é servido pelo Spring Boot em `http://localhost:8080/`
- Contrato I/O documentado em `relatorio-interacao-agentes.md`

**Constraints:**
- NÃO usar jQuery, React, Vue, Angular ou qualquer framework JS
- NÃO fazer hardcode do host (usar URLs relativas: `/api/triagem`)
- NÃO usar `alert()` para feedback — usar elementos visuais na própria página
- NÃO consumir endpoints que não estão documentados no Swagger
- NÃO adicionar campos além dos especificados no PRD

**Output:** Arquivo `index.html` único com CSS embutido (`<style>`) e JavaScript embutido (`<script>`), formulário com todos os campos do PRD, tabela de atendimentos com cores por prioridade, `fetch()` para POST ao submeter formulário e para GET ao carregar a página e após cada registro.

---

## PROMPT #007 — Testes unitários do ClassificadorPrioridade

**Data:** 2025-05-16  
**Agente:** Backend  
**Objetivo:** Garantir cobertura dos 9 ramos do algoritmo

---

**Role:** Você é um engenheiro de software sênior especialista em testes unitários com JUnit 5 e práticas de TDD. Você escreve testes expressivos que documentam o comportamento esperado do sistema.

**Task:** Criar `ClassificadorPrioridadeTest.java` em `src/test/java/com/hackathon/triagem/service/` com pelo menos um teste para cada um dos 9 ramos do algoritmo de classificação. Usar JUnit 5 (`@Test`, `@ParameterizedTest` onde aplicável) sem Spring context.

**Context:**
- `ClassificadorPrioridade` é um POJO anotado com `@Component` mas instanciável sem Spring
- 9 ramos: palavra-chave urgente, idade≥70+comorbidades≥2, comorbidades≥3, internações≥2, idade≥60+comorbidades≥1, comorbidades≥1, internações≥1, idade≥60, BAIXA
- Testar também casos de borda: palavra-chave case-insensitive, múltiplos critérios (deve retornar o mais grave)

**Constraints:**
- NÃO usar Mockito — `ClassificadorPrioridade` não tem dependências externas
- NÃO usar `@SpringBootTest` — testes unitários puros
- NÃO testar `TriagemService` ou `TriagemController` neste arquivo

**Output:** Arquivo `ClassificadorPrioridadeTest.java` com `@ExtendWith(SpringExtension.class)` se necessário ou instância manual, um método de teste por ramo, nomes de métodos descritivos em camelCase (`deveRetornarUrgenteQuandoMotivoContemDorNopeito`).

---

## [TEMPLATE PARA NOVO PROMPT]

## PROMPT #XXX — [Título do Prompt]

**Data:** YYYY-MM-DD  
**Agente:** [Backend | Frontend | Arquitetura]  
**Objetivo:** [Uma linha descrevendo o objetivo]

---

**Role:** [papel da IA]

**Task:** [tarefa específica]

**Context:** [contexto relevante — arquivos de referência, estado atual]

**Constraints:** [o que NÃO fazer — use frases negativas]

**Output:** [formato esperado da resposta]
