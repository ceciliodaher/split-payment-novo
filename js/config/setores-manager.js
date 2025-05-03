/**
 * SetoresManager - Gerenciador de setores da aplicação
 * Versão: 3.0.0 - Refatorado para atuar como adaptador para o SetoresRepository
 */
const SetoresManager = {
    // Controle de inicialização
    initialized: false,
    
    /**
     * Inicializa o gerenciador de setores
     */
    inicializar: function() {
        if (this.initialized) return;
        
        // Inicializar o repositório
        if (typeof SetoresRepository !== 'undefined') {
            SetoresRepository.inicializar();
        } else {
            console.error('SetoresRepository não encontrado. O gerenciador não funcionará corretamente.');
        }
        
        this.initialized = true;
        console.log('SetoresManager inicializado (como adaptador)');
    },
    
    /**
     * Exporta os setores para uso em outros componentes
     * @returns {Array} Lista de setores formatados para uso em dropdowns
     * @deprecated Use SetoresRepository.obterParaDropdown() diretamente
     */
    exportarSetoresParaDropdown: function() {
        if (!this.initialized) this.inicializar();
        return SetoresRepository.obterParaDropdown();
    },
    
    /**
     * Preenche um dropdown com os setores disponíveis
     * @param {string} selectorId - ID do elemento select a ser preenchido
     */
    preencherDropdownSetores: function(selectorId) {
        if (!this.initialized) this.inicializar();
        SetoresRepository.preencherDropdown(selectorId);
    },
    
    /**
     * Adiciona ou atualiza um setor
     * @param {string} codigo - Código único do setor
     * @param {Object} setor - Dados do setor
     * @returns {boolean} - Sucesso da operação
     * @deprecated Use SetoresRepository.salvarSetor() diretamente
     */
    salvarSetor: function(codigo, setor) {
        if (!this.initialized) this.inicializar();
        return SetoresRepository.salvarSetor(codigo, setor);
    },
    
    /**
     * Remove um setor
     * @param {string} codigo - Código do setor a remover
     * @returns {boolean} - Sucesso da operação
     * @deprecated Use SetoresRepository.removerSetor() diretamente
     */
    removerSetor: function(codigo) {
        if (!this.initialized) this.inicializar();
        return SetoresRepository.removerSetor(codigo);
    },
    
    /**
     * Salva os setores no localStorage
     * @returns {boolean} - Sucesso da operação
     * @deprecated Esta função não é mais necessária
     */
    salvarNoStorage: function() {
        console.warn('SetoresManager.salvarNoStorage() está obsoleto. O repositório gerencia o armazenamento automaticamente.');
        return true;
    },
    
    /**
     * Obtém um setor específico
     * @param {string} codigo - Código do setor
     * @returns {Object|null} - Dados do setor ou null se não encontrado
     */
    obterSetor: function(codigo) {
        if (!this.initialized) this.inicializar();
        return SetoresRepository.obterSetor(codigo);
    },
    
    /**
     * Obtém a alíquota efetiva para um setor
     * @param {string} codigo - Código do setor
     * @returns {number} - Alíquota efetiva já considerando reduções
     */
    obterAliquotaEfetiva: function(codigo) {
        if (!this.initialized) this.inicializar();
        return SetoresRepository.obterAliquotaEfetiva(codigo);
    },
    
    /**
     * Obtém o cronograma de implementação específico de um setor, se existir
     * @param {string} codigo - Código do setor
     * @returns {Object|null} - Cronograma específico ou null se usar o padrão
     */
    obterCronogramaSetorial: function(codigo) {
        if (!this.initialized) this.inicializar();
        return SetoresRepository.obterCronogramaImplementacao(codigo);
    },
    
    /**
     * Obtém lista de todos os setores
     * @returns {Array} - Lista de setores com seus códigos
     */
    obterTodosSetores: function() {
        if (!this.initialized) this.inicializar();
        const todos = SetoresRepository.obterTodos();
        return Object.keys(todos).map(codigo => ({
            codigo: codigo,
            ...todos[codigo]
        }));
    },
    
    /**
     * Restaura setores padrão
     * @returns {boolean} - Sucesso da operação
     */
    restaurarPadroes: function() {
        if (!this.initialized) this.inicializar();
        return SetoresRepository.restaurarPadroes();
    }
};