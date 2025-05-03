// Verificação imediata
console.log('main.js carregado, SimuladorFluxoCaixa disponível?', !!window.SimuladorFluxoCaixa);
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM carregado, SimuladorFluxoCaixa disponível?', !!window.SimuladorFluxoCaixa);
});

/**
 * Script principal do simulador de Split Payment
 * Inicializa todos os módulos e estabelece as relações entre eles
 */
// No início da função de inicialização, após o console.log inicial
document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando Simulador de Split Payment');
    
    // Inicializar o repositório antes de qualquer outro componente
    if (typeof SimuladorRepository !== 'undefined') {
        SimuladorRepository.inicializar();
    } else {
        console.error('SimuladorRepository não encontrado. Verifique se o arquivo está sendo carregado corretamente.');
    }
    
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
            console.log('Botão Simular clicado');

            try {
                // Primeiro verifica se o SimuladorFluxoCaixa está disponível
                // Mantém a abordagem original para retrocompatibilidade
                if (window.SimuladorFluxoCaixa && typeof window.SimuladorFluxoCaixa.simularImpacto === 'function') {
                    // A função simularImpacto foi modificada para usar o SimuladorModulo quando disponível
                    window.SimuladorFluxoCaixa.simularImpacto();
                } else {
                    // Caso o SimuladorFluxoCaixa não esteja disponível, tenta usar o SimuladorModulo diretamente
                    if (window.SimuladorModulo && typeof window.SimuladorModulo.simular === 'function') {
                        console.log('Executando simulação diretamente via SimuladorModulo');

                        // Coletar dados do formulário
                        const dados = {
                            empresa: document.getElementById('empresa').value,
                            setor: document.getElementById('setor').value,
                            regime: document.getElementById('regime').value,
                            faturamento: parseFloat(document.getElementById('faturamento').value.replace(/[^\d,.]/g, '').replace(',', '.')),
                            margem: parseFloat(document.getElementById('margem').value) / 100,
                            pmr: parseInt(document.getElementById('pmr').value) || 30,
                            pmp: parseInt(document.getElementById('pmp').value) || 30,
                            pme: parseInt(document.getElementById('pme').value) || 30,
                            percVista: parseFloat(document.getElementById('perc-vista').value) / 100,
                            percPrazo: parseFloat(document.getElementById('perc-prazo').value) / 100,
                            aliquota: parseFloat(document.getElementById('aliquota').value) / 100,
                            tipoOperacao: document.getElementById('tipo-operacao').value,
                            creditos: parseFloat(document.getElementById('creditos').value.replace(/[^\d,.]/g, '').replace(',', '.')),
                            dataInicial: document.getElementById('data-inicial').value,
                            dataFinal: document.getElementById('data-final').value,
                            cenario: document.getElementById('cenario').value,
                            taxaCrescimento: parseFloat(document.getElementById('taxa-crescimento').value) / 100,
                            taxaCapitalGiro: 0.021 // Valor padrão
                        };

                        // Executar simulação
                        const resultados = window.SimuladorModulo.simular(dados);

                        // Atualizar a interface com os resultados
                        // Use o método exibirResultados do SimulacaoPrincipalController se disponível
                        if (typeof SimulacaoPrincipalController !== 'undefined' && 
                            typeof SimulacaoPrincipalController.exibirResultados === 'function') {
                            SimulacaoPrincipalController.exibirResultados(resultados);
                        } else {
                            // Implementar uma exibição básica como fallback
                            const containerResultados = document.getElementById('resultados');
                            if (containerResultados) {
                                containerResultados.innerHTML = '<div class="alert alert-success">Simulação concluída com sucesso. Implemente a exibição dos resultados.</div>';
                            }
                        }
                    } else {
                        throw new Error('Nenhum módulo de simulação disponível');
                    }
                }
            } catch (error) {
                console.error('Erro ao executar simulação:', error);
                alert('Erro ao iniciar a simulação: ' + error.message);
            }
        });
    }
    
    /**
     * Calcula o Fluxo de Caixa Descontado Ajustado considerando o impacto do Split Payment
     * 
     * @param {Object} dados - Dados da empresa e parâmetros de simulação
     * @param {number} anoInicial - Ano inicial da projeção
     * @param {number} anoFinal - Ano final da projeção
     * @param {Object} parametrosAdicionais - Parâmetros adicionais para a simulação
     * @returns {Object} - Resultados detalhados do fluxo de caixa descontado ajustado
     */
    function calcularFluxoCaixaDescontadoAjustado(dados, anoInicial = 2026, anoFinal = 2033, parametrosAdicionais = {}) {
        // Extração de parâmetros relevantes
        const faturamentoInicial = dados.faturamento || 0;
        const taxaCrescimento = dados.taxaCrescimento || 0.05; // Padrão: 5% a.a.
        const aliquota = dados.aliquota || 0.265; // Padrão: 26,5%
        const creditos = dados.creditos || 0;
        const taxaDescontoAnual = parametrosAdicionais.taxaDesconto || 0.12; // TMA - Taxa Mínima de Atratividade (padrão: 12% a.a.)

        // Array para armazenar os resultados por período
        const resultadosPorPeriodo = [];

        // Valor presente líquido acumulado
        let vplAcumulado = 0;

        // Simulação para cada período (ano)
        for (let t = 0; t <= anoFinal - anoInicial; t++) {
            const ano = anoInicial + t;

            // Calcular faturamento para o período t considerando crescimento
            const faturamentoPeriodo = faturamentoInicial * Math.pow(1 + taxaCrescimento, t);

            // Obter percentual de implementação do Split Payment para o ano
            const percentualImplementacao = obterPercentualImplementacao(ano, dados.parametrosSetoriais);

            // Cálculo do fluxo de caixa operacional (simplificado)
            const margemOperacional = dados.margem || 0.15; // Padrão: 15%
            const fluxoCaixaOperacional = faturamentoPeriodo * margemOperacional;

            // Cálculo do valor tributário total
            const valorTributarioTotal = faturamentoPeriodo * aliquota;

            // Valor tributário retido via Split Payment
            const valorTributarioRetido = valorTributarioTotal * percentualImplementacao;

            // Créditos tributários aplicáveis no período
            // Assumimos que os créditos crescem proporcionalmente ao faturamento
            const creditosTributariosPeriodo = creditos * Math.pow(1 + taxaCrescimento, t);

            // Fator de compensação de créditos (limitado a 1 para evitar compensação acima do devido)
            const fatorCompensacao = Math.min(1, creditosTributariosPeriodo / valorTributarioRetido || 0);

            // Fluxo de caixa ajustado pelo Split Payment
            const fluxoCaixaAjustado = fluxoCaixaOperacional - valorTributarioRetido * (1 - fatorCompensacao);

            // Cálculo do valor presente para o período t
            const taxaDescontoPeriodo = Math.pow(1 + taxaDescontoAnual, t);
            const valorPresente = fluxoCaixaAjustado / taxaDescontoPeriodo;

            // Acumular o valor presente líquido
            vplAcumulado += valorPresente;

            // Armazenar resultados detalhados do período
            resultadosPorPeriodo.push({
                ano,
                faturamento: faturamentoPeriodo,
                percentualImplementacao,
                fluxoCaixaOperacional,
                valorTributarioTotal,
                valorTributarioRetido,
                creditosTributarios: creditosTributariosPeriodo,
                fatorCompensacao,
                fluxoCaixaAjustado,
                taxaDescontoPeriodo,
                valorPresente
            });
        }

        // Cálculo de métricas adicionais
        const valorPresenteRegimeAtual = calcularVPLRegimeAtual(dados, anoInicial, anoFinal, taxaDescontoAnual);
        const impactoPercentual = ((vplAcumulado - valorPresenteRegimeAtual) / valorPresenteRegimeAtual) * 100;

        // Retornar resultados completos
        return {
            vplAcumulado,
            valorPresenteRegimeAtual,
            impactoPercentual,
            periodos: resultadosPorPeriodo,
            parametrosUtilizados: {
                anoInicial,
                anoFinal,
                taxaCrescimento,
                taxaDesconto: taxaDescontoAnual,
                aliquota,
                creditos
            }
        };
    }

    /**
     * Calcula o Valor Presente Líquido no regime tributário atual
     * 
     * @param {Object} dados - Dados da empresa e parâmetros de simulação
     * @param {number} anoInicial - Ano inicial da projeção
     * @param {number} anoFinal - Ano final da projeção
     * @param {number} taxaDescontoAnual - Taxa de desconto anual
     * @returns {number} - VPL no regime atual
     */
    function calcularVPLRegimeAtual(dados, anoInicial, anoFinal, taxaDescontoAnual) {
        // Extração de parâmetros relevantes
        const faturamentoInicial = dados.faturamento || 0;
        const taxaCrescimento = dados.taxaCrescimento || 0.05;
        const aliquota = dados.aliquota || 0.265;
        const creditos = dados.creditos || 0;
        const margemOperacional = dados.margem || 0.15;

        let vplAcumulado = 0;

        // Simulação para cada período (ano)
        for (let t = 0; t <= anoFinal - anoInicial; t++) {
            // Calcular faturamento para o período t considerando crescimento
            const faturamentoPeriodo = faturamentoInicial * Math.pow(1 + taxaCrescimento, t);

            // Cálculo do fluxo de caixa operacional
            const fluxoCaixaOperacional = faturamentoPeriodo * margemOperacional;

            // Valor tributário total
            const valorTributarioTotal = faturamentoPeriodo * aliquota;

            // Créditos tributários no período
            const creditosTributariosPeriodo = creditos * Math.pow(1 + taxaCrescimento, t);

            // No regime atual, o impacto no fluxo de caixa é diferido
            // O imposto é pago no período seguinte, mas para simplificar,
            // consideramos o efeito dentro do mesmo período ajustado pelo valor do dinheiro no tempo
            const prazoMedioPagamentoTributos = 30 / 365; // 30 dias convertidos para fração de ano
            const fatorAjustePrazo = Math.pow(1 + taxaDescontoAnual, -prazoMedioPagamentoTributos);

            // Valor tributário efetivo (já considerando créditos)
            const valorTributarioEfetivo = Math.max(0, valorTributarioTotal - creditosTributariosPeriodo);

            // Fluxo de caixa ajustado pelo regime atual (pagamento diferido)
            const fluxoCaixaAjustado = fluxoCaixaOperacional - valorTributarioEfetivo * fatorAjustePrazo;

            // Cálculo do valor presente
            const taxaDescontoPeriodo = Math.pow(1 + taxaDescontoAnual, t);
            const valorPresente = fluxoCaixaAjustado / taxaDescontoPeriodo;

            // Acumular VPL
            vplAcumulado += valorPresente;
        }

        return vplAcumulado;
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
        if (parametrosSetoriais && parametrosSetoriais.cronogramaProprio && 
            parametrosSetoriais.cronograma && parametrosSetoriais.cronograma[ano]) {
            return parametrosSetoriais.cronograma[ano];
        }

        // Caso contrário, utilizar o cronograma padrão
        return cronogramaPadrao[ano] || 0;
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
            atualizarExibicaoMemoriaCalculo();
        });
    }
    
    // Evento para select de anos da memória
    const selectAnoMemoria = document.getElementById('select-ano-memoria');
    if (selectAnoMemoria) {
        selectAnoMemoria.addEventListener('change', function() {
            atualizarExibicaoMemoriaCalculo();
        });
    }
    
    // Função para atualizar exibição da memória de cálculo
    function atualizarExibicaoMemoriaCalculo() {
        const selectAno = document.getElementById('select-ano-memoria');
        if (!selectAno) return;
        
        const anoSelecionado = selectAno.value;
        console.log('Atualizando memória para o ano:', anoSelecionado);
        
        if (window.SimuladorFluxoCaixa && window.memoriaCalculoSimulacao) {
            window.SimuladorFluxoCaixa.exibirMemoriaCalculo(anoSelecionado);
        } else {
            console.error('Não há memória de cálculo disponível ou o simulador não está inicializado');
            document.getElementById('memoria-calculo').innerHTML = '<p>Realize uma simulação antes de visualizar a memória de cálculo.</p>';
        }
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

// Adicionar ao final do arquivo main.js
document.addEventListener('tabChange', function(event) {
    const tabId = event.detail.tab;
    console.log('Evento tabChange detectado:', tabId);
    
    // Inicializar controlador adequado com base na aba ativa
    switch(tabId) {
        case 'simulacao':
            if (typeof SimulacaoPrincipalController !== 'undefined') {
                console.log('Inicializando SimulacaoPrincipalController');
                SimulacaoPrincipalController.inicializar();
            } else {
                console.error('SimulacaoPrincipalController não está definido');
            }
            break;
        case 'memoria':
            if (typeof MemoriaCalculoController !== 'undefined') {
                console.log('Inicializando MemoriaCalculoController');
                MemoriaCalculoController.inicializar();
            } else {
                console.error('MemoriaCalculoController não está definido');
            }
            break;
        case 'estrategias':
            if (typeof EstrategiasMitigacaoController !== 'undefined') {
                console.log('Inicializando EstrategiasMitigacaoController');
                EstrategiasMitigacaoController.inicializar();
            } else {
                console.error('EstrategiasMitigacaoController não está definido');
            }
            break;
    }
});

// Garantir que a aba inicial seja ativada corretamente
window.addEventListener('load', function() {
    console.log('Página totalmente carregada');
    
    // Obter a aba atualmente ativa
    const abaAtiva = document.querySelector('.tab-button.active');
    if (abaAtiva) {
        const tabId = abaAtiva.getAttribute('data-tab');
        console.log('Aba ativa no carregamento:', tabId);
        
        // Garantir que o conteúdo correspondente esteja visível
        const conteudos = document.querySelectorAll('.tab-content');
        conteudos.forEach(c => c.classList.remove('active'));
        
        const conteudoAlvo = document.getElementById(tabId);
        if (conteudoAlvo) {
            conteudoAlvo.classList.add('active');
            console.log('Ativando conteúdo inicial:', tabId);
            
            // Disparar evento de mudança de aba para inicializar o controlador adequado
            const event = new CustomEvent('tabChange', {
                detail: { tab: tabId }
            });
            document.dispatchEvent(event);
        }
    }
});

