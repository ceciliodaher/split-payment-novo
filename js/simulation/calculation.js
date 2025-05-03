/**
 * Módulo de Cálculos Fundamentais para o Simulador de Split Payment
 * Fornece todas as funções necessárias para calcular o impacto no fluxo de caixa e capital de giro
 * 
 * @author Expertzy Inteligência Tributária
 * @version 1.0.0
 */
const CalculationModule = (function() {
    // Variáveis para armazenar resultados intermediários
    let _resultadoAtual = null;
    let _resultadoSplitPayment = null;
    
    // Método para obter dados do repositório
    function obterDadosDoRepositorio() {
        // Verificar se o repositório está disponível
        if (typeof SimuladorRepository === 'undefined') {
            console.error('SimuladorRepository não está definido. Utilizando dados padrão.');
            return {
                empresa: { faturamento: 0, margem: 0 },
                cicloFinanceiro: { pmr: 30, pmp: 30, pme: 30, percVista: 0.3, percPrazo: 0.7 },
                parametrosFiscais: { aliquota: 0.265, creditos: 0 },
                parametrosSimulacao: { cenario: 'moderado', taxaCrescimento: 0.05 }
            };
        }
        
        // Obter dados do repositório
        return {
            empresa: SimuladorRepository.obterSecao('empresa'),
            cicloFinanceiro: SimuladorRepository.obterSecao('cicloFinanceiro'),
            parametrosFiscais: SimuladorRepository.obterSecao('parametrosFiscais'),
            parametrosSimulacao: SimuladorRepository.obterSecao('parametrosSimulacao'),
            setoresEspeciais: SimuladorRepository.obterSecao('setoresEspeciais')
        };
    }

    // API pública modificada
    return {
        // Métodos originais
        calcularFluxoCaixaAtual,
        calcularFluxoCaixaSplitPayment,
        calcularImpactoCapitalGiro,
        calcularImpactoMargem,
        calcularNecessidadeAdicionalCapital,
        calcularProjecaoTemporal,
        calcularImpactoCicloFinanceiro,

        // Métodos de estratégias adicionados
        calcularEfeitividadeAjustePrecos,
        calcularEfeitividadeRenegociacaoPrazos,
        calcularEfeitividadeAntecipacaoRecebiveis,
        calcularEfeitividadeCapitalGiro,
        calcularEfeitividadeMixProdutos,
        calcularEfeitividadeMeiosPagamento,
        calcularEfeitividadeCombinada,
        calcularEfeitividadeMitigacao,
        identificarCombinacaoOtima,

        // Métodos novos
        simular,
        gerarMemoriaCalculo,

        // Getters para resultados intermediários (para depuração)
        getResultadoAtual: function() { return _resultadoAtual; },
        getResultadoSplitPayment: function() { return _resultadoSplitPayment; }
    };
})();

/**
 * Realiza uma simulação completa do impacto do Split Payment
 * @param {Object} dados - Dados para simulação
 * @returns {Object} - Resultados completos da simulação
 */
function simular(dados) {
    console.log('Iniciando simulação no CalculationModule:', dados);
    
    // Extrair ano inicial e final para simulação
    const anoInicial = parseInt(dados.dataInicial.split('-')[0]);
    const anoFinal = parseInt(dados.dataFinal.split('-')[0]);
    
    // Obter parâmetros setoriais, se aplicável
    const parametrosSetoriais = this._obterParametrosSetoriais(dados.setor);
    
    // Calcular impacto inicial
    const impactoBase = this.calcularImpactoCapitalGiro(dados, anoInicial, parametrosSetoriais);
    
    // Simular período de transição
    const projecaoTemporal = this.calcularProjecaoTemporal(
        dados, 
        anoInicial, 
        anoFinal, 
        dados.cenario, 
        dados.taxaCrescimento,
        parametrosSetoriais
    );
    
    // Gerar memória de cálculo
    const memoriaCalculo = this.gerarMemoriaCalculo(dados, anoInicial, anoFinal);
    
    // Estruturar resultados
    return {
        impactoBase,
        projecaoTemporal,
        memoriaCalculo,
        dadosUtilizados: dados,
        parametrosSetoriais
    };
}

/**
 * Calcula o fluxo de caixa no regime tributário atual (pré-Split Payment)
 * 
 * @param {Object} dados - Dados da empresa e parâmetros de simulação
 * @returns {Object} - Resultados detalhados do fluxo de caixa atual
 */
function calcularFluxoCaixaAtual(dados) {
    // Extrair parâmetros relevantes
    const faturamento = dados.faturamento;
    const aliquota = dados.aliquota;
    const pmr = dados.pmr;
    const percVista = dados.percVista;
    const percPrazo = dados.percPrazo;
    const creditos = dados.creditos || 0;
    
    // Cálculos do fluxo de caixa atual
    const valorImpostoTotal = faturamento * aliquota;
    const valorImpostoLiquido = Math.max(0, valorImpostoTotal - creditos);
    
    // Prazo para recolhimento do imposto (padrão: dia 25 do mês seguinte)
    const prazoRecolhimento = 25;
    
    // Cálculo do capital de giro obtido pelo adiamento do pagamento de impostos
    const capitalGiroImpostos = valorImpostoLiquido;
    
    // Cálculo do recebimento das vendas
    const recebimentoVista = faturamento * percVista;
    const recebimentoPrazo = faturamento * percPrazo;
    
    // Cálculo do tempo médio do capital em giro
    const tempoMedioCapitalGiro = calcularTempoMedioCapitalGiro(pmr, prazoRecolhimento, percVista, percPrazo);
    
    // Benefício financeiro do capital em giro (em dias de faturamento)
    const beneficioDiasCapitalGiro = (capitalGiroImpostos / faturamento) * tempoMedioCapitalGiro;
    
    // Resultado completo
    return {
        faturamento,
        valorImpostoTotal,
        creditos,
        valorImpostoLiquido,
        recebimentoVista,
        recebimentoPrazo,
        prazoRecolhimento,
        capitalGiroDisponivel: capitalGiroImpostos,
        tempoMedioCapitalGiro,
        beneficioDiasCapitalGiro,
        fluxoCaixaLiquido: faturamento - valorImpostoLiquido,
        memoriaCritica: {
            tituloRegime: "Regime Atual (Pré-Split Payment)",
            descricaoRegime: "No regime atual, o tributo é recolhido no mês subsequente (normalmente até o dia 25).",
            tituloCalculo: "Cálculo do Capital de Giro Disponível",
            formula: `Capital de Giro = Valor do Imposto Líquido (${formatarMoeda(valorImpostoLiquido)})`,
            observacoes: [
                `O valor do imposto fica disponível para uso como capital de giro por aproximadamente ${tempoMedioCapitalGiro.toFixed(1)} dias.`,
                `Isso representa ${beneficioDiasCapitalGiro.toFixed(1)} dias de faturamento em capital de giro.`
            ]
        }
    };
}

/**
 * Calcula o fluxo de caixa com o regime de Split Payment
 * 
 * @param {Object} dados - Dados da empresa e parâmetros de simulação
 * @param {number} ano - Ano de referência para percentual de implementação
 * @param {Object} parametrosSetoriais - Parâmetros específicos do setor (opcional)
 * @returns {Object} - Resultados detalhados do fluxo de caixa com Split Payment
 */
function calcularFluxoCaixaSplitPayment(dados, ano = 2026, parametrosSetoriais = null) {
    // Extrair parâmetros relevantes
    const faturamento = dados.faturamento;
    const aliquota = dados.aliquota;
    const pmr = dados.pmr;
    const percVista = dados.percVista;
    const percPrazo = dados.percPrazo;
    const creditos = dados.creditos || 0;
    const compensacao = dados.compensacao || 'automatica';
    
    // Obter percentual de implementação para o ano específico
    const percentualImplementacao = obterPercentualImplementacao(ano, parametrosSetoriais);
    
    // Cálculos do fluxo de caixa com Split Payment
    const valorImpostoTotal = faturamento * aliquota;
    const valorImpostoLiquido = Math.max(0, valorImpostoTotal - creditos);
    
    // Valor dos impostos afetados pelo Split Payment
    const valorImpostoSplit = valorImpostoLiquido * percentualImplementacao;
    const valorImpostoNormal = valorImpostoLiquido - valorImpostoSplit;
    
    // Cálculo do capital de giro disponível (apenas a parte não afetada pelo Split Payment)
    const capitalGiroDisponivel = valorImpostoNormal;
    
    // Cálculo dos recebimentos
    // Para vendas à vista: recebimento - split payment imediato
    const recebimentoVista = (faturamento * percVista) - (valorImpostoSplit * (percVista / (percVista + percPrazo)));
    
    // Para vendas a prazo: valor integral, mas com retenção de impostos no recebimento
    const recebimentoPrazo = (faturamento * percPrazo) - (valorImpostoSplit * (percPrazo / (percVista + percPrazo)));
    
    // Prazo para recolhimento do imposto normal (não Split)
    const prazoRecolhimento = 25;
    
    // Cálculo do tempo médio do capital em giro (apenas para a parcela não Split)
    const tempoMedioCapitalGiro = calcularTempoMedioCapitalGiro(pmr, prazoRecolhimento, percVista, percPrazo);
    
    // Benefício financeiro do capital em giro (em dias de faturamento)
    const beneficioDiasCapitalGiro = (capitalGiroDisponivel / faturamento) * tempoMedioCapitalGiro;
    
    // Resultado completo
    return {
        faturamento,
        valorImpostoTotal,
        creditos,
        valorImpostoLiquido,
        valorImpostoSplit,
        valorImpostoNormal,
        recebimentoVista,
        recebimentoPrazo,
        percentualImplementacao,
        capitalGiroDisponivel,
        tempoMedioCapitalGiro,
        beneficioDiasCapitalGiro,
        fluxoCaixaLiquido: recebimentoVista + recebimentoPrazo,
        memoriaCritica: {
            tituloRegime: `Regime Split Payment (${ano})`,
            descricaoRegime: `No regime de Split Payment, ${(percentualImplementacao*100).toFixed(1)}% do tributo é retido no momento da transação.`,
            tituloCalculo: "Cálculo do Capital de Giro Disponível",
            formula: `Capital de Giro = Valor do Imposto Não-Split (${formatarMoeda(valorImpostoNormal)})`,
            observacoes: [
                `O valor do imposto não afetado pelo Split (${formatarMoeda(valorImpostoNormal)}) fica disponível para uso como capital de giro por aproximadamente ${tempoMedioCapitalGiro.toFixed(1)} dias.`,
                `O valor do imposto afetado pelo Split (${formatarMoeda(valorImpostoSplit)}) não fica disponível para uso como capital de giro.`,
                `O Split Payment reduz o benefício de capital de giro em ${(percentualImplementacao*100).toFixed(1)}%.`
            ]
        }
    };
}

