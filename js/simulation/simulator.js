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
        const formatarMoeda = (valor) => {
            if (valor === undefined || valor === null) {
                return 'R$ 0,00';
            }
            return `R$ ${valor.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        };

        const formatarPercent = (valor) => `${(valor * 100).toFixed(2)}%`;

        // Extrair dados principais
        const impacto = resultados.impactoBase;
        const projecao = resultados.projecaoTemporal;

        // Construir HTML dos resultados com layout ampliado
        let html = `
            <div class="resultados-container">
                <div class="resultados-header">
                    <h3>Resultados da Simulação</h3>
                </div>
                
                <div class="resultados-impacto">
                    <h4>Impacto Imediato</h4>
                    <table class="table table-striped">
                        <tr>
                            <td>Percentual de Implementação:</td>
                            <td>${formatarPercent(impacto.resultadoSplitPayment.percentualImplementacao)}</td>
                        </tr>
                        <tr>
                            <td>Diferença no Capital de Giro:</td>
                            <td>${formatarMoeda(impacto.diferencaCapitalGiro)}</td>
                        </tr>
                        <tr>
                            <td>Impacto Percentual:</td>
                            <td>${formatarPercent(impacto.percentualImpacto/100)}</td>
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
                
                <div class="resultados-projecao">
                    <h4>Impacto acumulado no período ${projecao.parametros.anoInicial}-${projecao.parametros.anoFinal}</h4>
                    <table class="table table-striped">
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
                
                <div class="resultados-detalhados">
                    <h4>Projeção Anual</h4>
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>Ano</th>
                                <th>% Implementação</th>
                                <th>Impacto no Capital de Giro</th>
                                <th>% do Impacto</th>
                                <th>Necessidade Adicional</th>
                                <th>Margem Ajustada</th>
                            </tr>
                        </thead>
                        <tbody>
                        ${Object.keys(projecao.resultadosAnuais).map(ano => {
                            const resultado = projecao.resultadosAnuais[ano];
                            return `<tr>
                                <td>${ano}</td>
                                <td>${formatarPercent(resultado.resultadoSplitPayment.percentualImplementacao)}</td>
                                <td>${formatarMoeda(resultado.diferencaCapitalGiro)}</td>
                                <td>${formatarPercent(resultado.percentualImpacto/100)}</td>
                                <td>${formatarMoeda(resultado.necessidadeAdicionalCapitalGiro)}</td>
                                <td>${formatarPercent(resultado.margemOperacionalAjustada)}</td>
                            </tr>`;
                        }).join('')}
                        </tbody>
                    </table>
                </div>
                
                <div class="resultados-analise">
                    <p>Esta análise demonstra como diferentes cenários de crescimento afetam a necessidade de capital adicional.</p>
                </div>
            </div>`;
        
        containerResultados.innerHTML = html;
    },

    /** 
     * Limpa os resultados da simulação 
     */
    limparSimulacao: function() {
        const containerResultados = document.getElementById('resultados');
        if (containerResultados) {
            containerResultados.innerHTML = 'Preencha os dados e clique em "Simular" para visualizar os resultados.';
        }

        // Limpar gráficos
        if (window.graficos) {
            Object.values(window.graficos).forEach(grafico => {
                if (grafico && typeof grafico.destroy === 'function') {
                    grafico.destroy();
                }
            });
            window.graficos = {};
        }

        if (window.graficoSensibilidade) {
            window.graficoSensibilidade.destroy();
            window.graficoSensibilidade = null;
        }

        // Limpar memória de simulação
        window.ultimaSimulacao = null;
        window.memoriaCalculoSimulacao = null;

        console.log('Simulação limpa com sucesso');
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
            textoMemoria += `Faturamento Mensal: ${this.formatarMoeda(dados.faturamento)}\n`;
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
            textoMemoria += `Valor do Imposto Mensal: ${this.formatarMoeda(dados.faturamento)} × ${(dados.aliquota * 100).toFixed(1)}% = ${this.formatarMoeda(valorImposto)}\n`;
            
            // Obter percentual de implementação para o ano
            const percentualImplementacao = this.obterPercentualImplementacao(ano);
            const impactoAno = valorImposto * percentualImplementacao;
            textoMemoria += `Percentual de Implementação (${ano}): ${(percentualImplementacao * 100).toFixed(0)}%\n`;
            textoMemoria += `Impacto no Fluxo de Caixa: ${this.formatarMoeda(valorImposto)} × ${(percentualImplementacao * 100).toFixed(0)}% = ${this.formatarMoeda(impactoAno)}\n\n`;
            
            // Análise do capital de giro
            textoMemoria += `=== ANÁLISE DO CAPITAL DE GIRO ===\n`;
            const impactoDias = dados.pmr * (impactoAno / dados.faturamento);
            textoMemoria += `Impacto em Dias de Faturamento: ${dados.pmr} × ${(impactoAno / dados.faturamento * 100).toFixed(1)}% = ${impactoDias.toFixed(1)} dias\n`;
            textoMemoria += `Necessidade Adicional de Capital de Giro: ${this.formatarMoeda(impactoAno * 1.2)}\n\n`;
            
            // Impacto na rentabilidade
            textoMemoria += `=== IMPACTO NA RENTABILIDADE ===\n`;
            const custoGiro = dados.taxaCapitalGiro || 0.021; // Taxa de capital de giro (2,1% a.m.)
            const custoMensal = impactoAno * custoGiro;
            const custoAnual = custoMensal * 12;
            const impactoMargem = custoMensal / dados.faturamento;
            textoMemoria += `Margem Operacional Original: ${(dados.margem * 100).toFixed(1)}%\n`;
            textoMemoria += `Custo Financeiro Mensal: ${this.formatarMoeda(impactoAno)} × ${(custoGiro * 100).toFixed(1)}% = ${this.formatarMoeda(custoMensal)}\n`;
            textoMemoria += `Custo Financeiro Anual: ${this.formatarMoeda(custoMensal)} × 12 = ${this.formatarMoeda(custoAnual)}\n`;
            textoMemoria += `Impacto na Margem: ${this.formatarMoeda(custoMensal)} ÷ ${this.formatarMoeda(dados.faturamento)} = ${(impactoMargem * 100).toFixed(2)}%\n`;
            textoMemoria += `Margem Ajustada: ${(dados.margem * 100).toFixed(1)}% - ${(impactoMargem * 100).toFixed(2)}% = ${((dados.margem - impactoMargem) * 100).toFixed(2)}%\n\n`;
            
            memoria[ano] = textoMemoria;
        }
        
        return memoria;
    },
    
    /**
     * Formata um valor para moeda brasileira
     * @param {number} valor - Valor a ser formatado
     * @returns {string} - Valor formatado como moeda brasileira
     */
    formatarMoeda: function(valor) {
        if (valor === undefined || valor === null) {
            return 'R$ 0,00';
        }
        return `R$ ${valor.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    }
};

