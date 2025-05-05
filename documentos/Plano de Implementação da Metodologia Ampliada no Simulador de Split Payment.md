# Plano de Implementação da Metodologia Ampliada no Simulador de Split Payment

Analisei detalhadamente os documentos fornecidos e elaborei um plano abrangente para adaptar a "Metodologia Ampliada de Cálculo do Impacto do Split Payment" ao seu projeto atual em HTML, JS e CSS. Esta implementação enriquecerá significativamente seu simulador, tornando-o mais preciso e valioso para os usuários.

## Visão Geral das Implementações

A adaptação será feita em módulos específicos, seguindo a estrutura existente do projeto:

1. **Núcleo Matemático**: Implementação das fórmulas e algoritmos centrais
2. **Visualizações**: Criação de gráficos avançados para análise visual
3. **Estratégias de Mitigação**: Módulo ampliado para simulação de estratégias
4. **Memória de Cálculo**: Sistema detalhado de registro de cálculos
5. **UI/UX**: Melhorias na interface para acomodar as novas funcionalidades

Vamos às orientações detalhadas para cada arquivo que precisa ser criado ou modificado:

## 1. Alterações no Núcleo Matemático

### 1.1. Arquivo: `js/simulation/calculation.js`

Adicionar as seguintes funções ao arquivo existente:

```javascript
/**
 * Calcula o impacto do split payment no capital de giro usando o modelo matemático ampliado
 * ΔCG = VT × (PMR + PR - PMR')
 * @param {Object} dados - Dados da simulação
 * @param {number} ano - Ano de referência para o cálculo
 * @returns {Object} Resultado do impacto no capital de giro
 */
calcularImpactoCapitalGiroAmpliado: function(dados, ano) {
    console.log('Calculando impacto ampliado no capital de giro para o ano:', ano);

    // Extrair parâmetros dos dados
    const faturamentoMensal = parseFloat(dados.faturamentoMensal);
    const setorSelecionado = this.obterConfiguracoesSetor(dados.setor);
    const aliquotaEfetiva = setorSelecionado.aliquota;
    const prazoMedioRecebimento = parseFloat(dados.prazoMedioRecebimento);
    const prazoRecolhimento = 25; // Prazo de recolhimento no regime atual (25 do mês seguinte)

    // Valor tributário sujeito ao split payment
    const valorTributario = faturamentoMensal * aliquotaEfetiva;

    // Prazo médio de recebimento ajustado para o split payment (geralmente zero, pois o tributo é retido imediatamente)
    const prazoMedioRecebimentoAjustado = 0;

    // Calcular o impacto no capital de giro usando a fórmula ampliada
    const impactoCapitalGiro = valorTributario * (prazoMedioRecebimento + prazoRecolhimento - prazoMedioRecebimentoAjustado) / 30;

    // Calcular o percentual de implementação para o ano
    const percentualImplementacao = this.obterPercentualImplementacao(ano);

    // Aplicar o percentual de implementação
    const impactoEfetivo = impactoCapitalGiro * percentualImplementacao;

    // Impacto em dias de faturamento
    const impactoDiasFaturamento = (prazoMedioRecebimento * percentualImplementacao);

    return {
        valorTributario: valorTributario,
        impactoBruto: impactoCapitalGiro,
        percentualImplementacao: percentualImplementacao,
        impactoEfetivo: impactoEfetivo,
        impactoDiasFaturamento: impactoDiasFaturamento
    };
},

/**
 * Calcula o impacto no ciclo financeiro da empresa
 * CF_split = PME + PMR - PMP - (PMR × VTR/VT)
 * @param {Object} dados - Dados da simulação
 * @param {number} ano - Ano de referência para o cálculo
 * @returns {Object} Resultado do impacto no ciclo financeiro
 */
calcularImpactoCicloFinanceiro: function(dados, ano) {
    console.log('Calculando impacto no ciclo financeiro para o ano:', ano);

    // Extrair parâmetros dos dados
    const prazoMedioEstoque = parseFloat(dados.prazoMedioEstoque) || 0;
    const prazoMedioRecebimento = parseFloat(dados.prazoMedioRecebimento) || 0;
    const prazoMedioPagamento = parseFloat(dados.prazoMedioPagamento) || 0;
    const setorSelecionado = this.obterConfiguracoesSetor(dados.setor);
    const aliquotaEfetiva = setorSelecionado.aliquota;

    // Percentual de implementação para o ano
    const percentualImplementacao = this.obterPercentualImplementacao(ano);

    // Ciclo financeiro atual
    const cicloFinanceiroAtual = prazoMedioEstoque + prazoMedioRecebimento - prazoMedioPagamento;

    // Redução do ciclo devido ao split payment
    const reducaoCiclo = prazoMedioRecebimento * aliquotaEfetiva * percentualImplementacao;

    // Ciclo financeiro após implementação do split payment
    const cicloFinanceiroSplit = cicloFinanceiroAtual - reducaoCiclo;

    return {
        cicloFinanceiroAtual: cicloFinanceiroAtual,
        reducaoCiclo: reducaoCiclo,
        cicloFinanceiroSplit: cicloFinanceiroSplit,
        percentualReducao: (reducaoCiclo / cicloFinanceiroAtual) * 100
    };
},

/**
 * Calcula o Fluxo de Caixa Descontado Ajustado para o split payment
 * FCDaj = Σ(FCO_t - VTR_t × (1 - CT_t/VTR_t))/(1 + TMA)^t
 * @param {Object} dados - Dados da simulação
 * @param {number} anoInicial - Ano inicial da projeção
 * @param {number} anoFinal - Ano final da projeção
 * @returns {Array} Array de objetos com os valores do FCD Ajustado por ano
 */
calcularFluxoCaixaDescontadoAjustado: function(dados, anoInicial, anoFinal) {
    console.log('Calculando FCD Ajustado de', anoInicial, 'a', anoFinal);

    const faturamentoMensal = parseFloat(dados.faturamentoMensal);
    const taxaCrescimento = parseFloat(dados.taxaCrescimento) / 100;
    const setorSelecionado = this.obterConfiguracoesSetor(dados.setor);
    const aliquotaEfetiva = setorSelecionado.aliquota;
    const margemOperacional = parseFloat(dados.margemOperacional) / 100;
    const taxaMinAtrat = 0.1; // Taxa mínima de atratividade (10% a.a.)

    const resultado = [];

    for (let ano = anoInicial; ano <= anoFinal; ano++) {
        // Fator de crescimento acumulado
        const fatorCrescimento = Math.pow(1 + taxaCrescimento, ano - anoInicial);

        // Faturamento anual ajustado pelo crescimento
        const faturamentoAnual = faturamentoMensal * 12 * fatorCrescimento;

        // Fluxo de caixa operacional (simplificado como faturamento * margem)
        const fco = faturamentoAnual * margemOperacional;

        // Valor tributário retido
        const valorTributario = faturamentoAnual * aliquotaEfetiva;

        // Créditos tributários (simplificado como percentual do valor tributário)
        const creditosTributarios = valorTributario * 0.3; // 30% de créditos

        // Percentual de implementação
        const percentualImplementacao = this.obterPercentualImplementacao(ano);

        // Valor efetivamente retido considerando implementação gradual
        const valorRetido = (valorTributario - creditosTributarios) * percentualImplementacao;

        // Fator de desconto
        const fatorDesconto = Math.pow(1 + taxaMinAtrat, ano - anoInicial);

        // Fluxo de caixa descontado ajustado
        const fcdAjustado = (fco - valorRetido) / fatorDesconto;

        resultado.push({
            ano: ano,
            faturamentoAnual: faturamentoAnual,
            fco: fco,
            valorTributario: valorTributario,
            creditosTributarios: creditosTributarios,
            valorRetido: valorRetido,
            fatorDesconto: fatorDesconto,
            fcdAjustado: fcdAjustado
        });
    }

    return resultado;
},

/**
 * Obtém o percentual de implementação do split payment para um determinado ano
 * @param {number} ano - Ano de referência
 * @returns {number} Percentual de implementação
 */
obterPercentualImplementacao: function(ano) {
    const cronograma = {
        2026: 0.10, // 10% em 2026
        2027: 0.25, // 25% em 2027
        2028: 0.40, // 40% em 2028
        2029: 0.55, // 55% em 2029
        2030: 0.70, // 70% em 2030
        2031: 0.85, // 85% em 2031
        2032: 0.95, // 95% em 2032
        2033: 1.00  // 100% em 2033
    };

    return cronograma[ano] || 0;
},

/**
 * Calcula o Índice de Sensibilidade Setorial
 * IS = (AE_s × PMR)/(CO × ML × 100)
 * @param {Object} dados - Dados da simulação
 * @returns {Object} Resultado do cálculo do índice de sensibilidade
 */
calcularIndiceSensibilidadeSetorial: function(dados) {
    const setorSelecionado = this.obterConfiguracoesSetor(dados.setor);
    const aliquotaEfetiva = setorSelecionado.aliquota;
    const prazoMedioRecebimento = parseFloat(dados.prazoMedioRecebimento) || 0;
    const cicloOperacional = parseFloat(dados.prazoMedioEstoque || 0) + prazoMedioRecebimento;
    const margemLiquida = parseFloat(dados.margemLiquida || dados.margemOperacional) / 100;

    // Calcular o índice de sensibilidade
    let indiceSensibilidade = 0;
    if (cicloOperacional > 0 && margemLiquida > 0) {
        indiceSensibilidade = (aliquotaEfetiva * prazoMedioRecebimento) / (cicloOperacional * margemLiquida * 100);
    }

    // Classificar o índice
    let classificacao = 'Baixo';
    if (indiceSensibilidade > 0.3) {
        classificacao = 'Alto';
    } else if (indiceSensibilidade > 0.15) {
        classificacao = 'Médio-Alto';
    } else if (indiceSensibilidade > 0.05) {
        classificacao = 'Médio';
    } else if (indiceSensibilidade > 0.02) {
        classificacao = 'Médio-Baixo';
    }

    return {
        valor: indiceSensibilidade,
        classificacao: classificacao,
        aliquotaEfetiva: aliquotaEfetiva,
        prazoMedioRecebimento: prazoMedioRecebimento,
        cicloOperacional: cicloOperacional,
        margemLiquida: margemLiquida
    };
}
```

