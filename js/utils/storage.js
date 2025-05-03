// Utilitários de armazenamento
(function() {
    'use strict';
    
    // Namespace global
    window.SimuladorSplitPayment = window.SimuladorSplitPayment || {};
    
    // Salvar estado da simulação
    function salvarEstado(dados) {
        try {
            localStorage.setItem('simuladorEstado', JSON.stringify(dados));
            return true;
        } catch (error) {
            console.error("Erro ao salvar estado:", error);
            return false;
        }
    }
    
    // Carregar estado da simulação
    function carregarEstado() {
        try {
            const estadoSalvo = localStorage.getItem('simuladorEstado');
            if (!estadoSalvo) {
                return null;
            }
            
            return JSON.parse(estadoSalvo);
        } catch (error) {
            console.error("Erro ao carregar estado:", error);
            return null;
        }
    }
    
    // Limpar estado salvo
    function limparEstado() {
        try {
            localStorage.removeItem('simuladorEstado');
            return true;
        } catch (error) {
            console.error("Erro ao limpar estado:", error);
            return false;
        }
    }
    
    // Salvar simulação com nome
    function salvarSimulacao(nome, dados) {
        try {
            // Obter lista de simulações salvas
            const listaSimulacoes = obterListaSimulacoes();
            
            // Adicionar/atualizar simulação
            listaSimulacoes[nome] = {
                data: new Date().toISOString(),
                dados: dados
            };
            
            // Salvar lista atualizada
            localStorage.setItem('simuladorSimulacoesSalvas', JSON.stringify(listaSimulacoes));
            
            return true;
        } catch (error) {
            console.error("Erro ao salvar simulação:", error);
            return false;
        }
    }
    
    // Carregar simulação por nome
    function carregarSimulacao(nome) {
        try {
            const listaSimulacoes = obterListaSimulacoes();
            
            if (!listaSimulacoes[nome]) {
                return null;
            }
            
            return listaSimulacoes[nome].dados;
        } catch (error) {
            console.error("Erro ao carregar simulação:", error);
            return null;
        }
    }
    
    // Excluir simulação por nome
    function excluirSimulacao(nome) {
        try {
            const listaSimulacoes = obterListaSimulacoes();
            
            if (!listaSimulacoes[nome]) {
                return false;
            }
            
            delete listaSimulacoes[nome];
            
            localStorage.setItem('simuladorSimulacoesSalvas', JSON.stringify(listaSimulacoes));
            
            return true;
        } catch (error) {
            console.error("Erro ao excluir simulação:", error);
            return false;
        }
    }
    
    // Obter lista de simulações salvas
    function obterListaSimulacoes() {
        try {
            const lista = localStorage.getItem('simuladorSimulacoesSalvas');
            
            if (!lista) {
                return {};
            }
            
            return JSON.parse(lista);
        } catch (error) {
            console.error("Erro ao obter lista de simulações:", error);
            return {};
        }
    }
    
    // Exportar funções
    SimuladorSplitPayment.storage = {
        salvarEstado: salvarEstado,
        carregarEstado: carregarEstado,
        limparEstado: limparEstado,
        salvarSimulacao: salvarSimulacao,
        carregarSimulacao: carregarSimulacao,
        excluirSimulacao: excluirSimulacao,
        obterListaSimulacoes: obterListaSimulacoes
    };
})();