/**
 * Calcula o impacto do Split Payment no capital de giro
 * 
 * @param {Object} dados - Dados da empresa e parâmetros de simulação
 * @param {number} ano - Ano de referência para percentual de implementação
 * @param {Object} parametrosSetoriais - Parâmetros específicos do setor (opcional)
 * @returns {Object} - Análise comparativa detalhada do impacto no capital de giro
 */
function calcularImpactoCapitalGiro(dados, ano = 2026, parametrosSetoriais = null) {
    // Calcular fluxo de caixa nos dois regimes
    const resultadoAtual = calcularFluxoCaixaAtual(dados);
    const resultadoSplitPayment = calcularFluxoCaixaSplitPayment(dados, ano, parametrosSetoriais);
    
    // Calcular diferenças
    const diferencaCapitalGiro = resultadoSplitPayment.capitalGiroDisponivel - resultadoAtual.capitalGiroDisponivel;
    const percentualImpacto = (diferencaCapitalGiro / resultadoAtual.capitalGiroDisponivel) * 100;
    
    // Calcular necessidade adicional de capital de giro (com margem de segurança)
    const necesidadeAdicionalCapitalGiro = Math.abs(diferencaCapitalGiro) * 1.2;
    
    // Impacto em dias de faturamento
    const impactoDiasFaturamento = resultadoAtual.beneficioDiasCapitalGiro - resultadoSplitPayment.beneficioDiasCapitalGiro;
    
    // Análise de sensibilidade: variação no impacto com diferentes percentuais de implementação
    const analiseSensibilidade = calcularAnaliseSensibilidade(dados, ano, parametrosSetoriais);
    
    // Calcular impacto na margem operacional
    const impactoMargem = calcularImpactoMargem(dados, diferencaCapitalGiro);
    
    // Resultado completo
    return {
        ano,
        resultadoAtual,
        resultadoSplitPayment,
        diferencaCapitalGiro,
        percentualImpacto,
        necesidadeAdicionalCapitalGiro,
        impactoDiasFaturamento,
        margemOperacionalOriginal: dados.margem,
        margemOperacionalAjustada: dados.margem - (impactoMargem.impactoPercentual / 100),
        impactoMargem: impactoMargem.impactoPercentual,
        analiseSensibilidade,
        memoriaCritica: {
            tituloPrincipal: `Análise de Impacto do Split Payment (${ano})`,
            descricaoImpacto: `O Split Payment reduz o capital de giro disponível em ${formatarMoeda(Math.abs(diferencaCapitalGiro))} (${Math.abs(percentualImpacto).toFixed(2)}%).`,
            tituloNecessidade: "Necessidade Adicional de Capital de Giro",
            formulaNecessidade: `Necessidade = |Diferença de Capital| × 1,2 (margem de segurança) = ${formatarMoeda(necesidadeAdicionalCapitalGiro)}`,
            tituloImpactoMargem: "Impacto na Margem Operacional",
            descricaoImpactoMargem: `A margem operacional é reduzida de ${(dados.margem*100).toFixed(2)}% para ${((dados.margem - impactoMargem.impactoPercentual/100)*100).toFixed(2)}% devido ao custo financeiro adicional.`,
            observacoes: [
                `O impacto representa ${impactoDiasFaturamento.toFixed(1)} dias de faturamento em capital de giro.`,
                `A necessidade adicional de capital de giro é de ${formatarMoeda(necesidadeAdicionalCapitalGiro)}.`,
                `Para cada 10% de implementação do Split Payment, o impacto no capital de giro é de aproximadamente ${formatarMoeda(analiseSensibilidade.impactoPor10Percent)}.`
            ]
        }
    };
}

/**
 * Calcula o impacto do Split Payment na margem operacional
 * 
 * @param {Object} dados - Dados da empresa e parâmetros de simulação
 * @param {number} diferencaCapitalGiro - Diferença no capital de giro
 * @returns {Object} - Análise detalhada do impacto na margem operacional
 */
function calcularImpactoMargem(dados, diferencaCapitalGiro) {
    // Extrair parâmetros relevantes
    const faturamento = dados.faturamento;
    const margem = dados.margem;
    const taxaCapitalGiro = dados.taxaCapitalGiro || 0.021; // 2,1% a.m. é o padrão
    
    // Cálculo do custo mensal do capital de giro adicional
    const custoMensalCapitalGiro = Math.abs(diferencaCapitalGiro) * taxaCapitalGiro;
    
    // Cálculo do custo anual
    const custoAnualCapitalGiro = custoMensalCapitalGiro * 12;
    
    // Cálculo do impacto percentual na margem
    const impactoPercentual = (custoMensalCapitalGiro / faturamento) * 100;
    
    // Cálculo da margem ajustada
    const margemAjustada = margem - (impactoPercentual / 100);
    
    // Percentual de redução da margem
    const percentualReducaoMargem = (impactoPercentual / (margem * 100)) * 100;
    
    // Resultado completo
    return {
        custoMensalCapitalGiro,
        custoAnualCapitalGiro,
        impactoPercentual,
        margemOriginal: margem,
        margemAjustada,
        percentualReducaoMargem,
        memoriaCritica: {
            tituloCalculo: "Cálculo do Impacto na Margem Operacional",
            descricaoImpacto: "A necessidade de obtenção de capital de giro adicional gera um custo financeiro que impacta diretamente a margem operacional da empresa.",
            formulaCusto: `Custo Mensal = |Diferença Capital de Giro| × Taxa do Capital de Giro = ${formatarMoeda(Math.abs(diferencaCapitalGiro))} × ${(taxaCapitalGiro*100).toFixed(1)}% = ${formatarMoeda(custoMensalCapitalGiro)}`,
            formulaImpacto: `Impacto na Margem (p.p.) = (Custo Mensal / Faturamento) × 100 = (${formatarMoeda(custoMensalCapitalGiro)} / ${formatarMoeda(faturamento)}) × 100 = ${impactoPercentual.toFixed(2)} p.p.`,
            observacoes: [
                `A margem operacional é reduzida de ${(margem*100).toFixed(2)}% para ${(margemAjustada*100).toFixed(2)}%.`,
                `Isso representa uma redução de ${percentualReducaoMargem.toFixed(2)}% na margem operacional original.`,
                `O custo anual estimado é de ${formatarMoeda(custoAnualCapitalGiro)}.`
            ]
        }
    };
}

/**
 * Calcula a necessidade adicional de capital em função do Split Payment
 * 
 * @param {Object} dados - Dados da empresa e parâmetros de simulação
 * @param {number} ano - Ano de referência para percentual de implementação
 * @param {Object} parametrosSetoriais - Parâmetros específicos do setor (opcional)
 * @returns {Object} - Análise detalhada da necessidade adicional de capital
 */