### 1.2. Arquivo: `js/config/setores-config.js`

Atualizar o arquivo com a matriz de impacto setorial completa:

```javascript
/**
 * Configurações dos setores econômicos com parâmetros específicos
 * para cálculo do impacto do split payment
 */
const SetoresConfig = {
    // Configurações dos setores com alíquotas efetivas e parâmetros operacionais
    setores: {
        'comercio': {
            nome: 'Comércio Varejista',
            aliquota: 0.265, // 26,5%
            prazoMedioRecebimento: 15, // dias
            cicloOperacional: 45, // dias
            margemLiquida: 0.06, // 6%
            indiceSensibilidade: 'Alto'
        },
        'industria': {
            nome: 'Indústria',
            aliquota: 0.220, // 22,0%
            prazoMedioRecebimento: 45, // dias
            cicloOperacional: 90, // dias
            margemLiquida: 0.12, // 12%
            indiceSensibilidade: 'Médio-Alto'
        },
        'servicos': {
            nome: 'Serviços',
            aliquota: 0.265, // 26,5%
            prazoMedioRecebimento: 30, // dias
            cicloOperacional: 30, // dias
            margemLiquida: 0.18, // 18%
            indiceSensibilidade: 'Médio'
        },
        'agronegocio': {
            nome: 'Agronegócio',
            aliquota: 0.195, // 19,5%
            prazoMedioRecebimento: 60, // dias
            cicloOperacional: 180, // dias
            margemLiquida: 0.14, // 14%
            indiceSensibilidade: 'Baixo'
        },
        'construcao': {
            nome: 'Construção Civil',
            aliquota: 0.240, // 24,0%
            prazoMedioRecebimento: 45, // dias
            cicloOperacional: 120, // dias
            margemLiquida: 0.10, // 10%
            indiceSensibilidade: 'Médio-Alto'
        },
        'tecnologia': {
            nome: 'Tecnologia',
            aliquota: 0.265, // 26,5%
            prazoMedioRecebimento: 30, // dias
            cicloOperacional: 45, // dias
            margemLiquida: 0.20, // 20%
            indiceSensibilidade: 'Médio-Baixo'
        },
        'saude': {
            nome: 'Saúde',
            aliquota: 0.145, // 14,5%
            prazoMedioRecebimento: 45, // dias
            cicloOperacional: 60, // dias
            margemLiquida: 0.15, // 15%
            indiceSensibilidade: 'Médio-Baixo'
        },
        'educacao': {
            nome: 'Educação',
            aliquota: 0.125, // 12,5%
            prazoMedioRecebimento: 30, // dias
            cicloOperacional: 30, // dias
            margemLiquida: 0.20, // 20%
            indiceSensibilidade: 'Baixo'
        }
    },

    /**
     * Obtém as configurações de um setor específico
     * @param {string} codigoSetor - Código do setor
     * @returns {Object} Configurações do setor
     */
    obterConfiguracao: function(codigoSetor) {
        return this.setores[codigoSetor] || this.setores['comercio']; // Default para comércio
    },

    /**
     * Lista todos os setores disponíveis
     * @returns {Array} Array de objetos com código e nome dos setores
     */
    listarSetores: function() {
        return Object.keys(this.setores).map(codigo => {
            return {
                codigo: codigo,
                nome: this.setores[codigo].nome
            };
        });
    }
};
```

## 2. Implementação das Visualizações

### 2.1. Arquivo: `js/ui/charts-manager.js`

Adicionar os seguintes métodos ao arquivo existente:

```javascript
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
 * Gera o gráfico de decomposição do impacto (waterfall)
 * @param {string} containerId - ID do elemento container do gráfico
 * @param {Object} dados - Dados para o gráfico
 */
gerarGraficoWaterfallImpacto: function(containerId, dados) {
    const ctx = document.getElementById(containerId).getContext('2d');

    // Configurar plugin para gráfico waterfall
    const waterfallPlugin = {
        id: 'waterfall',
        beforeDatasetsDraw: function(chart) {
            const ctx = chart.ctx;
            const meta = chart.getDatasetMeta(0);
            let xRight = 0;
            let xLeft = 0;

            for (let i = 0; i < meta.data.length; i++) {
                const element = meta.data[i];
                const value = chart.data.datasets[0].data[i];

                if (i === 0 || i === meta.data.length - 1 || value > 0) {
                    // Primeiro item, último item ou valor positivo
                    element._model.base = element._model.y + element._model.height;
                    element._model.width = 20;
                } else {
                    // Valor negativo
                    element._model.base = element._model.y;
                    element._model.y = element._model.base + element._model.height;
                    element._model.width = 20;
                }

                if (i > 0 && i < meta.data.length - 1) {
                    // Conectar barras
                    ctx.save();
                    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
                    ctx.beginPath();
                    xRight = element._model.x - element._model.width / 2;
                    xLeft = meta.data[i-1]._model.x + meta.data[i-1]._model.width / 2;
                    ctx.moveTo(xLeft, meta.data[i-1]._model.base);
                    ctx.lineTo(xRight, element._model.base);
                    ctx.stroke();
                    ctx.restore();
                }
            }
        }
    };

    // Configurar dados para o gráfico
    const dadosGrafico = {
        labels: ['Impacto Bruto', 'Créditos', 'Prazo Pagamento', 'Margem Líquida', 'Impacto Líquido'],
        datasets: [{
            data: [
                dados.impactoBruto, 
                -dados.reducaoPorCreditos, 
                dados.efeitoPrazoPagamento, 
                -dados.efeitoMargemLiquida, 
                dados.impactoLiquido
            ],
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
                    text: 'Decomposição do Impacto do Split Payment',
                    font: { size: 16 }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const valor = context.parsed.y;
                            return 'R$ ' + Formatters.formatarMoeda(Math.abs(valor)) + (valor < 0 ? ' (Redução)' : '');
                        }
                    }
                },
                waterfall: true
            },
            scales: {
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
            }
        },
        plugins: [waterfallPlugin]
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
 * Gera o gráfico de sensibilidade setorial (mapa de calor)
 * @param {string} containerId - ID do elemento container do gráfico
 * @param {Object} dados - Dados para o gráfico
 */
gerarMapaCalorSensibilidade: function(containerId, dados) {
    // Versão simplificada do mapa de calor para Chart.js
    const ctx = document.getElementById(containerId).getContext('2d');

    // Criar um gráfico de barras empilhadas que simula um mapa de calor
    const dadosGrafico = {
        labels: dados.setores,
        datasets: dados.parametros.map((parametro, index) => {
            return {
                label: parametro,
                data: dados.matriz[index],
                backgroundColor: function(context) {
                    const valor = context.dataset.data[context.dataIndex];
                    // Escala de cores de baixo para alto
                    if (valor < 0.25) return 'rgba(0, 200, 0, 0.8)';   // Baixo
                    if (valor < 0.5) return 'rgba(200, 200, 0, 0.8)';  // Médio-Baixo
                    if (valor < 0.75) return 'rgba(255, 165, 0, 0.8)'; // Médio
                    return 'rgba(255, 0, 0, 0.8)';                    // Alto
                }
            };
        })
    };

    new Chart(ctx, {
        type: 'bar',
        data: dadosGrafico,
        options: {
            responsive: true,
            scales: {
                x: {
                    stacked: true,
                    title: {
                        display: true,
                        text: 'Setores'
                    }
                },
                y: {
                    stacked: true,
                    title: {
                        display: true,
                        text: 'Sensibilidade'
                    },
                    max: 1
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Mapa de Sensibilidade Setorial ao Split Payment'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const parametro = context.dataset.label;
                            const setor = context.label;
                            const valor = context.parsed.y;
                            let nivel = 'Baixo';
                            if (valor >= 0.75) nivel = 'Alto';
                            else if (valor >= 0.5) nivel = 'Médio';
                            else if (valor >= 0.25) nivel = 'Médio-Baixo';

                            return `${setor}: ${parametro} - Sensibilidade ${nivel} (${(valor * 100).toFixed(1)}%)`;
                        }
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
```

## 3. Módulo de Estratégias de Mitigação

### 3.1. Arquivo: `js/simulation/strategies.js`

Criar este novo arquivo com o seguinte conteúdo:

