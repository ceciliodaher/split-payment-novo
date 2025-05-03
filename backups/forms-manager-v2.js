/**
 * Gerenciador de formulários
 */
const FormsManager = {
    /**
     * Inicializa o gerenciador de formulários
     */
    inicializar: function() {
        console.log('Inicializando gerenciador de formulários');
        
        // Inicializar formatação para campos monetários
        this.inicializarCamposMonetarios();
        
        // Inicializar formatação para campos percentuais
        this.inicializarCamposPercentuais();
        
        // Inicializar cálculo automático do ciclo financeiro
        this.inicializarCalculoCicloFinanceiro();
        
        // Inicializar atualização automática de percentuais
        this.inicializarAtualizacaoPercentuais();
        
        // Inicializar cálculo de elasticidade
        this.inicializarCalculoElasticidade();
        
        // Inicializar exibição de campos para cenário personalizado
        this.inicializarCenarioPersonalizado();
        
        console.log('Gerenciador de formulários inicializado');
    },
    
    /**
     * Inicializa campos monetários
     */
    inicializarCamposMonetarios: function() {
        const camposMonetarios = document.querySelectorAll('.money-input');
        camposMonetarios.forEach(campo => {
            FormatacaoHelper.formatarInputMonetario(campo);
        });
    },
    
    /**
     * Inicializa campos percentuais
     */
    inicializarCamposPercentuais: function() {
        const camposPercentuais = document.querySelectorAll('.percent-input');
        camposPercentuais.forEach(campo => {
            FormatacaoHelper.formatarInputPercentual(campo);
        });
    },
    
    /**
     * Inicializa cálculo automático do ciclo financeiro
     */
    inicializarCalculoCicloFinanceiro: function() {
        const campos = ['pmr', 'pmp', 'pme'];
        campos.forEach(id => {
            const campo = document.getElementById(id);
            if (campo) {
                campo.addEventListener('input', () => {
                    this.calcularCicloFinanceiro();
                });
            }
        });
        
        // Calcular valor inicial
        this.calcularCicloFinanceiro();
    },
    
    /**
     * Calcula o ciclo financeiro
     */
    calcularCicloFinanceiro: function() {
        const pmr = parseInt(document.getElementById('pmr')?.value) || 0;
        const pmp = parseInt(document.getElementById('pmp')?.value) || 0;
        const pme = parseInt(document.getElementById('pme')?.value) || 0;
        
        const ciclo = pmr + pme - pmp;
        const campoCiclo = document.getElementById('ciclo-financeiro');
        if (campoCiclo) {
            campoCiclo.value = ciclo;
        }
    },
    
    /**
     * Inicializa atualização automática de percentuais
     */
    inicializarAtualizacaoPercentuais: function() {
        const campoPercVista = document.getElementById('perc-vista');
        if (campoPercVista) {
            campoPercVista.addEventListener('input', () => {
                this.atualizarPercPrazo();
            });
            campoPercVista.addEventListener('blur', () => {
                this.atualizarPercPrazo();
            });
        }
        
        // Atualizar valor inicial
        this.atualizarPercPrazo();
    },
    
    /**
     * Atualiza o percentual de vendas a prazo
     */
    atualizarPercPrazo: function() {
        const campoPercVista = document.getElementById('perc-vista');
        const campoPercPrazo = document.getElementById('perc-prazo');
        
        if (campoPercVista && campoPercPrazo) {
            const valorPercVista = FormatacaoHelper.extrairValorNumerico(campoPercVista.value) / 100;
            const valorPercPrazo = Math.max(0, Math.min(1, 1 - valorPercVista));
            
            campoPercPrazo.value = FormatacaoHelper.formatarPercentual(valorPercPrazo);
        }
    },
    
    /**
     * Inicializa cálculo de elasticidade
     */
    inicializarCalculoElasticidade: function() {
        const campoPercentual = document.getElementById('ap-percentual');
        const campoElasticidade = document.getElementById('ap-elasticidade');
        
        if (campoPercentual && campoElasticidade) {
            campoPercentual.addEventListener('input', () => {
                this.calcularImpactoElasticidade();
            });
            
            campoElasticidade.addEventListener('input', () => {
                this.calcularImpactoElasticidade();
            });
        }
        
        // Calcular valor inicial
        this.calcularImpactoElasticidade();
    },
    
    /**
     * Calcula o impacto da elasticidade
     */
    calcularImpactoElasticidade: function() {
        const percentual = parseFloat(document.getElementById('ap-percentual')?.value) || 0;
        const elasticidade = parseFloat(document.getElementById('ap-elasticidade')?.value) || 0;
        
        const impacto = percentual * elasticidade;
        const campoImpacto = document.getElementById('ap-impacto-vendas');
        if (campoImpacto) {
            campoImpacto.value = impacto.toFixed(2);
        }
    },
    
    /**
     * Inicializa exibição de campos para cenário personalizado
     */
    inicializarCenarioPersonalizado: function() {
        const campoCenario = document.getElementById('cenario');
        if (campoCenario) {
            campoCenario.addEventListener('change', () => {
                const divCenarioPersonalizado = document.getElementById('cenario-personalizado');
                if (divCenarioPersonalizado) {
                    divCenarioPersonalizado.style.display = 
                        campoCenario.value === 'personalizado' ? 'block' : 'none';
                }
            });
        }
    }
};
