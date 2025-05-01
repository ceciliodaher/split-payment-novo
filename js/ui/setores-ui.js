/**
 * Gerenciador de Interface dos Setores
 * Versão: 2.0.0 - Adaptado para usar SetoresRepository
 */

// Função para inicializar a tabela de setores
function inicializarTabelaSetores() {
    // Verificar se estamos na página correta e se a tabela existe
    const tabelaSetores = document.getElementById('sector-table');
    if (!tabelaSetores) return;
    
    // Limpar a tabela
    const tbody = tabelaSetores.getElementsByTagName('tbody')[0];
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    // Verificar se o SetoresRepository está disponível
    if (typeof SetoresRepository === 'undefined') {
        console.error('SetoresRepository não encontrado. Não é possível inicializar a tabela de setores.');
        return;
    }
    
    // Garantir que o repositório está inicializado
    SetoresRepository.inicializar();
    
    // Obter todos os setores
    const todosSetores = SetoresRepository.obterTodos();
    const setoresList = Object.keys(todosSetores).map(codigo => ({
        codigo: codigo,
        ...todosSetores[codigo]
    })).sort((a, b) => a.nome.localeCompare(b.nome));
    
    // Adicionar cada setor à tabela
    let nextId = 1;
    setoresList.forEach(setor => {
        const tr = document.createElement('tr');
        tr.id = `setor-${nextId}`;
        
        // Obter valores formatados para exibição
        const aliquotaEfetiva = setor.aliquotaEfetiva ? (setor.aliquotaEfetiva * 100).toFixed(1) : '26.5';
        const reducaoEspecial = setor.reducaoEspecial ? (setor.reducaoEspecial * 100).toFixed(1) : '0.0';
        const cronogramaProprio = setor.cronogramaProprio ? 'proprio' : 'padrao';
        
        tr.innerHTML = `
            <td>
                <select name="setor-nome-${nextId}" class="setor-select" data-id="${nextId}" data-codigo="${setor.codigo}">
                    <option value="">Selecione um setor...</option>
                    ${obterOpcoesSetores(setor.codigo)}
                </select>
            </td>
            <td><input type="number" name="setor-aliquota-${nextId}" data-campo="aliquota" value="${aliquotaEfetiva}" min="0" max="100" step="0.1"></td>
            <td><input type="number" name="setor-reducao-${nextId}" data-campo="reducao" value="${reducaoEspecial}" min="0" max="100" step="0.1"></td>
            <td>
                <select name="setor-cronograma-${nextId}" data-campo="cronograma">
                    <option value="padrao" ${cronogramaProprio === 'padrao' ? 'selected' : ''}>Padrão</option>
                    <option value="proprio" ${cronogramaProprio === 'proprio' ? 'selected' : ''}>Próprio</option>
                </select>
            </td>
            <td>
                <button type="button" class="btn btn-outline btn-sm" onclick="configurarCronogramaSetor(${nextId})">Configurar</button>
                <button type="button" class="btn btn-accent btn-sm" onclick="removerSetor(${nextId})">Remover</button>
            </td>
        `;
        
        tbody.appendChild(tr);
        nextId++;
    });
    
    // Adicionar eventos aos selects
    document.querySelectorAll('.setor-select').forEach(select => {
        select.addEventListener('change', preencherDadosSetor);
    });
    
    console.log(`Tabela de setores inicializada com ${setoresList.length} setores`);
}

// Função auxiliar para obter opções de setores com um setor pré-selecionado
function obterOpcoesSetores(setorSelecionado) {
    if (typeof SetoresRepository === 'undefined') {
        console.error('SetoresRepository não encontrado');
        return '';
    }
    
    const todosSetores = SetoresRepository.obterTodos();
    
    return Object.entries(todosSetores)
        .sort(([, a], [, b]) => a.nome.localeCompare(b.nome))
        .map(([codigo, setor]) => 
            `<option value="${codigo}" ${codigo === setorSelecionado ? 'selected' : ''}>${setor.nome}</option>`
        ).join('');
}

