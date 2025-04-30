/**
 * Gerenciador do sistema de abas
 */
const TabsManager = {
    /**
     * Inicializa o sistema de abas
     */
    inicializar: function() {
        console.log('Inicializando sistema de abas');
        
        // Abas principais
        this.inicializarAbasPrincipais();
        
        // Abas de estratégias
        this.inicializarAbasEstrategias();
        
        console.log('Sistema de abas inicializado');
    },
    
    /**
	 * Modificar a função inicializarAbasPrincipais para disparar eventos
	 */
	inicializarAbasPrincipais: function() {
		const botoes = document.querySelectorAll('.tab-button');
		const conteudos = document.querySelectorAll('.tab-content');
		
		botoes.forEach(botao => {
			botao.addEventListener('click', () => {
				const tabId = botao.getAttribute('data-tab');
				
				// Remover active de todos
				botoes.forEach(b => b.classList.remove('active'));
				conteudos.forEach(c => c.classList.remove('active'));
				
				// Adicionar active ao selecionado
				botao.classList.add('active');
				document.getElementById(tabId).classList.add('active');
				
				// Disparar evento de mudança de aba
				const event = new CustomEvent('tabChange', { 
					detail: { tab: tabId }
				});
				document.dispatchEvent(event);
			});
		});
	},
    
    /**
     * Inicializa as abas de estratégias
     */
    inicializarAbasEstrategias: function() {
        const botoes = document.querySelectorAll('.strategy-tab-button');
        const conteudos = document.querySelectorAll('.strategy-tab-content');
        
        botoes.forEach(botao => {
            botao.addEventListener('click', () => {
                const tabId = botao.getAttribute('data-strategy-tab');
                
                // Remover active de todos
                botoes.forEach(b => b.classList.remove('active'));
                conteudos.forEach(c => c.classList.remove('active'));
                
                // Adicionar active ao selecionado
                botao.classList.add('active');
                document.getElementById('estrategia-' + tabId).classList.add('active');
                
                // Disparar evento de mudança de aba de estratégia
                const event = new CustomEvent('strategyTabChange', { 
                    detail: { tab: tabId }
                });
                document.dispatchEvent(event);
            });
        });
    },
    
    /**
     * Muda para uma aba específica
     * @param {string} tabId - ID da aba a ser ativada
     */
    mudarPara: function(tabId) {
        const botao = document.querySelector(`.tab-button[data-tab="${tabId}"]`);
        if (botao) {
            botao.click();
        }
    }
};
