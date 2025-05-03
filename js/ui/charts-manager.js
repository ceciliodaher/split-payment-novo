function gerarGraficoFluxoCaixaComparativo(dados, elementoId) {
    // Verificar parâmetros
    if (!dados || !dados.periodos || !dados.fluxoAtual || !dados.fluxoSplit) {
        console.error("Dados inválidos para geração do gráfico de fluxo de caixa");
        return null;
    }
    
    const elemento = document.getElementById(elementoId);
    if (!elemento) {
        console.error(`Elemento com ID ${elementoId} não encontrado`);
        return null;
    }
    
    // Estrutura de dados para o gráfico
    const dadosVisualizacao = {
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

    try {
        // Inicializar e retornar o gráfico
        return new Chart(elemento, {
            type: 'line',
            data: dadosVisualizacao,
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
                                return SimuladorSplitPayment.formatters.formatarMoeda(value);
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error("Erro ao gerar gráfico de fluxo de caixa:", error);
        return null;
    }
}

// Funções auxiliares para o mapa de calor
function escalaColorInterpolada(valor, min, max, escala) {
    if (valor <= min) return escala[0];
    if (valor >= max) return escala[escala.length - 1];
    
    const normalizado = (valor - min) / (max - min);
    const indice = Math.floor(normalizado * (escala.length - 1));
    
    return escala[indice];
}

function calcularSensibilidadeParametrica(setor, parametro) {
    // Implementar cálculo do Índice de Sensibilidade
    // IS = (AE_s * PMR) / (CO * ML * 100)
    const aliquota = setor.aliquota || 0;
    const pmr = setor.prazoMedioRecebimento || 0;
    const cicloOperacional = setor.cicloOperacional || 1;
    const margemLiquida = setor.margemLiquida || 1;
    
    const sensibilidade = (aliquota * pmr) / (cicloOperacional * margemLiquida * 100);
    
    // Normalizar para escala 0-100
    return Math.min(100, Math.max(0, sensibilidade * 100));
}

function gerarMapaCalorSensibilidade(parametros, setores, elementoId) {
    // Verificar parâmetros
    if (!parametros || !setores || !parametros.length || !setores.length) {
        console.error("Dados inválidos para geração do mapa de calor");
        return null;
    }
    
    const elemento = document.getElementById(elementoId);
    if (!elemento) {
        console.error(`Elemento com ID ${elementoId} não encontrado`);
        return null;
    }
    
    try {
        // Verificar se plugin heatmap está disponível
        if (!Chart.controllers.heatmap) {
            console.error("Plugin heatmap não encontrado. Instale-o para utilizar esta função.");
            return null;
        }
        
        // Cálculo da matriz de sensibilidade
        const matrizSensibilidade = [];
        const nomeSetores = [];
        const nomeParametros = parametros.map(p => p.nome || "Parâmetro não identificado");

        for (const setor of setores) {
            const linhaSensibilidade = [];
            nomeSetores.push(setor.nome || "Setor não identificado");

            for (const parametro of parametros) {
                const sensibilidade = calcularSensibilidadeParametrica(setor, parametro);
                linhaSensibilidade.push(sensibilidade);
            }

            matrizSensibilidade.push(linhaSensibilidade);
        }
        
        // Converter para formato compatível com heatmap
        const dadosHeatmap = [];
        for (let i = 0; i < matrizSensibilidade.length; i++) {
            for (let j = 0; j < matrizSensibilidade[i].length; j++) {
                dadosHeatmap.push({
                    x: j,
                    y: i,
                    v: matrizSensibilidade[i][j]
                });
            }
        }
        
        // Inicializar e retornar o gráfico
        return new Chart(elemento, {
            type: 'heatmap',
            data: {
                datasets: [{
                    label: 'Sensibilidade',
                    data: dadosHeatmap,
                    backgroundColor: (context) => {
                        if (!context.raw) return 'rgba(0, 0, 0, 0)';
                        
                        const valor = context.raw.v;
                        const escala = [
                            'rgba(0, 200, 0, 0.8)',   // Baixo impacto
                            'rgba(255, 255, 0, 0.8)', // Médio impacto
                            'rgba(255, 0, 0, 0.8)'    // Alto impacto
                        ];
                        
                        return escalaColorInterpolada(valor, 0, 100, escala);
                    }
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Mapa de Sensibilidade Setorial ao Split Payment'
                    },
                    tooltip: {
                        callbacks: {
                            title: function(context) {
                                const dataIndex = context[0].dataIndex;
                                const dataPoint = context[0].dataset.data[dataIndex];
                                const setor = nomeSetores[dataPoint.y];
                                const parametro = nomeParametros[dataPoint.x];
                                return `${setor} - ${parametro}`;
                            },
                            label: function(context) {
                                const valor = context.dataset.data[context.dataIndex].v;
                                return `Sensibilidade: ${valor.toFixed(1)}%`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'category',
                        labels: nomeParametros,
                        title: {
                            display: true,
                            text: 'Parâmetros'
                        }
                    },
                    y: {
                        type: 'category',
                        labels: nomeSetores,
                        title: {
                            display: true,
                            text: 'Setores'
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error("Erro ao gerar mapa de calor:", error);
        return null;
    }
}

function gerarGraficoWaterfallImpacto(faturamento, aliquota, creditos, pmr, margemLiquida, elementoId) {
    // Verificar parâmetros
    if (isNaN(faturamento) || isNaN(aliquota) || isNaN(creditos) || isNaN(pmr) || isNaN(margemLiquida)) {
        console.error("Parâmetros inválidos para geração do gráfico waterfall");
        return null;
    }
    
    const elemento = document.getElementById(elementoId);
    if (!elemento) {
        console.error(`Elemento com ID ${elementoId} não encontrado`);
        return null;
    }
    
    try {
        // Cálculo das componentes
        const impactoBruto = faturamento * aliquota;
        const reducaoPorCreditos = creditos;
        const efeitoPrazoPagamento = impactoBruto * (pmr / 30) * 0.1; // Custo financeiro estimado
        const efeitoMargemLiquida = impactoBruto * (margemLiquida / 100);
        const impactoLiquido = impactoBruto - reducaoPorCreditos + efeitoPrazoPagamento - efeitoMargemLiquida;
        
        // Verificar plugin para waterfall - se não existir, criar gráfico de barras empilhadas
        if (!Chart.controllers.waterfall) {
            console.warn("Plugin waterfall não encontrado, criando gráfico alternativo");
            return criarGraficoBarrasAlternativo(
                ["Impacto Bruto", "Créditos", "Prazo Pagamento", "Margem Líquida", "Impacto Líquido"],
                [impactoBruto, -reducaoPorCreditos, efeitoPrazoPagamento, -efeitoMargemLiquida, impactoLiquido],
                elemento
            );
        }
        
        // Inicializar e retornar o gráfico waterfall
        return new Chart(elemento, {
            type: 'waterfall',
            data: {
                labels: ['Impacto Bruto', 'Créditos', 'Prazo Pagamento', 'Margem Líquida', 'Impacto Líquido'],
                datasets: [{
                    data: [impactoBruto, -reducaoPorCreditos, efeitoPrazoPagamento, -efeitoMargemLiquida, impactoLiquido],
                    backgroundColor: [
                        '#DB4437', // Vermelho - Impacto Bruto
                        '#0F9D58', // Verde - Créditos (redução)
                        '#DB4437', // Vermelho - Efeito Prazo
                        '#0F9D58', // Verde - Margem (absorção)
                        '#4285F4'  // Azul - Resultado líquido
                    ],
                    borderColor: 'rgba(0, 0, 0, 0.1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Decomposição do Impacto do Split Payment'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return SimuladorSplitPayment.formatters.formatarMoeda(context.raw);
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        title: {
                            display: true,
                            text: 'R$ (Milhares)'
                        },
                        ticks: {
                            callback: function(value) {
                                return SimuladorSplitPayment.formatters.formatarMoeda(value);
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error("Erro ao gerar gráfico waterfall:", error);
        return null;
    }
}

// Função auxiliar para criar gráfico alternativo
function criarGraficoBarrasAlternativo(labels, valores, elemento) {
    const positivos = [];
    const negativos = [];
    
    for (let i = 0; i < valores.length; i++) {
        if (valores[i] >= 0) {
            positivos.push(valores[i]);
            negativos.push(0);
        } else {
            positivos.push(0);
            negativos.push(Math.abs(valores[i]));
        }
    }
    
    return new Chart(elemento, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Impacto Positivo',
                    data: positivos,
                    backgroundColor: '#DB4437',
                    borderColor: 'rgba(0, 0, 0, 0.1)',
                    borderWidth: 1
                },
                {
                    label: 'Impacto Negativo',
                    data: negativos,
                    backgroundColor: '#0F9D58',
                    borderColor: 'rgba(0, 0, 0, 0.1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Decomposição do Impacto do Split Payment'
                }
            },
            scales: {
                y: {
                    stacked: false,
                    title: {
                        display: true,
                        text: 'R$ (Milhares)'
                    },
                    ticks: {
                        callback: function(value) {
                            return SimuladorSplitPayment.formatters.formatarMoeda(value);
                        }
                    }
                },
                x: {
                    stacked: true
                }
            }
        }
    });
}