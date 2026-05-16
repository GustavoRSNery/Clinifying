package com.hackathon.triagem.service;

import com.hackathon.triagem.dto.TriagemRequest;
import com.hackathon.triagem.dto.TriagemResponse;
import com.hackathon.triagem.model.Atendimento;
import com.hackathon.triagem.model.Prioridade;
import com.hackathon.triagem.repository.AtendimentoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Orquestrador da operação de triagem.
 * Responsabilidade: coordenar ClassificadorPrioridade + AtendimentoRepository.
 * NÃO contém regras de negócio — delega ao ClassificadorPrioridade.
 */
@Service
public class TriagemService {

    private final AtendimentoRepository repository;
    private final ClassificadorPrioridade classificador;

    // Injeção via construtor — sem @Autowired (boa prática e testabilidade)
    public TriagemService(AtendimentoRepository repository, ClassificadorPrioridade classificador) {
        this.repository = repository;
        this.classificador = classificador;
    }

    /**
     * Registra um novo atendimento:
     * 1. Classifica a prioridade via ClassificadorPrioridade
     * 2. Monta a entidade Atendimento com timestamp automático
     * 3. Persiste no H2 via JPA
     * 4. Retorna o DTO de resposta com id gerado
     */
    @Transactional
    public TriagemResponse registrarTriagem(TriagemRequest request) {
        Prioridade prioridade = classificador.classificar(request);
        Atendimento atendimento = mapearParaEntidade(request, prioridade);
        Atendimento salvo = repository.save(atendimento);
        return mapearParaResponse(salvo);
    }

    /**
     * Lista todos os atendimentos ordenados por prioridade (urgente primeiro)
     * e por timestamp dentro da mesma prioridade (mais antigo primeiro).
     * Ordenação via JPQL CASE WHEN no repositório.
     */
    public List<Atendimento> listarTriagens() {
        return repository.findAllOrdenadosPorPrioridade();
    }

    // Monta a entidade JPA a partir do DTO de entrada + prioridade calculada
    private Atendimento mapearParaEntidade(TriagemRequest request, Prioridade prioridade) {
        Atendimento atendimento = new Atendimento();
        atendimento.setNome(request.nome());
        atendimento.setIdade(request.idade());
        atendimento.setGenero(request.genero());
        atendimento.setMotivoPrincipal(request.motivoPrincipal());
        atendimento.setNumeroComorbidades(request.numeroComorbidades());
        atendimento.setHistoricoInternacoes(request.historicoInternacoes());
        atendimento.setPrioridade(prioridade);
        atendimento.setTimestamp(LocalDateTime.now());
        return atendimento;
    }

    // Monta o DTO de saída a partir da entidade persistida (com id gerado)
    private TriagemResponse mapearParaResponse(Atendimento atendimento) {
        return new TriagemResponse(
                atendimento.getId(),
                atendimento.getNome(),
                atendimento.getPrioridade(),
                atendimento.getTimestamp()
        );
    }
}
