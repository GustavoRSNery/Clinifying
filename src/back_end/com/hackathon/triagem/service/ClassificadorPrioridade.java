package com.hackathon.triagem.service;

import com.hackathon.triagem.dto.TriagemRequest;
import com.hackathon.triagem.model.Prioridade;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Encapsula todo o algoritmo de classificação de prioridade.
 * Responsabilidade única (SRP): nenhuma outra classe conhece estas regras.
 * Sem dependências externas — testável sem contexto Spring.
 */
@Component
public class ClassificadorPrioridade {

    // Lista imutável de palavras-chave que indicam risco de vida imediato
    private static final List<String> PALAVRAS_CHAVE_URGENTE = List.of(
            "dor no peito", "falta de ar", "desmaio", "avc",
            "acidente vascular", "convulsão", "convulsao", "parada",
            "infarto", "hemorragia", "inconsciente", "inconsciência",
            "trauma", "overdose", "intoxicação", "intoxicacao"
    );

    /**
     * Algoritmo de 9 passos — ordem importa: critérios mais graves verificados primeiro.
     * Retorna o primeiro nível de prioridade que se aplica ao perfil do paciente.
     */
    public Prioridade classificar(TriagemRequest request) {

        // Passo 1: motivo contém palavra-chave de risco de vida → URGENTE imediato
        if (isUrgentePorPalavraChave(request.motivoPrincipal())) {
            return Prioridade.URGENTE;
        }

        // Passo 2: idoso (70+) com múltiplas comorbidades → risco composto elevado
        if (request.idade() >= 70 && request.numeroComorbidades() >= 2) {
            return Prioridade.URGENTE;
        }

        // Passo 3: 3 ou mais comorbidades ativas → carga clínica alta
        if (request.numeroComorbidades() >= 3) {
            return Prioridade.ALTA;
        }

        // Passo 4: 2 ou mais internações anteriores → histórico de agravamentos
        if (request.historicoInternacoes() >= 2) {
            return Prioridade.ALTA;
        }

        // Passo 5: idoso (60+) com ao menos uma comorbidade → vulnerabilidade composta
        if (request.idade() >= 60 && request.numeroComorbidades() >= 1) {
            return Prioridade.ALTA;
        }

        // Passo 6: ao menos uma comorbidade ativa → necessita atenção
        if (request.numeroComorbidades() >= 1) {
            return Prioridade.MEDIA;
        }

        // Passo 7: algum histórico de internação → não é primeiro episódio
        if (request.historicoInternacoes() >= 1) {
            return Prioridade.MEDIA;
        }

        // Passo 8: idoso sem comorbidades → grupo de risco por faixa etária
        if (request.idade() >= 60) {
            return Prioridade.MEDIA;
        }

        // Passo 9: caso base — paciente jovem, sem comorbidades, motivo não crítico
        return Prioridade.BAIXA;
    }

    // Verifica se o motivo (case-insensitive) contém alguma palavra-chave de urgência
    private boolean isUrgentePorPalavraChave(String motivo) {
        String motivoLower = motivo.toLowerCase();
        return PALAVRAS_CHAVE_URGENTE.stream().anyMatch(motivoLower::contains);
    }
}