```javascript
/**
 * Módulo de estratégias de mitigação do impacto do split payment
 */
const StrategiesManager = {
    /**
     * Calcula o impacto da estratégia de ajuste de preços
     * Compensacao_AP = F × AP × (1 + (EP × AP)/100)
     * @param {Object} dados - Dados da simulação
     * @param {Object} parametros - Parâmetros específicos da estratégia
     * @returns {Object} Resultado do cálculo
     */
    calcularAjustePrecos: function(dados, parametros) {
        console.log('Calculando estratégia de ajuste de preços', parametros);

        const faturamentoMensal = parseFloat(dados.faturamentoMensal);
        const percentualAumento = parseFloat(parametros.percentualAumento) / 100;
        const elasticidadePreco = parseFloat(parametros.elasticidadePreco);

        // Calcular o impacto na demanda
        const impactoDemanda = percentualAumento * elasticidadePreco;

        // Calcular a compensação pelo ajuste de preços
        const compensacao = faturamentoMensal * percentualAumento * (1 + (elasticidadePreco * percentualAumento) / 100);

        return {
            faturamentoOriginal: faturamentoMensal,
            percentualAumento: percentualAumento * 100,
            elasticidadePreco: elasticidadePreco,
            impactoDemanda: impactoDemanda * 100,
            faturamentoAjustado: faturamentoMensal * (1 + percentualAumento) * (1 - impactoDemanda),
            compensacao: compensacao,
            eficacia: (compensacao / (faturamentoMensal * 0.265)) * 100 // Eficácia em relação ao impacto típico
        };
    },

    /**
     * Calcula o impacto da estratégia de renegociação de prazos com fornecedores
     * Impacto_RP = PF × (AP/30) × PP × (1 - CP/100)
     * @param {Object} dados - Dados da simulação
     * @param {Object} parametros - Parâmetros específicos da estratégia
     * @returns {Object} Resultado do cálculo
     */
    calcularRenegociacaoPrazos: function(dados, parametros) {
        console.log('Calculando estratégia de renegociação de prazos', parametros);

        const pagamentosFornecedores = parseFloat(dados.custosMensais || dados.faturamentoMensal * 0.7); // 70% do faturamento se não informado
        const aumentoPrazo = parseFloat(parametros.aumentoPrazo);
        const percentualFornecedores = parseFloat(parametros.percentualFornecedores) / 100;
        const custoContrapartida = parseFloat(parametros.custoContrapartida) / 100;

        // Calcular o impacto da renegociação
        const impactoBruto = pagamentosFornecedores * (aumentoPrazo / 30) * percentualFornecedores;
        const custoTotal = impactoBruto * custoContrapartida;
        const impactoLiquido = impactoBruto - custoTotal;

        return {
            pagamentosFornecedores: pagamentosFornecedores,
            aumentoPrazo: aumentoPrazo,
            percentualFornecedores: percentualFornecedores * 100,
            custoContrapartida: custoContrapartida * 100,
            impactoBruto: impactoBruto,
            custoTotal: custoTotal,
            impactoLiquido: impactoLiquido,
            eficacia: (impactoLiquido / (dados.faturamentoMensal * 0.265)) * 100 // Eficácia em relação ao impacto típico
        };
    },

    /**
     * Calcula o impacto da estratégia de antecipação de recebíveis
     * Impacto_AR = F × (PP/100) × PA × PMA × (1 - (TA × PMA)/(30 × 100))
     * @param {Object} dados - Dados da simulação
     * @param {Object} parametros - Parâmetros específicos da estratégia
     * @returns {Object} Resultado do cálculo
     */
    calcularAntecipacaoRecebiveis: function(dados, parametros) {
        console.log('Calculando estratégia de antecipação de recebíveis', parametros);

        const faturamentoMensal = parseFloat(dados.faturamentoMensal);
        const percentualPrazo = parseFloat(parametros.percentualPrazo) / 100;
        const percentualAntecipacao = parseFloat(parametros.percentualAntecipacao) / 100;
        const prazoMedioAntecipado = parseFloat(parametros.prazoMedioAntecipado);
        const taxaDesconto = parseFloat(parametros.taxaDesconto) / 100;

        // Calcular o impacto da antecipação
        const valorAntecipado = faturamentoMensal * percentualPrazo * percentualAntecipacao;
        const custoAntecipacao = valorAntecipado * (taxaDesconto * prazoMedioAntecipado) / 30;
        const beneficioAntecipacao = valorAntecipado * (1 - (taxaDesconto * prazoMedioAntecipado) / (30 * 100));

        return {
            faturamentoMensal: faturamentoMensal,
            percentualPrazo: percentualPrazo * 100,
            percentualAntecipacao: percentualAntecipacao * 100,
            prazoMedioAntecipado: prazoMedioAntecipado,
            taxaDesconto: taxaDesconto * 100,
            valorAntecipado: valorAntecipado,
            custoAntecipacao: custoAntecipacao,
            beneficioAntecipacao: beneficioAntecipacao,
            eficacia: (beneficioAntecipacao / (faturamentoMensal * 0.265)) * 100 // Eficácia em relação ao impacto típico
        };
    },

    /**
     * Calcula o impacto da estratégia de captação de capital de giro
     * Custo_CG = NCG × VC × (TJ/100) × (1 + PP/12)
     * @param {Object} dados - Dados da simulação
     * @param {Object} parametros - Parâmetros específicos da estratégia
     * @returns {Object} Resultado do cálculo
     */
    calcularCapitalGiro: function(dados, parametros) {
        console.log('Calculando estratégia de captação de capital de giro', parametros);

        const necessidadeCapitalGiro = parseFloat(dados.impactoCapitalGiro || dados.faturamentoMensal * 0.265); // Impacto típico se não informado
        const percentualCaptacao = parseFloat(parametros.percentualCaptacao) / 100;
        const taxaJuros = parseFloat(parametros.taxaJuros) / 100;
        const prazoPagamento = parseFloat(parametros.prazoPagamento);
        const periodoCarencia = parseFloat(parametros.periodoCarencia || 0);

        // Calcular o custo da captação
        const valorCaptado = necessidadeCapitalGiro * percentualCaptacao;
        const custoFinanceiro = valorCaptado * taxaJuros * (1 + prazoPagamento / 12);
        const custoMensal = custoFinanceiro / prazoPagamento;

        // Ajustar pela carência
        const custoAjustado = periodoCarencia > 0 ? 
            valorCaptado * taxaJuros * periodoCarencia + custoFinanceiro :
            custoFinanceiro;

        return {
            necessidadeCapitalGiro: necessidadeCapitalGiro,
            percentualCaptacao: percentualCaptacao * 100,
            valorCaptado: valorCaptado,
            taxaJuros: taxaJuros * 100,
            prazoPagamento: prazoPagamento,
            periodoCarencia: periodoCarencia,
            custoFinanceiro: custoFinanceiro,
            custoMensal: custoMensal,
            custoAjustado: custoAjustado,
            beneficioLiquido: valorCaptado - custoAjustado,
            eficacia: (valorCaptado / necessidadeCapitalGiro) * 100 // Eficácia direta
        };
    },

    /**
     * Calcula o impacto da estratégia de ajuste no mix de produtos
     * Impacto_MIX = F × PA × (IR/100 + IM/100)
     * @param {Object} dados - Dados da simulação
     * @param {Object} parametros - Parâmetros específicos da estratégia
     * @returns {Object} Resultado do cálculo
     */
    calcularAjusteMixProdutos: function(dados, parametros) {
        console.log('Calculando estratégia de ajuste no mix de produtos', parametros);

        const faturamentoMensal = parseFloat(dados.faturamentoMensal);
        const percentualAjuste = parseFloat(parametros.percentualAjuste) / 100;
        const impactoReceita = parseFloat(parametros.impactoReceita) / 100;
        const impactoMargem = parseFloat(parametros.impactoMargem) / 100;

        // Calcular o impacto do ajuste no mix
        const impactoTotalReceita = faturamentoMensal * percentualAjuste * impactoReceita;
        const impactoTotalMargem = faturamentoMensal * percentualAjuste * impactoMargem;
        const impactoLiquido = faturamentoMensal * percentualAjuste * (impactoReceita + impactoMargem);

        return {
            faturamentoMensal: faturamentoMensal,
            percentualAjuste: percentualAjuste * 100,
            impactoReceita: impactoReceita * 100,
            impactoMargem: impactoMargem * 100,
            impactoTotalReceita: impactoTotalReceita,
            impactoTotalMargem: impactoTotalMargem,
            impactoLiquido: impactoLiquido,
            eficacia: (impactoLiquido / (faturamentoMensal * 0.265)) * 100 // Eficácia em relação ao impacto típico
        };
    },

    /**
     * Calcula o impacto da estratégia de incentivo a meios de pagamento favoráveis
     * Impacto_MP = F × (1 - TI/100) × (PVN - PVA)
     * @param {Object} dados - Dados da simulação
     * @param {Object} parametros - Parâmetros específicos da estratégia
     * @returns {Object} Resultado do cálculo
     */
    calcularIncentivoMeiosPagamento: function(dados, parametros) {
        console.log('Calculando estratégia de incentivo a meios de pagamento', parametros);

        const faturamentoMensal = parseFloat(dados.faturamentoMensal);
        const taxaIncentivo = parseFloat(parametros.taxaIncentivo) / 100;
        const percentualVistaAtual = parseFloat(parametros.percentualVistaAtual) / 100;
        const percentualVistaNovo = parseFloat(parametros.percentualVistaNovo) / 100;

        // Calcular o impacto do incentivo
        const diferencaPercentual = percentualVistaNovo - percentualVistaAtual;
        const impactoBruto = faturamentoMensal * diferencaPercentual;
        const custoIncentivo = faturamentoMensal * percentualVistaNovo * taxaIncentivo;
        const impactoLiquido = impactoBruto - custoIncentivo;

        return {
            faturamentoMensal: faturamentoMensal,
            taxaIncentivo: taxaIncentivo * 100,
            percentualVistaAtual: percentualVistaAtual * 100,
            percentualVistaNovo: percentualVistaNovo * 100,
            diferencaPercentual: diferencaPercentual * 100,
            impactoBruto: impactoBruto,
            custoIncentivo: custoIncentivo,
            impactoLiquido: impactoLiquido,
            eficacia: (impactoLiquido / (faturamentoMensal * 0.265)) * 100 // Eficácia em relação ao impacto típico
        };
    },

    /**
     * Calcula a eficácia combinada de múltiplas estratégias
     * @param {Object} dados - Dados da simulação
     * @param {Array} estrategias - Array de resultados das estratégias individuais
     * @returns {Object} Resultado do cálculo da estratégia combinada
     */
    calcularEstrategiaCombinada: function(dados, estrategias) {
        console.log('Calculando eficácia combinada das estratégias', estrategias);

        const impactoOriginal = parseFloat(dados.impactoCapitalGiro || dados.faturamentoMensal * 0.265);

        // Calcular o impacto combinado considerando fatores de interação
        let impactoCombinado = 0;
        let eficaciaCombinada = 0;

        // Fatores de interação para evitar dupla contagem
        const fatoresInteracao = {
            'ajustePrecos': 1.0,
            'renegociacaoPrazos': 0.9,
            'antecipacaoRecebiveis': 0.8,
            'capitalGiro': 0.7,
            'ajusteMixProdutos': 0.9,
            'incentivoMeiosPagamento': 0.8
        };

        // Calcular o impacto combinado
        estrategias.forEach((estrategia, index) => {
            const tipoEstrategia = Object.keys(estrategia)[0];
            const resultado = estrategia[tipoEstrategia];

            // Aplicar o fator de interação
            const fatorInteracao = fatoresInteracao[tipoEstrategia] || 0.8;

            // Verificar eficácia ou impacto líquido, dependendo da estratégia
            let contribuicao = 0;
            if (resultado.eficacia) {
                contribuicao = (resultado.eficacia / 100) * impactoOriginal * fatorInteracao;
            } else if (resultado.impactoLiquido) {
                contribuicao = resultado.impactoLiquido * fatorInteracao;
            } else if (resultado.beneficioLiquido) {
                contribuicao = resultado.beneficioLiquido * fatorInteracao;
            }

            impactoCombinado += contribuicao;
        });

        // Calcular a eficácia combinada
        eficaciaCombinada = (impactoCombinado / impactoOriginal) * 100;

        return {
            impactoOriginal: impactoOriginal,
            impactoCombinado: impactoCombinado,
            eficaciaCombinada: eficaciaCombinada,
            impactoResidual: impactoOriginal - impactoCombinado,
            percentualMitigacao: eficaciaCombinada
        };
    },

    /**
     * Calcula o Índice de Eficácia de Mitigação (IEM)
     * IEM = (ΔCG_Sem_Estrategia - ΔCG_Com_Estrategia) / ΔCG_Sem_Estrategia × 100
     * @param {number} impactoOriginal - Impacto sem estratégia
     * @param {number} impactoComEstrategia - Impacto com estratégia
     * @returns {number} Índice de Eficácia de Mitigação
     */
    calcularIndiceEficaciaMitigacao: function(impactoOriginal, impactoComEstrategia) {
        return ((impactoOriginal - impactoComEstrategia) / impactoOriginal) * 100;
    }
};
```