function calcularNecessidadeAdicionalCapital(dados, ano = 2026, parametrosSetoriais = null) {
    // Calcular impacto no capital de giro
    const impacto = calcularImpactoCapitalGiro(dados, ano, parametrosSetoriais);
    
    // Extrair dados relevantes
    const diferencaCapitalGiro = impacto.diferencaCapitalGiro;
    const necesidadeBasica = Math.abs(diferencaCapitalGiro);
    
    // Fatores de ajuste para cálculo da necessidade
    const fatorMargemSeguranca = 1.2; // 20% de margem de segurança
    const fatorSazonalidade = calcularFatorSazonalidade(dados);
    const fatorCrescimento = calcularFatorCrescimento(dados, ano);
    
    // Cálculo da necessidade com diferentes fatores
    const necessidadeComMargemSeguranca = necesidadeBasica * fatorMargemSeguranca;
    const necessidadeComSazonalidade = necesidadeBasica * fatorSazonalidade;
    const necessidadeComCrescimento = necesidadeBasica * fatorCrescimento;
    
    // Necessidade total considerando todos os fatores
    const necessidadeTotal = necesidadeBasica * fatorMargemSeguranca * fatorSazonalidade * fatorCrescimento;
    
    // Opções de captação
    const opcoesFinanciamento = calcularOpcoesFinanciamento(dados, necessidadeTotal);
    
    // Impacto no resultado considerando a opção mais econômica
    const impactoResultado = calcularImpactoResultado(dados, opcoesFinanciamento.opcaoRecomendada.custoAnual);
    
    // Resultado completo
    return {
        necesidadeBasica,
        fatorMargemSeguranca,
        fatorSazonalidade,
        fatorCrescimento,
        necessidadeComMargemSeguranca,
        necessidadeComSazonalidade,
        necessidadeComCrescimento,
        necessidadeTotal,
        opcoesFinanciamento,
        impactoResultado,
        memoriaCritica: {
            tituloCalculo: "Cálculo da Necessidade Adicional de Capital",
            formulaBase: `Necessidade Base = |Diferença Capital de Giro| = ${formatarMoeda(necesidadeBasica)}`,
            formulaTotal: `Necessidade Total = Necessidade Base × Fatores de Ajuste = ${formatarMoeda(necesidadeBasica)} × ${fatorMargemSeguranca.toFixed(2)} (segurança) × ${fatorSazonalidade.toFixed(2)} (sazonalidade) × ${fatorCrescimento.toFixed(2)} (crescimento) = ${formatarMoeda(necessidadeTotal)}`,
            tituloOpcoes: "Opções de Financiamento",
            descricaoRecomendada: `A opção recomendada é ${opcoesFinanciamento.opcaoRecomendada.tipo}, com custo anual de ${formatarMoeda(opcoesFinanciamento.opcaoRecomendada.custoAnual)}.`,
            tituloImpacto: "Impacto no Resultado",
            descricaoImpacto: `O custo de financiamento representará ${impactoResultado.percentualDaReceita.toFixed(2)}% da receita e ${impactoResultado.percentualDoLucro.toFixed(2)}% do lucro operacional.`,
            observacoes: [
                `Considerando a sazonalidade, a necessidade pode chegar a ${formatarMoeda(necessidadeComSazonalidade)}.`,
                `O crescimento projetado para ${ano} aumenta a necessidade para ${formatarMoeda(necessidadeComCrescimento)}.`,
                `A necessidade total, com todos os fatores, é de ${formatarMoeda(necessidadeTotal)}.`
            ]
        }
    };
}

/**
 * Simula o impacto do Split Payment ao longo do período de transição
 * 
 * @param {Object} dados - Dados da empresa e parâmetros de simulação
 * @param {number} anoInicial - Ano inicial da simulação (padrão: 2026)
 * @param {number} anoFinal - Ano final da simulação (padrão: 2033)
 * @param {string} cenarioTaxaCrescimento - Cenário de crescimento ('conservador', 'moderado', 'otimista', 'personalizado')
 * @param {number} taxaCrescimentoPersonalizada - Taxa de crescimento para cenário personalizado (decimal)
 * @param {Object} parametrosSetoriais - Parâmetros específicos do setor (opcional)
 * @returns {Object} - Projeção detalhada do impacto ao longo do tempo
 */
function calcularProjecaoTemporal(dados, anoInicial = 2026, anoFinal = 2033, cenarioTaxaCrescimento = 'moderado', taxaCrescimentoPersonalizada = null, parametrosSetoriais = null) {
    // Definir taxa de crescimento com base no cenário
    let taxaCrescimento = 0.05; // Padrão: moderado (5% a.a.)
    
    if (cenarioTaxaCrescimento === 'conservador') {
        taxaCrescimento = 0.02; // 2% a.a.
    } else if (cenarioTaxaCrescimento === 'otimista') {
        taxaCrescimento = 0.08; // 8% a.a.
    } else if (cenarioTaxaCrescimento === 'personalizado' && taxaCrescimentoPersonalizada !== null) {
        taxaCrescimento = taxaCrescimentoPersonalizada;
    }
    
    // Inicializar resultados
    const resultadosAnuais = {};
    const impactoAcumulado = {
        totalNecessidadeCapitalGiro: 0,
        custoFinanceiroTotal: 0,
        impactoMedioMargem: 0
    };
    
    let dadosAno = {...dados};
    let somaImpactoMargem = 0;
    
    // Simular cada ano
    for (let ano = anoInicial; ano <= anoFinal; ano++) {
        // Calcular impacto para o ano
        const impactoAno = calcularImpactoCapitalGiro(dadosAno, ano, parametrosSetoriais);
        
        // Adicionar ao acumulado
        resultadosAnuais[ano] = impactoAno;
        impactoAcumulado.totalNecessidadeCapitalGiro += impactoAno.necesidadeAdicionalCapitalGiro;
        impactoAcumulado.custoFinanceiroTotal += impactoAno.impactoMargem.custoAnualCapitalGiro;
        somaImpactoMargem += impactoAno.impactoMargem;
        
        // Atualizar faturamento para o próximo ano
        dadosAno = {
            ...dadosAno,
            faturamento: dadosAno.faturamento * (1 + taxaCrescimento)
        };
    }
    
    // Calcular impacto médio na margem
    const numAnos = anoFinal - anoInicial + 1;
    impactoAcumulado.impactoMedioMargem = somaImpactoMargem / numAnos;
    
    // Análise de elasticidade: impacto de diferentes taxas de crescimento
    const analiseElasticidade = calcularAnaliseElasticidade(dados, anoInicial, anoFinal, parametrosSetoriais);
    
    // Resultado completo
    return {
        parametros: {
            anoInicial,
            anoFinal,
            cenarioTaxaCrescimento,
            taxaCrescimento
        },
        resultadosAnuais,
        impactoAcumulado,
        analiseElasticidade,
        memoriaCritica: {
            tituloProjecao: `Projeção Temporal (${anoInicial}-${anoFinal})`,
            descricaoCenario: `Cenário de crescimento: ${cenarioTaxaCrescimento} (${(taxaCrescimento*100).toFixed(1)}% a.a.)`,
            tituloImpactoAcumulado: "Impacto Acumulado",
            descricaoImpactoAcumulado: `O impacto acumulado ao longo do período é de ${formatarMoeda(impactoAcumulado.totalNecessidadeCapitalGiro)} em necessidade de capital de giro.`,
            tituloCustoFinanceiro: "Custo Financeiro Total",
            descricaoCustoFinanceiro: `O custo financeiro total estimado é de ${formatarMoeda(impactoAcumulado.custoFinanceiroTotal)}.`,
            tituloImpactoMargem: "Impacto Médio na Margem",
            descricaoImpactoMargem: `O impacto médio na margem operacional é de ${impactoAcumulado.impactoMedioMargem.toFixed(2)} pontos percentuais.`,
            observacoes: [
                `A necessidade de capital de giro aumenta ao longo do tempo devido à combinação do aumento do percentual de implementação do Split Payment e do crescimento do faturamento.`,
                `O impacto é mais significativo nos anos finais da transição (2031-2033).`,
                `O custo financeiro representa ${((impactoAcumulado.custoFinanceiroTotal / (dados.faturamento * numAnos * (1 + taxaCrescimento/2))) * 100).toFixed(2)}% do faturamento acumulado no período.`
            ]
        }
    };
}

/**
 * Calcula o impacto do Split Payment no ciclo financeiro da empresa
 * 
 * @param {Object} dados - Dados da empresa e parâmetros de simulação
 * @param {number} ano - Ano de referência para percentual de implementação
 * @param {Object} parametrosSetoriais - Parâmetros específicos do setor (opcional)
 * @returns {Object} - Análise detalhada do impacto no ciclo financeiro
 */
