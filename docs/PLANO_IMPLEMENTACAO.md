# PLANO DE IMPLEMENTAÇÃO — Sistema de Triagem Assistida por IA
**Gerado em:** Plan Mode — ANTES de qualquer código  
**Versão:** 1.0 | **Status:** Aprovado pela equipe  
**Referência:** `prd.md` v1.0 + `.cursorrules` v1.0

> ⚠️ Este arquivo deve existir e estar commitado **antes** de qualquer arquivo `.java` ou `.html` ser criado.

---

## Visão geral

Construir uma aplicação Spring Boot single-module que:
1. Receba dados de triagem via REST
2. Classifique prioridade com regras de negócio determinísticas
3. Persista no H2 via JPA
4. Exponha Swagger UI e frontend HTML

**Ordem de construção:** estrutura → modelo → repositório → serviço → controller → frontend → testes → docs

---

## Fase 0 — Setup do projeto

| # | Tarefa | Arquivo(s) gerado(s) | Critério de aceite |
|---|--------|---------------------|--------------------|
| 0.1 | Criar estrutura Maven com `pom.xml` customizado | `pom.xml` | `mvn validate` passa sem erros |
| 0.2 | Criar diretórios `src/back_end/` e `src/front_end/` | pastas | Estrutura existe |
| 0.3 | Criar `TriagemApplication.java` | `src/back_end/com/hackathon/triagem/TriagemApplication.java` | `mvn spring-boot:run` sobe na porta 8080 |
| 0.4 | Configurar `application.properties` | `src/main/resources/application.properties` | H2 console acessível em `/h2-console` |

**`pom.xml` — configuração custom de sourceDirectory:**
```xml
<build>
    <sourceDirectory>${project.basedir}/src/back_end</sourceDirectory>
    <resources>
        <resource>
            <directory>${project.basedir}/src/front_end</directory>
            <targetPath>static</targetPath>  <!-- serve em http://localhost:8080/ -->
        </resource>
        <resource>
            <directory>${project.basedir}/src/main/resources</directory>
        </resource>
    </resources>
</build>
```

**`application.properties` esperado:**
```properties
spring.datasource.url=jdbc:h2:mem:triagem
spring.datasource.driver-class-name=org.h2.Driver
spring.h2.console.enabled=true
spring.h2.console.path=/h2-console
spring.jpa.hibernate.ddl-auto=create-drop
spring.jpa.show-sql=true
springdoc.swagger-ui.path=/swagger-ui.html
```

**Commit sugerido:** `chore: setup inicial — estrutura Maven com src/back_end e src/front_end`

---

## Fase 1 — Modelo de domínio

| # | Tarefa | Arquivo(s) gerado(s) | Critério de aceite |
|---|--------|---------------------|--------------------|
| 1.1 | Criar enum `Prioridade` | `model/Prioridade.java` | Enum compila com 4 valores + `getOrdem()` |
| 1.2 | Criar entidade `Atendimento` | `model/Atendimento.java` | Classe anotada `@Entity` com todos os campos do PRD |

**`Prioridade.java` — estrutura esperada:**
```java
public enum Prioridade {
    BAIXA(1), MEDIA(2), ALTA(3), URGENTE(4);
    
    private final int ordem;
    
    Prioridade(int ordem) { this.ordem = ordem; }
    public int getOrdem() { return ordem; }
}
```

**`Atendimento.java` — campos obrigatórios:**
```
@Id @GeneratedValue → id (Long)
@Column → nome (String, not null)
@Column → idade (Integer, not null)
@Column → genero (String)
@Column → motivoPrincipal (String, not null)
@Column → numeroComorbidades (Integer, not null)
@Column → historicoInternacoes (Integer, not null)
@Enumerated(EnumType.STRING) → prioridade (Prioridade, not null)
@Column → timestamp (LocalDateTime, not null)
```

**Commit sugerido:** `feat: criar Atendimento entity e Prioridade enum`

---

## Fase 2 — DTOs

| # | Tarefa | Arquivo(s) gerado(s) | Critério de aceite |
|---|--------|---------------------|--------------------|
| 2.1 | Criar `TriagemRequest` | `dto/TriagemRequest.java` | Record com Bean Validation |
| 2.2 | Criar `TriagemResponse` | `dto/TriagemResponse.java` | Record com campos de retorno |

**`TriagemRequest.java` — validações:**
```
@NotBlank → nome
@NotNull @Min(0) @Max(150) → idade
@NotBlank → motivoPrincipal
@NotNull @Min(0) → numeroComorbidades
@NotNull @Min(0) → historicoInternacoes
```

**`TriagemResponse.java` — campos:**
```
Long id
String nome
Prioridade prioridade
LocalDateTime timestamp
```

