/**
 * FormatHelper - Utilitário unificado para formatação de valores e campos
 * Versão: 1.0.0 - Unifica funcionalidades do FormatacaoHelper e CurrencyFormatter
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
     * @param {HTMLElement} elemento - Elemento a verificar
     * @returns {boolean} - Se está em área de navegação
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
        
        return areasDeNavegacao.some(seletor => {
            return elemento.closest(seletor) !== null;
        });
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
        
        // Para cada área de navegação
        areasDeNavegacao.forEach(area => {
            // Remover prefixos R$
            document.querySelectorAll(`${area} .money-prefix`).forEach(el => {
                if (el.parentNode) {
                    el.parentNode.removeChild(el);
                }
            });
            
            // Remover containers de formatação
            document.querySelectorAll(`${area} .money-input-container`).forEach(container => {
                const elementosOriginais = Array.from(container.children)
                    .filter(el => !el.classList.contains('money-prefix'));
                
                // Reposicionar elementos originais fora do container
                elementosOriginais.forEach(el => {
                    if (container.parentNode) {
                        container.parentNode.insertBefore(el, container);
                    }
                });
                
                // Remover o container
                if (container.parentNode) {
                    container.parentNode.removeChild(container);
                }
            });
            
            // Remover classes money-input de elementos em áreas de navegação
            document.querySelectorAll(`${area} .money-input`).forEach(el => {
                el.classList.remove('money-input');
                delete el.dataset.formatterInitialized;
            });
        });
    },
    
    /**
     * Formata um valor numérico como moeda (R$)
     * @param {number} valor - Valor numérico para formatar
     * @returns {string} - Valor formatado como moeda
     */
    formatarMoeda: function(valor) {
        if (isNaN(valor)) valor = 0;
        
        return valor.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    },
    
    /**
     * Formata um valor como moeda a partir de uma string de dígitos
     * @param {string} valorStr - String contendo apenas dígitos
     * @returns {string} - Valor formatado como moeda
     */
    formatarValorMonetario: function(valorStr) {
        // Converter para número e dividir por 100 (para considerar centavos)
        const valorNumerico = parseFloat(valorStr) / 100;
        
        // Formatar no padrão brasileiro
        return this.formatarMoeda(valorNumerico);
    },
    
    /**
     * Formata um valor numérico como percentual
     * @param {number} valor - Valor numérico para formatar (decimal)
     * @returns {string} - Valor formatado como percentual
     */
    formatarPercentual: function(valor) {
        if (isNaN(valor)) valor = 0;
        
        return (valor * 100).toLocaleString('pt-BR', {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
        }) + '%';
    },
    
    /**
     * Extrai apenas os dígitos de uma string
     * @param {string} texto - Texto a ser processado
     * @returns {string} - Apenas os dígitos
     */
    extrairNumeros: function(texto) {
        if (!texto || typeof texto !== 'string') {
            return '';
        }
        return texto.replace(/\D/g, '');
    },
    
    /**
     * Extrai o valor numérico de uma string formatada
     * @param {string} texto - Texto formatado (ex: "R$ 1.234,56" ou "12,5%")
     * @returns {number} - Valor numérico extraído
     */
    extrairValorNumerico: function(texto) {
        if (typeof texto === 'number') return texto;
        
        if (!texto || typeof texto !== 'string') {
            return 0;
        }
        
        // Verificar se é uma string percentual
        if (texto.includes('%')) {
            // Remover o símbolo % e converter para decimal
            const valor = texto.replace(/[^\d,-]/g, '').replace(',', '.');
            return parseFloat(valor) / 100;
        }
        
        // Para moeda, remover símbolos e substituir vírgula por ponto
        const valor = texto.replace(/[^\d,-]/g, '').replace(',', '.');
        return parseFloat(valor) || 0;
    },
    
    /**
     * Aplica a formatação monetária a um campo específico
     * @param {HTMLElement} campo - Campo de entrada (input)
     */
    aplicarFormatacaoMonetaria: function(campo) {
        // Verificar se já foi inicializado ou se está em área de navegação
        if (campo.dataset.formatterInitialized === 'true' || this.estaEmAreaDeNavegacao(campo)) {
            return;
        }
        
        // Aplicar a classe money-input caso não tenha
        if (!campo.classList.contains('money-input')) {
            campo.classList.add('money-input');
        }
        
        // Verificar se já está em um container
        const jaTemContainer = campo.closest('.money-input-container') !== null;
        
        // Adicionar container se não existir
        if (!jaTemContainer) {
            const parent = campo.parentElement;
            if (parent) {
                // Envolver o campo em um container
                const container = document.createElement('div');
                container.className = 'money-input-container';
                parent.insertBefore(container, campo);
                container.appendChild(campo);
                
                // Adicionar o prefixo R$
                const prefix = document.createElement('span');
                prefix.className = 'money-prefix';
                prefix.textContent = 'R$';
                container.insertBefore(prefix, campo);
            }
        }
        
        // Aplicar formatação inicial se houver valor
        if (campo.value) {
            let valor = this.extrairNumeros(campo.value);
            if (valor) {
                campo.value = this.formatarValorMonetario(valor);
            } else {
                campo.value = '';
            }
        }
        
        // Armazenar referência ao FormatHelper para uso nos eventos
        const self = this;
        
        // Adicionar listeners para formatação em tempo real
        campo.addEventListener('input', function(e) {
            let valor = self.extrairNumeros(this.value);
            
            // Se não houver valor, deixar vazio
            if (!valor) {
                this.value = '';
                return;
            }
            
            // Formatar e atualizar o campo
            this.value = self.formatarValorMonetario(valor);
        });
        
        // Selecionar todo o conteúdo ao focar
        campo.addEventListener('focus', function() {
            this.select();
        });
        
        // Marcar como inicializado
        campo.dataset.formatterInitialized = 'true';
    },
    
    /**
     * Adiciona formatação percentual a um campo de entrada
     * @param {HTMLElement} input - Elemento de input para formatação
     */
    aplicarFormatacaoPercentual: function(input) {
        // Verificar se já foi inicializado
        if (input.dataset.formatterInitialized === 'true') {
            return;
        }
        
        // Armazenar referência ao FormatHelper para uso nos eventos
        const self = this;
        
        input.addEventListener('blur', function() {
            let valor = self.extrairValorNumerico(this.value);
            
            // Se o valor estiver entre 0 e 1, consideramos como decimal
            if (valor > 0 && valor < 1) {
                valor = valor;  // Já está em decimal
            } else {
                valor = valor / 100; // Converter para decimal
            }
            
            this.value = self.formatarPercentual(valor);
        });
        
        // Formatar valor inicial
        if (input.value) {
            let valor = self.extrairValorNumerico(input.value);
            
            // Se o valor estiver entre 0 e 1, consideramos como decimal
            if (valor > 0 && valor < 1) {
                valor = valor;  // Já está em decimal
            } else {
                valor = valor / 100; // Converter para decimal
            }
            
            input.value = self.formatarPercentual(valor);
        }
        
        // Marcar como inicializado
        input.dataset.formatterInitialized = 'true';
    }
};

// Inicializar automaticamente quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    FormatHelper.inicializar();
    
    // Executar também após um breve atraso para garantir que
    // outros scripts já foram executados
    setTimeout(function() {
        FormatHelper.corrigirFormatacaoIndevida();
    }, 200);
});

// Corrigir formatação indevida quando as abas são trocadas
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('tab-button')) {
        setTimeout(function() {
            FormatHelper.corrigirFormatacaoIndevida();
        }, 100);
    }
});