function calcularImpactoCicloFinanceiro(dados, ano = 2026, parametrosSetoriais = null) {
    // Extrair parâmetros relevantes
    const pmr = dados.pmr;
    const pmp = dados.pmp;
    const pme = dados.pme;
    const faturamento = dados.faturamento;
    const aliquota = dados.aliquota;
    
    // Cálculo do ciclo financeiro atual
    const cicloFinanceiroAtual = pmr + pme - pmp;
    
    // Obter percentual de implementação para o ano específico
    const percentualImplementacao = obterPercentualImplementacao(ano, parametrosSetoriais);
    
    // Cálculo do impacto do Split Payment
    const valorImpostoTotal = faturamento * aliquota;
    const impostoSplit = valorImpostoTotal * percentualImplementacao;
    
    // Impacto em dias de PMR (considerando a retenção no momento do recebimento)
    const impactoPMR = (impostoSplit / faturamento) * pmr;
    
    // Ciclo financeiro ajustado
    const cicloFinanceiroAjustado = cicloFinanceiroAtual - impactoPMR;
    
    // Necessidade de capital de giro antes e depois
    const ncgAtual = (faturamento / 30) * cicloFinanceiroAtual;
    const ncgAjustada = (faturamento / 30) * cicloFinanceiroAjustado;
    
    // Diferença na necessidade de capital de giro
    const diferencaNCG = ncgAjustada - ncgAtual;
    
    // Resultado completo
    return {
        cicloFinanceiroAtual,
        cicloFinanceiroAjustado,
        impactoPMR,
        percentualImplementacao,
        ncgAtual,
        ncgAjustada,
        diferencaNCG,
        memoriaCritica: {
            tituloCalculo: "Cálculo do Impacto no Ciclo Financeiro",
            formulaCicloAtual: `Ciclo Financeiro Atual = PMR + PME - PMP = ${pmr} + ${pme} - ${pmp} = ${cicloFinanceiroAtual} dias`,
            formulaImpactoPMR: `Impacto no PMR = (Imposto Split / Faturamento) × PMR = (${formatarMoeda(impostoSplit)} / ${formatarMoeda(faturamento)}) × ${pmr} = ${impactoPMR.toFixed(2)} dias`,
            formulaCicloAjustado: `Ciclo Financeiro Ajustado = Ciclo Atual - Impacto PMR = ${cicloFinanceiroAtual} - ${impactoPMR.toFixed(2)} = ${cicloFinanceiroAjustado.toFixed(2)} dias`,
            tituloImpactoNCG: "Impacto na Necessidade de Capital de Giro (NCG)",
            formulaNCGAtual: `NCG Atual = (Faturamento / 30) × Ciclo Atual = (${formatarMoeda(faturamento)} / 30) × ${cicloFinanceiroAtual} = ${formatarMoeda(ncgAtual)}`,
            formulaNCGAjustada: `NCG Ajustada = (Faturamento / 30) × Ciclo Ajustado = (${formatarMoeda(faturamento)} / 30) × ${cicloFinanceiroAjustado.toFixed(2)} = ${formatarMoeda(ncgAjustada)}`,
            observacoes: [
                `O Split Payment reduz o ciclo financeiro em ${impactoPMR.toFixed(2)} dias.`,
                `A necessidade de capital de giro é reduzida em ${formatarMoeda(Math.abs(diferencaNCG))}.`,
                `No entanto, essa redução é compensada pela necessidade adicional de capital para cobrir o valor dos impostos retidos imediatamente.`
            ]
        }
    };
}

/**
 * Calcula a efetividade de estratégias de mitigação do impacto do Split Payment
 * 
 * @param {Object} dados - Dados da empresa e parâmetros de simulação
 * @param {Object} estrategias - Configuração das estratégias de mitigação
 * @param {number} ano - Ano de referência para percentual de implementação
 * @param {Object} parametrosSetoriais - Parâmetros específicos do setor (opcional)
 * @returns {Object} - Análise detalhada da efetividade das estratégias
 */
function calcularEfeitividadeMitigacao(dados, estrategias, ano = 2026, parametrosSetoriais = null) {
    // Calcular impacto base sem mitigação
    const impactoBase = calcularImpactoCapitalGiro(dados, ano, parametrosSetoriais);
    
    // Inicializar resultados por estratégia
    const resultadosEstrategias = {
        ajustePrecos: estrategias.ajustePrecos.ativar ? calcularEfeitividadeAjustePrecos(dados, estrategias.ajustePrecos, impactoBase) : null,
        renegociacaoPrazos: estrategias.renegociacaoPrazos.ativar ? calcularEfeitividadeRenegociacaoPrazos(dados, estrategias.renegociacaoPrazos, impactoBase) : null,
        antecipacaoRecebiveis: estrategias.antecipacaoRecebiveis.ativar ? calcularEfeitividadeAntecipacaoRecebiveis(dados, estrategias.antecipacaoRecebiveis, impactoBase) : null,
        capitalGiro: estrategias.capitalGiro.ativar ? calcularEfeitividadeCapitalGiro(dados, estrategias.capitalGiro, impactoBase) : null,
        mixProdutos: estrategias.mixProdutos.ativar ? calcularEfeitividadeMixProdutos(dados, estrategias.mixProdutos, impactoBase) : null,
        meiosPagamento: estrategias.meiosPagamento.ativar ? calcularEfeitividadeMeiosPagamento(dados, estrategias.meiosPagamento, impactoBase) : null
    };
    
    // Calcular efetividade combinada
    const efeitividadeCombinada = calcularEfeitividadeCombinada(dados, estrategias, resultadosEstrategias, impactoBase);
    
    // Ordenar estratégias por efetividade
    const estrategiasOrdenadas = Object.entries(resultadosEstrategias)
        .filter(([_, resultado]) => resultado !== null)
        .sort((a, b) => b[1].efetividadePercentual - a[1].efetividadePercentual);
    
    // Identificar estratégia mais efetiva
    const estrategiaMaisEfetiva = estrategiasOrdenadas.length > 0 ? estrategiasOrdenadas[0] : null;
    
    // Identificar combinação ótima
    const combinacaoOtima = identificarCombinacaoOtima(dados, estrategias, resultadosEstrategias, impactoBase);
    
    // Resultado completo
    return {
        impactoBase,
        resultadosEstrategias,
        efeitividadeCombinada,
        estrategiasOrdenadas,
        estrategiaMaisEfetiva,
        combinacaoOtima,
        memoriaCritica: {
            tituloAnalise: "Análise de Efetividade das Estratégias de Mitigação",
            descricaoImpactoBase: `O impacto base do Split Payment é uma redução de ${formatarMoeda(Math.abs(impactoBase.diferencaCapitalGiro))} no capital de giro.`,
            tituloEfetividadeCombinada: "Efetividade Combinada das Estratégias",
            descricaoEfetividadeCombinada: `A aplicação combinada das estratégias selecionadas mitiga ${efeitividadeCombinada.efetividadePercentual.toFixed(2)}% do impacto.`,
            tituloEstrategiaMaisEfetiva: "Estratégia Mais Efetiva",
            descricaoEstrategiaMaisEfetiva: estrategiaMaisEfetiva ? 
                `A estratégia mais efetiva é ${traduzirNomeEstrategia(estrategiaMaisEfetiva[0])}, com efetividade de ${estrategiaMaisEfetiva[1].efetividadePercentual.toFixed(2)}%.` : 
                "Nenhuma estratégia foi selecionada.",
            tituloCombinacaoOtima: "Combinação Ótima de Estratégias",
            descricaoCombinacaoOtima: `A combinação ótima de estratégias mitiga ${combinacaoOtima.efetividadePercentual.toFixed(2)}% do impacto, com custo total de ${formatarMoeda(combinacaoOtima.custoTotal)}.`,
            observacoes: [
                `As estratégias combinadas têm um custo total de ${formatarMoeda(efeitividadeCombinada.custoTotal)}.`,
                `A relação custo-benefício das estratégias combinadas é de ${(efeitividadeCombinada.custoBeneficio).toFixed(2)} (quanto menor, melhor).`,
                `A melhor estratégia individual é ${estrategiaMaisEfetiva ? traduzirNomeEstrategia(estrategiaMaisEfetiva[0]) : "nenhuma"}.`
            ]
        }
    };
}

/**
 * Obtém o percentual de implementação do Split Payment para um determinado ano
 * 
 * @param {number} ano - Ano para obter o percentual
 * @param {Object} parametrosSetoriais - Parâmetros específicos do setor (opcional)
 * @returns {number} - Percentual de implementação (decimal)
 */
function obterPercentualImplementacao(ano, parametrosSetoriais = null) {
    // Cronograma padrão de implementação
    const cronogramaPadrao = {
        2026: 0.10,
        2027: 0.25,
        2028: 0.40,
        2029: 0.55,
        2030: 0.70,
        2031: 0.85,
        2032: 0.95,
        2033: 1.00
    };
    
    // Se houver parâmetros setoriais com cronograma próprio, utilizar
    if (parametrosSetoriais && parametrosSetoriais.cronogramaProprio && parametrosSetoriais.cronograma && parametrosSetoriais.cronograma[ano]) {
        return parametrosSetoriais.cronograma[ano];
    }
    
    // Caso contrário, utilizar o cronograma padrão
    return cronogramaPadrao[ano] || 0;
}

/**
 * Calcula o tempo médio do capital em giro
 * 
 * @param {number} pmr - Prazo Médio de Recebimento
 * @param {number} prazoRecolhimento - Prazo para recolhimento do imposto
 * @param {number} percVista - Percentual de vendas à vista
 * @param {number} percPrazo - Percentual de vendas a prazo
 * @returns {number} - Tempo médio em dias
 */
function calcularTempoMedioCapitalGiro(pmr, prazoRecolhimento, percVista, percPrazo) {
    // Para vendas à vista: tempo = prazo recolhimento
    // Para vendas a prazo: tempo = prazo recolhimento - pmr (se pmr < prazo recolhimento)
    // Para vendas a prazo: tempo = 0 (se pmr >= prazo recolhimento)
    
    const tempoVista = prazoRecolhimento;
    const tempoPrazo = Math.max(0, prazoRecolhimento - pmr);
    
    // Tempo médio ponderado
    return (percVista * tempoVista) + (percPrazo * tempoPrazo);
}

/**
 * Calcula a análise de sensibilidade do impacto em função do percentual de implementação
 * 
 * @param {Object} dados - Dados da empresa e parâmetros de simulação
 * @param {number} ano - Ano de referência
 * @param {Object} parametrosSetoriais - Parâmetros específicos do setor (opcional)
 * @returns {Object} - Análise de sensibilidade
 */