**Commit sugerido:** `feat: criar DTOs TriagemRequest e TriagemResponse`

---

## Fase 3 — Repositório

| # | Tarefa | Arquivo(s) gerado(s) | Critério de aceite |
|---|--------|---------------------|--------------------|
| 3.1 | Criar `AtendimentoRepository` | `repository/AtendimentoRepository.java` | Interface compila estendendo `JpaRepository` |

**`AtendimentoRepository.java` — estrutura esperada:**
```java
public interface AtendimentoRepository extends JpaRepository<Atendimento, Long> {
    List<Atendimento> findAllByOrderByPrioridadeDescTimestampAsc();
}
```

> **Nota de decisão:** A ordenação por `prioridade DESC` depende do `EnumType.STRING` + ordenação alfabética. Como `URGENTE > MEDIA > BAIXA > ALTA` alfabeticamente não funciona, usaremos `getOrdem()` no `Prioridade` enum e um `@Query` se necessário, ou ordenação em memória no service. Registrar em `DECISOES_ARQUITETURAIS.md`.

**Commit sugerido:** `feat: criar AtendimentoRepository com query de ordenação`

---

## Fase 4 — Lógica de negócio

| # | Tarefa | Arquivo(s) gerado(s) | Critério de aceite |
|---|--------|---------------------|--------------------|
| 4.1 | Criar `ClassificadorPrioridade` | `service/ClassificadorPrioridade.java` | Retorna prioridade correta para todos os casos do PRD |
| 4.2 | Criar `TriagemService` | `service/TriagemService.java` | `registrarTriagem()` e `listarTriagens()` funcionando |

**`ClassificadorPrioridade.java` — algoritmo:**
```
1. Se motivoPrincipal contém palavra-chave crítica → URGENTE
2. Se idade >= 70 E comorbidades >= 2 → URGENTE
3. Se comorbidades >= 3 → ALTA
4. Se historicoInternacoes >= 2 → ALTA
5. Se idade >= 60 E comorbidades >= 1 → ALTA
6. Se comorbidades >= 1 → MEDIA
7. Se historicoInternacoes >= 1 → MEDIA
8. Se idade >= 60 → MEDIA
9. Caso contrário → BAIXA
```

**Palavras-chave urgente:**
```java
private static final List<String> PALAVRAS_CHAVE_URGENTE = List.of(
    "dor no peito", "falta de ar", "desmaio", "avc",
    "acidente vascular", "convulsão", "convulsao", "parada",
    "infarto", "hemorragia", "inconsciente", "trauma",
    "overdose", "intoxicação", "intoxicacao"
);
```

**`TriagemService.java` — fluxo do `registrarTriagem()`:**
```
1. Classificar prioridade via ClassificadorPrioridade
2. Mapear TriagemRequest → Atendimento (+ prioridade + timestamp = now)
3. Salvar no repository
4. Mapear Atendimento → TriagemResponse
5. Retornar TriagemResponse
```

**Commit sugerido:** `feat: implementar ClassificadorPrioridade com regras de triagem`  
**Commit sugerido:** `feat: implementar TriagemService orquestrando classificação e persistência`

---

## Fase 5 — Controller REST

| # | Tarefa | Arquivo(s) gerado(s) | Critério de aceite |
|---|--------|---------------------|--------------------|
| 5.1 | Criar `TriagemController` | `controller/TriagemController.java` | POST retorna 201, GET retorna 200 com lista |
| 5.2 | Adicionar anotações Swagger | `TriagemController.java` | Swagger UI exibe ambos os endpoints documentados |
| 5.3 | Configurar CORS | `TriagemController.java` ou `WebConfig.java` | Frontend consegue chamar API |

**`TriagemController.java` — endpoints:**
```
POST /api/triagem → 201 Created + TriagemResponse
GET  /api/triagem → 200 OK + List<Atendimento>
```

**Anotações Swagger obrigatórias:**
```java
@Operation(summary = "Registrar triagem de paciente")
@ApiResponse(responseCode = "201", description = "Triagem registrada com sucesso")
@ApiResponse(responseCode = "400", description = "Dados inválidos")
```

**Commit sugerido:** `feat: implementar TriagemController com POST e GET /api/triagem`  
**Commit sugerido:** `docs: adicionar anotações Swagger em TriagemController`  
**Commit sugerido:** `fix: configurar CORS para permitir chamadas do frontend`

---

## Fase 6 — Frontend

