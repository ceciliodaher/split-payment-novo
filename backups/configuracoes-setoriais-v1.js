// Adicione este código ao final do arquivo configuracoes-setoriais.js
// ou crie um novo arquivo e importe-o

document.addEventListener('DOMContentLoaded', function() {
    // Verificar se estamos na aba de configurações
    const abas = document.querySelectorAll('.tab-button');
    
    abas.forEach(function(aba) {
        aba.addEventListener('click', function() {
            // Use o valor data-tab exato que a aba atual tem
            if (this.getAttribute('data-tab') === 'configuracoes') {
                // Inicializar o módulo quando a aba for ativada
                if (SimuladorApp && SimuladorApp.ConfiguracoesSetoriais) {
                    SimuladorApp.ConfiguracoesSetoriais.inicializar();
                    
                    // Forçar atualização dos selects de setores
                    const selectsSetores = document.querySelectorAll('.setor-select');
                    selectsSetores.forEach(function(select) {
                        // Preencher com as opções de setores do SetoresManager
                        if (typeof SetoresManager !== 'undefined') {
                            SetoresManager.inicializar();
                            
                            // Limpar opções existentes exceto a primeira
                            while (select.options.length > 1) {
                                select.remove(1);
                            }
                            
                            // Adicionar setores como opções
                            for (const [codigo, setor] of Object.entries(SetoresManager.setores)) {
                                const option = document.createElement('option');
                                option.value = codigo;
                                option.textContent = setor.nome;
                                select.appendChild(option);
                            }
                        }
                    });
                }
            }
        });
    });
    
    // Se a aba de configurações setoriais já estiver ativa, inicializar imediatamente
    const abaAtiva = document.querySelector('.tab-button.active');
    if (abaAtiva && abaAtiva.getAttribute('data-tab') === 'configuracoes-setoriais') {
        if (SimuladorApp && SimuladorApp.ConfiguracoesSetoriais) {
            SimuladorApp.ConfiguracoesSetoriais.inicializar();
        }
    }
});
