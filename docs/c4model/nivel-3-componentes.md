# C4 Model — Nível 3: Diagrama de Componentes
**Sistema:** Clinifying — Sistema de Triagem Assistida por IA  
**Nível:** 3 de 4  
**Contêiner em foco:** Backend API (`src/back_end/`)  
**Pergunta respondida:** Quais são os componentes dentro do Backend API e como eles se relacionam?

> Abrimos o contêiner **Backend API** do Nível 2.  
> Cada componente corresponde a uma classe ou interface Java com responsabilidade única (SOLID — SRP).

---

## Diagrama

```mermaid
graph TD
    FE["«container»\nFrontend Web\n[src/front_end/]"]

    subgraph BACKEND["Backend API — src/back_end/com/hackathon/triagem/"]

        subgraph CTRL_LAYER["controller/"]
            CTRL["«component»\nTriagemController\n[REST Controller + @Valid]\n─────────────────\nExpõe endpoints HTTP.\nValida entrada com Bean Validation.\nDelega ao TriagemService.\nResponde com HTTP status correto."]
        end

        subgraph SVC_LAYER["service/"]
            SVC["«component»\nTriagemService\n[Service — Orquestrador]\n─────────────────\nNão contém regras de negócio.\nOrquestra: classifica → monta\nentidade → persiste → retorna DTO."]
            CLASS["«component»\nClassificadorPrioridade\n[Service — Business Logic]\n─────────────────\nÚnica classe que conhece\nregras de prioridade.\nAlgoritmo de 9 passos.\nSem dependências externas."]
        end

        subgraph REPO_LAYER["repository/"]
            REPO["«component»\nAtendimentoRepository\n[JPA Repository — Interface]\n─────────────────\nHerda JpaRepository.\nSpring Data gera SQL via ORM.\nQuery ordenada por prioridade."]
        end

        subgraph MODEL_LAYER["model/"]
            ENT["«component»\nAtendimento\n[JPA Entity]\n─────────────────\nMapeada para tabela H2.\nContém todos os campos\ndo atendimento + timestamp."]
            PRIO["«component»\nPrioridade\n[Enum]\n─────────────────\nBaixA | MEDIA | ALTA | URGENTE\n+ campo ordem para sort."]
        end

        subgraph DTO_LAYER["dto/"]
            REQ["«component»\nTriagemRequest\n[Record + Bean Validation]\n─────────────────\nPayload de entrada.\nAnotações @NotBlank, @Min."]
            RESP["«component»\nTriagemResponse\n[Record]\n─────────────────\nPayload de saída.\nid + nome + prioridade\n+ timestamp."]
        end

    end

    DB[("«container»\nH2 Database\n[ORM via Hibernate]")]

    FE -- "POST/GET /api/triagem\n[JSON]" --> CTRL
    CTRL -- "usa @Valid\ndelega" --> SVC
    CTRL -- "recebe" --> REQ
    CTRL -- "retorna" --> RESP
    SVC -- "delega classificação" --> CLASS
    SVC -- "persiste e consulta" --> REPO
    SVC -- "cria / lê" --> ENT
    CLASS -- "retorna" --> PRIO
    ENT -- "tem" --> PRIO
    REPO -- "ORM / SQL gerado\npelo Hibernate" --> DB

    style CTRL fill:#85BBF0,stroke:#5d82a8
    style SVC fill:#85BBF0,stroke:#5d82a8
    style CLASS fill:#85BBF0,stroke:#5d82a8
    style REPO fill:#85BBF0,stroke:#5d82a8
    style ENT fill:#85BBF0,stroke:#5d82a8
    style PRIO fill:#85BBF0,stroke:#5d82a8
    style REQ fill:#85BBF0,stroke:#5d82a8
    style RESP fill:#85BBF0,stroke:#5d82a8
    style FE fill:#1168BD,color:#fff,stroke:#0b4f9f
    style DB fill:#1168BD,color:#fff,stroke:#0b4f9f
```

---

## Descrição dos componentes

### Camada: controller/

