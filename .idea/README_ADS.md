# Hackathon ADS — Sistema de Triagem Assistida por IA
 
> **O objetivo é demonstrar domínio da metodologia ensinada no bootcamp:** planejar antes de codar (Plan Mode), estruturar prompts (RTCCO), manter contexto persistente (`.cursorrules` + decisões), garantir contratos entre agentes, validar com MCPs reais e sustentar tecnicamente o código gerado.
>
> **A IA é assistente — quem dirige o processo é a equipe.**
 
---
 
## O problema
Construir uma aplicação funcional que integre agentes de IA para realizar classificação de prioridade de encaminhamento clínico a partir do perfil do paciente e do motivo de procura por atendimento:

- Recebe idade, gênero, motivo principal do atendimento, número de comorbidades ativas  e histórico de internações
- Classifica prioridade em: baixa, media, alta, urgente
- Persiste o atendimento (paciente + entrada + classificação + timestamp) no H2
- Documenta a API com Swagger

---

## Dataset
Link: https://drive.google.com/drive/folders/1HoglMyhBA3SgcrDTRXR5SxaOnU409bjI?usp=sharing

 
## Stack técnica obrigatória
 
A equipe deve usar a mesma stack apresentada no bootcamp ADS:
 
- **Backend:** Java 21 + Spring Boot 3.x
- **Build:** Maven
- **Banco:** H2 in-memory (com persistência via JPA)
- **Documentação:** springdoc-openapi (Swagger UI)
- **Frontend:** HTML + CSS + JavaScript puro (sem frameworks)
- **Formato de troca:** JSON
---
 
## Produto mínimo esperado
 
A aplicação deve conter:
 
**1. Interface simples**
 
**2. API**
 
- Recebe os dados
- Retorna prioridade
- Documentação da API no Swagger
  
**3. Base de dados**
 
---
 
## Os agentes obrigatórios
 
A equipe deve usar **no mínimo dois agentes** com papéis distintos. Recomenda-se **três**.
 
| # | Agente | Responsabilidade | Lê | Produz |
|---|--------|------------------|----|--------|
| 1 | **Backend** | API de triagem em Spring Boot | `prd.md`, `.cursorrules`, `master_table.csv` | código backend, Swagger |
| 2 | **Frontend** | Interface HTML/CSS/JS pura | API rodando, Swagger, `.cursorrules` | código frontend, README |
 
> **+ 5 pontos** por cada agente extra REALMENTE útil.
 
---
 
## Entregáveis obrigatórios
 
1. `prd.md` em formato RTCCO
 
2. `PLANO_IMPLEMENTACAO.md` (gerado em Plan Mode)
 
3. `.cursorrules` com regras do projeto
 
4. `DECISOES_ARQUITETURAIS.md` (arquivo vivo)
 
5. `prompts.md` com TODOS os prompts em RTCCO
 
6. Código funcional do backend e frontend
 
- Backend Spring Boot que roda com `mvn spring-boot:run`
- Swagger UI acessível em `http://localhost:8080/swagger-ui.html`
- H2 console em `http://localhost:8080/h2-console`
- Frontend acessível em `http://localhost:8080/`
- Persistência funcionando
  
7. `relatorio-interacao-agentes.md`
 
- Contrato I/O entre os agentes:
  - Agente Backend → Agente Frontend
  - O que o backend produz
  - O que o frontend consome
    
8. `README.md`
 
- Como rodar
- MCPs utilizados
- Como a IA foi utilizada
  
## Git com Conventional Commits
 
Os commits do repositório devem seguir o padrão de exemplo:
 
