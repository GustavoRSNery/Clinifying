package com.hackathon.triagem.controller;

import com.hackathon.triagem.dto.TriagemRequest;
import com.hackathon.triagem.dto.TriagemResponse;
import com.hackathon.triagem.model.Atendimento;
import com.hackathon.triagem.service.TriagemService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/triagem")
@Tag(name = "Triagem", description = "API de triagem assistida por IA — classifica prioridade de atendimento clínico")
public class TriagemController {

    private final TriagemService triagemService;

    // Injeção via construtor (sem @Autowired — boa prática Spring)
    public TriagemController(TriagemService triagemService) {
        this.triagemService = triagemService;
    }

    /**
     * Registra um novo atendimento e retorna a prioridade classificada.
     * POST /api/triagem
     */
    @PostMapping
    @Operation(summary = "Registrar triagem de paciente",
               description = "Recebe os dados do paciente, classifica a prioridade e persiste no banco H2.")
    @ApiResponse(responseCode = "201", description = "Triagem registrada com sucesso")
    @ApiResponse(responseCode = "400", description = "Dados inválidos na requisição")
    public ResponseEntity<TriagemResponse> registrarTriagem(@Valid @RequestBody TriagemRequest request) {
        TriagemResponse response = triagemService.registrarTriagem(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Lista todos os atendimentos ordenados por prioridade (urgente primeiro).
     * GET /api/triagem
     */
    @GetMapping
    @Operation(summary = "Listar fila de atendimento",
               description = "Retorna todos os atendimentos ordenados por prioridade (URGENTE → ALTA → MEDIA → BAIXA) e timestamp.")
    @ApiResponse(responseCode = "200", description = "Lista de atendimentos retornada com sucesso")
    public ResponseEntity<List<Atendimento>> listarTriagens() {
        return ResponseEntity.ok(triagemService.listarTriagens());
    }
}
