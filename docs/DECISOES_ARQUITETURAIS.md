# DECISÕES ARQUITETURAIS — Sistema de Triagem Assistida por IA
**Arquivo vivo** — atualizar a cada decisão técnica relevante  
**Formato:** `[DATA] — [Título]` | Decisão + Motivo + Alternativas + Impacto

---

## 2025-05-16 — Separação do ClassificadorPrioridade em classe própria

**Decisão:** O algoritmo de classificação de prioridade foi isolado na classe `ClassificadorPrioridade` (package `service`), separado do `TriagemService`.

**Motivo:** Isolar a regra de negócio mais crítica do sistema permite:
- Testar o algoritmo unitariamente sem contexto Spring
- Alterar regras sem tocar na lógica de persistência
- Demonstrar claramente o princípio de Responsabilidade Única (SRP)

**Alternativas descartadas:**
- Manter a lógica inline no `TriagemService` — rejeitado por dificultar testes e violar SRP
- Usar uma tabela de regras no banco — rejeitado por over-engineering para o escopo do hackathon

**Impacto:** `TriagemService` injeta `ClassificadorPrioridade` como dependência. A classe é anotada com `@Component` para injeção pelo Spring.

---

## 2025-05-16 — Algoritmo de prioridade determinístico (sem IA generativa)

**Decisão:** O sistema usa regras determinísticas baseadas nos dados do dataset Synthea, sem chamadas a modelos de linguagem ou APIs externas de IA.

**Motivo:**
- Stack obrigatória não inclui integração com LLMs
- Regras derivadas da análise do dataset são auditáveis e explicáveis
- Zero latência de rede e zero dependência externa

**Alternativas descartadas:**
- Chamar OpenAI API para classificar — rejeitado pela stack obrigatória e por custos
- Usar modelo ML treinado no Synthea — rejeitado pelo prazo e complexidade

**Impacto:** Toda a lógica de "IA" é encapsulada em `ClassificadorPrioridade.java`. O nome "Assistida por IA" refere-se ao uso de ferramentas de IA (Copilot/Cursor) no processo de desenvolvimento.

---

## 2025-05-16 — Enum Prioridade com campo `ordem` para ordenação

**Decisão:** O enum `Prioridade` possui um campo `int ordem` (BAIXA=1, MEDIA=2, ALTA=3, URGENTE=4) para permitir ordenação correta.

**Motivo:** A ordenação `ORDER BY prioridade DESC` via JPA com `EnumType.STRING` ordenaria alfabeticamente (URGENTE → MEDIA → BAIXA → ALTA), que é incorreto. Com `EnumType.ORDINAL` dependeria da ordem de declaração no enum.

**Alternativas descartadas:**
- `EnumType.ORDINAL` — rejeitado por ser frágil (reordenar o enum quebraria dados)
- Ordenação em memória no service via `Comparator` — considerada como backup se a query não suportar

**Solução adotada:** Query JPQL com `ORDER BY a.prioridade.ordem DESC` ou ordenação via `Comparator.comparingInt(a -> a.getPrioridade().getOrdem())` no service se o JPQL não suportar campo de enum.

**Impacto:** `Prioridade.java` tem getter `getOrdem()`. `AtendimentoRepository` pode usar `@Query` se necessário.

---

## 2025-05-16 — Single-module Spring Boot (backend serve frontend)

**Decisão:** A aplicação é um único módulo Maven onde o Spring Boot serve tanto a API REST quanto o frontend estático em `/src/main/resources/static/`.

**Motivo:**
- Stack obrigatória especifica single-module
- Elimina complexidade de CORS em ambiente de desenvolvimento
- Facilita o deploy com `mvn spring-boot:run`

**Alternativas descartadas:**
- Separar frontend em servidor estático separado (ex: Live Server na porta 5500) — rejeitado porque exigiria configuração de CORS

**Impacto:** Frontend em `src/main/resources/static/index.html` é servido automaticamente pelo Spring Boot em `http://localhost:8080/`. Chamadas `fetch('/api/triagem')` usam caminho relativo, sem necessidade de CORS.

---

## 2025-05-16 — H2 in-memory com `create-drop`

**Decisão:** `spring.jpa.hibernate.ddl-auto=create-drop` — o schema é criado ao iniciar e destruído ao parar.

**Motivo:**
- Comportamento esperado pelo PRD ("dados perdidos ao reiniciar")
- Simplifica desenvolvimento: sem migrations, sem estado acumulado
- Facilita demonstração: banco sempre limpo ao iniciar

**Alternativas descartadas:**
- `update` — rejeitado por acumular dados entre execuções, complicando demos
- `validate` — rejeitado por exigir schema SQL manual

**Impacto:** Todos os dados são voláteis. O H2 console (`/h2-console`) conecta via `jdbc:h2:mem:triagem`.

---

## 2025-05-16 — DTOs como Java Records

**Decisão:** `TriagemRequest` e `TriagemResponse` são implementados como Java Records (Java 16+, disponível no Java 21).

**Motivo:**
- Imutabilidade por padrão (segurança)
- Menos boilerplate: sem getters/setters manuais
- Expressivo: o record comunica claramente que é um portador de dados

**Alternativas descartadas:**
- Classes POJO com Lombok `@Data` — rejeitado por adicionar dependência sem necessidade (Java Records são nativos)
- Classes POJO manuais — rejeitado por verbosidade desnecessária

**Impacto:** Bean Validation funciona normalmente em records com anotações nos parâmetros do construtor canônico.

---

## [TEMPLATE PARA NOVA DECISÃO]

## YYYY-MM-DD — [Título da Decisão]

