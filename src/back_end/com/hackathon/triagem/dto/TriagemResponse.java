package com.hackathon.triagem.dto;

import com.hackathon.triagem.model.Prioridade;
import java.time.LocalDateTime;

/**
 * DTO de saída — retornado pelo TriagemController após registrar ou listar.
 * Record imutável com os dados essenciais do atendimento criado.
 */
public record TriagemResponse(
        Long id,
        String nome,
        Prioridade prioridade,
        LocalDateTime timestamp
) {}