function calcularAnaliseSensibilidade(dados, ano, parametrosSetoriais = null) {
    // Obter parâmetros originais
    const percentualOriginal = obterPercentualImplementacao(ano, parametrosSetoriais);
    
    // Criar dados com diferentes percentuais
    const percentuais = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];
    const resultados = {};
    
    // Calcular impacto para cada percentual
    percentuais.forEach(percentual => {
        // Simular implementação modificada
        const parametrosModificados = parametrosSetoriais ? 
            {...parametrosSetoriais, cronogramaProprio: true, cronograma: {...parametrosSetoriais.cronograma, [ano]: percentual}} : 
            {cronogramaProprio: true, cronograma: {[ano]: percentual}};
            
        // Calcular impacto
        const impacto = calcularImpactoCapitalGiro(dados, ano, parametrosModificados);
        
        // Armazenar resultado
        resultados[percentual] = impacto.diferencaCapitalGiro;
    });
    
    // Calcular impacto médio por ponto percentual
    const impactoPorPercentual = Math.abs(resultados[1.0] / 100);
    
    // Calcular impacto por incremento de 10%
    const impactoPor10Percent = impactoPorPercentual * 10;
    
    return {
        percentuais,
        resultados,
        percentualOriginal,
        impactoPorPercentual,
        impactoPor10Percent
    };
}

/**
 * Calcula o fator de sazonalidade para ajuste da necessidade de capital
 * 
 * @param {Object} dados - Dados da empresa e parâmetros de simulação
 * @returns {number} - Fator de sazonalidade
 */
function calcularFatorSazonalidade(dados) {
    // Implementação básica: fator padrão de 1.3 (30% de aumento)
    // Em uma implementação real, este cálculo seria baseado em dados históricos
    // de sazonalidade específicos da empresa ou do setor
    return 1.3;
}

/**
 * Calcula o fator de crescimento para ajuste da necessidade de capital
 * 
 * @param {Object} dados - Dados da empresa e parâmetros de simulação
 * @param {number} ano - Ano de referência
 * @returns {number} - Fator de crescimento
 */
function calcularFatorCrescimento(dados, ano) {
    // Definir taxa de crescimento com base no cenário
    let taxaCrescimento = 0.05; // Padrão: moderado (5% a.a.)
    
    if (dados.cenario === 'conservador') {
        taxaCrescimento = 0.02; // 2% a.a.
    } else if (dados.cenario === 'otimista') {
        taxaCrescimento = 0.08; // 8% a.a.
    } else if (dados.cenario === 'personalizado' && dados.taxaCrescimento !== null) {
        taxaCrescimento = dados.taxaCrescimento;
    }
    
    // Calcular fator para o ano de referência
    // Considerando crescimento proporcional ao avanço da implementação
    const anoInicial = 2026;
    const anosDecorridos = ano - anoInicial;
    
    // Crescimento composto para o número de anos
    return Math.pow(1 + taxaCrescimento, anosDecorridos);
}

/**
 * Calcula as opções de financiamento para a necessidade de capital
 * 
 * @param {Object} dados - Dados da empresa e parâmetros de simulação
 * @param {number} valorNecessidade - Valor da necessidade de capital
 * @returns {Object} - Opções de financiamento
 */
function calcularOpcoesFinanciamento(dados, valorNecessidade) {
    // Definir opções de financiamento disponíveis
    const opcoes = [
        {
            tipo: "Capital de Giro",
            taxaMensal: dados.taxaCapitalGiro || 0.021,
            prazo: 12,
            carencia: 3,
            valorMaximo: valorNecessidade * 1.5
        },
        {
            tipo: "Antecipação de Recebíveis",
            taxaMensal: dados.taxaAntecipacao || 0.018,
            prazo: 6,
            carencia: 0,
            valorMaximo: dados.faturamento * dados.percPrazo * 3
        },
        {
            tipo: "Empréstimo Bancário",
            taxaMensal: (dados.taxaCapitalGiro || 0.021) + (dados.spreadBancario || 0.005),
            prazo: 24,
            carencia: 6,
            valorMaximo: valorNecessidade * 2
        }
    ];
    
    // Calcular custo para cada opção
    opcoes.forEach(opcao => {
        // Verificar limite de valor
        opcao.valorAprovado = Math.min(valorNecessidade, opcao.valorMaximo);
        
        // Calcular custo mensal
        opcao.custoMensal = opcao.valorAprovado * opcao.taxaMensal;
        
        // Calcular custo total (considerando carência)
        opcao.custoTotal = opcao.custoMensal * (opcao.prazo - opcao.carencia);
        
        // Calcular custo anual
        opcao.custoAnual = opcao.custoMensal * 12;
        
        // Calcular taxa efetiva anual
        opcao.taxaEfetivaAnual = Math.pow(1 + opcao.taxaMensal, 12) - 1;
        
        // Calcular parcela
        opcao.valorParcela = opcao.valorAprovado / opcao.prazo + opcao.custoMensal;
    });
    
    // Ordenar opções por custo total
    opcoes.sort((a, b) => a.custoTotal - b.custoTotal);
    
    // Identificar opção recomendada (menor custo)
    const opcaoRecomendada = opcoes[0];
    
    return {
        opcoes,
        opcaoRecomendada
    };
}

/**
 * Calcula o impacto no resultado de um custo financeiro
 * 
 * @param {Object} dados - Dados da empresa e parâmetros de simulação
 * @param {number} custoAnual - Custo financeiro anual
 * @returns {Object} - Análise de impacto no resultado
 */
function calcularImpactoResultado(dados, custoAnual) {
    // Calcular faturamento anual
    const faturamentoAnual = dados.faturamento * 12;
    
    // Calcular lucro operacional anual
    const lucroOperacionalAnual = faturamentoAnual * dados.margem;
    
    // Calcular percentuais
    const percentualDaReceita = (custoAnual / faturamentoAnual) * 100;
    const percentualDoLucro = (custoAnual / lucroOperacionalAnual) * 100;
    
    // Calcular resultado ajustado
    const resultadoAjustado = lucroOperacionalAnual - custoAnual;
    const margemAjustada = resultadoAjustado / faturamentoAnual;
    
    return {
        faturamentoAnual,
        lucroOperacionalAnual,
        custoAnual,
        percentualDaReceita,
        percentualDoLucro,
        resultadoAjustado,
        margemAjustada
    };
}

/**
 * Calcula a análise de elasticidade para diferentes cenários de crescimento
 * 
 * @param {Object} dados - Dados da empresa e parâmetros de simulação
 * @param {number} anoInicial - Ano inicial da simulação
 * @param {number} anoFinal - Ano final da simulação
 * @param {Object} parametrosSetoriais - Parâmetros específicos do setor (opcional)
 * @returns {Object} - Análise de elasticidade
 */
function calcularAnaliseElasticidade(dados, anoInicial, anoFinal, parametrosSetoriais = null) {
    // Definir cenários de taxa de crescimento
    const cenarios = [
        { nome: "Recessão", taxa: -0.02 },
        { nome: "Estagnação", taxa: 0.00 },
        { nome: "Conservador", taxa: 0.02 },
        { nome: "Moderado", taxa: 0.05 },
        { nome: "Otimista", taxa: 0.08 },
        { nome: "Acelerado", taxa: 0.12 }
    ];
    
    // Calcular projeção para cada cenário
    const resultados = {};
    
    cenarios.forEach(cenario => {
        // Simular projeção com esta taxa
        const projecao = calcularProjecaoTemporal(
            dados, 
            anoInicial, 
            anoFinal, 
            'personalizado', 
            cenario.taxa, 
            parametrosSetoriais
        );
        
        // Armazenar resultado
        resultados[cenario.nome] = {
            taxa: cenario.taxa,
            impactoAcumulado: projecao.impactoAcumulado.totalNecessidadeCapitalGiro,
            custoFinanceiroTotal: projecao.impactoAcumulado.custoFinanceiroTotal,
            impactoMedioMargem: projecao.impactoAcumulado.impactoMedioMargem
        };
    });
    
    // Calcular elasticidade (variação percentual do impacto / variação percentual da taxa)
    const elasticidades = {};
    
    // Usar o cenário "Moderado" como referência
    const referenciaImpacto = resultados["Moderado"].impactoAcumulado;
    const referenciaTaxa = resultados["Moderado"].taxa;
    
    cenarios.forEach(cenario => {
        if (cenario.nome !== "Moderado") {
            const variacaoImpacto = (resultados[cenario.nome].impactoAcumulado - referenciaImpacto) / referenciaImpacto;
            const variacaoTaxa = (cenario.taxa - referenciaTaxa) / referenciaTaxa;
            
            // Evitar divisão por zero
            elasticidades[cenario.nome] = variacaoTaxa !== 0 ? variacaoImpacto / variacaoTaxa : 0;
        }
    });
    
    return {
        cenarios,
        resultados,
        elasticidades
    };
}

/**
 * Calcula a efetividade do ajuste de preços
 * 
 * @param {Object} dados - Dados da empresa e parâmetros de simulação
 * @param {Object} estrategia - Configuração da estratégia
 * @param {Object} impactoBase - Impacto base do Split Payment
 * @returns {Object} - Análise de efetividade
 */
