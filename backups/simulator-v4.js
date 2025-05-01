/**
 * Simulador de Fluxo de Caixa
 * Responsável pelos cálculos do impacto do Split Payment
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

        // Executar simulação
        const resultados = this.simular(dados);

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
    },

    /**
     * Extrai valor numérico de uma string formatada para moeda brasileira
     */
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

    /**
     * Valida os dados da simulação
     */
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

    /**
     * Exibe os resultados na interface
     */
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

    /**
     * Gera gráficos para visualização dos resultados
     */
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

    /**
     * Atualiza a memória de cálculo na interface
     */
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

    /**
     * Exibe a memória de cálculo para um ano específico
     */
    exibirMemoriaCalculo: function(ano) {
        const containerMemoria = document.getElementById('memoria-calculo');
        if (!containerMemoria || !window.memoriaCalculoSimulacao || !window.memoriaCalculoSimulacao[ano]) {
            return;
        }

        // Formatar a memória de cálculo (usar texto pré-formatado para manter formatação)
        containerMemoria.innerHTML = `<pre>${window.memoriaCalculoSimulacao[ano]}</pre>`;
    },
    // Variáveis para armazenar resultados intermediários
    _resultadoAtual: null,
    _resultadoSplitPayment: null,
    
    /**
     * Realiza a simulação completa
     * @param {Object} dados - Dados para simulação
     * @returns {Object} - Resultados da simulação
     */
    simular: function(dados) {
        console.log('Iniciando simulação:', dados);
        
        // Extrair ano inicial e final para simulação
        const anoInicial = parseInt(dados.dataInicial.split('-')[0]);
        const anoFinal = parseInt(dados.dataFinal.split('-')[0]);
        
        // Calcular impacto inicial
        const impactoBase = this.calcularImpactoCapitalGiro(dados, anoInicial);
        
        // Simular período de transição
        const projecaoTemporal = this.simularPeriodoTransicao(
            dados, 
            anoInicial, 
            anoFinal, 
            dados.cenario, 
            dados.taxaCrescimento
        );
        
        // Armazenar memória de cálculo
        const memoriaCalculo = this.gerarMemoriaCalculo(dados, anoInicial, anoFinal);
        
        // Resultados completos
        const resultados = {
            impactoBase,
            projecaoTemporal,
            memoriaCalculo
        };
        
        console.log('Simulação concluída com sucesso:', resultados);
        
        return resultados;
    },
    
    /**
     * Calcula o fluxo de caixa no regime tributário atual
     * @param {Object} dados - Dados para simulação
     * @returns {Object} - Resultados do fluxo de caixa atual
     */
    calcularFluxoCaixaAtual: function(dados) {
        // Extrair dados relevantes
        const faturamento = dados.faturamento;
        const aliquota = dados.aliquota;
        const pmr = dados.pmr;
        
        // Calcular valores
        const valorImposto = faturamento * aliquota;
        const prazoRecolhimento = 25; // Dias para recolhimento do imposto (mês seguinte)
        const capitalGiroDisponivel = valorImposto;
        const diasCapitalDisponivel = pmr + prazoRecolhimento;
        
        // Resultado
        const resultado = {
            faturamento,
            valorImposto,
            recebimentoLiquido: faturamento,
            capitalGiroDisponivel,
            diasCapitalDisponivel
        };
        
        // Armazenar resultado para memória de cálculo
        this._resultadoAtual = resultado;
        
        return resultado;
    },
    
    /**
     * Calcula o fluxo de caixa com o regime de Split Payment
     * @param {Object} dados - Dados para simulação
     * @param {number} ano - Ano para simulação
     * @returns {Object} - Resultados do fluxo de caixa com Split Payment
     */
    calcularFluxoCaixaSplitPayment: function(dados, ano = 2026) {
        // Extrair dados relevantes
        const faturamento = dados.faturamento;
        const aliquota = dados.aliquota;
        const pmr = dados.pmr;
        
        // Obter percentual de implementação do Split Payment para o ano
        const percentualImplementacao = this.obterPercentualImplementacao(ano);
        
        // Calcular valores
        const valorImposto = faturamento * aliquota;
        const valorImpostoSplit = valorImposto * percentualImplementacao;
        const valorImpostoNormal = valorImposto - valorImpostoSplit;
        
        const recebimentoLiquido = faturamento - valorImpostoSplit;
        const capitalGiroDisponivel = valorImpostoNormal;
        const diasCapitalDisponivel = 25; // Apenas para o valor não retido
        
        // Resultado
        const resultado = {
            faturamento,
            valorImposto,
            valorImpostoSplit,
            valorImpostoNormal,
            recebimentoLiquido,
            capitalGiroDisponivel,
            diasCapitalDisponivel,
            percentualImplementacao
        };
        
        // Armazenar resultado para memória de cálculo
        this._resultadoSplitPayment = resultado;
        
        return resultado;
    },
    
    /**
     * Calcula o impacto do Split Payment no capital de giro
     * @param {Object} dados - Dados para simulação
     * @param {number} ano - Ano para simulação
     * @returns {Object} - Resultados do impacto no capital de giro
     */
    calcularImpactoCapitalGiro: function(dados, ano = 2026) {
        // Calcular fluxo de caixa nos dois regimes
        const resultadoAtual = this.calcularFluxoCaixaAtual(dados);
        const resultadoSplitPayment = this.calcularFluxoCaixaSplitPayment(dados, ano);
        
        // Calcular diferenças
        const diferencaCapitalGiro = resultadoSplitPayment.capitalGiroDisponivel - resultadoAtual.capitalGiroDisponivel;
        const percentualImpacto = (diferencaCapitalGiro / resultadoAtual.capitalGiroDisponivel) * 100;
        
        // Calcular impacto na margem operacional
        const margem = dados.margem;
        const custoCapitalGiro = Math.abs(diferencaCapitalGiro) * (dados.taxaCapitalGiro || 0.021); // 2,1% a.m. padrão
        const impactoMargem = (custoCapitalGiro / dados.faturamento) * 100;
        
        // Resultado
        const resultado = {
            ano,
            resultadoAtual,
            resultadoSplitPayment,
            diferencaCapitalGiro,
            percentualImpacto,
            necessidadeAdicionalCapitalGiro: Math.abs(diferencaCapitalGiro) * 1.2, // Margem de segurança
            margemOperacionalOriginal: margem,
            margemOperacionalAjustada: margem - impactoMargem / 100,
            impactoMargem,
            custoCapitalGiro
        };
        
        return resultado;
    },
    
    /**
     * Simula o impacto ao longo do período de transição
     * @param {Object} dados - Dados para simulação
     * @param {number} anoInicial - Ano inicial
     * @param {number} anoFinal - Ano final
     * @param {string} cenario - Cenário de crescimento
     * @param {number} taxaCrescimento - Taxa de crescimento para cenário personalizado
     * @returns {Object} - Resultados da projeção temporal
     */
    simularPeriodoTransicao: function(dados, anoInicial = 2026, anoFinal = 2033, cenario = 'moderado', taxaCrescimento = null) {
        // Definir taxa de crescimento com base no cenário
        let taxa = 0.05; // Padrão: moderado (5% a.a.)
        
        if (cenario === 'conservador') {
            taxa = 0.02; // 2% a.a.
        } else if (cenario === 'otimista') {
            taxa = 0.08; // 8% a.a.
        } else if (cenario === 'personalizado' && taxaCrescimento !== null) {
            taxa = taxaCrescimento;
        }
        
        // Inicializar resultados
        const resultadosAnuais = {};
        let faturamentoAtual = dados.faturamento;
        
        // Simular cada ano
        for (let ano = anoInicial; ano <= anoFinal; ano++) {
            // Criar cópia dos dados com faturamento ajustado
            const dadosAno = { ...dados, faturamento: faturamentoAtual };
            
            // Calcular impacto para o ano
            const impactoAno = this.calcularImpactoCapitalGiro(dadosAno, ano);
            
            // Armazenar resultado
            resultadosAnuais[ano] = impactoAno;
            
            // Atualizar faturamento para o próximo ano
            faturamentoAtual *= (1 + taxa);
        }
        
        // Calcular impacto acumulado
        const impactoAcumulado = this.calcularImpactoAcumulado(resultadosAnuais, anoInicial, anoFinal);
        
        // Resultado
        const resultado = {
            parametros: {
                anoInicial,
                anoFinal,
                cenario,
                taxaCrescimento: taxa
            },
            resultadosAnuais,
            impactoAcumulado
        };
        
        return resultado;
    },
    
    /**
     * Calcula o impacto acumulado ao longo do período
     * @param {Object} resultadosAnuais - Resultados por ano
     * @param {number} anoInicial - Ano inicial
     * @param {number} anoFinal - Ano final
     * @returns {Object} - Impacto acumulado
     */
    calcularImpactoAcumulado: function(resultadosAnuais, anoInicial, anoFinal) {
        let totalNecessidadeCapitalGiro = 0;
        let totalCustoFinanceiro = 0;
        let somaImpactoMargem = 0;
        
        // Calcular totais
        for (let ano = anoInicial; ano <= anoFinal; ano++) {
            const impactoAno = resultadosAnuais[ano];
            
            totalNecessidadeCapitalGiro += impactoAno.necessidadeAdicionalCapitalGiro;
            totalCustoFinanceiro += impactoAno.custoCapitalGiro * 12; // Anualizado
            somaImpactoMargem += impactoAno.impactoMargem;
        }
        
        // Calcular médias
        const numAnos = anoFinal - anoInicial + 1;
        const impactoMedioMargem = somaImpactoMargem / numAnos;
        
        return {
            totalNecessidadeCapitalGiro,
            custoFinanceiroTotal: totalCustoFinanceiro,
            impactoMedioMargem
        };
    },
    
    /**
     * Obtém o percentual de implementação do Split Payment para um determinado ano
     * @param {number} ano - Ano para obter o percentual
     * @returns {number} - Percentual de implementação (decimal)
     */
    obterPercentualImplementacao: function(ano) {
        const cronograma = {
            2026: 0.10,
            2027: 0.25,
            2028: 0.40,
            2029: 0.55,
            2030: 0.70,
            2031: 0.85,
            2032: 0.95,
            2033: 1.00
        };
        
        return cronograma[ano] || 0;
    },
    
    /**
     * Gera a memória de cálculo detalhada
     * @param {Object} dados - Dados da simulação
     * @param {number} anoInicial - Ano inicial
     * @param {number} anoFinal - Ano final
     * @returns {Object} - Memória de cálculo por ano
     */
    gerarMemoriaCalculo: function(dados, anoInicial, anoFinal) {
        const memoria = {};
        
        for (let ano = anoInicial; ano <= anoFinal; ano++) {
            let textoMemoria = `=== MEMÓRIA DE CÁLCULO - ANO ${ano} ===\n\n`;
            
            // Parâmetros básicos
            textoMemoria += `=== PARÂMETROS BÁSICOS ===\n`;
            textoMemoria += `Faturamento Mensal: ${FormatacaoHelper.formatarMoeda(dados.faturamento)}\n`;
            textoMemoria += `Alíquota Efetiva: ${(dados.aliquota * 100).toFixed(1)}%\n`;
            textoMemoria += `Prazo Médio de Recebimento: ${dados.pmr} dias\n`;
            textoMemoria += `Prazo Médio de Pagamento: ${dados.pmp} dias\n`;
            textoMemoria += `Prazo Médio de Estoque: ${dados.pme} dias\n`;
            textoMemoria += `Ciclo Financeiro: ${dados.pmr + dados.pme - dados.pmp} dias\n`;
            textoMemoria += `Percentual de Vendas à Vista: ${(dados.percVista * 100).toFixed(1)}%\n`;
            textoMemoria += `Percentual de Vendas a Prazo: ${(dados.percPrazo * 100).toFixed(1)}%\n\n`;
            
            // Cálculo do impacto
            textoMemoria += `=== CÁLCULO DO IMPACTO NO FLUXO DE CAIXA ===\n`;
            const valorImposto = dados.faturamento * dados.aliquota;
            
            textoMemoria += `Valor do Imposto Mensal: ${FormatacaoHelper.formatarMoeda(dados.faturamento)} × ${(dados.aliquota * 100).toFixed(1)}% = ${FormatacaoHelper.formatarMoeda(valorImposto)}\n`;
            
            // Obter percentual de implementação para o ano
            const percentualImplementacao = this.obterPercentualImplementacao(ano);
            const impactoAno = valorImposto * percentualImplementacao;
            
            textoMemoria += `Percentual de Implementação (${ano}): ${(percentualImplementacao * 100).toFixed(0)}%\n`;
            textoMemoria += `Impacto no Fluxo de Caixa: ${FormatacaoHelper.formatarMoeda(valorImposto)} × ${(percentualImplementacao * 100).toFixed(0)}% = ${FormatacaoHelper.formatarMoeda(impactoAno)}\n\n`;
            
            // Análise do capital de giro
            textoMemoria += `=== ANÁLISE DO CAPITAL DE GIRO ===\n`;
            const impactoDias = dados.pmr * (impactoAno / dados.faturamento);
            
            textoMemoria += `Impacto em Dias de Faturamento: ${dados.pmr} × ${(impactoAno / dados.faturamento * 100).toFixed(1)}% = ${impactoDias.toFixed(1)} dias\n`;
            textoMemoria += `Necessidade Adicional de Capital de Giro: ${FormatacaoHelper.formatarMoeda(impactoAno * 1.2)}\n\n`;
            
            // Impacto na rentabilidade
            textoMemoria += `=== IMPACTO NA RENTABILIDADE ===\n`;
            const custoGiro = dados.taxaCapitalGiro || 0.021; // Taxa de capital de giro (2,1% a.m.)
            const custoMensal = impactoAno * custoGiro;
            const custoAnual = custoMensal * 12;
            const impactoMargem = custoMensal / dados.faturamento;
            
            textoMemoria += `Margem Operacional Original: ${(dados.margem * 100).toFixed(1)}%\n`;
            textoMemoria += `Custo Financeiro Mensal: ${FormatacaoHelper.formatarMoeda(impactoAno)} × ${(custoGiro * 100).toFixed(1)}% = ${FormatacaoHelper.formatarMoeda(custoMensal)}\n`;
            textoMemoria += `Custo Financeiro Anual: ${FormatacaoHelper.formatarMoeda(custoMensal)} × 12 = ${FormatacaoHelper.formatarMoeda(custoAnual)}\n`;
            textoMemoria += `Impacto na Margem: ${FormatacaoHelper.formatarMoeda(custoMensal)} ÷ ${FormatacaoHelper.formatarMoeda(dados.faturamento)} = ${(impactoMargem * 100).toFixed(2)}%\n`;
            textoMemoria += `Margem Ajustada: ${(dados.margem * 100).toFixed(1)}% - ${(impactoMargem * 100).toFixed(2)}% = ${((dados.margem - impactoMargem) * 100).toFixed(2)}%\n\n`;
            
            memoria[ano] = textoMemoria;
        }
        
        return memoria;
    }
};

    /**
     * Movido de main.js
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

