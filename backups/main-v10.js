/**
 * Script principal do simulador de Split Payment
 * Inicializa todos os módulos e estabelece as relações entre eles
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando Simulador de Split Payment');
    
    // Inicializar gerenciador de setores
    if (typeof SetoresManager !== 'undefined') {
        SetoresManager.inicializar();
        
        // Preencher dropdown de setores na aba de simulação
        SetoresManager.preencherDropdownSetores('setor');
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
    
    // Adicionar observadores para mudanças de aba
    observarMudancasDeAba();
    
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
    
    // Adicionar evento para salvar setores que atualize os dropdowns
    const btnSalvarSetor = document.getElementById('btn-salvar-setor');
    if (btnSalvarSetor) {
        btnSalvarSetor.addEventListener('click', function() {
            // Após salvar o setor, atualizar dropdown na aba de simulação
            setTimeout(function() {
                SetoresManager.preencherDropdownSetores('setor');
            }, 100);
        });
    }
    
    // No final da função inicializarEventosPrincipais() no main.js
    // Adicionar:
    if (window.CurrencyFormatter) {
        CurrencyFormatter.inicializar();
    }
    
    console.log('Eventos principais inicializados');
}

/**
 * Coleta os dados do formulário de simulação e executa a simulação
 */
// Implementação da função simularImpacto
function simularImpacto() {
    console.log('Iniciando simulação...');
    
    // Coletar dados do formulário
    const dados = {
        empresa: document.getElementById('empresa').value,
        setor: document.getElementById('setor').value,
        regime: document.getElementById('regime').value,
        faturamento: extrairValorNumerico(document.getElementById('faturamento').value),
        margem: parseFloat(document.getElementById('margem').value) / 100,
        pmr: parseInt(document.getElementById('pmr').value) || 30,
        pmp: parseInt(document.getElementById('pmp').value) || 30,
        pme: parseInt(document.getElementById('pme').value) || 30,
        percVista: parseFloat(document.getElementById('perc-vista').value) / 100,
        percPrazo: parseFloat(document.getElementById('perc-prazo').value) / 100,
        aliquota: parseFloat(document.getElementById('aliquota').value) / 100,
        tipoOperacao: document.getElementById('tipo-operacao').value,
        creditos: extrairValorNumerico(document.getElementById('creditos').value),
        dataInicial: document.getElementById('data-inicial').value,
        dataFinal: document.getElementById('data-final').value,
        cenario: document.getElementById('cenario').value,
        taxaCrescimento: parseFloat(document.getElementById('taxa-crescimento').value) / 100
    };
    
    // Validar dados
    if (!validarDadosSimulacao(dados)) {
        return;
    }
    
    // Executar simulação usando o objeto SimuladorFluxoCaixa
    const resultados = SimuladorFluxoCaixa.simular(dados);
    
    // Exibir resultados
    exibirResultados(resultados);
    
    // Gerar gráficos
    gerarGraficos(resultados);
    
    // Atualizar memória de cálculo
    atualizarMemoriaCalculo(resultados.memoriaCalculo);
    
    // Armazenar resultados para uso posterior (exportação)
    window.ultimaSimulacao = {
        dados: dados,
        resultados: resultados
    };
    
    console.log('Simulação concluída com sucesso');
}

