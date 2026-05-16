# Clinifying — Sistema de Triagem Assistida por IA

> *Classifique. Priorize. Salve tempo.*

![Java](https://img.shields.io/badge/Java-21-ED8B00?style=flat-square&logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.x-6DB33F?style=flat-square&logo=springboot&logoColor=white)
![Maven](https://img.shields.io/badge/Build-Maven-C71A36?style=flat-square&logo=apachemaven&logoColor=white)
![H2](https://img.shields.io/badge/DB-H2_in--memory-1e90ff?style=flat-square)
![Status](https://img.shields.io/badge/Status-Hackathon-blueviolet?style=flat-square)

---

## Sobre o projeto

**Clinifying** é um sistema de triagem assistida por IA desenvolvido durante o **Hackathon ADS**. O objetivo é demonstrar como a metodologia de desenvolvimento orientado por agentes de IA — com planejamento (Plan Mode), prompts estruturados (RTCCO) e decisões documentadas — pode acelerar a entrega de software de qualidade.

O sistema resolve um problema real de hospitais de emergência: **a falta de triagem padronizada** faz com que pacientes graves aguardem na mesma fila que casos leves, colocando vidas em risco. O Clinifying classifica automaticamente a prioridade de atendimento com base no perfil clínico do paciente no momento da chegada.

> ⚠️ **Aviso ético:** sistema demonstrativo construído sobre dados sintéticos (Synthea). Não utilizar em ambiente clínico real. Triagem médica real exige profissional habilitado.

---

## O que o sistema faz

| Funcionalidade | Detalhe |
|---------------|--------|
| 📋 **Cadastro de triagem** | Recepcionista preenche formulário com dados do paciente |
| 🤖 **Classificação automática** | Algoritmo de 9 passos classifica em `BAIXA` / `MEDIA` / `ALTA` / `URGENTE` |
| 📊 **Fila ordenada** | Triador visualiza a fila com urgentes sempre no topo |
| 🗄️ **Persistência H2** | Atendimentos salvos em banco in-memory via ORM (JPA + Hibernate) |
| 📖 **Swagger UI** | API documentada e testável em `/swagger-ui.html` |

---

## Arquitetura em 30 segundos

```
[Recepcionista]  →  src/front_end/   (HTML + CSS + JS puro)
                         │
                    fetch('/api/triagem')   ← mesmo origin, sem CORS
                         │
                    src/back_end/    (Java 21 + Spring Boot 3.x)
                         │
                    H2 in-memory     (ORM via JPA + Hibernate)
```

Monolito empacotado em um único JAR. Um comando para subir tudo:

```bash
mvn spring-boot:run
```

Documentação arquitetural completa em **C4 Model** → [`docs/c4model/`](c4model/nivel-1-contexto.md)

---

## Como rodar

### Pré-requisitos

| Ferramenta | Versão mínima | Como instalar |
|-----------|--------------|---------------|
| **Java (JDK)** | 21 | [Microsoft OpenJDK 21](https://learn.microsoft.com/pt-br/java/openjdk/download) via `winget install Microsoft.OpenJDK.21` |
| **Maven** | 3.9+ | [apache.org/download](https://maven.apache.org/download.cgi) — extrair e adicionar `bin/` ao `PATH` |
| **Git** | qualquer | [git-scm.com](https://git-scm.com) |

> **Windows (PowerShell):** após instalar, defina `JAVA_HOME` e adicione ao `PATH` antes de rodar:
> ```powershell
> $env:JAVA_HOME = "C:\Program Files\Microsoft\jdk-21.0.x.x-hotspot"
> $env:PATH = "$env:JAVA_HOME\bin;C:\tools\apache-maven-3.9.x\bin;$env:PATH"
> ```

---

### Passos — do zero ao sistema rodando

```bash
# 1. Clone o repositório
git clone https://github.com/<org>/clinifying.git
cd clinifying

# 2. Compile e empacote (baixa dependências na primeira vez)
mvn clean package -DskipTests

# 3. Suba o servidor (backend + frontend no mesmo processo)
mvn spring-boot:run
```

Aguarde a linha de confirmação no terminal:

```
Started TriagemApplication in X.XXX seconds
```

### URLs disponíveis

| URL | Descrição |
|-----|-----------|
| `http://localhost:8080/` | Interface web (formulário + fila) |
| `http://localhost:8080/swagger-ui.html` | Documentação Swagger UI |
| `http://localhost:8080/h2-console` | Console H2 — JDBC URL: `jdbc:h2:mem:triagem`, user: `SA`, senha vazia |
| `http://localhost:8080/api/triagem` | API REST (POST + GET) |

### Testando a API diretamente (opcional)

```bash
# Registrar triagem
curl -X POST http://localhost:8080/api/triagem \
  -H "Content-Type: application/json" \
  -d '{"nome":"Ana Silva","idade":45,"genero":"F","motivoPrincipal":"dor no peito","numeroComorbidades":1,"historicoInternacoes":0}'

# Listar fila ordenada
curl http://localhost:8080/api/triagem
```

> O banco H2 é **in-memory** — os dados são perdidos ao reiniciar o servidor. Isso é intencional (padrão BASE para demonstração).

---

## Arquitetura — C4 Model

A documentação arquitetural completa segue o modelo C4 e está organizada em `docs/c4model/`:

| Nível | Arquivo | Pergunta respondida |
|-------|---------|-------------------|
| 1 — Contexto | [c4model/nivel-1-contexto.md](c4model/nivel-1-contexto.md) | Quem usa e quais sistemas externos? |
| 2 — Contêineres | [c4model/nivel-2-containers.md](c4model/nivel-2-containers.md) | O que está dentro do sistema? |
| 3 — Componentes | [c4model/nivel-3-componentes.md](c4model/nivel-3-componentes.md) | O que está dentro do Backend API? |
| 4 — Código (UML) | [c4model/nivel-4-codigo.md](c4model/nivel-4-codigo.md) | Como as classes se relacionam? ← **principal** |

---

## Estrutura do projeto

Monolito Spring Boot com **separação de pastas por equipe** — sem conflitos de commit:

```
triagem-ia/
├── src/
│   ├── back_end/                        ← TIME BACKEND trabalha aqui
│   │   └── com/hackathon/triagem/
│   │       ├── TriagemApplication.java
│   │       ├── controller/
│   │       │   └── TriagemController.java
│   │       ├── service/
│   │       │   ├── TriagemService.java
│   │       │   └── ClassificadorPrioridade.java
│   │       ├── repository/
│   │       │   └── AtendimentoRepository.java
│   │       ├── model/
│   │       │   ├── Atendimento.java
│   │       │   └── Prioridade.java
│   │       └── dto/
│   │           ├── TriagemRequest.java
│   │           └── TriagemResponse.java
│   ├── front_end/                       ← TIME FRONTEND trabalha aqui
│   │   ├── index.html
│   │   ├── css/
│   │   │   └── style.css
│   │   └── js/
│   │       └── app.js
│   └── main/
│       └── resources/
│           └── application.properties   ← configuração H2 + Swagger
├── src/test/
│   └── java/com/hackathon/triagem/
│       ├── service/
│       │   └── ClassificadorPrioridadeTest.java
│       └── controller/
│           └── TriagemControllerTest.java
├── docs/
│   ├── c4model/                         ← diagramas C4
│   ├── README.md
│   ├── prd.md
│   ├── PLANO_IMPLEMENTACAO.md
│   ├── .cursorrules
│   ├── DECISOES_ARQUITETURAIS.md
│   ├── prompts.md
│   └── relatorio-interacao-agentes.md
└── pom.xml
```

### Como o monolito conecta frontend e backend

O Maven empacota `src/front_end/` como recursos estáticos dentro do JAR:

```
src/front_end/index.html  →  empacotado em  static/index.html
src/front_end/css/        →  empacotado em  static/css/
src/front_end/js/         →  empacotado em  static/js/
```

O Spring Boot serve automaticamente tudo em `static/` na raiz (`/`). Resultado:
- Frontend acessa o backend com URLs **relativas** (`fetch('/api/triagem')`) — sem CORS
- Backend aponta para `src/front_end/` via configuração Maven no `pom.xml`
- Frontend aponta para o backend via chamadas REST no mesmo origin

---

## Agentes de IA utilizados

| # | Agente | Ferramenta | Responsabilidade |
|---|--------|-----------|-----------------|
| 1 | **Backend** | GitHub Copilot / Cursor | Gera código Java, Swagger, regras de prioridade |
| 2 | **Frontend** | GitHub Copilot / Cursor | Gera `index.html`, consumo da API, feedback visual |

### MCPs utilizados

| MCP | Como foi usado |
|-----|---------------|
| **Context7** | Consultado para documentação do Spring Boot 3.x e springdoc-openapi 2.x |

---

## Como a IA foi utilizada

1. **Plan Mode** — geração do `PLANO_IMPLEMENTACAO.md` ANTES de qualquer código
2. **Prompts RTCCO** — todos registrados em `prompts.md` com Role/Task/Context/Constraints/Output
3. **Decisões documentadas** — cada decisão técnica registrada em `DECISOES_ARQUITETURAIS.md`
4. **Contrato de I/O** — `relatorio-interacao-agentes.md` mantido atualizado entre agentes
5. **Anti-vibe** — toda linha de código gerada foi explicada pela equipe

---

## Conventional Commits — Histórico esperado

```
chore: setup inicial — estrutura Maven com src/back_end e src/front_end
docs: criar docs/c4model com 4 níveis do modelo C4
docs: criar PLANO_IMPLEMENTACAO.md (Plan Mode aprovado)
feat(back): criar Atendimento entity e Prioridade enum
feat(back): criar DTOs TriagemRequest e TriagemResponse
feat(back): criar AtendimentoRepository com query ordenada
feat(back): implementar ClassificadorPrioridade com algoritmo de 9 passos
feat(back): implementar TriagemService orquestrando classificação e persistência
feat(back): implementar TriagemController com POST e GET /api/triagem
docs(back): adicionar anotações Swagger em TriagemController
feat(front): criar index.html com formulário de triagem
feat(front): criar style.css com cores por prioridade
feat(front): criar app.js com chamadas fetch à API
test(back): adicionar testes unitários do ClassificadorPrioridade
test(back): adicionar testes de integração do TriagemController
docs: finalizar README e relatorio-interacao-agentes
```
