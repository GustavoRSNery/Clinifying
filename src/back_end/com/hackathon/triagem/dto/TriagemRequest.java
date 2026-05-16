package com.hackathon.triagem.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * DTO de entrada — recebido pelo TriagemController via POST /api/triagem.
 * Record Java 16+: imutável, sem boilerplate, validado com Bean Validation.
 */
public record TriagemRequest(

        @NotBlank(message = "Nome é obrigatório")
        String nome,

        @NotNull(message = "Idade é obrigatória")
        @Min(value = 0, message = "Idade não pode ser negativa")
        Integer idade,

        String genero,

        @NotBlank(message = "Motivo principal é obrigatório")
        String motivoPrincipal,

        @NotNull(message = "Número de comorbidades é obrigatório")
        @Min(value = 0, message = "Número de comorbidades não pode ser negativo")
        Integer numeroComorbidades,

        @NotNull(message = "Histórico de internações é obrigatório")
        @Min(value = 0, message = "Histórico de internações não pode ser negativo")
        Integer historicoInternacoes
) {}
