/**
 * Gerenciador de setores da aplicação
 * Versão ampliada com todos os setores previstos na reforma tributária
 */
const SetoresManager = {
    // Armazena os setores cadastrados
    setores: {},
    
    // Controle de inicialização
    initialized: false,
    
    /**
     * Inicializa o gerenciador de setores com valores padrão
     */
    inicializar: function() {
        if (this.initialized) return;
        
        // Adicionar setores padrão
        this.setores = {
            // Setores Gerais
            'comercio': {
                nome: 'Comércio Varejista',
                aliquotaEfetiva: 0.265,
                reducaoEspecial: 0.00,
                implementacaoInicial: 10,
                cronogramaProprio: false
            },
            'industria': {
                nome: 'Indústria de Transformação',
                aliquotaEfetiva: 0.220,
                reducaoEspecial: 0.00,
                implementacaoInicial: 10,
                cronogramaProprio: false
            },
            'servicos': {
                nome: 'Serviços Contínuos',
                aliquotaEfetiva: 0.265,
                reducaoEspecial: 0.00,
                implementacaoInicial: 10,
                cronogramaProprio: false
            },
            'agronegocio': {
                nome: 'Agronegócio',
                aliquotaEfetiva: 0.195,
                reducaoEspecial: 0.00,
                implementacaoInicial: 5,
                cronogramaProprio: true
            },
            'construcao': {
                nome: 'Construção Civil',
                aliquotaEfetiva: 0.240,
                reducaoEspecial: 0.00,
                implementacaoInicial: 10,
                cronogramaProprio: false
            },
            'tecnologia': {
                nome: 'Tecnologia',
                aliquotaEfetiva: 0.265,
                reducaoEspecial: 0.00,
                implementacaoInicial: 15,
                cronogramaProprio: false
            },
            
            // Setores com Redução de 60% na Alíquota
            'educacao': {
                nome: 'Serviços de Educação',
                aliquotaEfetiva: 0.265,
                reducaoEspecial: 0.159,  // 60% de redução
                implementacaoInicial: 10,
                cronogramaProprio: false
            },
            'saude': {
                nome: 'Serviços de Saúde',
                aliquotaEfetiva: 0.265,
                reducaoEspecial: 0.159,  // 60% de redução
                implementacaoInicial: 10,
                cronogramaProprio: false
            },
            'dispositivos_medicos': {
                nome: 'Dispositivos Médicos',
                aliquotaEfetiva: 0.265,
                reducaoEspecial: 0.159,  // 60% de redução
                implementacaoInicial: 10,
                cronogramaProprio: false
            },
            'dispositivos_acessibilidade': {
                nome: 'Dispositivos de Acessibilidade',
                aliquotaEfetiva: 0.265,
                reducaoEspecial: 0.159,  // 60% de redução
                implementacaoInicial: 10,
                cronogramaProprio: false
            },
            'medicamentos': {
                nome: 'Medicamentos',
                aliquotaEfetiva: 0.265,
                reducaoEspecial: 0.159,  // 60% de redução
                implementacaoInicial: 5,
                cronogramaProprio: false
            },
            'cuidados_menstruais': {
                nome: 'Produtos de Cuidados Menstruais',
                aliquotaEfetiva: 0.265,
                reducaoEspecial: 0.159,  // 60% de redução
                implementacaoInicial: 5,
                cronogramaProprio: false
            },
            'transporte_coletivo': {
                nome: 'Transporte Coletivo',
                aliquotaEfetiva: 0.265,
                reducaoEspecial: 0.159,  // 60% de redução
                implementacaoInicial: 10,
                cronogramaProprio: false
            },
            'alimentos_consumo_humano': {
                nome: 'Alimentos para Consumo Humano',
                aliquotaEfetiva: 0.265,
                reducaoEspecial: 0.159,  // 60% de redução
                implementacaoInicial: 5,
                cronogramaProprio: false
            },
            'higiene_limpeza': {
                nome: 'Produtos de Higiene e Limpeza',
                aliquotaEfetiva: 0.265,
                reducaoEspecial: 0.159,  // 60% de redução
                implementacaoInicial: 10,
                cronogramaProprio: false
            },
            'producoes_artisticas': {
                nome: 'Produções Artísticas e Culturais',
                aliquotaEfetiva: 0.265,
                reducaoEspecial: 0.159,  // 60% de redução
                implementacaoInicial: 10,
                cronogramaProprio: false
            },
            'insumos_agropecuarios': {
                nome: 'Insumos Agropecuários',
                aliquotaEfetiva: 0.265,
                reducaoEspecial: 0.159,  // 60% de redução
                implementacaoInicial: 5,
                cronogramaProprio: false
            },
            'seguranca_nacional': {
                nome: 'Segurança e Soberania Nacional',
                aliquotaEfetiva: 0.265,
                reducaoEspecial: 0.159,  // 60% de redução
                implementacaoInicial: 5,
                cronogramaProprio: false
            },
            
            // Setores com Alíquota Zero
            'cesta_basica': {
                nome: 'Cesta Básica Nacional',
                aliquotaEfetiva: 0.00,
                reducaoEspecial: 0.00,
                implementacaoInicial: 0,
                cronogramaProprio: false
            },
            'alimentos_in_natura': {
                nome: 'Produtos Hortícolas, Frutas e Ovos',
                aliquotaEfetiva: 0.00,
                reducaoEspecial: 0.00,
                implementacaoInicial: 0,
                cronogramaProprio: false
            },
            'educacao_prouni': {
                nome: 'Serviços de Educação Superior - ProUni',
                aliquotaEfetiva: 0.00,
                reducaoEspecial: 0.00,
                implementacaoInicial: 0,
                cronogramaProprio: false
            },
            'eventos_perse': {
                nome: 'Serviços do Setor de Eventos - PERSE',
                aliquotaEfetiva: 0.00,
                reducaoEspecial: 0.00,
                implementacaoInicial: 0,
                cronogramaProprio: true,
                cronogramaObservacao: 'Válido até 28.02.2027'
            },
            'recuperacao_urbana': {
                nome: 'Recuperação Urbana em Áreas Históricas',
                aliquotaEfetiva: 0.00,
                reducaoEspecial: 0.00,
                implementacaoInicial: 0,
                cronogramaProprio: false
            },
            
            // Regimes Específicos
            'combustiveis_energia': {
                nome: 'Combustíveis e Energia',
                aliquotaEfetiva: 0.265,
                reducaoEspecial: 0.00,
                implementacaoInicial: 10,
                cronogramaProprio: true,
                regimeEspecifico: 'monofasico'
            },
            'financeiro_seguros': {
                nome: 'Financeiro e Seguros',
                aliquotaEfetiva: 0.265,
                reducaoEspecial: 0.00,
                implementacaoInicial: 10,
                cronogramaProprio: true
            },
            'planos_saude': {
                nome: 'Planos e Seguros de Saúde',
                aliquotaEfetiva: 0.265,
                reducaoEspecial: 0.159,  // 60% de redução
                implementacaoInicial: 10,
                cronogramaProprio: true
            },
            'industria_petroleo': {
                nome: 'Indústria de Petróleo',
                aliquotaEfetiva: 0.265,
                reducaoEspecial: 0.00,
                implementacaoInicial: 10,
                cronogramaProprio: true,
                cronogramaObservacao: 'Válido até 31.12.2040'
            },
            'bens_capital': {
                nome: 'Bens de Capital',
                aliquotaEfetiva: 0.265,
                reducaoEspecial: 0.00,
                implementacaoInicial: 10,
                cronogramaProprio: true,
                cronogramaObservacao: 'Suspensão por 5 anos para compras até 31.12.2028'
            },
            'industria_exportacao': {
                nome: 'Industrialização para Exportação',
                aliquotaEfetiva: 0.265,
                reducaoEspecial: 0.00,
                implementacaoInicial: 10,
                cronogramaProprio: true
            },
            'lojas_francas': {
                nome: 'Regimes Aduaneiros - Lojas Francas',
                aliquotaEfetiva: 0.265,
                reducaoEspecial: 0.00,
                implementacaoInicial: 10,
                cronogramaProprio: true
            },
            'reporto': {
                nome: 'Regime Reporto (Modernização de Portos)',
                aliquotaEfetiva: 0.265,
                reducaoEspecial: 0.00,
                implementacaoInicial: 10,
                cronogramaProprio: true
            }
        };
        
        /**
     * Exporta os setores para uso em outros componentes
     * @returns {Array} Lista de setores formatados para uso em dropdowns
     */
    exportarSetoresParaDropdown: function() {
        const setoresFormatados = [];
        
        for (const [codigo, setor] of Object.entries(this.setores)) {
            setoresFormatados.push({
                codigo: codigo,
                nome: setor.nome
            });
        }
        
        return setoresFormatados;
    },
    
    /**
     * Preenche um dropdown com os setores disponíveis
     * @param {string} selectorId - ID do elemento select a ser preenchido
     */
    preencherDropdownSetores: function(selectorId) {
        const dropdown = document.getElementById(selectorId);
        if (!dropdown) {
            console.error(`Elemento com ID ${selectorId} não encontrado`);
            return;
        }
        
        // Limpar opções existentes exceto a primeira (opção padrão)
        while (dropdown.options.length > 1) {
            dropdown.remove(1);
        }
        
        // Adicionar setores ao dropdown
        for (const [codigo, setor] of Object.entries(this.setores)) {
            const option = document.createElement('option');
            option.value = codigo;
            option.textContent = setor.nome;
            dropdown.appendChild(option);
        }
        
        console.log(`Dropdown ${selectorId} atualizado com ${Object.keys(this.setores).length} setores`);
    },
        
        // Carregar setores do localStorage, se existirem
        const setoresSalvos = localStorage.getItem('setores-split-payment');
        if (setoresSalvos) {
            try {
                const setoresObj = JSON.parse(setoresSalvos);
                this.setores = { ...this.setores, ...setoresObj };
            } catch (error) {
                console.error('Erro ao carregar setores do localStorage:', error);
            }
        }
        
        this.initialized = true;
        console.log('Gerenciador de setores inicializado com ' + Object.keys(this.setores).length + ' setores');
    },
    
    /**
     * Adiciona ou atualiza um setor
     * @param {string} codigo - Código único do setor
     * @param {Object} setor - Dados do setor
     * @returns {boolean} - Sucesso da operação
     */
    salvarSetor: function(codigo, setor) {
        if (!codigo || !setor || !setor.nome) {
            console.error('Dados insuficientes para salvar setor');
            return false;
        }
        
        this.setores[codigo] = { ...setor };
        
        // Persistir no localStorage
        this.salvarNoStorage();
        
        return true;
    },
    
    /**
     * Remove um setor
     * @param {string} codigo - Código do setor a remover
     * @returns {boolean} - Sucesso da operação
     */
    removerSetor: function(codigo) {
        if (!codigo || !this.setores[codigo]) {
            console.error('Setor não encontrado:', codigo);
            return false;
        }
        
        delete this.setores[codigo];
        
        // Persistir no localStorage
        this.salvarNoStorage();
        
        return true;
    },
    
    /**
     * Salva os setores no localStorage
     * @returns {boolean} - Sucesso da operação
     */
    salvarNoStorage: function() {
        try {
            localStorage.setItem('setores-split-payment', JSON.stringify(this.setores));
            return true;
        } catch (error) {
            console.error('Erro ao salvar setores no localStorage:', error);
            return false;
        }
    },
    
    /**
     * Obtém um setor específico
     * @param {string} codigo - Código do setor
     * @returns {Object|null} - Dados do setor ou null se não encontrado
     */
    obterSetor: function(codigo) {
        return this.setores[codigo] || null;
    },
    
    /**
     * Obtém a alíquota efetiva para um setor
     * @param {string} codigo - Código do setor
     * @returns {number} - Alíquota efetiva já considerando reduções
     */
    obterAliquotaEfetiva: function(codigo) {
        const setor = this.obterSetor(codigo);
        if (!setor) return 0.265; // Alíquota padrão
        
        return setor.aliquotaEfetiva - setor.reducaoEspecial;
    },
    
    /**
     * Obtém o cronograma de implementação específico de um setor, se existir
     * @param {string} codigo - Código do setor
     * @returns {Object|null} - Cronograma específico ou null se usar o padrão
     */
    obterCronogramaSetorial: function(codigo) {
        const setor = this.obterSetor(codigo);
        if (!setor || !setor.cronogramaProprio) return null;
        
        // Se o setor tem cronograma próprio, mas não está definido,
        // retornamos um cronograma padrão específico para o setor
        // Isso precisaria ser implementado com base nas regras específicas
        // para cada setor na reforma tributária
        return {
            2026: 0.05,  // Exemplo - cronograma mais lento
            2027: 0.15,
            2028: 0.30,
            2029: 0.45,
            2030: 0.60,
            2031: 0.75,
            2032: 0.90,
            2033: 1.00
        };
    },
    
    /**
     * Obtém lista de todos os setores
     * @returns {Array} - Lista de setores com seus códigos
     */
    obterTodosSetores: function() {
        return Object.keys(this.setores).map(codigo => {
            return {
                codigo: codigo,
                ...this.setores[codigo]
            };
        });
    },
    
    /**
     * Restaura setores padrão
     * @returns {boolean} - Sucesso da operação
     */
    restaurarPadroes: function() {
        this.initialized = false;
        this.inicializar();
        this.salvarNoStorage();
        return true;
    }  
};