/**
 * Helper para formatação de valores
 */
const FormatacaoHelper = {
    formatarMoeda: function(valor) {
        if (valor === undefined || valor === null) {
            return 'R$ 0,00';
        }
        return `R$ ${valor.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    },
    
    formatarPercentual: function(valor) {
        return `${valor.toFixed(2)}%`;
    },
    
    formatarData: function(data) {
        if (!data) return '';
        return new Date(data).toLocaleDateString('pt-BR');
    }
};

/**
 * Gerenciador de abas para a interface
 */
const TabsManager = {
    mudarPara: function(tabId) {
        const tabs = document.querySelectorAll('.tab-pane');
        const links = document.querySelectorAll('.nav-link');
        
        // Esconder todas as abas e desativar todos os links
        tabs.forEach(tab => tab.classList.remove('active', 'show'));
        links.forEach(link => link.classList.remove('active'));
        
        // Mostrar a aba selecionada e ativar o link correspondente
        const tabAlvo = document.getElementById(tabId);
        const linkAlvo = document.querySelector(`[href="#${tabId}"]`);
        
        if (tabAlvo) {
            tabAlvo.classList.add('active', 'show');
        }
        
        if (linkAlvo) {
            linkAlvo.classList.add('active');
        }
    }
};

/** 
 * Implementação básica das funções de cálculo de estratégias
 */
function calcularEfeitividadeAjustePrecos(dados, config, impactoBase) {
    // Implementação básica para evitar erros
    return {
        efetividadePercentual: config.percentualAumento * 0.8,
        mitigacao: impactoBase.necessidadeAdicionalCapitalGiro * (config.percentualAumento * 0.8 / 100),
        custo: dados.faturamento * (config.impactoVendas / 100) * dados.margem
    };
}

function calcularEfeitividadeRenegociacaoPrazos(dados, config, impactoBase) {
    // Implementação básica para evitar erros
    return {
        efetividadePercentual: config.percentualFornecedores * 0.5,
        mitigacao: impactoBase.necessidadeAdicionalCapitalGiro * (config.percentualFornecedores * 0.5 / 100),
        custo: dados.faturamento * (config.custoContrapartida / 100)
    };
}

function calcularEfeitividadeAntecipacaoRecebiveis(dados, config, impactoBase) {
    // Implementação básica para evitar erros
    return {
        efetividadePercentual: config.percentualAntecipacao * 0.9,
        mitigacao: impactoBase.necessidadeAdicionalCapitalGiro * (config.percentualAntecipacao * 0.9 / 100),
        custo: dados.faturamento * config.percPrazo * (config.percentualAntecipacao / 100) * config.taxaDesconto
    };
}

function calcularEfeitividadeCapitalGiro(dados, config, impactoBase) {
    // Implementação básica para evitar erros
    return {
        efetividadePercentual: (config.valorCaptacao / impactoBase.necessidadeAdicionalCapitalGiro) * 100,
        mitigacao: Math.min(config.valorCaptacao, impactoBase.necessidadeAdicionalCapitalGiro),
        custo: config.valorCaptacao * config.taxaJuros * config.prazoPagamento / 12
    };
}

function calcularEfeitividadeMixProdutos(dados, config, impactoBase) {
    // Implementação básica para evitar erros
    return {
        efetividadePercentual: config.percentualAjuste * 0.6,
        mitigacao: impactoBase.necessidadeAdicionalCapitalGiro * (config.percentualAjuste * 0.6 / 100),
        custo: dados.faturamento * (config.impactoMargem / 100)
    };
}

function calcularEfeitividadeMeiosPagamento(dados, config, impactoBase) {
    // Implementação básica para evitar erros
    const aumentoVista = config.distribuicaoNova.vista - config.distribuicaoAtual.vista;
    return {
        efetividadePercentual: aumentoVista * 1.2,
        mitigacao: impactoBase.necessidadeAdicionalCapitalGiro * (aumentoVista * 1.2 / 100),
        custo: dados.faturamento * (config.taxaIncentivo / 100)
    };
}

function calcularEfeitividadeCombinada(dados, estrategias, resultadosEstrategias, impactoBase) {
    // Soma das mitigações e custos
    let mitigacaoTotal = 0;
    let custoTotal = 0;
    
    Object.values(resultadosEstrategias).forEach(resultado => {
        mitigacaoTotal += resultado.mitigacao || 0;
        custoTotal += resultado.custo || 0;
    });
    
    // Limitar mitigação ao valor do impacto
    mitigacaoTotal = Math.min(mitigacaoTotal, impactoBase.necessidadeAdicionalCapitalGiro);
    
    // Calcular efetividade percentual
    const efetividadePercentual = (mitigacaoTotal / impactoBase.necessidadeAdicionalCapitalGiro) * 100;
    
    // Calcular relação custo-benefício
    const custoBeneficio = mitigacaoTotal > 0 ? custoTotal / mitigacaoTotal : 0;
    
    return {
        mitigacaoTotal,
        custoTotal,
        efetividadePercentual,
        custoBeneficio
    };
}

function identificarCombinacaoOtima(dados, estrategias, resultadosEstrategias, impactoBase) {
    // Implementação básica para evitar erros
    const combinacaoOtima = {
        nomeEstrategias: [],
        efetividadePercentual: 0,
        custoTotal: 0,
        custoBeneficio: 0
    };
    
    // Adicionar estratégias mais eficientes
    Object.entries(resultadosEstrategias).forEach(([nome, resultado]) => {
        if (resultado.efetividadePercentual > 10) {
            combinacaoOtima.nomeEstrategias.push(nome);
            combinacaoOtima.efetividadePercentual += resultado.efetividadePercentual;
            combinacaoOtima.custoTotal += resultado.custo;
        }
    });
    
    // Calcular relação custo-benefício
    combinacaoOtima.custoBeneficio = combinacaoOtima.custoTotal > 0 ? 
        combinacaoOtima.efetividadePercentual / combinacaoOtima.custoTotal : 0;
    
    return combinacaoOtima;
}

/** 
 * Simula o impacto das estratégias de mitigação selecionadas 
 */
function simularEstrategias() {
    console.log('Iniciando simulação de estratégias...');
    
    try {
        // Verificar se há uma simulação principal realizada
        if (!window.ultimaSimulacao) {
            alert('É necessário realizar uma simulação principal antes de simular estratégias de mitigação.');
            // Redirecionar para a aba de simulação
            TabsManager.mudarPara('simulacao-principal');
            return;
        }
        
        // Coletar dados da última simulação
        const dados = window.ultimaSimulacao.dados;
        const impactoBase = window.ultimaSimulacao.resultados.impactoBase;
        
        // Coletar configurações das estratégias
        const estrategias = {
            ajustePrecos: {
                ativar: document.getElementById('ap-ativar').value === '1',
                percentualAumento: parseFloat(document.getElementById('ap-percentual').value) || 0,
                elasticidade: parseFloat(document.getElementById('ap-elasticidade').value) || 0,
                impactoVendas: parseFloat(document.getElementById('ap-impacto-vendas').value) || 0,
                periodoAjuste: parseInt(document.getElementById('ap-periodo').value) || 0
            },
            renegociacaoPrazos: {
                ativar: document.getElementById('rp-ativar').value === '1',
                aumentoPrazo: parseInt(document.getElementById('rp-aumento-prazo').value) || 0,
                percentualFornecedores: parseInt(document.getElementById('rp-percentual').value) || 0,
                contrapartidas: document.getElementById('rp-contrapartidas').value || 'nenhuma',
                custoContrapartida: parseFloat(document.getElementById('rp-custo').value) || 0
            },
            antecipacaoRecebiveis: {
                ativar: document.getElementById('ar-ativar').value === '1',
                percentualAntecipacao: parseInt(document.getElementById('ar-percentual').value) || 0,
                taxaDesconto: parseFloat(document.getElementById('ar-taxa').value) / 100 || 0,
                prazoAntecipacao: parseInt(document.getElementById('ar-prazo').value) || 0
            },
            capitalGiro: {
                ativar: document.getElementById('cg-ativar').value === '1',
                valorCaptacao: parseInt(document.getElementById('cg-valor').value) || 0,
                taxaJuros: parseFloat(document.getElementById('cg-taxa').value) / 100 || 0,
                prazoPagamento: parseInt(document.getElementById('cg-prazo').value) || 0,
                carencia: parseInt(document.getElementById('cg-carencia').value) || 0
            },
            mixProdutos: {
                ativar: document.getElementById('mp-ativar').value === '1',
                percentualAjuste: parseInt(document.getElementById('mp-percentual').value) || 0,
                focoAjuste: document.getElementById('mp-foco').value || 'ciclo',
                impactoReceita: parseFloat(document.getElementById('mp-impacto-receita').value) || 0,
                impactoMargem: parseFloat(document.getElementById('mp-impacto-margem').value) || 0
            },
            meiosPagamento: {
                ativar: document.getElementById('mp-pag-ativar').value === '1',
                distribuicaoAtual: {
                    vista: parseInt(document.getElementById('mp-pag-vista-atual').value) || 0,
                    prazo: parseInt(document.getElementById('mp-pag-prazo-atual').value) || 0
                },
                distribuicaoNova: {
                    vista: parseInt(document.getElementById('mp-pag-vista-novo').value) || 0,
                    dias30: parseInt(document.getElementById('mp-pag-30-novo').value) || 0,
                    dias60: parseInt(document.getElementById('mp-pag-60-novo').value) || 0,
                    dias90: parseInt(document.getElementById('mp-pag-90-novo').value) || 0
                },
                taxaIncentivo: parseFloat(document.getElementById('mp-pag-taxa-incentivo').value) || 0
            }
        };
        
        // Inicializar resultados das estratégias
        const resultadosEstrategias = {};
        
        // Calcular efetividade de cada estratégia ativa
        if (estrategias.ajustePrecos.ativar) {
            resultadosEstrategias.ajustePrecos = calcularEfeitividadeAjustePrecos(dados, estrategias.ajustePrecos, impactoBase);
        }
        
        if (estrategias.renegociacaoPrazos.ativar) {
            resultadosEstrategias.renegociacaoPrazos = calcularEfeitividadeRenegociacaoPrazos(dados, estrategias.renegociacaoPrazos, impactoBase);
        }
        
        if (estrategias.antecipacaoRecebiveis.ativar) {
            resultadosEstrategias.antecipacaoRecebiveis = calcularEfeitividadeAntecipacaoRecebiveis(dados, estrategias.antecipacaoRecebiveis, impactoBase);
        }
        
        if (estrategias.capitalGiro.ativar) {
            resultadosEstrategias.capitalGiro = calcularEfeitividadeCapitalGiro(dados, estrategias.capitalGiro, impactoBase);
        }
        
        if (estrategias.mixProdutos.ativar) {
            resultadosEstrategias.mixProdutos = calcularEfeitividadeMixProdutos(dados, estrategias.mixProdutos, impactoBase);
        }
        
        if (estrategias.meiosPagamento.ativar) {
            resultadosEstrategias.meiosPagamento = calcularEfeitividadeMeiosPagamento(dados, estrategias.meiosPagamento, impactoBase);
        }
        
        // Calcular efetividade combinada
        const efeitividadeCombinada = calcularEfeitividadeCombinada(dados, estrategias, resultadosEstrategias, impactoBase);
        
        // Identificar combinação ótima
        const combinacaoOtima = identificarCombinacaoOtima(dados, estrategias, resultadosEstrategias, impactoBase);
        
        // Consolidar resultados
        const resultados = {
            impactoBase,
            estrategias,
            resultadosEstrategias,
            efeitividadeCombinada,
            combinacaoOtima
        };
        
        // Armazenar resultados para uso posterior
        window.resultadosEstrategias = resultados;
        
        // Exibir resultados
        exibirResultadosEstrategias(resultados);
        
        // Atualizar gráficos
        gerarGraficoEstrategias(resultados);
        
        console.log('Simulação de estratégias concluída com sucesso');
        return resultados;
    } catch (error) {
        console.error('Erro ao simular estratégias:', error);
        alert('Ocorreu um erro durante a simulação das estratégias: ' + error.message);
    }
}

/** 
 * Exibe os resultados das estratégias de mitigação na interface
 * @param {Object} resultados - Resultados da simulação de estratégias 
 */
function exibirResultadosEstrategias(resultados) {
    try {
        const containerResultados = document.getElementById('resultados-estrategias');
        if (!containerResultados) return;
        
        // Verificar se resultados e combinacaoOtima existem
        if (!resultados || !resultados.combinacaoOtima) {
            console.error('Resultados ou combinação ótima não definidos');
            return;
        }
        
        // Verificar se nomeEstrategias existe
        const nomeEstrategias = resultados.combinacaoOtima.nomeEstrategias || [];
        
        // Formatar valores para exibição
        const formatarMoeda = (valor) => (valor !== undefined && valor !== null) ? 
            `R$ ${valor.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : 
            "R$ 0,00";
            
        const formatarPercent = (valor) => `${valor.toFixed(2)}%`;
        
        // Construir HTML dos resultados
        let html = `
            <div class="resultados-estrategias-container">
                <div class="impacto-original">
                    <h4>Impacto Original</h4>
                    <p>Redução no capital de giro: ${formatarMoeda(Math.abs(resultados.impactoBase.diferencaCapitalGiro))}</p>
                    <p>Necessidade adicional: ${formatarMoeda(resultados.impactoBase.necessidadeAdicionalCapitalGiro)}</p>
                    <p>Impacto na margem: ${formatarPercent(resultados.impactoBase.impactoMargem)}</p>
                </div>
                
                <div class="estrategias-selecionadas">
                    <h4>Estratégias Selecionadas</h4>
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>Estratégia</th>
                                <th>Efetividade</th>
                                <th>Impacto</th>
                                <th>Custo</th>
                            </tr>
                        </thead>
                        <tbody>`;
                        
        // Adicionar linha para cada estratégia ativa
        let estrategiasAtivas = false;
        Object.entries(resultados.resultadosEstrategias).forEach(([nome, resultado]) => {
            estrategiasAtivas = true;
            const nomeFormatado = traduzirNomeEstrategia(nome);
            const impacto = resultado.mitigacao || 0;
            const custo = resultado.custo || 0;
            
            html += `
                <tr>
                    <td>${nomeFormatado}</td>
                    <td>${formatarPercent(resultado.efetividadePercentual)}</td>
                    <td>${formatarMoeda(impacto)}</td>
                    <td>${formatarMoeda(custo)}</td>
                </tr>`;
        });
        
        // Se não houver estratégias ativas
        if (!estrategiasAtivas) {
            html += `
                <tr>
                    <td colspan="4">Nenhuma estratégia de mitigação foi selecionada. Ative pelo menos uma estratégia para visualizar os resultados.</td>
                </tr>`;
        }
        
        html += `
                        </tbody>
                    </table>
                </div>
                
                <div class="efetividade-combinada">
                    <h4>Efetividade Combinada</h4>
                    <p>Efetividade total: ${formatarPercent(resultados.efeitividadeCombinada.efetividadePercentual)}</p>
                    <p>Mitigação total: ${formatarMoeda(resultados.efeitividadeCombinada.mitigacaoTotal)}</p>
                    <p>Custo total: ${formatarMoeda(resultados.efeitividadeCombinada.custoTotal)}</p>
                    <p>Relação custo-benefício: ${resultados.efeitividadeCombinada.custoBeneficio.toFixed(2)}</p>
                </div>
                
                <div class="combinacao-otima">
                    <h4>Estratégia Recomendada</h4>
                    <p>Estratégias recomendadas: ${resultados.combinacaoOtima.nomeEstrategias.map(traduzirNomeEstrategia).join(', ') || 'Nenhuma'}</p>
                    <p>Efetividade: ${formatarPercent(resultados.combinacaoOtima.efetividadePercentual)}</p>
                    <p>Custo total: ${formatarMoeda(resultados.combinacaoOtima.custoTotal)}</p>
                    <p>Relação custo-benefício: ${resultados.combinacaoOtima.custoBeneficio.toFixed(2)}</p>
                </div>
            </div>`;
        
        containerResultados.innerHTML = html;
    } catch (error) {
        console.error('Erro ao exibir resultados das estratégias:', error);
        alert('Erro ao exibir resultados das estratégias: ' + error.message);
    }
}

/**
 * Traduz o nome técnico da estratégia para um nome mais amigável
 * @param {string} nome - Nome técnico da estratégia
 * @returns {string} - Nome amigável da estratégia
 */
function traduzirNomeEstrategia(nome) {
    const traducoes = {
        'ajustePrecos': 'Ajuste de Preços',
        'renegociacaoPrazos': 'Renegociação de Prazos',
        'antecipacaoRecebiveis': 'Antecipação de Recebíveis',
        'capitalGiro': 'Captação de Capital de Giro',
        'mixProdutos': 'Ajuste do Mix de Produtos',
        'meiosPagamento': 'Incentivo a Novos Meios de Pagamento'
    };
    
    return traducoes[nome] || nome;
}

/**
 * Gera gráficos para visualização dos resultados das estratégias
 * @param {Object} resultados - Resultados da simulação de estratégias
 */
function gerarGraficoEstrategias(resultados) {
    // Implementação básica para evitar erros - em produção seria implementado com uma biblioteca como Chart.js
    console.log('Gerando gráficos de estratégias...');
    
    // Simulação da criação de gráficos
    if (!window.graficos) window.graficos = {};
    
    // Criamos um objeto temporário que simula um gráfico
    window.graficos.estrategias = {
        destroy: function() { console.log('Destruindo gráfico de estratégias'); }
    };
    
    console.log('Gráficos de estratégias gerados com sucesso');
}