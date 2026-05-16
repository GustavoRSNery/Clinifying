package com.hackathon.triagem.model;

/**
 * Níveis de prioridade do Protocolo de Manchester simplificado.
 * A ordem numérica (getOrdem) é usada pelo repositório na query CASE WHEN.
 */
public enum Prioridade {

    BAIXA(1),
    MEDIA(2),
    ALTA(3),
    URGENTE(4);

    private final int ordem;

    Prioridade(int ordem) {
        this.ordem = ordem;
    }

    public int getOrdem() {
        return ordem;
    }
}