function calcularEfeitividadeAjustePrecos(dados, estrategia, impactoBase) {
    // Extrair parâmetros
    const percentualAumento = estrategia.percentualAumento / 100;
    const elasticidade = estrategia.elasticidade;
    const impactoVendas = percentualAumento * elasticidade;
    const periodoAjuste = estrategia.periodoAjuste;
    
    // Calcular faturamento ajustado
    const faturamentoAjustado = dados.faturamento * (1 + percentualAumento) * (1 + impactoVendas);
    
    // Calcular fluxo de caixa adicional por mês
    const fluxoCaixaAdicional = (faturamentoAjustado - dados.faturamento) * dados.margem;
    
    // Calcular mitigação mensal
    const mitigacaoMensal = fluxoCaixaAdicional;
    
    // Mitigação total considerando o período
    const mitigacaoTotal = mitigacaoMensal * periodoAjuste;
    
    // Cálculo de efetividade
    const necessidadeCapitalGiro = Math.abs(impactoBase.diferencaCapitalGiro);
    const efetividadePercentual = (mitigacaoTotal / necessidadeCapitalGiro) * 100;
    
    // Custo da estratégia (perda de receita devido à elasticidade)
    const perdaReceita = Math.max(0, dados.faturamento * Math.abs(impactoVendas));
    const custoEstrategia = perdaReceita * periodoAjuste;
    
    // Relação custo-benefício
    const custoBeneficio = custoEstrategia > 0 ? custoEstrategia / mitigacaoTotal : 0;
    
    return {
        faturamentoOriginal: dados.faturamento,
        faturamentoAjustado,
        percentualAumento,
        elasticidade,
        impactoVendas,
        fluxoCaixaAdicional,
        mitigacaoMensal,
        mitigacaoTotal,
        efetividadePercentual,
        custoEstrategia,
        custoBeneficio,
        periodoAjuste
    };
}

/**
 * Calcula a efetividade da renegociação de prazos
 * @param {Object} dados - Dados da empresa e parâmetros de simulação
 * @param {Object} estrategia - Configuração da estratégia
 * @param {Object} impactoBase - Impacto base do Split Payment
 * @returns {Object} - Análise de efetividade
 */
function calcularEfeitividadeRenegociacaoPrazos(dados, estrategia, impactoBase) {
    // Extrair parâmetros
    const aumentoPrazo = estrategia.aumentoPrazo;
    const percentualFornecedores = estrategia.percentualFornecedores / 100;
    const custoContrapartida = estrategia.custoContrapartida / 100;
    
    // Estimar pagamentos mensais a fornecedores (aproximado como % do faturamento)
    const estimativaCustosFornecedores = dados.faturamento * (1 - dados.margem) * 0.7; // 70% dos custos
    
    // Calcular benefício do aumento de prazo
    const valorAfetado = estimativaCustosFornecedores * percentualFornecedores;
    const beneficioDiario = valorAfetado / 30; // Valor diário
    const beneficioTotal = beneficioDiario * aumentoPrazo;
    
    // Calcular custo da contrapartida
    const custoContrapartidaTotal = valorAfetado * custoContrapartida;
    
    // Calcular mitigação líquida
    const mitigacaoLiquida = beneficioTotal - custoContrapartidaTotal;
    
    // Calcular efetividade percentual em relação ao impacto base
    const necessidadeCapitalGiro = Math.abs(impactoBase.diferencaCapitalGiro);
    const efetividadePercentual = (mitigacaoLiquida / necessidadeCapitalGiro) * 100;
    
    // Impacto no ciclo financeiro
    const impactoPMP = aumentoPrazo * percentualFornecedores;
    const novoImpactoCiclo = dados.pmr + dados.pme - (dados.pmp + impactoPMP);
    
    return {
        valorAfetado,
        beneficioDiario,
        beneficioTotal,
        custoContrapartidaTotal,
        mitigacaoLiquida,
        efetividadePercentual,
        impactoPMP,
        novoImpactoCiclo,
        custoEstrategia: custoContrapartidaTotal,
        custoBeneficio: custoContrapartidaTotal > 0 ? custoContrapartidaTotal / beneficioTotal : 0
    };
}

/**
 * Calcula a efetividade da antecipação de recebíveis
 * @param {Object} dados - Dados da empresa e parâmetros de simulação
 * @param {Object} estrategia - Configuração da estratégia
 * @param {Object} impactoBase - Impacto base do Split Payment
 * @returns {Object} - Análise de efetividade
 */
function calcularEfeitividadeAntecipacaoRecebiveis(dados, estrategia, impactoBase) {
    // Extrair parâmetros
    const percentualAntecipacao = estrategia.percentualAntecipacao / 100;
    const taxaDesconto = estrategia.taxaDesconto;
    const prazoAntecipacao = estrategia.prazoAntecipacao;
    
    // Calcular valores a prazo afetados
    const vendasPrazo = dados.faturamento * dados.percPrazo;
    const valorAntecipado = vendasPrazo * percentualAntecipacao;
    
    // Calcular custo da antecipação
    const taxaDiaria = taxaDesconto / 30;
    const custoAntecipacao = valorAntecipado * taxaDiaria * prazoAntecipacao;
    
    // Calcular benefício (capital disponível antecipadamente)
    const beneficioAntecipacao = valorAntecipado;
    
    // Calcular mitigação líquida
    const mitigacaoLiquida = beneficioAntecipacao - custoAntecipacao;
    
    // Calcular efetividade percentual em relação ao impacto base
    const necessidadeCapitalGiro = Math.abs(impactoBase.diferencaCapitalGiro);
    const efetividadePercentual = (mitigacaoLiquida / necessidadeCapitalGiro) * 100;
    
    // Impacto no PMR
    const reducaoPMR = dados.pmr * (valorAntecipado / vendasPrazo) * (prazoAntecipacao / dados.pmr);
    const novoPMR = dados.pmr - reducaoPMR;
    
    return {
        vendasPrazo,
        valorAntecipado,
        custoAntecipacao,
        beneficioAntecipacao,
        mitigacaoLiquida,
        efetividadePercentual,
        reducaoPMR,
        novoPMR,
        custoEstrategia: custoAntecipacao,
        custoBeneficio: custoAntecipacao / beneficioAntecipacao
    };
}

/**
 * Calcula a efetividade da captação de capital de giro
 * @param {Object} dados - Dados da empresa e parâmetros de simulação
 * @param {Object} estrategia - Configuração da estratégia
 * @param {Object} impactoBase - Impacto base do Split Payment
 * @returns {Object} - Análise de efetividade
 */
function calcularEfeitividadeCapitalGiro(dados, estrategia, impactoBase) {
    // Extrair parâmetros
    const valorCaptacao = estrategia.valorCaptacao / 100; // Percentual da necessidade
    const taxaJuros = estrategia.taxaJuros; // Taxa mensal
    const prazoPagamento = estrategia.prazoPagamento; // Em meses
    const carencia = estrategia.carencia || 0; // Período de carência em meses
    
    // Calcular valor a ser captado
    const necessidadeCapitalGiro = Math.abs(impactoBase.diferencaCapitalGiro);
    const valorCaptado = necessidadeCapitalGiro * valorCaptacao;
    
    // Calcular custo financeiro
    // Durante a carência, juros são capitalizados
    const juroDuranteCarencia = valorCaptado * (Math.pow(1 + taxaJuros, carencia) - 1);
    
    // Valor da dívida após a carência
    const valorAposCarencia = valorCaptado + juroDuranteCarencia;
    
    // Cálculo da parcela usando fórmula de financiamento
    const parcela = valorAposCarencia * (taxaJuros * Math.pow(1 + taxaJuros, prazoPagamento - carencia)) 
                   / (Math.pow(1 + taxaJuros, prazoPagamento - carencia) - 1);
    
    // Custo total do financiamento
    const custoTotal = (parcela * (prazoPagamento - carencia)) - valorCaptado;
    
    // Custo mensal médio
    const custoMensalMedio = custoTotal / prazoPagamento;
    
    // Benefício imediato (capital disponível)
    const beneficioImediato = valorCaptado;
    
    // Efetividade (mitigação percentual do impacto)
    const efetividadePercentual = (beneficioImediato / necessidadeCapitalGiro) * 100;
    
    // Impacto no resultado (custo financeiro como percentual do faturamento)
    const impactoFaturamento = (custoMensalMedio / dados.faturamento) * 100;
    
    return {
        valorCaptado,
        juroDuranteCarencia,
        valorAposCarencia,
        parcela,
        custoTotal,
        custoMensalMedio,
        beneficioImediato,
        efetividadePercentual,
        impactoFaturamento,
        custoEstrategia: custoTotal,
        custoBeneficio: custoTotal / beneficioImediato,
        paybackPeriodo: valorCaptado / parcela // Meses para payback do principal
    };
}

/**
 * Calcula a efetividade do ajuste no mix de produtos
 * @param {Object} dados - Dados da empresa e parâmetros de simulação
 * @param {Object} estrategia - Configuração da estratégia
 * @param {Object} impactoBase - Impacto base do Split Payment
 * @returns {Object} - Análise de efetividade
 */
