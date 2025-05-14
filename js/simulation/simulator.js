/**
 * @fileoverview Núcleo do simulador de impacto do Split Payment.
 * @module simulator
 * @author Expertzy Inteligência Tributária
 * @version 1.0.0
 */

// Importar os novos módulos refatorados
import CalculationCore from './calculation-core.js';
import CurrentTaxSystem from './current-tax-system.js';
import IVADualSystem from './iva-dual-system.js';

// Objeto para armazenar resultados intermediários
let _resultadoAtual = null;
let _resultadoSplitPayment = null;

/**
 * @class SimuladorFluxoCaixa
 * @description Classe principal do simulador que gerencia as simulações de Split Payment
 */
const SimuladorFluxoCaixa = {
    /**
     * Inicializa o simulador
     */
    init() {
        console.log('Simulador de Split Payment inicializado...');

        if (window.FormatacaoHelper && !window.FormatacaoHelper.formatarMoeda) {
            window.FormatacaoHelper.formatarMoeda = CalculationCore.formatarMoeda;
        }
    },

    /**
     * Obtem dados do repositório
     * @returns {Object} Dados do repositório
     */
    obterDadosDoRepositorio() {
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
    },

    /**
     * Simula o impacto do Split Payment
     * @returns {Object} Resultados da simulação
     */
    simular() {
        // Obter dados consolidados do repositório
        const dados = this.obterDadosDoRepositorio();

        // Extrair ano inicial e final para simulação
        const anoInicial = parseInt(dados.parametrosSimulacao.dataInicial.split('-')[0]) || 2026;
        const anoFinal = parseInt(dados.parametrosSimulacao.dataFinal.split('-')[0]) || 2033;

        // Consolidar dados para simulação
        const dadosSimulacao = {
            faturamento: dados.empresa.faturamento,
            margem: dados.empresa.margem,
            setor: dados.empresa.setor,
            regime: dados.empresa.regime,
            pmr: dados.cicloFinanceiro.pmr,
            pmp: dados.cicloFinanceiro.pmp,
            pme: dados.cicloFinanceiro.pme,
            percVista: dados.cicloFinanceiro.percVista,
            percPrazo: dados.cicloFinanceiro.percPrazo,
            aliquota: dados.parametrosFiscais.aliquota,
            tipoOperacao: dados.parametrosFiscais.tipoOperacao,
            creditos: dados.parametrosFiscais.creditos,
            cenario: dados.parametrosSimulacao.cenario,
            taxaCrescimento: dados.parametrosSimulacao.taxaCrescimento,
            taxaCapitalGiro: dados.parametrosFinanceiros?.taxaCapitalGiro || 0.021,
            // Adicionar os parâmetros de impostos
            serviceCompany: dados.empresa.tipoEmpresa === 'servicos',
            cumulativeRegime: dados.parametrosFiscais.regime === 'cumulativo',
            creditosPIS: dados.parametrosFiscais.creditosPIS || 0,
            creditosCOFINS: dados.parametrosFiscais.creditosCOFINS || 0,
            creditosICMS: dados.parametrosFiscais.creditosICMS || 0,
            creditosIPI: dados.parametrosFiscais.creditosIPI || 0,
            creditosCBS: dados.parametrosFiscais.creditosCBS || 0,
            creditosIBS: dados.parametrosFiscais.creditosIBS || 0
        };

        // Obter parâmetros setoriais, se aplicável
        const parametrosSetoriais = dados.empresa.setor ? 
            dados.setoresEspeciais[dados.empresa.setor] : null;

        // Calcular impacto inicial
        const impactoBase = IVADualSystem.calcularImpactoCapitalGiro(dadosSimulacao, anoInicial, parametrosSetoriais);

        // Simular período de transição
        const projecaoTemporal = IVADualSystem.calcularProjecaoTemporal(
            dadosSimulacao, 
            anoInicial, 
            anoFinal, 
            dados.parametrosSimulacao.cenario, 
            dados.parametrosSimulacao.taxaCrescimento,
            parametrosSetoriais
        );

        // Gerar memória de cálculo
        const memoriaCalculo = this.gerarMemoriaCalculo(dadosSimulacao, anoInicial, anoFinal);

        // Armazenar resultados intermediários para acesso externo
        _resultadoAtual = impactoBase.resultadoAtual;
        _resultadoSplitPayment = impactoBase.resultadoSplitPayment;

        // Estruturar resultados
        return {
            impactoBase,
            projecaoTemporal,
            memoriaCalculo,
            dadosUtilizados: dadosSimulacao,
            parametrosSetoriais
        };
    },

    /**
     * Gera a memória de cálculo detalhada
     * @param {Object} dados - Dados da simulação
     * @param {number} anoInicial - Ano inicial
     * @param {number} anoFinal - Ano final
     * @returns {Object} Memória de cálculo
     */
    gerarMemoriaCalculo(dados, anoInicial, anoFinal) {
        // Calcular os resultados para gerar a memória
        const resultadoAtual = CurrentTaxSystem.calcularFluxoCaixaAtual(dados);
        const resultadoSplit = IVADualSystem.calcularFluxoCaixaSplitPayment(dados, anoInicial);
        const impacto = IVADualSystem.calcularImpactoCapitalGiro(dados, anoInicial);

        // Gerar seções da memória de cálculo
        const secaoAnaliseSensibilidade = CalculationCore.gerarSecaoAnaliseSensibilidade(
            dados, 
            impacto.diferencaCapitalGiro, 
            anoInicial
        );

        const secaoProjecaoTemporal = CalculationCore.gerarSecaoProjecaoTemporal(dados, anoInicial);

        // Estruturar a memória de cálculo
        return {
            dadosEntrada: {
                empresa: {
                    faturamento: dados.faturamento,
                    margem: dados.margem,
                    setor: dados.setor
                },
                cicloFinanceiro: {
                    pmr: dados.pmr,
                    pmp: dados.pmp,
                    pme: dados.pme,
                    percVista: dados.percVista,
                    percPrazo: dados.percPrazo
                },
                parametrosFiscais: {
                    aliquota: dados.aliquota,
                    creditos: dados.creditos
                }
            },
            resultadoAtual: {
                valorImpostoTotal: resultadoAtual.valorImpostoTotal,
                valorImpostoLiquido: resultadoAtual.valorImpostoLiquido,
                capitalGiroDisponivel: resultadoAtual.capitalGiroDisponivel,
                tempoMedioCapitalGiro: resultadoAtual.tempoMedioCapitalGiro,
                beneficioDiasCapitalGiro: resultadoAtual.beneficioDiasCapitalGiro,
                impostos: resultadoAtual.impostos
            },
            resultadoSplitPayment: {
                percentualImplementacao: resultadoSplit.percentualImplementacao,
                valorImpostoSplit: resultadoSplit.valorImpostoSplit,
                valorImpostoNormal: resultadoSplit.valorImpostoNormal,
                capitalGiroDisponivel: resultadoSplit.capitalGiroDisponivel,
                impostos: resultadoSplit.impostosIVA ? {
                    atual: resultadoSplit.impostosAtuais,
                    ivaDual: resultadoSplit.impostosIVA
                } : null
            },
            impacto: {
                diferencaCapitalGiro: impacto.diferencaCapitalGiro,
                percentualImpacto: impacto.percentualImpacto,
                impactoDiasFaturamento: impacto.impactoDiasFaturamento,
                necesidadeAdicionalCapitalGiro: impacto.necesidadeAdicionalCapitalGiro,
                impactoMargem: impacto.impactoMargem
            },
            analiseSensibilidade: secaoAnaliseSensibilidade,
            projecaoTemporal: secaoProjecaoTemporal
        };
    },

    /**
     * Obtém o resultado atual (para depuração)
     * @returns {Object} Resultado do regime atual
     */
    getResultadoAtual() { 
        return _resultadoAtual; 
    },

    /**
     * Obtém o resultado do Split Payment (para depuração)
     * @returns {Object} Resultado do regime Split Payment
     */
    getResultadoSplitPayment() { 
        return _resultadoSplitPayment; 
    },

    // Expor os módulos para acesso externo
    CalculationCore,
    CurrentTaxSystem,
    IVADualSystem
};

// Inicializar o simulador quando o documento estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    SimuladorFluxoCaixa.init();
});

export default SimuladorFluxoCaixa;