## 4. Implementação da Memória de Cálculo

### 4.1. Arquivo: `js/simulation/memoria-calculo.js`

Criar este novo arquivo com o seguinte conteúdo:

```javascript
/**
 * Módulo de geração de memória de cálculo detalhada
 */
const MemoriaCalculoManager = {
    /**
     * Gera a memória de cálculo para um determinado ano
     * @param {Object} dados - Dados da simulação
     * @param {number} ano - Ano para geração da memória
     * @returns {string} Texto formatado da memória de cálculo
     */
    gerarMemoriaCalculo: function(dados, ano) {
        console.log('Gerando memória de cálculo para o ano:', ano);

        // Obter configurações e parâmetros
        const faturamentoMensal = parseFloat(dados.faturamentoMensal);
        const faturamentoAnual = faturamentoMensal * 12;
        const setor = dados.setor;
        const configSetor = this.obterConfiguracoesSetor(setor);
        const aliquotaEfetiva = configSetor.aliquota;
        const prazoMedioRecebimento = parseFloat(dados.prazoMedioRecebimento) || 0;
        const prazoMedioPagamento = parseFloat(dados.prazoMedioPagamento) || 0;
        const prazoMedioEstoque = parseFloat(dados.prazoMedioEstoque) || 0;
        const cicloFinanceiro = prazoMedioEstoque + prazoMedioRecebimento - prazoMedioPagamento;
        const percentualVendaVista = parseFloat(dados.percentualVendaVista) || 30;
        const percentualVendaPrazo = 100 - percentualVendaVista;
        const margemOperacional = parseFloat(dados.margemOperacional) || 10;

        // Calcular impacto
        const valorImpostoMensal = faturamentoMensal * aliquotaEfetiva;
        const valorImpostoAnual = valorImpostoMensal * 12;
        const percentualImplementacao = this.obterPercentualImplementacao(ano);
        const impactoAnual = valorImpostoAnual * percentualImplementacao;

        // Cálculo do capital de giro
        const impactoRelativo = aliquotaEfetiva * percentualImplementacao;
        const impactoDias = prazoMedioRecebimento * impactoRelativo;
        const necessidadeCapitalGiro = (faturamentoMensal / 30) * impactoDias;

        // Impacto na rentabilidade
        const custoFinanceiroMensal = 0.02; // 2% a.m.
        const custoMensalCapitalGiro = impactoAnual / 12 * custoFinanceiroMensal;
        const custoAnualCapitalGiro = custoMensalCapitalGiro * 12;
        const impactoMargem = (custoAnualCapitalGiro / faturamentoAnual) * 100;
        const margemAjustada = margemOperacional - impactoMargem;

        // Formatação da memória de cálculo
        let memoria = '';

        memoria += `=== MEMÓRIA DE CÁLCULO - ANO ${ano} ===\n\n`;

        memoria += `=== PARÂMETROS BÁSICOS ===\n`;
        memoria += `Faturamento Mensal: R$ ${this.formatarMoeda(faturamentoMensal)}\n`;
        memoria += `Alíquota Efetiva: ${this.formatarPercentual(aliquotaEfetiva * 100)}\n`;
        memoria += `Prazo Médio de Recebimento: ${prazoMedioRecebimento} dias\n`;
        memoria += `Prazo Médio de Pagamento: ${prazoMedioPagamento} dias\n`;
        memoria += `Prazo Médio de Estoque: ${prazoMedioEstoque} dias\n`;
        memoria += `Ciclo Financeiro: ${cicloFinanceiro} dias\n`;
        memoria += `Percentual de Vendas à Vista: ${percentualVendaVista}%\n`;
        memoria += `Percentual de Vendas a Prazo: ${percentualVendaPrazo}%\n\n`;

        memoria += `=== CÁLCULO DO IMPACTO NO FLUXO DE CAIXA ===\n`;
        memoria += `Valor do Imposto Mensal: R$ ${this.formatarMoeda(faturamentoMensal)} × ${this.formatarPercentual(aliquotaEfetiva * 100)} = R$ ${this.formatarMoeda(valorImpostoMensal)}\n`;
        memoria += `Percentual de Implementação (${ano}): ${this.formatarPercentual(percentualImplementacao * 100)}\n`;
        memoria += `Impacto no Fluxo de Caixa: R$ ${this.formatarMoeda(valorImpostoAnual)} × ${this.formatarPercentual(percentualImplementacao * 100)} = R$ ${this.formatarMoeda(impactoAnual)}\n\n`;

        memoria += `=== ANÁLISE DO CAPITAL DE GIRO ===\n`;
        memoria += `Impacto em Dias de Faturamento: ${prazoMedioRecebimento} × ${this.formatarPercentual(impactoRelativo * 100)} = ${this.formatarNumero(impactoDias, 2)} dias\n`;
        memoria += `Necessidade Adicional de Capital de Giro: R$ ${this.formatarMoeda(necessidadeCapitalGiro)}\n\n`;

        memoria += `=== IMPACTO NA RENTABILIDADE ===\n`;
        memoria += `Margem Operacional Original: ${this.formatarPercentual(margemOperacional)}\n`;
        memoria += `Custo Financeiro Mensal: R$ ${this.formatarMoeda(impactoAnual / 12)} × ${this.formatarPercentual(custoFinanceiroMensal * 100)} = R$ ${this.formatarMoeda(custoMensalCapitalGiro)}\n`;
        memoria += `Custo Financeiro Anual: R$ ${this.formatarMoeda(custoMensalCapitalGiro)} × 12 = R$ ${this.formatarMoeda(custoAnualCapitalGiro)}\n`;
        memoria += `Impacto na Margem: R$ ${this.formatarMoeda(custoAnualCapitalGiro)} ÷ R$ ${this.formatarMoeda(faturamentoAnual)} = ${this.formatarPercentual(impactoMargem)}\n`;
        memoria += `Margem Ajustada: ${this.formatarPercentual(margemOperacional)} - ${this.formatarPercentual(impactoMargem)} = ${this.formatarPercentual(margemAjustada)}\n`;

        return memoria;
    },

    /**
     * Gera a memória de cálculo para as estratégias de mitigação
     * @param {Object} dados - Dados da simulação
     * @param {Object} estrategias - Resultados das estratégias de mitigação
     * @returns {string} Texto formatado da memória de cálculo das estratégias
     */
    gerarMemoriaCalculoEstrategias: function(dados, estrategias) {
        console.log('Gerando memória de cálculo para estratégias:', estrategias);

        let memoria = '';

        memoria += `=== IMPACTO DAS ESTRATÉGIAS DE MITIGAÇÃO ===\n\n`;

        // Ajuste de Preços
        if (estrategias.ajustePrecos) {
            const e = estrategias.ajustePrecos;
            memoria += `=== AJUSTE DE PREÇOS ===\n`;
            memoria += `Percentual de Aumento: ${this.formatarPercentual(e.percentualAumento)}\n`;
            memoria += `Elasticidade-Preço: ${this.formatarNumero(e.elasticidadePreco, 2)}\n`;
            memoria += `Impacto nas Vendas: ${this.formatarPercentual(e.impactoDemanda)}\n`;
            memoria += `Efeito Líquido no Fluxo: R$ ${this.formatarMoeda(e.compensacao)}\n\n`;
        }

        // Renegociação de Prazos
        if (estrategias.renegociacaoPrazos) {
            const e = estrategias.renegociacaoPrazos;
            memoria += `=== RENEGOCIAÇÃO DE PRAZOS ===\n`;
            memoria += `Aumento do Prazo: ${e.aumentoPrazo} dias\n`;
            memoria += `Percentual de Fornecedores: ${this.formatarPercentual(e.percentualFornecedores)}\n`;
            memoria += `Custo da Contrapartida: ${this.formatarPercentual(e.custoContrapartida)}\n`;
            memoria += `Efeito Líquido no Fluxo: R$ ${this.formatarMoeda(e.impactoLiquido)}\n\n`;
        }

        // Antecipação de Recebíveis
        if (estrategias.antecipacaoRecebiveis) {
            const e = estrategias.antecipacaoRecebiveis;
            memoria += `=== ANTECIPAÇÃO DE RECEBÍVEIS ===\n`;
            memoria += `Percentual de Antecipação: ${this.formatarPercentual(e.percentualAntecipacao)}\n`;
            memoria += `Taxa de Desconto: ${this.formatarPercentual(e.taxaDesconto)} a.m.\n`;
            memoria += `Prazo Médio Antecipado: ${e.prazoMedioAntecipado} dias\n`;
            memoria += `Efeito Líquido no Fluxo: R$ ${this.formatarMoeda(e.beneficioAntecipacao)}\n\n`;
        }

        // Capital de Giro
        if (estrategias.capitalGiro) {
            const e = estrategias.capitalGiro;
            memoria += `=== CAPITAL DE GIRO ===\n`;
            memoria += `Valor de Captação: ${this.formatarPercentual(e.percentualCaptacao)}\n`;
            memoria += `Taxa de Juros: ${this.formatarPercentual(e.taxaJuros)} a.m.\n`;
            memoria += `Prazo de Pagamento: ${e.prazoPagamento} meses\n`;
            memoria += `Carência: ${e.periodoCarencia} meses\n`;
            memoria += `Custo Total do Financiamento: R$ ${this.formatarMoeda(e.custoAjustado)}\n`;
            memoria += `Efeito Líquido no Fluxo: R$ ${this.formatarMoeda(e.beneficioLiquido)}\n\n`;
        }

        // Mix de Produtos
        if (estrategias.ajusteMixProdutos) {
            const e = estrategias.ajusteMixProdutos;
            memoria += `=== MIX DE PRODUTOS ===\n`;
            memoria += `Percentual de Ajuste: ${this.formatarPercentual(e.percentualAjuste)}\n`;
            memoria += `Impacto na Receita: ${this.formatarPercentual(e.impactoReceita)}\n`;
            memoria += `Impacto na Margem: ${this.formatarPercentual(e.impactoMargem)} p.p.\n`;
            memoria += `Efeito Líquido no Fluxo: R$ ${this.formatarMoeda(e.impactoLiquido)}\n\n`;
        }

        // Meios de Pagamento
        if (estrategias.incentivoMeiosPagamento) {
            const e = estrategias.incentivoMeiosPagamento;
            memoria += `=== MEIOS DE PAGAMENTO ===\n`;
            memoria += `Nova Distribuição: À Vista (${this.formatarPercentual(e.percentualVistaNovo)}%), A Prazo (${this.formatarPercentual(100 - e.percentualVistaNovo)}%)\n`;
            memoria += `Taxa de Incentivo: ${this.formatarPercentual(e.taxaIncentivo)}\n`;
            memoria += `Efeito Líquido no Fluxo: R$ ${this.formatarMoeda(e.impactoLiquido)}\n\n`;
        }

        // Resultado Combinado
        if (estrategias.combinada) {
            const e = estrategias.combinada;
            memoria += `=== RESULTADO COMBINADO ===\n`;
            memoria += `Impacto Original do Split Payment: R$ ${this.formatarMoeda(e.impactoOriginal)}\n`;
            memoria += `Mitigação Total: R$ ${this.formatarMoeda(e.impactoCombinado)}\n`;
            memoria += `Impacto Residual: R$ ${this.formatarMoeda(e.impactoResidual)} (${this.formatarPercentual(100 - e.percentualMitigacao)} do impacto original)\n`;
        }

        return memoria;
    },

    /**
     * Obtém as configurações de um setor específico
     * @param {string} setor - Código do setor
     * @returns {Object} Configurações do setor
     */
    obterConfiguracoesSetor: function(setor) {
        const setores = {
            'comercio': {
                nome: 'Comércio Varejista',
                aliquota: 0.265
            },
            'industria': {
                nome: 'Indústria',
                aliquota: 0.220
            },
            'servicos': {
                nome: 'Serviços',
                aliquota: 0.265
            },
            'agronegocio': {
                nome: 'Agronegócio',
                aliquota: 0.195
            },
            'construcao': {
                nome: 'Construção Civil',
                aliquota: 0.240
            },
            'tecnologia': {
                nome: 'Tecnologia',
                aliquota: 0.265
            },
            'saude': {
                nome: 'Saúde',
                aliquota: 0.145
            },
            'educacao': {
                nome: 'Educação',
                aliquota: 0.125
            }
        };

        return setores[setor] || setores['comercio']; // Default para comércio
    },

    /**
     * Obtém o percentual de implementação do split payment para um determinado ano
     * @param {number} ano - Ano de referência
     * @returns {number} Percentual de implementação
     */
    obterPercentualImplementacao: function(ano) {
        const cronograma = {
            2026: 0.10, // 10% em 2026
            2027: 0.25, // 25% em 2027
            2028: 0.40, // 40% em 2028
            2029: 0.55, // 55% em 2029
            2030: 0.70, // 70% em 2030
            2031: 0.85, // 85% em 2031
            2032: 0.95, // 95% em 2032
            2033: 1.00  // 100% em 2033
        };

        return cronograma[ano] || 0;
    },

    /**
     * Formata um valor numérico como moeda
     * @param {number} valor - Valor a ser formatado
     * @returns {string} Valor formatado como moeda
     */
    formatarMoeda: function(valor) {
        return valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },

    /**
     * Formata um valor numérico como percentual
     * @param {number} valor - Valor a ser formatado
     * @returns {string} Valor formatado como percentual
     */
    formatarPercentual: function(valor) {
        return valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
    },

    /**
     * Formata um valor numérico
     * @param {number} valor - Valor a ser formatado
     * @param {number} casasDecimais - Número de casas decimais
     * @returns {string} Valor formatado
     */
    formatarNumero: function(valor, casasDecimais = 2) {
        return valor.toLocaleString('pt-BR', { 
            minimumFractionDigits: casasDecimais, 
            maximumFractionDigits: casasDecimais 
        });
    }
};
```