function calcularEfeitividadeMixProdutos(dados, estrategia, impactoBase) {
    // Extrair parâmetros
    const percentualAjuste = estrategia.percentualAjuste / 100; // Percentual do portfólio ajustado
    const focoAjuste = estrategia.focoAjuste; // 'ciclo', 'margem' ou 'vista'
    const impactoReceita = estrategia.impactoReceita / 100; // Impacto na receita (pode ser negativo)
    const impactoMargem = estrategia.impactoMargem / 100; // Impacto na margem em pontos percentuais
    
    // Calcular impacto na receita
    const perdaReceita = dados.faturamento * percentualAjuste * impactoReceita;
    const novoFaturamento = dados.faturamento * (1 + (percentualAjuste * impactoReceita));
    
    // Calcular impacto na margem
    const margemAtual = dados.margem;
    const margemAjustada = margemAtual + (percentualAjuste * impactoMargem);
    const incrementoResultado = novoFaturamento * margemAjustada - dados.faturamento * margemAtual;
    
    // Calcular impacto no ciclo financeiro (depende do foco)
    let reducaoCiclo = 0;
    
    switch(focoAjuste) {
        case 'ciclo': 
            // Redução direta no ciclo (estimativa)
            reducaoCiclo = dados.pmr * percentualAjuste * 0.3; // Redução de 30% do PMR na porção afetada
            break;
        case 'margem':
            // Foco na margem tem impacto menor no ciclo
            reducaoCiclo = dados.pmr * percentualAjuste * 0.1; // Redução de 10% do PMR na porção afetada
            break;
        case 'vista':
            // Aumento de vendas à vista
            const aumentoVista = percentualAjuste * 0.5; // 50% do ajuste vai para aumento de vendas à vista
            const novoPercVista = Math.min(1, dados.percVista + (dados.percPrazo * aumentoVista));
            const novoPercPrazo = 1 - novoPercVista;
            
            // Recalcular PMR considerando novas proporções
            const pmrAtual = dados.pmr;
            const novoPmr = pmrAtual * (novoPercPrazo / dados.percPrazo);
            reducaoCiclo = pmrAtual - novoPmr;
            break;
    }
    
    // Estimar o novo ciclo financeiro
    const cicloAtual = dados.pmr + dados.pme - dados.pmp;
    const novoCiclo = cicloAtual - reducaoCiclo;
    
    // Calcular mitigação no capital de giro
    const faturamentoDiario = novoFaturamento / 30;
    const reducaoNCG = faturamentoDiario * reducaoCiclo;
    
    // Calcular efetividade
    const necessidadeCapitalGiro = Math.abs(impactoBase.diferencaCapitalGiro);
    const efetividadePercentual = (reducaoNCG / necessidadeCapitalGiro) * 100;
    
    // Custo da estratégia (possível perda de receita)
    const custoEstrategia = perdaReceita > 0 ? perdaReceita * margemAtual : 0;
    
    return {
        percentualAjuste,
        focoAjuste,
        perdaReceita,
        novoFaturamento,
        margemAtual,
        margemAjustada,
        incrementoResultado,
        reducaoCiclo,
        cicloAtual,
        novoCiclo,
        reducaoNCG,
        efetividadePercentual,
        custoEstrategia,
        custoBeneficio: custoEstrategia > 0 ? custoEstrategia / reducaoNCG : 0
    };
}

/**
 * Calcula a efetividade da mudança nos meios de pagamento
 * @param {Object} dados - Dados da empresa e parâmetros de simulação
 * @param {Object} estrategia - Configuração da estratégia
 * @param {Object} impactoBase - Impacto base do Split Payment
 * @returns {Object} - Análise de efetividade
 */
function calcularEfeitividadeMeiosPagamento(dados, estrategia, impactoBase) {
    // Extrair parâmetros
    const distribuicaoAtual = {
        vista: estrategia.distribuicaoAtual.vista / 100,
        prazo: estrategia.distribuicaoAtual.prazo / 100
    };
    
    const distribuicaoNova = {
        vista: estrategia.distribuicaoNova.vista / 100,
        dias30: estrategia.distribuicaoNova.dias30 / 100,
        dias60: estrategia.distribuicaoNova.dias60 / 100,
        dias90: estrategia.distribuicaoNova.dias90 / 100
    };
    
    const taxaIncentivo = estrategia.taxaIncentivo / 100; // Incentivo para pagamentos à vista
    
    // Calcular PMR atual (média ponderada)
    const pmrAtual = dados.pmr;
    
    // Calcular novo PMR (média ponderada)
    const novoPmr = 
        0 * distribuicaoNova.vista +
        30 * distribuicaoNova.dias30 +
        60 * distribuicaoNova.dias60 + 
        90 * distribuicaoNova.dias90;
    
    // Redução em dias no PMR
    const reducaoPmr = pmrAtual - novoPmr;
    
    // Impacto no ciclo financeiro
    const cicloAtual = dados.pmr + dados.pme - dados.pmp;
    const novoCiclo = novoPmr + dados.pme - dados.pmp;
    const reducaoCiclo = cicloAtual - novoCiclo;
    
    // Calcular custo do incentivo à vista
    const aumentoVista = distribuicaoNova.vista - distribuicaoAtual.vista;
    const custoIncentivo = dados.faturamento * aumentoVista * taxaIncentivo;
    
    // Calcular redução na NCG
    const faturamentoDiario = dados.faturamento / 30;
    const reducaoNCG = faturamentoDiario * reducaoCiclo;
    
    // Calcular efetividade
    const necessidadeCapitalGiro = Math.abs(impactoBase.diferencaCapitalGiro);
    const efetividadePercentual = (reducaoNCG / necessidadeCapitalGiro) * 100;
    
    // Calcular tempo médio de recebimento ponderado (em dias)
    const tempoMedioPonderado = 
        0 * distribuicaoNova.vista +
        30 * distribuicaoNova.dias30 +
        60 * distribuicaoNova.dias60 + 
        90 * distribuicaoNova.dias90;
    
    return {
        distribuicaoAtual,
        distribuicaoNova,
        pmrAtual,
        novoPmr,
        reducaoPmr,
        cicloAtual,
        novoCiclo,
        reducaoCiclo,
        aumentoVista,
        custoIncentivo,
        reducaoNCG,
        efetividadePercentual,
        tempoMedioPonderado,
        custoEstrategia: custoIncentivo,
        custoBeneficio: custoIncentivo > 0 ? custoIncentivo / reducaoNCG : 0
    };
}

// Demais funções de efetividade...

/**
 * Calcula a efetividade combinada de todas as estratégias selecionadas
 * @param {Object} dados - Dados da empresa e parâmetros de simulação
 * @param {Object} estrategias - Configuração das estratégias
 * @param {Object} resultadosEstrategias - Resultados individuais das estratégias
 * @param {Object} impactoBase - Impacto base do Split Payment
 * @returns {Object} - Análise de efetividade combinada
 */
function calcularEfeitividadeCombinada(dados, estrategias, resultadosEstrategias, impactoBase) {
    // Inicializar variáveis de acumulação
    let mitigacaoTotal = 0;
    let custoTotal = 0;
    let estrategiasAtivas = 0;
    let interacoes = {};
    
    // Matriz de interação entre estratégias (fatores de correção para evitar dupla contagem)
    // Valores menores que 1 indicam sobreposição entre estratégias
    const matrizInteracao = {
        ajustePrecos: {
            renegociacaoPrazos: 0.95,
            antecipacaoRecebiveis: 0.90,
            capitalGiro: 0.95,
            mixProdutos: 0.85,
            meiosPagamento: 0.90
        },
        renegociacaoPrazos: {
            ajustePrecos: 0.95,
            antecipacaoRecebiveis: 0.90,
            capitalGiro: 0.95,
            mixProdutos: 0.90,
            meiosPagamento: 0.95
        },
        antecipacaoRecebiveis: {
            ajustePrecos: 0.90,
            renegociacaoPrazos: 0.90,
            capitalGiro: 0.85,
            mixProdutos: 0.95,
            meiosPagamento: 0.80
        },
        capitalGiro: {
            ajustePrecos: 0.95,
            renegociacaoPrazos: 0.95,
            antecipacaoRecebiveis: 0.85,
            mixProdutos: 0.95,
            meiosPagamento: 0.95
        },
        mixProdutos: {
            ajustePrecos: 0.85,
            renegociacaoPrazos: 0.90,
            antecipacaoRecebiveis: 0.95,
            capitalGiro: 0.95,
            meiosPagamento: 0.85
        },
        meiosPagamento: {
            ajustePrecos: 0.90,
            renegociacaoPrazos: 0.95,
            antecipacaoRecebiveis: 0.80,
            capitalGiro: 0.95,
            mixProdutos: 0.85
        }
    };
    
    // Função auxiliar para calcular o fator de interação
    function calcularFatorInteracao(estrategiaAtual, estrategiasAtivas) {
        let fator = 1.0;
        
        // Para cada estratégia ativa, aplicar o fator de interação
        for (const estrategiaAtiva of estrategiasAtivas) {
            if (estrategiaAtiva !== estrategiaAtual && 
                matrizInteracao[estrategiaAtual] && 
                matrizInteracao[estrategiaAtual][estrategiaAtiva]) {
                fator *= matrizInteracao[estrategiaAtual][estrategiaAtiva];
            }
        }
        
        return fator;
    }
    
    // Lista de estratégias ativas
    const estrategiasAtivasList = [];
    
    // Processar cada estratégia
    if (estrategias.ajustePrecos.ativar && resultadosEstrategias.ajustePrecos) {
        estrategiasAtivasList.push('ajustePrecos');
    }
    
    if (estrategias.renegociacaoPrazos.ativar && resultadosEstrategias.renegociacaoPrazos) {
        estrategiasAtivasList.push('renegociacaoPrazos');
    }
    
    if (estrategias.antecipacaoRecebiveis.ativar && resultadosEstrategias.antecipacaoRecebiveis) {
        estrategiasAtivasList.push('antecipacaoRecebiveis');
    }
    
    if (estrategias.capitalGiro.ativar && resultadosEstrategias.capitalGiro) {
        estrategiasAtivasList.push('capitalGiro');
    }
    
    if (estrategias.mixProdutos.ativar && resultadosEstrategias.mixProdutos) {
        estrategiasAtivasList.push('mixProdutos');
    }
    
    if (estrategias.meiosPagamento.ativar && resultadosEstrategias.meiosPagamento) {
        estrategiasAtivasList.push('meiosPagamento');
    }
    
    // Calcular mitigação e custo para cada estratégia ativa
    const mitigacoesPorEstrategia = {};
    
    for (const estrategia of estrategiasAtivasList) {
        const resultado = resultadosEstrategias[estrategia];
        
        if (resultado) {
            // Calcular fator de interação para esta estratégia
            const fator = calcularFatorInteracao(estrategia, estrategiasAtivasList);
            
            // Calcular mitigação efetiva considerando interações
            const necessidadeCapitalGiro = Math.abs(impactoBase.diferencaCapitalGiro);
            const mitigacaoBase = (resultado.efetividadePercentual / 100) * necessidadeCapitalGiro;
            const mitigacaoEfetiva = mitigacaoBase * fator;
            
            // Acumular mitigação e custo
            mitigacaoTotal += mitigacaoEfetiva;
            custoTotal += resultado.custoEstrategia || 0;
            estrategiasAtivas++;
            
            // Registrar interações
            interacoes[estrategia] = {
                mitigacaoBase,
                fatorInteracao: fator,
                mitigacaoEfetiva
            };
            
            mitigacoesPorEstrategia[estrategia] = mitigacaoEfetiva;
        }
    }
    
    // Calcular efetividade percentual combinada
    const necessidadeCapitalGiro = Math.abs(impactoBase.diferencaCapitalGiro);
    const efetividadePercentual = (mitigacaoTotal / necessidadeCapitalGiro) * 100;
    
    // Calcular relação custo-benefício
    const custoBeneficio = custoTotal > 0 ? custoTotal / mitigacaoTotal : 0;
    
    return {
        estrategiasAtivas,
        estrategiasAtivasList,
        mitigacaoTotal,
        custoTotal,
        efetividadePercentual,
        custoBeneficio,
        interacoes,
        mitigacoesPorEstrategia,
        impactoResidual: necessidadeCapitalGiro - mitigacaoTotal,
        percentualResidual: 100 - efetividadePercentual
    };
}

