// Verificação imediata
console.log('main.js carregado, SimuladorFluxoCaixa disponível?', !!window.SimuladorFluxoCaixa);
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM carregado, SimuladorFluxoCaixa disponível?', !!window.SimuladorFluxoCaixa);
});

/**
 * Script principal do simulador de Split Payment
 * Inicializa todos os módulos e estabelece as relações entre eles
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando Simulador de Split Payment');
    
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

