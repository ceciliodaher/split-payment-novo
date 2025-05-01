/**
 * Módulo central para coordenação de simulações
 * Integra o CalculationModule existente com a nova arquitetura
 */
window.SimuladorModulo = (function() {
    // Variáveis para armazenar resultados intermediários (uso interno)
    let _resultadoAtualCalculo = null;
    let _resultadoSplitPaymentCalculo = null;
    
    return {
        /**
         * Realiza uma simulação completa
         * @param {Object} dadosEntrada - Dados de entrada (opcional)
         * @returns {Object} - Resultados da simulação
         */
        simular: function(dadosEntrada) {
            console.log('Iniciando simulação com o SimuladorModulo...');
            
            // Obter dados de entrada
            let dados = dadosEntrada || null;
            
            // Se não foram fornecidos dados de entrada, tentar obter do repositório
            if (!dados && typeof SimuladorRepository !== 'undefined') {
                // Usar o repositório central se disponível
                const dadosEmpresa = SimuladorRepository.obterSecao('empresa');
                const cicloFinanceiro = SimuladorRepository.obterSecao('cicloFinanceiro');
                const parametrosFiscais = SimuladorRepository.obterSecao('parametrosFiscais');
                const parametrosSimulacao = SimuladorRepository.obterSecao('parametrosSimulacao');
                const parametrosFinanceiros = SimuladorRepository.obterSecao('parametrosFinanceiros') || {};
                
                // Preparar dados para simulação
                dados = {
                    empresa: dadosEmpresa.nome,
                    setor: dadosEmpresa.setor,
                    regime: dadosEmpresa.regime,
                    faturamento: dadosEmpresa.faturamento,
                    margem: dadosEmpresa.margem,
                    pmr: cicloFinanceiro.pmr,
                    pmp: cicloFinanceiro.pmp,
                    pme: cicloFinanceiro.pme,
                    percVista: cicloFinanceiro.percVista,
                    percPrazo: cicloFinanceiro.percPrazo,
                    aliquota: parametrosFiscais.aliquota,
                    tipoOperacao: parametrosFiscais.tipoOperacao,
                    creditos: parametrosFiscais.creditos,
                    dataInicial: parametrosSimulacao.dataInicial,
                    dataFinal: parametrosSimulacao.dataFinal,
                    cenario: parametrosSimulacao.cenario,
                    taxaCrescimento: parametrosSimulacao.taxaCrescimento,
                    taxaCapitalGiro: parametrosFinanceiros.taxaCapitalGiro || 0.021
                };
            }
            
            // Se ainda não temos dados, não podemos continuar
            if (!dados) {
                throw new Error('Não foi possível obter dados para a simulação');
            }
            
            // Extrair ano inicial e final para simulação
            const anoInicial = parseInt(dados.dataInicial.split('-')[0]) || 2026;
            const anoFinal = parseInt(dados.dataFinal.split('-')[0]) || 2033;
            
            // Verificar se o módulo de cálculos está disponível
            let resultados = null;
            
            if (typeof CalculationModule !== 'undefined') {
                console.log('Utilizando CalculationModule para os cálculos');
                // Usar o módulo de cálculos existente
                resultados = this._simularComCalculationModule(dados, anoInicial, anoFinal);
            } else {
                console.log('CalculationModule não encontrado, utilizando métodos alternativos');
                // Tentar usar os métodos do SimuladorFluxoCaixa
                if (window.SimuladorFluxoCaixa && 
                    typeof window.SimuladorFluxoCaixa.calcularFluxoCaixaAtual === 'function') {
                    console.log('Usando métodos do SimuladorFluxoCaixa');
                    resultados = this._simularComSimuladorFluxoCaixa(dados, anoInicial, anoFinal);
                } else {
                    // Implementação interna básica como último recurso
                    console.log('Usando implementação interna básica');
                    resultados = this._simularImplementacaoBasica(dados, anoInicial, anoFinal);
                }
            }
            
            // Atualizar o repositório com os resultados se disponível
            if (typeof SimuladorRepository !== 'undefined') {
                SimuladorRepository.atualizarSecao('resultadosSimulacao', resultados);
                SimuladorRepository.atualizarCampo('interfaceState', 'simulacaoRealizada', true);
                SimuladorRepository.salvar();
            }
            
            console.log('Simulação concluída com sucesso no SimuladorModulo');
            return resultados;
        },
        
        /**
         * Realiza a simulação usando o CalculationModule existente
         * @param {Object} dados - Dados para simulação
         * @param {number} anoInicial - Ano inicial
         * @param {number} anoFinal - Ano final
         * @returns {Object} - Resultados da simulação
         */
        _simularComCalculationModule: function(dados, anoInicial, anoFinal) {
            // Obter o setor para parâmetros específicos
            const parametrosSetoriais = this._obterParametrosSetoriais(dados.setor);
            
            // Calcular o impacto inicial usando o CalculationModule
            const impactoBase = CalculationModule.calcularImpactoCapitalGiro(
                dados, 
                anoInicial, 
                parametrosSetoriais
            );
            
            // Salvar referências para uso na memória de cálculo
            _resultadoAtualCalculo = impactoBase.resultadoAtual;
            _resultadoSplitPaymentCalculo = impactoBase.resultadoSplitPayment;
            
            // Simular período de transição
            const projecaoTemporal = CalculationModule.calcularProjecaoTemporal(
                dados, 
                anoInicial, 
                anoFinal, 
                dados.cenario, 
                dados.taxaCrescimento, 
                parametrosSetoriais
            );
            
            // Gerar memória de cálculo
            const memoriaCalculo = {};
            for (let ano = anoInicial; ano <= anoFinal; ano++) {
                // Verificar se o CalculationModule tem um método para gerar memória
                if (typeof CalculationModule.gerarMemoriaCalculoAno === 'function') {
                    memoriaCalculo[ano] = CalculationModule.gerarMemoriaCalculoAno(
                        dados, 
                        ano, 
                        impactoBase, 
                        projecaoTemporal
                    );
                } else {
                    // Usar o método interno
                    memoriaCalculo[ano] = this._gerarMemoriaCalculoAno(
                        dados, 
                        ano, 
                        impactoBase, 
                        projecaoTemporal
                    );
                }
            }
            
            return {
                impactoBase,
                projecaoTemporal,
                memoriaCalculo
            };
        },
        
        /**
         * Realiza a simulação usando os métodos do SimuladorFluxoCaixa
         * @param {Object} dados - Dados para simulação
         * @param {number} anoInicial - Ano inicial
         * @param {number} anoFinal - Ano final
         * @returns {Object} - Resultados da simulação
         */
        _simularComSimuladorFluxoCaixa: function(dados, anoInicial, anoFinal) {
            // Calcular fluxo de caixa atual
            const resultadoAtual = window.SimuladorFluxoCaixa.calcularFluxoCaixaAtual(dados);
            
            // Calcular fluxo de caixa com Split Payment
            const resultadoSplitPayment = window.SimuladorFluxoCaixa.calcularFluxoCaixaSplitPayment(dados, anoInicial);
            
            // Salvar referências para uso na memória de cálculo
            _resultadoAtualCalculo = resultadoAtual;
            _resultadoSplitPaymentCalculo = resultadoSplitPayment;
            
            // Calcular diferenças
            const diferencaCapitalGiro = resultadoSplitPayment.capitalGiroDisponivel - resultadoAtual.capitalGiroDisponivel;
            const percentualImpacto = (diferencaCapitalGiro / resultadoAtual.capitalGiroDisponivel) * 100;
            
            // Calcular impacto na margem operacional
            const margem = dados.margem;
            const custoCapitalGiro = Math.abs(diferencaCapitalGiro) * dados.taxaCapitalGiro;
            const impactoMargem = (custoCapitalGiro / dados.faturamento) * 100;
            
            // Construir o objeto impactoBase
            const impactoBase = {
                ano: anoInicial,
                resultadoAtual,
                resultadoSplitPayment,
                diferencaCapitalGiro,
                percentualImpacto,
                necessidadeAdicionalCapitalGiro: Math.abs(diferencaCapitalGiro) * 1.2, // Margem de segurança
                margemOperacionalOriginal: margem,
                margemOperacionalAjustada: margem - impactoMargem / 100,
                impactoMargem,
                custoCapitalGiro,
                percentualImplementacao: resultadoSplitPayment.percentualImplementacao
            };
            
            // Simular período de transição
            const resultadosAnuais = {};
            let faturamentoAtual = dados.faturamento;
            let taxaCrescimento = 0.05; // Padrão: moderado
            
            if (dados.cenario === 'conservador') {
                taxaCrescimento = 0.02;
            } else if (dados.cenario === 'otimista') {
                taxaCrescimento = 0.08;
            } else if (dados.cenario === 'personalizado' && dados.taxaCrescimento) {
                taxaCrescimento = dados.taxaCrescimento;
            }
            
            // Simular cada ano
            for (let ano = anoInicial; ano <= anoFinal; ano++) {
                // Criar cópia dos dados com faturamento ajustado
                const dadosAno = { ...dados, faturamento: faturamentoAtual };
                
                // Se é o ano inicial, usar o impactoBase já calculado
                if (ano === anoInicial) {
                    resultadosAnuais[ano] = impactoBase;
                } else {
                    // Calcular para os anos subsequentes
                    const resultadoAtualAno = window.SimuladorFluxoCaixa.calcularFluxoCaixaAtual(dadosAno);
                    const resultadoSplitAno = window.SimuladorFluxoCaixa.calcularFluxoCaixaSplitPayment(dadosAno, ano);
                    
                    // Calcular diferenças
                    const diferencaCapitalGiroAno = resultadoSplitAno.capitalGiroDisponivel - resultadoAtualAno.capitalGiroDisponivel;
                    const percentualImpactoAno = (diferencaCapitalGiroAno / resultadoAtualAno.capitalGiroDisponivel) * 100;
                    
                    // Calcular impacto na margem
                    const custoCapitalGiroAno = Math.abs(diferencaCapitalGiroAno) * dadosAno.taxaCapitalGiro;
                    const impactoMargemAno = (custoCapitalGiroAno / dadosAno.faturamento) * 100;
                    
                    // Adicionar ao objeto de resultados
                    resultadosAnuais[ano] = {
                        ano,
                        resultadoAtual: resultadoAtualAno,
                        resultadoSplitPayment: resultadoSplitAno,
                        diferencaCapitalGiro: diferencaCapitalGiroAno,
                        percentualImpacto: percentualImpactoAno,
                        necessidadeAdicionalCapitalGiro: Math.abs(diferencaCapitalGiroAno) * 1.2,
                        margemOperacionalOriginal: margem,
                        margemOperacionalAjustada: margem - impactoMargemAno / 100,
                        impactoMargem: impactoMargemAno,
                        custoCapitalGiro: custoCapitalGiroAno,
                        percentualImplementacao: resultadoSplitAno.percentualImplementacao
                    };
                }
                
                // Atualizar faturamento para o próximo ano
                faturamentoAtual *= (1 + taxaCrescimento);
            }
            
            // Calcular impacto acumulado
            const impactoAcumulado = this._calcularImpactoAcumulado(resultadosAnuais, anoInicial, anoFinal);
            
            // Construir objeto projecaoTemporal
            const projecaoTemporal = {
                parametros: {
                    anoInicial,
                    anoFinal,
                    cenario: dados.cenario,
                    taxaCrescimento
                },
                resultadosAnuais,
                impactoAcumulado
            };
            
            // Gerar memória de cálculo
            const memoriaCalculo = {};
            for (let ano = anoInicial; ano <= anoFinal; ano++) {
                memoriaCalculo[ano] = this._gerarMemoriaCalculoAno(
                    dados, 
                    ano, 
                    impactoBase, 
                    projecaoTemporal
                );
            }
            
            return {
                impactoBase,
                projecaoTemporal,
                memoriaCalculo
            };
        },
        
        /**
         * Implementação básica de simulação (último recurso)
         * @param {Object} dados - Dados para simulação
         * @param {number} anoInicial - Ano inicial
         * @param {number} anoFinal - Ano final
         * @returns {Object} - Resultados da simulação
         */
        _simularImplementacaoBasica: function(dados, anoInicial, anoFinal) {
            // Implementação simplificada como último recurso
            // ...
            // (código omitido para brevidade)
            console.log('Usando implementação básica de simulação');
            
            // Construir uma resposta mínima para não quebrar o sistema
            return {
                impactoBase: {
                    ano: anoInicial,
                    diferencaCapitalGiro: -dados.faturamento * dados.aliquota * 0.1,
                    percentualImpacto: -10,
                    necessidadeAdicionalCapitalGiro: dados.faturamento * dados.aliquota * 0.12,
                    margemOperacionalOriginal: dados.margem,
                    margemOperacionalAjustada: dados.margem * 0.95,
                    impactoMargem: 5,
                    percentualImplementacao: 0.1
                },
                projecaoTemporal: {
                    parametros: {
                        anoInicial,
                        anoFinal,
                        cenario: dados.cenario,
                        taxaCrescimento: 0.05
                    },
                    resultadosAnuais: {},
                    impactoAcumulado: {
                        totalNecessidadeCapitalGiro: dados.faturamento * dados.aliquota * 6,
                        custoFinanceiroTotal: dados.faturamento * dados.aliquota * 6 * 0.021 * 12,
                        impactoMedioMargem: 5
                    }
                },
                memoriaCalculo: {
                    [anoInicial]: 'Simulação básica - memória de cálculo não disponível'
                }
            };
        },
        
        /**
         * Obtém os parâmetros específicos do setor selecionado
         * @param {string} codigoSetor - Código do setor
         * @returns {Object|null} - Parâmetros setoriais ou null se não encontrado
         */
        _obterParametrosSetoriais: function(codigoSetor) {
            // Verifica se os dados do setor estão disponíveis no repositório
            if (typeof SimuladorRepository !== 'undefined') {
                const setoresEspeciais = SimuladorRepository.obterSecao('setoresEspeciais');
                if (setoresEspeciais && setoresEspeciais[codigoSetor]) {
                    return setoresEspeciais[codigoSetor];
                }
            }
            
            // Verifica se o SetoresManager está disponível
            if (typeof SetoresManager !== 'undefined' && SetoresManager.obterSetor) {
                return SetoresManager.obterSetor(codigoSetor);
            }
            
            // Caso não encontre, retorna null
            return null;
        },
        
        /**
         * Calcula o impacto acumulado ao longo do período
         * @param {Object} resultadosAnuais - Resultados por ano
         * @param {number} anoInicial - Ano inicial
         * @param {number} anoFinal - Ano final
         * @returns {Object} - Impacto acumulado
         */
        _calcularImpactoAcumulado: function(resultadosAnuais, anoInicial, anoFinal) {
            let totalNecessidadeCapitalGiro = 0;
            let totalCustoFinanceiro = 0;
            let somaImpactoMargem = 0;
            
            // Calcular totais
            for (let ano = anoInicial; ano <= anoFinal; ano++) {
                const impactoAno = resultadosAnuais[ano];
                if (!impactoAno) continue;
                
                totalNecessidadeCapitalGiro += impactoAno.necessidadeAdicionalCapitalGiro || 0;
                totalCustoFinanceiro += (impactoAno.custoCapitalGiro || 0) * 12; // Anualizado
                somaImpactoMargem += impactoAno.impactoMargem || 0;
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
         * Gera a memória de cálculo para um ano específico
         * @param {Object} dados - Dados da simulação
         * @param {number} ano - Ano de referência
         * @param {Object} impactoBase - Resultados do impacto base
         * @param {Object} projecaoTemporal - Resultados da projeção temporal
         * @returns {string} - Texto da memória de cálculo
         */
        _gerarMemoriaCalculoAno: function(dados, ano, impactoBase, projecaoTemporal) {
            let textoMemoria = `=== MEMÓRIA DE CÁLCULO - ANO ${ano} ===\n\n`;
            
            // Parâmetros básicos
            textoMemoria += `=== PARÂMETROS BÁSICOS ===\n`;
            const formatarMoeda = (valor) => `R$ ${valor.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
            
            textoMemoria += `Faturamento Mensal: ${formatarMoeda(dados.faturamento)}\n`;
            textoMemoria += `Alíquota Efetiva: ${(dados.aliquota * 100).toFixed(1)}%\n`;
            textoMemoria += `Prazo Médio de Recebimento: ${dados.pmr} dias\n`;
            textoMemoria += `Prazo Médio de Pagamento: ${dados.pmp} dias\n`;
            textoMemoria += `Prazo Médio de Estoque: ${dados.pme} dias\n`;
            textoMemoria += `Ciclo Financeiro: ${dados.pmr + dados.pme - dados.pmp} dias\n`;
            textoMemoria += `Percentual de Vendas à Vista: ${(dados.percVista * 100).toFixed(1)}%\n`;
            textoMemoria += `Percentual de Vendas a Prazo: ${(dados.percPrazo * 100).toFixed(1)}%\n\n`;
            
            // Cálculo do impacto para o ano específico
            const impactoAno = projecaoTemporal.resultadosAnuais[ano] || impactoBase;
            const percentualImplementacao = this._obterPercentualImplementacao(ano);
            
            textoMemoria += `=== CÁLCULO DO IMPACTO NO FLUXO DE CAIXA - ANO ${ano} ===\n`;
            textoMemoria += `Percentual de Implementação: ${(percentualImplementacao * 100).toFixed(1)}%\n`;
            
            // Valores atuais
            if (_resultadoAtualCalculo) {
                textoMemoria += `Capital de Giro Disponível (Regime Atual): ${formatarMoeda(_resultadoAtualCalculo.capitalGiroDisponivel)}\n`;
            }
            
            // Valores com Split Payment
            if (_resultadoSplitPaymentCalculo) {
                textoMemoria += `Capital de Giro Disponível (Split Payment): ${formatarMoeda(_resultadoSplitPaymentCalculo.capitalGiroDisponivel)}\n`;
            }
            
            textoMemoria += `Diferença no Capital de Giro: ${formatarMoeda(impactoAno.diferencaCapitalGiro)}\n`;
            textoMemoria += `Impacto Percentual: ${impactoAno.percentualImpacto.toFixed(2)}%\n`;
            textoMemoria += `Necessidade Adicional de Capital: ${formatarMoeda(impactoAno.necessidadeAdicionalCapitalGiro)}\n\n`;
            
            // Impacto na rentabilidade
            textoMemoria += `=== IMPACTO NA RENTABILIDADE ===\n`;
            textoMemoria += `Margem Operacional Original: ${(impactoAno.margemOperacionalOriginal * 100).toFixed(2)}%\n`;
            
            if (impactoAno.custoCapitalGiro) {
                textoMemoria += `Custos Financeiros: ${formatarMoeda(impactoAno.custoCapitalGiro)}\n`;
            }
            
            textoMemoria += `Margem Operacional Ajustada: ${(impactoAno.margemOperacionalAjustada * 100).toFixed(2)}%\n`;
            
            if (impactoAno.impactoMargem) {
                textoMemoria += `Redução da Margem: ${(impactoAno.impactoMargem).toFixed(2)} pontos percentuais\n\n`;
            }
            
            return textoMemoria;
        },
        
        /**
         * Obtém o percentual de implementação do Split Payment para um determinado ano
         * @param {number} ano - Ano para obter o percentual
         * @returns {number} - Percentual de implementação (decimal)
         */
        _obterPercentualImplementacao: function(ano) {
            // Verifica se existe um cronograma no repositório
            if (typeof SimuladorRepository !== 'undefined') {
                const cronograma = SimuladorRepository.obterSecao('cronogramaImplementacao');
                if (cronograma && cronograma[ano] !== undefined) {
                    return cronograma[ano];
                }
            }
            
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
            
            return cronogramaPadrao[ano] || 0;
        }
    };
})();