- `chore: setup inicial do projeto`
- `docs: criar prd.md e .cursorrules`
- `docs: criar PLANO_IMPLEMENTACAO.md (Plan Mode aprovado)`
- `feat: criar Paciente entity e Repository`
- `feat: implementar TriagemService com regras de prioridade`
- `feat: implementar POST /triagem com validação`
- `test: adicionar testes do TriagemService`
- `docs: adicionar Swagger annotations`
- `feat: criar frontend index.html com formulário`
- `fix: corrigir CORS para permitir frontend`
- `docs: atualizar DECISOES_ARQUITETURAIS após CORS`
> O jurado vai rodar `git log --oneline` no repositório. Histórico desorganizado ou commits genéricos (`update`, `fix bug`) perde pontos.
 
---
 
## Pitch (5 minutos)
 
---
 
## Critérios de avaliação (100 pontos)
 
| Critério | Peso | O que avalia |
|----------|------|--------------|
| **Aplicação do RTCCO em prompts** | 15 pts | Todo prompt em `prompts.md` segue Role/Task/Context/Constraints/Output |
| **Plan Mode aplicado** | 10 pts | `PLANO_IMPLEMENTACAO.md` existe e foi gerado ANTES do código |
| **`.cursorrules` + DECISOES** | 10 pts | Knowledge base organizada, decisões documentadas (não silenciosas) |
| **Contrato de I/O entre agentes** | 10 pts | `relatorio-interacao-agentes.md` claro, frontend consome backend sem hacks |
| **Uso real de MCPs** | 10 pts | Context7 ativo durante a demo, não só citado |
| **Sustentação técnica (anti-vibe)** | 15 pts | Equipe explica trechos do código sob demanda |
| **Funcionamento + Swagger** | 15 pts | App roda, Swagger UI acessível, persistência funciona |
| **Documentação** | 10 pts | README claro, `prd.md` em RTCCO, estrutura de pastas correta |
| **Conventional Commits + Git** | 5 pts | `git log` mostra disciplina, mensagens descritivas |
| **Total** | **100 pts** | — |
 
---
 
## Penalidades
 
| Comportamento | Penalidade |
|---------------|------------|
| Stack diferente da definida (sem aprovação) | −20 pts |
| Código gerado **antes** do `PLANO_IMPLEMENTACAO.md` | −10 pts (perde Plan Mode) |
| Prompts em `prompts.md` fora do RTCCO | −10 pts (perde RTCCO) |
| Integrante não consegue explicar trecho de código que escolheu | −5 pts cada (max 15) |
| Commits genéricos (`update`, `fix`) sem padrão | −5 pts |
 
---
 
## Antipadrões a evitar 
 
| Antipadrão | Como evitar |
|------------|-------------|
| Pular Plan Mode e ir direto codar | Forçar geração do `PLANO_IMPLEMENTACAO.md` antes de qualquer código |
| Prompts genéricos ("crie uma API") | Sempre usar RTCCO com constraints negativas |
| Aceitar primeira resposta da IA | Iterar, testar, refinar — registrar iterações em `prompts.md` |
| Não documentar decisões | Atualizar `DECISOES_ARQUITETURAIS.md` em cada mudança |
| IA criar arquivos com nomes inventados | `.cursorrules` com proibições explícitas |
| Commit genérico ao final | Commitar a cada feature pequena, com Conventional Commits |
| "Vibe-coding" — código que ninguém entende | Antes de cada commit, integrante deve explicar para outro |
 
---
 
## Regra de ouro do hackathon
 
> **Nenhum código que vocês não conseguem explicar vai para o repositório.**
>
> Se o jurado apontar uma linha e perguntar _"por que isso?"_, a equipe precisa saber responder.
 
---
 
## Aviso ético
 
- O sistema desenvolvido é **demonstrativo**, NÃO deve ser usado em ambiente clínico real.
- Os dados em `master_table.csv` são **fictícios** — qualquer semelhança com pessoas reais é coincidência.
- Triagem médica real requer profissional habilitado, não IA assistida.
- Nenhuma equipe deve coletar dados pessoais reais durante o hackathon.
---
 
> _"O objetivo não é premiar quem programou mais, mas quem melhor conduziu o desenvolvimento assistido por IA, aplicando a metodologia treinada no bootcamp."_