// Manipulador de evento para preencher dados quando um setor é selecionado
function preencherDadosSetor(event) {
    const select = event.target;
    const id = select.dataset.id;
    const codigoSetor = select.value;
    
    if (!id || !codigoSetor) return;
    
    if (typeof SetoresRepository === 'undefined') {
        console.error('SetoresRepository não encontrado');
        return;
    }
    
    const setor = SetoresRepository.obterSetor(codigoSetor);
    if (!setor) {
        console.warn(`Setor com código ${codigoSetor} não encontrado`);
        return;
    }
    
    // Preencher campos
    const inputAliquota = document.querySelector(`input[name="setor-aliquota-${id}"]`);
    const inputReducao = document.querySelector(`input[name="setor-reducao-${id}"]`);
    const selectCronograma = document.querySelector(`select[name="setor-cronograma-${id}"]`);
    
    if (inputAliquota) {
        inputAliquota.value = (setor.aliquotaEfetiva * 100).toFixed(1);
    }
    
    if (inputReducao) {
        inputReducao.value = (setor.reducaoEspecial * 100).toFixed(1);
    }
    
    if (selectCronograma && setor.cronogramaProprio) {
        selectCronograma.value = 'proprio';
    }
    
    console.log(`Dados do setor ${setor.nome} preenchidos`);
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM carregado, verificando se deve inicializar a tabela de setores');
    
    // Preencher o dropdown na aba de simulação
    if (typeof SetoresRepository !== 'undefined') {
        SetoresRepository.preencherDropdown('setor');
    }
    
    // Verificar se estamos na aba de configurações
    const abas = document.querySelectorAll('.tab-button');
    let abaAtiva = null;
    
    abas.forEach(function(aba) {
        if (aba.classList.contains('active')) {
            abaAtiva = aba;
        }
        
        // Adicionar listener para inicializar quando mudar para a aba de configurações
        aba.addEventListener('click', function() {
            if (this.getAttribute('data-tab') === 'configuracoes') {
                console.log('Aba configurações ativada, inicializando tabela de setores');
                inicializarTabelaSetores();
            }
        });
    });
    
    // Se a aba ativa for a de configurações, inicializar
    if (abaAtiva && abaAtiva.getAttribute('data-tab') === 'configuracoes') {
        console.log('Aba configurações já está ativa, inicializando tabela de setores');
        inicializarTabelaSetores();
    }
});

// Funções globais para serem chamadas pelos atributos onclick
window.configurarCronogramaSetor = function(id) {
    const linha = document.getElementById(`setor-${id}`);
    if (!linha) return;
    
    const select = linha.querySelector('.setor-select');
    if (!select) return;
    
    const codigoSetor = select.value;
    const nomeSetor = select.options[select.selectedIndex].text;
    
    // Atualizar o modal
    const modalSetorNome = document.getElementById('modal-setor-nome');
    const modalSetorId = document.getElementById('modal-setor-id');
    const modalSetorCodigo = document.getElementById('modal-setor-codigo');
    
    if (modalSetorNome) modalSetorNome.textContent = nomeSetor;
    if (modalSetorId) modalSetorId.value = id;
    if (modalSetorCodigo) modalSetorCodigo.value = codigoSetor;
    
    // Preencher tabela do modal com cronograma próprio ou padrão
    const tabelaCronograma = document.getElementById('cronograma-setor-table');
    if (tabelaCronograma) {
        const tbody = tabelaCronograma.getElementsByTagName('tbody')[0];
        if (tbody) {
            tbody.innerHTML = '';
            
            // Obter cronograma específico do setor ou usar padrão
            let cronograma = {
                2026: 10.0,
                2027: 25.0,
                2028: 40.0,
                2029: 55.0,
                2030: 70.0,
                2031: 85.0,
                2032: 95.0,
                2033: 100.0
            };
            
            // Se o repositório estiver disponível, tente obter o cronograma específico
            if (typeof SetoresRepository !== 'undefined' && codigoSetor) {
                const setor = SetoresRepository.obterSetor(codigoSetor);
                if (setor && setor.cronogramaProprio && setor.cronogramaValores) {
                    cronograma = setor.cronogramaValores;
                }
            }
            
            // Criar linhas para cada ano
            for (let ano = 2026; ano <= 2033; ano++) {
                const linha = document.createElement('tr');
                linha.innerHTML = `
                    <td>${ano}</td>
                    <td><input type="number" name="modal-perc-${ano}" min="0" max="100" step="0.1" value="${cronograma[ano] || 0}"></td>
                    <td><input type="text" name="modal-obs-${ano}" placeholder="Observações..."></td>
                `;
                tbody.appendChild(linha);
            }
        }
    }
    
    // Exibir modal
    const modal = document.getElementById('modal-cronograma-setor');
    if (modal) {
        modal.style.display = 'block';
    }
};

