/**
 * Aplicação Principal
 * Coordena a inicialização e o funcionamento da aplicação
 */
const App = {
    /**
     * Inicializa a aplicação
     */
    initialize: function() {
        console.log('Inicializando aplicação...');
        
        // Registrar manipuladores de erros globais
        this._registerErrorHandlers();
        
        // Verificar disponibilidade dos módulos essenciais
        const modulesAvailable = this._checkRequiredModules();
        
        if (!modulesAvailable) {
            console.error('Módulos essenciais não disponíveis. Carregando scripts dinamicamente...');
            
            // Carregar scripts dinamicamente
            if (typeof DependenciesConfig !== 'undefined') {
                DependenciesConfig.loadAllScripts().then(() => {
                    console.log('Scripts carregados dinamicamente. Reinicializando aplicação...');
                    this.initialize();
                }).catch(error => {
                    console.error('Erro ao carregar scripts:', error);
                    this._showErrorMessage('Erro ao carregar os componentes necessários. Recarregue a página e tente novamente.');
                });
                
                return;
            } else {
                console.error('DependenciesConfig não disponível. Não é possível carregar scripts dinamicamente.');
                this._showErrorMessage('Erro ao inicializar a aplicação. Alguns componentes essenciais não estão disponíveis.');
                return;
            }
        }
        
        // Inicializar componentes principais
        this._initializeComponents();
        
        // Restaurar estado anterior, se disponível
        this._restoreState();
        
        console.log('Aplicação inicializada com sucesso');
    },
    
    /**
     * Registra manipuladores de erros globais
     * @private
     */
    _registerErrorHandlers: function() {
        // Manipulador de erros não capturados
        window.onerror = (message, source, lineno, colno, error) => {
            console.error('Erro não capturado:', message, source, lineno, colno, error);
            
            // Exibir mensagem de erro
            this._showErrorMessage(`Ocorreu um erro: ${message}`);
            
            // Publicar evento de erro se EventBus estiver disponível
            if (typeof EventBus !== 'undefined') {
                EventBus.publish('erroNaoCapturado', {
                    message,
                    source,
                    lineno,
                    colno,
                    error
                });
            }
            
            return true; // Impedir comportamento padrão do erro
        };
        
        // Manipulador de rejeições de Promise não capturadas
        window.addEventListener('unhandledrejection', event => {
            console.error('Promise rejeitada não tratada:', event.reason);
            
            // Exibir mensagem de erro
            this._showErrorMessage(`Ocorreu um erro assíncrono: ${event.reason}`);
            
            // Publicar evento de erro se EventBus estiver disponível
            if (typeof EventBus !== 'undefined') {
                EventBus.publish('promiseRejeitada', {
                    reason: event.reason
                });
            }
        });
    },
    
    /**
     * Verifica se os módulos essenciais estão disponíveis
     * @private
     * @returns {boolean} - Se todos os módulos estão disponíveis
     */
    _checkRequiredModules: function() {
        const requiredModules = [
            { name: 'StateManager', available: typeof StateManager !== 'undefined' },
            { name: 'EventBus', available: typeof EventBus !== 'undefined' },
            { name: 'DOMUtils', available: typeof DOMUtils !== 'undefined' },
            { name: 'SimuladorFluxoCaixa', available: typeof SimuladorFluxoCaixa !== 'undefined' }
        ];
        
        const missingModules = requiredModules.filter(module => !module.available);
        
        if (missingModules.length > 0) {
            console.warn('Módulos essenciais não disponíveis:', missingModules.map(m => m.name).join(', '));
            return false;
        }
        
        return true;
    },
    
    /**
     * Inicializa os componentes principais da aplicação
     * @private
     */
    _initializeComponents: function() {
        // Inicializar gerenciador de estado e bus de eventos
        if (typeof StateManager !== 'undefined') {
            StateManager.loadFromLocalStorage();
        }
        
        // Inicializar gerenciador de abas
        if (typeof TabsManager !== 'undefined') {
            TabsManager.inicializar();
        }
        
        // Inicializar gerenciador de formulários
        if (typeof FormsManager !== 'undefined') {
            FormsManager.inicializar();
        }
        
        // Inicializar integrador de aplicação
        if (typeof AppIntegrator !== 'undefined') {
            AppIntegrator.initialize();
        } else {
            console.warn('AppIntegrator não disponível. Algumas funcionalidades podem não funcionar corretamente.');
        }
        
        // Registrar observadores de eventos
        this._registerEventObservers();
    },
    
    /**
     * Registra observadores de eventos
     * @private
     */
    _registerEventObservers: function() {
        if (typeof EventBus === 'undefined') return;
        
        // Observar evento de simulação concluída
        EventBus.subscribe('simulacaoConcluida', data => {
            console.log('Simulação concluída:', data);
            
            // Exibir mensagem de sucesso
            this._showSuccessMessage('Simulação concluída com sucesso');
        });
        
        // Observar evento de exportação solicitada
        EventBus.subscribe('exportacaoSolicitada', data => {
            console.log('Exportação solicitada:', data);
            
            // Exibir mensagem de sucesso
            this._showSuccessMessage(`Exportação para ${data.tipo} iniciada`);
        });
        
        // Observar evento de simulação de estratégias
        EventBus.subscribe('estrategiasSolicitadas', () => {
            // Verificar se há simulação prévia
            if (typeof StateManager !== 'undefined') {
                const interfaceState = StateManager.getState('interfaceState');
                if (!interfaceState || !interfaceState.simulacaoRealizada) {
                    this._showWarningMessage('É necessário realizar uma simulação principal antes de simular estratégias de mitigação');
                    
                    // Mudar para a aba de simulação
                    if (typeof TabsManager !== 'undefined') {
                        TabsManager.mudarPara('simulacao');
                    }
                    
                    // Cancelar o evento
                    return false;
                }
            }
        });
    },
    
    /**
     * Restaura o estado da aplicação
     * @private
     */
    _restoreState: function() {
        if (typeof StateManager === 'undefined') return;
        
        // Restaurar aba ativa
        const interfaceState = StateManager.getState('interfaceState');
        if (interfaceState && interfaceState.tabAtiva && typeof TabsManager !== 'undefined') {
            TabsManager.mudarPara(interfaceState.tabAtiva);
        }
        
        // Restaurar dados de formulário
        if (typeof DOMUtils !== 'undefined') {
            const empresa = StateManager.getState('empresa');
            if (empresa) {
                DOMUtils.setValue('empresa', empresa.nome || '');
                DOMUtils.setValue('setor', empresa.setor || '');
                DOMUtils.setValue('regime', empresa.regime || '');
                DOMUtils.setValue('faturamento', empresa.faturamento || 0);
                DOMUtils.setValue('margem', (empresa.margem || 0) * 100);
            }
            
            const cicloFinanceiro = StateManager.getState('cicloFinanceiro');
            if (cicloFinanceiro) {
                DOMUtils.setValue('pmr', cicloFinanceiro.pmr || 30);
                DOMUtils.setValue('pmp', cicloFinanceiro.pmp || 30);
                DOMUtils.setValue('pme', cicloFinanceiro.pme || 30);
                DOMUtils.setValue('perc-vista', (cicloFinanceiro.percVista || 0.3) * 100);
                DOMUtils.setValue('ciclo-financeiro', cicloFinanceiro.cicloFinanceiro || 30);
                DOMUtils.setValue('considerar-split', cicloFinanceiro.considerarSplit || false);
            }
            
            const parametrosFiscais = StateManager.getState('parametrosFiscais');
            if (parametrosFiscais) {
                DOMUtils.setValue('aliquota', (parametrosFiscais.aliquota || 0.265) * 100);
                DOMUtils.setValue('tipo-operacao', parametrosFiscais.tipoOperacao || 'b2b');
                DOMUtils.setValue('creditos', parametrosFiscais.creditos || 0);
            }
            
            const parametrosSimulacao = StateManager.getState('parametrosSimulacao');
            if (parametrosSimulacao) {
                DOMUtils.setValue('data-inicial', parametrosSimulacao.dataInicial || '2026-01-01');
                DOMUtils.setValue('data-final', parametrosSimulacao.dataFinal || '2033-12-31');
                DOMUtils.setValue('cenario', parametrosSimulacao.cenario || 'moderado');
                DOMUtils.setValue('taxa-crescimento', (parametrosSimulacao.taxaCrescimento || 0.05) * 100);
            }
        }
    },
    
    /**
     * Exibe uma mensagem de erro
     * @private
     * @param {string} message - Mensagem de erro
     */
    _showErrorMessage: function(message) {
        if (typeof DOMUtils !== 'undefined') {
            DOMUtils.notify(message, 'error');
        } else {
            alert(message);
        }
    },
    
    /**
     * Exibe uma mensagem de sucesso
     * @private
     * @param {string} message - Mensagem de sucesso
     */
    _showSuccessMessage: function(message) {
        if (typeof DOMUtils !== 'undefined') {
            DOMUtils.notify(message, 'success');
        } else {
            console.log(message);
        }
    },
    
    /**
     * Exibe uma mensagem de alerta
     * @private
     * @param {string} message - Mensagem de alerta
     */
    _showWarningMessage: function(message) {
        if (typeof DOMUtils !== 'undefined') {
            DOMUtils.notify(message, 'warning');
        } else {
            alert(message);
        }
    }
};

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar com um pequeno atraso para garantir que todos os scripts foram carregados
    setTimeout(function() {
        App.initialize();
    }, 500);
});