| Componente | Arquivo | Responsabilidade SOLID |
|-----------|---------|----------------------|
| `TriagemController` | `TriagemController.java` | **S** — recebe HTTP, valida, delega, responde. Zero lógica de negócio. |

### Camada: service/

| Componente | Arquivo | Responsabilidade SOLID |
|-----------|---------|----------------------|
| `TriagemService` | `TriagemService.java` | **S** — orquestra a operação. Não sabe como classificar, não sabe como persistir. Apenas coordena. |
| `ClassificadorPrioridade` | `ClassificadorPrioridade.java` | **S** — única responsabilidade: aplicar o algoritmo de 9 passos. **O** — pode ser estendido via herança/interface se novas regras surgirem. |

### Camada: repository/

| Componente | Arquivo | Responsabilidade SOLID |
|-----------|---------|----------------------|
| `AtendimentoRepository` | `AtendimentoRepository.java` | **I** — interface enxuta com apenas o método de consulta adicional. **D** — `TriagemService` depende desta interface, não de uma implementação concreta. |

### Camada: model/

| Componente | Arquivo | Responsabilidade SOLID |
|-----------|---------|----------------------|
| `Atendimento` | `Atendimento.java` | **S** — portador de dados persistido. Sem lógica de negócio. |
| `Prioridade` | `Prioridade.java` | **S** — enum que representa domínio e carrega ordenação. |

### Camada: dto/

| Componente | Arquivo | Responsabilidade SOLID |
|-----------|---------|----------------------|
| `TriagemRequest` | `TriagemRequest.java` | **S** — portador de dados de entrada com validação declarativa. |
| `TriagemResponse` | `TriagemResponse.java` | **S** — portador de dados de saída. Imutável (record). |

---

## Princípios SOLID aplicados

| Princípio | Como se aplica neste módulo |
|-----------|----------------------------|
| **S** — Single Responsibility | Cada classe tem exatamente uma razão para mudar |
| **O** — Open/Closed | `ClassificadorPrioridade` pode ser estendido com subclasses sem modificar o `TriagemService` |
| **L** — Liskov Substitution | `AtendimentoRepository` é interface — qualquer implementação JPA é substituível |
| **I** — Interface Segregation | Repository tem interface mínima — sem métodos desnecessários |
| **D** — Dependency Inversion | `TriagemService` injeta interfaces, não classes concretas |

---

## Fluxo interno: POST /api/triagem

```
TriagemController
    │  recebe TriagemRequest (validado por @Valid)
    ▼
TriagemService.registrarTriagem(request)
    │
    ├─ 1. ClassificadorPrioridade.classificar(request)
    │       ├─ isUrgente()? → palavra-chave OU (idade≥70 e comorbidades≥2)
    │       ├─ isAlta()?    → 3+ comorbidades OU 2+ internações OU (60+ e 1+ comorbidades)
    │       ├─ isMedia()?   → 1-2 comorbidades OU 1 internação OU 60+ sem comorbidades
    │       └─ else         → BAIXA
    │       → retorna Prioridade
    │
    ├─ 2. monta Atendimento(request fields + prioridade + LocalDateTime.now())
    │
    ├─ 3. AtendimentoRepository.save(atendimento)
    │       → Hibernate gera INSERT INTO ATENDIMENTO ...
    │       → retorna Atendimento com id preenchido
    │
    └─ 4. monta TriagemResponse(id, nome, prioridade, timestamp)
           → retorna ao Controller → 201 Created
```

---

## Navegação do C4 Model

| Nível | Arquivo | Pergunta respondida |
|-------|---------|-------------------|
| 1 — Contexto | [nivel-1-contexto.md](nivel-1-contexto.md) | Quem usa e quais sistemas externos? |
| 2 — Contêineres | [nivel-2-containers.md](nivel-2-containers.md) | O que está dentro do sistema? |
| **3 — Componentes** | `nivel-3-componentes.md` ← *você está aqui* | O que está dentro do Backend API? |
| 4 — Código | [nivel-4-codigo.md](nivel-4-codigo.md) | Como as classes se relacionam? |
