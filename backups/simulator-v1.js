/**
 * Simulador de Fluxo de Caixa
 * Responsável pelos cálculos do impacto do Split Payment
 */
const SimuladorFluxoCaixa = {
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
            textoMemoria += `Faturamento Mensal: R$ ${FormatacaoHelper.formatarNumero(dados.faturamento)}\n`;
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
            
            textoMemoria += `Valor do Imposto Mensal: R$ ${FormatacaoHelper.formatarNumero(dados.faturamento)} × ${(dados.aliquota * 100).toFixed(1)}% = R$ ${FormatacaoHelper.formatarNumero(valorImposto)}\n`;
            
            // Obter percentual de implementação para o ano
            const percentualImplementacao = this.obterPercentualImplementacao(ano);
            const impactoAno = valorImposto * percentualImplementacao;
            
            textoMemoria += `Percentual de Implementação (${ano}): ${(percentualImplementacao * 100).toFixed(0)}%\n`;
            textoMemoria += `Impacto no Fluxo de Caixa: R$ ${FormatacaoHelper.formatarNumero(valorImposto)} × ${(percentualImplementacao * 100).toFixed(0)}% = R$ ${FormatacaoHelper.formatarNumero(impactoAno)}\n\n`;
            
            // Análise do capital de giro
            textoMemoria += `=== ANÁLISE DO CAPITAL DE GIRO ===\n`;
            const impactoDias = dados.pmr * (impactoAno / dados.faturamento);
            
            textoMemoria += `Impacto em Dias de Faturamento: ${FormatacaoHelper.formatarNumero(dados.pmr)} × ${FormatacaoHelper.formatarNumero(impactoAno / dados.faturamento * 100)}% = ${FormatacaoHelper.formatarNumero(impactoDias)} dias\n`;
            textoMemoria += `Necessidade Adicional de Capital de Giro: R$ ${FormatacaoHelper.formatarNumero(impactoAno * 1.2)}\n\n`;
            
            // Impacto na rentabilidade
            textoMemoria += `=== IMPACTO NA RENTABILIDADE ===\n`;
            const custoGiro = dados.taxaCapitalGiro || 0.021; // Taxa de capital de giro (2,1% a.m.)
            const custoMensal = impactoAno * custoGiro;
            const custoAnual = custoMensal * 12;
            const impactoMargem = custoMensal / dados.faturamento;
            
            textoMemoria += `Margem Operacional Original: ${(dados.margem * 100).toFixed(1)}%\n`;
            textoMemoria += `Custo Financeiro Mensal: R$ ${FormatacaoHelper.formatarNumero(impactoAno)} × ${(custoGiro * 100).toFixed(1)}% = R$ ${FormatacaoHelper.formatarNumero(custoMensal)}\n`;
            textoMemoria += `Custo Financeiro Anual: R$ ${FormatacaoHelper.formatarNumero(custoMensal)} × 12 = R$ ${FormatacaoHelper.formatarNumero(custoAnual)}\n`;
            textoMemoria += `Impacto na Margem: R$ ${FormatacaoHelper.formatarNumero(custoMensal)} ÷ R$ ${FormatacaoHelper.formatarNumero(dados.faturamento)} = ${(impactoMargem * 100).toFixed(2)}%\n`;
            textoMemoria += `Margem Ajustada: ${(dados.margem * 100).toFixed(1)}% - ${(impactoMargem * 100).toFixed(2)}% = ${((dados.margem - impactoMargem) * 100).toFixed(2)}%\n\n`;
            
            memoria[ano] = textoMemoria;
        }
        
        return memoria;
    }
};