| # | Tarefa | Arquivo(s) gerado(s) | Critério de aceite |
|---|--------|---------------------|--------------------|
| 6.1 | Criar `index.html` | `src/front_end/index.html` | Formulário submete, exibe prioridade com cor |
| 6.2 | Criar `style.css` | `src/front_end/css/style.css` | Estilos separados, cores de prioridade definidas |
| 6.3 | Criar `app.js` | `src/front_end/js/app.js` | Fetch POST ao submeter, fetch GET ao carregar e após registro |

**`index.html` — seções obrigatórias:**

**Seção 1 — Formulário:**
```
Campos: nome, idade, genero (select), motivoPrincipal, 
        numeroComorbidades, historicoInternacoes
Botão: "Registrar Triagem"
Div de feedback: exibe prioridade com cor após submit
```

**Seção 2 — Fila:**
```
Tabela: ID | Nome | Idade | Motivo | Prioridade | Timestamp
Ordenada por prioridade (urgente no topo)
Cores definidas em style.css
```

**`app.js` — funções obrigatórias:**
```javascript
// URLs relativas (sem hardcode de host) — mesmo origin, sem CORS
async function registrarTriagem(dados) { fetch('POST /api/triagem', ...) }
async function carregarFila()          { fetch('GET /api/triagem', ...) }
```

**`style.css` — classes obrigatórias:**
```css
.prioridade-urgente { background-color: #dc3545; color: #fff; }
.prioridade-alta    { background-color: #fd7e14; color: #fff; }
.prioridade-media   { background-color: #ffc107; color: #000; }
.prioridade-baixa   { background-color: #28a745; color: #fff; }
```

**Commits sugeridos:**
- `feat(front): criar index.html com formulário de triagem`
- `feat(front): criar style.css com cores por prioridade`
- `feat(front): criar app.js com chamadas fetch à API`

---

## Fase 7 — Testes

| # | Tarefa | Arquivo(s) gerado(s) | Critério de aceite |
|---|--------|---------------------|--------------------|
| 7.1 | Testes unitários do `ClassificadorPrioridade` | `ClassificadorPrioridadeTest.java` | Cobre todos os 9 ramos do algoritmo |
| 7.2 | Testes de integração do `TriagemController` | `TriagemControllerTest.java` | POST e GET retornam status HTTP corretos |

**Casos de teste obrigatórios para `ClassificadorPrioridade`:**
```
- Motivo "dor no peito" → URGENTE
- Idade 72, 2 comorbidades → URGENTE
- 3 comorbidades → ALTA
- 2 internações → ALTA
- Idade 65, 1 comorbidade → ALTA
- 1 comorbidade → MEDIA
- 1 internação → MEDIA
- Idade 62, sem comorbidades → MEDIA
- Jovem, sem comorbidades, motivo trivial → BAIXA
```

**Commit sugerido:** `test: adicionar testes unitários do ClassificadorPrioridade`

---

## Fase 8 — Validação final

**Checklist de entrega:**

- [ ] `mvn spring-boot:run` sobe sem erros
- [ ] `http://localhost:8080/` exibe formulário e fila funcionando
- [ ] `http://localhost:8080/swagger-ui.html` exibe ambos os endpoints
- [ ] `http://localhost:8080/h2-console` conecta com `jdbc:h2:mem:triagem`
- [ ] POST `/api/triagem` retorna 201 com prioridade correta
- [ ] GET `/api/triagem` retorna lista ordenada
- [ ] Regras de prioridade testadas manualmente com casos críticos
- [ ] `git log --oneline` mostra histórico limpo com Conventional Commits
- [ ] `DECISOES_ARQUITETURAIS.md` atualizado
- [ ] `prompts.md` com todos os prompts em RTCCO
- [ ] `relatorio-interacao-agentes.md` com contrato I/O atualizado

---

## Estimativa de ordem de commits

```
chore: setup inicial — estrutura Maven com src/back_end e src/front_end
docs: criar docs/c4model com 4 níveis do modelo C4
docs: criar PLANO_IMPLEMENTACAO.md (Plan Mode aprovado)
feat(back): criar Atendimento entity e Prioridade enum
feat(back): criar DTOs TriagemRequest e TriagemResponse
feat(back): criar AtendimentoRepository com query de ordenação
feat(back): implementar ClassificadorPrioridade com regras de triagem
feat(back): implementar TriagemService orquestrando classificação e persistência
feat(back): implementar TriagemController com POST e GET /api/triagem
docs(back): adicionar anotações Swagger em TriagemController
feat(front): criar index.html com formulário de triagem
feat(front): criar style.css com cores por prioridade
feat(front): criar app.js com chamadas fetch à API
test(back): adicionar testes unitários do ClassificadorPrioridade
test(back): adicionar testes de integração do TriagemController
docs: finalizar README.md com instruções de execução
```
