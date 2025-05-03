// Módulo de tratamento de erros
(function() {
    'use strict';

    // Namespace global
    window.SimuladorSplitPayment = window.SimuladorSplitPayment || {};
    
    // Classe de erro customizada
    class SimuladorError extends Error {
        constructor(mensagem, tipo, dados) {
            super(mensagem);
            this.name = "SimuladorError";
            this.tipo = tipo || "generic";
            this.dados = dados || {};
            this.timestamp = new Date();
        }
    }
    
    // Tipos de erro
    const TiposErro = {
        VALIDACAO: "validacao",
        CALCULO: "calculo",
        INTERFACE: "interface",
        CONFIGURACAO: "configuracao",
        DADOS: "dados",
        RENDERIZACAO: "renderizacao",
        EXPORTACAO: "exportacao"
    };
    
    // Função para tratamento global de erros
    function tratarErro(erro, contexto) {
        // Registrar erro
        console.error(`Erro [${contexto}]:`, erro);
        
        // Se for um erro do simulador, tratar de forma específica
        if (erro instanceof SimuladorError) {
            switch (erro.tipo) {
                case TiposErro.VALIDACAO:
                    exibirMensagemValidacao(erro);
                    break;
                case TiposErro.CALCULO:
                    exibirMensagemCalculo(erro);
                    break;
                case TiposErro.INTERFACE:
                case TiposErro.CONFIGURACAO:
                case TiposErro.DADOS:
                case TiposErro.RENDERIZACAO:
                case TiposErro.EXPORTACAO:
                    exibirMensagemGenerica(erro);
                    break;
                default:
                    exibirMensagemGenerica(erro);
            }
        } else {
            // Erro não categorizado
            exibirMensagemGenerica({
                message: erro.message || "Ocorreu um erro inesperado",
                tipo: "generic"
            });
        }
        
        // Opcionalmente, registrar erro em sistema de telemetria
        // enviarErroParaTelemetria(erro, contexto);
        
        return false; // Indicar que o erro foi tratado
    }
    
    // Funções auxiliares para exibição de mensagens
    function exibirMensagemValidacao(erro) {
        // Implementar exibição em campos de formulário
        const campo = erro.dados.campo;
        if (campo && document.getElementById(campo)) {
            const elemento = document.getElementById(campo);
            elemento.classList.add("error");
            
            // Adicionar mensagem de erro abaixo do campo
            const msgElemento = document.createElement("div");
            msgElemento.className = "error-message";
            msgElemento.textContent = erro.message;
            elemento.parentNode.insertBefore(msgElemento, elemento.nextSibling);
        } else {
            exibirMensagemGenerica(erro);
        }
    }
    
    function exibirMensagemCalculo(erro) {
        // Implementar exibição em área de resultados
        if (SimuladorSplitPayment.modalManager) {
            SimuladorSplitPayment.modalManager.mostrarModalErro("Erro de Cálculo", erro.message);
        } else {
            alert(`Erro de Cálculo: ${erro.message}`);
        }
    }
    
    function exibirMensagemGenerica(erro) {
        // Implementar exibição genérica
        if (SimuladorSplitPayment.modalManager) {
            SimuladorSplitPayment.modalManager.mostrarModalErro("Erro", erro.message);
        } else {
            alert(`Erro: ${erro.message}`);
        }
    }
    
    // Exportar funções e constantes
    SimuladorSplitPayment.errorHandler = {
        Error: SimuladorError,
        TiposErro: TiposErro,
        tratarErro: tratarErro
    };
})();
