/**
 * Formatador de Moeda em Tempo Real
 * Implementa formatação monetária à medida que o usuário digita
 */
const CurrencyFormatter = {
    /**
     * Inicializa o formatador em campos monetários específicos
     */
    inicializar: function() {
        console.log('Inicializando formatador de moeda em tempo real');
        
        // Primeiro, corrigir qualquer formatação indevida nas áreas de navegação
        this.corrigirFormatacaoIndevida();
        
        // Selecionar todos os campos monetários pelo seletor de classe
        const camposMoeda = document.querySelectorAll('input.money-input');
        
        // Aplicar formatação a cada campo válido
        camposMoeda.forEach(campo => {
            // Verificar se não está em uma área de navegação
            if (!this.estaEmAreaDeNavegacao(campo)) {
                this.aplicarFormatacaoMoeda(campo);
            }
        });
        
        // Campos específicos por ID (garantia extra)
        const camposEspecificos = [
            'faturamento',
            'faturamento-config', 
            'creditos',
            'creditos-config'
        ];
        
        camposEspecificos.forEach(id => {
            const campo = document.getElementById(id);
            if (campo) {
                this.aplicarFormatacaoMoeda(campo);
            }
        });
        
        console.log('Formatador de moeda em tempo real inicializado');
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
                delete el.dataset.currencyInitialized;
            });
        });
    },
    
    /**
     * Aplica a formatação monetária a um campo específico
     * @param {HTMLElement} campo - Campo de entrada (input)
     */
    aplicarFormatacaoMoeda: function(campo) {
        // Verificar se já foi inicializado ou se está em área de navegação
        if (campo.dataset.currencyInitialized === 'true' || this.estaEmAreaDeNavegacao(campo)) {
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
                container.appendChild(prefix);
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
        
        // Adicionar listeners para formatação em tempo real
        campo.addEventListener('input', function(e) {
            let valor = CurrencyFormatter.extrairNumeros(this.value);
            
            // Se não houver valor, deixar vazio
            if (!valor) {
                this.value = '';
                return;
            }
            
            // Formatar e atualizar o campo
            this.value = CurrencyFormatter.formatarValorMonetario(valor);
        });
        
        // Selecionar todo o conteúdo ao focar
        campo.addEventListener('focus', function() {
            this.select();
        });
        
        // Marcar como inicializado
        campo.dataset.currencyInitialized = 'true';
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
     * Formata um valor numérico como moeda brasileira
     * @param {string} valor - Valor em string (apenas dígitos)
     * @returns {string} - Valor formatado (ex: R$ 1.234,56)
     */
    formatarValorMonetario: function(valor) {
        // Converter para número e dividir por 100 (para considerar centavos)
        const valorNumerico = parseFloat(valor) / 100;
        
        // Formatar no padrão brasileiro
        return valorNumerico.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }
};

// Inicializar automaticamente quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    CurrencyFormatter.inicializar();
    
    // Executar também após um breve atraso para garantir que
    // outros scripts já foram executados
    setTimeout(function() {
        CurrencyFormatter.corrigirFormatacaoIndevida();
    }, 200);
});

// Corrigir formatação indevida quando as abas são trocadas
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('tab-button')) {
        setTimeout(function() {
            CurrencyFormatter.corrigirFormatacaoIndevida();
        }, 100);
    }
});