## 5. Modificações no Arquivo HTML Principal

### 5.1. Arquivo: `index.html`

Adicionar novas seções ao arquivo HTML:

```html
<!-- Adicionar após a seção de resultados existente -->
<div class="tab-content" id="tab-analise-avancada" style="display: none;">
    <div class="section-header">
        <h2>Análise Avançada do Impacto</h2>
        <p>Visualização detalhada dos efeitos do Split Payment no capital de giro e fluxo de caixa</p>
    </div>

    <div class="grid-container">
        <div class="grid-item">
            <div class="result-card">
                <h3>Índice de Sensibilidade Setorial</h3>
                <div id="indice-sensibilidade-container">
                    <!-- Conteúdo dinâmico -->
                </div>
            </div>
        </div>

        <div class="grid-item">
            <div class="result-card">
                <h3>Comparativo de Fluxo de Caixa</h3>
                <div class="chart-container">
                    <canvas id="chart-fluxo-comparativo"></canvas>
                </div>
            </div>
        </div>
    </div>

    <div class="grid-container">
        <div class="grid-item">
            <div class="result-card">
                <h3>Evolução do Capital de Giro</h3>
                <div class="chart-container">
                    <canvas id="chart-capital-giro"></canvas>
                </div>
            </div>
        </div>

        <div class="grid-item">
            <div class="result-card">
                <h3>Decomposição do Impacto</h3>
                <div class="chart-container">
                    <canvas id="chart-waterfall-impacto"></canvas>
                </div>
            </div>
        </div>
    </div>

    <div class="grid-container">
        <div class="grid-item">
            <div class="result-card">
                <h3>Projeção com Margem Operacional</h3>
                <div class="chart-container">
                    <canvas id="chart-projecao-margem"></canvas>
                </div>
            </div>
        </div>

        <div class="grid-item">
            <div class="result-card">
                <h3>Análise de Sensibilidade Setorial</h3>
                <div class="chart-container">
                    <canvas id="chart-mapa-calor"></canvas>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Adicionar nova aba para estratégias de mitigação avançadas -->
<div class="tab-content" id="tab-estrategias-avancadas" style="display: none;">
    <div class="section-header">
        <h2>Estratégias de Mitigação Avançadas</h2>
        <p>Análise detalhada das estratégias para mitigar o impacto do Split Payment</p>
    </div>

    <div class="grid-container">
        <div class="grid-item">
            <div class="result-card">
                <h3>Simulador de Estratégias</h3>

                <div class="strategy-tabs">
                    <button class="strategy-tab-button active" data-strategy-tab="ajuste-precos">Ajuste de Preços</button>
                    <button class="strategy-tab-button" data-strategy-tab="renegociacao-prazos">Renegociação de Prazos</button>
                    <button class="strategy-tab-button" data-strategy-tab="antecipacao-recebiveis">Antecipação de Recebíveis</button>
                    <button class="strategy-tab-button" data-strategy-tab="capital-giro">Capital de Giro</button>
                    <button class="strategy-tab-button" data-strategy-tab="mix-produtos">Mix de Produtos</button>
                    <button class="strategy-tab-button" data-strategy-tab="meios-pagamento">Meios de Pagamento</button>
                </div>

                <!-- Formulários para cada estratégia -->
                <div class="strategy-tab-content" id="strategy-ajuste-precos">
                    <div class="form-group">
                        <label for="ajuste-precos-percentual">Percentual de Aumento:</label>
                        <input type="number" id="ajuste-precos-percentual" min="0" max="50" step="0.5" value="5" class="form-control">
                        <span class="input-group-text">%</span>
                    </div>
                    <div class="form-group">
                        <label for="ajuste-precos-elasticidade">Elasticidade-Preço:</label>
                        <input type="number" id="ajuste-precos-elasticidade" min="-5" max="0" step="0.1" value="-1.2" class="form-control">
                        <span class="input-group-text">fator</span>
                    </div>
                    <button id="btn-calcular-ajuste-precos" class="btn btn-primary">Calcular Impacto</button>
                </div>

                <div class="strategy-tab-content" id="strategy-renegociacao-prazos" style="display: none;">
                    <div class="form-group">
                        <label for="renegociacao-aumento-prazo">Aumento do Prazo:</label>
                        <input type="number" id="renegociacao-aumento-prazo" min="0" max="90" step="5" value="15" class="form-control">
                        <span class="input-group-text">dias</span>
                    </div>
                    <div class="form-group">
                        <label for="renegociacao-percentual-fornecedores">Percentual de Fornecedores:</label>
                        <input type="number" id="renegociacao-percentual-fornecedores" min="0" max="100" step="5" value="50" class="form-control">
                        <span class="input-group-text">%</span>
                    </div>
                    <div class="form-group">
                        <label for="renegociacao-custo-contrapartida">Custo da Contrapartida:</label>
                        <input type="number" id="renegociacao-custo-contrapartida" min="0" max="50" step="0.5" value="2" class="form-control">
                        <span class="input-group-text">%</span>
                    </div>
                    <button id="btn-calcular-renegociacao-prazos" class="btn btn-primary">Calcular Impacto</button>
                </div>

                <!-- Repetir para outras estratégias -->

                <div id="resultado-estrategia-container">
                    <!-- Conteúdo dinâmico dos resultados das estratégias -->
                </div>
            </div>
        </div>

        <div class="grid-item">
            <div class="result-card">
                <h3>Eficácia das Estratégias</h3>
                <div class="chart-container">
                    <canvas id="chart-eficacia-estrategias"></canvas>
                </div>
                <div id="resumo-estrategias-container" class="mt-3">
                    <!-- Resumo das estratégias -->
                </div>
            </div>
        </div>
    </div>
</div>
```

