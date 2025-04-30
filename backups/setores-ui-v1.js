// Adicionar ao final do arquivo main.js ou criar um novo arquivo setores-ui.js

/**
 * Gerenciador da UI de Setores
 */
const SetoresUI = {
    /**
     * Inicializa a UI de setores
     */
    inicializar: function() {
        console.log('Inicializando UI de setores...');
        
        // Renderizar tabela de setores
        this.renderizarTabela();
        
        // Preencher dropdown de setores na aba de simulação
        this.preencherDropdownSetores();
        
        // Inicializar eventos
        this.inicializarEventos();
        
        console.log('UI de setores inicializada com sucesso.');
    },
    
    /**
     * Renderiza a tabela de setores
     */
    renderizarTabela: function() {
        const tbody = document.querySelector('#tabela-setores tbody');
        if (!tbody) {
            console.error('Elemento tbody não encontrado');
            return;
        }
        
        // Limpar tabela
        tbody.innerHTML = '';
        
        // Obter setores do gerenciador de setores
        const setores = SetoresManager.obterTodosSetores();
        
        // Adicionar cada setor à tabela
        for (const setor of setores) {
            const tr = document.createElement('tr');
            tr.setAttribute('data-setor-codigo', setor.codigo);
            
            tr.innerHTML = `
                <td>${setor.nome}</td>
                <td>${setor.aliquotaEfetiva.toFixed(1)}</td>
                <td>${setor.reducaoEspecial.toFixed(1)}</td>
                <td>${setor.implementacaoInicial}</td>
                <td>${setor.cronogramaProprio ? 'Próprio' : 'Padrão'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="edit-btn" data-setor="${setor.codigo}" title="Editar">✏️</button>
                        <button class="delete-btn" data-setor="${setor.codigo}" title="Excluir">🗑️</button>
                    </div>
                </td>
            `;
            
            tbody.appendChild(tr);
        }
        
        // Adicionar eventos aos botões de ação
        this.adicionarEventosBotoes();
    },
    
    /**
     * Preenche o dropdown de setores na aba de simulação
     */
    preencherDropdownSetores: function() {
        const select = document.getElementById('setor');
        if (!select) {
            console.error('Elemento select não encontrado');
            return;
        }
        
        // Limpar opções, exceto a primeira (se houver)
        while (select.options.length > 1) {
            select.remove(1);
        }
        
        // Adicionar opção padrão se não existir
        if (select.options.length === 0) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'Selecione...';
            select.appendChild(option);
        }
        
        // Obter setores do gerenciador de setores
        const setores = SetoresManager.obterTodosSetores();
        
        // Adicionar cada setor ao dropdown
        for (const setor of setores) {
            const option = document.createElement('option');
            option.value = setor.codigo;
            option.textContent = setor.nome;
            select.appendChild(option);
        }
    },
    
    /**
     * Inicializa eventos
     */
    inicializarEventos: function() {
        // Botão para adicionar novo setor
        document.getElementById('btn-adicionar-setor')?.addEventListener('click', () => {
            this.mostrarFormulario('novo');
        });
        
        // Botão para importar setores da reforma
        document.getElementById('btn-importar-setores')?.addEventListener('click', () => {
            if (confirm(`Deseja importar os setores da reforma tributária? Setores com o mesmo código serão sobrescritos.`)) {
                // Aqui chamamos a função de importação do SetoresManager
                if (typeof SetoresManager.importarSetoresReforma === 'function') {
                    SetoresManager.importarSetoresReforma();
                    this.renderizarTabela();
                    this.preencherDropdownSetores();
                } else {
                    console.error('Função importarSetoresReforma não encontrada em SetoresManager');
                }
            }
        });
        
        // Botão para salvar setor
        document.getElementById('btn-salvar-setor')?.addEventListener('click', () => {
            this.salvarSetor();
        });
        
        // Botão para cancelar edição/adição
        document.getElementById('btn-cancelar-setor')?.addEventListener('click', () => {
            this.esconderFormulario();
        });
        
        // Campo de busca
        document.getElementById('busca-setor')?.addEventListener('input', (e) => {
            this.filtrarSetores(e.target.value);
        });
        
        // Eventos para modal de confirmação de exclusão
        // (adicionar o modal de confirmação se ainda não existe)
        this.adicionarModalExclusao();
    },
    
    /**
     * Adiciona modal de confirmação se necessário
     */
    adicionarModalExclusao: function() {
        if (!document.getElementById('modal-confirmar-exclusao')) {
            const modal = document.createElement('div');
            modal.id = 'modal-confirmar-exclusao';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content" style="max-width: 400px;">
                    <div class="modal-header">
                        <h3>Confirmar Exclusão</h3>
                        <span class="close">&times;</span>
                    </div>
                    <div class="modal-body">
                        <p>Tem certeza que deseja excluir o setor <span id="nome-setor-exclusao"></span>?</p>
                        <p>Esta ação não pode ser desfeita.</p>
                    </div>
                    <div class="modal-footer">
                        <button id="btn-confirmar-exclusao" class="primary">Sim, Excluir</button>
                        <button id="btn-cancelar-exclusao" class="secondary">Cancelar</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            
            // Adicionar eventos
            document.getElementById('btn-confirmar-exclusao').addEventListener('click', () => {
                this.confirmarExclusaoSetor();
            });
            
            document.getElementById('btn-cancelar-exclusao').addEventListener('click', () => {
                this.fecharModalExclusao();
            });
            
            document.querySelector('#modal-confirmar-exclusao .close').addEventListener('click', () => {
                this.fecharModalExclusao();
            });
        }
    },
    
    /**
     * Adiciona eventos aos botões de editar e excluir
     */
    adicionarEventosBotoes: function() {
        // Botões de edição
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const codigo = e.target.getAttribute('data-setor');
                this.editarSetor(codigo);
            });
        });
        
        // Botões de exclusão
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const codigo = e.target.getAttribute('data-setor');
                this.confirmarExclusao(codigo);
            });
        });
    },
    
    /**
     * Mostra o formulário para adicionar ou editar um setor
     * @param {string} modo - 'novo' ou 'editar'
     * @param {string} [codigo] - Código do setor a ser editado (apenas para modo 'editar')
     */
    mostrarFormulario: function(modo, codigo = null) {
        const form = document.getElementById('form-novo-setor');
        if (!form) return;
        
        // Definir o modo
        document.getElementById('setor-modo').value = modo;
        
        if (modo === 'editar' && codigo) {
            // Carregar dados do setor para edição
            const setor = SetoresManager.obterSetor(codigo);
            if (!setor) {
                console.error(`Setor com código ${codigo} não encontrado`);
                return;
            }
            
            document.getElementById('setor-nome').value = setor.nome;
            document.getElementById('setor-codigo').value = codigo;
            document.getElementById('setor-aliquota').value = (setor.aliquotaEfetiva * 100).toFixed(1);
            document.getElementById('setor-reducao').value = (setor.reducaoEspecial * 100).toFixed(1);
            document.getElementById('setor-implementacao').value = (setor.implementacaoInicial * 100).toFixed(0);
            document.getElementById('setor-cronograma').value = setor.cronogramaProprio ? 'proprio' : 'padrao';
            document.getElementById('setor-original-codigo').value = codigo;
            
            // Desabilitar campo de código (não deve ser alterado na edição)
            document.getElementById('setor-codigo').disabled = true;
        } else {
            // Limpar campos para novo setor
            document.getElementById('setor-nome').value = '';
            document.getElementById('setor-codigo').value = '';
            document.getElementById('setor-aliquota').value = '26.5';
            document.getElementById('setor-reducao').value = '0';
            document.getElementById('setor-implementacao').value = '10';
            document.getElementById('setor-cronograma').value = 'padrao';
            document.getElementById('setor-original-codigo').value = '';
            
            // Habilitar campo de código
            document.getElementById('setor-codigo').disabled = false;
        }
        
        // Exibir formulário
        form.style.display = 'block';
        
        // Focar no primeiro campo
        document.getElementById('setor-nome').focus();
    },
    
    /**
     * Esconde o formulário de edição/adição
     */
    esconderFormulario: function() {
        const form = document.getElementById('form-novo-setor');
        if (form) {
            form.style.display = 'none';
        }
    },
    
    /**
     * Salva o setor sendo editado/adicionado
     */
    salvarSetor: function() {
        // Obter valores do formulário
        const nome = document.getElementById('setor-nome').value.trim();
        let codigo = document.getElementById('setor-codigo').value.trim();
        const aliquota = parseFloat(document.getElementById('setor-aliquota').value) / 100; // Converter para decimal
        const reducao = parseFloat(document.getElementById('setor-reducao').value) / 100; // Converter para decimal
        const implementacao = parseFloat(document.getElementById('setor-implementacao').value) / 100; // Converter para decimal
        const cronogramaProprio = document.getElementById('setor-cronograma').value === 'proprio';
        const modo = document.getElementById('setor-modo').value;
        const codigoOriginal = document.getElementById('setor-original-codigo').value;
        
        // Validar campos obrigatórios
        if (!nome || !codigo) {
            alert('Nome e código do setor são obrigatórios');
            return;
        }
        
        // Validar código (apenas letras, números e underscores)
        if (!/^[a-z0-9_]+$/.test(codigo)) {
            alert('Código do setor deve conter apenas letras minúsculas, números e underscores (_)');
            return;
        }
        
        // Criar objeto do setor
        const setor = {
            nome: nome,
            aliquotaEfetiva: aliquota,
            reducaoEspecial: reducao,
            implementacaoInicial: implementacao,
            cronogramaProprio: cronogramaProprio
        };
        
        // Salvar no gerenciador de setores
        const codigoFinal = modo === 'editar' && codigoOriginal ? codigoOriginal : codigo;
        
        // Verificar se o código já existe (apenas para novo setor)
        if (modo === 'novo' && SetoresManager.obterSetor(codigo)) {
            alert(`Já existe um setor com o código "${codigo}"`);
            return;
        }
        
        // Remover o setor original se o código mudou
        if (modo === 'editar' && codigoOriginal && codigoOriginal !== codigo) {
            SetoresManager.removerSetor(codigoOriginal);
        }
        
        // Salvar o setor
        SetoresManager.salvarSetor(codigo, setor);
        
        // Atualizar a interface
        this.renderizarTabela();
        this.preencherDropdownSetores();
        this.esconderFormulario();
        
        // Notificar o usuário
        alert(`Setor "${nome}" ${modo === 'editar' ? 'atualizado' : 'adicionado'} com sucesso!`);
    },
    
    /**
     * Abre confirmação para excluir um setor
     * @param {string} codigo - Código do setor a ser excluído
     */
    confirmarExclusao: function(codigo) {
        const setor = SetoresManager.obterSetor(codigo);
        if (!setor) {
            alert(`Setor com código "${codigo}" não encontrado`);
            return;
        }
        
        // Armazenar o código do setor a ser excluído
        this.setorParaExcluir = codigo;
        
        // Preencher o nome do setor no modal
        document.getElementById('nome-setor-exclusao').textContent = setor.nome;
        
        // Exibir modal
        document.getElementById('modal-confirmar-exclusao').style.display = 'block';
    },
    
    /**
     * Fecha o modal de confirmação de exclusão
     */
    fecharModalExclusao: function() {
        document.getElementById('modal-confirmar-exclusao').style.display = 'none';
        this.setorParaExcluir = null;
    },
    
    /**
     * Confirma e executa a exclusão do setor
     */
    confirmarExclusaoSetor: function() {
        if (!this.setorParaExcluir) {
            alert('Erro ao excluir setor. Código do setor não encontrado.');
            this.fecharModalExclusao();
            return;
        }
        
        // Obter nome do setor antes de excluir (para a mensagem)
        const setor = SetoresManager.obterSetor(this.setorParaExcluir);
        const nomeSetor = setor ? setor.nome : 'Desconhecido';
        
        // Excluir o setor
        SetoresManager.removerSetor(this.setorParaExcluir);
        
        // Atualizar a interface
        this.renderizarTabela();
        this.preencherDropdownSetores();
        this.fecharModalExclusao();
        
        // Notificar o usuário
        alert(`Setor "${nomeSetor}" excluído com sucesso!`);
    },
    
    /**
     * Filtra os setores na tabela
     * @param {string} termo - Termo de busca
     */
    filtrarSetores: function(termo) {
        const termoBusca = termo.toLowerCase();
        const linhas = document.querySelectorAll('#tabela-setores tbody tr');
        
        linhas.forEach(linha => {
            const codigo = linha.getAttribute('data-setor-codigo');
            const setor = SetoresManager.obterSetor(codigo);
            
            if (!setor) return;
            
            // Verificar se o nome do setor contém o termo de busca
            const conteudoSetor = setor.nome.toLowerCase();
            linha.style.display = conteudoSetor.includes(termoBusca) ? '' : 'none';
        });
    },
    
    // Variável para armazenar o código do setor a ser excluído
    setorParaExcluir: null
};

// Inicializar a UI de setores quando o documento estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    // Verificar se estamos na aba de configurações
    if (document.getElementById('tabela-setores')) {
        SetoresUI.inicializar();
    }
    
    // Adicionar observador para mudanças de aba
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            if (tabId === 'configuracoes' && document.getElementById('tabela-setores')) {
                SetoresUI.inicializar();
            } else if (tabId === 'simulacao') {
                // Atualizar dropdown de setores quando a aba de simulação for aberta
                SetoresUI.preencherDropdownSetores();
            }
        });
    });
});