**Decisão:** o que foi decidido

**Motivo:** por que foi escolhido

**Alternativas descartadas:** o que foi rejeitado e por quê

**Impacto:** o que isso afeta no projeto

---

## 2025-05-16 — Arquitetura monolítica modularizada (src/back_end + src/front_end)

**Decisão:** O projeto é um monolito Spring Boot com separação de diretórios de código-fonte por equipe: `src/back_end/` para o código Java e `src/front_end/` para HTML/CSS/JS. O Maven é configurado para usar `src/back_end/` como `sourceDirectory` e empacotar `src/front_end/` como recursos estáticos no JAR.

**Motivo:**
- Permite que metade da equipe trabalhe em `src/back_end/` e a outra em `src/front_end/` sem conflitos de merge
- Commits com escopo `feat(back):` e `feat(front):` ficam claramente separados no `git log`
- Monolito simplifica o ambiente de execução: um único `mvn spring-boot:run`, uma única porta
- Frontend e backend rodam no mesmo origin → sem configuração de CORS

**Alternativas descartadas:**
- Separar em dois processos (frontend em Nginx/porta 3000, backend em porta 8080) — rejeitado porque exige CORS e complica o setup do hackathon
- Módulos Maven multi-module — rejeitado por over-engineering para este escopo
- Manter estrutura padrão `src/main/java` + `src/main/resources/static` — rejeitado porque coloca backend e frontend no mesmo caminho, causando merge conflicts

**Impacto:**
- `pom.xml` precisa de `<sourceDirectory>src/back_end</sourceDirectory>` e `<resource>` apontando para `src/front_end/` com `<targetPath>static</targetPath>`
- `src/main/resources/application.properties` permanece no caminho padrão Maven

---

## 2025-05-16 — SOLID com foco em modularização (ClassificadorPrioridade isolado)

**Decisão:** A lógica de classificação de prioridade foi separada em `ClassificadorPrioridade.java` (pacote `service`), independente de `TriagemService`. O `TriagemService` age como orquestrador puro — sem regras de negócio próprias.

**Motivo:**
- **S** (Single Responsibility): cada classe tem exatamente uma razão para mudar
- **O** (Open/Closed): novas regras de prioridade podem ser adicionadas via subclasse sem tocar no `TriagemService`
- **D** (Dependency Inversion): `TriagemService` depende da interface/componente `ClassificadorPrioridade`, não de uma implementação inline
- Facilita testes unitários: `ClassificadorPrioridade` não tem dependências Spring

**Alternativas descartadas:**
- Lógica de prioridade inline no `TriagemService` — rejeitado por violar SRP e dificultar testes
- Lógica no `TriagemController` — rejeitado por misturar camadas

**Impacto:** Duas classes no pacote `service/` em vez de uma. Testes do `ClassificadorPrioridade` são independentes do Spring context.

---

## 2025-05-16 — Padrão BASE para o banco H2 in-memory

**Decisão:** O banco H2 in-memory é utilizado com estratégia `create-drop`, sem transações de longa duração, alinhado ao modelo BASE (Basically Available, Soft state, Eventually consistent).

**Motivação conceitual:**

| Propriedade BASE | Implementação |
|-----------------|---------------|
| **Basically Available** | H2 embutido no JVM — sem rede, sem disco, sempre disponível dentro do processo |
| **Soft state** | Dados não persistem entre reinicializações (`create-drop`) — estado transiente por design |
| **Eventually consistent** | JVM único com transações Spring — toda leitura vê o último write |

**Motivo prático:**
- `create-drop` elimina necessidade de migrations (Flyway/Liquibase) — reduz complexidade
- Dados voláteis são o comportamento **esperado** pelo PRD
- Demonstra compreensão consciente da escolha: não é ignorância de ACID, é adequação ao escopo demonstrativo

**Alternativas descartadas:**
- PostgreSQL com ACID completo — rejeitado pela stack obrigatória e pelo overhead de setup
- H2 com arquivo em disco (`jdbc:h2:file:./triagem`) — rejeitado porque viola o requisito "dados perdidos ao reiniciar"
- `spring.jpa.hibernate.ddl-auto=update` — rejeitado por acumular estado entre execuções

**Impacto:** `application.properties` com `ddl-auto=create-drop`. H2 console acessível em `/h2-console` com `jdbc:h2:mem:triagem`.

---

## 2025-05-16 — ORM via Spring Data JPA + Hibernate sobre H2

**Decisão:** A camada de persistência usa Spring Data JPA (abstração) com Hibernate como implementação ORM. O H2 é completamente compatível com Hibernate no Java 21.

**Como funciona:**
- `Atendimento.java` anotado com `@Entity` — Hibernate cria a tabela `ATENDIMENTO` automaticamente
- `AtendimentoRepository` estende `JpaRepository<Atendimento, Long>` — Spring Data gera as queries
- Não há uma linha de SQL escrita manualmente — Hibernate gera tudo a partir das anotações JPA

**Motivo:**
- H2 + JPA + Hibernate é uma das combinações mais testadas do ecossistema Spring Boot
- Funciona perfeitamente no Java 21 — sem configurações extras
- O Hibernate detecta o driver H2 automaticamente via `spring-boot-starter-data-jpa` + `h2` no classpath

**Alternativas descartadas:**
- JDBC puro (`JdbcTemplate`) — rejeitado por verbosidade e por não demonstrar ORM
- MyBatis — rejeitado por fuga da stack Spring Boot convencional

**Impacto:** Dependências no `pom.xml`: `spring-boot-starter-data-jpa` + `h2` (scope runtime). Nenhuma configuração adicional necessária para o ORM funcionar.

