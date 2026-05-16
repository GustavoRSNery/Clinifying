package com.hackathon.triagem.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Entidade JPA que representa um atendimento de triagem.
 * Mapeada para a tabela ATENDIMENTO no H2 (create-drop).
 */
@Entity
@Table(name = "atendimento")
public class Atendimento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nome;

    @Column(nullable = false)
    private Integer idade;

    private String genero;

    @Column(name = "motivo_principal", nullable = false)
    private String motivoPrincipal;

    @Column(name = "numero_comorbidades", nullable = false)
    private Integer numeroComorbidades;

    @Column(name = "historico_internacoes", nullable = false)
    private Integer historicoInternacoes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Prioridade prioridade;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    // Construtor padrão exigido pelo JPA
    public Atendimento() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }

    public Integer getIdade() { return idade; }
    public void setIdade(Integer idade) { this.idade = idade; }

    public String getGenero() { return genero; }
    public void setGenero(String genero) { this.genero = genero; }

    public String getMotivoPrincipal() { return motivoPrincipal; }
    public void setMotivoPrincipal(String motivoPrincipal) { this.motivoPrincipal = motivoPrincipal; }

    public Integer getNumeroComorbidades() { return numeroComorbidades; }
    public void setNumeroComorbidades(Integer numeroComorbidades) { this.numeroComorbidades = numeroComorbidades; }

    public Integer getHistoricoInternacoes() { return historicoInternacoes; }
    public void setHistoricoInternacoes(Integer historicoInternacoes) { this.historicoInternacoes = historicoInternacoes; }

    public Prioridade getPrioridade() { return prioridade; }
    public void setPrioridade(Prioridade prioridade) { this.prioridade = prioridade; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
}
