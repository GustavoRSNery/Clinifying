package com.hackathon.triagem.repository;

import com.hackathon.triagem.model.Atendimento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

/**
 * Interface JPA Repository para a entidade Atendimento.
 * Spring Data gera automaticamente a implementação em runtime.
 * Herda: save(), findAll(), findById(), deleteById(), count() etc.
 */
public interface AtendimentoRepository extends JpaRepository<Atendimento, Long> {

    /**
     * Retorna todos os atendimentos ordenados por prioridade (URGENTE primeiro)
     * e por timestamp dentro da mesma prioridade (mais antigo primeiro).
     *
     * CASE WHEN é necessário porque JPQL não suporta chamar getOrdem() do enum
     * diretamente na cláusula ORDER BY.
     */
    @Query("""
            SELECT a FROM Atendimento a
            ORDER BY
                CASE a.prioridade
                    WHEN 'URGENTE' THEN 4
                    WHEN 'ALTA'    THEN 3
                    WHEN 'MEDIA'   THEN 2
                    ELSE                1
                END DESC,
                a.timestamp ASC
            """)
    List<Atendimento> findAllOrdenadosPorPrioridade();
}