// Função para extrair valor numérico de uma string formatada
function extrairValorNumerico(valor) {
    if (!valor) return 0;
    return parseFloat(valor.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;
}

// Validação dos dados de simulação
function validarDadosSimulacao(dados) {
    if (!dados.empresa) {
        alert('Por favor, informe o nome da empresa.');
        return false;
    }
    
    if (!dados.setor) {
        alert('Por favor, selecione o setor de atividade.');
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

// Exibição dos resultados
function exibirResultados(resultados) {
    const containerResultados = document.getElementById('resultados');
    if (!containerResultados) return;
    
    // Formatar valores para exibição
    const formatarMoeda = (valor) => `R$ ${valor.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    const formatarPercent = (valor) => `${(valor * 100).toFixed(2)}%`;
    
    // Extrair dados principais
    const impacto = resultados.impactoBase;
    const projecao = resultados.projecaoTemporal;
    
    // Construir HTML dos resultados
    let html = `
        <div class="result-card">
            <h3>Resultados da Simulação</h3>
            
            <div class="result-section">
                <h4>Impacto Inicial (${projecao.parametros.anoInicial})</h4>
                <table class="result-table">
                    <tr>
                        <td>Percentual de Implementação:</td>
                        <td>${formatarPercent(impacto.resultadoSplitPayment.percentualImplementacao)}</td>
                    </tr>
                    <tr>
                        <td>Diferença no Capital de Giro:</td>
                        <td class="${impacto.diferencaCapitalGiro >= 0 ? 'positive-value' : 'negative-value'}">
                            ${formatarMoeda(impacto.diferencaCapitalGiro)}
                        </td>
                    </tr>
                    <tr>
                        <td>Impacto Percentual:</td>
                        <td class="${impacto.percentualImpacto >= 0 ? 'positive-value' : 'negative-value'}">
                            ${formatarPercent(impacto.percentualImpacto/100)}
                        </td>
                    </tr>
                    <tr>
                        <td>Necessidade Adicional de Capital:</td>
                        <td>${formatarMoeda(impacto.necessidadeAdicionalCapitalGiro)}</td>
                    </tr>
                    <tr>
                        <td>Impacto na Margem Operacional:</td>
                        <td>De ${formatarPercent(impacto.margemOperacionalOriginal)} para ${formatarPercent(impacto.margemOperacionalAjustada)}</td>
                    </tr>
                </table>
            </div>
            
            <div class="result-section">
                <h4>Projeção do Impacto</h4>
                <p>Impacto acumulado ao longo do período ${projecao.parametros.anoInicial}-${projecao.parametros.anoFinal}:</p>
                <table class="result-table">
                    <tr>
                        <td>Necessidade Total de Capital:</td>
                        <td>${formatarMoeda(projecao.impactoAcumulado.totalNecessidadeCapitalGiro)}</td>
                    </tr>
                    <tr>
                        <td>Custo Financeiro Total:</td>
                        <td>${formatarMoeda(projecao.impactoAcumulado.custoFinanceiroTotal)}</td>
                    </tr>
                    <tr>
                        <td>Impacto Médio na Margem:</td>
                        <td>${formatarPercent(projecao.impactoAcumulado.impactoMedioMargem/100)}</td>
                    </tr>
                </table>
            </div>
        </div>
    `;
    
    // Inserir HTML no container
    containerResultados.innerHTML = html;
    
    // Gerar gráficos
    gerarGraficos(resultados);
    
    // Atualizar memória de cálculo
    atualizarMemoriaCalculo(resultados.memoriaCalculo);
}

// Geração de gráficos
function gerarGraficos(resultados) {
    // Destruir gráficos existentes, se houver
    if (window.graficos) {
        Object.values(window.graficos).forEach(grafico => {
            if (grafico && typeof grafico.destroy === 'function') {
                grafico.destroy();
            }
        });
    }
    
    window.graficos = {};
    
    // Gráfico de fluxo de caixa
    const ctxFluxoCaixa = document.getElementById('grafico-fluxo-caixa').getContext('2d');
    window.graficos.fluxoCaixa = new Chart(ctxFluxoCaixa, {
        type: 'bar',
        data: {
            labels: ['Regime Atual', 'Split Payment'],
            datasets: [{
                label: 'Capital de Giro Disponível (R$)',
                data: [
                    resultados.impactoBase.resultadoAtual.capitalGiroDisponivel,
                    resultados.impactoBase.resultadoSplitPayment.capitalGiroDisponivel
                ],
                backgroundColor: ['rgba(54, 162, 235, 0.5)', 'rgba(255, 99, 132, 0.5)'],
                borderColor: ['rgba(54, 162, 235, 1)', 'rgba(255, 99, 132, 1)'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'R$'
                    }
                }
            }
        }
    });
    
    // Gráfico de capital de giro
    const ctxCapitalGiro = document.getElementById('grafico-capital-giro').getContext('2d');
    window.graficos.capitalGiro = new Chart(ctxCapitalGiro, {
        type: 'doughnut',
        data: {
            labels: ['Mantido', 'Reduzido'],
            datasets: [{
                data: [
                    resultados.impactoBase.resultadoSplitPayment.capitalGiroDisponivel,
                    Math.abs(resultados.impactoBase.diferencaCapitalGiro)
                ],
                backgroundColor: ['rgba(75, 192, 192, 0.5)', 'rgba(255, 99, 132, 0.5)'],
                borderColor: ['rgba(75, 192, 192, 1)', 'rgba(255, 99, 132, 1)'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Impacto no Capital de Giro'
                }
            }
        }
    });
    
    // Gráfico de projeção
    const ctxProjecao = document.getElementById('grafico-projecao').getContext('2d');
    
    // Preparar dados para o gráfico de projeção
    const anos = Object.keys(resultados.projecaoTemporal.resultadosAnuais);
    const impactosPorAno = anos.map(ano => 
        Math.abs(resultados.projecaoTemporal.resultadosAnuais[ano].diferencaCapitalGiro)
    );
    
    window.graficos.projecao = new Chart(ctxProjecao, {
        type: 'line',
        data: {
            labels: anos,
            datasets: [{
                label: 'Impacto no Capital de Giro (R$)',
                data: impactosPorAno,
                backgroundColor: 'rgba(153, 102, 255, 0.5)',
                borderColor: 'rgba(153, 102, 255, 1)',
                borderWidth: 2,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'R$'
                    }
                }
            }
        }
    });
}

// Atualização da memória de cálculo
function atualizarMemoriaCalculo(memoriaCalculo) {
    // Armazenar memória de cálculo para uso posterior
    window.memoriaCalculoSimulacao = memoriaCalculo;
    
    // Atualizar o select de anos na aba de memória
    const selectAno = document.getElementById('select-ano-memoria');
    if (selectAno) {
        // Limpar options existentes
        selectAno.innerHTML = '';
        
        // Adicionar uma option para cada ano disponível
        Object.keys(memoriaCalculo).forEach(ano => {
            const option = document.createElement('option');
            option.value = ano;
            option.textContent = ano;
            selectAno.appendChild(option);
        });
        
        // Exibir memória de cálculo para o primeiro ano
        exibirMemoriaCalculo(Object.keys(memoriaCalculo)[0]);
    }
}

function exibirMemoriaCalculo(ano) {
    const containerMemoria = document.getElementById('memoria-calculo');
    if (!containerMemoria || !window.memoriaCalculoSimulacao || !window.memoriaCalculoSimulacao[ano]) {
        return;
    }
    
    // Formatar a memória de cálculo (usar texto pré-formatado para manter formatação)
    containerMemoria.innerHTML = `<pre>${window.memoriaCalculoSimulacao[ano]}</pre>`;
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
 * Observar mudanças de aba para atualizar dados quando necessário
 */
function observarMudancasDeAba() {
    // Observar eventos de mudança de aba
    document.addEventListener('tabChange', function(event) {
        const tabId = event.detail.tab;
        
        // Se a aba de simulação for ativada, garantir que o dropdown esteja atualizado
        if (tabId === 'simulacao') {
            SetoresManager.preencherDropdownSetores('setor');
            console.log('Dropdown de setores atualizado na aba de simulação');
        }
    });
}

// Exportação para PDF
function exportarParaPDF() {
    if (!window.ultimaSimulacao) {
        alert('Realize uma simulação antes de exportar');
        return;
    }
    
    // Inicializar jsPDF
    const doc = new jspdf.jsPDF();
    
    // Configurações de texto
    doc.setFont('helvetica');
    doc.setFontSize(16);
    
    // Título
    doc.text('Simulação de Impacto do Split Payment no Fluxo de Caixa', 15, 20);
    
    // Informações da empresa
    doc.setFontSize(12);
    doc.text(`Empresa: ${window.ultimaSimulacao.dados.empresa}`, 15, 30);
    doc.text(`Setor: ${document.getElementById('setor').options[document.getElementById('setor').selectedIndex].text}`, 15, 38);
    doc.text(`Regime Tributário: ${window.ultimaSimulacao.dados.regime.toUpperCase()}`, 15, 46);
    doc.text(`Data da Simulação: ${new Date().toLocaleDateString('pt-BR')}`, 15, 54);
    
    // Linha separadora
    doc.line(15, 60, 195, 60);
    
    // Resultados principais
    doc.setFontSize(14);
    doc.text('Resultados da Simulação', 15, 70);
    
    doc.setFontSize(12);
    const imp = window.ultimaSimulacao.resultados.impactoBase;
    const formatMoeda = (val) => `R$ ${val.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
    const formatPerc = (val) => `${(val * 100).toFixed(2)}%`;
    
    doc.text(`Impacto no Capital de Giro: ${formatMoeda(imp.diferencaCapitalGiro)}`, 15, 80);
    doc.text(`Impacto Percentual: ${formatPerc(imp.percentualImpacto/100)}`, 15, 88);
    doc.text(`Necessidade Adicional: ${formatMoeda(imp.necessidadeAdicionalCapitalGiro)}`, 15, 96);
    doc.text(`Impacto na Margem: De ${formatPerc(imp.margemOperacionalOriginal)} para ${formatPerc(imp.margemOperacionalAjustada)}`, 15, 104);
    
    // Projeção
    const proj = window.ultimaSimulacao.resultados.projecaoTemporal;
    doc.text(`Projeção ${proj.parametros.anoInicial}-${proj.parametros.anoFinal}:`, 15, 120);
    doc.text(`Necessidade Total: ${formatMoeda(proj.impactoAcumulado.totalNecessidadeCapitalGiro)}`, 15, 128);
    doc.text(`Custo Financeiro: ${formatMoeda(proj.impactoAcumulado.custoFinanceiroTotal)}`, 15, 136);
    
    // Rodapé
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.text('© 2025 Expertzy Inteligência Tributária', 15, 285);
        doc.text(`Página ${i} de ${pageCount}`, 180, 285);
    }
    
    // Salvar o PDF
    doc.save(`simulacao-split-payment-${window.ultimaSimulacao.dados.empresa.replace(/\s+/g, '-')}.pdf`);
}

// Exportação para Excel
function exportarParaExcel() {
    if (!window.ultimaSimulacao) {
        alert('Realize uma simulação antes de exportar');
        return;
    }
    
    // Criar uma nova pasta de trabalho
    const wb = XLSX.utils.book_new();
    
    // Dados para a planilha de resultados
    const dadosResultados = [
        ['Simulação de Impacto do Split Payment no Fluxo de Caixa'],
        [''],
        ['Dados da Empresa'],
        ['Empresa', window.ultimaSimulacao.dados.empresa],
        ['Setor', document.getElementById('setor').options[document.getElementById('setor').selectedIndex].text],
        ['Regime Tributário', window.ultimaSimulacao.dados.regime.toUpperCase()],
        ['Data da Simulação', new Date().toLocaleDateString('pt-BR')],
        [''],
        ['Resultados Principais'],
        ['Parâmetro', 'Valor'],
        ['Percentual de Implementação', `${(window.ultimaSimulacao.resultados.impactoBase.resultadoSplitPayment.percentualImplementacao * 100).toFixed(2)}%`],
        ['Impacto no Capital de Giro', window.ultimaSimulacao.resultados.impactoBase.diferencaCapitalGiro],
        ['Impacto Percentual', window.ultimaSimulacao.resultados.impactoBase.percentualImpacto/100],
        ['Necessidade Adicional', window.ultimaSimulacao.resultados.impactoBase.necessidadeAdicionalCapitalGiro],
        ['Margem Original', window.ultimaSimulacao.resultados.impactoBase.margemOperacionalOriginal],
        ['Margem Ajustada', window.ultimaSimulacao.resultados.impactoBase.margemOperacionalAjustada]
    ];
    
    // Adicionar dados da projeção
    dadosResultados.push(['']);
    dadosResultados.push(['Projeção Temporal']);
    const proj = window.ultimaSimulacao.resultados.projecaoTemporal;
    dadosResultados.push(['Período', `${proj.parametros.anoInicial}-${proj.parametros.anoFinal}`]);
    dadosResultados.push(['Necessidade Total', proj.impactoAcumulado.totalNecessidadeCapitalGiro]);
    dadosResultados.push(['Custo Financeiro Total', proj.impactoAcumulado.custoFinanceiroTotal]);
    dadosResultados.push(['Impacto Médio na Margem', proj.impactoAcumulado.impactoMedioMargem/100]);
    
    // Criar planilha de resultados
    const wsResultados = XLSX.utils.aoa_to_sheet(dadosResultados);
    XLSX.utils.book_append_sheet(wb, wsResultados, 'Resultados');
    
    // Criar planilha para cada ano da projeção
    const anos = Object.keys(proj.resultadosAnuais);
    anos.forEach(ano => {
        const dadosAno = [
            [`Impacto Detalhado - Ano ${ano}`],
            [''],
            ['Parâmetro', 'Valor'],
            ['Diferença Capital de Giro', proj.resultadosAnuais[ano].diferencaCapitalGiro],
            ['Percentual de Impacto', proj.resultadosAnuais[ano].percentualImpacto/100],
            ['Necessidade Adicional', proj.resultadosAnuais[ano].necessidadeAdicionalCapitalGiro],
            ['Margem Ajustada', proj.resultadosAnuais[ano].margemOperacionalAjustada]
        ];
        
        const wsAno = XLSX.utils.aoa_to_sheet(dadosAno);
        XLSX.utils.book_append_sheet(wb, wsAno, `Ano ${ano}`);
    });
    
    // Salvar o arquivo Excel
    XLSX.writeFile(wb, `simulacao-split-payment-${window.ultimaSimulacao.dados.empresa.replace(/\s+/g, '-')}.xlsx`);
}

/**
 * Simula o impacto das estratégias de mitigação selecionadas
 */
function simularEstrategias() {
    // Implementação para simular estratégias
    // ...
}
