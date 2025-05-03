/**
 * Simulador de Fluxo de Caixa
 * Agora atua como interface para o módulo central de cálculos
 */
window.SimuladorFluxoCaixa = {
    /**
     * Coleta os dados do formulário de simulação e executa a simulação
     */
    simularImpacto: function() {
        console.log('Iniciando simulação...');

        // Coletar dados do formulário
        const dados = {
            empresa: document.getElementById('empresa').value,
            setor: document.getElementById('setor').value,
            regime: document.getElementById('regime').value,
            faturamento: this.extrairValorNumerico(document.getElementById('faturamento').value),
            margem: parseFloat(document.getElementById('margem').value) / 100,
            pmr: parseInt(document.getElementById('pmr').value) || 30,
            pmp: parseInt(document.getElementById('pmp').value) || 30,
            pme: parseInt(document.getElementById('pme').value) || 30,
            percVista: parseFloat(document.getElementById('perc-vista').value) / 100,
            percPrazo: parseFloat(document.getElementById('perc-prazo').value) / 100,
            aliquota: parseFloat(document.getElementById('aliquota').value) / 100,
            tipoOperacao: document.getElementById('tipo-operacao').value,
            creditos: this.extrairValorNumerico(document.getElementById('creditos').value),
            dataInicial: document.getElementById('data-inicial').value,
            dataFinal: document.getElementById('data-final').value,
            cenario: document.getElementById('cenario').value,
            taxaCrescimento: parseFloat(document.getElementById('taxa-crescimento').value) / 100,
            taxaCapitalGiro: parseFloat(document.querySelector('#taxa-capital-giro') ? document.querySelector('#taxa-capital-giro').value : 2.1) / 100
        };

        // Validar dados
        if (!this.validarDadosSimulacao(dados)) {
            return;
        }

        // Executar simulação através do SimuladorModulo
        try {
            const resultados = SimuladorModulo.simular(dados);

            // Exibir resultados
            this.exibirResultados(resultados, dados);

            // Atualizar memória de cálculo
            this.atualizarMemoriaCalculo(resultados.memoriaCalculo);

            // Armazenar resultados para uso posterior (exportação)
            window.ultimaSimulacao = {
                dados: dados,
                resultados: resultados
            };

            console.log('Simulação concluída com sucesso');
        } catch (error) {
            console.error('Erro durante a simulação:', error);
            alert('Ocorreu um erro durante a simulação: ' + error.message);
        }
    },

    // Métodos utilitários mantidos
    extrairValorNumerico: function(valor) {
        if (!valor) return 0;
        
        // Remove tudo exceto dígitos, vírgulas e pontos
        const apenasNumeros = valor.replace(/[^\d,.]/g, '');
        
        // Trata formato brasileiro: converte vírgulas para pontos e remove pontos (separadores de milhar)
        let valorConvertido;
        if (apenasNumeros.indexOf(',') !== -1) {
            // Se tem vírgula, tratar como padrão brasileiro
            valorConvertido = apenasNumeros.replace(/\./g, '').replace(',', '.');
        } else {
            // Se não tem vírgula, pode ser formato americano ou inteiro
            valorConvertido = apenasNumeros;
        }
        
        // Converte para número e retorna
        const valorNumerico = parseFloat(valorConvertido);
        console.log('Extraindo valor numérico de:', valor, '→', valorNumerico);
        return isNaN(valorNumerico) ? 0 : valorNumerico;
    },

    validarDadosSimulacao: function(dados) {
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
    },

    // Métodos de exibição mantidos
    exibirResultados: function(resultados, dados) {
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
        this.gerarGraficos(resultados);
    },

    gerarGraficos: function(resultados) {
        // Destruir gráficos existentes para evitar duplicação
        if (window.graficos) {
            Object.values(window.graficos).forEach(grafico => {
                if (grafico && typeof grafico.destroy === 'function') {
                    grafico.destroy();
                }
            });
        }

        window.graficos = {};

        // Gráfico de fluxo de caixa
        const ctxFluxoCaixa = document.getElementById('grafico-fluxo-caixa');
        if (ctxFluxoCaixa) {
            window.graficos.fluxoCaixa = new Chart(ctxFluxoCaixa.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: ['Regime Atual', 'Split Payment'],
                    datasets: [{
                        label: 'Capital de Giro Disponível',
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
        }

        // Gráfico de capital de giro
        const ctxCapitalGiro = document.getElementById('grafico-capital-giro');
        if (ctxCapitalGiro) {
            window.graficos.capitalGiro = new Chart(ctxCapitalGiro.getContext('2d'), {
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
        }

        // Gráfico de projeção
        const ctxProjecao = document.getElementById('grafico-projecao');
        if (ctxProjecao) {
            // Preparar dados para o gráfico de projeção
            const anos = Object.keys(resultados.projecaoTemporal.resultadosAnuais);
            const impactosPorAno = anos.map(ano => 
                Math.abs(resultados.projecaoTemporal.resultadosAnuais[ano].diferencaCapitalGiro)
            );

            window.graficos.projecao = new Chart(ctxProjecao.getContext('2d'), {
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
    },

    atualizarMemoriaCalculo: function(memoriaCalculo) {
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
            this.exibirMemoriaCalculo(Object.keys(memoriaCalculo)[0]);
        }
    },

    exibirMemoriaCalculo: function(ano) {
        const containerMemoria = document.getElementById('memoria-calculo');
        if (!containerMemoria || !window.memoriaCalculoSimulacao || !window.memoriaCalculoSimulacao[ano]) {
            return;
        }

        // Formatar a memória de cálculo
        containerMemoria.innerHTML = `<pre>${window.memoriaCalculoSimulacao[ano]}</pre>`;
    },

    /**
     * @deprecated Use SimuladorModulo.simular instead
     */
    simular: function(dados) {
        console.warn('SimuladorFluxoCaixa.simular() está depreciado. Use SimuladorModulo.simular() em seu lugar.');
        return SimuladorModulo.simular(dados);
    },

    /**
     * @deprecated Use CalculationModule.calcularFluxoCaixaAtual instead
     */
    calcularFluxoCaixaAtual: function(dados) {
        console.warn('SimuladorFluxoCaixa.calcularFluxoCaixaAtual() está depreciado. Use CalculationModule.calcularFluxoCaixaAtual() em seu lugar.');
        return CalculationModule.calcularFluxoCaixaAtual(dados);
    },

    /**
     * @deprecated Use CalculationModule.calcularFluxoCaixaSplitPayment instead
     */
    calcularFluxoCaixaSplitPayment: function(dados, ano) {
        console.warn('SimuladorFluxoCaixa.calcularFluxoCaixaSplitPayment() está depreciado. Use CalculationModule.calcularFluxoCaixaSplitPayment() em seu lugar.');
        return CalculationModule.calcularFluxoCaixaSplitPayment(dados, ano);
    },

    /**
     * @deprecated Use CalculationModule.calcularImpactoCapitalGiro instead
     */
    calcularImpactoCapitalGiro: function(dados, ano) {
        console.warn('SimuladorFluxoCaixa.calcularImpactoCapitalGiro() está depreciado. Use CalculationModule.calcularImpactoCapitalGiro() em seu lugar.');
        return CalculationModule.calcularImpactoCapitalGiro(dados, ano);
    },

    /**
     * @deprecated Use CalculationModule.calcularProjecaoTemporal instead
     */
    calcularProjecaoTemporal: function(dados, anoInicial, anoFinal, cenario, taxaCrescimento) {
        console.warn('SimuladorFluxoCaixa.calcularProjecaoTemporal() está depreciado. Use CalculationModule.calcularProjecaoTemporal() em seu lugar.');
        return CalculationModule.calcularProjecaoTemporal(dados, anoInicial, anoFinal, cenario, taxaCrescimento);
    },

    /**
     * @deprecated Use CalculationModule's implementation
     */
    obterPercentualImplementacao: function(ano) {
        console.warn('SimuladorFluxoCaixa.obterPercentualImplementacao() está depreciado. Use a implementação do CalculationModule em seu lugar.');
        return CalculationModule.obterPercentualImplementacao(ano);
    }
};

// Arquivo: js/simulation/simulator.js
// Adicionar ao final do arquivo:

// Integração com novos módulos
window.SimuladorFluxoCaixa.integrarComCalculationModule = function() {
    if (typeof CalculationModule === 'undefined') {
        console.warn('CalculationModule não disponível para integração');
        return false;
    }
    
    // Substituir implementações importantes por versões do CalculationModule
    this.calcularImpactoCapitalGiro = function(dados, ano, parametrosSetoriais) {
        return CalculationModule.calcularImpactoCapitalGiro(dados, ano, parametrosSetoriais);
    };
    
    this.calcularProjecaoTemporal = function(dados, anoInicial, anoFinal, cenario, taxaCrescimento, parametrosSetoriais) {
        return CalculationModule.calcularProjecaoTemporal(dados, anoInicial, anoFinal, cenario, taxaCrescimento, parametrosSetoriais);
    };
    
    // Manter compatibilidade com interfaces existentes
    const simuladorOriginal = this;
    CalculationModule.obterResultadosCompativeis = function(resultados) {
        // Converter resultados do CalculationModule para o formato esperado pelo SimuladorFluxoCaixa
        return {
            impactoBase: resultados.impactoBase || {},
            projecaoTemporal: resultados.projecaoTemporal || {},
            memoriaCalculo: resultados.memoriaCalculo || {}
        };
    };
    
    console.log('SimuladorFluxoCaixa integrado com CalculationModule');
    return true;
};

// Executar integração automaticamente quando disponível
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        if (window.SimuladorFluxoCaixa && typeof window.SimuladorFluxoCaixa.integrarComCalculationModule === 'function') {
            window.SimuladorFluxoCaixa.integrarComCalculationModule();
        }
    }, 500);
});