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
    
    // Adicionar observadores para mudanças de aba
    observarMudancasDeAba();
    
    // Inicializar eventos específicos da página principal
    inicializarEventosPrincipais();
    
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

            // Verificação explícita da disponibilidade
            if (window.SimuladorFluxoCaixa && typeof window.SimuladorFluxoCaixa.simularImpacto === 'function') {
                // Chamada explícita usando window
                window.SimuladorFluxoCaixa.simularImpacto();
                
                // Publicar evento de simulação solicitada
                if (typeof EventBus !== 'undefined') {
                    EventBus.publish('simulacaoSolicitada', {
                        timestamp: new Date().getTime()
                    });
                }
            } else {
                console.error('SimuladorFluxoCaixa não está definido corretamente', window.SimuladorFluxoCaixa);
                
                // Usar DOMUtils para notificação, se disponível
                if (typeof DOMUtils !== 'undefined') {
                    DOMUtils.notify('Erro ao iniciar a simulação. Verifique o console para mais detalhes.', 'error');
                } else {
                    alert('Erro ao iniciar a simulação. Verifique o console para mais detalhes.');
                }
            }
        });
    }
    
    // Eventos para exportação
    const btnExportarPDF = document.getElementById('btn-exportar-pdf');
    if (btnExportarPDF) {
        btnExportarPDF.addEventListener('click', function() {
            if (typeof ExportTools !== 'undefined') {
                ExportTools.exportarParaPDF();
                
                // Publicar evento
                if (typeof EventBus !== 'undefined') {
                    EventBus.publish('exportacaoSolicitada', { tipo: 'pdf' });
                }
            }
        });
    }
    
    const btnExportarExcel = document.getElementById('btn-exportar-excel');
    if (btnExportarExcel) {
        btnExportarExcel.addEventListener('click', function() {
            if (typeof ExportTools !== 'undefined') {
                ExportTools.exportarParaExcel();
                
                // Publicar evento
                if (typeof EventBus !== 'undefined') {
                    EventBus.publish('exportacaoSolicitada', { tipo: 'excel' });
                }
            }
        });
    }
    
    const btnExportarMemoria = document.getElementById('btn-exportar-memoria');
    if (btnExportarMemoria) {
        btnExportarMemoria.addEventListener('click', function() {
            if (typeof ExportTools !== 'undefined') {
                ExportTools.exportarMemoriaCalculo();
                
                // Publicar evento
                if (typeof EventBus !== 'undefined') {
                    EventBus.publish('exportacaoSolicitada', { tipo: 'memoriaCalculo' });
                }
            }
        });
    }
    
    // Evento para atualização da memória de cálculo
    const btnAtualizarMemoria = document.getElementById('btn-atualizar-memoria');
    if (btnAtualizarMemoria) {
        btnAtualizarMemoria.addEventListener('click', function() {
            atualizarExibicaoMemoriaCalculo();
            
            // Publicar evento
            if (typeof EventBus !== 'undefined') {
                EventBus.publish('memoriaCalculoAtualizada', {
                    ano: document.getElementById('select-ano-memoria')?.value
                });
            }
        });
    }
    
    // Evento para select de anos da memória
    const selectAnoMemoria = document.getElementById('select-ano-memoria');
    if (selectAnoMemoria) {
        selectAnoMemoria.addEventListener('change', function() {
            atualizarExibicaoMemoriaCalculo();
            
            // Publicar evento
            if (typeof EventBus !== 'undefined') {
                EventBus.publish('anoMemoriaAlterado', {
                    ano: this.value
                });
            }
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
            
            // Usar DOMUtils para mostrar mensagem, se disponível
            if (typeof DOMUtils !== 'undefined') {
                DOMUtils.setValue('memoria-calculo', '<p>Realize uma simulação antes de visualizar a memória de cálculo.</p>');
                DOMUtils.notify('Realize uma simulação antes de visualizar a memória de cálculo', 'warning');
            } else {
                document.getElementById('memoria-calculo').innerHTML = '<p>Realize uma simulação antes de visualizar a memória de cálculo.</p>';
            }
        }
    }
    
    // Evento para simulação de estratégias
    const btnSimularEstrategias = document.getElementById('btn-simular-estrategias');
    if (btnSimularEstrategias) {
        btnSimularEstrategias.addEventListener('click', function() {
            // Verificar se há módulo específico para simulação de estratégias
            if (typeof EstrategiasMitigacaoController !== 'undefined' && 
                typeof EstrategiasMitigacaoController.simularEstrategias === 'function') {
                
                EstrategiasMitigacaoController.simularEstrategias();
                
                // Publicar evento
                if (typeof EventBus !== 'undefined') {
                    EventBus.publish('estrategiasSolicitadas', {
                        timestamp: new Date().getTime()
                    });
                }
            } else {
                // Fallback para função global
                if (typeof simularEstrategias === 'function') {
                    simularEstrategias();
                    
                    // Publicar evento
                    if (typeof EventBus !== 'undefined') {
                        EventBus.publish('estrategiasSolicitadas', {
                            timestamp: new Date().getTime()
                        });
                    }
                } else {
                    console.error('Função de simulação de estratégias não encontrada');
                    
                    // Usar DOMUtils para notificação, se disponível
                    if (typeof DOMUtils !== 'undefined') {
                        DOMUtils.notify('Função de simulação de estratégias não encontrada', 'error');
                    } else {
                        alert('Função de simulação de estratégias não encontrada');
                    }
                }
            }
        });
    }
    
    // Adicionar evento para salvar setores que atualize os dropdowns
    const btnSalvarSetor = document.getElementById('btn-salvar-setor');
    if (btnSalvarSetor) {
        btnSalvarSetor.addEventListener('click', function() {
            // Após salvar o setor, atualizar dropdown na aba de simulação
            setTimeout(function() {
                if (typeof SetoresManager !== 'undefined') {
                    SetoresManager.preencherDropdownSetores('setor');
                    
                    // Publicar evento
                    if (typeof EventBus !== 'undefined') {
                        EventBus.publish('setoresSalvos', {
                            timestamp: new Date().getTime()
                        });
                    }
                }
            }, 100);
        });
    }
    
    // Inicialização do formatador de moeda
    if (window.CurrencyFormatter) {
        CurrencyFormatter.inicializar();
    }
    
    // Evento para limpeza de formulário
    const btnLimpar = document.getElementById('btn-limpar');
    if (btnLimpar) {
        btnLimpar.addEventListener('click', function() {
            // Limpar formulário de simulação
            limparFormularioSimulacao();
            
            // Publicar evento
            if (typeof EventBus !== 'undefined') {
                EventBus.publish('formularioLimpo', {
                    formulario: 'simulacao'
                });
            }
            
            // Notificar usuário
            if (typeof DOMUtils !== 'undefined') {
                DOMUtils.notify('Formulário limpo com sucesso', 'info');
            }
        });
    }
    
    // Inicializar gerenciador de estado, se disponível
    if (typeof StateManager !== 'undefined') {
        // Carregar estado do localStorage
        if (StateManager.loadFromLocalStorage()) {
            console.log('Estado carregado do localStorage');
            
            // Publicar evento
            if (typeof EventBus !== 'undefined') {
                EventBus.publish('estadoCarregado', {
                    origem: 'localStorage'
                });
            }
        }
    }
    
    console.log('Eventos principais inicializados');
}

