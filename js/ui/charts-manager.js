/**
 * Módulo de gerenciamento de gráficos avançados para o simulador de Split Payment
 * Este módulo centraliza a criação e gerenciamento dos gráficos utilizados na análise avançada
 */
const ChartsManager = {
    /**
     * Inicializa o gerenciador de gráficos
     */
    init: function() {
        console.log('Inicializando gerenciador de gráficos avançados');
    },

    /**
     * Gera o gráfico de fluxo de caixa comparativo entre os regimes
     * @param {string} containerId - ID do elemento container do gráfico
     * @param {Object} dados - Dados para o gráfico
     */
    gerarGraficoFluxoCaixaComparativo: function(containerId, dados) {
        const ctx = document.getElementById(containerId).getContext('2d');

        // Configurar dados para o gráfico
        const dadosGrafico = {
            labels: dados.periodos,
            datasets: [
                {
                    label: 'Fluxo de Caixa - Regime Atual',
                    data: dados.fluxoAtual,
                    borderColor: '#4285F4',
                    backgroundColor: 'rgba(66, 133, 244, 0.1)',
                    fill: true
                },
                {
                    label: 'Fluxo de Caixa - Split Payment',
                    data: dados.fluxoSplit,
                    borderColor: '#DB4437',
                    backgroundColor: 'rgba(219, 68, 55, 0.1)',
                    fill: true
                }
            ]
        };

        // Criar o gráfico
        new Chart(ctx, {
            type: 'line',
            data: dadosGrafico,
            options: {
                responsive: true,
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Período'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'R$ (Milhares)'
                        },
                        ticks: {
                            callback: function(value) {
                                return 'R$ ' + Formatters.formatarMoeda(value / 1000) + ' mil';
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': R$ ' + Formatters.formatarMoeda(context.parsed.y);
                            }
                        }
                    }
                }
            }
        });
    },

    /**
     * Gera o gráfico de capital de giro
     * @param {string} containerId - ID do elemento container do gráfico
     * @param {Object} dados - Dados para o gráfico
     */
    gerarGraficoCapitalGiro: function(containerId, dados) {
        const ctx = document.getElementById(containerId).getContext('2d');

        // Configurar dados para o gráfico
        const dadosGrafico = {
            labels: ['Pré-Split', ...dados.periodos],
            datasets: [
                {
                    label: 'Necessidade de Capital de Giro',
                    data: [dados.ncgInicial, ...dados.ncgProjecao],
                    borderColor: '#9b59b6',
                    backgroundColor: 'rgba(155, 89, 182, 0.1)',
                    fill: true,
                    tension: 0.1
                }
            ]
        };

        // Criar o gráfico
        new Chart(ctx, {
            type: 'line',
            data: dadosGrafico,
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Evolução da Necessidade de Capital de Giro',
                        font: { size: 16 }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return 'R$ ' + Formatters.formatarMoeda(context.parsed.y);
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        ticks: {
                            callback: function(value) {
                                return 'R$ ' + Formatters.formatarMoeda(value);
                            }
                        }
                    }
                }
            }
        });
    },

    /**
     * Gera o gráfico de projeção com margem operacional
     * @param {string} containerId - ID do elemento container do gráfico
     * @param {Object} dados - Dados para o gráfico
     */
    gerarGraficoProjecao: function(containerId, dados) {
        const ctx = document.getElementById(containerId).getContext('2d');

        // Configurar dados para o gráfico
        const dadosGrafico = {
            labels: dados.periodos,
            datasets: [
                {
                    label: 'Impacto % do Split Payment',
                    data: dados.impactoPercentual,
                    borderColor: '#e74c3c',
                    backgroundColor: 'rgba(231, 76, 60, 0.1)',
                    fill: true,
                    tension: 0.1,
                    yAxisID: 'y'
                },
                {
                    label: 'Margem Operacional (%)',
                    data: dados.margemOperacional,
                    borderColor: '#2ecc71',
                    backgroundColor: 'rgba(46, 204, 113, 0.1)',
                    fill: true,
                    tension: 0.1,
                    yAxisID: 'y1'
                }
            ]
        };

        // Criar o gráfico
        new Chart(ctx, {
            type: 'line',
            data: dadosGrafico,
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Impacto na Margem Operacional',
                        font: { size: 16 }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ' + Formatters.formatarNumero(context.parsed.y, 2) + '%';
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Impacto %'
                        },
                        ticks: {
                            callback: function(value) {
                                return Formatters.formatarNumero(value, 2) + '%';
                            }
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Margem %'
                        },
                        ticks: {
                            callback: function(value) {
                                return Formatters.formatarNumero(value, 2) + '%';
                            }
                        },
                        grid: {
                            drawOnChartArea: false
                        }
                    }
                }
            }
        });
    },

    /**
     * Gera o gráfico de eficácia das estratégias de mitigação
     * @param {string} containerId - ID do elemento container do gráfico
     * @param {Object} dados - Dados para o gráfico
     */
    gerarGraficoEficaciaEstrategias: function(containerId, dados) {
        const ctx = document.getElementById(containerId).getContext('2d');

        // Configurar dados para o gráfico
        const dadosGrafico = {
            labels: [
                'Sem Estratégia', 
                'Ajuste de Preços', 
                'Renegociação', 
                'Antecipação', 
                'Capital de Giro', 
                'Mix de Produtos', 
                'Meios de Pagamento', 
                'Combinada'
            ],
            datasets: [
                {
                    label: 'Impacto na Necessidade de Capital (%)',
                    data: dados.eficaciaEstrategias,
                    backgroundColor: [
                        '#e74c3c', // Vermelho - Sem Estratégia
                        '#3498db', // Azul - Ajuste de Preços
                        '#2ecc71', // Verde - Renegociação
                        '#9b59b6', // Roxo - Antecipação
                        '#f39c12', // Laranja - Capital de Giro
                        '#1abc9c', // Turquesa - Mix de Produtos
                        '#34495e', // Azul Escuro - Meios de Pagamento
                        '#27ae60'  // Verde Escuro - Combinada
                    ]
                }
            ]
        };

        // Criar o gráfico
        new Chart(ctx, {
            type: 'bar',
            data: dadosGrafico,
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Eficácia das Estratégias de Mitigação',
                        font: { size: 16 }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ' + Formatters.formatarNumero(context.parsed.y, 2) + '%';
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        min: 0,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return Formatters.formatarNumero(value, 2) + '%';
                            }
                        }
                    }
                }
            }
        });
    }
};