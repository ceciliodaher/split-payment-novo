// Módulo de estratégias de mitigação
(function() {
    'use strict';
    
    // Namespace global
    window.SimuladorSplitPayment = window.SimuladorSplitPayment || {};
    
    // Calcular compensação por ajuste de preços
    function calcularCompensacaoAjustePrecos(faturamento, percentualAumento, elasticidadePreco) {
        if (isNaN(faturamento) || isNaN(percentualAumento) || isNaN(elasticidadePreco)) {
            throw new Error("Parâmetros inválidos para cálculo da compensação por ajuste de preços");
        }
        
        // Compensacao_AP = F × AP × (1 + (EP × AP)/100)
        return faturamento * percentualAumento * (1 + (elasticidadePreco * percentualAumento) / 100);
    }
    
    // Calcular impacto da renegociação de prazos
    function calcularImpactoRenegociacaoPrazos(pagamentoFornecedores, aumentoPrazo, percentualFornecedores, custoContrapartidas) {
        if (isNaN(pagamentoFornecedores) || isNaN(aumentoPrazo) || 
            isNaN(percentualFornecedores) || isNaN(custoContrapartidas)) {
            throw new Error("Parâmetros inválidos para cálculo do impacto da renegociação de prazos");
        }
        
        // Impacto_RP = PF × (AP/30) × PP × (1 - CP/100)
        return pagamentoFornecedores * (aumentoPrazo / 30) * (percentualFornecedores / 100) * (1 - custoContrapartidas / 100);
    }
    
    // Calcular impacto da antecipação de recebíveis
    function calcularImpactoAntecipacaoRecebiveis(faturamento, percentualPrazo, percentualAntecipacao, 
                                                prazoMedioAntecipado, taxaDesconto) {
        if (isNaN(faturamento) || isNaN(percentualPrazo) || isNaN(percentualAntecipacao) || 
            isNaN(prazoMedioAntecipado) || isNaN(taxaDesconto)) {
            throw new Error("Parâmetros inválidos para cálculo do impacto da antecipação de recebíveis");
        }
        
        // Impacto_AR = F × (PP/100) × PA × PMA × (1 - (TA × PMA)/(30 × 100))
        return faturamento * (percentualPrazo / 100) * (percentualAntecipacao / 100) * prazoMedioAntecipado * 
               (1 - (taxaDesconto * prazoMedioAntecipado) / (30 * 100));
    }
    
    // Calcular custo da captação de capital de giro
    function calcularCustoCapitalGiro(necessidadeCapitalGiro, percentualValorCaptado, taxaJuros, prazoPagamento) {
        if (isNaN(necessidadeCapitalGiro) || isNaN(percentualValorCaptado) || 
            isNaN(taxaJuros) || isNaN(prazoPagamento)) {
            throw new Error("Parâmetros inválidos para cálculo do custo da captação de capital de giro");
        }
        
        // Custo_CG = NCG × VC × (TJ/100) × (1 + PP/12)
        return necessidadeCapitalGiro * (percentualValorCaptado / 100) * (taxaJuros / 100) * (1 + prazoPagamento / 12);
    }
    
    // Calcular impacto do ajuste no mix de produtos
    function calcularImpactoMixProdutos(faturamento, percentualAjuste, impactoReceita, impactoMargem) {
        if (isNaN(faturamento) || isNaN(percentualAjuste) || isNaN(impactoReceita) || isNaN(impactoMargem)) {
            throw new Error("Parâmetros inválidos para cálculo do impacto do ajuste no mix de produtos");
        }
        
        // Impacto_MIX = F × PA × (IR/100 + IM/100)
        return faturamento * (percentualAjuste / 100) * (impactoReceita / 100 + impactoMargem / 100);
    }
    
    // Calcular impacto do incentivo a meios de pagamento favoráveis
    function calcularImpactoMeiosPagamento(faturamento, taxaIncentivo, percentualVendasVistaNovo, percentualVendasVistaAtual) {
        if (isNaN(faturamento) || isNaN(taxaIncentivo) || isNaN(percentualVendasVistaNovo) || isNaN(percentualVendasVistaAtual)) {
            throw new Error("Parâmetros inválidos para cálculo do impacto do incentivo a meios de pagamento");
        }
        
        // Impacto_MP = F × (1 - TI/100) × (PVN - PVA)
        return faturamento * (1 - taxaIncentivo / 100) * ((percentualVendasVistaNovo / 100) - (percentualVendasVistaAtual / 100));
    }
    
    // Calcular índice de eficácia de mitigação
    function calcularIndiceEficaciaMitigacao(deltaCGComEstrategia, deltaCGSemEstrategia) {
        if (isNaN(deltaCGComEstrategia) || isNaN(deltaCGSemEstrategia) || deltaCGSemEstrategia === 0) {
            throw new Error("Parâmetros inválidos para cálculo do índice de eficácia de mitigação");
        }
        
        // IEM = ((ΔCG_Com_Estrategia - ΔCG_Sem_Estrategia) / ΔCG_Sem_Estrategia) × 100
        return ((deltaCGComEstrategia - deltaCGSemEstrategia) / deltaCGSemEstrategia) * 100;
    }
    
    // Exportar funções
    SimuladorSplitPayment.strategies = {
        calcularCompensacaoAjustePrecos: calcularCompensacaoAjustePrecos,
        calcularImpactoRenegociacaoPrazos: calcularImpactoRenegociacaoPrazos,
        calcularImpactoAntecipacaoRecebiveis: calcularImpactoAntecipacaoRecebiveis,
        calcularCustoCapitalGiro: calcularCustoCapitalGiro,
        calcularImpactoMixProdutos: calcularImpactoMixProdutos,
        calcularImpactoMeiosPagamento: calcularImpactoMeiosPagamento,
        calcularIndiceEficaciaMitigacao: calcularIndiceEficaciaMitigacao
    };
})();
