/**
 * Módulo de Cálculos do Sistema Tributário Atual
 * Fornece as funções de cálculo do fluxo de caixa no regime tributário atual
 * 
 * @author Expertzy Inteligência Tributária
 * @version 1.0.0
 */

import CalculationCore from './calculation-core.js';

/**
 * Alíquotas padrão do sistema tributário atual
 * @type {Object}
 */
const aliquotasPadrao = {
    pis: 0.0165,       // PIS não-cumulativo
    cofins: 0.076,     // COFINS não-cumulativo
    icms: {
        intrastate: 0.18,
        interstate: {
            general: 0.12,
            south_southeast_to_north_northeast_midwest: 0.07
        }
    },
    ipi: 0.10,         // Valor padrão, varia conforme NCM
    issqn: 0.05,       // Varia conforme município
    irpj: 0.15,        // Alíquota básica
    csll: 0.09         // Alíquota padrão
};

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
 * Calcula o PIS a ser recolhido
 * @param {number} revenue - Receita bruta
 * @param {number} [rate=aliquotasPadrao.pis] - Alíquota do PIS
 * @param {boolean} [cumulativeRegime=false] - Regime cumulativo (true) ou não-cumulativo (false)
 * @param {number} [credits=0] - Créditos de PIS a serem descontados
 * @returns {number} Valor do PIS a recolher
 */
function calcularPIS(revenue, rate = aliquotasPadrao.pis, cumulativeRegime = false, credits = 0) {
    if (cumulativeRegime) {
        rate = 0.0065; // Alíquota para regime cumulativo
        return revenue * rate;
    }

    // Regime não-cumulativo
    const tax = revenue * rate;
    return Math.max(0, tax - credits);
}

/**
 * Calcula o COFINS a ser recolhido
 * @param {number} revenue - Receita bruta
 * @param {number} [rate=aliquotasPadrao.cofins] - Alíquota do COFINS
 * @param {boolean} [cumulativeRegime=false] - Regime cumulativo (true) ou não-cumulativo (false)
 * @param {number} [credits=0] - Créditos de COFINS a serem descontados
 * @returns {number} Valor do COFINS a recolher
 */
function calcularCOFINS(revenue, rate = aliquotasPadrao.cofins, cumulativeRegime = false, credits = 0) {
    if (cumulativeRegime) {
        rate = 0.03; // Alíquota para regime cumulativo
        return revenue * rate;
    }

    // Regime não-cumulativo
    const tax = revenue * rate;
    return Math.max(0, tax - credits);
}

/**
 * Calcula o ICMS a ser recolhido
 * @param {number} revenue - Receita bruta
 * @param {number} [rate=aliquotasPadrao.icms.intrastate] - Alíquota do ICMS
 * @param {number} [credits=0] - Créditos de ICMS a serem descontados
 * @param {boolean} [substituicaoTributaria=false] - Indica se aplica-se o regime de substituição tributária
 * @returns {number} Valor do ICMS a recolher
 */
function calcularICMS(revenue, rate = aliquotasPadrao.icms.intrastate, credits = 0, substituicaoTributaria = false) {
    if (substituicaoTributaria) {
        // No caso de ST, considera-se que o ICMS já foi recolhido anteriormente
        return 0;
    }

    const tax = revenue * rate;
    return Math.max(0, tax - credits);
}

/**
 * Calcula o IPI a ser recolhido
 * @param {number} productValue - Valor do produto
 * @param {number} [rate=aliquotasPadrao.ipi] - Alíquota do IPI
 * @param {number} [credits=0] - Créditos de IPI a serem descontados
 * @returns {number} Valor do IPI a recolher
 */
function calcularIPI(productValue, rate = aliquotasPadrao.ipi, credits = 0) {
    const tax = productValue * rate;
    return Math.max(0, tax - credits);
}

/**
 * Calcula o ISS a ser recolhido
 * @param {number} serviceValue - Valor do serviço
 * @param {number} [rate=aliquotasPadrao.issqn] - Alíquota do ISS
 * @returns {number} Valor do ISS a recolher
 */
function calcularISS(serviceValue, rate = aliquotasPadrao.issqn) {
    return serviceValue * rate;
}

/**
 * Calcula todos os impostos do sistema atual para uma operação
 * @param {Object} params - Parâmetros da operação
 * @param {number} params.revenue - Receita bruta
 * @param {boolean} [params.serviceCompany=false] - Indica se é empresa de serviços
 * @param {boolean} [params.cumulativeRegime=false] - Regime cumulativo (true) ou não-cumulativo (false)
 * @param {Object} [params.credits] - Créditos tributários disponíveis
 * @returns {Object} Objeto contendo todos os impostos calculados
 */
