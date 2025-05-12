/**
 * Simulador de Fluxo de Caixa
 * Responsável pelos cálculos do impacto do Split Payment
 */
window.SimuladorFluxoCaixa = {
    /**
     * Coleta os dados do formulário de simulação e executa a simulação
     */
    simularImpacto: function() {
        console.log('Iniciando simulação...');

        // Coletar dados do formulário
        const dados = {
            empresa: document.getElementById('empresa').value,
            setor: document.getElementById('setor').value,
            regime: document.getElementById('regime').value,
            faturamento: this.validarNumero(this.extrairValorNumerico(document.getElementById('faturamento').value)),
    		margem: this.validarNumero(parseFloat(document.getElementById('margem').value), 15) / 100, // valor padrão de 15%
            pmr: parseInt(document.getElementById('pmr').value) || 30,
            pmp: parseInt(document.getElementById('pmp').value) || 30,
            pme: parseInt(document.getElementById('pme').value) || 30,
            percVista: parseFloat(document.getElementById('perc-vista').value) / 100,
            percPrazo: parseFloat(document.getElementById('perc-prazo').value) / 100,
            aliquota: parseFloat(document.getElementById('aliquota').value) / 100,
            tipoOperacao: document.getElementById('tipo-operacao').value,
            creditos: this.extrairValorNumerico(document.getElementById('creditos').value),
            dataInicial: document.getElementById('data-inicial').value,
            dataFinal: document.getElementById('data-final').value,
            cenario: document.getElementById('cenario').value,
            taxaCrescimento: parseFloat(document.getElementById('taxa-crescimento').value) / 100,
            taxaCapitalGiro: parseFloat(document.querySelector('#taxa-capital-giro') ? document.querySelector('#taxa-capital-giro').value : 2.1) / 100
        };

        // Validar dados
        if (!this.validarDadosSimulacao(dados)) {
            return;
        }

        // Executar simulação
        const resultados = this.simular(dados);

        // Exibir resultados
        this.exibirResultados(resultados, dados);

        // Atualizar memória de cálculo
        this.atualizarMemoriaCalculo(resultados.memoriaCalculo);

        // Identificar maior e menor impacto para resumo
		let maiorImpacto = { valor: 0, ano: '' };
		let menorImpacto = { valor: Number.MAX_SAFE_INTEGER, ano: '' };
		let variacaoTotal = 0;

		// Calcular valores de resumo a partir dos resultados
		const anosProjecao = Object.keys(resultados.projecaoTemporal.resultadosAnuais).sort();
		anosProjecao.forEach(ano => {
			const resultado = resultados.projecaoTemporal.resultadosAnuais[ano];
			const diferenca = this.validarNumero(resultado.diferencaCapitalGiro);

			// Acumular variação total
			variacaoTotal += diferenca;

			// Verificar maior impacto (em valores absolutos)
			if (Math.abs(diferenca) > Math.abs(maiorImpacto.valor)) {
				maiorImpacto = { valor: diferenca, ano: ano };
			}

			// Verificar menor impacto (em valores absolutos)
			if (Math.abs(diferenca) < Math.abs(menorImpacto.valor) && Math.abs(diferenca) > 0) {
				menorImpacto = { valor: diferenca, ano: ano };
			}
		});

		// Se não encontrou um menor impacto válido, ajustar para zero
		if (menorImpacto.valor === Number.MAX_SAFE_INTEGER) {
			menorImpacto = { valor: 0, ano: anosProjecao[0] || '' };
		}

		// Criar estrutura global com dados organizados para exportação
		window.ultimaSimulacao = {
			dados: dados,
			resultados: resultados,
			// Adicionar uma estrutura auxiliar simplificada para uso nas exportações
			resultadosExportacao: {
				anos: anosProjecao,
				impactoBase: resultados.impactoBase,
				resultadosPorAno: {}, // Será preenchido abaixo
				resumo: {
					variacaoTotal: variacaoTotal,
					impactoMedioAnual: anosProjecao.length > 0 ? variacaoTotal / anosProjecao.length : 0,
					anoMaiorImpacto: maiorImpacto.ano,
					valorMaiorImpacto: maiorImpacto.valor,
					anoMenorImpacto: menorImpacto.ano,
					valorMenorImpacto: menorImpacto.valor,
					tendenciaGeral: variacaoTotal > 0 ? 'aumento' : 'redução'
				}
			}
		};

		// Preencher resultados por ano em formato simplificado
		anosProjecao.forEach(ano => {
			const resultado = resultados.projecaoTemporal.resultadosAnuais[ano];

			// Validar valores para evitar NaN
			const impostoDevido = this.validarNumero(resultado.resultadoSplitPayment?.valorImposto);
			const valorAtual = this.validarNumero(resultado.resultadoAtual?.valorImposto);
			const diferenca = this.validarNumero(resultado.diferencaCapitalGiro);
			const percentualImpacto = this.validarNumero(resultado.percentualImpacto);

			// Adicionar ao objeto de resultados por ano
			window.ultimaSimulacao.resultadosExportacao.resultadosPorAno[ano] = {
				impostoDevido: impostoDevido,
				sistemaAtual: valorAtual,
				diferenca: diferenca,
				percentualImpacto: percentualImpacto,
				necessidadeAdicional: this.validarNumero(resultado.necessidadeAdicionalCapitalGiro),
				margemAjustada: this.validarNumero(resultado.margemOperacionalAjustada)
			};
		});

		console.log('Simulação concluída com sucesso', window.ultimaSimulacao);
    },

    /**
     * Extrai valor numérico de uma string formatada para moeda brasileira
     */
    extrairValorNumerico: function(valor) {
        if (!valor) return 0;
        
        // Remove tudo exceto dígitos, vírgulas e pontos
        const apenasNumeros = valor.replace(/[^\d,.]/g, '');
        
        // Trata formato brasileiro: converte vírgulas para pontos e remove pontos (separadores de milhar)
        let valorConvertido;
        if (apenasNumeros.indexOf(',') !== -1) {
            // Se tem vírgula, tratar como padrão brasileiro
            valorConvertido = apenasNumeros.replace(/\./g, '').replace(',', '.');
        } else {
            // Se não tem vírgula, pode ser formato americano ou inteiro
            valorConvertido = apenasNumeros;
        }
        
        // Converte para número e retorna
        const valorNumerico = parseFloat(valorConvertido);
        console.log('Extraindo valor numérico de:', valor, '→', valorNumerico);
        return isNaN(valorNumerico) ? 0 : valorNumerico;
    },
	
	 /**
	 * Valida um valor numérico, retornando um valor padrão caso seja inválido
	 * @param {any} valor - Valor a ser validado
	 * @param {number} valorPadrao - Valor padrão a ser retornado em caso de valor inválido
	 * @returns {number} - Valor numérico validado
	 */
	validarNumero: function(valor, valorPadrao = 0) {
		if (valor === undefined || valor === null || isNaN(parseFloat(valor))) {
			return valorPadrao;
		}
		return parseFloat(valor);
	},

    /**
     * Valida os dados da simulação
     */
    validarDadosSimulacao: function(dados) {
        if (!dados.empresa) {
            alert('Por favor, informe o nome da empresa.');
            return false;
        }

        if (!dados.setor) {
            alert('Por favor, selecione o setor de atividade.');
            return false;
        }

        if (!dados.regime) {
            alert('Por favor, selecione o regime tributário.');
            return false;
        }

        if (isNaN(dados.faturamento) || dados.faturamento <= 0) {
            alert('Por favor, informe um valor válido para o faturamento.');
            return false;
        }

        if (isNaN(dados.aliquota) || dados.aliquota <= 0) {
            alert('Por favor, informe uma alíquota válida.');
            return false;
        }

        return true;
    },

    /**
     * Exibe os resultados na interface
     */
    exibirResultados: function(resultados, dados) {
		const containerResultados = document.getElementById('resultados');
		if (!containerResultados) return;

		// Formatar valores para exibição
		const formatarMoeda = (valor) => {
			if (valor === undefined || valor === null) {
				return 'R$ 0,00';
			}
			return `R$ ${valor.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
		};
		const formatarPercent = (valor) => `${(valor * 100).toFixed(2)}%`;

		// Extrair dados principais
		const impacto = resultados.impactoBase;
		const projecao = resultados.projecaoTemporal;

		// Construir HTML dos resultados com layout ampliado
		let html = `
			<div class="result-container">
				<div class="result-card">
					<h3>Síntese do Impacto <span class="info-icon" title="Resumo dos principais indicadores da simulação">i</span></h3>

					<div class="result-section">
						<h4>Impacto Inicial (${projecao.parametros.anoInicial})</h4>
						<table class="result-table">
							<tr>
								<td>Percentual de Implementação:</td>
								<td><span class="value-highlight">${formatarPercent(impacto.resultadoSplitPayment.percentualImplementacao)}</span></td>
							</tr>
							<tr>
								<td>Diferença no Capital de Giro:</td>
								<td class="${impacto.diferencaCapitalGiro >= 0 ? 'positive-value' : 'negative-value'}">
									${formatarMoeda(impacto.diferencaCapitalGiro)}
								</td>
							</tr>
							<tr>
								<td>Impacto Percentual:</td>
								<td class="${impacto.percentualImpacto >= 0 ? 'positive-value' : 'negative-value'}">
									${formatarPercent(impacto.percentualImpacto/100)}
								</td>
							</tr>
							<tr>
								<td>Necessidade Adicional de Capital:</td>
								<td>${formatarMoeda(impacto.necessidadeAdicionalCapitalGiro)}</td>
							</tr>
							<tr>
								<td>Impacto na Margem Operacional:</td>
								<td>De <span class="value-original">${formatarPercent(impacto.margemOperacionalOriginal*100)}</span> para <span class="value-adjusted">${formatarPercent(impacto.margemOperacionalAjustada*100)}</span></td>
							</tr>
						</table>
					</div>
				</div>

				<div class="result-card">
					<h3>Projeção do Impacto <span class="info-icon" title="Impacto projetado ao longo do período de transição">i</span></h3>
					<p>Impacto acumulado no período ${projecao.parametros.anoInicial}-${projecao.parametros.anoFinal}:</p>
					<table class="result-table">
						<tr>
							<td>Necessidade Total de Capital:</td>
							<td><strong>${formatarMoeda(projecao.impactoAcumulado.totalNecessidadeCapitalGiro)}</strong></td>
						</tr>
						<tr>
							<th>Custo Financeiro Total:</th>
        					<td><strong>${formatarMoeda(this.validarNumero(projecao.impactoAcumulado.custoFinanceiroTotal))}</strong></td>
						</tr>
						<tr>
							<th>Impacto Médio na Margem:</th>
        					<td><strong>${formatarPercent(this.validarNumero(projecao.impactoAcumulado.impactoMedioMargem)/1)}</strong></td>
						</tr>
					</table>
				</div>
			</div>

			<div class="result-card">
				<h3>Detalhamento Anual <span class="info-icon" title="Detalhamento do impacto para cada ano de implementação">i</span></h3>
				<div class="scrollable-table">
					<table class="detail-table">
						<thead>
							<tr>
								<th>Ano</th>
								<th>% Implementação</th>
								<th>Impacto no Capital de Giro</th>
								<th>% do Impacto</th>
								<th>Necessidade Adicional</th>
								<th>Margem Ajustada</th>
							</tr>
						</thead>
						<tbody>
		`;

		// Adicionar linhas para cada ano da projeção
		Object.keys(projecao.resultadosAnuais).forEach(ano => {
			const resultado = projecao.resultadosAnuais[ano];
			html += `
				<tr>
					<td>${ano}</td>
					<td>${formatarPercent(resultado.resultadoSplitPayment.percentualImplementacao)}</td>
					<td>${formatarMoeda(resultado.diferencaCapitalGiro)}</td>
					<td>${formatarPercent(resultado.percentualImpacto/100)}</td>
					<td>${formatarMoeda(resultado.necesidadeAdicionalCapitalGiro)}</td>
					<td>${formatarPercent(resultado.margemOperacionalAjustada*100)}</td>
				</tr>
			`;
		});

		html += `
						</tbody>
					</table>
				</div>
			</div>
			
			<div class="result-card">
				<h3>Análise de Sensibilidade <span class="info-icon" title="Impacto de diferentes taxas de crescimento na necessidade de capital">i</span></h3>
				<p>Esta análise demonstra como diferentes cenários de crescimento afetam a necessidade de capital adicional.</p>
				<div id="grafico-sensibilidade" class="chart-container"></div>
			</div>
		`;

		// Adicionar botões de navegação após os resultados
		html += `
			<div class="action-buttons-container">
				<button id="btn-ir-para-estrategias" class="btn btn-primary">Simular Estratégias de Mitigação</button>
				<button id="btn-limpar-simulacao" class="btn btn-secondary">Limpar Simulação</button>
			</div>
		`;

		// Inserir HTML no container
		containerResultados.innerHTML = html;

		// Gerar gráficos
		this.gerarGraficos(resultados);
		
		// Gerar gráfico de sensibilidade
		this.gerarGraficoSensibilidade(resultados);
		
		// Adicionar eventos aos novos botões
		this.adicionarEventosBotoes();
	},

    /**
     * Gera gráficos para visualização dos resultados
     */
    gerarGraficos: function(resultados) {
		// Destruir gráficos existentes para evitar duplicação
		if (window.graficos) {
			Object.values(window.graficos).forEach(grafico => {
				if (grafico && typeof grafico.destroy === 'function') {
					grafico.destroy();
				}
			});
		}

		window.graficos = {};

		// 1. Gráfico de fluxo de caixa comparativo (barra)
		const ctxFluxoCaixa = document.getElementById('grafico-fluxo-caixa');
		if (ctxFluxoCaixa) {
			window.graficos.fluxoCaixa = new Chart(ctxFluxoCaixa.getContext('2d'), {
				type: 'bar',
				data: {
					labels: ['Regime Atual', 'Split Payment'],
					datasets: [{
						label: 'Capital de Giro Disponível',
						data: [
							resultados.impactoBase.resultadoAtual.capitalGiroDisponivel,
							resultados.impactoBase.resultadoSplitPayment.capitalGiroDisponivel
						],
						backgroundColor: ['rgba(54, 162, 235, 0.6)', 'rgba(255, 99, 132, 0.6)'],
						borderColor: ['rgba(54, 162, 235, 1)', 'rgba(255, 99, 132, 1)'],
						borderWidth: 1
					}]
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					plugins: {
						title: {
							display: true,
							text: 'Comparativo de Capital de Giro',
							font: { size: 14, weight: 'bold' }
						},
						tooltip: {
							callbacks: {
								label: function(context) {
									return 'R$ ' + context.raw.toLocaleString('pt-BR', {
										minimumFractionDigits: 2,
										maximumFractionDigits: 2
									});
								}
							}
						}
					},
					scales: {
						y: {
							beginAtZero: true,
							title: {
								display: true,
								text: 'Capital de Giro (R$)'
							},
							ticks: {
								callback: function(value) {
									return 'R$ ' + value.toLocaleString('pt-BR', {
										minimumFractionDigits: 0,
										maximumFractionDigits: 0
									});
								}
							}
						}
					}
				}
			});
		}

		// 2. Gráfico de evolução do capital de giro (linha)
		const ctxCapitalGiro = document.getElementById('grafico-capital-giro');
		if (ctxCapitalGiro) {
			// Preparar dados para gráfico de evolução
			const anos = Object.keys(resultados.projecaoTemporal.resultadosAnuais);
			const capitalGiroValores = anos.map(ano => 
				resultados.projecaoTemporal.resultadosAnuais[ano].resultadoSplitPayment.capitalGiroDisponivel
			);
			
			window.graficos.capitalGiro = new Chart(ctxCapitalGiro.getContext('2d'), {
				type: 'line',
				data: {
					labels: anos,
					datasets: [{
						label: 'Capital de Giro Disponível',
						data: capitalGiroValores,
						borderColor: 'rgba(75, 192, 192, 1)',
						backgroundColor: 'rgba(75, 192, 192, 0.1)',
						borderWidth: 2,
						fill: true,
						tension: 0.4
					}]
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					plugins: {
						title: {
							display: true,
							text: 'Evolução do Capital de Giro durante o Split Payment',
							font: { size: 14, weight: 'bold' }
						},
						tooltip: {
							callbacks: {
								label: function(context) {
									return 'R$ ' + context.raw.toLocaleString('pt-BR', {
										minimumFractionDigits: 2,
										maximumFractionDigits: 2
									});
								}
							}
						}
					},
					scales: {
						y: {
							title: {
								display: true,
								text: 'Capital de Giro (R$)'
							},
							ticks: {
								callback: function(value) {
									return 'R$ ' + value.toLocaleString('pt-BR', {
										minimumFractionDigits: 0,
										maximumFractionDigits: 0
									});
								}
							}
						},
						x: {
							title: {
								display: true,
								text: 'Ano'
							}
						}
					}
				}
			});
		}

		// 3. Gráfico de impacto na margem (dual axis)
		const ctxProjecao = document.getElementById('grafico-projecao');
		if (ctxProjecao) {
			// Preparar dados para o gráfico de projeção
			const anos = Object.keys(resultados.projecaoTemporal.resultadosAnuais);
			const impactosMargem = anos.map(ano => 
				resultados.projecaoTemporal.resultadosAnuais[ano].impactoMargem
			);
			const margensAjustadas = anos.map(ano => 
				resultados.projecaoTemporal.resultadosAnuais[ano].margemOperacionalAjustada * 100
			);

			window.graficos.projecao = new Chart(ctxProjecao.getContext('2d'), {
				type: 'line',
				data: {
					labels: anos,
					datasets: [
						{
							label: 'Impacto na Margem (p.p.)',
							data: impactosMargem,
							borderColor: 'rgba(255, 99, 132, 1)',
							backgroundColor: 'rgba(255, 99, 132, 0.1)',
							borderWidth: 2,
							yAxisID: 'y',
							tension: 0.4
						},
						{
							label: 'Margem Operacional (%)',
							data: margensAjustadas,
							borderColor: 'rgba(54, 162, 235, 1)',
							backgroundColor: 'rgba(54, 162, 235, 0.1)',
							borderWidth: 2,
							yAxisID: 'y1',
							tension: 0.4
						}
					]
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					plugins: {
						title: {
							display: true,
							text: 'Projeção do Impacto na Margem Operacional',
							font: { size: 14, weight: 'bold' }
						}
					},
					scales: {
						y: {
							type: 'linear',
							position: 'left',
							title: {
								display: true,
								text: 'Impacto na Margem (p.p.)'
							},
							ticks: {
								callback: function(value) {
									return value.toFixed(2) + ' p.p.';
								}
							}
						},
						y1: {
							type: 'linear',
							position: 'right',
							title: {
								display: true,
								text: 'Margem Operacional (%)'
							},
							ticks: {
								callback: function(value) {
									return value.toFixed(2) + '%';
								}
							},
							grid: {
								drawOnChartArea: false
							}
						},
						x: {
							title: {
								display: true,
								text: 'Ano'
							}
						}
					}
				}
			});
		}
		
		// 4. Novo gráfico: Decomposição do impacto (gráfico de pizza)
		const ctxDecomposicao = document.getElementById('grafico-decomposicao');
		if (ctxDecomposicao) {
			const impactoOriginal = Math.abs(resultados.impactoBase.diferencaCapitalGiro);
			const custoFinanceiro = resultados.impactoBase.impactoMargem.custoMensalCapitalGiro * 12;
			const percImplementacao = resultados.impactoBase.resultadoSplitPayment.percentualImplementacao;
			
			window.graficos.decomposicao = new Chart(ctxDecomposicao.getContext('2d'), {
				type: 'pie',
				data: {
					labels: [
						'Redução no Capital Disponível',
						'Custo Financeiro Anual',
						'Capital Remanescente'
					],
					datasets: [{
						data: [
							impactoOriginal,
							custoFinanceiro,
							impactoOriginal * (1 - percImplementacao)
						],
						backgroundColor: [
							'rgba(255, 99, 132, 0.7)',
							'rgba(255, 159, 64, 0.7)',
							'rgba(75, 192, 192, 0.7)'
						],
						borderColor: [
							'rgba(255, 99, 132, 1)',
							'rgba(255, 159, 64, 1)',
							'rgba(75, 192, 192, 1)'
						],
						borderWidth: 1
					}]
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					plugins: {
						title: {
							display: true,
							text: 'Decomposição do Impacto Financeiro',
							font: { size: 14, weight: 'bold' }
						},
						tooltip: {
							callbacks: {
								label: function(context) {
									const label = context.label || '';
									const value = context.raw;
									const percentage = context.parsed / context.dataset.data.reduce((a, b) => a + b, 0) * 100;
									return label + ': R$ ' + value.toLocaleString('pt-BR', {
										minimumFractionDigits: 2,
										maximumFractionDigits: 2
									}) + ' (' + percentage.toFixed(1) + '%)';
								}
							}
						}
					}
				}
			});
		}
	},

	/**
	 * Gera gráfico de análise de sensibilidade
	 */
	gerarGraficoSensibilidade: function(resultados) {
		// Destruir gráfico existente se houver
		if (window.graficoSensibilidade) {
			window.graficoSensibilidade.destroy();
		}
		
		// Obter o container do gráfico
		const container = document.getElementById('grafico-sensibilidade');
		if (!container) {
			console.error('Container para gráfico de sensibilidade não encontrado');
			return;
		}
		
		try {
			// Limpar qualquer conteúdo anterior
			container.innerHTML = '';
			
			// Criar um novo elemento canvas
			const canvas = document.createElement('canvas');
			canvas.id = 'canvas-sensibilidade';
			
			// Adicionar o canvas ao container
			container.appendChild(canvas);
			
			// Obter o contexto de desenho
			const ctx = canvas.getContext('2d');
			
			// Dados para o gráfico de sensibilidade (simulados)
			const cenarios = [
				{ nome: 'Recessão', taxa: -0.02, impacto: resultados.impactoBase.necessidadeAdicionalCapitalGiro * 0.85 },
				{ nome: 'Estagnação', taxa: 0.00, impacto: resultados.impactoBase.necessidadeAdicionalCapitalGiro * 0.92 },
				{ nome: 'Conservador', taxa: 0.02, impacto: resultados.impactoBase.necessidadeAdicionalCapitalGiro * 1.0 },
				{ nome: 'Moderado', taxa: 0.05, impacto: resultados.impactoBase.necessidadeAdicionalCapitalGiro * 1.15 },
				{ nome: 'Otimista', taxa: 0.08, impacto: resultados.impactoBase.necessidadeAdicionalCapitalGiro * 1.35 },
				{ nome: 'Acelerado', taxa: 0.12, impacto: resultados.impactoBase.necessidadeAdicionalCapitalGiro * 1.6 }
			];
			
			window.graficoSensibilidade = new Chart(ctx, {
				type: 'bar',
				data: {
					labels: cenarios.map(c => c.nome),
					datasets: [{
						label: 'Necessidade Total de Capital (R$)',
						data: cenarios.map(c => c.impacto),
						backgroundColor: [
							'rgba(75, 192, 192, 0.7)',
							'rgba(54, 162, 235, 0.7)',
							'rgba(153, 102, 255, 0.7)',
							'rgba(255, 206, 86, 0.7)',
							'rgba(255, 159, 64, 0.7)',
							'rgba(255, 99, 132, 0.7)'
						],
						borderColor: [
							'rgba(75, 192, 192, 1)',
							'rgba(54, 162, 235, 1)',
							'rgba(153, 102, 255, 1)',
							'rgba(255, 206, 86, 1)',
							'rgba(255, 159, 64, 1)',
							'rgba(255, 99, 132, 1)'
						],
						borderWidth: 1
					}]
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					scales: {
						y: {
							beginAtZero: true,
							title: {
								display: true,
								text: 'Necessidade de Capital (R$)'
							},
							ticks: {
								callback: function(value) {
									return 'R$ ' + value.toLocaleString('pt-BR', {
										minimumFractionDigits: 0,
										maximumFractionDigits: 0
									});
								}
							}
						},
						x: {
							title: {
								display: true,
								text: 'Cenário de Crescimento'
							}
						}
					},
					plugins: {
						tooltip: {
							callbacks: {
								label: function(context) {
									return 'Necessidade: R$ ' + context.raw.toLocaleString('pt-BR', {
										minimumFractionDigits: 2,
										maximumFractionDigits: 2
									});
								},
								afterLabel: function(context) {
									const idx = context.dataIndex;
									return 'Taxa de Crescimento: ' + (cenarios[idx].taxa * 100).toFixed(1) + '%';
								}
							}
						}
					}
				}
			});
		} catch (error) {
			console.error('Erro ao criar gráfico de sensibilidade:', error);
		}
	},

	/**
	 * Adiciona eventos aos botões de ação nos resultados
	 */
	adicionarEventosBotoes: function() {
		const btnIrParaEstrategias = document.getElementById('btn-ir-para-estrategias');
		if (btnIrParaEstrategias) {
			btnIrParaEstrategias.addEventListener('click', function() {
				// Utilizar o TabsManager para navegar para a aba de estratégias
				if (typeof TabsManager !== 'undefined' && typeof TabsManager.mudarPara === 'function') {
					TabsManager.mudarPara('estrategias');
				} else {
					// Fallback se o TabsManager não estiver disponível
					const tabEstrategias = document.querySelector('.tab-button[data-tab="estrategias"]');
					if (tabEstrategias) {
						tabEstrategias.click();
					}
				}
			});
		}
		
		const btnLimparSimulacao = document.getElementById('btn-limpar-simulacao');
		if (btnLimparSimulacao) {
			btnLimparSimulacao.addEventListener('click', () => {
				this.limparSimulacao();
			});
		}
	},

	/**
	 * Limpa os dados da simulação e reseta os campos
	 */
	limparSimulacao: function() {
		// Limpar campos do formulário
		const campos = [
			'empresa', 'faturamento', 'margem', 'pmr', 'pmp', 'pme',
			'perc-vista', 'aliquota', 'creditos'
		];
		
		campos.forEach(id => {
			const campo = document.getElementById(id);
			if (campo) {
				if (campo.type === 'select-one') {
					campo.selectedIndex = 0;
				} else {
					campo.value = '';
				}
			}
		});
		
		// Redefinir valores padrão
		document.getElementById('perc-vista').value = '30';
		document.getElementById('pmr').value = '30';
		document.getElementById('pmp').value = '30';
		document.getElementById('pme').value = '30';
		
		// Atualizar campos dependentes
		if (typeof FormsManager !== 'undefined') {
			FormsManager.atualizarPercPrazo();
			FormsManager.calcularCicloFinanceiro();
		}
		
		// Limpar resultados
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
		
		if (window.graficoSensibilidade) {
			window.graficoSensibilidade.destroy();
			window.graficoSensibilidade = null;
		}
		
		// Limpar memória de simulação
		window.ultimaSimulacao = null;
		window.memoriaCalculoSimulacao = null;
		
		console.log('Simulação limpa com sucesso');
	},

    /**
     * Atualiza a memória de cálculo na interface
     */
    atualizarMemoriaCalculo: function(memoriaCalculo) {
        // Armazenar memória de cálculo para uso posterior
        window.memoriaCalculoSimulacao = memoriaCalculo;

        // Atualizar o select de anos na aba de memória
        const selectAno = document.getElementById('select-ano-memoria');
        if (selectAno) {
            // Limpar options existentes
            selectAno.innerHTML = '';

            // Adicionar uma option para cada ano disponível
            Object.keys(memoriaCalculo).forEach(ano => {
                const option = document.createElement('option');
                option.value = ano;
                option.textContent = ano;
                selectAno.appendChild(option);
            });

            // Exibir memória de cálculo para o primeiro ano
            this.exibirMemoriaCalculo(Object.keys(memoriaCalculo)[0]);
        }
    },

    /**
     * Exibe a memória de cálculo para um ano específico
     */
    exibirMemoriaCalculo: function(ano) {
        const containerMemoria = document.getElementById('memoria-calculo');
        if (!containerMemoria || !window.memoriaCalculoSimulacao || !window.memoriaCalculoSimulacao[ano]) {
            return;
        }

        // Formatar a memória de cálculo (usar texto pré-formatado para manter formatação)
        containerMemoria.innerHTML = `<pre>${window.memoriaCalculoSimulacao[ano]}</pre>`;
    },
    // Variáveis para armazenar resultados intermediários
    _resultadoAtual: null,
    _resultadoSplitPayment: null,
    
    /**
     * Realiza a simulação completa
     * @param {Object} dados - Dados para simulação
     * @returns {Object} - Resultados da simulação
     */
    // Modificar a função simular() para organizar os resultados por anos
	simular: function(dados) {
		console.log('Iniciando simulação:', dados);

		// Extrair ano inicial e final para simulação
		const anoInicial = parseInt(dados.dataInicial.split('-')[0]);
		const anoFinal = parseInt(dados.dataFinal.split('-')[0]);

		// Calcular impacto inicial
		const impactoBase = this.calcularImpactoCapitalGiro(dados, anoInicial);

		// Simular período de transição
		const projecaoTemporal = this.simularPeriodoTransicao(
			dados, 
			anoInicial, 
			anoFinal, 
			dados.cenario, 
			dados.taxaCrescimento
		);

		// Reorganizar resultados por anos para facilitar acesso
		const resultadosPorAno = {};
		resultadosPorAno[anoInicial] = {
			imposto_devido: impactoBase.resultadoSplitPayment.valorImposto || 0,
			sistema_atual: impactoBase.resultadoAtual.valorImposto || 0,
			diferenca: impactoBase.diferencaCapitalGiro || 0,
			percentual_impacto: impactoBase.percentualImpacto || 0
		};

		// Adicionar resultados de anos subsequentes
		Object.keys(projecaoTemporal.resultadosAnuais).forEach(ano => {
			const resultado = projecaoTemporal.resultadosAnuais[ano];
			resultadosPorAno[ano] = {
				imposto_devido: resultado.resultadoSplitPayment?.valorImposto || 0,
				sistema_atual: resultado.resultadoAtual?.valorImposto || 0,
				diferenca: resultado.diferencaCapitalGiro || 0,
				percentual_impacto: resultado.percentualImpacto || 0
			};
		});

		// Armazenar memória de cálculo
		const memoriaCalculo = this.gerarMemoriaCalculo(dados, anoInicial, anoFinal);

		// Resultados completos
		const resultados = {
			impactoBase,
			projecaoTemporal,
			resultadosPorAno, // Nova estrutura organizada por anos
			memoriaCalculo
		};

		console.log('Simulação concluída com sucesso:', resultados);

		return resultados;
	},
    
    /**
	 * Calcula o fluxo de caixa no regime tributário atual
	 * @param {Object} dados - Dados para simulação
	 * @returns {Object} - Resultados do fluxo de caixa atual
	 */
	calcularFluxoCaixaAtual: function(dados) {
		// Extrair dados relevantes
		const faturamento = dados.faturamento;
		const aliquota = dados.aliquota;
		const pmr = dados.pmr;

		// Calcular valores
		const valorImposto = faturamento * aliquota;
		const prazoRecolhimento = 25; // Dias para recolhimento do imposto (mês seguinte)

		// No sistema atual, o valor do imposto fica disponível como capital de giro
		// até o prazo de recolhimento
		const impostoComoCapitalGiro = valorImposto;
		const diasCapitalDisponivel = pmr + prazoRecolhimento;

		// Resultado
		const resultado = {
			faturamento,
			valorImposto,
			recebimentoLiquido: faturamento,
			impostoComoCapitalGiro, // Renomeado para deixar mais claro
			diasCapitalDisponivel,
			observacao: "No sistema atual, o valor do imposto fica disponível como capital de giro até o prazo de recolhimento"
		};

		// Armazenar resultado para memória de cálculo
		this._resultadoAtual = resultado;

		return resultado;
	},
    
    /**
	 * Calcula o fluxo de caixa com o regime de Split Payment
	 * @param {Object} dados - Dados para simulação
	 * @param {number} ano - Ano para simulação
	 * @returns {Object} - Resultados do fluxo de caixa com Split Payment
	 */
	calcularFluxoCaixaSplitPayment: function(dados, ano = 2026) {
		// Extrair dados relevantes
		const faturamento = dados.faturamento;
		const aliquota = dados.aliquota;
		const pmr = dados.pmr;

		// Obter percentual de implementação do Split Payment para o ano
		const percentualImplementacao = this.obterPercentualImplementacao(ano);

		// Calcular valores
		const valorImpostoTotal = faturamento * aliquota;

		// No Split Payment, parte do imposto é retida imediatamente
		const valorImpostoRetidoImediatamente = valorImpostoTotal * percentualImplementacao;

		// Parte do imposto ainda é recolhida no sistema tradicional
		const valorImpostoRecolhimentoNormal = valorImpostoTotal - valorImpostoRetidoImediatamente;

		// O valor recebido é líquido da parte retida
		const recebimentoLiquido = faturamento - valorImpostoRetidoImediatamente;

		// Apenas o valor não retido fica disponível como capital de giro
		const impostoComoCapitalGiro = valorImpostoRecolhimentoNormal;

		// Resultado
		const resultado = {
			faturamento,
			valorImpostoTotal,
			valorImpostoRetidoImediatamente,
			valorImpostoRecolhimentoNormal,
			recebimentoLiquido,
			impostoComoCapitalGiro, // Renomeado para deixar mais claro
			percentualImplementacao,
			observacao: "No Split Payment, parte do imposto é retida imediatamente, reduzindo o capital de giro disponível"
		};

		// Armazenar resultado para memória de cálculo
		this._resultadoSplitPayment = resultado;

		return resultado;
	},
    
    /**
	 * Calcula o impacto do Split Payment no capital de giro
	 * @param {Object} dados - Dados para simulação
	 * @param {number} ano - Ano para simulação
	 * @returns {Object} - Resultados do impacto no capital de giro
	 */
	calcularImpactoCapitalGiro: function(dados, ano = 2026) {
		// Calcular fluxo de caixa nos dois regimes
		const resultadoAtual = this.calcularFluxoCaixaAtual(dados);
		const resultadoSplitPayment = this.calcularFluxoCaixaSplitPayment(dados, ano);

		// Calcular diferenças no capital de giro
		// Um valor negativo significa que há menos capital disponível no Split Payment
		const diferencaCapitalGiro = this.validarNumero(resultadoSplitPayment.impostoComoCapitalGiro) - 
								   this.validarNumero(resultadoAtual.impostoComoCapitalGiro);

		const capitalGiroAtual = this.validarNumero(resultadoAtual.impostoComoCapitalGiro);

		// Percentual do impacto (valor negativo = redução de capital disponível)
		const percentualImpacto = capitalGiroAtual !== 0 ? (diferencaCapitalGiro / capitalGiroAtual) * 100 : 0;

		// Calcular impacto na margem operacional
		const margem = parseFloat(dados.margem) / 100;  // Converter para decimal se vier como percentual

		// Custo do capital necessário para compensar a redução
		const custoCapitalGiro = Math.abs(diferencaCapitalGiro) * (dados.taxaCapitalGiro || 0.021); // 2,1% a.m. padrão
		const impactoMargem = (custoCapitalGiro / dados.faturamento) * 100;

		// Resultado
		const resultado = {
			ano,
			resultadoAtual: {
				valorImposto: resultadoAtual.valorImposto,
				capitalGiroDisponivel: resultadoAtual.impostoComoCapitalGiro,
				observacao: resultadoAtual.observacao
			},
			resultadoSplitPayment: {
				valorImposto: resultadoSplitPayment.valorImpostoTotal,
				valorRetidoImediatamente: resultadoSplitPayment.valorImpostoRetidoImediatamente,
				capitalGiroDisponivel: resultadoSplitPayment.impostoComoCapitalGiro,
				percentualImplementacao: resultadoSplitPayment.percentualImplementacao,
				observacao: resultadoSplitPayment.observacao
			},
			diferencaCapitalGiro,
			percentualImpacto,
			// Um valor negativo de diferencaCapitalGiro significa que precisamos de mais capital
			necessidadeAdicionalCapitalGiro: Math.abs(diferencaCapitalGiro) * 1.2, // Margem de segurança de 20%
			interpretacaoImpacto: diferencaCapitalGiro < 0 
				? "Redução no capital de giro disponível, gerando necessidade adicional de capital" 
				: "Aumento no capital de giro disponível",
			margemOperacionalOriginal: margem,
			margemOperacionalAjustada: margem - impactoMargem / 100,
			impactoMargem: {
				valorPontoPercentual: impactoMargem,
				custoMensalCapitalGiro: custoCapitalGiro
			}
		};

		return resultado;
	},
    
    /**
     * Simula o impacto ao longo do período de transição
     * @param {Object} dados - Dados para simulação
     * @param {number} anoInicial - Ano inicial
     * @param {number} anoFinal - Ano final
     * @param {string} cenario - Cenário de crescimento
     * @param {number} taxaCrescimento - Taxa de crescimento para cenário personalizado
     * @returns {Object} - Resultados da projeção temporal
     */
    simularPeriodoTransicao: function(dados, anoInicial = 2026, anoFinal = 2033, cenario = 'moderado', taxaCrescimento = null) {
        // Definir taxa de crescimento com base no cenário
        let taxa = 0.05; // Padrão: moderado (5% a.a.)
        
        if (cenario === 'conservador') {
            taxa = 0.02; // 2% a.a.
        } else if (cenario === 'otimista') {
            taxa = 0.08; // 8% a.a.
        } else if (cenario === 'personalizado' && taxaCrescimento !== null) {
            taxa = taxaCrescimento;
        }
        
        // Inicializar resultados
        const resultadosAnuais = {};
        let faturamentoAtual = dados.faturamento;
        
        // Simular cada ano
        for (let ano = anoInicial; ano <= anoFinal; ano++) {
            // Criar cópia dos dados com faturamento ajustado
            const dadosAno = { ...dados, faturamento: faturamentoAtual };
            
            // Calcular impacto para o ano
            const impactoAno = this.calcularImpactoCapitalGiro(dadosAno, ano);
            
            // Armazenar resultado
            resultadosAnuais[ano] = impactoAno;
            
            // Atualizar faturamento para o próximo ano
            faturamentoAtual *= (1 + taxa);
        }
        
        // Calcular impacto acumulado
        const impactoAcumulado = this.calcularImpactoAcumulado(resultadosAnuais, anoInicial, anoFinal);
        
        // Resultado
        const resultado = {
            parametros: {
                anoInicial,
                anoFinal,
                cenario,
                taxaCrescimento: taxa
            },
            resultadosAnuais,
            impactoAcumulado
        };
        
        return resultado;
    },
    
    /**
     * Calcula o impacto acumulado ao longo do período
     * @param {Object} resultadosAnuais - Resultados por ano
     * @param {number} anoInicial - Ano inicial
     * @param {number} anoFinal - Ano final
     * @returns {Object} - Impacto acumulado
     */
    calcularImpactoAcumulado: function(resultadosAnuais, anoInicial, anoFinal) {
		let totalNecessidadeCapitalGiro = 0;
		let totalCustoFinanceiro = 0;
		let somaImpactoMargem = 0;

		// Calcular totais
		for (let ano = anoInicial; ano <= anoFinal; ano++) {
			const impactoAno = resultadosAnuais[ano];
			if (!impactoAno) continue;

			totalNecessidadeCapitalGiro += this.validarNumero(impactoAno.necessidadeAdicionalCapitalGiro);

			// Acessar custoMensalCapitalGiro do objeto impactoMargem
			if (impactoAno.impactoMargem && typeof impactoAno.impactoMargem.custoMensalCapitalGiro === 'number') {
				totalCustoFinanceiro += impactoAno.impactoMargem.custoMensalCapitalGiro * 12;
			}

			// Acessar valorPontoPercentual do objeto impactoMargem
			if (impactoAno.impactoMargem && typeof impactoAno.impactoMargem.valorPontoPercentual === 'number') {
				somaImpactoMargem += impactoAno.impactoMargem.valorPontoPercentual;
			}
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
     * Obtém o percentual de implementação do Split Payment para um determinado ano
     * @param {number} ano - Ano para obter o percentual
     * @returns {number} - Percentual de implementação (decimal)
     */
    obterPercentualImplementacao: function(ano) {
        const cronograma = {
            2026: 0.10,
            2027: 0.25,
            2028: 0.40,
            2029: 0.55,
            2030: 0.70,
            2031: 0.85,
            2032: 0.95,
            2033: 1.00
        };
        
        return cronograma[ano] || 0;
    },
    
    /**
     * Gera a memória de cálculo detalhada
     * @param {Object} dados - Dados da simulação
     * @param {number} anoInicial - Ano inicial
     * @param {number} anoFinal - Ano final
     * @returns {Object} - Memória de cálculo por ano
     */
    gerarMemoriaCalculo: function(dados, anoInicial, anoFinal) {
        const memoria = {};
        
        for (let ano = anoInicial; ano <= anoFinal; ano++) {
            let textoMemoria = `=== MEMÓRIA DE CÁLCULO - ANO ${ano} ===\n\n`;
            
            // Parâmetros básicos
            textoMemoria += `=== PARÂMETROS BÁSICOS ===\n`;
            textoMemoria += `Faturamento Mensal: ${FormatacaoHelper.formatarMoeda(dados.faturamento)}\n`;
            textoMemoria += `Alíquota Efetiva: ${(dados.aliquota * 100).toFixed(1)}%\n`;
            textoMemoria += `Prazo Médio de Recebimento: ${dados.pmr} dias\n`;
            textoMemoria += `Prazo Médio de Pagamento: ${dados.pmp} dias\n`;
            textoMemoria += `Prazo Médio de Estoque: ${dados.pme} dias\n`;
            textoMemoria += `Ciclo Financeiro: ${dados.pmr + dados.pme - dados.pmp} dias\n`;
            textoMemoria += `Percentual de Vendas à Vista: ${(dados.percVista * 100).toFixed(1)}%\n`;
            textoMemoria += `Percentual de Vendas a Prazo: ${(dados.percPrazo * 100).toFixed(1)}%\n\n`;
            
            // Cálculo do impacto
            textoMemoria += `=== CÁLCULO DO IMPACTO NO FLUXO DE CAIXA ===\n`;
            const valorImposto = dados.faturamento * dados.aliquota;
            
            textoMemoria += `Valor do Imposto Mensal: ${FormatacaoHelper.formatarMoeda(dados.faturamento)} × ${(dados.aliquota * 100).toFixed(1)}% = ${FormatacaoHelper.formatarMoeda(valorImposto)}\n`;
            
            // Obter percentual de implementação para o ano
            const percentualImplementacao = this.obterPercentualImplementacao(ano);
            const impactoAno = valorImposto * percentualImplementacao;
            
            textoMemoria += `Percentual de Implementação (${ano}): ${(percentualImplementacao * 100).toFixed(0)}%\n`;
            textoMemoria += `Impacto no Fluxo de Caixa: ${FormatacaoHelper.formatarMoeda(valorImposto)} × ${(percentualImplementacao * 100).toFixed(0)}% = ${FormatacaoHelper.formatarMoeda(impactoAno)}\n\n`;
            
            // Análise do capital de giro
            textoMemoria += `=== ANÁLISE DO CAPITAL DE GIRO ===\n`;
            const impactoDias = dados.pmr * (impactoAno / dados.faturamento);
            
            textoMemoria += `Impacto em Dias de Faturamento: ${dados.pmr} × ${(impactoAno / dados.faturamento * 100).toFixed(1)}% = ${impactoDias.toFixed(1)} dias\n`;
            textoMemoria += `Necessidade Adicional de Capital de Giro: ${FormatacaoHelper.formatarMoeda(impactoAno * 1.2)}\n\n`;
            
            // Impacto na rentabilidade
            textoMemoria += `=== IMPACTO NA RENTABILIDADE ===\n`;
            const custoGiro = dados.taxaCapitalGiro || 0.021; // Taxa de capital de giro (2,1% a.m.)
            const custoMensal = impactoAno * custoGiro;
            const custoAnual = custoMensal * 12;
            const impactoMargem = custoMensal / dados.faturamento;
            
            textoMemoria += `Margem Operacional Original: ${(dados.margem * 100).toFixed(1)}%\n`;
            textoMemoria += `Custo Financeiro Mensal: ${FormatacaoHelper.formatarMoeda(impactoAno)} × ${(custoGiro * 100).toFixed(1)}% = ${FormatacaoHelper.formatarMoeda(custoMensal)}\n`;
            textoMemoria += `Custo Financeiro Anual: ${FormatacaoHelper.formatarMoeda(custoMensal)} × 12 = ${FormatacaoHelper.formatarMoeda(custoAnual)}\n`;
            textoMemoria += `Impacto na Margem: ${FormatacaoHelper.formatarMoeda(custoMensal)} ÷ ${FormatacaoHelper.formatarMoeda(dados.faturamento)} = ${(impactoMargem * 100).toFixed(2)}%\n`;
            textoMemoria += `Margem Ajustada: ${(dados.margem * 100).toFixed(1)}% - ${(impactoMargem * 100).toFixed(2)}% = ${((dados.margem - impactoMargem) * 100).toFixed(2)}%\n\n`;
            
            memoria[ano] = textoMemoria;
        }
        
        return memoria;
    }
};

    /**
     * Simula o impacto das estratégias de mitigação selecionadas
     */
    function simularEstrategias() {
        console.log('Iniciando simulação de estratégias...');

        try {
            // Verificar se há uma simulação principal realizada
            if (!window.ultimaSimulacao) {
                alert('É necessário realizar uma simulação principal antes de simular estratégias de mitigação.');
                // Redirecionar para a aba de simulação
                TabsManager.mudarPara('simulacao-principal');
                return;
            }

            // Coletar dados da última simulação
            const dados = window.ultimaSimulacao.dados;
            const impactoBase = window.ultimaSimulacao.resultados.impactoBase;

            // Coletar configurações das estratégias
            const estrategias = {
                ajustePrecos: {
                    ativar: document.getElementById('ap-ativar').value === '1',
                    percentualAumento: parseFloat(document.getElementById('ap-percentual').value) || 0,
                    elasticidade: parseFloat(document.getElementById('ap-elasticidade').value) || 0,
                    impactoVendas: parseFloat(document.getElementById('ap-impacto-vendas').value) || 0,
                    periodoAjuste: parseInt(document.getElementById('ap-periodo').value) || 0
                },
                renegociacaoPrazos: {
                    ativar: document.getElementById('rp-ativar').value === '1',
                    aumentoPrazo: parseInt(document.getElementById('rp-aumento-prazo').value) || 0,
                    percentualFornecedores: parseInt(document.getElementById('rp-percentual').value) || 0,
                    contrapartidas: document.getElementById('rp-contrapartidas').value || 'nenhuma',
                    custoContrapartida: parseFloat(document.getElementById('rp-custo').value) || 0
                },
                antecipacaoRecebiveis: {
                    ativar: document.getElementById('ar-ativar').value === '1',
                    percentualAntecipacao: parseInt(document.getElementById('ar-percentual').value) || 0,
                    taxaDesconto: parseFloat(document.getElementById('ar-taxa').value) / 100 || 0,
                    prazoAntecipacao: parseInt(document.getElementById('ar-prazo').value) || 0
                },
                capitalGiro: {
                    ativar: document.getElementById('cg-ativar').value === '1',
                    valorCaptacao: parseInt(document.getElementById('cg-valor').value) || 0,
                    taxaJuros: parseFloat(document.getElementById('cg-taxa').value) / 100 || 0,
                    prazoPagamento: parseInt(document.getElementById('cg-prazo').value) || 0,
                    carencia: parseInt(document.getElementById('cg-carencia').value) || 0
                },
                mixProdutos: {
                    ativar: document.getElementById('mp-ativar').value === '1',
                    percentualAjuste: parseInt(document.getElementById('mp-percentual').value) || 0,
                    focoAjuste: document.getElementById('mp-foco').value || 'ciclo',
                    impactoReceita: parseFloat(document.getElementById('mp-impacto-receita').value) || 0,
                    impactoMargem: parseFloat(document.getElementById('mp-impacto-margem').value) || 0
                },
                meiosPagamento: {
                    ativar: document.getElementById('mp-pag-ativar').value === '1',
                    distribuicaoAtual: {
                        vista: parseInt(document.getElementById('mp-pag-vista-atual').value) || 0,
                        prazo: parseInt(document.getElementById('mp-pag-prazo-atual').value) || 0
                    },
                    distribuicaoNova: {
                        vista: parseInt(document.getElementById('mp-pag-vista-novo').value) || 0,
                        dias30: parseInt(document.getElementById('mp-pag-30-novo').value) || 0,
                        dias60: parseInt(document.getElementById('mp-pag-60-novo').value) || 0,
                        dias90: parseInt(document.getElementById('mp-pag-90-novo').value) || 0
                    },
                    taxaIncentivo: parseFloat(document.getElementById('mp-pag-taxa-incentivo').value) || 0
                }
            };

            // Inicializar resultados das estratégias
            const resultadosEstrategias = {};

            // Calcular efetividade de cada estratégia ativa
            if (estrategias.ajustePrecos.ativar) {
                resultadosEstrategias.ajustePrecos = calcularEfeitividadeAjustePrecos(dados, estrategias.ajustePrecos, impactoBase);
            }

            if (estrategias.renegociacaoPrazos.ativar) {
                resultadosEstrategias.renegociacaoPrazos = calcularEfeitividadeRenegociacaoPrazos(dados, estrategias.renegociacaoPrazos, impactoBase);
            }

            if (estrategias.antecipacaoRecebiveis.ativar) {
                resultadosEstrategias.antecipacaoRecebiveis = calcularEfeitividadeAntecipacaoRecebiveis(dados, estrategias.antecipacaoRecebiveis, impactoBase);
            }

            if (estrategias.capitalGiro.ativar) {
                resultadosEstrategias.capitalGiro = calcularEfeitividadeCapitalGiro(dados, estrategias.capitalGiro, impactoBase);
            }

            if (estrategias.mixProdutos.ativar) {
                resultadosEstrategias.mixProdutos = calcularEfeitividadeMixProdutos(dados, estrategias.mixProdutos, impactoBase);
            }

            if (estrategias.meiosPagamento.ativar) {
                resultadosEstrategias.meiosPagamento = calcularEfeitividadeMeiosPagamento(dados, estrategias.meiosPagamento, impactoBase);
            }

            // Calcular efetividade combinada
            const efeitividadeCombinada = calcularEfeitividadeCombinada(dados, estrategias, resultadosEstrategias, impactoBase);

            // O problema ocorre quando a estratégia "Renegociação de Prazos" é selecionada como ótima
			// mas seus valores de custo não estão sendo capturados corretamente

			// Adicione este código onde a combinação ótima é definida:
			if (estrategias.renegociacaoPrazos && estrategias.renegociacaoPrazos.ativar) {
				// Assegurar que o custo da renegociação de prazos seja calculado corretamente
				const resultado = resultadosEstrategias.renegociacaoPrazos;

				// Verificar se o custoTotal está sendo calculado e atribuído
				if (resultado && typeof resultado.custoTotal === 'undefined') {
					// Calcular o custo total a partir dos dados disponíveis
					const percFornecedores = estrategias.renegociacaoPrazos.percentualFornecedores / 100;
					const custoContrapartida = estrategias.renegociacaoPrazos.custoContrapartida / 100;

					// Calcular custo com base na contrapartida
					resultado.custoTotal = resultado.impactoFluxoCaixa * custoContrapartida * percFornecedores;
				}
			}

			// Determinar a estratégia ótima
			let estrategiasSelecionadas = [];
			let nomesEstrategias = [];
			let efetividadeTotal = 0;
			let mitigacaoTotal = 0;
			let custoTotal = 0;

			// Identificar as estratégias ativas e calcular seus impactos
			Object.entries(resultadosEstrategias).forEach(([codigo, resultado]) => {
				if (!resultado) return;

				estrategiasSelecionadas.push(resultado);
				nomesEstrategias.push(traduzirNomeEstrategia(codigo));

				// Somar a efetividade (evitando duplicação de impacto)
				efetividadeTotal = Math.max(efetividadeTotal, resultado.efetividadePercentual/100 || 0);

				// Calcular impacto e custo com base no tipo de estratégia
				let impacto = 0;
				let custo = 0;

				switch (codigo) {
					case 'ajustePrecos':
						impacto = resultado.fluxoCaixaAdicional || 0;
						custo = resultado.custoEstrategia || 0;
						break;
					case 'renegociacaoPrazos':
						impacto = resultado.impactoFluxoCaixa || 0;
						custo = resultado.custoTotal || 0;
						break;
					case 'antecipacaoRecebiveis':
						impacto = resultado.impactoFluxoCaixa || 0;
						custo = resultado.custoTotalAntecipacao || 0;
						break;
					case 'capitalGiro':
						impacto = resultado.valorFinanciamento || 0;
						custo = resultado.custoTotalFinanciamento || 0;
						break;
					case 'mixProdutos':
						impacto = resultado.impactoFluxoCaixa || 0;
						custo = resultado.custoImplementacao || 0;
						break;
					case 'meiosPagamento':
						impacto = resultado.impactoLiquido || 0;
						custo = resultado.custoTotalIncentivo || 0;
						break;
				}

				mitigacaoTotal += impacto;
				custoTotal += custo;
			});

			// Calcular a relação custo-benefício
			const custoBeneficio = custoTotal > 0 ? 
				mitigacaoTotal / custoTotal : 
				mitigacaoTotal > 0 ? 999 : 0;

			// Criação do objeto combinacaoOtima
			const combinacaoOtima = {
				estrategiasSelecionadas: estrategiasSelecionadas,
				nomeEstrategias: nomesEstrategias,
				efetividadePercentual: efetividadeTotal,
				mitigacaoTotal: mitigacaoTotal,
				custoTotal: custoTotal,
				custoBeneficio: custoBeneficio
			};

            // Consolidar resultados
            const resultados = {
                impactoBase,
                estrategias,
                resultadosEstrategias,
                efeitividadeCombinada,
                combinacaoOtima
            };

            // Armazenar resultados para uso posterior
            window.resultadosEstrategias = resultados;

            // Exibir resultados
            exibirResultadosEstrategias(resultados);

            // Atualizar gráficos
            gerarGraficoEstrategias(resultados);

            console.log('Simulação de estratégias concluída com sucesso');
            return resultados;
        } catch (error) {
            console.error('Erro ao simular estratégias:', error);
            alert('Ocorreu um erro durante a simulação das estratégias: ' + error.message);
        }
    }

    /**
     * Exibe os resultados das estratégias de mitigação na interface
     * 
     * @param {Object} resultados - Resultados da simulação de estratégias
     */
    function exibirResultadosEstrategias(resultados) {
        const containerResultados = document.getElementById('resultados-estrategias');
        if (!containerResultados) return;

        // Formatar valores para exibição
        const formatarMoeda = (valor) => (valor !== undefined && valor !== null) 
			? `R$ ${valor.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`
			: "R$ 0,00";
        // Em simulator.js, onde estiver a função formatarPercent
		const formatarPercent = (valor) => {
			// Verificar se o valor é válido
			const valorNumerico = parseFloat(valor);
			if (isNaN(valorNumerico)) {
				return "0.00%";
			}

			// Não multiplicar por 100 novamente
			return `${valorNumerico.toFixed(2)}%`;
		};

        // Construir HTML dos resultados
        let html = `
            <div class="result-card">
                <h3>Resultados das Estratégias de Mitigação</h3>

                <div class="result-section">
                    <h4>Impacto Original do Split Payment</h4>
					<p>Redução no capital de giro: ${formatarMoeda(Math.abs(resultados.impactoBase.diferencaCapitalGiro || 0))}</p>
					<p>Necessidade adicional: ${formatarMoeda(resultados.impactoBase.necessidadeAdicionalCapitalGiro || 0)}</p>
					<p>Impacto na margem: ${formatarPercent(resultados.impactoBase.impactoMargem?.valorPontoPercentual || 0)}</p>
				</div>
        `;

        // Adicionar resumo de cada estratégia ativa
        const estrategiasAtivas = Object.entries(resultados.resultadosEstrategias)
            .filter(([_, resultado]) => resultado !== null);

        if (estrategiasAtivas.length > 0) {
            html += `
                <div class="result-section">
                    <h4>Efetividade das Estratégias</h4>
                    <table class="result-table">
                        <tr>
                            <th>Estratégia</th>
                            <th>Efetividade</th>
                            <th>Impacto</th>
                            <th>Custo</th>
                        </tr>
            `;

            estrategiasAtivas.forEach(([nome, resultado]) => {
                const nomeFormatado = traduzirNomeEstrategia(nome);
                let impacto = 0;
                let custo = 0;

                // Extrair impacto e custo específicos de cada estratégia
                switch (nome) {
                    case 'ajustePrecos':
                        impacto = resultado.fluxoCaixaAdicional || 0;
                        custo = resultado.custoEstrategia || 0;
                        break;
                    case 'renegociacaoPrazos':
                        impacto = resultado.impactoFluxoCaixa || 0;
                        custo = resultado.custoTotal || 0;
                        break;
                    case 'antecipacaoRecebiveis':
                        impacto = resultado.impactoFluxoCaixa || 0;
                        custo = resultado.custoTotalAntecipacao || 0;
                        break;
                    case 'capitalGiro':
                        impacto = resultado.valorFinanciamento || 0;
                        custo = resultado.custoTotalFinanciamento || 0;
                        break;
                    case 'mixProdutos':
                        impacto = resultado.impactoFluxoCaixa || 0;
                        custo = resultado.custoImplementacao || 0;
                        break;
                    case 'meiosPagamento':
                        impacto = resultado.impactoLiquido || 0;
                        custo = resultado.custoTotalIncentivo || 0;
                        break;
                }

                html += `
                    <tr>
                        <td>${nomeFormatado}</td>
                        <td>${formatarPercent(resultado.efetividadePercentual/100)}</td>
                        <td>${formatarMoeda(impacto)}</td>
                        <td>${formatarMoeda(custo)}</td>
                    </tr>
                `;
            });

            html += `</table></div>`;
        } else {
            html += `
                <div class="result-section">
                    <p class="warning">Nenhuma estratégia de mitigação foi selecionada. Ative pelo menos uma estratégia para visualizar os resultados.</p>
                </div>
            `;
        }

        // Adicionar resultados combinados se houver estratégias ativas
        if (estrategiasAtivas.length > 0) {
            html += `
                <div class="result-section">
                    <h4>Resultado Combinado</h4>
                    <p>Efetividade total: ${formatarPercent(resultados.efeitividadeCombinada.efetividadePercentual/100)}</p>
                    <p>Mitigação total: ${formatarMoeda(resultados.efeitividadeCombinada.mitigacaoTotal)}</p>
                    <p>Custo total: ${formatarMoeda(resultados.efeitividadeCombinada.custoTotal)}</p>
                    <p>Relação custo-benefício: ${resultados.efeitividadeCombinada.custoBeneficio.toFixed(2)}</p>
                </div>
            `;

            // Adicionar combinação ótima
            html += `
                <div class="result-section">
                    <h4>Combinação Ótima de Estratégias</h4>
                    <p>Estratégias recomendadas: ${resultados.combinacaoOtima.nomeEstrategias.join(', ')}</p>
                    <p>Efetividade: ${formatarPercent(resultados.combinacaoOtima.efetividadePercentual/100)}</p>
                    <p>Custo total: ${formatarMoeda(resultados.combinacaoOtima.custoTotal)}</p>
                    <p>Relação custo-benefício: ${resultados.combinacaoOtima.custoBeneficio.toFixed(2)}</p>
                </div>
            `;
        }

        html += `</div>`;

        // Inserir HTML no container
        containerResultados.innerHTML = html;
    }

    /**
     * Gera o gráfico comparativo das estratégias de mitigação
     * 
     * @param {Object} resultados - Resultados da simulação de estratégias
     */
    function gerarGraficoEstrategias(resultados) {
        // Verificar se o Chart.js está disponível
        if (typeof Chart === 'undefined') {
            console.error('Chart.js não está disponível para gerar o gráfico de estratégias');
            return;
        }

        // Verificar se há um canvas para o gráfico
        const canvas = document.getElementById('grafico-estrategias');
        if (!canvas) {
            console.error('Canvas para gráfico de estratégias não encontrado');
            return;
        }

        // Destruir gráfico existente, se houver
        if (window.graficoEstrategias instanceof Chart) {
            window.graficoEstrategias.destroy();
        }

        // Preparar dados para o gráfico
        const estrategiasAtivas = Object.entries(resultados.resultadosEstrategias)
            .filter(([_, resultado]) => resultado !== null);

        if (estrategiasAtivas.length === 0) {
            return;
        }

        // Extrair efetividade das estratégias
        const labels = ['Sem Estratégia'];
        const data = [0]; // Sem estratégia: 0% de mitigação
        const backgroundColors = ['rgba(220, 53, 69, 0.6)']; // Vermelho para "Sem Estratégia"

        // Adicionar cada estratégia ativa
        estrategiasAtivas.forEach(([nome, resultado]) => {
            labels.push(traduzirNomeEstrategia(nome));
            data.push(resultado.efetividadePercentual);

            // Cores para cada estratégia
            switch (nome) {
                case 'ajustePrecos': 
                    backgroundColors.push('rgba(52, 152, 219, 0.6)'); // Azul
                    break;
                case 'renegociacaoPrazos': 
                    backgroundColors.push('rgba(46, 204, 113, 0.6)'); // Verde
                    break;
                case 'antecipacaoRecebiveis': 
                    backgroundColors.push('rgba(155, 89, 182, 0.6)'); // Roxo
                    break;
                case 'capitalGiro': 
                    backgroundColors.push('rgba(241, 196, 15, 0.6)'); // Amarelo
                    break;
                case 'mixProdutos': 
                    backgroundColors.push('rgba(230, 126, 34, 0.6)'); // Laranja
                    break;
                case 'meiosPagamento': 
                    backgroundColors.push('rgba(52, 73, 94, 0.6)'); // Azul escuro
                    break;
                default:
                    backgroundColors.push('rgba(149, 165, 166, 0.6)'); // Cinza
            }
        });

        // Adicionar combinação de estratégias
        labels.push('Todas Estratégias');
        data.push(resultados.efeitividadeCombinada.efetividadePercentual/100);
        backgroundColors.push('rgba(39, 174, 96, 0.6)'); // Verde escuro

        // Adicionar combinação ótima se diferente de "Todas Estratégias"
        if (estrategiasAtivas.length !== resultados.combinacaoOtima.estrategiasSelecionadas.length) {
            labels.push('Combinação Ótima');
            data.push(resultados.combinacaoOtima.efetividadePercentual/100);
            backgroundColors.push('rgba(41, 128, 185, 0.6)'); // Azul médio
        }

        // Configurar e criar o gráfico
        window.graficoEstrategias = new Chart(canvas.getContext('2d'), {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Efetividade de Mitigação (%)',
                    data: data,
                    backgroundColor: backgroundColors,
                    borderColor: backgroundColors.map(color => color.replace('0.6', '1')),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Efetividade (%)'
                        },
                        max: 100,
                        ticks: {
                            callback: value => value + '%'
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Comparação de Efetividade das Estratégias de Mitigação',
                        font: {
                            size: 16
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return 'Efetividade: ' + context.raw.toFixed(2) + '%';
                            }
                        }
                    }
                }
            }
        });
    }
