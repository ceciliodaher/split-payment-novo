/**
 * SimuladorRepository - Repositório centralizado para o simulador
 * Versão: 1.0.0
 * Serve como única fonte de verdade para os dados de simulação
 */
const SimuladorRepository = (function() {
    // Dados salvos pelo usuário
    let _data = {};
    
    // Estrutura inicial dos dados
    function _getEstruturaInicial() {
        return {
            empresa: {
                nome: '',
                setor: '',
                regime: '',
                faturamento: 0,
                margem: 0.15
            },
            cicloFinanceiro: {
                pmr: 30,
                pmp: 30,
                pme: 30,
                percVista: 0.3,
                percPrazo: 0.7,
                considerarSplit: false
            },
            parametrosFiscais: {
                aliquota: 0.265,
                tipoOperacao: 'b2b',
                creditos: 0,
                compensacao: 'automatica'
            },
            parametrosSimulacao: {
                dataInicial: '2026-01-01',
                dataFinal: '2033-12-31',
                cenario: 'moderado',
                taxaCrescimento: 0.05
            },
            parametrosFinanceiros: {
                taxaAntecipacao: 0.018,
                taxaCapitalGiro: 0.021,
                spreadBancario: 0.035
            },
            interfaceState: {
                simulacaoRealizada: false,
                tabAtiva: 'simulacao',
                estrategiaAtiva: 'ajuste-precos'
            },
            resultadosSimulacao: null
        };
    }
    
    // Observadores
    const _observadores = {};
    
    // Carregar dados salvos
    function _carregarDados() {
        try {
            const dadosSalvos = localStorage.getItem('simulador-split-payment');
            if (dadosSalvos) {
                _data = JSON.parse(dadosSalvos);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            return false;
        }
    }
    
    // Salvar dados
    function _salvarDados() {
        try {
            localStorage.setItem('simulador-split-payment', JSON.stringify(_data));
            return true;
        } catch (error) {
            console.error('Erro ao salvar dados:', error);
            return false;
        }
    }
    
    // Notificar observadores
    function _notificarObservadores(secao, dados) {
        if (_observadores[secao]) {
            _observadores[secao].forEach(callback => {
                try {
                    callback(dados);
                } catch (error) {
                    console.error(`Erro ao notificar observador para ${secao}:`, error);
                }
            });
        }
        
        // Notificar observadores globais
        if (secao !== '*' && _observadores['*']) {
            _observadores['*'].forEach(callback => {
                try {
                    callback({ secao, dados });
                } catch (error) {
                    console.error('Erro ao notificar observador global:', error);
                }
            });
        }
    }
    
    // API pública
    return {
        /**
         * Inicializa o repositório
         */
        inicializar: function() {
            if (!_carregarDados()) {
                _data = _getEstruturaInicial();
            }
            console.log('SimuladorRepository inicializado');
        },
        
        /**
         * Reinicializa o repositório com valores padrão
         */
        reinicializar: function() {
            _data = _getEstruturaInicial();
            localStorage.removeItem('simulador-split-payment');
            console.log('Repositório reinicializado com valores padrão');
        },
        
        /**
         * Salva os dados atuais
         * @returns {boolean} Sucesso da operação
         */
        salvar: function() {
            return _salvarDados();
        },
        
        /**
         * Obtém uma seção completa de dados
         * @param {string} secao - Nome da seção
         * @returns {Object} Dados da seção
         */
        obterSecao: function(secao) {
            return _data[secao] ? {..._data[secao]} : null;
        },
        
        /**
         * Obtém um campo específico
         * @param {string} secao - Nome da seção
         * @param {string} campo - Nome do campo
         * @returns {*} Valor do campo
         */
        obterCampo: function(secao, campo) {
            return _data[secao] && _data[secao][campo] !== undefined ? 
                _data[secao][campo] : null;
        },
        
        /**
         * Atualiza uma seção inteira
         * @param {string} secao - Nome da seção
         * @param {Object} dados - Novos dados
         * @returns {boolean} Sucesso da operação
         */
        atualizarSecao: function(secao, dados) {
            if (!secao) return false;
            
            // Inicializar seção se não existir
            if (!_data[secao]) {
                _data[secao] = {};
            }
            
            // Mesclar dados
            _data[secao] = {..._data[secao], ...dados};
            
            // Notificar observadores
            _notificarObservadores(secao, _data[secao]);
            
            // Salvar alterações
            return _salvarDados();
        },
        
        /**
         * Atualiza um campo específico
         * @param {string} secao - Nome da seção
         * @param {string} campo - Nome do campo
         * @param {*} valor - Novo valor
         * @returns {boolean} Sucesso da operação
         */
        atualizarCampo: function(secao, campo, valor) {
            if (!secao || !campo) return false;
            
            // Inicializar seção se não existir
            if (!_data[secao]) {
                _data[secao] = {};
            }
            
            // Atualizar campo
            _data[secao][campo] = valor;
            
            // Notificar observadores
            _notificarObservadores(secao, _data[secao]);
            
            // Salvar alterações
            return _salvarDados();
        },
        
        /**
         * Observa mudanças em uma seção
         * @param {string} secao - Nome da seção ('*' para todas)
         * @param {Function} callback - Função a ser chamada quando houver mudanças
         */
        observar: function(secao, callback) {
            if (typeof callback !== 'function') return;
            
            if (!_observadores[secao]) {
                _observadores[secao] = [];
            }
            
            _observadores[secao].push(callback);
        },
        
        /**
         * Para de observar mudanças
         * @param {string} secao - Nome da seção
         * @param {Function} callback - Função a ser removida
         */
        pararObservar: function(secao, callback) {
            if (!_observadores[secao]) return;
            
            const index = _observadores[secao].indexOf(callback);
            if (index !== -1) {
                _observadores[secao].splice(index, 1);
            }
        },
        
        /**
         * Exporta os dados para JSON
         * @returns {string} Dados em formato JSON
         */
        exportarJSON: function() {
            return JSON.stringify(_data, null, 2);
        },
        
        /**
         * Importa dados de JSON
         * @param {string} json - Dados em formato JSON
         * @returns {boolean} Sucesso da operação
         */
        importarJSON: function(json) {
            try {
                const dados = JSON.parse(json);
                
                // Validação básica
                if (!dados || typeof dados !== 'object') {
                    throw new Error('Formato de dados inválido');
                }
                
                // Atualizar dados
                _data = dados;
                
                // Notificar observadores para cada seção
                Object.keys(_data).forEach(secao => {
                    _notificarObservadores(secao, _data[secao]);
                });
                
                // Salvar alterações
                return _salvarDados();
            } catch (error) {
                console.error('Erro ao importar JSON:', error);
                return false;
            }
        }
    };
})();