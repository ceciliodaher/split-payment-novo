/**
 * Módulo de Configurações Setoriais
 * Versão: 3.0.0 - Adaptado para usar SetoresRepository unificado
 */
(function() {
    // Verificar se o objeto SimuladorApp existe
    if (typeof SimuladorApp === 'undefined') {
        window.SimuladorApp = {};
    }

    // Adicionar o módulo de Configurações Setoriais ao SimuladorApp
    SimuladorApp.ConfiguracoesSetoriais = {
        // Método de inicialização
        inicializar: function() {
            console.log('Inicializando módulo ConfiguracoesSetoriais (adaptado)...');

            // Verificar se o SetoresRepository existe
            if (typeof SetoresRepository === 'undefined') {
                console.error('SetoresRepository não encontrado. Algumas funcionalidades podem não funcionar corretamente.');
            } else {
                // Inicializar o repositório
                SetoresRepository.inicializar();
            }

            // Inicializar componentes da interface
            this._inicializarInterface();
            
            // Configurar event listeners
            this._configurarEventListeners();

            console.log('Módulo ConfiguracoesSetoriais inicializado com sucesso');
        },
        
        // Métodos públicos - reutilizando o repositório
        adicionarSetor: function() {
            // Redirecionar para a função global
            if (typeof window.adicionarSetor === 'function') {
                window.adicionarSetor();
                return;
            }
            
            // Fallback - Implementação simplificada
            console.log('Adicionando novo setor via repositório...');
            const totalLinhas = document.querySelectorAll('#sector-table tbody tr').length;
            const novoId = totalLinhas + 1;
            
            const novaLinha = this._criarLinhaSetor(novoId);
            
            const tabelaSetores = document.getElementById('sector-table');
            if (tabelaSetores && tabelaSetores.getElementsByTagName('tbody')[0]) {
                tabelaSetores.getElementsByTagName('tbody')[0].appendChild(novaLinha);
                
                // Adicionar eventos
                const selectSetor = novaLinha.querySelector('.setor-select');
                if (selectSetor) {
                    selectSetor.addEventListener('change', this._preencherDadosSetor.bind(this));
                }
            }
        },

        removerSetor: function(id) {
            // Redirecionar para a função global
            if (typeof window.removerSetor === 'function') {
                window.removerSetor(id);
                return;
            }
            
            // Implementação de fallback - remover a linha da tabela
            if (confirm('Confirma a exclusão deste setor?')) {
                const linha = document.getElementById(`setor-${id}`);
                if (linha) {
                    // Obter o código do setor
                    const selectSetor = linha.querySelector('.setor-select');
                    const codigoSetor = selectSetor ? selectSetor.value : null;
                    
                    // Se tiver código válido, remover do repositório
                    if (codigoSetor) {
                        SetoresRepository.removerSetor(codigoSetor);
                    }
                    
                    // Remover a linha da tabela
                    if (linha.parentNode) {
                        linha.parentNode.removeChild(linha);
                    }
                }
            }
        },

        configurarCronogramaSetor: function(id) {
            // Redirecionar para a função global
            if (typeof window.configurarCronogramaSetor === 'function') {
                window.configurarCronogramaSetor(id);
                return;
            }
            
            // Implementação de fallback
            const linha = document.getElementById(`setor-${id}`);
            if (!linha) return;
            
            // Obter o select do setor
            const selectSetor = linha.querySelector('.setor-select');
            if (!selectSetor) return;
            
            // Definir que o setor usar cronograma próprio
            const selectCronograma = linha.querySelector('select[name^="setor-cronograma-"]');
            if (selectCronograma) {
                selectCronograma.value = "proprio";
            }
            
            // Obter código e nome do setor
            const codigoSetor = selectSetor.value;
            const nomeSetor = selectSetor.options[selectSetor.selectedIndex]?.text || "Setor";
            
            // Preparar o modal
            this._prepararModalCronograma(id, codigoSetor, nomeSetor);
            
            // Exibir o modal
            const modal = document.getElementById('modal-cronograma-setor');
            if (modal) {
                modal.style.display = 'block';
            }
        },

        salvarCronogramaSetor: function() {
            // Redirecionar para a função global
            if (typeof window.salvarCronogramaSetor === 'function') {
                window.salvarCronogramaSetor();
                return;
            }
            
            // Implementação de fallback
            const setorId = document.getElementById('modal-setor-id').value;
            const setorCodigo = document.getElementById('modal-setor-codigo')?.value;
            
            if (!setorId || !setorCodigo) {
                console.error('ID ou código do setor não encontrado');
                return;
            }
            
            // Coletar o cronograma
            const cronograma = {};
            for (let ano = 2026; ano <= 2033; ano++) {
                const input = document.querySelector(`input[name="modal-perc-${ano}"]`);
                if (input) {
                    cronograma[ano] = parseFloat(input.value) || 0;
                }
            }
            
            // Salvar no repositório
            SetoresRepository.salvarCronogramaSetor(setorCodigo, cronograma);
            
            // Atualizar a interface
            const selectCronograma = document.querySelector(`select[name="setor-cronograma-${setorId}"]`);
            if (selectCronograma) {
                selectCronograma.value = 'proprio';
            }
            
            // Fechar o modal
            this.fecharModalCronograma();
        },

        fecharModalCronograma: function() {
            // Redirecionar para a função global
            if (typeof window.fecharModalCronograma === 'function') {
                window.fecharModalCronograma();
                return;
            }
            
            // Implementação de fallback
            const modal = document.getElementById('modal-cronograma-setor');
            if (modal) {
                modal.style.display = 'none';
            }
        },

        restaurarCronogramaPadrao: function() {
            if (confirm('Confirma a restauração do cronograma para os valores padrão?')) {
                const cronogramaPadrao = SetoresRepository.obterConfiguracoesGerais().cronogramaPadrao;
                
                for (let ano = 2026; ano <= 2033; ano++) {
                    const input = document.querySelector(`input[name="perc-${ano}"]`);
                    if (input) {
                        input.value = cronogramaPadrao[ano];
                    }
                    
                    const inputObs = document.querySelector(`input[name="obs-${ano}"]`);
                    if (inputObs) {
                        inputObs.value = '';
                    }
                }
            }
        },

        salvarConfiguracoes: function() {
            try {
                // Coletar configurações gerais
                const configuracoesGerais = {
                    aliquotaCBS: parseFloat(document.getElementById('aliquota-cbs').value) || 8.8,
                    aliquotaIBS: parseFloat(document.getElementById('aliquota-ibs').value) || 17.7,
                    dataInicio: document.getElementById('data-inicio').value || '2026-01',
                    cronogramaPadrao: {}
                };
                
                // Coletar cronograma geral
                for (let ano = 2026; ano <= 2033; ano++) {
                    const input = document.querySelector(`input[name="perc-${ano}"]`);
                    if (input) {
                        configuracoesGerais.cronogramaPadrao[ano] = parseFloat(input.value) || 0;
                    }
                }
                
                // Coletar parâmetros financeiros
                const parametrosFinanceiros = {
                    taxaAntecipacao: parseFloat(document.getElementById('taxa-antecipacao').value) || 1.8,
                    taxaCapitalGiro: parseFloat(document.getElementById('taxa-capital-giro').value) || 2.1,
                    spreadBancario: parseFloat(document.getElementById('spread-bancario').value) || 3.5,
                    observacoes: document.getElementById('observacoes-financeiras') ? 
                        document.getElementById('observacoes-financeiras').value : ''
                };
                
                // Salvar no repositório
                SetoresRepository.salvarConfiguracoesGerais(configuracoesGerais);
                SetoresRepository.salvarParametrosFinanceiros(parametrosFinanceiros);
                
                alert('Configurações salvas com sucesso!');
                return true;
            } catch (error) {
                console.error('Erro ao salvar configurações:', error);
                alert('Erro ao salvar configurações: ' + error.message);
                return false;
            }
        },

        restaurarPadroes: function() {
            if (confirm('Tem certeza que deseja restaurar todas as configurações para os valores padrão? Isso apagará todas as personalizações.')) {
                try {
                    // Restaurar via repositório
                    SetoresRepository.restaurarPadroes();
                    
                    // Atualizar a interface
                    this._carregarConfiguracoesNaInterface();
                    
                    alert('Todas as configurações foram restauradas para os valores padrão.');
                    return true;
                } catch (error) {
                    console.error('Erro ao restaurar configurações padrão:', error);
                    alert('Erro ao restaurar configurações padrão: ' + error.message);
                    return false;
                }
            }
        },

        // Métodos privados
        _inicializarInterface: function() {
            // Carregar configurações na interface
            this._carregarConfiguracoesNaInterface();
            
            // Configurar selects existentes
            this._configurarSelectsExistentes();
            
            // Forçar atualização de todos os selects
            this._atualizarTodosSelects();
        },
        
        _carregarConfiguracoesNaInterface: function() {
            // Carregar configurações gerais
            const configsGerais = SetoresRepository.obterConfiguracoesGerais();
            
            // Atualizar campos
            const aliquotaCBS = document.getElementById('aliquota-cbs');
            const aliquotaIBS = document.getElementById('aliquota-ibs');
            const dataInicio = document.getElementById('data-inicio');
            
            if (aliquotaCBS) aliquotaCBS.value = configsGerais.aliquotaCBS;
            if (aliquotaIBS) aliquotaIBS.value = configsGerais.aliquotaIBS;
            if (dataInicio) dataInicio.value = configsGerais.dataInicio;
            
            // Atualizar cronograma
            const cronograma = configsGerais.cronogramaPadrao;
            for (let ano = 2026; ano <= 2033; ano++) {
                const input = document.querySelector(`input[name="perc-${ano}"]`);
                if (input && cronograma[ano] !== undefined) {
                    input.value = cronograma[ano];
                }
            }
            
            // Carregar parâmetros financeiros
            const paramsFinanceiros = SetoresRepository.obterParametrosFinanceiros();
            
            const taxaAntecipacao = document.getElementById('taxa-antecipacao');
            const taxaCapitalGiro = document.getElementById('taxa-capital-giro');
            const spreadBancario = document.getElementById('spread-bancario');
            const obsFinanceiras = document.getElementById('observacoes-financeiras');
            
            if (taxaAntecipacao) taxaAntecipacao.value = paramsFinanceiros.taxaAntecipacao;
            if (taxaCapitalGiro) taxaCapitalGiro.value = paramsFinanceiros.taxaCapitalGiro;
            if (spreadBancario) spreadBancario.value = paramsFinanceiros.spreadBancario;
            if (obsFinanceiras) obsFinanceiras.value = paramsFinanceiros.observacoes;
        },
        
        _configurarEventListeners: function() {
            try {
                // Botões principais
                document.getElementById('btn-adicionar-setor')?.addEventListener('click', this.adicionarSetor.bind(this));
                document.getElementById('btn-restaurar-cronograma')?.addEventListener('click', this.restaurarCronogramaPadrao.bind(this));
                document.getElementById('btn-salvar-configuracoes')?.addEventListener('click', this.salvarConfiguracoes.bind(this));
                document.getElementById('btn-restaurar-padroes')?.addEventListener('click', this.restaurarPadroes.bind(this));
                
                // Botões do modal
                document.getElementById('btn-salvar-cronograma-setor')?.addEventListener('click', this.salvarCronogramaSetor.bind(this));
                document.getElementById('btn-cancelar-modal')?.addEventListener('click', this.fecharModalCronograma.bind(this));
                document.getElementById('btn-fechar-modal')?.addEventListener('click', this.fecharModalCronograma.bind(this));
                
                // Adicionar eventos aos selects existentes
                document.querySelectorAll('.setor-select').forEach(select => {
                    select.addEventListener('change', this._preencherDadosSetor.bind(this));
                });
                
                console.log('Event listeners configurados com sucesso');
            } catch (error) {
                console.error('Erro ao configurar event listeners:', error);
            }
        },
        
        _preencherDadosSetor: function(event) {
            try {
                const select = event.target;
                const setorId = select.dataset.id;
                const setorCodigo = select.value;
                
                if (!setorId || !setorCodigo) {
                    console.warn('ID do setor ou código do setor não encontrados');
                    return;
                }
                
                // Obter setor do repositório
                const setor = SetoresRepository.obterSetor(setorCodigo);
                if (!setor) {
                    console.warn(`Setor com código ${setorCodigo} não encontrado`);
                    return;
                }

                // Preencher a alíquota efetiva
                const inputAliquota = document.querySelector(`input[name="setor-aliquota-${setorId}"]`);
                if (inputAliquota) {
                    inputAliquota.value = setor.aliquotaEfetiva ? (setor.aliquotaEfetiva * 100).toFixed(2) : 26.5;
                }

                // Preencher a redução especial
                const inputReducao = document.querySelector(`input[name="setor-reducao-${setorId}"]`);
                if (inputReducao) {
                    inputReducao.value = setor.reducaoEspecial ? (setor.reducaoEspecial * 100).toFixed(2) : 0;
                }

                // Configurar cronograma próprio, se aplicável
                const selectCronograma = document.querySelector(`select[name="setor-cronograma-${setorId}"]`);
                if (selectCronograma && setor.cronogramaProprio) {
                    selectCronograma.value = 'proprio';
                }
                
                console.log(`Dados do setor ${setor.nome} preenchidos com sucesso`);
            } catch (error) {
                console.error('Erro ao preencher dados do setor:', error);
            }
        },
        
        _configurarSelectsExistentes: function() {
            try {
                // Substituir inputs de texto existentes por selects
                const linhasSetores = document.querySelectorAll('#sector-table tbody tr');
                if (!linhasSetores.length) {
                    console.warn('Nenhuma linha de setor encontrada');
                    return;
                }

                linhasSetores.forEach(linha => {
                    const setorId = linha.id.replace('setor-', '');
                    const inputNome = linha.querySelector(`input[name="setor-nome-${setorId}"]`);
                    
                    if (inputNome) {
                        const nomeAtual = inputNome.value;
                        const tdNome = inputNome.parentNode;
                        
                        if (!tdNome) {
                            console.warn(`TD pai não encontrado para o input de nome do setor ${setorId}`);
                            return;
                        }

                        // Criar select com opções
                        const todosSetores = SetoresRepository.obterParaDropdown();
                        const opcoesHtml = todosSetores
                            .sort((a, b) => a.nome.localeCompare(b.nome))
                            .map(setor => `<option value="${setor.codigo}">${setor.nome}</option>`)
                            .join('');
                            
                        const selectHTML = `
                            <select name="setor-nome-${setorId}" class="setor-select" data-id="${setorId}">
                                <option value="">Selecione um setor...</option>
                                ${opcoesHtml}
                            </select>
                        `;
                        
                        tdNome.innerHTML = selectHTML;

                        // Tentar selecionar a opção que corresponde ao nome atual
                        const selectNovo = tdNome.querySelector('select');
                        if (selectNovo) {
                            // Procurar opção por texto
                            const options = Array.from(selectNovo.options);
                            const optionCorrespondente = options.find(option => option.text === nomeAtual);
                            
                            if (optionCorrespondente) {
                                selectNovo.value = optionCorrespondente.value;
                            }

                            // Adicionar evento de mudança
                            selectNovo.addEventListener('change', this._preencherDadosSetor.bind(this));
                        }
                    }
                });
                
                console.log('Selects existentes configurados com sucesso');
            } catch (error) {
                console.error('Erro ao configurar selects existentes:', error);
            }
        },
        
        _atualizarTodosSelects: function() {
            try {
                const todosSetores = SetoresRepository.obterParaDropdown();
                const opcoesHtml = todosSetores
                    .sort((a, b) => a.nome.localeCompare(b.nome))
                    .map(setor => `<option value="${setor.codigo}">${setor.nome}</option>`)
                    .join('');
                
                document.querySelectorAll('.setor-select').forEach(select => {
                    const valorAtual = select.value;
                    
                    // Preservar o valor selecionado
                    select.innerHTML = `
                        <option value="">Selecione um setor...</option>
                        ${opcoesHtml}
                    `;

                    // Restaurar o valor selecionado
                    if (valorAtual) {
                        select.value = valorAtual;
                    }
                });

                // Atualizar também o select da aba de simulação
                SetoresRepository.preencherDropdown('setor');
                
                console.log('Todos os selects atualizados com sucesso');
            } catch (error) {
                console.error('Erro ao atualizar selects:', error);
            }
        },
        
        _prepararModalCronograma: function(id, codigoSetor, nomeSetor) {
            // Atualizar o modal
            const modalSetorNome = document.getElementById('modal-setor-nome');
            const modalSetorId = document.getElementById('modal-setor-id');
            const modalSetorCodigo = document.getElementById('modal-setor-codigo');
            
            if (modalSetorNome) modalSetorNome.textContent = nomeSetor;
            if (modalSetorId) modalSetorId.value = id;
            if (modalSetorCodigo) modalSetorCodigo.value = codigoSetor;

            // Obter cronograma atual
            let cronogramaAtual = null;
            if (codigoSetor) {
                // Verificar se há cronograma próprio
                const setor = SetoresRepository.obterSetor(codigoSetor);
                if (setor && setor.cronogramaProprio) {
                    cronogramaAtual = SetoresRepository.obterCronogramaImplementacao(codigoSetor);
                }
            }
            
            // Se não tem cronograma próprio, usar o padrão
            if (!cronogramaAtual) {
                cronogramaAtual = SetoresRepository.obterConfiguracoesGerais().cronogramaPadrao;
            }

            // Preencher tabela do modal
            const tabelaCronograma = document.getElementById('cronograma-setor-table');
            if (tabelaCronograma) {
                const tbody = tabelaCronograma.getElementsByTagName('tbody')[0];
                if (tbody) {
                    tbody.innerHTML = '';

                    for (let ano = 2026; ano <= 2033; ano++) {
                        const linha = document.createElement('tr');
                        linha.innerHTML = `
                            <td>${ano}</td>
                            <td><input type="number" name="modal-perc-${ano}" min="0" max="100" step="0.1" value="${cronogramaAtual[ano]}"></td>
                            <td><input type="text" name="modal-obs-${ano}" placeholder="Observações..."></td>
                        `;
                        tbody.appendChild(linha);
                    }
                }
            }
        },
        
        _criarLinhaSetor: function(id) {
            const tr = document.createElement('tr');
            tr.id = `setor-${id}`;
            
            // Obter opções de setores
            const todosSetores = SetoresRepository.obterParaDropdown();
            const opcoesHtml = todosSetores
                .sort((a, b) => a.nome.localeCompare(b.nome))
                .map(setor => `<option value="${setor.codigo}">${setor.nome}</option>`)
                .join('');
            
            tr.innerHTML = `
                <td>
                    <select name="setor-nome-${id}" class="setor-select" data-id="${id}">
                        <option value="">Selecione um setor...</option>
                        ${opcoesHtml}
                    </select>
                </td>
                <td><input type="number" name="setor-aliquota-${id}" min="0" max="100" step="0.01" value="26.5"></td>
                <td><input type="number" name="setor-reducao-${id}" min="0" max="100" step="0.01" value="0"></td>
                <td>
                    <select name="setor-cronograma-${id}">
                        <option value="padrao">Cronograma Padrão</option>
                        <option value="proprio">Cronograma Específico</option>
                    </select>
                </td>
                <td>
                    <button type="button" class="btn btn-outline btn-sm" onclick="configurarCronogramaSetor(${id})">Configurar</button>
                    <button type="button" class="btn btn-accent btn-sm" onclick="removerSetor(${id})">Remover</button>
                </td>
            `;
            
            return tr;
        }
    };

    // Inicialização automática quando o DOM estiver carregado
    document.addEventListener('DOMContentLoaded', function() {
        console.log('DOM carregado, verificando se deve inicializar ConfiguracoesSetoriais');
        
        // Verificar se estamos na aba de configurações setoriais
        const abas = document.querySelectorAll('.tab-button');
        let abaAtiva = null;
        
        abas.forEach(function(aba) {
            if (aba.classList.contains('active')) {
                abaAtiva = aba;
            }
            
            // Adicionar listener para inicializar quando mudar para a aba de configurações
            aba.addEventListener('click', function() {
                if (this.getAttribute('data-tab') === 'configuracoes') {
                    console.log('Aba configurações ativada, inicializando módulo');
                    SimuladorApp.ConfiguracoesSetoriais.inicializar();
                }
            });
        });
        
        // Se a aba ativa for a de configurações, inicializar
        if (abaAtiva && abaAtiva.getAttribute('data-tab') === 'configuracoes') {
            console.log('Aba configurações já está ativa, inicializando módulo');
            SimuladorApp.ConfiguracoesSetoriais.inicializar();
        }
    });
})();