/**
 * Identifica a combinação ótima de estratégias de mitigação
 * @param {Object} dados - Dados da empresa e parâmetros de simulação
 * @param {Object} estrategias - Configuração das estratégias
 * @param {Object} resultadosEstrategias - Resultados individuais das estratégias
 * @param {Object} impactoBase - Impacto base do Split Payment
 * @returns {Object} - Combinação ótima de estratégias
 */
function identificarCombinacaoOtima(dados, estrategias, resultadosEstrategias, impactoBase) {
    // Lista de todas as estratégias disponíveis
    const todasEstrategias = [
        'ajustePrecos',
        'renegociacaoPrazos',
        'antecipacaoRecebiveis',
        'capitalGiro',
        'mixProdutos',
        'meiosPagamento'
    ];
    
    // Filtrar estratégias com resultados disponíveis
    const estrategiasDisponiveis = todasEstrategias.filter(estrategia => 
        resultadosEstrategias[estrategia] !== null && 
        resultadosEstrategias[estrategia] !== undefined
    );
    
    // Função para avaliar uma combinação
    function avaliarCombinacao(combinacao) {
        // Criar objeto de estratégias para esta combinação
        const estrategiasCombinacao = {};
        
        todasEstrategias.forEach(estrategia => {
            estrategiasCombinacao[estrategia] = {
                ativar: combinacao.includes(estrategia),
                // Copiar demais parâmetros da estratégia original
                ...estrategias[estrategia]
            };
        });
        
        // Calcular efetividade desta combinação
        const resultado = calcularEfeitividadeCombinada(
            dados,
            estrategiasCombinacao,
            resultadosEstrategias,
            impactoBase
        );
        
        return {
            combinacao,
            efetividadePercentual: resultado.efetividadePercentual,
            custoTotal: resultado.custoTotal,
            custoBeneficio: resultado.custoBeneficio,
            resultado
        };
    }
    
    // Gerar todas as combinações possíveis (exceto vazio)
    const todasCombinacoes = [];
    
    // Função auxiliar para gerar combinações
    function gerarCombinacoes(arr, tamanho) {
        const result = [];
        
        // Combinações de tamanho 1 (casos base)
        if (tamanho === 1) {
            return arr.map(item => [item]);
        }
        
        // Gerar combinações recursivamente
        arr.forEach((item, index) => {
            const subArr = arr.slice(index + 1);
            const subCombinacoes = gerarCombinacoes(subArr, tamanho - 1);
            
            subCombinacoes.forEach(subComb => {
                result.push([item, ...subComb]);
            });
        });
        
        return result;
    }
    
    // Gerar combinações de todos os tamanhos possíveis
    for (let tamanho = 1; tamanho <= estrategiasDisponiveis.length; tamanho++) {
        const combinacoesTamanho = gerarCombinacoes(estrategiasDisponiveis, tamanho);
        todasCombinacoes.push(...combinacoesTamanho);
    }
    
    // Avaliar todas as combinações
    const avaliacoes = todasCombinacoes.map(combinacao => avaliarCombinacao(combinacao));
    
    // Encontrar a combinação ótima (maior efetividade com menor custo)
    // Critério primário: efetividade > 90%
    // Critério secundário: menor custo-benefício
    const combinacoesEficazes = avaliacoes.filter(aval => aval.efetividadePercentual >= 90);
    
    let combinacaoOtima;
    
    if (combinacoesEficazes.length > 0) {
        // Ordenar por custo-benefício (menor é melhor)
        combinacaoOtima = combinacoesEficazes.sort((a, b) => a.custoBeneficio - b.custoBeneficio)[0];
    } else {
        // Se não há combinações com efetividade > 90%, ordenar por efetividade
        combinacaoOtima = avaliacoes.sort((a, b) => b.efetividadePercentual - a.efetividadePercentual)[0];
    }
    
    return {
        estrategias: combinacaoOtima.combinacao,
        efetividadePercentual: combinacaoOtima.efetividadePercentual,
        custoTotal: combinacaoOtima.custoTotal,
        custoBeneficio: combinacaoOtima.custoBeneficio,
        resultadoDetalhado: combinacaoOtima.resultado
    };
}

// Adicionar ao CalculationModule em calculation.js, caso não exista
function gerarMemoriaCalculo(dados, anoInicial, anoFinal) {
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

/**
 * Formata um valor numérico como moeda (R$)
 * 
 * @param {number} valor - Valor numérico
 * @returns {string} - Valor formatado
 */
function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

/**
 * Traduz o nome da estratégia para exibição
 * 
 * @param {string} estrategia - Nome interno da estratégia
 * @returns {string} - Nome traduzido
 */
function traduzirNomeEstrategia(estrategia) {
    const traducoes = {
        ajustePrecos: "Ajuste de Preços",
        renegociacaoPrazos: "Renegociação de Prazos",
        antecipacaoRecebiveis: "Antecipação de Recebíveis",
        capitalGiro: "Capital de Giro",
        mixProdutos: "Mix de Produtos",
        meiosPagamento: "Meios de Pagamento"
    };
    
    return traducoes[estrategia] || estrategia;
}

// Integração com o módulo de cálculos
function inicializarIntegracaoCalculos() {
    console.log('Inicializando integração com o módulo de cálculos...');
    
    // Verificar se o módulo está disponível
    if (typeof CalculationModule === 'undefined') {
        console.error('Módulo de cálculos não encontrado. Algumas funcionalidades podem não funcionar corretamente.');
        return;
    }
    
    // Registrar o módulo no simulador
    if (typeof SimuladorFluxoCaixa !== 'undefined') {
        // Associar as funções de cálculo ao simulador
        SimuladorFluxoCaixa._calcularFluxoCaixaAtual = CalculationModule.calcularFluxoCaixaAtual;
        SimuladorFluxoCaixa._calcularFluxoCaixaSplitPayment = CalculationModule.calcularFluxoCaixaSplitPayment;
        SimuladorFluxoCaixa._calcularImpactoCapitalGiro = CalculationModule.calcularImpactoCapitalGiro;
        SimuladorFluxoCaixa._calcularProjecaoTemporal = CalculationModule.calcularProjecaoTemporal;
        
        console.log('Módulo de cálculos integrado com sucesso ao simulador.');
    } else {
        console.error('Simulador não encontrado. Não foi possível integrar o módulo de cálculos.');
    }
}

// Adicionar a inicialização à carga da página
document.addEventListener('DOMContentLoaded', function() {
    // Inicialização existente...
    
    // Inicializar integração com o módulo de cálculos
    inicializarIntegracaoCalculos();
});
