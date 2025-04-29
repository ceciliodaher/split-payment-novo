/**
 * Script principal do simulador de Split Payment
 * Inicializa todos os módulos e estabelece as relações entre eles
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando Simulador de Split Payment');
    
    // Inicializar gerenciador de setores
    if (typeof SetoresManager !== 'undefined') {
        SetoresManager.inicializar();
    }
    
    // Inicializar sistema de abas
    if (typeof TabsManager !== 'undefined') {
        TabsManager.inicializar();
    }
    
    // Inicializar gerenciador de formulários
    if (typeof FormsManager !== 'undefined') {
        FormsManager.inicializar();
    }
    
    // Inicializar gerenciador de modais
    if (typeof ModalManager !== 'undefined') {
        ModalManager.inicializar();
    }
    
    // Inicializar eventos específicos da página principal
    inicializarEventosPrincipais();
    
    console.log('Simulador de Split Payment inicializado com sucesso');
});

/**
 * Inicializa eventos específicos da página principal
 */
function inicializarEventosPrincipais() {
    console.log('Inicializando eventos principais');

    // Evento para o botão Simular
    const btnSimular = document.getElementById('btn-simular');
    if (btnSimular) {
        btnSimular.addEventListener('click', function() {
            simularImpacto();
        });
    }
    
    // Eventos para exportação
    const btnExportarPDF = document.getElementById('btn-exportar-pdf');
    if (btnExportarPDF) {
        btnExportarPDF.addEventListener('click', function() {
            if (typeof ExportTools !== 'undefined') {
                ExportTools.exportarParaPDF();
            }
        });
    }
    
    const btnExportarExcel = document.getElementById('btn-exportar-excel');
    if (btnExportarExcel) {
        btnExportarExcel.addEventListener('click', function() {
            if (typeof ExportTools !== 'undefined') {
                ExportTools.exportarParaExcel();
            }
        });
    }
    
    const btnExportarMemoria = document.getElementById('btn-exportar-memoria');
    if (btnExportarMemoria) {
        btnExportarMemoria.addEventListener('click', function() {
            if (typeof ExportTools !== 'undefined') {
                ExportTools.exportarMemoriaCalculo();
            }
        });
    }
    
    // Evento para atualização da memória de cálculo
    const btnAtualizarMemoria = document.getElementById('btn-atualizar-memoria');
    if (btnAtualizarMemoria) {
        btnAtualizarMemoria.addEventListener('click', function() {
            atualizarMemoriaCalculo();
        });
    }
    
    // Evento para simulação de estratégias
    const btnSimularEstrategias = document.getElementById('btn-simular-estrategias');
    if (btnSimularEstrategias) {
        btnSimularEstrategias.addEventListener('click', function() {
            simularEstrategias();
        });
    }
    
    console.log('Eventos principais inicializados');
}

/**
 * Coleta os dados do formulário de simulação e executa a simulação
 */
function simularImpacto() {
    console.log('Iniciando processo de simulação');
    
    // Coletar dados do formulário
    const dados = {
        // Dados da empresa
        empresa: document.getElementById('empresa').value,
        setor: document.getElementById('setor').value,
        regime: document.getElementById('regime').value,
        
        // Valores financeiros
        faturamento: FormatacaoHelper.extrairValorNumerico(document.getElementById('faturamento').value),
        margem: parseFloat(document.getElementById('margem').value) / 100,
        
        // Ciclo financeiro
        pmr: parseInt(document.getElementById('pmr').value) || 30,
        pmp: parseInt(document.getElementById('pmp').value) || 30,
        pme: parseInt(document.getElementById('pme').value) || 30,
        percVista: parseFloat(document.getElementById('perc-vista').value) / 100,
        percPrazo: parseFloat(document.getElementById('perc-prazo').value) / 100,
        
        // Parâmetros fiscais
        aliquota: parseFloat(document.getElementById('aliquota').value) / 100,
        tipoOperacao: document.getElementById('tipo-operacao').value,
        creditos: FormatacaoHelper.extrairValorNumerico(document.getElementById('creditos').value),
        compensacao: document.getElementById('compensacao').value,
        
        // Parâmetros de simulação
        dataInicial: document.getElementById('data-inicial').value,
        dataFinal: document.getElementById('data-final').value,
        cenario: document.getElementById('cenario').value,
        taxaCrescimento: parseFloat(document.getElementById('taxa-crescimento').value) / 100
    };
    
    // Validar dados
    if (!validarDadosSimulacao(dados)) {
        return;
    }
    
    // Executar simulação
    const resultados = SimuladorFluxoCaixa.simular(dados);
    
    // Exibir resultados
    exibirResultados(resultados);
    
    // Armazenar resultados para uso posterior
    window.ultimaSimulacao = {
        dados: dados,
        resultados: resultados
    };
    
    console.log('Simulação concluída e resultados exibidos');
}

/**
 * Valida os dados da simulação
 * @param {Object} dados - Dados coletados do formulário
 * @returns {boolean} - Se os dados são válidos
 */
function validarDadosSimulacao(dados) {
    if (!dados.empresa) {
        alert('Por favor, informe o nome da empresa.');
        return false;
    }
    
    if (!dados.setor) {
        alert('Por favor, selecione o setor de atividade.');
        return false;
    }
    
    if (!dados.regime) {
        alert('Por favor, selecione o regime tributário.');
        return false;
    }
    
    if (isNaN(dados.faturamento) || dados.faturamento <= 0) {
        alert('Por favor, informe um valor válido para o faturamento.');
        return false;
    }
    
    if (isNaN(dados.aliquota) || dados.aliquota <= 0) {
        alert('Por favor, informe uma alíquota válida.');
        return false;
    }
    
    return true;
}

/**
 * Exibe os resultados da simulação na interface
 * @param {Object} resultados - Resultados da simulação
 */
function exibirResultados(resultados) {
    // Implementação para exibir os resultados na interface
    // ...
}

/**
 * Atualiza a memória de cálculo exibida
 */
function atualizarMemoriaCalculo() {
    // Implementação para atualizar a memória de cálculo
    // ...
}

/**
 * Simula o impacto das estratégias de mitigação selecionadas
 */
function simularEstrategias() {
    // Implementação para simular estratégias
    // ...
}