// Em app.js, adicione um sistema de tratamento de erros global
(function() {
    // Captador de erros global
    window.onerror = function(mensagem, arquivo, linha, coluna, erro) {
        console.error('Erro global capturado:', {
            mensagem: mensagem,
            arquivo: arquivo,
            linha: linha,
            coluna: coluna,
            erro: erro
        });
        
        // Verificar se o erro já foi tratado
        if (erro && erro.tratado) {
            return true;
        }
        
        // Exibir mensagem ao usuário
        mostrarErro(mensagem);
        
        // Marcar como tratado para evitar duplicação
        if (erro) {
            erro.tratado = true;
        }
        
        return true; // Impede propagação do erro
    };
    
    // Função para exibir mensagens de erro
    function mostrarErro(mensagem) {
        // Verificar se já existe um container de erro
        let containerErro = document.getElementById('container-erro-global');
        
        if (!containerErro) {
            containerErro = document.createElement('div');
            containerErro.id = 'container-erro-global';
            containerErro.className = 'erro-global';
            containerErro.style.position = 'fixed';
            containerErro.style.top = '10px';
            containerErro.style.right = '10px';
            containerErro.style.backgroundColor = '#f8d7da';
            containerErro.style.color = '#721c24';
            containerErro.style.padding = '10px';
            containerErro.style.borderRadius = '5px';
            containerErro.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.2)';
            containerErro.style.zIndex = '9999';
            
            document.body.appendChild(containerErro);
        }
        
        // Limitar a quantidade de erros exibidos
        if (containerErro.children.length >= 3) {
            containerErro.removeChild(containerErro.firstChild);
        }
        
        // Criar mensagem de erro
        const msgErro = document.createElement('div');
        msgErro.textContent = mensagem;
        msgErro.style.marginBottom = '5px';
        msgErro.style.padding = '5px';
        msgErro.style.borderBottom = '1px solid #ddd';
        
        // Adicionar botão para fechar
        const btnFechar = document.createElement('span');
        btnFechar.textContent = '×';
        btnFechar.style.float = 'right';
        btnFechar.style.cursor = 'pointer';
        btnFechar.style.marginLeft = '10px';
        btnFechar.onclick = function() {
            containerErro.removeChild(msgErro);
            
            // Se não houver mais mensagens, remover o container
            if (containerErro.children.length === 0) {
                document.body.removeChild(containerErro);
            }
        };
        
        msgErro.appendChild(btnFechar);
        containerErro.appendChild(msgErro);
        
        // Auto-remover após 10 segundos
        setTimeout(function() {
            if (msgErro.parentNode === containerErro) {
                containerErro.removeChild(msgErro);
                
                // Se não houver mais mensagens, remover o container
                if (containerErro.children.length === 0) {
                    document.body.removeChild(containerErro);
                }
            }
        }, 10000);
    }
    
    // Adicionar tratamento para Promises não tratadas
    window.addEventListener('unhandledrejection', function(event) {
        console.error('Promise não tratada:', event.reason);
        mostrarErro(`Erro assíncrono: ${event.reason.message || 'Promise não tratada'}`);
        
        // Marcar como tratado
        event.preventDefault();
    });
    
    console.log('Sistema de tratamento de erros global inicializado');
})();