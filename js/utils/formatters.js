/**
 * FormatHelper - Utilitário unificado para formatação de valores e campos
 * Versão: 1.0.2 - Correção de ordem de declaração e inicialização
 */

const FormatHelper = {
    /**
     * Inicializa o formatador para todos os campos relevantes
     */
    inicializar: function() {
        console.log('Inicializando formatador unificado');
        
        // Corrigir formatação indevida
        this.corrigirFormatacaoIndevida();
        
        // Selecionar e formatar campos monetários
        const camposMoeda = document.querySelectorAll('input.money-input');
        camposMoeda.forEach(campo => {
            if (!this.estaEmAreaDeNavegacao(campo)) {
                this.aplicarFormatacaoMonetaria(campo);
            }
        });
        
        // Selecionar e formatar campos percentuais
        const camposPercentuais = document.querySelectorAll('input.percent-input');
        camposPercentuais.forEach(campo => {
            if (!this.estaEmAreaDeNavegacao(campo)) {
                this.aplicarFormatacaoPercentual(campo);
            }
        });
        
        // Campos monetários específicos por ID
        const camposMonetariosEspecificos = [
            'faturamento',
            'faturamento-config', 
            'creditos',
            'creditos-config'
        ];
        
        camposMonetariosEspecificos.forEach(id => {
            const campo = document.getElementById(id);
            if (campo) {
                this.aplicarFormatacaoMonetaria(campo);
            }
        });
        
        console.log('Formatador unificado inicializado com sucesso');
    },
    
    /**
     * Verifica se um elemento está em uma área de navegação
     */
    estaEmAreaDeNavegacao: function(elemento) {
        const areasDeNavegacao = [
            '.tab-buttons',
            '.header',
            '.tab-container > h2',
            '.strategy-tab-buttons',
            '.tab-button',
            '.modal-header'
        ];
        
        return areasDeNavegacao.some(seletor => elemento.closest(seletor) !== null);
    },
    
    /**
     * Corrige formatação aplicada indevidamente
     */
    corrigirFormatacaoIndevida: function() {
        const areasDeNavegacao = [
            '.tab-buttons',
            '.header',
            '.tab-container > h2',
            '.strategy-tab-buttons',
            '.tab-button',
            '.modal-header'
        ];
        
        areasDeNavegacao.forEach(area => {
            document.querySelectorAll(`${area} .money-prefix`).forEach(el => {
                el.parentNode?.removeChild(el);
            });
            
            document.querySelectorAll(`${area} .money-input-container`).forEach(container => {
                const elementosOriginais = Array.from(container.children)
                    .filter(el => !el.classList.contains('money-prefix'));
                
                elementosOriginais.forEach(el => {
                    container.parentNode?.insertBefore(el, container);
                });
                container.parentNode?.removeChild(container);
            });
            
            document.querySelectorAll(`${area} .money-input`).forEach(el => {
                el.classList.remove('money-input');
                delete el.dataset.formatterInitialized;
            });
        });
    },
    
    /**
     * Formata um valor numérico como moeda (R$)
     */
    formatarMoeda: function(valor) {
        return (isNaN(valor) ? 0 : valor).toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    },
    
    /**
     * Formata valor monetário a partir de string de dígitos
     */
    formatarValorMonetario: function(valorStr) {
        const valorNumerico = parseFloat(valorStr) / 100;
        return this.formatarMoeda(valorNumerico);
    },
    
    /**
     * Formata valor percentual
     */
    formatarPercentual: function(valor) {
        return ((isNaN(valor) ? 0 : valor) * 100).toLocaleString('pt-BR', {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
        }) + '%';
    },
    
    /**
     * Extrai dígitos de uma string
     */
    extrairNumeros: function(texto) {
        return (typeof texto === 'string' ? texto.replace(/\D/g, '') : '');
    },
    
    /**
    /**
    * Extrai valor numérico de texto formatado
    */
    extrairValorNumerico: function(texto) {
        if (typeof texto === 'number') return texto;
        if (typeof texto !== 'string') return 0;
    
        return texto.includes('%') ?
            parseFloat(texto.replace(/[^\d,-]/g, '').replace(',', '.')) / 100 :
            parseFloat(texto.replace(/[^\d,-]/g, '').replace(',', '.')) || 0;
    },
    
    /**
     * Aplica formatação monetária a um campo
     */
    aplicarFormatacaoMonetaria: function(campo) {
        if (campo.dataset.formatterInitialized === 'true' || this.estaEmAreaDeNavegacao(campo)) return;
        
        campo.classList.add('money-input');
        
        if (!campo.closest('.money-input-container')) {
            const container = document.createElement('div');
            container.className = 'money-input-container';
            campo.parentElement?.insertBefore(container, campo);
            container.appendChild(campo);
            
            const prefix = document.createElement('span');
            prefix.className = 'money-prefix';
            prefix.textContent = 'R$';
            container.insertBefore(prefix, campo);
        }
        
        if (campo.value) {
            const valor = this.extrairNumeros(campo.value);
            campo.value = valor ? this.formatarValorMonetario(valor) : '';
        }
        
        campo.addEventListener('input', (e) => {
            const valor = this.extrairNumeros(e.target.value);
            e.target.value = valor ? this.formatarValorMonetario(valor) : '';
        });
        
        campo.addEventListener('focus', (e) => e.target.select());
        campo.dataset.formatterInitialized = 'true';
    },
    
    /**
     * Adiciona formatação percentual a um campo
     */
    aplicarFormatacaoPercentual: function(input) {
        if (input.dataset.formatterInitialized === 'true') return;
        
        input.addEventListener('blur', () => {
            let valor = this.extrairValorNumerico(input.value);
            valor = valor > 1 ? valor / 100 : valor;
            input.value = this.formatarPercentual(valor);
        });
        
        if (input.value) {
            let valor = this.extrairValorNumerico(input.value);
            valor = valor > 1 ? valor / 100 : valor;
            input.value = this.formatarPercentual(valor);
        }
        
        input.dataset.formatterInitialized = 'true';
    }
};

// Atribuição após declaração para evitar ReferenceError
window.FormatacaoHelper = FormatHelper;

// Inicialização automática
document.addEventListener('DOMContentLoaded', () => {
    FormatHelper.inicializar();
    setTimeout(() => FormatHelper.corrigirFormatacaoIndevida(), 200);
});

// Correção ao trocar abas
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('tab-button')) {
        setTimeout(() => FormatHelper.corrigirFormatacaoIndevida(), 100);
    }
});