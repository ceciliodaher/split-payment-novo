/**
 * Gerenciador de formulários
 */
const FormsManager = {
    /**
     * Inicializa o gerenciador de formulários
     */
    inicializar: function() {
        console.log('Inicializando gerenciador de formulários');
        
        // Inicializar formatação para campos monetários
        this.inicializarCamposMonetarios();
        
        // Inicializar formatação para campos percentuais
        this.inicializarCamposPercentuais();
        
        // Inicializar cálculo automático do ciclo financeiro
        this.inicializarCalculoCicloFinanceiro();
        
        // Inicializar atualização automática de percentuais
        this.inicializarAtualizacaoPercentuais();
        
        // Inicializar cálculo de elasticidade
        this.inicializarCalculoElasticidade();
        
        // Inicializar exibição de campos para cenário personalizado
        this.inicializarCenarioPersonalizado();
        
        console.log('Gerenciador de formulários inicializado');
    },
    
    /**
     * Inicializa campos monetários
     */
    inicializarCamposMonetarios: function() {
        const camposMonetarios = document.querySelectorAll('.money-input');
        camposMonetarios.forEach(campo => {
            FormatacaoHelper.formatarInputMonetario(campo);
        });
    },
    
    /**
     * Inicializa campos percentuais
     */
    inicializarCamposPercentuais: function() {
        const camposPercentuais = document.querySelectorAll('.percent-input');
        camposPercentuais.forEach(campo => {
            FormatacaoHelper.formatarInputPercentual(campo);
        });
    },
    
    // Substituir a função inicializarCalculoCicloFinanceiro completa por:
	inicializarCalculoCicloFinanceiro: function() {
		const self = this; // Capturar o contexto do FormsManager
		const campos = ['pmr', 'pmp', 'pme'];
		
		campos.forEach(id => {
			const campo = document.getElementById(id);
			if (campo) {
				campo.addEventListener('input', function() {
					self.calcularCicloFinanceiro();
				});
			}
		});
		
		// Adicionar evento para o checkbox de split payment
		const checkSplit = document.getElementById('considerar-split');
		if (checkSplit) {
			checkSplit.addEventListener('change', function() {
				self.calcularCicloFinanceiro();
				
				// Mostrar ou ocultar campos de NCG
				const camposNCG = document.getElementById('campos-ncg');
				if (camposNCG) {
					camposNCG.style.display = this.checked ? 'block' : 'none';
				}
			});
		}
		
		// Adicionar eventos para campos adicionais que afetam o cálculo com split payment
		const camposAdicionais = ['faturamento', 'aliquota', 'perc-vista', 'perc-prazo', 'data-inicial'];
		camposAdicionais.forEach(id => {
			const campo = document.getElementById(id);
			if (campo) {
				// Para inputs de texto e número
				campo.addEventListener('input', function() {
					// Só recalcular se o split payment estiver ativado
					if (document.getElementById('considerar-split')?.checked) {
						self.calcularCicloFinanceiro();
					}
				});
				
				// Para selects e campos de data
				if (campo.tagName === 'SELECT' || campo.type === 'date') {
					campo.addEventListener('change', function() {
						// Só recalcular se o split payment estiver ativado
						if (document.getElementById('considerar-split')?.checked) {
							self.calcularCicloFinanceiro();
						}
					});
				}
			}
		});
		
		// Calcular valor inicial
		this.calcularCicloFinanceiro();
	},

        // Adicionar evento para o checkbox de split payment
        const checkSplit = document.getElementById('considerar-split');
        if (checkSplit) {
            checkSplit.addEventListener('change', () => {
                this.calcularCicloFinanceiro();

                // Mostrar ou ocultar campos de NCG
                const camposNCG = document.getElementById('campos-ncg');
                if (camposNCG) {
                    camposNCG.style.display = checkSplit.checked ? 'block' : 'none';
                }
            });
        }

        // Adicionar eventos para campos adicionais que afetam o cálculo com split payment
        const camposAdicionais = ['faturamento', 'aliquota', 'perc-vista', 'perc-prazo', 'data-inicial'];
        camposAdicionais.forEach(id => {
            const campo = document.getElementById(id);
            if (campo) {
                // Para inputs de texto e número
                campo.addEventListener('input', () => {
                    // Só recalcular se o split payment estiver ativado
                    if (document.getElementById('considerar-split')?.checked) {
                        this.calcularCicloFinanceiro();
                    }
                });

                // Para selects e campos de data
                if (campo.tagName === 'SELECT' || campo.type === 'date') {
                    campo.addEventListener('change', () => {
                        // Só recalcular se o split payment estiver ativado
                        if (document.getElementById('considerar-split')?.checked) {
                            this.calcularCicloFinanceiro();
                        }
                    });
                }
            }
        });

        // Calcular valor inicial
        this.calcularCicloFinanceiro();
    },
    
    /**
     * Calcula o ciclo financeiro
     */
    calcularCicloFinanceiro: function() {
		try {
			// Recuperar valores básicos
			const pmr = parseInt(document.getElementById('pmr')?.value) || 0;
			const pmp = parseInt(document.getElementById('pmp')?.value) || 0;
			const pme = parseInt(document.getElementById('pme')?.value) || 0;

			// Verificar se estamos calculando com split payment
			const comSplitPayment = document.getElementById('considerar-split')?.checked || false;

			if (!comSplitPayment) {
				// Cálculo tradicional
				const ciclo = pmr + pme - pmp;
				const campoCiclo = document.getElementById('ciclo-financeiro');
				if (campoCiclo) {
					campoCiclo.value = ciclo;
				}
				
				// Esconder campos de NCG
				const camposNCG = document.getElementById('campos-ncg');
				if (camposNCG) {
					camposNCG.style.display = 'none';
				}
				
				return;
			}

			// Recuperar ano de referência para percentual de implementação
			const dataInicialElem = document.getElementById('data-inicial');
			const anoReferencia = dataInicialElem && dataInicialElem.value ? 
				dataInicialElem.value.split('-')[0] : '2026';
				
			console.log('Ano de referência:', anoReferencia);

			// Obter percentual de implementação para o ano
			let percentualImplementacao = 0.10; // Valor padrão para 2026

			// Cronograma de implementação definido
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
			
			percentualImplementacao = cronograma[parseInt(anoReferencia)] || 0.10;
			console.log('Percentual de implementação:', percentualImplementacao);

			// Recuperar dados financeiros
			const faturamentoElem = document.getElementById('faturamento');
			const aliquotaElem = document.getElementById('aliquota');
			const percVistaElem = document.getElementById('perc-vista');
			
			// Extrair valores com fallbacks
			const faturamento = faturamentoElem ? 
				FormatacaoHelper.extrairValorNumerico(faturamentoElem.value) : 0;
			const aliquota = aliquotaElem ? 
				parseFloat(aliquotaElem.value) / 100 : 0.265;
			const percVista = percVistaElem ? 
				parseFloat(percVistaElem.value) / 100 : 0.3;
			const percPrazo = 1 - percVista;
			
			console.log('Faturamento:', faturamento, 'Alíquota:', aliquota);

			// Valor tributário total
			const valorTributarioTotal = faturamento * aliquota;
			console.log('Valor tributário total:', valorTributarioTotal);

			// Valor tributário retido via split payment
			const valorTributarioRetido = valorTributarioTotal * percentualImplementacao;
			console.log('Valor tributário retido:', valorTributarioRetido);

			// Ajustar o impacto considerando a proporção de vendas a prazo
			const proporcaoAfetada = percPrazo > 0 ? percPrazo : 1;

			// Impacto no PMR
			const impactoPMR = pmr * (valorTributarioRetido / valorTributarioTotal) * proporcaoAfetada;
			console.log('Impacto no PMR:', impactoPMR);

			// Ciclo financeiro ajustado
			const cicloAjustado = pmr + pme - pmp - impactoPMR;

			// Atualizar campo com valor ajustado
			const campoCiclo = document.getElementById('ciclo-financeiro');
			if (campoCiclo) {
				campoCiclo.value = Math.round(cicloAjustado * 100) / 100;
			}

			// Calcular necessidade de capital de giro (NCG)
			const faturamentoDiario = faturamento / 30;
			const ncgAtual = faturamentoDiario * (pmr + pme - pmp);
			const ncgAjustada = faturamentoDiario * cicloAjustado;
			const diferencaNCG = ncgAjustada - ncgAtual;
			
			console.log('NCG Atual:', ncgAtual, 'NCG Ajustada:', ncgAjustada);

			// Atualizar campos de NCG
			const campoNCGAtual = document.getElementById('ncg-atual');
			const campoNCGAjustada = document.getElementById('ncg-ajustada');
			const campoDiferencaNCG = document.getElementById('diferenca-ncg');

			if (campoNCGAtual) campoNCGAtual.value = FormatacaoHelper.formatarMoeda(ncgAtual);
			if (campoNCGAjustada) campoNCGAjustada.value = FormatacaoHelper.formatarMoeda(ncgAjustada);
			if (campoDiferencaNCG) {
				campoDiferencaNCG.value = FormatacaoHelper.formatarMoeda(diferencaNCG);
				// Adicionar classe para formatação visual (negativo em vermelho, positivo em verde)
				campoDiferencaNCG.classList.remove('positive-impact', 'negative-impact');
				campoDiferencaNCG.classList.add(diferencaNCG >= 0 ? 'positive-impact' : 'negative-impact');
			}
			
			// Mostrar campos de NCG
			const camposNCG = document.getElementById('campos-ncg');
			if (camposNCG) {
				camposNCG.style.display = 'block';
			}
		} catch (error) {
			console.error('Erro ao calcular ciclo financeiro:', error);
		}
	},
    
    /**
     * Inicializa atualização automática de percentuais
     */
    inicializarAtualizacaoPercentuais: function() {
		const self = this; // Capture FormsManager context
		const campoPercVista = document.getElementById('perc-vista');
		if (campoPercVista) {
			campoPercVista.addEventListener('input', function() {
				self.atualizarPercPrazo(); // Use captured context
			});
			campoPercVista.addEventListener('blur', function() {
				self.atualizarPercPrazo(); // Use captured context
			});
		}
		
		// Update initial value
		this.atualizarPercPrazo();
	},
    
    /**
     * Atualiza o percentual de vendas a prazo
     */
    atualizarPercPrazo: function() {
        const campoPercVista = document.getElementById('perc-vista');
        const campoPercPrazo = document.getElementById('perc-prazo');
        
        if (campoPercVista && campoPercPrazo) {
            const valorPercVista = FormatacaoHelper.extrairValorNumerico(campoPercVista.value) / 100;
            const valorPercPrazo = Math.max(0, Math.min(1, 1 - valorPercVista));
            
            campoPercPrazo.value = FormatacaoHelper.formatarPercentual(valorPercPrazo);
        }
    },
    
    /**
     * Inicializa cálculo de elasticidade
     */
    inicializarCalculoElasticidade: function() {
        const campoPercentual = document.getElementById('ap-percentual');
        const campoElasticidade = document.getElementById('ap-elasticidade');
        
        if (campoPercentual && campoElasticidade) {
            campoPercentual.addEventListener('input', () => {
                this.calcularImpactoElasticidade();
            });
            
            campoElasticidade.addEventListener('input', () => {
                this.calcularImpactoElasticidade();
            });
        }
        
        // Calcular valor inicial
        this.calcularImpactoElasticidade();
    },
    
    /**
     * Calcula o impacto da elasticidade
     */
    calcularImpactoElasticidade: function() {
        const percentual = parseFloat(document.getElementById('ap-percentual')?.value) || 0;
        const elasticidade = parseFloat(document.getElementById('ap-elasticidade')?.value) || 0;
        
        const impacto = percentual * elasticidade;
        const campoImpacto = document.getElementById('ap-impacto-vendas');
        if (campoImpacto) {
            campoImpacto.value = impacto.toFixed(2);
        }
    },
    
    /**
     * Inicializa exibição de campos para cenário personalizado
     */
    inicializarCenarioPersonalizado: function() {
        const campoCenario = document.getElementById('cenario');
        if (campoCenario) {
            campoCenario.addEventListener('change', () => {
                const divCenarioPersonalizado = document.getElementById('cenario-personalizado');
                if (divCenarioPersonalizado) {
                    divCenarioPersonalizado.style.display = 
                        campoCenario.value === 'personalizado' ? 'block' : 'none';
                }
            });
        }
    }
};