/**
 * Limpa o formulário de simulação, restaurando valores padrão
 */
function limparFormularioSimulacao() {
    // Empresa
    document.getElementById('empresa').value = '';
    document.getElementById('setor').value = '';
    document.getElementById('regime').value = '';
    document.getElementById('faturamento').value = '0';
    document.getElementById('margem').value = '15';
    
    // Ciclo financeiro
    document.getElementById('pmr').value = '30';
    document.getElementById('pmp').value = '30';
    document.getElementById('pme').value = '30';
    document.getElementById('perc-vista').value = '30';
    document.getElementById('ciclo-financeiro').value = '30';
    
    // Tributação
    document.getElementById('aliquota').value = '26.5';
    document.getElementById('reducao').value = '0.0';
    document.getElementById('tipo-operacao').value = 'b2b';
    document.getElementById('creditos').value = '0';
    
    // Parâmetros da simulação
    document.getElementById('data-inicial').value = '2026-01-01';
    document.getElementById('data-final').value = '2033-12-31';
    document.getElementById('cenario').value = '';
    
    // Atualizar estado se disponível
    if (typeof StateManager !== 'undefined') {
        // Resetar seções específicas
        StateManager.resetState(['empresa', 'cicloFinanceiro', 'parametrosFiscais', 'parametrosSimulacao']);
    }
    
    // Recalcular valores derivados
    if (typeof FormsManager !== 'undefined') {
        // Recalcular ciclo financeiro
        FormsManager.calcularCicloFinanceiro();
        
        // Atualizar percentual a prazo
        FormsManager.atualizarPercPrazo();
    } else {
        // Calcular ciclo financeiro manualmente
        document.getElementById('ciclo-financeiro').value = 
            (parseInt(document.getElementById('pmr').value) || 0) + 
            (parseInt(document.getElementById('pme').value) || 0) - 
            (parseInt(document.getElementById('pmp').value) || 0);
        
        // Calcular percentual a prazo manualmente
        const valorPercVista = parseInt(document.getElementById('perc-vista').value) || 0;
        document.getElementById('perc-prazo').value = (100 - valorPercVista) + '%';
    }
    
    // Formatar campos monetários
    if (typeof CurrencyFormatter !== 'undefined') {
        CurrencyFormatter.inicializar();
    }
    
    // Limpar área de resultados
    const containerResultados = document.getElementById('resultados');
    if (containerResultados) {
        containerResultados.innerHTML = '<p class="text-muted">Preencha os dados e clique em "Simular" para visualizar os resultados.</p>';
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
            if (typeof SetoresManager !== 'undefined') {
                SetoresManager.preencherDropdownSetores('setor');
                console.log('Dropdown de setores atualizado na aba de simulação');
            }
            
            // Verificar se há simulação prévia
            if (window.ultimaSimulacao) {
                // Reexibir gráficos, caso tenham sido destruídos
                if (typeof SimuladorFluxoCaixa !== 'undefined' && 
                    typeof SimuladorFluxoCaixa.gerarGraficos === 'function') {
                    SimuladorFluxoCaixa.gerarGraficos(window.ultimaSimulacao.resultados);
                }
            }
        }
        
        // Se a aba de memória for ativada, atualizar exibição
        if (tabId === 'memoria') {
            if (typeof MemoriaCalculoController !== 'undefined') {
                MemoriaCalculoController.inicializar();
            } else {
                const selectAno = document.getElementById('select-ano-memoria');
                if (selectAno && selectAno.options.length > 0) {
                    atualizarExibicaoMemoriaCalculo();
                }
            }
        }
        
        // Se a aba de estratégias for ativada, atualizar controlador
        if (tabId === 'estrategias') {
            if (typeof EstrategiasMitigacaoController !== 'undefined') {
                EstrategiasMitigacaoController.inicializar();
            }
        }
        
        // Publicar evento
        if (typeof EventBus !== 'undefined') {
            EventBus.publish('tabMudada', {
                tabId: tabId
            });
        }
    });
    
    // Observar eventos de estratégia
    document.addEventListener('strategyTabChange', function(event) {
        const tabId = event.detail.tab;
        
        // Publicar evento
        if (typeof EventBus !== 'undefined') {
            EventBus.publish('estrategiaMudada', {
                estrategiaId: tabId
            });
        }
        
        // Atualizar estado
        if (typeof StateManager !== 'undefined') {
            StateManager.updateField('interfaceState', 'estrategiaAtiva', tabId);
        }
    });
}