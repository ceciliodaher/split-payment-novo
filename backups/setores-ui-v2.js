// Adicione este código ao final do arquivo, antes do fechamento da tag </body>
// Ou adicione a um arquivo separado como setores-ui.js e importe-o

// Função para inicializar a tabela de setores
function inicializarTabelaSetores() {
    // Verificar se estamos na página correta e se a tabela existe
    const tabelaSetores = document.getElementById('sector-table');
    if (!tabelaSetores) return;
    
    // Limpar a tabela
    const tbody = tabelaSetores.getElementsByTagName('tbody')[0];
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    // Verificar se o SetoresManager está inicializado
    if (!SetoresManager.initialized) {
        SetoresManager.inicializar();
    }
    
    // Obter todos os setores
    const setores = SetoresManager.obterTodosSetores();
    
    // Adicionar cada setor à tabela
    let nextId = 1;
    setores.forEach(setor => {
        const tr = document.createElement('tr');
        tr.id = `setor-${nextId}`;
        
        // Verificar se o setor possui alíquota efetiva e redução especial
        const aliquotaEfetiva = setor.aliquotaEfetiva ? (setor.aliquotaEfetiva * 100).toFixed(1) : '26.5';
        const reducaoEspecial = setor.reducaoEspecial ? (setor.reducaoEspecial * 100).toFixed(1) : '0.0';
        const cronogramaProprio = setor.cronogramaProprio ? 'proprio' : 'padrao';
        
        tr.innerHTML = `
            <td>${setor.nome}</td>
            <td><input type="number" data-setor="${setor.codigo}" data-campo="aliquota" value="${aliquotaEfetiva}" step="0.1"></td>
            <td><input type="number" data-setor="${setor.codigo}" data-campo="reducao" value="${reducaoEspecial}" step="0.1"></td>
            <td>
                <select data-setor="${setor.codigo}" data-campo="cronograma">
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
    
    console.log(`Tabela de setores inicializada com ${setores.length} setores`);
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM carregado, verificando se deve inicializar a tabela de setores');
    
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
    
    const nomeSetor = linha.cells[0].textContent;
    
    // Atualizar o modal
    const modalSetorNome = document.getElementById('modal-setor-nome');
    const modalSetorId = document.getElementById('modal-setor-id');
    
    if (modalSetorNome) modalSetorNome.textContent = nomeSetor;
    if (modalSetorId) modalSetorId.value = id;
    
    // Preencher tabela do modal com cronograma padrão
    const tabelaCronograma = document.getElementById('cronograma-setor-table');
    if (tabelaCronograma) {
        const tbody = tabelaCronograma.getElementsByTagName('tbody')[0];
        if (tbody) {
            tbody.innerHTML = '';
            
            // Usar cronograma padrão
            const cronogramaPadrao = {
                2026: 10.0,
                2027: 25.0,
                2028: 40.0,
                2029: 55.0,
                2030: 70.0,
                2031: 85.0,
                2032: 95.0,
                2033: 100.0
            };
            
            for (let ano = 2026; ano <= 2033; ano++) {
                const linha = document.createElement('tr');
                linha.innerHTML = `
                    <td>${ano}</td>
                    <td><input type="number" name="modal-perc-${ano}" min="0" max="100" step="0.1" value="${cronogramaPadrao[ano]}"></td>
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
            linha.parentNode.removeChild(linha);
        }
    }
};

// Função para adicionar novo setor
document.getElementById('btn-adicionar-setor')?.addEventListener('click', function() {
    const tabelaSetores = document.getElementById('sector-table');
    if (!tabelaSetores) return;
    
    const tbody = tabelaSetores.getElementsByTagName('tbody')[0];
    if (!tbody) return;
    
    // Determinar o próximo ID
    let nextId = 1;
    const linhas = tbody.getElementsByTagName('tr');
    if (linhas.length > 0) {
        const ultimaLinha = linhas[linhas.length - 1];
        const ultimoId = parseInt(ultimaLinha.id.replace('setor-', ''));
        if (!isNaN(ultimoId)) {
            nextId = ultimoId + 1;
        }
    }
    
    // Criar nova linha
    const novaLinha = document.createElement('tr');
    novaLinha.id = `setor-${nextId}`;
    novaLinha.innerHTML = `
        <td><input type="text" name="setor-nome-${nextId}" placeholder="Nome do setor"></td>
        <td><input type="number" data-campo="aliquota" value="26.5" step="0.1"></td>
        <td><input type="number" data-campo="reducao" value="0.0" step="0.1"></td>
        <td>
            <select data-campo="cronograma">
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
});

// Funções para o modal de cronograma
document.querySelector('#btn-salvar-cronograma-setor')?.addEventListener('click', function() {
    const modal = document.getElementById('modal-cronograma-setor');
    if (modal) {
        modal.style.display = 'none';
    }
    
    // Aqui você pode adicionar lógica para salvar o cronograma
    const setorId = document.getElementById('modal-setor-id').value;
    const select = document.querySelector(`select[data-setor][data-campo="cronograma"]`);
    if (select) {
        select.value = 'proprio';
    }
});

document.querySelector('#btn-cancelar-modal')?.addEventListener('click', function() {
    const modal = document.getElementById('modal-cronograma-setor');
    if (modal) {
        modal.style.display = 'none';
    }
});

document.querySelector('#btn-fechar-modal')?.addEventListener('click', function() {
    const modal = document.getElementById('modal-cronograma-setor');
    if (modal) {
        modal.style.display = 'none';
    }
});
