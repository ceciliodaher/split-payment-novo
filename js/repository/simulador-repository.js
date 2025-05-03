/**
 * SetoresRepository - Repositório centralizado de setores
 * Versão: 2.0.0 - Expansão para gerenciamento unificado
 * Serve como única fonte de verdade para os dados setoriais e suas configurações
 */
const SetoresRepository = (function() {
    // Dados dos setores - única definição em todo o sistema
    const SETORES_DATA = {
        // [Manter os dados setoriais existentes]
    };
    
    // Dados salvos pelo usuário
    let setoresPersonalizados = {};
    
    // Cronogramas específicos por setor
    let cronogramasSetoriais = {};
    
    // Configurações gerais do split payment
    let configuracoesGerais = {
        aliquotaCBS: 8.8,
        aliquotaIBS: 17.7,
        dataInicio: '2026-01',
        cronogramaPadrao: {
            '2026': 10.0,
            '2027': 25.0,
            '2028': 40.0,
            '2029': 55.0,
            '2030': 70.0,
            '2031': 85.0,
            '2032': 95.0,
            '2033': 100.0
        }
    };
    
    // Parâmetros financeiros
    let parametrosFinanceiros = {
        taxaAntecipacao: 1.8,
        taxaCapitalGiro: 2.1,
        spreadBancario: 3.5,
        observacoes: ''
    };
    
    // Observadores para eventos
    const observadores = {
        alteracao: [],
        configuracao: []
    };
    
    // Verificar se há dados salvos no localStorage
    function carregarDadosSalvos() {
        try {
            // Carregar setores personalizados
            const setoresSalvos = localStorage.getItem('setores-split-payment');
            if (setoresSalvos) {
                setoresPersonalizados = JSON.parse(setoresSalvos);
            }
            
            // Carregar configurações setoriais
            const configsSalvas = localStorage.getItem('configuracoes-setoriais');
            if (configsSalvas) {
                const configs = JSON.parse(configsSalvas);
                
                // Integrar configurações gerais
                if (configs.parametrosGerais) {
                    configuracoesGerais = {
                        ...configuracoesGerais,
                        ...configs.parametrosGerais
                    };
                }
                
                // Integrar parâmetros financeiros
                if (configs.parametrosFinanceiros) {
                    parametrosFinanceiros = {
                        ...parametrosFinanceiros,
                        ...configs.parametrosFinanceiros
                    };
                }
                
                // Integrar cronogramas setoriais
                if (configs.setores && Array.isArray(configs.setores)) {
                    configs.setores.forEach(setor => {
                        if (setor.codigo && setor.tipoCronograma === 'proprio' && setor.cronogramaEspecifico) {
                            cronogramasSetoriais[setor.codigo] = setor.cronogramaEspecifico;
                        }
                    });
                }
            }
            
            console.log('Dados carregados do localStorage com sucesso');
            return true;
        } catch (error) {
            console.error('Erro ao carregar dados do localStorage:', error);
            return false;
        }
    }
    
    // Salvar todos os dados no localStorage
    function salvarDadosCompletos() {
        try {
            // Salvar setores personalizados
            localStorage.setItem('setores-split-payment', JSON.stringify(setoresPersonalizados));
            
            // Construir objeto de configurações completo
            const configuracoesCompletas = {
                parametrosGerais: configuracoesGerais,
                parametrosFinanceiros: parametrosFinanceiros,
                setores: construirListaSetoresConfigurados()
            };
            
            // Salvar configurações
            localStorage.setItem('configuracoes-setoriais', JSON.stringify(configuracoesCompletas));
            
            // Notificar observadores
            notificarObservadores('configuracao', configuracoesCompletas);
            
            console.log('Dados salvos no localStorage com sucesso');
            return true;
        } catch (error) {
            console.error('Erro ao salvar dados no localStorage:', error);
            return false;
        }
    }
    
    // Construir lista de setores com suas configurações
    function construirListaSetoresConfigurados() {
        const setoresList = [];
        const todosSetores = { ...SETORES_DATA, ...setoresPersonalizados };
        
        Object.keys(todosSetores).forEach(codigo => {
            const setor = todosSetores[codigo];
            
            // Verificar se tem cronograma próprio
            const cronogramaProprio = !!cronogramasSetoriais[codigo];
            
            setoresList.push({
                id: codigo,
                codigo: codigo,
                nome: setor.nome,
                aliquota: (setor.aliquotaEfetiva * 100),
                reducao: (setor.reducaoEspecial * 100),
                tipoCronograma: cronogramaProprio ? 'proprio' : 'padrao',
                cronogramaEspecifico: cronogramaProprio ? cronogramasSetoriais[codigo] : null
            });
        });
        
        return setoresList;
    }
    
    // Notificar observadores sobre mudanças
    function notificarObservadores(tipo, dados) {
        if (observadores[tipo] && Array.isArray(observadores[tipo])) {
            observadores[tipo].forEach(callback => {
                try {
                    callback(dados);
                } catch (error) {
                    console.error(`Erro ao executar callback de observador (${tipo}):`, error);
                }
            });
        }
    }
    
    // API pública expandida
    return {
        /**
         * Inicializa o repositório
         */
        inicializar: function() {
            carregarDadosSalvos();
            console.log('SetoresRepository inicializado (versão unificada)');
        },
        
        /**
         * Retorna todos os setores, mesclando os padrões com os personalizados
         * @returns {Object} - Objeto com todos os setores
         */
        obterTodos: function() {
            return { ...SETORES_DATA, ...setoresPersonalizados };
        },
        
        /**
         * Retorna um setor específico
         * @param {string} codigo - Código do setor
         * @returns {Object|null} - Objeto do setor ou null se não encontrado
         */
        obterSetor: function(codigo) {
            // Verificar primeiro nos personalizados
            if (setoresPersonalizados[codigo]) {
                return setoresPersonalizados[codigo];
            }
            // Depois nos padrões
            return SETORES_DATA[codigo] || null;
        },
        
        /**
         * Retorna array de setores formatados para uso em dropdowns
         * @returns {Array} - Array de objetos {codigo, nome}
         */
        obterParaDropdown: function() {
            const todos = this.obterTodos();
            return Object.keys(todos).map(codigo => ({
                codigo: codigo,
                nome: todos[codigo].nome
            }));
        },
        
        /**
         * Retorna a alíquota efetiva para um setor, considerando reduções
         * @param {string} codigo - Código do setor
         * @returns {number} - Alíquota efetiva (já com reduções aplicadas)
         */
        obterAliquotaEfetiva: function(codigo) {
            const setor = this.obterSetor(codigo);
            if (!setor) return 0.265; // Valor padrão
            
            return setor.aliquotaEfetiva - setor.reducaoEspecial;
        },
        
        /**
         * Adiciona ou atualiza um setor personalizado
         * @param {string} codigo - Código do setor
         * @param {Object} dados - Dados do setor
         * @returns {boolean} - Sucesso da operação
         */
        salvarSetor: function(codigo, dados) {
            if (!codigo || !dados || !dados.nome) {
                console.error('Dados insuficientes para salvar setor');
                return false;
            }
            
            setoresPersonalizados[codigo] = { ...dados };
            
            // Se tem dados de cronograma, salvar também
            if (dados.cronogramaProprio && dados.cronogramaValores) {
                cronogramasSetoriais[codigo] = dados.cronogramaValores;
            }
            
            // Salvar e notificar
            notificarObservadores('alteracao', { tipo: 'setor', codigo, dados });
            return salvarDadosCompletos();
        },
        
        /**
         * Remove um setor personalizado
         * @param {string} codigo - Código do setor
         * @returns {boolean} - Sucesso da operação
         */
        removerSetor: function(codigo) {
            if (!setoresPersonalizados[codigo]) {
                // Se não for um setor personalizado, não pode ser removido
                return false;
            }
            
            delete setoresPersonalizados[codigo];
            
            // Remover cronograma específico se existir
            if (cronogramasSetoriais[codigo]) {
                delete cronogramasSetoriais[codigo];
            }
            
            // Salvar e notificar
            notificarObservadores('alteracao', { tipo: 'remocao', codigo });
            return salvarDadosCompletos();
        },
        
        /**
         * Preenche um dropdown de setores
         * @param {string} selectorId - ID do elemento select
         */
        preencherDropdown: function(selectorId) {
            const dropdown = document.getElementById(selectorId);
            if (!dropdown) {
                console.error(`Elemento select com ID ${selectorId} não encontrado`);
                return;
            }
            
            // Limpar opções existentes exceto a primeira (opção padrão)
            while (dropdown.options.length > 1) {
                dropdown.remove(1);
            }
            
            // Adicionar setores ordenados alfabeticamente pelo nome
            const setoresDropdown = this.obterParaDropdown()
                .sort((a, b) => a.nome.localeCompare(b.nome));
            
            setoresDropdown.forEach(setor => {
                const option = document.createElement('option');
                option.value = setor.codigo;
                
                // Obter dados completos do setor para incluir nas propriedades data-*
                const setorDados = this.obterSetor(setor.codigo);
                if (setorDados) {
                    const aliquotaEfetiva = this.obterAliquotaEfetiva(setor.codigo);
                    option.textContent = setor.nome;
                    
                    // Adicionar atributos data-* para uso em scripts
                    option.dataset.aliquota = (setorDados.aliquotaEfetiva * 100).toFixed(1);
                    option.dataset.reducao = (setorDados.reducaoEspecial * 100).toFixed(1);
                    option.dataset.efetiva = (aliquotaEfetiva * 100).toFixed(1);
                    
                    dropdown.appendChild(option);
                }
            });
            
            console.log(`Dropdown ${selectorId} atualizado com ${setoresDropdown.length} setores`);
        },
        
        /**
         * Obtém o cronograma de implementação para um setor
         * @param {string} codigo - Código do setor
         * @param {number} ano - Ano de referência (opcional)
         * @returns {Object|number} - Cronograma completo ou valor para o ano específico
         */
        obterCronogramaImplementacao: function(codigo, ano = null) {
            // Verificar se existe cronograma específico para o setor
            const setor = this.obterSetor(codigo);
            let cronograma = configuracoesGerais.cronogramaPadrao;
            
            if (setor && setor.cronogramaProprio && cronogramasSetoriais[codigo]) {
                cronograma = cronogramasSetoriais[codigo];
            }
            
            // Se um ano específico foi solicitado, retornar apenas o valor para esse ano
            if (ano !== null) {
                return cronograma[ano] !== undefined ? cronograma[ano] / 100 : 0;
            }
            
            // Caso contrário, retornar o cronograma completo
            return cronograma;
        },
        
        /**
         * Salva um cronograma específico para um setor
         * @param {string} codigo - Código do setor
         * @param {Object} cronograma - Valores do cronograma
         * @returns {boolean} - Sucesso da operação
         */
        salvarCronogramaSetor: function(codigo, cronograma) {
            if (!codigo) {
                console.error('Código do setor não informado para salvar cronograma');
                return false;
            }
            
            cronogramasSetoriais[codigo] = cronograma;
            
            // Atualizar o setor para indicar que tem cronograma próprio
            const setor = this.obterSetor(codigo);
            if (setor) {
                this.salvarSetor(codigo, {
                    ...setor, 
                    cronogramaProprio: true,
                    cronogramaValores: cronograma
                });
            }
            
            // Notificar
            notificarObservadores('alteracao', { 
                tipo: 'cronograma', 
                codigo, 
                cronograma 
            });
            
            return salvarDadosCompletos();
        },
        
        /**
         * Obtém as configurações gerais do split payment
         * @returns {Object} - Configurações gerais
         */
        obterConfiguracoesGerais: function() {
            return { ...configuracoesGerais };
        },
        
        /**
         * Salva as configurações gerais do split payment
         * @param {Object} configs - Novas configurações
         * @returns {boolean} - Sucesso da operação
         */
        salvarConfiguracoesGerais: function(configs) {
            configuracoesGerais = {
                ...configuracoesGerais,
                ...configs
            };
            
            // Notificar
            notificarObservadores('configuracao', configuracoesGerais);
            
            return salvarDadosCompletos();
        },
        
        /**
         * Obtém os parâmetros financeiros
         * @returns {Object} - Parâmetros financeiros
         */
        obterParametrosFinanceiros: function() {
            return { ...parametrosFinanceiros };
        },
        
        /**
         * Salva os parâmetros financeiros
         * @param {Object} params - Novos parâmetros
         * @returns {boolean} - Sucesso da operação
         */
        salvarParametrosFinanceiros: function(params) {
            parametrosFinanceiros = {
                ...parametrosFinanceiros,
                ...params
            };
            
            // Notificar
            notificarObservadores('configuracao', { 
                tipo: 'parametros_financeiros', 
                dados: parametrosFinanceiros 
            });
            
            return salvarDadosCompletos();
        },
        
        /**
         * Obtém as configurações completas
         * @returns {Object} - Configurações completas
         */
        obterConfiguracoesCompletas: function() {
            return {
                parametrosGerais: { ...configuracoesGerais },
                parametrosFinanceiros: { ...parametrosFinanceiros },
                setores: construirListaSetoresConfigurados(),
                cronogramas: { ...cronogramasSetoriais }
            };
        },
        
        /**
         * Restaura as configurações padrão
         * @returns {boolean} - Sucesso da operação
         */
        restaurarPadroes: function() {
            // Restaurar configurações gerais
            configuracoesGerais = {
                aliquotaCBS: 8.8,
                aliquotaIBS: 17.7,
                dataInicio: '2026-01',
                cronogramaPadrao: {
                    '2026': 10.0,
                    '2027': 25.0,
                    '2028': 40.0,
                    '2029': 55.0,
                    '2030': 70.0,
                    '2031': 85.0,
                    '2032': 95.0,
                    '2033': 100.0
                }
            };
            
            // Restaurar parâmetros financeiros
            parametrosFinanceiros = {
                taxaAntecipacao: 1.8,
                taxaCapitalGiro: 2.1,
                spreadBancario: 3.5,
                observacoes: ''
            };
            
            // Limpar setores personalizados
            setoresPersonalizados = {};
            
            // Limpar cronogramas específicos
            cronogramasSetoriais = {};
            
            // Limpar dados do localStorage
            localStorage.removeItem('setores-split-payment');
            localStorage.removeItem('configuracoes-setoriais');
            
            // Notificar
            notificarObservadores('configuracao', { tipo: 'restauracao' });
            
            return true;
        },
        
        /**
         * Adiciona um observador para eventos específicos
         * @param {string} tipo - Tipo de evento ('alteracao' ou 'configuracao')
         * @param {Function} callback - Função de callback
         */
        adicionarObservador: function(tipo, callback) {
            if (!observadores[tipo]) {
                observadores[tipo] = [];
            }
            
            observadores[tipo].push(callback);
        },
        
        /**
         * Remove um observador
         * @param {string} tipo - Tipo de evento
         * @param {Function} callback - Função de callback a remover
         */
        removerObservador: function(tipo, callback) {
            if (observadores[tipo]) {
                const index = observadores[tipo].indexOf(callback);
                if (index !== -1) {
                    observadores[tipo].splice(index, 1);
                }
            }
        }
    };
})();