## 6. Implementação das Funções de Exportação

### 6.1. Arquivo: `js/export/pdf-export.js`

Atualizar o arquivo de exportação para PDF:

```javascript
/**
 * Amplia o relatório PDF com as análises avançadas
 * @param {Object} dados - Dados da simulação
 * @param {Object} resultado - Resultado da simulação
 * @param {Object} graficos - Referências aos gráficos gerados
 * @returns {jsPDF} Documento PDF
 */
gerarRelatorioPDFAvancado: function(dados, resultado, graficos) {
    console.log('Gerando relatório PDF avançado');

    // Inicializar o documento
    const doc = new jsPDF();
    let y = 20;

    // Título
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Relatório de Impacto do Split Payment', 105, y, { align: 'center' });
    y += 10;

    // Subtítulo
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.text('Análise Detalhada e Estratégias de Mitigação', 105, y, { align: 'center' });
    y += 15;

    // Dados da empresa
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Dados da Empresa', 14, y);
    y += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Setor: ${this.obterNomeSetor(dados.setor)}`, 14, y);
    y += 6;
    doc.text(`Faturamento Mensal: R$ ${this.formatarMoeda(dados.faturamentoMensal)}`, 14, y);
    y += 6;
    doc.text(`Prazo Médio de Recebimento: ${dados.prazoMedioRecebimento} dias`, 14, y);
    y += 6;
    doc.text(`Prazo Médio de Pagamento: ${dados.prazoMedioPagamento} dias`, 14, y);
    y += 6;
    doc.text(`Margem Operacional: ${dados.margemOperacional}%`, 14, y);
    y += 15;

    // Resultados da simulação
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Resumo do Impacto', 14, y);
    y += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Alíquota Efetiva: ${(resultado.aliquotaEfetiva * 100).toFixed(2)}%`, 14, y);
    y += 6;
    doc.text(`Impacto no Capital de Giro: R$ ${this.formatarMoeda(resultado.impactoCapitalGiro)}`, 14, y);
    y += 6;
    doc.text(`Impacto Relativo ao Faturamento: ${(resultado.impactoRelativo * 100).toFixed(2)}%`, 14, y);
    y += 6;
    doc.text(`Redução do Ciclo Financeiro: ${resultado.reducaoCiclo.toFixed(2)} dias`, 14, y);
    y += 15;

    // Adicionar gráficos
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Análise Gráfica', 14, y);
    y += 10;

    // Adicionar gráfico de fluxo comparativo
    if (graficos.fluxoComparativo) {
        doc.addImage(graficos.fluxoComparativo.toBase64Image(), 'PNG', 14, y, 180, 80);
        y += 90;
    }

    // Nova página para análise de estratégias
    doc.addPage();
    y = 20;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Estratégias de Mitigação do Impacto', 105, y, { align: 'center' });
    y += 15;

    // Resumo das estratégias
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Eficácia das Estratégias', 14, y);
    y += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    // Adicionar tabela de eficácia das estratégias
    if (resultado.estrategias) {
        const estrategias = resultado.estrategias;
        const headers = ['Estratégia', 'Impacto (R$)', 'Eficácia (%)'];
        const data = [];

        // Adicionar cada estratégia à tabela
        Object.keys(estrategias).forEach(key => {
            if (key !== 'combinada') {
                const estrategia = estrategias[key];
                let impacto = 0;
                let eficacia = 0;

                if (estrategia.impactoLiquido) {
                    impacto = estrategia.impactoLiquido;
                } else if (estrategia.beneficioLiquido) {
                    impacto = estrategia.beneficioLiquido;
                } else if (estrategia.compensacao) {
                    impacto = estrategia.compensacao;
                }

                if (estrategia.eficacia) {
                    eficacia = estrategia.eficacia;
                }

                data.push([
                    this.traduzirEstrategia(key),
                    'R$ ' + this.formatarMoeda(impacto),
                    this.formatarNumero(eficacia, 2) + '%'
                ]);
            }
        });

        // Adicionar estratégia combinada
        if (estrategias.combinada) {
            data.push([
                'Combinada',
                'R$ ' + this.formatarMoeda(estrategias.combinada.impactoCombinado),
                this.formatarNumero(estrategias.combinada.eficaciaCombinada, 2) + '%'
            ]);
        }

        // Desenhar a tabela
        doc.autoTable({
            startY: y,
            head: [headers],
            body: data,
            theme: 'grid',
            styles: {
                fontSize: 9
            },
            headStyles: {
                fillColor: [41, 128, 185],
                textColor: [255, 255, 255]
            },
            alternateRowStyles: {
                fillColor: [240, 240, 240]
            }
        });

        y = doc.lastAutoTable.finalY + 15;
    }

    // Adicionar gráfico de eficácia das estratégias
    if (graficos.eficaciaEstrategias) {
        doc.addImage(graficos.eficaciaEstrategias.toBase64Image(), 'PNG', 14, y, 180, 80);
        y += 90;
    }

    // Adicionar memória de cálculo em nova página
    doc.addPage();
    y = 20;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Memória de Cálculo', 105, y, { align: 'center' });
    y += 15;

    // Adicionar conteúdo da memória de cálculo
    if (resultado.memoriaCalculo) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);

        const linhas = resultado.memoriaCalculo.split('\n');
        linhas.forEach(linha => {
            doc.text(linha, 14, y);
            y += 4;

            if (y > 280) {
                doc.addPage();
                y = 20;
            }
        });
    }

    return doc;
},

/**
 * Traduz o código da estratégia para um nome legível
 * @param {string} estrategia - Código da estratégia
 * @returns {string} Nome legível da estratégia
 */
traduzirEstrategia: function(estrategia) {
    const traducoes = {
        'ajustePrecos': 'Ajuste de Preços',
        'renegociacaoPrazos': 'Renegociação de Prazos',
        'antecipacaoRecebiveis': 'Antecipação de Recebíveis',
        'capitalGiro': 'Capital de Giro',
        'ajusteMixProdutos': 'Mix de Produtos',
        'incentivoMeiosPagamento': 'Meios de Pagamento'
    };

    return traducoes[estrategia] || estrategia;
}
```

### 6.2. Arquivo: `js/export/excel-export.js`

Atualizar o arquivo de exportação para Excel:

```javascript
/**
 * Gera um relatório detalhado em Excel com análises avançadas
 * @param {Object} dados - Dados da simulação
 * @param {Object} resultado - Resultado da simulação
 * @returns {Workbook} Workbook do Excel
 */
gerarRelatorioExcelAvancado: function(dados, resultado) {
    console.log('Gerando relatório Excel avançado');

    // Criar novo workbook
    const wb = XLSX.utils.book_new();

    // Aba 1: Parâmetros
    const wsParametros = XLSX.utils.aoa_to_sheet([
        ['SIMULADOR DE IMPACTO DO SPLIT PAYMENT'],
        [''],
        ['PARÂMETROS DA SIMULAÇÃO'],
        [''],
        ['Dados da Empresa'],
        ['Setor', this.obterNomeSetor(dados.setor)],
        ['Faturamento Mensal', parseFloat(dados.faturamentoMensal)],
        ['Prazo Médio de Recebimento', parseFloat(dados.prazoMedioRecebimento)],
        ['Prazo Médio de Pagamento', parseFloat(dados.prazoMedioPagamento)],
        ['Prazo Médio de Estoque', parseFloat(dados.prazoMedioEstoque || 0)],
        ['Margem Operacional', parseFloat(dados.margemOperacional)],
        ['Percentual de Vendas à Vista', parseFloat(dados.percentualVendaVista || 30)],
        [''],
        ['Parâmetros do Split Payment'],
        ['Alíquota Efetiva', resultado.aliquotaEfetiva],
        ['Impacto no Capital de Giro (R$)', resultado.impactoCapitalGiro],
        ['Impacto Relativo ao Faturamento (%)', resultado.impactoRelativo * 100],
        ['Redução do Ciclo Financeiro (dias)', resultado.reducaoCiclo]
    ]);

    // Aplicar estilos
    this.aplicarEstilosExcel(wsParametros);
    XLSX.utils.book_append_sheet(wb, wsParametros, 'Parâmetros');

    // Aba 2: Projeção Temporal
    const headerProjecao = ['Ano', 'Implementação (%)', 'Faturamento Anual (R$)', 'Impacto Bruto (R$)', 'Impacto Efetivo (R$)', 'Redução do Ciclo (dias)', 'Margem Operacional (%)'];
    const dataProjecao = [headerProjecao];

    resultado.projecaoTemporal.forEach(ano => {
        dataProjecao.push([
            ano.ano,
            ano.percentualImplementacao * 100,
            ano.faturamentoAnual,
            ano.impactoBruto,
            ano.impactoEfetivo,
            ano.reducaoCiclo,
            ano.margemOperacional
        ]);
    });

    const wsProjecao = XLSX.utils.aoa_to_sheet(dataProjecao);
    this.aplicarEstilosExcel(wsProjecao);
    XLSX.utils.book_append_sheet(wb, wsProjecao, 'Projeção Temporal');

    // Aba 3: Estratégias de Mitigação
    if (resultado.estrategias) {
        const headerEstrategias = ['Estratégia', 'Impacto (R$)', 'Eficácia (%)', 'Detalhes'];
        const dataEstrategias = [headerEstrategias];

        Object.keys(resultado.estrategias).forEach(key => {
            if (key !== 'combinada') {
                const estrategia = resultado.estrategias[key];
                let impacto = 0;
                let eficacia = 0;
                let detalhes = '';

                if (estrategia.impactoLiquido) {
                    impacto = estrategia.impactoLiquido;
                } else if (estrategia.beneficioLiquido) {
                    impacto = estrategia.beneficioLiquido;
                } else if (estrategia.compensacao) {
                    impacto = estrategia.compensacao;
                }

                if (estrategia.eficacia) {
                    eficacia = estrategia.eficacia;
                }

                // Gerar detalhes específicos de cada estratégia
```

## 6.2. Arquivo: `js/export/excel-export.js` (continuação)

```javascript
                // Gerar detalhes específicos de cada estratégia
                switch (key) {
                    case 'ajustePrecos':
                        detalhes = `Aumento: ${estrategia.percentualAumento}%, Elasticidade: ${estrategia.elasticidadePreco}, Impacto Demanda: ${estrategia.impactoDemanda}%`;
                        break;
                    case 'renegociacaoPrazos':
                        detalhes = `Aumento Prazo: ${estrategia.aumentoPrazo} dias, Fornecedores: ${estrategia.percentualFornecedores}%, Custo: ${estrategia.custoContrapartida}%`;
                        break;
                    case 'antecipacaoRecebiveis':
                        detalhes = `Antecipação: ${estrategia.percentualAntecipacao}%, Taxa: ${estrategia.taxaDesconto}% a.m., Prazo: ${estrategia.prazoMedioAntecipado} dias`;
                        break;
                    case 'capitalGiro':
                        detalhes = `Captação: ${estrategia.percentualCaptacao}%, Taxa: ${estrategia.taxaJuros}% a.m., Prazo: ${estrategia.prazoPagamento} meses`;
                        break;
                    case 'ajusteMixProdutos':
                        detalhes = `Ajuste: ${estrategia.percentualAjuste}%, Impacto Receita: ${estrategia.impactoReceita}%, Impacto Margem: ${estrategia.impactoMargem}%`;
                        break;
                    case 'incentivoMeiosPagamento':
                        detalhes = `Novo % à Vista: ${estrategia.percentualVistaNovo}%, Taxa Incentivo: ${estrategia.taxaIncentivo}%`;
                        break;
                }

                dataEstrategias.push([
                    this.traduzirEstrategia(key),
                    impacto,
                    eficacia,
                    detalhes
                ]);
            }
        });

        // Adicionar estratégia combinada
        if (resultado.estrategias.combinada) {
            const combinada = resultado.estrategias.combinada;
            dataEstrategias.push([
                'Estratégia Combinada',
                combinada.impactoCombinado,
                combinada.eficaciaCombinada,
                `Mitigação: ${(combinada.percentualMitigacao).toFixed(2)}%, Impacto Residual: ${(combinada.impactoResidual).toFixed(2)}`
            ]);
        }

        const wsEstrategias = XLSX.utils.aoa_to_sheet(dataEstrategias);
        this.aplicarEstilosExcel(wsEstrategias);
        XLSX.utils.book_append_sheet(wb, wsEstrategias, 'Estratégias');
    }

    // Aba 4: Análise de Sensibilidade
    const headerSensibilidade = ['Setor', 'Alíquota Efetiva (%)', 'PMR (dias)', 'Ciclo Operacional (dias)', 'Margem Líquida (%)', 'Índice de Sensibilidade', 'Classificação'];
    const dataSensibilidade = [headerSensibilidade];

    // Adicionar dados de sensibilidade setorial
    const setores = {
        'comercio': { nome: 'Comércio Varejista', aliquota: 26.5, pmr: 15, ciclo: 45, margem: 6, indice: 'Alto' },
        'industria': { nome: 'Indústria', aliquota: 22.0, pmr: 45, ciclo: 90, margem: 12, indice: 'Médio-Alto' },
        'servicos': { nome: 'Serviços', aliquota: 26.5, pmr: 30, ciclo: 30, margem: 18, indice: 'Médio' },
        'agronegocio': { nome: 'Agronegócio', aliquota: 19.5, pmr: 60, ciclo: 180, margem: 14, indice: 'Baixo' },
        'construcao': { nome: 'Construção Civil', aliquota: 24.0, pmr: 45, ciclo: 120, margem: 10, indice: 'Médio-Alto' },
        'tecnologia': { nome: 'Tecnologia', aliquota: 26.5, pmr: 30, ciclo: 45, margem: 20, indice: 'Médio-Baixo' },
        'saude': { nome: 'Saúde', aliquota: 14.5, pmr: 45, ciclo: 60, margem: 15, indice: 'Médio-Baixo' },
        'educacao': { nome: 'Educação', aliquota: 12.5, pmr: 30, ciclo: 30, margem: 20, indice: 'Baixo' }
    };

    Object.keys(setores).forEach(key => {
        const setor = setores[key];
        // Cálculo aproximado do índice de sensibilidade
        const indiceSensibilidade = (setor.aliquota * setor.pmr) / (setor.ciclo * setor.margem * 100);

        dataSensibilidade.push([
            setor.nome,
            setor.aliquota,
            setor.pmr,
            setor.ciclo,
            setor.margem,
            indiceSensibilidade.toFixed(4),
            setor.indice
        ]);
    });

    const wsSensibilidade = XLSX.utils.aoa_to_sheet(dataSensibilidade);
    this.aplicarEstilosExcel(wsSensibilidade);
    XLSX.utils.book_append_sheet(wb, wsSensibilidade, 'Análise de Sensibilidade');

    // Aba 5: Memória de Cálculo
    if (resultado.memoriaCalculo) {
        // Converter a memória de cálculo em formato de linhas para o Excel
        const linhas = resultado.memoriaCalculo.split('\n');
        const dataMemoria = linhas.map(linha => [linha]);

        const wsMemoria = XLSX.utils.aoa_to_sheet(dataMemoria);
        XLSX.utils.book_append_sheet(wb, wsMemoria, 'Memória de Cálculo');
    }

    return wb;
},

/**
 * Aplica estilos básicos a uma planilha Excel
 * @param {Object} ws - Worksheet do Excel
 */
aplicarEstilosExcel: function(ws) {
    // Definir largura das colunas
    ws['!cols'] = [
        { wch: 25 }, // Coluna A
        { wch: 20 }, // Coluna B
        { wch: 20 }, // Coluna C
        { wch: 40 }  // Coluna D
    ];

    // Outras configurações de estilo podem ser adicionadas aqui

    return ws;
},

/**
 * Traduz o código do setor para um nome legível
 * @param {string} setor - Código do setor
 * @returns {string} Nome legível do setor
 */
obterNomeSetor: function(setor) {
    const setores = {
        'comercio': 'Comércio Varejista',
        'industria': 'Indústria',
        'servicos': 'Serviços',
        'agronegocio': 'Agronegócio',
        'construcao': 'Construção Civil',
        'tecnologia': 'Tecnologia',
        'saude': 'Saúde',
        'educacao': 'Educação'
    };

    return setores[setor] || setor;
},

/**
 * Formata um valor numérico como moeda
 * @param {number} valor - Valor a ser formatado
 * @returns {string} Valor formatado como moeda
 */
formatarMoeda: function(valor) {
    return valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
},

/**
 * Formata um valor numérico
 * @param {number} valor - Valor a ser formatado
 * @param {number} casasDecimais - Número de casas decimais
 * @returns {string} Valor formatado
 */
formatarNumero: function(valor, casasDecimais = 2) {
    return valor.toLocaleString('pt-BR', { 
        minimumFractionDigits: casasDecimais, 
        maximumFractionDigits: casasDecimais 
    });
}
```