window.removerSetor = function(id) {
    if (confirm('Confirma a exclusão deste setor?')) {
        const linha = document.getElementById(`setor-${id}`);
        if (linha && linha.parentNode) {
            // Se o SetoresRepository estiver disponível, tente remover o setor
            const select = linha.querySelector('.setor-select');
            if (select && typeof SetoresRepository !== 'undefined') {
                const codigoSetor = select.value;
                if (codigoSetor) {
                    SetoresRepository.removerSetor(codigoSetor);
                }
            }
            
            linha.parentNode.removeChild(linha);
        }
    }
};

// Adicionar novos setores
window.adicionarSetor = function() {
    const tabelaSetores = document.getElementById('sector-table');
    if (!tabelaSetores) return;
    
    const tbody = tabelaSetores.getElementsByTagName('tbody')[0];
    if (!tbody) return;
    
    // Determinar o próximo ID
    let nextId = 1;
    const linhas = tbody.getElementsByTagName('tr');
    if (linhas.length > 0) {
        const ultimaLinha = linhas[linhas.length - 1];
        const ultimoId = parseInt(ultimaLinha.id.replace('setor-', ''), 10);
        if (!isNaN(ultimoId)) {
            nextId = ultimoId + 1;
        }
    }
    
    // Criar nova linha
    const novaLinha = document.createElement('tr');
    novaLinha.id = `setor-${nextId}`;
    novaLinha.innerHTML = `
        <td>
            <select name="setor-nome-${nextId}" class="setor-select" data-id="${nextId}">
                <option value="">Selecione um setor...</option>
                ${obterOpcoesSetores()}
            </select>
        </td>
        <td><input type="number" name="setor-aliquota-${nextId}" data-campo="aliquota" value="26.5" min="0" max="100" step="0.1"></td>
        <td><input type="number" name="setor-reducao-${nextId}" data-campo="reducao" value="0.0" min="0" max="100" step="0.1"></td>
        <td>
            <select name="setor-cronograma-${nextId}" data-campo="cronograma">
                <option value="padrao">Padrão</option>
                <option value="proprio">Próprio</option>
            </select>
        </td>
        <td>
            <button type="button" class="btn btn-outline btn-sm" onclick="configurarCronogramaSetor(${nextId})">Configurar</button>
            <button type="button" class="btn btn-accent btn-sm" onclick="removerSetor(${nextId})">Remover</button>
        </td>
    `;
    
    tbody.appendChild(novaLinha);
    
    // Adicionar evento ao select
    const select = novaLinha.querySelector('.setor-select');
    if (select) {
        select.addEventListener('change', preencherDadosSetor);
    }
};

// Funções para o modal de cronograma
window.salvarCronogramaSetor = function() {
    const modal = document.getElementById('modal-cronograma-setor');
    const setorId = document.getElementById('modal-setor-id').value;
    const setorCodigo = document.getElementById('modal-setor-codigo').value;
    
    if (!setorId || !setorCodigo) {
        console.error('ID do setor ou código não encontrados');
        return;
    }
    
    // Coletar dados do cronograma
    const cronograma = {};
    for (let ano = 2026; ano <= 2033; ano++) {
        const input = document.querySelector(`input[name="modal-perc-${ano}"]`);
        if (input) {
            cronograma[ano] = parseFloat(input.value) || 0;
        }
    }
    
    // Salvar no repositório, se disponível
    if (typeof SetoresRepository !== 'undefined') {
        const setor = SetoresRepository.obterSetor(setorCodigo);
        if (setor) {
            // Criar cópia do setor com as atualizações
            const setorAtualizado = { 
                ...setor, 
                cronogramaProprio: true, 
                cronogramaValores: cronograma 
            };
            
            // Salvar no repositório
            SetoresRepository.salvarSetor(setorCodigo, setorAtualizado);
            console.log(`Cronograma salvo para o setor ${setor.nome}`);
        }
    }
    
    // Atualizar select na linha da tabela
    const select = document.querySelector(`select[name="setor-cronograma-${setorId}"]`);
    if (select) {
        select.value = 'proprio';
    }
    
    // Fechar modal
    if (modal) {
        modal.style.display = 'none';
    }
};

window.fecharModalCronograma = function() {
    const modal = document.getElementById('modal-cronograma-setor');
    if (modal) {
        modal.style.display = 'none';
    }
};