function calcularTodosImpostosAtuais(params) {
    const { revenue, serviceCompany = false, cumulativeRegime = false, credits = {} } = params;

    const result = {
        pis: calcularPIS(revenue, aliquotasPadrao.pis, cumulativeRegime, credits.pis || 0),
        cofins: calcularCOFINS(revenue, aliquotasPadrao.cofins, cumulativeRegime, credits.cofins || 0)
    };

    if (serviceCompany) {
        result.iss = calcularISS(revenue, aliquotasPadrao.issqn);
    } else {
        result.icms = calcularICMS(revenue, aliquotasPadrao.icms.intrastate, credits.icms || 0);
        result.ipi = calcularIPI(revenue, aliquotasPadrao.ipi, credits.ipi || 0);
    }

    // Cálculo total
    result.total = Object.values(result).reduce((sum, tax) => sum + tax, 0);

    return result;
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
    const tempoMedioCapitalGiro = CalculationCore.calcularTempoMedioCapitalGiro(pmr, prazoRecolhimento, percVista, percPrazo);

    // Benefício financeiro do capital em giro (em dias de faturamento)
    const beneficioDiasCapitalGiro = (capitalGiroImpostos / faturamento) * tempoMedioCapitalGiro;

    // Cálculo dos impostos do sistema atual
    const impostos = calcularTodosImpostosAtuais({
        revenue: faturamento,
        serviceCompany: dados.serviceCompany || false,
        cumulativeRegime: dados.cumulativeRegime || false,
        credits: {
            pis: dados.creditosPIS || 0,
            cofins: dados.creditosCOFINS || 0,
            icms: dados.creditosICMS || 0,
            ipi: dados.creditosIPI || 0
        }
    });

    // Resultado completo
    const resultado = {
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
        impostos,            
        memoriaCritica: CalculationCore.gerarMemoriaCritica(dados, null)
    };

    return resultado;
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
    const resultado = {
        custoMensalCapitalGiro,
        custoAnualCapitalGiro,
        impactoPercentual,
        margemOriginal: margem,
        margemAjustada,
        percentualReducaoMargem,
        memoriaCritica: CalculationCore.gerarMemoriaCritica(dados, null)
    };

    return resultado;
}

// Adicionar ao final do arquivo

/**
 * Inicializa a integração do módulo de cálculos
 */
function inicializarIntegracaoCalculos() {
    console.log('Inicializando integração com o módulo de cálculos...');

    // Verificar se o módulo está disponível
    if (typeof CalculationModule === 'undefined') {
        console.error('Módulo de cálculos não encontrado. Algumas funcionalidades podem não funcionar corretamente.');
        return;
    }

    // Adicionar o módulo ao objeto window para garantir disponibilidade global
    window.CalculationModule = CalculationModule;

    // Tentar integrar com o simulador, mas não falhar se não estiver disponível
    if (typeof window.SimuladorFluxoCaixa !== 'undefined') {
        integrarComSimulador();
    } else {
        // Tentar novamente após um pequeno atraso para permitir que outros scripts carreguem
        setTimeout(function() {
            if (typeof window.SimuladorFluxoCaixa !== 'undefined') {
                integrarComSimulador();
            } else {
                console.warn('Simulador não encontrado após espera. A integração será tentada quando o simulador for utilizado.');
            }
        }, 500);
    }
}

/**
 * Integra o módulo de cálculos com o simulador
 */
function integrarComSimulador() {
    // Associar as funções de cálculo ao simulador
    if (window.SimuladorFluxoCaixa) {
        window.SimuladorFluxoCaixa._calcularFluxoCaixaAtual = CurrentTaxSystem.calcularFluxoCaixaAtual;
        window.SimuladorFluxoCaixa._calcularFluxoCaixaSplitPayment = IVADualSystem.calcularFluxoCaixaSplitPayment;
        window.SimuladorFluxoCaixa._calcularImpactoCapitalGiro = IVADualSystem.calcularImpactoCapitalGiro;
        window.SimuladorFluxoCaixa._calcularProjecaoTemporal = IVADualSystem.calcularProjecaoTemporal;

        console.log('Módulo de cálculos integrado com sucesso ao simulador.');
    } else {
        console.warn('Simulador não encontrado. Não foi possível integrar o módulo de cálculos.');
    }
}

/**
 * Obtém dados do repositório
 * @returns {Object} Dados obtidos do repositório
 */
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

/**
 * Obtém uma seção específica do repositório
 * @param {string} secao - Nome da seção a ser obtida
 * @returns {Object} Dados da seção
 */
function obterSecao(secao) {
    if (typeof SimuladorRepository === 'undefined' || typeof SimuladorRepository.obterSecao !== 'function') {
        console.error(`SimuladorRepository não está definido ou não possui o método obterSecao. Seção solicitada: ${secao}`);
        return {};
    }

    return SimuladorRepository.obterSecao(secao);
}

// Adicionar ao objeto CurrentTaxSystem
const CurrentTaxSystem = {
    // Funções já implementadas
    aliquotasPadrao,
    obterPercentualImplementacao,
    calcularPIS,
    calcularCOFINS,
    calcularICMS,
    calcularIPI,
    calcularISS,
    calcularTodosImpostosAtuais,
    calcularFluxoCaixaAtual,
    calcularAnaliseSensibilidade,
    calcularImpactoMargem,

    // Funções adicionadas
    inicializarIntegracaoCalculos,
    integrarComSimulador,
    obterDadosDoRepositorio,
    obterSecao
};

export default CurrentTaxSystem;