## 7. Integração no Arquivo Main.js

### 7.1. Arquivo: `js/main.js`

Adicionar código para inicializar e integrar as novas funcionalidades:

```javascript
// Adicionar após as inicializações existentes, antes do fechamento da função init

// Inicializar gerenciadores de estratégias e memória de cálculo
initEstrategiasMitigacao: function() {
    console.log('Inicializando gerenciador de estratégias de mitigação');

    // Inicializar navegação entre estratégias
    document.querySelectorAll('.strategy-tab-button').forEach(button => {
        button.addEventListener('click', function() {
            // Remover classe ativa de todos os botões
            document.querySelectorAll('.strategy-tab-button').forEach(btn => {
                btn.classList.remove('active');
            });

            // Adicionar classe ativa ao botão clicado
            this.classList.add('active');

            // Esconder todos os conteúdos
            document.querySelectorAll('.strategy-tab-content').forEach(content => {
                content.style.display = 'none';
            });

            // Mostrar o conteúdo correspondente
            const estrategiaId = this.getAttribute('data-strategy-tab');
            document.getElementById('strategy-' + estrategiaId).style.display = 'block';
        });
    });

    // Inicializar botões de cálculo de estratégias
    document.getElementById('btn-calcular-ajuste-precos').addEventListener('click', function() {
        const parametros = {
            percentualAumento: document.getElementById('ajuste-precos-percentual').value,
            elasticidadePreco: document.getElementById('ajuste-precos-elasticidade').value
        };

        // Obter dados da simulação atual
        const dadosSimulacao = SimulatorManager.obterDadosSimulacao();

        // Calcular impacto da estratégia
        const resultado = StrategiesManager.calcularAjustePrecos(dadosSimulacao, parametros);

        // Exibir resultado
        const container = document.getElementById('resultado-estrategia-container');
        container.innerHTML = `
            <div class="result-section">
                <h4>Resultado da Simulação</h4>
                <div class="result-item">
                    <span class="result-label">Percentual de Aumento:</span>
                    <span class="result-value">${resultado.percentualAumento.toFixed(2)}%</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Impacto nas Vendas:</span>
                    <span class="result-value">${resultado.impactoDemanda.toFixed(2)}%</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Faturamento Ajustado:</span>
                    <span class="result-value">R$ ${Formatters.formatarMoeda(resultado.faturamentoAjustado)}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Compensação no Fluxo:</span>
                    <span class="result-value">R$ ${Formatters.formatarMoeda(resultado.compensacao)}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Eficácia da Estratégia:</span>
                    <span class="result-value">${resultado.eficacia.toFixed(2)}%</span>
                </div>
            </div>
        `;

        // Atualizar gráfico de eficácia
        this.atualizarGraficoEficaciaEstrategias();
    }.bind(this));

    // Adicionar event listeners para os outros botões de estratégias...
    // Implementar de forma similar ao exemplo acima
},

/**
 * Atualiza o gráfico de eficácia das estratégias
 */
atualizarGraficoEficaciaEstrategias: function() {
    // Coletar dados de todas as estratégias calculadas
    const estrategias = {
        'semEstrategia': 100, // Valor base sem mitigação
        'ajustePrecos': 0,
        'renegociacaoPrazos': 0,
        'antecipacaoRecebiveis': 0,
        'capitalGiro': 0,
        'ajusteMixProdutos': 0,
        'incentivoMeiosPagamento': 0,
        'combinada': 0
    };

    // Atualizar com os valores calculados (simplificado para exemplo)
    // Na implementação real, estes dados viriam dos cálculos efetivos

    // Gerar gráfico
    const chartData = {
        eficaciaEstrategias: [
            estrategias.semEstrategia,
            estrategias.ajustePrecos,
            estrategias.renegociacaoPrazos,
            estrategias.antecipacaoRecebiveis,
            estrategias.capitalGiro,
            estrategias.ajusteMixProdutos,
            estrategias.incentivoMeiosPagamento,
            estrategias.combinada
        ]
    };

    ChartsManager.gerarGraficoEficaciaEstrategias('chart-eficacia-estrategias', chartData);
}
```

## 8. CSS para as Novas Funcionalidades

### 8.1. Arquivo: `css/main.css`

Adicionar estilos para as novas funcionalidades:

```css
/* Estilos para estratégias de mitigação */
.strategy-tabs {
    display: flex;
    flex-wrap: wrap;
    margin-bottom: 15px;
    border-bottom: 1px solid #ddd;
}

.strategy-tab-button {
    padding: 8px 12px;
    margin-right: 5px;
    margin-bottom: -1px;
    border: 1px solid transparent;
    border-radius: 4px 4px 0 0;
    background-color: transparent;
    cursor: pointer;
    transition: all 0.3s ease;
}

.strategy-tab-button:hover {
    background-color: #f8f9fa;
    border-color: #ddd #ddd transparent;
}

.strategy-tab-button.active {
    background-color: #fff;
    border-color: #ddd #ddd #fff;
    font-weight: bold;
}

.strategy-tab-content {
    padding: 15px;
    border: 1px solid #ddd;
    border-top: none;
    border-radius: 0 0 4px 4px;
    margin-bottom: 20px;
}

/* Estilos para resultados de estratégias */
.result-section {
    margin: 15px 0;
    padding: 15px;
    background-color: #f8f9fa;
    border-radius: 4px;
    border-left: 4px solid #4285F4;
}

.result-section h4 {
    margin-top: 0;
    color: #333;
    font-weight: bold;
}

.result-item {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
    padding-bottom: 8px;
    border-bottom: 1px solid #eee;
}

.result-item:last-child {
    border-bottom: none;
}

.result-label {
    font-weight: 500;
    color: #555;
}

.result-value {
    font-weight: bold;
    color: #333;
}

/* Estilos para análise avançada */
.indice-sensibilidade {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 150px;
    position: relative;
}

.indice-valor {
    position: absolute;
    font-size: 3rem;
    font-weight: bold;
}

.indice-classificacao {
    position: absolute;
    bottom: 10px;
    font-size: 1.2rem;
    font-weight: 500;
}

.classificacao-alto {
    color: #e74c3c;
}

.classificacao-medio-alto {
    color: #e67e22;
}

.classificacao-medio {
    color: #f39c12;
}

.classificacao-medio-baixo {
    color: #2ecc71;
}

.classificacao-baixo {
    color: #27ae60;
}

/* Estilos para gráficos ampliados */
.chart-container {
    width: 100%;
    height: 300px;
    position: relative;
}

/* Responsividade para tablets e dispositivos móveis */
@media (max-width: 768px) {
    .grid-container {
        grid-template-columns: 1fr;
    }

    .strategy-tabs {
        flex-direction: column;
    }

    .strategy-tab-button {
        width: 100%;
        margin-bottom: 5px;
        border-radius: 4px;
    }

    .chart-container {
        height: 250px;
    }
}
```

## 9. Plano de Implementação

Para implementar estas alterações, siga os seguintes passos:

1. **Crie os novos arquivos**:
   
   - `js/simulation/strategies.js`
   - `js/simulation/memoria-calculo.js`

2. **Modifique os arquivos existentes** na ordem especificada:
   
   - `js/simulation/calculation.js`
   - `js/config/setores-config.js`
   - `js/ui/charts-manager.js`
   - `js/main.js`
   - `js/export/pdf-export.js`
   - `js/export/excel-export.js`
   - `css/main.css`
   - `index.html`

3. **Teste cada módulo incremental**:
   
   - Primeiro, teste os cálculos fundamentais
   - Em seguida, teste as visualizações
   - Por fim, teste as funcionalidades de exportação

4. **Integre com a versão demo**:
   
   - Aplique a estratégia definida em "Estratégia para Versão de Demonstração do Simulador de Split Payment"
   - Limite os recursos avançados conforme a especificação de versão demo

## 10. Sugestões para a Divulgação do Produto

Além da implementação técnica, aqui estão algumas recomendações para divulgar seu simulador de Split Payment de forma mais eficaz do que o post do LinkedIn mencionado:

1. **Crie uma landing page focada nos resultados**:
   
   - Mostre exemplos visuais do simulador em ação
   - Inclua testemunhos de clientes que economizaram dinheiro usando o simulador
   - Destaque o ROI (Retorno sobre Investimento) com casos reais

2. **Produza um vídeo demonstrativo curto**:
   
   - Mostre o simulador resolvendo um problema real em 60-90 segundos
   - Destaque as visualizações e relatórios exclusivos
   - Termine com um CTA (Call to Action) claro para teste da versão demo

3. **Crie uma série de webinars educativos**:
   
   - "Como o Split Payment vai impactar seu fluxo de caixa em 2026?"
   - "5 estratégias para mitigar o impacto do Split Payment reveladas pelo simulador"
   - "Análise setorial: O impacto específico do Split Payment no seu negócio"

4. **Compartilhe insights baseados em dados**:
   
   - Crie infográficos comparando o impacto em diferentes setores
   - Publique white papers com análises aprofundadas usando o simulador
   - Produza relatórios periódicos sobre como as empresas estão se preparando

5. **Estabeleça parcerias estratégicas**:
   
   - Contadores e escritórios de contabilidade
   - Consultores financeiros e empresariais
   - Associações setoriais (varejo, indústria, serviços)
   - Empresas de software de gestão financeira e ERP

Este conjunto de melhorias transformará seu simulador em uma ferramenta muito mais potente e valiosa, capaz de ajudar empresas a navegar pelas complexidades do Split Payment com confiança, além de posicionar seu produto como uma solução premium no mercado.
