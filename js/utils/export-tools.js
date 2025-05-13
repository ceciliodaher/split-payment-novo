/**
 * Ferramentas de Exportação de Dados
 * Módulo para exportação dos resultados de simulação em diferentes formatos
 */
const ExportTools = {
    /**
     * Configurações para relatórios Excel
     */
    config: {
        excel: {
            colors: {
                primary: "FF3498DB", // Azul principal
                secondary: "2ECC71", // Verde
                accent: "E74C3C", // Vermelho
                neutral: "7F8C8D", // Cinza
                highlight: "9B59B6", // Roxo
                background: "F8F9FA", // Fundo claro
                headerBg: "EAEAEA", // Fundo de cabeçalho
                lightBg1: "F5F8FA", // Fundo claro 1 (alternado para tabelas)
                lightBg2: "FFFFFF" // Fundo claro 2 (alternado para tabelas)
            },
            defaultColumnWidth: 15, // Largura padrão de coluna em caracteres
            defaultRowHeight: 18, // Altura padrão de linha em pontos
            defaultFontName: "Calibri", // Fonte padrão
            defaultFontSize: 11, // Tamanho da fonte padrão
            defaultBoldFontSize: 11, // Tamanho da fonte em negrito
            defaultHeaderFontSize: 14, // Tamanho da fonte para cabeçalhos
            defaultTitleFontSize: 16, // Tamanho da fonte para títulos
            logoEnabled: true, // Habilitar logo
            logoSize: {
                // Tamanho do logo
                width: 180,
                height: 60
            }
        },

        /**
         * Configurações para relatórios PDF
         */
        pdf: {
            pageSize: "a4",
            orientation: "portrait",
            margins: {
                top: 25,
                right: 15,
                bottom: 25,
                left: 15
            },
            headerHeight: 20,
            footerHeight: 15,
            colors: {
                primary: [52, 152, 219], // Azul principal
                secondary: [46, 204, 113], // Verde
                accent: [231, 76, 60], // Vermelho
                neutral: [127, 140, 141], // Cinza
                highlight: [155, 89, 182] // Roxo
            },
            fonts: {
                header: {
                    name: "helvetica",
                    style: "bold",
                    size: 18
                },
                subtitle: {
                    name: "helvetica",
                    style: "bold",
                    size: 14
                },
                section: {
                    name: "helvetica",
                    style: "bold",
                    size: 12
                },
                normal: {
                    name: "helvetica",
                    style: "normal",
                    size: 10
                },
                small: {
                    name: "helvetica",
                    style: "normal",
                    size: 8
                }
            },
            logoPath: "assets/images/expertzy-it.png",
            logoEnabled: true,
            logoSize: {
                width: 40,
                height: 15
            }
        }
    },

    /**
     * Inicializa o exportador com configurações personalizadas
     * @param {Object} customConfig - Configurações personalizadas
     */
    init: function (customConfig = {}) {
        // Configuração padrão de cores caso não seja fornecida
        const defaultColors = {
            primary: "FF3498DB", // Azul principal
            secondary: "2ECC71", // Verde
            accent: "E74C3C", // Vermelho
            neutral: "7F8C8D", // Cinza
            highlight: "9B59B6", // Roxo
            background: "F8F9FA", // Fundo claro
            headerBg: "EAEAEA", // Fundo de cabeçalho
            lightBg1: "F5F8FA", // Fundo claro 1 (alternado para tabelas)
            lightBg2: "FFFFFF" // Fundo claro 2 (alternado para tabelas)
        };

        // Garante que a configuração tenha a propriedade colors
        if (!customConfig.excel) customConfig.excel = {};
        if (!customConfig.excel.colors) customConfig.excel.colors = defaultColors;

        this.config = { ...this.config, ...customConfig };
        return this;
    },

    /**
     * Exporta os resultados da simulação para PDF
     */
    exportarParaPDF: function () {
        console.log("Iniciando exportação para PDF");

        // Verificar se a biblioteca foi carregada
        if (!window.jsPDFLoaded && !window.jspdf && !window.jsPDF) {
            alert('Biblioteca jsPDF não foi carregada. Tente novamente em alguns segundos.');
            return Promise.reject('jsPDF não disponível');
        }

        // Verificação robusta da simulação
        if (!window.ultimaSimulacao) {
            alert('Nenhuma simulação realizada ainda');
            return Promise.reject('Simulação não realizada');
        }

        try {
            // Obter resultadosExportacao de qualquer localização
            const resultadosExportacao = window.ultimaSimulacao.resultadosExportacao || 
                                      (window.ultimaSimulacao.resultados && 
                                       window.ultimaSimulacao.resultados.resultadosExportacao);

            // Verificar dados mínimos necessários
            if (!resultadosExportacao || !resultadosExportacao.resultadosPorAno) {
                console.warn("Estrutura resultadosExportacao incompleta");
                // Continuar mesmo assim, algumas seções serão geradas com dados básicos
            }

            // Solicitar nome do arquivo ao usuário
            const nomeArquivo = this._solicitarNomeArquivo("pdf", "relatorio-split-payment");
            if (!nomeArquivo) {
                return Promise.resolve({success: false, message: "Exportação cancelada pelo usuário"});
            }

            // Criar documento PDF com configurações definidas
            const doc = new window.jspdf.jsPDF({
                orientation: this.config.pdf.orientation || "portrait",
                unit: "mm",
                format: this.config.pdf.pageSize || "a4",
                compress: true
            });

            // Definir propriedades do documento
            doc.setProperties({
                title: "Relatório Simulador de Split Payment",
                subject: "Análise do impacto do Split Payment no fluxo de caixa",
                author: "Expertzy Inteligência Tributária",
                keywords: "Split Payment, Reforma Tributária, Fluxo de Caixa, Simulação",
                creator: "Expertzy IT"
            });

            // Inicializar contagem de páginas para numeração
            let pageCount = 1;
            let currentPositionY = 0;
            const margins = this.config.pdf.margins;

            // Adicionar capa
            this._adicionarCapa(doc, window.ultimaSimulacao.dados || {}, pageCount);
            doc.addPage();
            pageCount++;

            // Adicionar índice
            currentPositionY = this._adicionarIndice(doc, pageCount);
            doc.addPage();
            pageCount++;

            // Adicionar parâmetros da simulação
            currentPositionY = this._adicionarParametrosSimulacao(doc, window.ultimaSimulacao.dados || {}, pageCount);
            doc.addPage();
            pageCount++;

            // Adicionar resultados da simulação - versão robusta
            currentPositionY = this._adicionarResultadosSimulacaoRobusto(
                doc, 
                window.ultimaSimulacao, 
                resultadosExportacao,
                pageCount
            );
            doc.addPage();
            pageCount++;

            // Adicionar gráficos - com verificação de existência
            currentPositionY = this._adicionarGraficosRobusto(doc, pageCount);
            doc.addPage();
            pageCount++;

            // Adicionar análise de estratégias - com verificação de existência
            currentPositionY = this._adicionarAnaliseEstrategiasRobusto(
                doc, 
                window.ultimaSimulacao.dados || {}, 
                window.ultimaSimulacao, 
                pageCount
            );
            doc.addPage();
            pageCount++;

            // Adicionar memória de cálculo
            const obterMemoriaCalculo = function() {
                const anoSelecionado =
                    document.getElementById("select-ano-memoria")?.value ||
                    (window.memoriaCalculoSimulacao ? Object.keys(window.memoriaCalculoSimulacao)[0] : "2026");
                return window.memoriaCalculoSimulacao && window.memoriaCalculoSimulacao[anoSelecionado]
                    ? window.memoriaCalculoSimulacao[anoSelecionado]
                    : "Memória de cálculo não disponível para o ano selecionado.";
            };
            currentPositionY = this._adicionarMemoriaCalculo(doc, obterMemoriaCalculo, pageCount);
            doc.addPage();
            pageCount++;

            // Adicionar conclusão
            const aliquotasEquivalentes = window.ultimaSimulacao.aliquotasEquivalentes || {};
            currentPositionY = this._adicionarConclusaoRobusto(
                doc, 
                window.ultimaSimulacao.dados || {}, 
                window.ultimaSimulacao, 
                pageCount, 
                aliquotasEquivalentes
            );

            // Adicionar cabeçalho e rodapé em todas as páginas (exceto capa)
            this._adicionarCabecalhoRodape(doc, pageCount);

            // Salvar o arquivo
            doc.save(nomeArquivo);

            return Promise.resolve({
                success: true,
                message: "Relatório exportado com sucesso!",
                fileName: nomeArquivo
            });
        } catch (error) {
            console.error(`Erro ao exportar para PDF: ${error.message}`, error);
            alert(`Erro ao exportar para PDF: ${error.message}`);

            return Promise.reject({
                success: false,
                message: `Erro ao exportar para PDF: ${error.message}`,
                error: error
            });
        }
    },

    /**
     * Verifica se a estrutura de dados da simulação é válida e completa
     * @private
     * @param {Object} simulacao - Objeto de simulação
     * @returns {boolean} - Indica se a estrutura é válida
     */
    _verificarEstruturaDados: function(simulacao) {
        // Verificar dados básicos
        if (!simulacao || !simulacao.dados) {
            console.warn('Dados básicos da simulação não encontrados');
            return false;
        }

        // Verificar estrutura de resultadosExportacao (em qualquer localização)
        const resultadosExportacao = simulacao.resultadosExportacao || 
                                  (simulacao.resultados && simulacao.resultados.resultadosExportacao);

        if (!resultadosExportacao || !resultadosExportacao.resultadosPorAno) {
            console.warn('Estrutura resultadosExportacao não encontrada ou incompleta');
            return false;
        }

        // Tudo verificado e ok
        return true;
    },

    /**
     * Adiciona conteúdo básico ao PDF, mesmo se a estrutura estiver incompleta
     * @private
     * @param {Object} doc - Documento PDF
     * @param {Object} simulacao - Objeto de simulação
     */
    _adicionarConteudoBasico: function(doc, simulacao) {
        // Configuração de margens
        const margins = this.config.pdf && this.config.pdf.margins
            ? this.config.pdf.margins
            : { top: 25, right: 15, bottom: 25, left: 15 };

        // Extrai os dados disponíveis (com segurança)
        const dados = simulacao.dados || {};

        // Adicionar capa
        let pageCount = 1;
        this._adicionarCapa(doc, dados, pageCount);

        // Adicionar cabeçalho e rodapé
        this._adicionarCabecalhoRodape(doc, pageCount);
    },

    /**
     * Adiciona conteúdo detalhado ao PDF quando a estrutura estiver completa
     * @private
     * @param {Object} doc - Documento PDF
     * @param {Object} simulacao - Objeto de simulação
     */
    _adicionarConteudoDetalhado: function(doc, simulacao) {
        // Aqui você pode adicionar o resto das seções do relatório
        // Usando o código existente, mas com verificações robustas

        // Configuração de margens
        const margins = this.config.pdf && this.config.pdf.margins
            ? this.config.pdf.margins
            : { top: 25, right: 15, bottom: 25, left: 15 };

        let pageCount = 1;

        // Adicionar novas páginas e seções
        doc.addPage();
        pageCount++;

        // Adicionar parâmetros da simulação
        this._adicionarParametrosSimulacao(doc, simulacao.dados, pageCount);

        doc.addPage();
        pageCount++;

        // Resultados da simulação
        const resultadosExportacao = simulacao.resultadosExportacao || 
                                  (simulacao.resultados && simulacao.resultados.resultadosExportacao);

        this._adicionarResultadosSimulacao(doc, simulacao, resultadosExportacao, pageCount);

        // Adicionar mais seções conforme necessário
        // ...
    },

    /**
     * Adiciona a memória de cálculo com formatação aprimorada
     * @private
     * @param {jsPDF} doc - Documento PDF
     * @param {Function} obterMemoriaCalculo - Função para obter a memória de cálculo
     * @param {number} pageNumber - Número da página
     * @returns {number} Posição Y após adicionar o conteúdo
     */
    _adicionarMemoriaCalculo: function(doc, obterMemoriaCalculo, pageNumber) {
        const margins = this.config.pdf.margins;
        const pageWidth = doc.internal.pageSize.width;
        let currentY = margins.top + 10;

        // Adicionar cabeçalho da seção
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.setTextColor(this.config.pdf.colors.primary[0], this.config.pdf.colors.primary[1], this.config.pdf.colors.primary[2]);
        doc.text('5. Memória de Cálculo', margins.left, currentY);

        currentY += 15;

        // Texto introdutório
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(60, 60, 60);

        const introTexto = [
            "Esta seção apresenta os detalhes dos cálculos realizados na simulação, permitindo a verificação ",
            "e auditoria dos resultados. A memória de cálculo inclui todas as etapas do processo, desde a aplicação ",
            "das alíquotas até o cálculo final dos impostos."
        ].join('');

        const splitIntro = doc.splitTextToSize(introTexto, pageWidth - margins.left - margins.right);
        doc.text(splitIntro, margins.left, currentY);

        currentY += splitIntro.length * 5 + 10;

        // Obter a memória de cálculo
        let memoriaTexto = "";

        try {
            if (typeof obterMemoriaCalculo === "function") {
                // É uma função, chamá-la para obter a memória
                memoriaTexto = obterMemoriaCalculo() || "";
            } else if (obterMemoriaCalculo && typeof obterMemoriaCalculo === "object") {
                // É um objeto, pegar o primeiro ano disponível
                const primeiroAno = Object.keys(obterMemoriaCalculo)[0];
                memoriaTexto = obterMemoriaCalculo[primeiroAno] || "";
            } else if (window.memoriaCalculoSimulacao) {
                // Tentar obter do objeto global
                const anoSelecionado =
                    document.getElementById("select-ano-memoria")?.value ||
                    Object.keys(window.memoriaCalculoSimulacao)[0];
                memoriaTexto = window.memoriaCalculoSimulacao[anoSelecionado] || "";
            } else {
                // Nada disponível
                memoriaTexto = "Memória de cálculo não disponível.";
            }
        } catch (error) {
            console.error("Erro ao processar memória de cálculo:", error);
            memoriaTexto = "Erro ao processar memória de cálculo: " + error.message;
        }

        if (memoriaTexto) {
            // Formatar memória de cálculo para exibição
            doc.setFont('courier', 'normal');
            doc.setFontSize(7);
            doc.setTextColor(30, 30, 30);

            // Dividir em linhas e limitar a quantidade
            const linhasMemoria = memoriaTexto.split('\n');
            const maxLinhas = 200; // Limitar a quantidade de linhas para não deixar o PDF muito grande

            const linhasExibidas = linhasMemoria.slice(0, maxLinhas);
            if (linhasMemoria.length > maxLinhas) {
                linhasExibidas.push('... (memória de cálculo truncada para manter o tamanho do documento)');
            }

            // Processar linhas
            for (let i = 0; i < linhasExibidas.length; i++) {
                const linha = linhasExibidas[i];

                // Verificar se a linha é um título de seção
                if (linha.includes('===')) {
                    doc.setFont('courier', 'bold');
                    doc.setTextColor(this.config.pdf.colors.primary[0], this.config.pdf.colors.primary[1], this.config.pdf.colors.primary[2]);
                } else {
                    doc.setFont('courier', 'normal');
                    doc.setTextColor(30, 30, 30);
                }

                // Verificar se precisa adicionar nova página
                if (currentY > doc.internal.pageSize.height - margins.bottom - 10) {
                    doc.addPage();
                    pageNumber++;
                    currentY = margins.top + 10;
                }

                // Quebrar linhas longas
                const splitLinha = doc.splitTextToSize(linha, pageWidth - margins.left - margins.right);
                doc.text(splitLinha, margins.left, currentY);

                currentY += splitLinha.length * 3.5;
            }

            // Adicionar nota sobre exportação completa
            currentY += 10;
            doc.setFont("helvetica", "italic");
            doc.setFontSize(9);
            doc.setTextColor(100, 100, 100);

            const notaExportacao = [
                "Nota: Para a memória de cálculo completa e detalhada, recomenda-se utilizar a função 'Exportar Memória de Cálculo' ",
                "disponível no simulador, que gera um arquivo de texto contendo todas as etapas do cálculo sem truncamento."
            ].join('');

            const splitNota = doc.splitTextToSize(notaExportacao, pageWidth - margins.left - margins.right);
            doc.text(splitNota, margins.left, currentY);

            currentY += splitNota.length * 5;
        } else {
            // Mensagem se não houver memória de cálculo
            doc.setFont("helvetica", "italic");
            doc.setFontSize(10);
            doc.setTextColor(150, 150, 150);
            doc.text('Memória de cálculo não disponível. Execute a simulação para gerar os dados detalhados.', margins.left, currentY);

            currentY += 10;
        }

        return currentY;
    },
    
    /**
     * Adiciona a capa do relatório
     * @private
     * @param {jsPDF} doc - Documento PDF
     * @param {Object} dados - Dados do simulador
     * @param {number} pageNumber - Número da página
     * @returns {jsPDF} Documento PDF atualizado
     */
    _adicionarCapa: function(doc, dados, pageNumber) {
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;
        const margins = this.config.pdf.margins;

        // Fundo gradiente sutil na capa
        this._desenharGradiente(doc, 0, 0, pageWidth, pageHeight, 
            [240, 240, 240], [220, 220, 220]);

        let currentY = 50;

        // Logo
        if (this.config.pdf.logoEnabled) {
            try {
                const logoImg = document.querySelector('img.logo');
                if (logoImg && logoImg.complete) {
                    const logoWidth = 70;
                    const logoHeight = (logoImg.height / logoImg.width) * logoWidth;

                    doc.addImage(
                        logoImg, 
                        'PNG', 
                        (pageWidth - logoWidth) / 2, 
                        currentY, 
                        logoWidth, 
                        logoHeight
                    );

                    currentY += logoHeight + 30;
                } else {
                    currentY += 30;
                }
            } catch (e) {
                console.warn('Não foi possível adicionar o logo:', e);
                currentY += 30;
            }
        }

        // Título do relatório
        doc.setFont("helvetica", "bold");
        doc.setFontSize(24);
        doc.setTextColor(this.config.pdf.colors.primary[0], this.config.pdf.colors.primary[1], this.config.pdf.colors.primary[2]);

        const tituloPrincipal = 'RELATÓRIO DE SIMULAÇÃO';
        doc.text(tituloPrincipal, pageWidth / 2, currentY, { align: 'center' });
        currentY += 10;

        const subtitulo = 'IMPACTO DO SPLIT PAYMENT NO FLUXO DE CAIXA';
        doc.text(subtitulo, pageWidth / 2, currentY, { align: 'center' });
        currentY += 30;

        // Informações da empresa
        doc.setFontSize(14);
        doc.setTextColor(60, 60, 60);

        const regimeText = dados.regime ? (dados.regime === 'real' ? 'Lucro Real' : 
            dados.regime === 'presumido' ? 'Lucro Presumido' : 'Simples Nacional') : '';

        const setorText = dados.setor ? dados.setor.charAt(0).toUpperCase() + dados.setor.slice(1) : '';

        const infoText = [
            `Empresa: ${dados.empresa || 'N/A'}`,
            `Setor: ${setorText}`,
            `Regime Tributário: ${regimeText}`,
            `Data: ${new Date().toLocaleDateString('pt-BR')}`
        ];

        infoText.forEach(text => {
            doc.text(text, pageWidth / 2, currentY, { align: 'center' });
            currentY += 10;
        });

        currentY += 30;

        // Detalhes do simulador
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);

        const anoInicial = dados.anoInicial || 2026;
        const anoFinal = dados.anoFinal || 2033;

        const detailText = `Simulação para o período ${anoInicial} - ${anoFinal}`;
        doc.text(detailText, pageWidth / 2, currentY, { align: 'center' });

        // Rodapé da capa
        const footerY = pageHeight - margins.bottom - 10;
        doc.setFontSize(8);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(100, 100, 100);

        doc.text('© 2025 Expertzy Inteligência Tributária', pageWidth / 2, footerY, { align: 'center' });
        doc.text('Confidencial - Uso Interno', pageWidth / 2, footerY + 5, { align: 'center' });

        return doc;
    },
    
    /**
     * Adiciona o índice do relatório
     * @private
     * @param {jsPDF} doc - Documento PDF
     * @param {number} pageNumber - Número da página
     * @returns {number} Posição Y após adicionar o conteúdo
     */
    _adicionarIndice: function(doc, pageNumber) {
        const margins = this.config.pdf.margins;
        const pageWidth = doc.internal.pageSize.width;
        let currentY = margins.top;

        // Título
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.setTextColor(this.config.pdf.colors.primary[0], this.config.pdf.colors.primary[1], this.config.pdf.colors.primary[2]);
        doc.text('Índice', pageWidth / 2, currentY, { align: 'center' });

        currentY += 20;

        // Itens do índice
        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);
        doc.setTextColor(60, 60, 60);

        const indiceItems = [
            { texto: '1. Parâmetros da Simulação', pagina: 3 },
            { texto: '2. Resultados da Simulação', pagina: 4 },
            { texto: '3. Análise Gráfica', pagina: 5 },
            { texto: '4. Estratégias de Mitigação', pagina: 6 },
            { texto: '5. Memória de Cálculo', pagina: 7 },
            { texto: '6. Conclusão e Recomendações', pagina: 8 }
        ];

        indiceItems.forEach(item => {
            // Texto do item
            doc.text(item.texto, margins.left + 5, currentY);

            // Pontilhado
            const startX = doc.getStringUnitWidth(item.texto) * doc.internal.getFontSize() / doc.internal.scaleFactor + margins.left + 10;
            const endX = pageWidth - margins.right - 15;
            this._desenharLinhaPontilhada(doc, startX, currentY - 2, endX, currentY - 2);

            // Número da página
            doc.text(item.pagina.toString(), pageWidth - margins.right - 10, currentY, { align: 'right' });

            currentY += 12;
        });

        return currentY;
    },

    /**
     * Adiciona cabeçalho e rodapé em todas as páginas
     * @private
     * @param {jsPDF} doc - Documento PDF
     * @param {number} pageCount - Número total de páginas
     */
    _adicionarCabecalhoRodape: function(doc, pageCount) {
        // Percorrer todas as páginas (exceto a capa)
        for (let i = 2; i <= pageCount; i++) {
            doc.setPage(i);

            const pageWidth = doc.internal.pageSize.width;
            const pageHeight = doc.internal.pageSize.height;
            const margins = this.config.pdf.margins;

            // Cabeçalho
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.5);
            doc.line(margins.left, margins.top - 5, pageWidth - margins.right, margins.top - 5);

            // Logo no cabeçalho (se disponível)
            if (this.config.pdf.logoEnabled) {
                try {
                    const logoImg = document.querySelector('img.logo');
                    if (logoImg && logoImg.complete) {
                        const logoWidth = 25;
                        const logoHeight = (logoImg.height / logoImg.width) * logoWidth;

                        doc.addImage(
                            logoImg, 
                            'PNG', 
                            margins.left, 
                            margins.top - 15, 
                            logoWidth, 
                            logoHeight
                        );
                    }
                } catch (e) {
                    console.warn('Não foi possível adicionar o logo no cabeçalho:', e);
                }
            }

            // Título no cabeçalho
            doc.setFont("helvetica", "normal");
            doc.setFontSize(8);
            doc.setTextColor(100, 100, 100);
            doc.text('Simulador de Split Payment - Relatório', pageWidth - margins.right, margins.top - 8, { align: 'right' });

            // Rodapé
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.5);
            doc.line(margins.left, pageHeight - margins.bottom + 10, pageWidth - margins.right, pageHeight - margins.bottom + 10);

            // Copyright no rodapé
            doc.setFont("helvetica", "italic");
            doc.setFontSize(8);
            doc.setTextColor(100, 100, 100);
            doc.text('© 2025 Expertzy Inteligência Tributária', pageWidth / 2, pageHeight - margins.bottom + 18, { align: 'center' });

            // Número da página
            doc.text(`Página ${i} de ${pageCount}`, pageWidth - margins.right, pageHeight - margins.bottom + 18, { align: 'right' });
        }
    },

    /**
     * Correção 5: Implementar a função _adicionarParametrosSimulacao que é chamada mas parece estar faltando
     */
    _adicionarParametrosSimulacao: function (doc, dados, pageCount) {
        // Configurações básicas da página
        const margins =
            this.config.pdf && this.config.pdf.margins
                ? this.config.pdf.margins
                : {
                      top: 25,
                      right: 15,
                      bottom: 25,
                      left: 15
                  };

        let currentPositionY = margins.top;

        // Título da página
        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(52, 152, 219); // Cor principal
        doc.text("1. PARÂMETROS DA SIMULAÇÃO", margins.left, currentPositionY);
        currentPositionY += 15;

        // Linha separadora
        doc.setDrawColor(52, 152, 219);
        doc.line(margins.left, currentPositionY, doc.internal.pageSize.width - margins.right, currentPositionY);
        currentPositionY += 10;

        // Seção Dados da Empresa
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(46, 204, 113); // Cor secundária
        doc.text("1.1. Dados da Empresa", margins.left, currentPositionY);
        currentPositionY += 10;

        // Definir fonte para conteúdo
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0, 0, 0);

        // Adicionar dados da empresa
        const dadosEmpresa = [
            { label: "Empresa:", valor: dados.empresa || "N/A" },
            { label: "Setor:", valor: dados.setor || "N/A" },
            { label: "Regime Tributário:", valor: this._obterRegimeTributarioFormatado(dados.regime) || "N/A" },
            {
                label: "Faturamento Mensal:",
                valor:
                    "R$ " + (typeof dados.faturamento === "number" ? dados.faturamento.toLocaleString("pt-BR") : "N/A")
            },
            { label: "Margem Operacional:", valor: (dados.margem * 100|| 0) + "%" }
        ];

        dadosEmpresa.forEach((item) => {
            doc.setFont("helvetica", "bold");
            doc.text(item.label, margins.left, currentPositionY);
            doc.setFont("helvetica", "normal");
            doc.text(item.valor, margins.left + 50, currentPositionY);
            currentPositionY += 8;
        });

        currentPositionY += 5;

        // Seção Tributação e Split Payment
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(46, 204, 113); // Cor secundária
        doc.text("1.2. Tributação e Split Payment", margins.left +50, currentPositionY);
        currentPositionY += 8;

        // Definir fonte para conteúdo
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0, 0, 0);

        // Adicionar dados de tributação
        const dadosTributacao = [
            { label: "Alíquota Efetiva:", valor: (dados.aliquota*100 || 0) + "%" },
            { label: "Redução Especial:", valor: (dados.reducao*100 || 0) + "%" },
            { label: "Tipo de Operação:", valor: dados.tipoOperacao || "N/A" },
            {
                label: "Créditos Tributários:",
                valor: "R$ " + (typeof dados.creditos === "number" ? dados.creditos.toLocaleString("pt-BR") : "N/A")
            },
            { label: "Compensação de Créditos:", valor: dados.compensacao || "N/A" }
        ];

        dadosTributacao.forEach((item) => {
            doc.setFont("helvetica", "bold");
            doc.text(item.label, margins.left, currentPositionY);
            doc.setFont("helvetica", "normal");
            doc.text(item.valor, margins.left + 70, currentPositionY);
            currentPositionY += 12;
        });

        currentPositionY += 5;

        // export-tools.js - Função _adicionarParametrosSimulacao
        // Seção 1.3. Ciclo Financeiro
        const dadosCiclo = [
            { label: "Prazo Médio de Recebimento:", valor: (dados.pmr || 0) + " dias" },
            { label: "Prazo Médio de Pagamento:", valor: (dados.pmp || 0) + " dias" },
            { label: "Prazo Médio de Estoque:", valor: (dados.pme || 0) + " dias" },
            { label: "Ciclo Financeiro:", valor: (dados.cicloFinanceiro || 0) + " dias" },
            { label: "Vendas à Vista:", valor: (dados.percVista * 100 || 0) + "%" },
            { label: "Vendas a Prazo:", valor: (dados.percPrazo * 100 || 0) + "%" }
        ];

        dadosCiclo.forEach((item) => {
            doc.setFont("helvetica", "bold");
            doc.text(item.label, margins.left, currentPositionY);
            doc.setFont("helvetica", "normal");
            doc.text(item.valor, margins.left + 70, currentPositionY); // Aumentar offset horizontal
            currentPositionY += 12; // Reduzir espaçamento vertical
        });
        

        // Seção Parâmetros da Simulação
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(46, 204, 113); // Cor secundária
        doc.text("1.4. Parâmetros da Simulação", margins.left, currentPositionY);
        currentPositionY += 10;

        // Seção 1.4. Parâmetros da Simulação
        currentPositionY += 10; // Reset após ciclo financeiro

        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(46, 204, 113);
        doc.text("1.4. Parâmetros da Simulação", margins.left, currentPositionY);
        currentPositionY += 10;

        // Substituir o trecho que adiciona a seção 1.4
        const parametrosSimulacao = [
            { label: "Data Inicial:", valor: this._formatarDataSimples(new Date(dados.dataInicial)) },
            { label: "Data Final:", valor: this._formatarDataSimples(new Date(dados.dataFinal)) },
            { label: "Cenário de Crescimento:", valor: dados.cenario || "N/A" },
            { label: "Taxa de Crescimento:", valor: (dados.taxaCrescimento * 100 || 0) + "% a.a." }
        ];

        parametrosSimulacao.forEach((item) => {
            doc.setFont("helvetica", "bold");
            doc.text(item.label, margins.left, currentPositionY);
            doc.setFont("helvetica", "normal");
            doc.text(item.valor, margins.left + 60, currentPositionY);
            currentPositionY += 12; // Espaçamento uniforme
        });
        
        // No final da função, adicionar verificação de espaço na página
        if (currentPositionY > doc.internal.pageSize.height - margins.bottom - 30) {
            doc.addPage();
            currentPositionY = margins.top;
        }

        return currentPositionY;
    },

    /**
     * Helper method para formatação de data simples
     */
    _formatarDataSimples: function (data) {
        if (!data || !(data instanceof Date)) {
            return "N/A";
        }

        const dia = String(data.getDate()).padStart(2, "0");
        const mes = String(data.getMonth() + 1).padStart(2, "0");
        const ano = data.getFullYear();

        return `${dia}/${mes}/${ano}`;
    },
   
    /**
     * Adiciona os resultados da simulação ao PDF
     * @private
     * @param {Object} doc - Documento PDF
     * @param {Object} simulacao - Objeto de simulação completo
     * @param {Object} resultadosExportacao - Estrutura de resultados para exportação
     * @param {number} pageCount - Número da página
     * @returns {number} - Posição Y atual após adicionar o conteúdo
     */
    _adicionarResultadosSimulacao: function (doc, simulacao, resultadosExportacao, pageCount) {
        // Configurações de margem
        const margins = this.config.pdf && this.config.pdf.margins
            ? this.config.pdf.margins
            : { top: 25, right: 15, bottom: 25, left: 15 };

        let currentPositionY = margins.top;

        // Título da página
        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(52, 152, 219); // Cor principal
        doc.text("2. RESULTADOS DA SIMULAÇÃO", margins.left, currentPositionY);
        currentPositionY += 15;

        // Linha separadora
        doc.setDrawColor(52, 152, 219);
        doc.line(margins.left, currentPositionY, doc.internal.pageSize.width - margins.right, currentPositionY);
        currentPositionY += 10;

        // Funções auxiliares de formatação
        const formatarMoeda = (valor) => {
            if (isNaN(valor) || valor === undefined || valor === null) return "R$ 0,00";
            return "R$ " + Number(valor).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        };

        const formatarPercentual = (valor) => {
            if (valor === undefined || valor === null || isNaN(parseFloat(valor))) return "0,00%";
            return `${Math.abs(parseFloat(valor)).toFixed(2)}%`;
        };

        // Verificar se temos dados suficientes para criar uma tabela
        if (resultadosExportacao && resultadosExportacao.resultadosPorAno && resultadosExportacao.anos) {
            // Seção 2.1. Impacto no Fluxo de Caixa
            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(46, 204, 113); // Cor secundária
            doc.text("2.1. Impacto no Fluxo de Caixa", margins.left, currentPositionY);
            currentPositionY += 10;

            // Cabeçalho da tabela
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(255, 255, 255);
            doc.setFillColor(52, 152, 219);
            doc.setDrawColor(52, 152, 219);

            const headers = [
                "Ano",
                "Capital de Giro (Split Payment)",
                "Capital de Giro (Sistema Atual)",
                "Diferença",
                "Variação (%)"
            ];

            // Largura das colunas ajustada para evitar sobreposição
            const colWidths = [22, 48, 48, 32, 32];
            let currentX = margins.left;
            const headerHeight = 8;

            // Desenhar fundo do cabeçalho
            doc.rect(
                margins.left,
                currentPositionY,
                colWidths.reduce((a, b) => a + b, 0),
                headerHeight,
                "F"
            );

            // Escrever cabeçalhos
            currentX = margins.left + 2;
            headers.forEach((header, idx) => {
                doc.text(header, currentX, currentPositionY + 6, { maxWidth: colWidths[idx] - 2 });
                currentX += colWidths[idx];
            });
            currentPositionY += headerHeight;

            // Adicionar dados para cada ano
            const anos = resultadosExportacao.anos;
            anos.forEach((ano) => {
                // Obter dados do ano com validação
                const dadosAno = resultadosExportacao.resultadosPorAno[ano] || {};

                // Extrair valores com segurança
                const capitalGiroSplitPayment = 
                    dadosAno.capitalGiroSplitPayment || dadosAno.impostoDevido || 0;
                const capitalGiroAtual = 
                    dadosAno.capitalGiroAtual || dadosAno.sistemaAtual || 0;
                const diferenca = 
                    dadosAno.diferenca || (capitalGiroSplitPayment - capitalGiroAtual);
                const percentualImpacto = 
                    dadosAno.percentualImpacto || (capitalGiroAtual !== 0 ? (diferenca / capitalGiroAtual) * 100 : 0);

                // Alternância de cor de fundo para linhas
                if (parseInt(ano) % 2 === 0) {
                    doc.setFillColor(245, 248, 250);
                    doc.rect(margins.left, currentPositionY, colWidths.reduce((a, b) => a + b, 0), headerHeight, "F");
                }

                // Adicionar valores às células
                doc.setFont("helvetica", "normal");
                doc.setFontSize(10);
                doc.setTextColor(0, 0, 0);

                currentX = margins.left + 2;
                doc.text(String(ano), currentX, currentPositionY + 6);
                currentX += colWidths[0];

                doc.text(formatarMoeda(capitalGiroSplitPayment), currentX, currentPositionY + 6);
                currentX += colWidths[1];

                doc.text(formatarMoeda(capitalGiroAtual), currentX, currentPositionY + 6);
                currentX += colWidths[2];

                // Coloração condicional para diferença
                if (diferenca > 0) {
                    doc.setTextColor(46, 204, 113); // Verde
                } else if (diferenca < 0) {
                    doc.setTextColor(231, 76, 60); // Vermelho
                } else {
                    doc.setTextColor(0, 0, 0); // Preto
                }
                doc.text(formatarMoeda(diferenca), currentX, currentPositionY + 6);
                currentX += colWidths[3];

                doc.text(formatarPercentual(percentualImpacto), currentX, currentPositionY + 6);

                // Resetar cor do texto
                doc.setTextColor(0, 0, 0);

                currentPositionY += headerHeight;

                // Quebra de página automática se necessário
                if (currentPositionY > doc.internal.pageSize.height - margins.bottom - 20) {
                    doc.addPage();
                    currentPositionY = margins.top;
                }
            });
        } else {
            // Estrutura incompleta - exibir mensagem alternativa
            doc.setFontSize(12);
            doc.setFont("helvetica", "italic");
            doc.setTextColor(231, 76, 60);
            doc.text("Dados de resultados não disponíveis ou em formato incompatível.", margins.left, currentPositionY);
            currentPositionY += 10;

            doc.setFontSize(11);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(0, 0, 0);
            doc.text("Realize uma nova simulação para gerar o relatório completo.", margins.left, currentPositionY);
            currentPositionY += 20;
        }

        return currentPositionY;
    },
   
    /**
     * Adiciona a seção de resultados da simulação com cores condicionais
     * @private
     * @param {jsPDF} doc - Documento PDF
     * @param {Object} resultados - Resultados da simulação
     * @param {Object} aliquotasEquivalentes - Alíquotas equivalentes calculadas
     * @param {number} pageNumber - Número da página
     * @returns {number} Posição Y após adicionar o conteúdo
     */
    _adicionarResultadosSimulacaoRobusto: function(doc, simulacao, resultadosExportacao, pageNumber) {
        const margins = this.config.pdf.margins;
        const pageWidth = doc.internal.pageSize.width;
        let currentY = margins.top + 10;

        // Adicionar cabeçalho da seção
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.setTextColor(this.config.pdf.colors.primary[0], this.config.pdf.colors.primary[1], this.config.pdf.colors.primary[2]);
        doc.text('2. Resultados da Simulação', margins.left, currentY);

        currentY += 15;

        // Formatadores
        const formatarMoeda = valor => {
            if (isNaN(valor) || valor === undefined || valor === null) return "R$ 0,00";
            return "R$ " + Number(valor).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        };

        const formatarPercentual = valor => {
            if (valor === undefined || valor === null || isNaN(parseFloat(valor))) return "0,00%";
            return `${Math.abs(parseFloat(valor)).toFixed(2)}%`;
        };

        // Verificar se temos dados suficientes
        if (resultadosExportacao && resultadosExportacao.resultadosPorAno) {
            // Seção 2.1 - Tabela de Resultados
            doc.setFont("helvetica", "bold");
            doc.setFontSize(14);
            doc.setTextColor(70, 70, 70);
            doc.text('2.1. Tabela de Resultados Anuais', margins.left, currentY);

            currentY += 10;

            // Cabeçalho da tabela
            const headers = [
                "Ano",
                "Capital de Giro (Split Payment)",
                "Capital de Giro (Sistema Atual)",
                "Diferença",
                "Variação (%)"
            ];

            // Preparar dados para a tabela
            const anos = resultadosExportacao.anos || Object.keys(resultadosExportacao.resultadosPorAno).sort();

            // Preparar dados para a tabela
            const tableData = [];

            // Cabeçalho
            tableData.push(headers);

            // Dados por ano
            anos.forEach(ano => {
                const dadosAno = resultadosExportacao.resultadosPorAno[ano] || {};

                // Extrair valores com segurança
                const capitalGiroSplitPayment = 
                    dadosAno.capitalGiroSplitPayment || dadosAno.impostoDevido || 0;
                const capitalGiroAtual = 
                    dadosAno.capitalGiroAtual || dadosAno.sistemaAtual || 0;
                const diferenca = 
                    dadosAno.diferenca || (capitalGiroSplitPayment - capitalGiroAtual);
                const percentualImpacto = 
                    dadosAno.percentualImpacto || (capitalGiroAtual !== 0 ? (diferenca / capitalGiroAtual) * 100 : 0);

                tableData.push([
                    ano,
                    formatarMoeda(capitalGiroSplitPayment),
                    formatarMoeda(capitalGiroAtual),
                    formatarMoeda(diferenca),
                    formatarPercentual(percentualImpacto)
                ]);
            });

            // Adicionar tabela com cores condicionais
            doc.autoTable({
                startY: currentY,
                head: [tableData[0]],
                body: tableData.slice(1),
                theme: 'grid',
                styles: {
                    fontSize: 9,
                    cellPadding: 2,
                    overflow: 'ellipsize'
                },
                headStyles: {
                    fillColor: this.config.pdf.colors.primary,
                    textColor: 255,
                    fontStyle: 'bold'
                },
                // Adicionar cores condicionais para a coluna de variação
                didDrawCell: function(data) {
                    if (data.section === 'body') {
                        // Colorir células de diferença e variação
                        if (data.column.index === 3 || data.column.index === 4) {
                            // Obter o valor da célula (remover formatação)
                            let valorStr = data.cell.text[0];
                            let valor = 0;

                            if (data.column.index === 3) {
                                // Coluna Diferença - formato R$ X.XXX,XX
                                valor = parseFloat(valorStr.replace('R$', '').replace(/\./g, '').replace(',', '.').trim());
                            } else {
                                // Coluna Variação - formato X,XX%
                                valor = parseFloat(valorStr.replace('%', '').replace(',', '.').trim());
                            }

                            if (valor > 0) {
                                // Variação positiva (vermelho)
                                doc.setFillColor(231, 76, 60, 0.2);
                                doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
                            } else if (valor < 0) {
                                // Variação negativa (verde)
                                doc.setFillColor(46, 204, 113, 0.2);
                                doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
                            }
                        }

                        // Colorir linhas alternadas
                        if (data.row.index % 2 === 0 && data.column.index === 0) {
                            doc.setFillColor(245, 245, 245);
                            const rowWidth = data.table.columns.reduce((width, column) => width + column.width, 0);
                            doc.rect(data.cell.x, data.cell.y, rowWidth, data.cell.height, 'F');
                        }
                    }
                },
                columnStyles: {
                    0: { cellWidth: 15 },
                    1: { cellWidth: 45 },
                    2: { cellWidth: 45 },
                    3: { cellWidth: 30 },
                    4: { cellWidth: 30 }
                },
                margin: { left: margins.left }
            });

            currentY = doc.lastAutoTable.finalY + 15;

            // Calcular estatísticas para análise
            let variacaoTotal = 0;
            let anoMaiorImpacto = "";
            let valorMaiorImpacto = 0;

            anos.forEach(ano => {
                const dadosAno = resultadosExportacao.resultadosPorAno[ano] || {};
                const diferenca = dadosAno.diferenca || 0;

                variacaoTotal += diferenca;

                if (Math.abs(diferenca) > Math.abs(valorMaiorImpacto)) {
                    valorMaiorImpacto = diferenca;
                    anoMaiorImpacto = ano;
                }
            });

            // Seção 2.2 - Análise dos Resultados
            doc.setFont("helvetica", "bold");
            doc.setFontSize(14);
            doc.setTextColor(70, 70, 70);
            doc.text('2.2. Análise dos Resultados', margins.left, currentY);

            currentY += 10;

            // Texto de análise
            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.setTextColor(60, 60, 60);

            // Formatação de análise baseada nos resultados
            const isImpactoPositivo = variacaoTotal < 0;

            let analiseTexto = isImpactoPositivo ?
                [
                    `A simulação demonstra que a implementação do Split Payment tende a gerar `,
                    `um impacto financeiro positivo para a empresa ao longo do período de transição, `,
                    `com uma redução acumulada de ${formatarMoeda(Math.abs(variacaoTotal))} na necessidade de capital de giro. `,
                    `O ano de ${anoMaiorImpacto} apresenta o maior impacto (${formatarMoeda(valorMaiorImpacto)}), `,
                    `indicando um ponto crítico no cronograma de implementação.`
                ].join('') :
                [
                    `A simulação demonstra que a implementação do Split Payment tende a gerar `,
                    `um impacto financeiro negativo para a empresa ao longo do período de transição, `,
                    `com um aumento acumulado de ${formatarMoeda(Math.abs(variacaoTotal))} na necessidade de capital de giro. `,
                    `O ano de ${anoMaiorImpacto} apresenta o maior impacto (${formatarMoeda(valorMaiorImpacto)}), `,
                    `indicando um ponto crítico que requer estratégias de mitigação.`
                ].join('');

            const splitAnalise = doc.splitTextToSize(analiseTexto, pageWidth - margins.left - margins.right);
            doc.text(splitAnalise, margins.left, currentY);

            currentY += splitAnalise.length * 5 + 10;

            // Adicionar quadro de destaque com sugestões
            const boxWidth = pageWidth - margins.left - margins.right;
            const boxHeight = 40;
            const boxX = margins.left;
            const boxY = currentY;

            // Desenhar fundo do box com gradiente suave
            this._desenharGradiente(doc, boxX, boxY, boxX + boxWidth, boxY + boxHeight, 
                [245, 245, 245], [235, 235, 235]);

            // Adicionar borda
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.5);
            doc.rect(boxX, boxY, boxWidth, boxHeight);

            // Título do box
            doc.setFont("helvetica", "bold");
            doc.setFontSize(11);
            doc.setTextColor(this.config.pdf.colors.primary[0], this.config.pdf.colors.primary[1], this.config.pdf.colors.primary[2]);
            doc.text('Considerações Importantes:', boxX + 5, boxY + 10);

            // Conteúdo do box
            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            doc.setTextColor(60, 60, 60);

            const pontosImportantes = isImpactoPositivo ?
                [
                    `• Considere a oportunidade de utilizar a economia tributária para investimentos estratégicos.`,
                    `• Prepare-se para os períodos de transição com planejamento financeiro adequado.`,
                    `• Avalie a possibilidade de ajustar a política de preços para aumentar competitividade.`
                ].join('\n') :
                [
                    `• Considere estratégias de mitigação para minimizar o impacto no fluxo de caixa.`,
                    `• Planeje necessidades adicionais de capital de giro para os períodos mais críticos.`,
                    `• Avalie a possibilidade de ajustar a política de preços e prazos com fornecedores.`
                ].join('\n');

            doc.text(pontosImportantes, boxX + 5, boxY + 18);

            currentY += boxHeight + 15;
        } else {
            // Mensagem quando não há dados suficientes
            doc.setFont("helvetica", "italic");
            doc.setFontSize(12);
            doc.setTextColor(231, 76, 60);
            doc.text("Dados de resultados não disponíveis ou em formato incompatível.", margins.left, currentY);
            currentY += 10;

            doc.setFont("helvetica", "normal");
            doc.setFontSize(11);
            doc.setTextColor(0, 0, 0);
            doc.text("Realize uma nova simulação para gerar o relatório completo.", margins.left, currentY);
            currentY += 20;
        }

        return currentY;
    },

    /**
     * Correção 7: Implementar a função _adicionarGraficos que é chamada mas parece estar faltando
     */
    _adicionarGraficos: function (doc, pageCount) {
        // Configurações básicas da página
        const margins =
            this.config.pdf && this.config.pdf.margins
                ? this.config.pdf.margins
                : {
                      top: 25,
                      right: 15,
                      bottom: 25,
                      left: 15
                  };

        let currentPositionY = margins.top;

        // Título da página
        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(52, 152, 219); // Cor principal
        doc.text("3. GRÁFICOS", margins.left, currentPositionY);
        currentPositionY += 15;

        // Linha separadora
        doc.setDrawColor(52, 152, 219);
        doc.line(margins.left, currentPositionY, doc.internal.pageSize.width - margins.right, currentPositionY);
        currentPositionY += 10;

        try {
            // Tentar capturar os gráficos do DOM
            const graficos = [
                { id: "grafico-fluxo-caixa", titulo: "3.1. Fluxo de Caixa Comparativo" },
                { id: "grafico-capital-giro", titulo: "3.2. Impacto no Capital de Giro" },
                { id: "grafico-projecao", titulo: "3.3. Projeção de Necessidade de Capital" },
                { id: "grafico-decomposicao", titulo: "3.4. Decomposição do Impacto" }
            ];

            graficos.forEach((grafico, index) => {
                // Título do gráfico
                doc.setFontSize(14);
                doc.setFont("helvetica", "bold");
                doc.setTextColor(46, 204, 113); // Cor secundária
                doc.text(grafico.titulo, margins.left, currentPositionY);
                currentPositionY += 10;

                // Tentar capturar o gráfico do DOM
                const canvas = document.getElementById(grafico.id);
                if (canvas) {
                    // Capturar a imagem do canvas
                    try {
                        const imgData = canvas.toDataURL("image/png");
                        // Calcular proporções
                        const canvasAspectRatio = canvas.width / canvas.height;
                        const maxWidth = doc.internal.pageSize.width - margins.left - margins.right;
                        const maxHeight = 60; // Altura máxima para o gráfico

                        let imgWidth = maxWidth;
                        let imgHeight = imgWidth / canvasAspectRatio;

                        if (imgHeight > maxHeight) {
                            imgHeight = maxHeight;
                            imgWidth = imgHeight * canvasAspectRatio;
                        }

                        // Centralizar horizontalmente
                        const xPos = (doc.internal.pageSize.width - imgWidth) / 2;

                        // Adicionar a imagem
                        doc.addImage(imgData, "PNG", xPos, currentPositionY, imgWidth, imgHeight);
                        currentPositionY += imgHeight + 15;
                    } catch (e) {
                        console.warn(`Erro ao capturar gráfico ${grafico.id}:`, e);
                        doc.setFontSize(10);
                        doc.setFont("helvetica", "italic");
                        doc.text("Gráfico não disponível", margins.left, currentPositionY);
                        currentPositionY += 20;
                    }
                } else {
                    doc.setFontSize(10);
                    doc.setFont("helvetica", "italic");
                    doc.text("Gráfico não disponível", margins.left, currentPositionY);
                    currentPositionY += 20;
                }

                // Evitar sobreposição na página
                if (
                    currentPositionY > doc.internal.pageSize.height - margins.bottom - 30 &&
                    index < graficos.length - 1
                ) {
                    doc.addPage();
                    currentPositionY = margins.top;
                }
            });
        } catch (e) {
            console.warn("Erro ao adicionar gráficos:", e);
            doc.setFontSize(12);
            doc.setFont("helvetica", "italic");
            doc.text(
                "Gráficos não disponíveis. Verifique se os gráficos foram gerados antes de exportar.",
                margins.left,
                currentPositionY
            );
            currentPositionY += 20;
        }

        return currentPositionY;
    },
    
    /**
     * Adiciona os gráficos da simulação com insights
     * @private
     * @param {jsPDF} doc - Documento PDF
     * @param {number} pageNumber - Número da página
     * @returns {number} Posição Y após adicionar o conteúdo
     */
    _adicionarGraficosRobusto: function(doc, pageNumber) {
        const margins = this.config.pdf.margins;
        const pageWidth = doc.internal.pageSize.width;
        let currentY = margins.top + 10;

        // Adicionar cabeçalho da seção
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.setTextColor(this.config.pdf.colors.primary[0], this.config.pdf.colors.primary[1], this.config.pdf.colors.primary[2]);
        doc.text('3. Análise Gráfica', margins.left, currentY);

        currentY += 15;

        // Capturar e adicionar gráficos da simulação
        try {
            // Lista de gráficos para capturar
            const graficos = [
                {
                    id: 'grafico-fluxo-caixa',
                    titulo: '3.1. Fluxo de Caixa Comparativo',
                    descricao: 'Este gráfico apresenta a comparação do fluxo de caixa entre o sistema atual e o Split Payment, permitindo visualizar o impacto financeiro ao longo do período de transição.'
                },
                {
                    id: 'grafico-capital-giro',
                    titulo: '3.2. Impacto no Capital de Giro',
                    descricao: 'Este gráfico mostra a variação na necessidade de capital de giro, indicando os períodos de maior pressão sobre o fluxo financeiro da empresa.'
                },
                {
                    id: 'grafico-projecao',
                    titulo: '3.3. Projeção de Necessidade de Capital',
                    descricao: 'Este gráfico apresenta a projeção das necessidades adicionais de capital durante o período de transição do Split Payment.'
                },
                {
                    id: 'grafico-decomposicao',
                    titulo: '3.4. Decomposição do Impacto',
                    descricao: 'Este gráfico decompõe os diferentes fatores que contribuem para o impacto total, permitindo identificar os principais componentes do efeito no fluxo de caixa.'
                }
            ];

            // Verificar se existem gráficos no DOM
            const graficoExiste = graficos.some(g => document.getElementById(g.id));

            if (!graficoExiste) {
                // Se não houver gráficos, exibir mensagem
                doc.setFont("helvetica", "italic");
                doc.setFontSize(12);
                doc.text("Não foram encontrados gráficos para incluir no relatório.", margins.left, currentY);
                currentY += 10;

                doc.setFont("helvetica", "normal");
                doc.setFontSize(11);
                doc.text("Certifique-se de que a simulação foi realizada e os gráficos foram gerados.", margins.left, currentY);
                currentY += 20;

                return currentY;
            }

            // Adicionar cada gráfico
            for (let i = 0; i < graficos.length; i++) {
                const grafico = graficos[i];
                const graficoElement = document.getElementById(grafico.id);

                if (graficoElement) {
                    // Adicionar título do gráfico
                    doc.setFont("helvetica", "bold");
                    doc.setFontSize(14);
                    doc.setTextColor(70, 70, 70);
                    doc.text(grafico.titulo, margins.left, currentY);

                    currentY += 8;

                    // Capturar imagem do gráfico
                    const imgData = graficoElement.toDataURL('image/png');

                    // Definir dimensões para o gráfico
                    const imgWidth = pageWidth - margins.left - margins.right;
                    const imgHeight = 80;

                    // Adicionar imagem do gráfico
                    doc.addImage(imgData, 'PNG', margins.left, currentY, imgWidth, imgHeight);

                    currentY += imgHeight + 5;

                    // Adicionar descrição do gráfico
                    doc.setFont("helvetica", "normal");
                    doc.setFontSize(9);
                    doc.setTextColor(80, 80, 80);

                    const splitDesc = doc.splitTextToSize(grafico.descricao, pageWidth - margins.left - margins.right);
                    doc.text(splitDesc, margins.left, currentY);

                    currentY += splitDesc.length * 4 + 15;

                    // Verificar se precisa adicionar nova página
                    if (i < graficos.length - 1 && currentY > doc.internal.pageSize.height - margins.bottom - 100) {
                        doc.addPage();
                        pageNumber++;
                        currentY = margins.top + 10;
                    }
                }
            }

            // Adicionar quadro com insights
            const boxWidth = pageWidth - margins.left - margins.right;
            const boxHeight = 50;
            const boxX = margins.left;
            const boxY = currentY;

            // Desenhar fundo do box com gradiente suave
            this._desenharGradiente(doc, boxX, boxY, boxX + boxWidth, boxY + boxHeight, 
                [245, 245, 245], [235, 235, 235]);

            // Adicionar borda
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.5);
            doc.rect(boxX, boxY, boxWidth, boxHeight);

            // Título do box
            doc.setFont("helvetica", "bold");
            doc.setFontSize(11);
            doc.setTextColor(this.config.pdf.colors.primary[0], this.config.pdf.colors.primary[1], this.config.pdf.colors.primary[2]);
            doc.text('Insights da Análise Gráfica:', boxX + 5, boxY + 10);

            // Conteúdo do box
            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            doc.setTextColor(60, 60, 60);

            const insights = [
                `• Os gráficos demonstram claramente a progressão do impacto durante o período de transição.`,
                `• As maiores variações tendem a ocorrer nos anos intermediários (2029-2031).`,
                `• A alíquota efetiva se estabiliza ao final do período, indicando o novo patamar tributário.`,
                `• Os incentivos fiscais continuam tendo um papel relevante mesmo no novo sistema.`
            ].join('\n');

            doc.text(insights, boxX + 5, boxY + 18);

            currentY += boxHeight + 15;

        } catch (e) {
            console.warn('Erro ao adicionar gráficos:', e);

            // Adicionar mensagem de erro
            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.setTextColor(231, 76, 60);
            doc.text('Não foi possível capturar os gráficos. Por favor, verifique se os gráficos foram gerados corretamente na simulação.', margins.left, currentY);

            currentY += 10;
        }

        return currentY;
    },

    /**
     * Correção 8: Implementar a função _adicionarAnaliseEstrategias que é chamada mas parece estar faltando
     */
    _adicionarAnaliseEstrategias: function (doc, dados, resultados, pageCount) {
        // Configurações básicas da página
        const margins =
            this.config.pdf && this.config.pdf.margins
                ? this.config.pdf.margins
                : {
                      top: 25,
                      right: 15,
                      bottom: 25,
                      left: 15
                  };

        let currentPositionY = margins.top;

        // Título da página
        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(52, 152, 219); // Cor principal
        doc.text("4. ANÁLISE DE ESTRATÉGIAS DE MITIGAÇÃO", margins.left, currentPositionY);
        currentPositionY += 15;

        // Linha separadora
        doc.setDrawColor(52, 152, 219);
        doc.line(margins.left, currentPositionY, doc.internal.pageSize.width - margins.right, currentPositionY);
        currentPositionY += 10;

        // Verificar se há dados de estratégias
        if (!window.resultadosEstrategias) {
            doc.setFontSize(12);
            doc.setFont("helvetica", "italic");
            doc.text(
                "Não há dados de estratégias disponíveis. Realize uma simulação de estratégias antes de exportar.",
                margins.left,
                currentPositionY
            );
            return currentPositionY + 20;
        }

        try {
            // Estratégias de mitigação
            const estrategias = [
                {
                    titulo: "4.1. Ajuste de Preços",
                    descricao: "Compensar a perda de fluxo de caixa através de aumento em preços."
                },
                {
                    titulo: "4.2. Renegociação de Prazos",
                    descricao: "Negociar prazos mais longos com fornecedores para melhorar o ciclo financeiro."
                },
                {
                    titulo: "4.3. Antecipação de Recebíveis",
                    descricao: "Antecipar recebíveis para compensar o impacto no capital de giro."
                },
                {
                    titulo: "4.4. Capital de Giro",
                    descricao: "Contratação de linha de capital de giro para suprir a necessidade adicional."
                }
            ];

            // Formatar valores
            const formatMoeda = (valor) => {
                if (valor === undefined || valor === null) {
                    return "R$ 0,00";
                }
                return "R$ " + valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            };
            const formatPercentual = (valor) => valor.toFixed(2) + "%";

            // Impacto original
            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(46, 204, 113); // Cor secundária
            doc.text("Impacto Original do Split Payment", margins.left, currentPositionY);
            currentPositionY += 10;

            // Definir fonte para texto
            doc.setFontSize(11);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(0, 0, 0);

            // Mostrar impacto original
            const impacto = window.resultadosEstrategias.impactoBase;
            const linhasImpacto = [
                `Diferença no Capital de Giro: ${formatMoeda(impacto.diferencaCapitalGiro)}`,
                `Impacto Percentual: ${formatPercentual(impacto.percentualImpacto / 100)}`,
                `Necessidade Adicional: ${formatMoeda(impacto.necessidadeAdicionalCapitalGiro)}`
            ];

            linhasImpacto.forEach((linha) => {
                doc.text(linha, margins.left, currentPositionY);
                currentPositionY += 8;
            });

            currentPositionY += 5;

            // Estratégias analisadas
            estrategias.forEach((estrategia, index) => {
                doc.setFontSize(14);
                doc.setFont("helvetica", "bold");
                doc.setTextColor(46, 204, 113); // Cor secundária
                doc.text(estrategia.titulo, margins.left, currentPositionY);
                currentPositionY += 8;

                doc.setFontSize(11);
                doc.setFont("helvetica", "normal");
                doc.setTextColor(0, 0, 0);
                doc.text(estrategia.descricao, margins.left, currentPositionY);
                currentPositionY += 10;

                // Obter dados da estratégia
                const codigoEstrategia = ["ajustePrecos", "renegociacaoPrazos", "antecipacaoRecebiveis", "capitalGiro"][
                    index
                ];

                const dadosEstrategia = window.resultadosEstrategias.resultadosEstrategias[codigoEstrategia];

                if (dadosEstrategia) {
                    // Exibir efetividade
                    doc.setFont("helvetica", "bold");
                    doc.text(
                        `Efetividade: ${formatPercentual(dadosEstrategia.efetividadePercentual / 100)}`,
                        margins.left + 10,
                        currentPositionY
                    );
                    currentPositionY += 8;

                    // Exibir detalhes específicos de cada estratégia
                    switch (codigoEstrategia) {
                        case "ajustePrecos":
                            doc.text(
                                `Fluxo de Caixa Adicional: ${formatMoeda(dadosEstrategia.fluxoCaixaAdicional || 0)}`,
                                margins.left + 10,
                                currentPositionY
                            );
                            currentPositionY += 8;
                            doc.text(
                                `Custo da Estratégia: ${formatMoeda(dadosEstrategia.custoEstrategia || 0)}`,
                                margins.left + 10,
                                currentPositionY
                            );
                            break;
                        case "renegociacaoPrazos":
                            doc.text(
                                `Impacto no Fluxo de Caixa: ${formatMoeda(dadosEstrategia.impactoFluxoCaixa || 0)}`,
                                margins.left + 10,
                                currentPositionY
                            );
                            currentPositionY += 8;
                            doc.text(
                                `Custo Total: ${formatMoeda(dadosEstrategia.custoTotal || 0)}`,
                                margins.left + 10,
                                currentPositionY
                            );
                            break;
                        case "antecipacaoRecebiveis":
                            doc.text(
                                `Impacto no Fluxo de Caixa: ${formatMoeda(dadosEstrategia.impactoFluxoCaixa || 0)}`,
                                margins.left + 10,
                                currentPositionY
                            );
                            currentPositionY += 8;
                            doc.text(
                                `Custo Total: ${formatMoeda(dadosEstrategia.custoTotalAntecipacao || 0)}`,
                                margins.left + 10,
                                currentPositionY
                            );
                            break;
                        case "capitalGiro":
                            doc.text(
                                `Valor Financiado: ${formatMoeda(dadosEstrategia.valorFinanciamento || 0)}`,
                                margins.left + 10,
                                currentPositionY
                            );
                            currentPositionY += 8;
                            doc.text(
                                `Custo Total: ${formatMoeda(dadosEstrategia.custoTotalFinanciamento || 0)}`,
                                margins.left + 10,
                                currentPositionY
                            );
                            break;
                    }
                } else {
                    doc.setFont("helvetica", "italic");
                    doc.text("Dados não disponíveis para esta estratégia.", margins.left + 10, currentPositionY);
                }

                currentPositionY += 15;

                // Adicionar nova página se necessário
                if (
                    currentPositionY > doc.internal.pageSize.height - margins.bottom - 30 &&
                    index < estrategias.length - 1
                ) {
                    doc.addPage();
                    currentPositionY = margins.top;
                }
            });

            // Resultados combinados
            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(46, 204, 113); // Cor secundária
            doc.text("4.5. Resultados Combinados", margins.left, currentPositionY);
            currentPositionY += 10;

            doc.setFontSize(11);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(0, 0, 0);

            // Obter dados da combinação
            const combinado = window.resultadosEstrategias.efeitividadeCombinada;
            const linhasCombinado = [
                `Efetividade Total: ${formatPercentual(combinado.efetividadePercentual / 100)}`,
                `Mitigação Total: ${formatMoeda(combinado.mitigacaoTotal)}`,
                `Custo Total das Estratégias: ${formatMoeda(combinado.custoTotal)}`,
                `Relação Custo-Benefício: ${combinado.custoBeneficio.toFixed(2)}`
            ];

            linhasCombinado.forEach((linha) => {
                doc.text(linha, margins.left, currentPositionY);
                currentPositionY += 8;
            });
        } catch (e) {
            console.warn("Erro ao adicionar análise de estratégias:", e);
            doc.setFontSize(12);
            doc.setFont("helvetica", "italic");
            doc.text("Erro ao processar dados de estratégias.", margins.left, currentPositionY);
            currentPositionY += 20;
        }

        return currentPositionY;
    },
    
    /**
     * Adiciona a análise de estratégias de mitigação com tabelas coloridas
     * @private
     * @param {jsPDF} doc - Documento PDF
     * @param {Object} dados - Dados da simulação
     * @param {Object} simulacao - Resultados da simulação
     * @param {number} pageNumber - Número da página
     * @returns {number} Posição Y após adicionar o conteúdo
     */
    _adicionarAnaliseEstrategiasRobusto: function(doc, dados, simulacao, pageNumber) {
        const margins = this.config.pdf.margins;
        const pageWidth = doc.internal.pageSize.width;
        let currentY = margins.top + 10;

        // Adicionar cabeçalho da seção
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.setTextColor(this.config.pdf.colors.primary[0], this.config.pdf.colors.primary[1], this.config.pdf.colors.primary[2]);
        doc.text('4. Estratégias de Mitigação', margins.left, currentY);

        currentY += 15;

        // Verificar se há dados de estratégias
        if (!window.resultadosEstrategias) {
            doc.setFont("helvetica", "italic");
            doc.setFontSize(12);
            doc.text(
                "Não há dados de estratégias disponíveis. Realize uma simulação de estratégias antes de exportar.",
                margins.left,
                currentY
            );
            return currentY + 20;
        }

        // Texto introdutório
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(60, 60, 60);

        const introTexto = [
            "A implementação do Split Payment pode impactar significativamente o fluxo de caixa das empresas, ",
            "especialmente durante o período de transição. Para mitigar esses efeitos, apresentamos um conjunto de ",
            "estratégias que podem ser adotadas, adaptadas às características específicas do negócio."
        ].join('');

        const splitIntro = doc.splitTextToSize(introTexto, pageWidth - margins.left - margins.right);
        doc.text(splitIntro, margins.left, currentY);

        currentY += splitIntro.length * 5 + 10;

        // Formatadores
        const formatMoeda = (valor) => {
            if (valor === undefined || valor === null) {
                return "R$ 0,00";
            }
            return "R$ " + valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        };

        const formatPercentual = (valor) => (parseFloat(valor) || 0).toFixed(2) + "%";

        // Impacto original
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(46, 204, 113); // Cor secundária
        doc.text("Impacto Original do Split Payment", margins.left, currentY);
        currentY += 10;

        // Definir fonte para texto
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);

        // Mostrar impacto original
        const impacto = window.resultadosEstrategias.impactoBase || {};
        const linhasImpacto = [
            `Diferença no Capital de Giro: ${formatMoeda(impacto.diferencaCapitalGiro || 0)}`,
            `Impacto Percentual: ${formatPercentual((impacto.percentualImpacto || 0) / 100)}`,
            `Necessidade Adicional: ${formatMoeda(impacto.necessidadeAdicionalCapitalGiro || 0)}`
        ];

        linhasImpacto.forEach((linha) => {
            doc.text(linha, margins.left, currentY);
            currentY += 8;
        });

        currentY += 5;

        // Estratégias analisadas - LISTA COMPLETA CONFORME MODELO ORIGINAL
        const estrategias = [
            {
                codigo: "ajustePrecos",
                titulo: "4.1. Ajuste de Preços",
                descricao: "Revisão da política de preços para compensar a perda de fluxo de caixa, considerando a elasticidade-preço da demanda do mercado e a posição competitiva da empresa.",
                impacto: "Alto",
                complexidade: "Média",
                eficacia: "75%"
            },
            {
                codigo: "renegociacaoPrazos",
                titulo: "4.2. Renegociação de Prazos",
                descricao: "Renegociação dos prazos de pagamento com fornecedores e de recebimento com clientes, visando equilibrar o ciclo financeiro e compensar a perda de capital de giro.",
                impacto: "Médio",
                complexidade: "Alta",
                eficacia: "60%"
            },
            {
                codigo: "antecipacaoRecebiveis",
                titulo: "4.3. Antecipação de Recebíveis",
                descricao: "Utilização de mecanismos de antecipação de recebíveis para converter vendas a prazo em recursos imediatos, considerando o custo financeiro versus o benefício do fluxo de caixa.",
                impacto: "Alto",
                complexidade: "Baixa",
                eficacia: "80%"
            },
            {
                codigo: "capitalGiro",
                titulo: "4.4. Captação de Capital de Giro",
                descricao: "Obtenção de linhas de crédito específicas para capital de giro, preferencialmente com carência alinhada ao período de transição do Split Payment.",
                impacto: "Alto",
                complexidade: "Média",
                eficacia: "85%"
            },
            {
                codigo: "mixProdutos",
                titulo: "4.5. Ajuste no Mix de Produtos",
                descricao: "Reequilíbrio do mix de produtos e serviços, priorizando itens com ciclo financeiro mais favorável e maior margem para absorver o impacto do Split Payment.",
                impacto: "Médio",
                complexidade: "Alta",
                eficacia: "65%"
            },
            {
                codigo: "meiosPagamento",
                titulo: "4.6. Incentivo a Meios de Pagamento Favoráveis",
                descricao: "Estímulo a modalidades de pagamento que reduzam o prazo médio de recebimento, como pagamentos à vista ou via PIX, oferecendo descontos ou vantagens exclusivas.",
                impacto: "Médio",
                complexidade: "Baixa",
                eficacia: "70%"
            }
        ];

        // Resultados das estratégias
        const resultadosEstrategias = window.resultadosEstrategias.resultadosEstrategias || {};

        // Adicionar cada estratégia
        estrategias.forEach((estrategia, index) => {
            doc.setFont("helvetica", "bold");
            doc.setFontSize(14);
            doc.setTextColor(46, 204, 113); // Cor secundária
            doc.text(estrategia.titulo, margins.left, currentY);
            currentY += 8;

            doc.setFont("helvetica", "normal");
            doc.setFontSize(11);
            doc.setTextColor(0, 0, 0);

            const splitDesc = doc.splitTextToSize(estrategia.descricao, pageWidth - margins.left - margins.right);
            doc.text(splitDesc, margins.left, currentY);
            currentY += splitDesc.length * 5 + 5;

            // Obter dados da estratégia
            const dadosEstrategia = resultadosEstrategias[estrategia.codigo];

            if (dadosEstrategia) {
                // Exibir efetividade
                doc.setFont("helvetica", "bold");
                doc.text(
                    `Efetividade: ${formatPercentual((dadosEstrategia.efetividadePercentual || 0) / 100)}`,
                    margins.left + 10,
                    currentY
                );
                currentY += 8;

                // Exibir detalhes específicos de cada estratégia
                switch (estrategia.codigo) {
                    case "ajustePrecos":
                        doc.text(
                            `Fluxo de Caixa Adicional: ${formatMoeda(dadosEstrategia.fluxoCaixaAdicional || 0)}`,
                            margins.left + 10,
                            currentY
                        );
                        currentY += 8;
                        doc.text(
                            `Custo da Estratégia: ${formatMoeda(dadosEstrategia.custoEstrategia || 0)}`,
                            margins.left + 10,
                            currentY
                        );
                        break;
                    case "renegociacaoPrazos":
                        doc.text(
                            `Impacto no Fluxo de Caixa: ${formatMoeda(dadosEstrategia.impactoFluxoCaixa || 0)}`,
                            margins.left + 10,
                            currentY
                        );
                        currentY += 8;
                        doc.text(
                            `Custo Total: ${formatMoeda(dadosEstrategia.custoTotal || 0)}`,
                            margins.left + 10,
                            currentY
                        );
                        break;
                    case "antecipacaoRecebiveis":
                        doc.text(
                            `Impacto no Fluxo de Caixa: ${formatMoeda(dadosEstrategia.impactoFluxoCaixa || 0)}`,
                            margins.left + 10,
                            currentY
                        );
                        currentY += 8;
                        doc.text(
                            `Custo Total: ${formatMoeda(dadosEstrategia.custoTotalAntecipacao || 0)}`,
                            margins.left + 10,
                            currentY
                        );
                        break;
                    case "capitalGiro":
                        doc.text(
                            `Valor Financiado: ${formatMoeda(dadosEstrategia.valorFinanciamento || 0)}`,
                            margins.left + 10,
                            currentY
                        );
                        currentY += 8;
                        doc.text(
                            `Custo Total: ${formatMoeda(dadosEstrategia.custoTotalFinanciamento || 0)}`,
                            margins.left + 10,
                            currentY
                        );
                        break;
                    case "mixProdutos":
                        doc.text(
                            `Impacto no Fluxo de Caixa: ${formatMoeda(dadosEstrategia.impactoFluxoCaixa || 0)}`,
                            margins.left + 10,
                            currentY
                        );
                        currentY += 8;
                        doc.text(
                            `Custo de Implementação: ${formatMoeda(dadosEstrategia.custoImplementacao || 0)}`,
                            margins.left + 10,
                            currentY
                        );
                        break;
                    case "meiosPagamento":
                        doc.text(
                            `Impacto Líquido: ${formatMoeda(dadosEstrategia.impactoLiquido || 0)}`,
                            margins.left + 10,
                            currentY
                        );
                        currentY += 8;
                        doc.text(
                            `Custo Total do Incentivo: ${formatMoeda(dadosEstrategia.custoTotalIncentivo || 0)}`,
                            margins.left + 10,
                            currentY
                        );
                        break;
                }
            } else {
                doc.setFont("helvetica", "italic");
                doc.text("Dados não disponíveis para esta estratégia.", margins.left + 10, currentY);
            }

            currentY += 15;

            // Adicionar nova página se necessário
            if (
                currentY > doc.internal.pageSize.height - margins.bottom - 30 &&
                index < estrategias.length - 1
            ) {
                doc.addPage();
                pageNumber++;
                currentY = margins.top;
            }
        });

        // Resultados combinados
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(46, 204, 113); // Cor secundária
        doc.text("4.7. Resultados Combinados", margins.left, currentY);
        currentY += 10;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);

        // Obter dados da combinação
        const combinado = window.resultadosEstrategias.efeitividadeCombinada || {};
        const linhasCombinado = [
            `Efetividade Total: ${formatPercentual((combinado.efetividadePercentual || 0) / 100)}`,
            `Mitigação Total: ${formatMoeda(combinado.mitigacaoTotal || 0)}`,
            `Custo Total das Estratégias: ${formatMoeda(combinado.custoTotal || 0)}`,
            `Relação Custo-Benefício: ${(combinado.custoBeneficio || 0).toFixed(2)}`
        ];

        linhasCombinado.forEach((linha) => {
            doc.text(linha, margins.left, currentY);
            currentY += 8;
        });

        // Adicionar plano de ação
        currentY += 10;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(46, 204, 113);
        doc.text("4.8. Plano de Ação Recomendado", margins.left, currentY);
        currentY += 10;

        // Plano de ação simplificado
        const planoAcao = [
            ['Fase', 'Ação', 'Prazo Recomendado'],
            ['Preparação', 'Análise detalhada do fluxo de caixa atual', '6 meses antes da implementação'],
            ['Implementação Inicial', 'Ajuste gradual de preços e negociação com clientes', '3 meses antes da implementação'],
            ['Monitoramento', 'Acompanhamento dos indicadores de ciclo financeiro', 'Durante todo o período de transição'],
            ['Ajuste Contínuo', 'Refinamento das estratégias conforme resultados', 'Anualmente durante a transição']
        ];

        // Adicionar tabela do plano de ação
        doc.autoTable({
            startY: currentY,
            head: [planoAcao[0]],
            body: planoAcao.slice(1),
            theme: 'grid',
            styles: {
                fontSize: 9,
                cellPadding: 3
            },
            headStyles: {
                fillColor: this.config.pdf.colors.primary,
                textColor: 255,
                fontStyle: 'bold'
            },
            columnStyles: {
                0: { cellWidth: 30 },
                1: { cellWidth: 80 },
                2: { cellWidth: 50 }
            },
            margin: { left: margins.left }
        });

        currentY = doc.lastAutoTable.finalY + 10;

        return currentY;
    },

    /**
     * Adiciona a seção de conclusão ao PDF
     * @private
     * @param {Object} doc - Documento PDF
     * @param {Object} dados - Dados da simulação
     * @param {Object} resultados - Resultados da simulação
     * @param {number} pageCount - Número da página
     * @param {Object} aliquotasEquivalentes - Alíquotas equivalentes (opcional)
     * @returns {number} Posição Y atual após adicionar o conteúdo
     */
    _adicionarConclusao: function (doc, dados, resultados, pageCount, aliquotasEquivalentes) {
        // Configurações básicas da página
        const margins =
            this.config.pdf && this.config.pdf.margins
                ? this.config.pdf.margins
                : {
                      top: 25,
                      right: 15,
                      bottom: 25,
                      left: 15
                  };

        let currentPositionY = margins.top;

        // Título da página
        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(52, 152, 219); // Cor principal
        doc.text("6. CONCLUSÃO", margins.left, currentPositionY);
        currentPositionY += 15;

        // Linha separadora
        doc.setDrawColor(52, 152, 219);
        doc.line(margins.left, currentPositionY, doc.internal.pageSize.width - margins.right, currentPositionY);
        currentPositionY += 10;

        // Verificar se temos a estrutura atualizada
        let empresaNome = dados.empresa || "a empresa";
        let anoInicial = "";
        let anoFinal = "";
        let variacaoTotal = 0;
        let tendencia = "variação";

        if (resultados.resultadosExportacao) {
            // Usar a nova estrutura
            const resumo = resultados.resultadosExportacao.resumo || {};
            const anos = resultados.resultadosExportacao.anos || [];

            anoInicial = anos.length > 0 ? anos[0] : "";
            anoFinal = anos.length > 0 ? anos[anos.length - 1] : "";
            variacaoTotal = resumo.variacaoTotal || 0;
            tendencia = resumo.tendenciaGeral || (variacaoTotal > 0 ? "aumento" : "redução");
        } else {
            // Tentar extrair informações da estrutura antiga
            const anos = Object.keys(resultados)
                .filter((key) => !isNaN(parseInt(key)))
                .sort();

            anoInicial = anos.length > 0 ? anos[0] : "";
            anoFinal = anos.length > 0 ? anos[anos.length - 1] : "";

            // Tentar calcular variação total
            anos.forEach((ano) => {
                const resultado = resultados[ano];
                const valorAtual =
                    aliquotasEquivalentes &&
                    aliquotasEquivalentes[ano] &&
                    typeof aliquotasEquivalentes[ano].valor_atual !== "undefined"
                        ? aliquotasEquivalentes[ano].valor_atual
                        : 0;

                const diferenca = resultado && resultado.imposto_devido ? resultado.imposto_devido - valorAtual : 0;

                variacaoTotal += diferenca;
            });

            tendencia = variacaoTotal > 0 ? "aumento" : "redução";
        }

        // Formatar números
        const formatarMoeda = (valor) => {
            if (isNaN(valor) || valor === undefined || valor === null) {
                return "R$ 0,00";
            }
            return (
                "R$ " + Math.abs(valor).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            );
        };

        // Texto da conclusão
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0, 0, 0);

        // Introdução da conclusão
        const conclusaoTexto = `A implementação do Split Payment, conforme simulação realizada para ${empresaNome}, 
        resultará em um ${tendencia} estimado de ${formatarMoeda(variacaoTotal)} 
        na necessidade de capital de giro durante o período de ${anoInicial} a ${anoFinal}.`;

        // Dividir texto em linhas
        const linhas = doc.splitTextToSize(conclusaoTexto, doc.internal.pageSize.width - margins.left - margins.right);
        doc.text(linhas, margins.left, currentPositionY);
        currentPositionY += linhas.length * 7 + 10;

        // Impacto no fluxo de caixa
        const impactoTexto = `O principal impacto identificado está relacionado à antecipação do recolhimento tributário, 
        que no modelo atual ocorre em média 30-45 dias após o faturamento, e no novo modelo ocorrerá de forma instantânea 
        no momento da transação financeira. Esta mudança afeta diretamente o ciclo financeiro da empresa 
        e sua necessidade de capital de giro.`;

        const linhasImpacto = doc.splitTextToSize(
            impactoTexto,
            doc.internal.pageSize.width - margins.left - margins.right
        );
        doc.text(linhasImpacto, margins.left, currentPositionY);
        currentPositionY += linhasImpacto.length * 7 + 10;

        // Recomendações
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(46, 204, 113); // Cor secundária
        doc.text("Recomendações", margins.left, currentPositionY);
        currentPositionY += 10;

        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0, 0, 0);

        const recomendacoes = [
            `1. Planejamento Financeiro: Recomenda-se iniciar imediatamente o planejamento financeiro 
        para adequação ao novo regime, considerando a implementação gradual do Split Payment a partir de 2026.`,

            `2. Estratégias de Mitigação: Conforme análise apresentada na seção 4, 
        sugere-se a implementação de uma combinação de estratégias para minimizar o impacto no fluxo de caixa.`,

            `3. Sistemas: Realizar a adequação dos sistemas de gestão financeira e contábil para operação 
        com o novo modelo de recolhimento tributário.`,

            `4. Monitoramento Contínuo: Manter acompanhamento constante das alterações na regulamentação 
        do Split Payment, que ainda está em fase de definição pelos órgãos competentes.`
        ];

        recomendacoes.forEach((recomendacao) => {
            const linhasRecomendacao = doc.splitTextToSize(
                recomendacao,
                doc.internal.pageSize.width - margins.left - margins.right
            );
            doc.text(linhasRecomendacao, margins.left, currentPositionY);
            currentPositionY += linhasRecomendacao.length * 7 + 5;
        });

        // Considerações finais
        currentPositionY += 5;
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(46, 204, 113); // Cor secundária
        doc.text("Considerações Finais", margins.left, currentPositionY);
        currentPositionY += 10;

        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0, 0, 0);

        const consideracoesFinais = `Esta simulação representa uma estimativa baseada nas informações disponíveis 
        e nas premissas estabelecidas. Os resultados podem variar conforme a evolução da regulamentação do Split Payment 
        e as particularidades operacionais de cada empresa. Recomenda-se a atualização periódica desta análise 
        à medida que novas informações forem divulgadas pelos órgãos competentes.`;

        const linhasConsideracoes = doc.splitTextToSize(
            consideracoesFinais,
            doc.internal.pageSize.width - margins.left - margins.right
        );
        doc.text(linhasConsideracoes, margins.left, currentPositionY);

        return currentPositionY + linhasConsideracoes.length * 7;
    },
    
    /**
     * Adiciona a conclusão e recomendações
     * @private
     * @param {jsPDF} doc - Documento PDF
     * @param {Object} dados - Dados da simulação
     * @param {Object} simulacao - Objeto de simulação completo
     * @param {number} pageNumber - Número da página
     * @param {Object} aliquotasEquivalentes - Alíquotas equivalentes (opcional)
     * @returns {number} - Posição Y atual após adicionar o conteúdo
     */
    _adicionarConclusaoRobusto: function(doc, dados, simulacao, pageNumber, aliquotasEquivalentes) {
        const margins = this.config.pdf.margins;
        const pageWidth = doc.internal.pageSize.width;
        let currentY = margins.top + 10;

        // Adicionar cabeçalho da seção
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.setTextColor(this.config.pdf.colors.primary[0], this.config.pdf.colors.primary[1], this.config.pdf.colors.primary[2]);
        doc.text('6. Conclusão e Recomendações', margins.left, currentY);

        currentY += 15;

        // Extrair dados com segurança
        let empresaNome = dados.empresa || "a empresa";
        let anoInicial = "";
        let anoFinal = "";
        let variacaoTotal = 0;
        let tendencia = "variação";

        // Obter resultadosExportacao de qualquer localização
        const resultadosExportacao = simulacao.resultadosExportacao || 
                                  (simulacao.resultados && simulacao.resultados.resultadosExportacao);

        if (resultadosExportacao) {
            // Usar a estrutura de dados
            const resumo = resultadosExportacao.resumo || {};
            const anos = resultadosExportacao.anos || [];

            anoInicial = anos.length > 0 ? anos[0] : "";
            anoFinal = anos.length > 0 ? anos[anos.length - 1] : "";
            variacaoTotal = resumo.variacaoTotal || 0;
            tendencia = resumo.tendenciaGeral || (variacaoTotal > 0 ? "aumento" : "redução");
        } else {
            // Tentar extrair informações da estrutura antiga
            const resultados = simulacao.resultados || {};
            const anos = Object.keys(resultados)
                .filter((key) => !isNaN(parseInt(key)))
                .sort();

            anoInicial = anos.length > 0 ? anos[0] : "";
            anoFinal = anos.length > 0 ? anos[anos.length - 1] : "";

            // Tentar calcular variação total
            anos.forEach((ano) => {
                const resultado = resultados[ano] || {};

                // Verificar se temos os dados necessários
                if (resultado && resultado.imposto_devido) {
                    const valorAtual =
                        aliquotasEquivalentes &&
                        aliquotasEquivalentes[ano] &&
                        typeof aliquotasEquivalentes[ano].valor_atual !== "undefined"
                            ? aliquotasEquivalentes[ano].valor_atual
                            : 0;

                    const diferenca = resultado.imposto_devido - valorAtual;
                    variacaoTotal += diferenca;
                }
            });

            tendencia = variacaoTotal > 0 ? "aumento" : "redução";
        }

        // Formatar números
        const formatarMoeda = (valor) => {
            if (isNaN(valor) || valor === undefined || valor === null) {
                return "R$ 0,00";
            }
            return (
                "R$ " + Math.abs(valor).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            );
        };

        // Texto da conclusão
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(60, 60, 60);

        // Introdução da conclusão
        const conclusaoTexto = `A implementação do Split Payment, conforme simulação realizada para ${empresaNome}, 
        resultará em um ${tendencia} estimado de ${formatarMoeda(variacaoTotal)} 
        na necessidade de capital de giro durante o período de ${anoInicial} a ${anoFinal}.`;

        // Dividir texto em linhas
        const linhas = doc.splitTextToSize(conclusaoTexto, pageWidth - margins.left - margins.right);
        doc.text(linhas, margins.left, currentY);
        currentY += linhas.length * 7 + 10;

        // Impacto no fluxo de caixa
        const impactoTexto = `O principal impacto identificado está relacionado à antecipação do recolhimento tributário, 
        que no modelo atual ocorre em média 30-45 dias após o faturamento, e no novo modelo ocorrerá de forma instantânea 
        no momento da transação financeira. Esta mudança afeta diretamente o ciclo financeiro da empresa 
        e sua necessidade de capital de giro.`;

        const linhasImpacto = doc.splitTextToSize(
            impactoTexto,
            pageWidth - margins.left - margins.right
        );
        doc.text(linhasImpacto, margins.left, currentY);
        currentY += linhasImpacto.length * 7 + 10;

        // Seção de recomendações
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(46, 204, 113); // Cor secundária
        doc.text('Recomendações', margins.left, currentY);

        currentY += 10;

        // Lista de recomendações
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(60, 60, 60);

        const recomendacoes = [
            `1. Planejamento Financeiro: Recomenda-se iniciar imediatamente o planejamento financeiro 
            para adequação ao novo regime, considerando a implementação gradual do Split Payment a partir de 2026.`,

            `2. Estratégias de Mitigação: Conforme análise apresentada na seção 4, 
            sugere-se a implementação de uma combinação de estratégias para minimizar o impacto no fluxo de caixa.`,

            `3. Sistemas: Realizar a adequação dos sistemas de gestão financeira e contábil para operação 
            com o novo modelo de recolhimento tributário.`,

            `4. Monitoramento Contínuo: Manter acompanhamento constante das alterações na regulamentação 
            do Split Payment, que ainda está em fase de definição pelos órgãos competentes.`
        ];

        recomendacoes.forEach((recomendacao) => {
            const linhasRecomendacao = doc.splitTextToSize(
                recomendacao,
                pageWidth - margins.left - margins.right
            );
            doc.text(linhasRecomendacao, margins.left, currentY);
            currentY += linhasRecomendacao.length * 7 + 5;
        });

        // Quadro final de contato
        currentY += 10;
        const boxWidth = pageWidth - margins.left - margins.right;
        const boxHeight = 40;
        const boxX = margins.left;
        const boxY = currentY;

        // Desenhar gradiente para o quadro
        this._desenharGradiente(doc, boxX, boxY, boxX + boxWidth, boxY + boxHeight, 
            [240, 248, 255], [230, 240, 250]);

        // Adicionar borda
        doc.setDrawColor(180, 200, 220);
        doc.setLineWidth(0.5);
        doc.rect(boxX, boxY, boxWidth, boxHeight);

        // Conteúdo do quadro
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(this.config.pdf.colors.primary[0], this.config.pdf.colors.primary[1], this.config.pdf.colors.primary[2]);
        doc.text('Entre em contato para um diagnóstico personalizado', margins.left + 5, boxY + 15);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(60, 60, 60);
        doc.text('Este relatório foi gerado pelo Simulador de Split Payment desenvolvido pela Expertzy Inteligência Tributária.', margins.left + 5, boxY + 25);
        doc.text('Para obter um diagnóstico personalizado e aprofundado, entre em contato: contato@expertzy.com.br', margins.left + 5, boxY + 32);

        currentY += boxHeight + 10;

        return currentY;
    },
    
    /**
     * Desenha linha pontilhada
     * @private
     * @param {jsPDF} doc - Documento PDF
     * @param {number} x1 - Coordenada X inicial
     * @param {number} y1 - Coordenada Y inicial
     * @param {number} x2 - Coordenada X final
     * @param {number} y2 - Coordenada Y final
     */
    _desenharLinhaPontilhada: function(doc, x1, y1, x2, y2) {
        doc.setLineDashPattern([1, 1], 0);
        doc.setDrawColor(150, 150, 150);
        doc.setLineWidth(0.5);
        doc.line(x1, y1, x2, y2);
        doc.setLineDashPattern([], 0);
    },

    /**
     * Desenha gradiente
     * @private
     * @param {jsPDF} doc - Documento PDF
     * @param {number} x1 - Coordenada X inicial
     * @param {number} y1 - Coordenada Y inicial
     * @param {number} x2 - Coordenada X final
     * @param {number} y2 - Coordenada Y final
     * @param {Array} cor1 - Cor inicial [r, g, b]
     * @param {Array} cor2 - Cor final [r, g, b]
     */
    _desenharGradiente: function(doc, x1, y1, x2, y2, cor1, cor2) {
        // Implementação simplificada de gradiente usando retângulos
        const passos = 20;
        const largura = x2 - x1;
        const altura = y2 - y1;
        const passoLargura = largura / passos;

        for (let i = 0; i < passos; i++) {
            // Calcular cor interpolada
            const fator = i / passos;
            const r = Math.floor(cor1[0] + fator * (cor2[0] - cor1[0]));
            const g = Math.floor(cor1[1] + fator * (cor2[1] - cor1[1]));
            const b = Math.floor(cor1[2] + fator * (cor2[2] - cor1[2]));

            // Definir cor e desenhar retângulo
            doc.setFillColor(r, g, b);
            doc.rect(x1 + i * passoLargura, y1, passoLargura, altura, 'F');
        }
    },

    /**
     * Exporta os resultados da simulação para Excel
     */
    /**
     * Exporta os resultados da simulação para Excel
     * @returns {Promise} Promessa resolvida após a exportação do Excel
     */
    exportarParaExcel: function () {
        console.log("Iniciando exportação para Excel");

        // Verificação inicial - mantém compatibilidade com código atual
        if (!window.ultimaSimulacao) {
            alert("Execute uma simulação antes de exportar os resultados.");
            return;
        }

        return new Promise((resolve, reject) => {
            try {
                // Verificar biblioteca
                if (typeof XLSX === "undefined") {
                    console.error("Biblioteca XLSX não encontrada");
                    alert("Erro ao exportar: Biblioteca XLSX não carregada");
                    return reject("Biblioteca XLSX não carregada");
                }

                // Obter dados de simulação
                const dados = window.ultimaSimulacao.dados;
                const resultados = window.ultimaSimulacao.resultados;

                // Inicializar aliquotasEquivalentes se não existir
                window.ultimaSimulacao.aliquotasEquivalentes = window.ultimaSimulacao.aliquotasEquivalentes || {};
                const aliquotasEquivalentes = window.ultimaSimulacao.aliquotasEquivalentes;

                // Verificar dados necessários estão presentes
                if (!resultados || !resultados.resultadosExportacao || !resultados.resultadosExportacao.resultadosPorAno) {
                    alert("Estrutura de resultados inválida. Realize uma nova simulação.");
                    return Promise.reject("Estrutura de resultados inválida");
                }

                // Inicializar alíquotas para cada ano 
                const anosExportacao = Object.keys(resultados.resultadosExportacao.resultadosPorAno).sort();
                anosExportacao.forEach(ano => {
                    if (!aliquotasEquivalentes[ano]) {
                        aliquotasEquivalentes[ano] = {
                            valor_atual: resultados.resultadosExportacao.resultadosPorAno[ano].sistemaAtual || 0
                        };
                    }
                });

                // Solicitar nome do arquivo
                const nomeArquivo = this._solicitarNomeArquivo("xlsx", "relatorio-split-payment");
                if (!nomeArquivo) {
                    return reject("Exportação cancelada pelo usuário");
                }

                // Criar workbook
                const wb = XLSX.utils.book_new();

                // Definir propriedades do workbook
                wb.Props = {
                    Title: "Relatório Simulador de Split Payment",
                    Subject: "Análise do impacto do Split Payment no fluxo de caixa",
                    Author: "Expertzy Inteligência Tributária",
                    CreatedDate: new Date()
                };
                

                // Criar e adicionar as planilhas

                // 1. Planilha de Resumo
                const wsResumo = this._criarPlanilhaResumo(dados, resultados, aliquotasEquivalentes);
                XLSX.utils.book_append_sheet(wb, wsResumo, "Resumo");

                // 2. Planilha de Resultados
                const wsResultados = this._criarPlanilhaResultados(dados, resultados);
                XLSX.utils.book_append_sheet(wb, wsResultados, "Resultados");

                // 3. Planilha de Memória de Cálculo (se disponível)
                if (window.memoriaCalculoSimulacao) {
                    const wsMemoria = this._criarPlanilhaMemoriaCalculo();
                    XLSX.utils.book_append_sheet(wb, wsMemoria, "Memória de Cálculo");
                }

                // Salvar o arquivo
                XLSX.writeFile(wb, nomeArquivo);

                console.log("Excel exportado com sucesso:", nomeArquivo);

                resolve({
                    success: true,
                    message: "Excel exportado com sucesso!",
                    fileName: nomeArquivo
                });
            } catch (error) {
                console.error("Erro ao exportar para Excel:", error);
                alert("Erro ao exportar para Excel. Verifique o console para mais detalhes.");

                reject({
                    success: false,
                    message: `Erro ao exportar para Excel: ${error.message}`,
                    error: error
                });
            }
        });
    }, // <-- Adicionado fechamento e vírgula

    /**
     * Cria a planilha de resumo
     * @private
     * @param {Object} dados - Dados da simulação
     * @param {Object} resultados - Resultados da simulação
     * @param {Object} aliquotasEquivalentes - Alíquotas equivalentes calculadas
     * @returns {Object} Planilha de resumo
     */
    _criarPlanilhaResumo: function (dados, resultados, aliquotasEquivalentes) {
        // No início da função, garantir que aliquotasEquivalentes exista
        aliquotasEquivalentes = aliquotasEquivalentes || {};

        // Garantir que this.config.excel.colors existe
        if (!this.config) this.config = {};
        if (!this.config.excel) this.config.excel = {};
        if (!this.config.excel.colors) {
            this.config.excel.colors = {
                primary: "FF3498DB", // Azul principal
                secondary: "2ECC71", // Verde
                accent: "E74C3C", // Vermelho
                neutral: "7F8C8D", // Cinza
                highlight: "9B59B6", // Roxo
                background: "F8F9FA", // Fundo claro
                headerBg: "EAEAEA", // Fundo de cabeçalho
                lightBg1: "F5F8FA", // Fundo claro 1 (alternado para tabelas)
                lightBg2: "FFFFFF" // Fundo claro 2 (alternado para tabelas)
            };
        }

        // Dados da planilha
        const resumoData = [
            ["RELATÓRIO DE SIMULAÇÃO - SPLIT PAYMENT"],
            ["Expertzy Inteligência Tributária"],
            ["Data do relatório:", this._formatarData(new Date())],
            [],
            ["RESUMO EXECUTIVO"],
            [],
            ["Parâmetros Principais"],
            ["Setor:", dados.setor ? this._capitalizarPrimeiraLetra(dados.setor) : ""],
            ["Regime Tributário:", this._obterRegimeTributarioFormatado(dados.regime)],
            ["Faturamento Anual:", dados.faturamento],
            ["Período de Simulação:", `${dados.anoInicial || 2026} a ${dados.anoFinal || 2033}`],
            [],
            ["Resultados Principais"]
        ];

        // Calcular indicadores
        const anos = Object.keys(resultados).sort();

        let variacaoTotal = 0;
        let maiorImpacto = { valor: 0, ano: "" };
        let menorImpacto = { valor: Number.MAX_SAFE_INTEGER, ano: "" };

        // Calcular variações e encontrar maior/menor impacto
        anos.forEach((ano) => {
            const resultado = resultados[ano];
            // Verificação robusta para evitar erro
            const valorAtual =
                aliquotasEquivalentes[ano] && typeof aliquotasEquivalentes[ano].valor_atual !== "undefined"
                    ? aliquotasEquivalentes[ano].valor_atual
                    : 0;

            // Definir valorNovo como o imposto devido do resultado
            const diferenca = resultado.imposto_devido - valorAtual;
            const percentual = valorAtual !== 0 ? diferenca / valorAtual : 0;
            const valorNovo = resultado.imposto_devido; // Definir valorNovo novamente se necessário

            resumoData.push([parseInt(ano), valorNovo, valorAtual, diferenca, percentual]);

            // Acumular variação total
            variacaoTotal += diferenca;

            // Verificar maior impacto
            if (Math.abs(diferenca) > Math.abs(maiorImpacto.valor)) {
                maiorImpacto.valor = diferenca;
                maiorImpacto.ano = ano;
            }

            // Verificar menor impacto
            if (Math.abs(diferenca) < Math.abs(menorImpacto.valor)) {
                menorImpacto.valor = diferenca;
                menorImpacto.ano = ano;
            }
        });

        // Determinar se o impacto é predominantemente positivo ou negativo
        const impactoGeral = variacaoTotal > 0 ? "Aumento da carga tributária" : "Redução da carga tributária";

        // Adicionar resultados principais
        resumoData.push(
            ["Impacto Geral:", impactoGeral],
            ["Variação Total Acumulada:", variacaoTotal],
            ["Ano de Maior Impacto:", `${maiorImpacto.ano} (${maiorImpacto.valor})`],
            ["Ano de Menor Impacto:", `${menorImpacto.ano} (${menorImpacto.valor})`],
            []
        );

        // Tabela de resultados resumidos
        resumoData.push(["Resumo Anual"], ["Ano", "IBS + CBS", "Sist. Atual", "Diferença", "Variação (%)"]);

        // Adicionar dados para cada ano
        anos.forEach((ano) => {
            const resultado = resultados[ano];
            // Verificação robusta para evitar erro
            const valorAtual =
                aliquotasEquivalentes[ano] && typeof aliquotasEquivalentes[ano].valor_atual !== "undefined"
                    ? aliquotasEquivalentes[ano].valor_atual
                    : 0;

            const diferenca = resultado.imposto_devido - valorAtual;
            const percentual = valorAtual !== 0 ? diferenca / valorAtual : 0;
            const valorNovo = resultado.imposto_devido; // Definir valorNovo novamente se necessário

            resumoData.push([parseInt(ano), valorNovo, valorAtual, diferenca, percentual]);
        });

        // Estratégias recomendadas
        resumoData.push(
            [],
            ["Estratégias Recomendadas"],
            ["• Ajuste de Preços"],
            ["• Renegociação de Prazos com Fornecedores e Clientes"],
            ["• Antecipação de Recebíveis"],
            ["• Captação de Capital de Giro"],
            ['Para detalhes completos, consulte a planilha "Estratégias de Mitigação"'],
            [],
            ["© 2025 Expertzy Inteligência Tributária - Relatório gerado pelo Simulador de Split Payment"]
        );

        // Criar planilha
        const ws = XLSX.utils.aoa_to_sheet(resumoData);

        // Aplicar estilos
        const estilos = [];

        // Título principal
        estilos.push({
            range: { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
            style: {
                font: { bold: true, sz: 18, color: { rgb: this.config.excel.colors.primary } },
                alignment: { horizontal: "center", vertical: "center" }
            }
        });

        // Subtítulo
        estilos.push({
            range: { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } },
            style: {
                font: { bold: true, sz: 14, color: { rgb: this.config.excel.colors.neutral } },
                alignment: { horizontal: "center", vertical: "center" }
            }
        });

        // Data do relatório
        estilos.push({
            range: { s: { r: 2, c: 0 }, e: { r: 2, c: 0 } },
            style: {
                font: { bold: true, sz: 11 },
                alignment: { horizontal: "right", vertical: "center" }
            }
        });

        // Título Resumo Executivo
        estilos.push({
            range: { s: { r: 4, c: 0 }, e: { r: 4, c: 4 } },
            style: {
                font: { bold: true, sz: 14, color: { rgb: this.config.excel.colors.primary } },
                fill: { fgColor: { rgb: this.config.excel.colors.headerBg } },
                alignment: { horizontal: "center", vertical: "center" },
                border: {
                    bottom: { style: "medium", color: { rgb: this.config.excel.colors.primary } }
                }
            }
        });

        // Título Parâmetros Principais
        estilos.push({
            range: { s: { r: 6, c: 0 }, e: { r: 6, c: 4 } },
            style: {
                font: { bold: true, sz: 12, color: { rgb: this.config.excel.colors.primary } },
                fill: { fgColor: { rgb: this.config.excel.colors.lightBg1 } },
                border: {
                    bottom: { style: "thin", color: { rgb: this.config.excel.colors.primary } }
                }
            }
        });

        // Título Resultados Principais
        estilos.push({
            range: { s: { r: 12, c: 0 }, e: { r: 12, c: 4 } },
            style: {
                font: { bold: true, sz: 12, color: { rgb: this.config.excel.colors.primary } },
                fill: { fgColor: { rgb: this.config.excel.colors.lightBg1 } },
                border: {
                    bottom: { style: "thin", color: { rgb: this.config.excel.colors.primary } }
                }
            }
        });

        // Título Resumo Anual
        const resumoAnualRow = 18;
        estilos.push({
            range: { s: { r: resumoAnualRow, c: 0 }, e: { r: resumoAnualRow, c: 4 } },
            style: {
                font: { bold: true, sz: 12, color: { rgb: this.config.excel.colors.primary } },
                fill: { fgColor: { rgb: this.config.excel.colors.lightBg1 } },
                border: {
                    bottom: { style: "thin", color: { rgb: this.config.excel.colors.primary } }
                }
            }
        });

        // Cabeçalho da tabela de resumo anual
        estilos.push({
            range: { s: { r: resumoAnualRow + 1, c: 0 }, e: { r: resumoAnualRow + 1, c: 4 } },
            style: {
                font: { bold: true, sz: 11 },
                fill: { fgColor: { rgb: this.config.excel.colors.primary } },
                alignment: { horizontal: "center", vertical: "center" },
                border: {
                    top: { style: "thin", color: { rgb: "000000" } },
                    bottom: { style: "thin", color: { rgb: "000000" } },
                    left: { style: "thin", color: { rgb: "000000" } },
                    right: { style: "thin", color: { rgb: "000000" } }
                }
            }
        });

        // Formatar células da tabela
        const startRow = resumoAnualRow + 2;
        const endRow = startRow + anos.length - 1;

        // Formatar linhas da tabela
        for (let r = startRow; r <= endRow; r++) {
            estilos.push({
                range: { s: { r: r, c: 0 }, e: { r: r, c: 4 } },
                style: {
                    border: {
                        bottom: { style: "thin", color: { rgb: "CCCCCC" } }
                    }
                }
            });

            // Aplicar cor de fundo alternada
            if ((r - startRow) % 2 === 0) {
                estilos.push({
                    range: { s: { r: r, c: 0 }, e: { r: r, c: 4 } },
                    style: {
                        fill: { fgColor: { rgb: this.config.excel.colors.lightBg1 } }
                    }
                });
            }

            // Formatar células com valores
            for (let c = 1; c <= 3; c++) {
                estilos.push({
                    range: { s: { r: r, c: c }, e: { r: r, c: c } },
                    style: {
                        numFmt: "#,##0.00"
                    }
                });
            }

            // Formatar célula de percentual
            estilos.push({
                range: { s: { r: r, c: 4 }, e: { r: r, c: 4 } },
                style: {
                    numFmt: "0.00%"
                }
            });
        }

        // Título Estratégias Recomendadas
        const estrategiasRow = endRow + 2;
        estilos.push({
            range: { s: { r: estrategiasRow, c: 0 }, e: { r: estrategiasRow, c: 4 } },
            style: {
                font: { bold: true, sz: 12, color: { rgb: this.config.excel.colors.primary } },
                fill: { fgColor: { rgb: this.config.excel.colors.lightBg1 } },
                border: {
                    bottom: { style: "thin", color: { rgb: this.config.excel.colors.primary } }
                }
            }
        });

        // Copyright
        const copyrightRow = estrategiasRow + 6;
        estilos.push({
            range: { s: { r: copyrightRow, c: 0 }, e: { r: copyrightRow, c: 4 } },
            style: {
                font: { italic: true, sz: 9, color: { rgb: this.config.excel.colors.neutral } },
                alignment: { horizontal: "center", vertical: "center" }
            }
        });

        // Mesclar células para títulos e cabeçalhos
        const mesclagens = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }, // Título principal
            { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } }, // Subtítulo
            { s: { r: 4, c: 0 }, e: { r: 4, c: 4 } }, // Resumo Executivo
            { s: { r: 6, c: 0 }, e: { r: 6, c: 4 } }, // Parâmetros Principais
            { s: { r: 12, c: 0 }, e: { r: 12, c: 4 } }, // Resultados Principais
            { s: { r: resumoAnualRow, c: 0 }, e: { r: resumoAnualRow, c: 4 } }, // Resumo Anual
            { s: { r: estrategiasRow, c: 0 }, e: { r: estrategiasRow, c: 4 } }, // Estratégias Recomendadas
            { s: { r: copyrightRow, c: 0 }, e: { r: copyrightRow, c: 4 } } // Copyright
        ];

        // Adicionar mesclagens à planilha
        ws["!merges"] = mesclagens;

        // Aplicar largura personalizada para colunas
        ws["!cols"] = [
            { wch: 25 }, // Coluna A
            { wch: 15 }, // Coluna B
            { wch: 15 }, // Coluna C
            { wch: 15 }, // Coluna D
            { wch: 15 } // Coluna E
        ];

        // Logo (se disponível)
        try {
            if (this.config.logoEnabled && window.location.protocol !== "file:") {
                const logoImg = document.querySelector("img.logo");
                if (logoImg) {
                    // Adicionar logo
                    if (typeof this._adicionarLogo === "function") {
                        this._adicionarLogo(ws, logoImg, { s: { r: 2, c: 1 }, e: { r: 2, c: 4 } });
                    }
                }
            }
        } catch (e) {
            console.warn("Falha ao adicionar logo:", e);
        }

        return ws;
    },

    /**
     * Cria a planilha de parâmetros
     * @private
     * @param {Object} dados - Dados da simulação
     * @param {Object} configuracao - Configuração do simulador
     * @returns {Object} Planilha de parâmetros
     */
    _criarPlanilhaParametros: function (dados, configuracao) {
        // Dados da planilha
        const parametrosData = [
            ["PARÂMETROS DA SIMULAÇÃO"],
            ["Expertzy Inteligência Tributária"],
            ["Data do relatório:", this._formatarData(new Date())],
            [],
            ["1. DADOS DA EMPRESA"]
        ];

        // Formatar valores
        const formatMoeda = (valor) => {
            if (valor === undefined || valor === null) {
                return "R$ 0,00";
            }
            return "R$ " + valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        };

        const formatPercentual = (valor) => {
            if (typeof valor !== 'number' || isNaN(valor)) {
                return "0.00%";
            }
            // Note que não multiplicamos por 100 pois o valor já deve estar em percentual
            return `${valor.toFixed(2)}%`;
        };

        // Seção 1.1 - Dados Financeiros
        parametrosData.push(
            ["1.1. Dados Financeiros"],
            ["Parâmetro", "Valor"],
            ["Faturamento Anual", formatarMoeda(dados.faturamento)],
            ["Custos Tributáveis", formatarMoeda(dados.custosTributaveis)],
            ["Custos Tributáveis (ICMS)", formatarMoeda(dados.custosICMS)],
            ["Custos de Fornecedores do Simples", formatarMoeda(dados.custosSimples)],
            ["Créditos Anteriores", formatarMoeda(dados.creditosAnteriores)],
            []
        );

        // Seção 1.2 - Configurações Setoriais
        parametrosData.push(
            ["1.2. Configurações Setoriais"],
            ["Parâmetro", "Valor"],
            ["Setor de Atividade", dados.setor ? this._capitalizarPrimeiraLetra(dados.setor) : ""],
            ["Regime Tributário", this._obterRegimeTributarioFormatado(dados.regime)],
            ["Carga Tributária Atual", formatPercentual(dados.cargaAtual)],
            ["Alíquota Média ICMS Entrada", formatPercentual(dados.aliquotaEntrada)],
            ["Alíquota Média ICMS Saída", formatPercentual(dados.aliquotaSaida)],
            []
        );

        // Seção 1.3 - Parâmetros de Simulação
        parametrosData.push(
            ["1.3. Parâmetros de Simulação"],
            ["Parâmetro", "Valor"],
            ["Ano Inicial", dados.anoInicial || 2026],
            ["Ano Final", dados.anoFinal || 2033],
            []
        );

        // Seção 2 - Incentivos Fiscais
        parametrosData.push(["2. INCENTIVOS FISCAIS"], []);

        // Seção 2.1 - Incentivos de Saída
        parametrosData.push(["2.1. Incentivos de Saída"], ["Descrição", "Tipo", "Percentual", "% Operações"]);

        // Adicionar incentivos de saída (se houver)
        if (configuracao && configuracao.icms_config && configuracao.icms_config.incentivos_saida) {
            configuracao.icms_config.incentivos_saida.forEach((incentivo) => {
                parametrosData.push([
                    incentivo.descricao,
                    incentivo.tipo,
                    formatPercentual(incentivo.percentual * 100),
                    formatPercentual(incentivo.percentual_operacoes * 100)
                ]);
            });
        } else {
            parametrosData.push(["Nenhum incentivo de saída configurado", "", "", ""]);
        }

        parametrosData.push([]);

        // Seção 2.2 - Incentivos de Entrada
        parametrosData.push(["2.2. Incentivos de Entrada"], ["Descrição", "Tipo", "Percentual", "% Operações"]);

        // Adicionar incentivos de entrada (se houver)
        if (configuracao && configuracao.icms_config && configuracao.icms_config.incentivos_entrada) {
            configuracao.icms_config.incentivos_entrada.forEach((incentivo) => {
                parametrosData.push([
                    incentivo.descricao,
                    incentivo.tipo,
                    formatPercentual(incentivo.percentual * 100),
                    formatPercentual(incentivo.percentual_operacoes * 100)
                ]);
            });
        } else {
            parametrosData.push(["Nenhum incentivo de entrada configurado", "", "", ""]);
        }

        parametrosData.push([]);

        // Seção 2.3 - Incentivos de Apuração
        parametrosData.push(["2.3. Incentivos de Apuração"], ["Descrição", "Tipo", "Percentual", "% do Saldo"]);

        // Adicionar incentivos de apuração (se houver)
        if (configuracao && configuracao.icms_config && configuracao.icms_config.incentivos_apuracao) {
            configuracao.icms_config.incentivos_apuracao.forEach((incentivo) => {
                parametrosData.push([
                    incentivo.descricao,
                    incentivo.tipo,
                    formatPercentual(incentivo.percentual * 100),
                    formatPercentual(incentivo.percentual_operacoes * 100)
                ]);
            });
        } else {
            parametrosData.push(["Nenhum incentivo de apuração configurado", "", "", ""]);
        }

        parametrosData.push([]);

        // Adicionar rodapé
        parametrosData.push([
            "© 2025 Expertzy Inteligência Tributária - Relatório gerado pelo Simulador de Split Payment"
        ]);

        // Criar planilha
        const ws = XLSX.utils.aoa_to_sheet(parametrosData);

        // Aplicar estilos
        const estilos = [];

        // Título principal
        estilos.push({
            range: { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
            style: {
                font: { bold: true, sz: 18, color: { rgb: this.config.excel.colors.primary } },
                alignment: { horizontal: "center", vertical: "center" }
            }
        });

        // Subtítulo
        estilos.push({
            range: { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } },
            style: {
                font: { bold: true, sz: 14, color: { rgb: this.config.excel.colors.neutral } },
                alignment: { horizontal: "center", vertical: "center" }
            }
        });

        // Data do relatório
        estilos.push({
            range: { s: { r: 2, c: 0 }, e: { r: 2, c: 0 } },
            style: {
                font: { bold: true, sz: 11 },
                alignment: { horizontal: "right", vertical: "center" }
            }
        });

        // Título Seção 1
        estilos.push({
            range: { s: { r: 4, c: 0 }, e: { r: 4, c: 4 } },
            style: {
                font: { bold: true, sz: 14, color: { rgb: this.config.excel.colors.primary } },
                fill: { fgColor: { rgb: this.config.excel.colors.headerBg } },
                alignment: { horizontal: "left", vertical: "center" },
                border: {
                    bottom: { style: "medium", color: { rgb: this.config.excel.colors.primary } }
                }
            }
        });

        // Função para adicionar estilo a títulos de subseções
        const estilizarSubsecao = (row) => {
            estilos.push({
                range: { s: { r: row, c: 0 }, e: { r: row, c: 4 } },
                style: {
                    font: { bold: true, sz: 12, color: { rgb: this.config.excel.colors.primary } },
                    fill: { fgColor: { rgb: this.config.excel.colors.lightBg1 } },
                    border: {
                        bottom: { style: "thin", color: { rgb: this.config.excel.colors.primary } }
                    }
                }
            });
        };

        // Função para adicionar estilo a cabeçalhos de tabelas
        const estilizarCabecalhoTabela = (row) => {
            estilos.push({
                range: { s: { r: row, c: 0 }, e: { r: row, c: 3 } },
                style: {
                    font: { bold: true, sz: 11, color: { rgb: "FFFFFF" } },
                    fill: { fgColor: { rgb: this.config.excel.colors.primary } },
                    alignment: { horizontal: "center", vertical: "center" },
                    border: {
                        top: { style: "thin", color: { rgb: "000000" } },
                        bottom: { style: "thin", color: { rgb: "000000" } },
                        left: { style: "thin", color: { rgb: "000000" } },
                        right: { style: "thin", color: { rgb: "000000" } }
                    }
                }
            });
        };

        // Aplicar estilos aos títulos de subseções e cabeçalhos de tabelas
        estilizarSubsecao(5); // 1.1. Dados Financeiros
        estilizarCabecalhoTabela(6);

        estilizarSubsecao(14); // 1.2. Configurações Setoriais
        estilizarCabecalhoTabela(15);

        estilizarSubsecao(23); // 1.3. Parâmetros de Simulação
        estilizarCabecalhoTabela(24);

        // Título Seção 2
        estilos.push({
            range: { s: { r: 28, c: 0 }, e: { r: 28, c: 4 } },
            style: {
                font: { bold: true, sz: 14, color: { rgb: this.config.excel.colors.primary } },
                fill: { fgColor: { rgb: this.config.excel.colors.headerBg } },
                alignment: { horizontal: "left", vertical: "center" },
                border: {
                    bottom: { style: "medium", color: { rgb: this.config.excel.colors.primary } }
                }
            }
        });

        estilizarSubsecao(30); // 2.1. Incentivos de Saída
        estilizarCabecalhoTabela(31);

        // Calcular posição das seções 2.2 e 2.3 com base no número de incentivos
        let rowOffset = 33;

        if (configuracao && configuracao.icms_config && configuracao.icms_config.incentivos_saida) {
            rowOffset += configuracao.icms_config.incentivos_saida.length;
        } else {
            rowOffset += 1; // Linha "Nenhum incentivo configurado"
        }

        estilizarSubsecao(rowOffset + 1); // 2.2. Incentivos de Entrada
        estilizarCabecalhoTabela(rowOffset + 2);

        rowOffset += 4; // +3 para o cabeçalho e linha em branco

        if (configuracao && configuracao.icms_config && configuracao.icms_config.incentivos_entrada) {
            rowOffset += configuracao.icms_config.incentivos_entrada.length;
        } else {
            rowOffset += 1; // Linha "Nenhum incentivo configurado"
        }

        estilizarSubsecao(rowOffset + 1); // 2.3. Incentivos de Apuração
        estilizarCabecalhoTabela(rowOffset + 2);

        // Copyright no final
        rowOffset += 4;

        if (configuracao && configuracao.icms_config && configuracao.icms_config.incentivos_apuracao) {
            rowOffset += configuracao.icms_config.incentivos_apuracao.length;
        } else {
            rowOffset += 1; // Linha "Nenhum incentivo configurado"
        }

        // Copyright
        const copyrightRow = rowOffset + 2;
        estilos.push({
            range: { s: { r: copyrightRow, c: 0 }, e: { r: copyrightRow, c: 4 } },
            style: {
                font: { italic: true, sz: 9, color: { rgb: this.config.excel.colors.neutral } },
                alignment: { horizontal: "center", vertical: "center" }
            }
        });

        // Mesclar células para títulos
        const mesclagens = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }, // Título principal
            { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } }, // Subtítulo
            { s: { r: 4, c: 0 }, e: { r: 4, c: 4 } }, // 1. DADOS DA EMPRESA
            { s: { r: 5, c: 0 }, e: { r: 5, c: 4 } }, // 1.1. Dados Financeiros
            { s: { r: 14, c: 0 }, e: { r: 14, c: 4 } }, // 1.2. Configurações Setoriais
            { s: { r: 23, c: 0 }, e: { r: 23, c: 4 } }, // 1.3. Parâmetros de Simulação
            { s: { r: 28, c: 0 }, e: { r: 28, c: 4 } }, // 2. INCENTIVOS FISCAIS
            { s: { r: 30, c: 0 }, e: { r: 30, c: 4 } }, // 2.1. Incentivos de Saída
            { s: { r: rowOffset + 1, c: 0 }, e: { r: rowOffset + 1, c: 4 } }, // 2.2. Incentivos de Entrada
            { s: { r: rowOffset + 5, c: 0 }, e: { r: rowOffset + 5, c: 4 } }, // 2.3. Incentivos de Apuração
            { s: { r: copyrightRow, c: 0 }, e: { r: copyrightRow, c: 4 } } // Copyright
        ];

        // Adicionar mesclagens à planilha
        ws["!merges"] = mesclagens;

        // Aplicar largura personalizada para colunas
        ws["!cols"] = [
            { wch: 30 }, // Coluna A
            { wch: 25 }, // Coluna B
            { wch: 15 }, // Coluna C
            { wch: 15 }, // Coluna D
            { wch: 15 } // Coluna E
        ];

        // Formatar células com valores monetários
        for (let r = 7; r <= 11; r++) {
            estilos.push({
                range: { s: { r: r, c: 1 }, e: { r: r, c: 1 } },
                style: {
                    numFmt: "#,##0.00"
                }
            });
        }

        // Formatar células com valores percentuais
        for (let r = 17; r <= 21; r++) {
            if (r >= 19) {
                // Apenas carga tributária e alíquotas
                estilos.push({
                    range: { s: { r: r, c: 1 }, e: { r: r, c: 1 } },
                    style: {
                        numFmt: "0.00%"
                    }
                });
            }
        }

        // Formatar células de incentivos com valores percentuais
        for (let r = 32; r <= copyrightRow - 2; r++) {
            for (let c = 2; c <= 3; c++) {
                estilos.push({
                    range: { s: { r: r, c: c }, e: { r: r, c: c } },
                    style: {
                        numFmt: "0.00%"
                    }
                });
            }
        }

        // Logo (se disponível)
        try {
            if (this.config.logoEnabled && window.location.protocol !== "file:") {
                const logoImg = document.querySelector("img.logo");
                if (logoImg) {
                    // Adicionar logo
                    if (typeof this._adicionarLogo === "function") {
                        this._adicionarLogo(ws, logoImg, { s: { r: 2, c: 1 }, e: { r: 2, c: 4 } });
                    }
                }
            }
        } catch (e) {
            console.warn("Falha ao adicionar logo:", e);
        }

        return ws;
    },

    /**
     * Cria a planilha de resultados
     * @private
     * @param {Object} resultados - Resultados da simulação
     * @param {Object} aliquotasEquivalentes - Alíquotas equivalentes calculadas
     * @returns {Object} Planilha de resultados
     */
    _criarPlanilhaResultados: function (resultados, aliquotasEquivalentes) {
        // Organizar anos
        const anos = Object.keys(resultados).sort();

        // Dados da planilha
        const resultadosData = [
            ["RESULTADOS DA SIMULAÇÃO"],
            ["Expertzy Inteligência Tributária"],
            ["Data do relatório:", this._formatarData(new Date())],
            [],
            ["1. TABELA DE RESULTADOS"]
        ];

        // Cabeçalho da tabela
        resultadosData.push([
            "Ano",
            "CBS",
            "IBS",
            "Subtotal Novo",
            "Créditos",
            "Imposto Devido",
            "Carga Atual",
            "Diferença",
            "Variação (%)"
        ]);

        // Dados por ano
        anos.forEach((ano) => {
            const resultado = resultados[ano];
            // Verificação robusta para evitar erro
            const valorAtual =
                aliquotasEquivalentes[ano] && typeof aliquotasEquivalentes[ano].valor_atual !== "undefined"
                    ? aliquotasEquivalentes[ano].valor_atual
                    : 0;

            const diferenca = resultado.imposto_devido - valorAtual;
            const percentual = valorAtual !== 0 ? diferenca / valorAtual : 0;

            resultadosData.push([
                parseInt(ano),
                resultado.cbs,
                resultado.ibs,
                resultado.cbs + resultado.ibs,
                resultado.creditos,
                resultado.imposto_devido,
                valorAtual,
                diferenca,
                percentual
            ]);
        });

        resultadosData.push([]);

        // Título da seção de análise de resultados
        resultadosData.push(["2. ANÁLISE DOS RESULTADOS"]);

        // Calcular indicadores
        let variacaoTotal = 0;
        let variacaoMedia = 0;
        let variacaoPercentualMedia = 0;
        let maiorAumento = { valor: 0, ano: "" };
        let maiorReducao = { valor: 0, ano: "" };

        anos.forEach((ano) => {
            const resultado = resultados[ano];
            // Verificação robusta para evitar erro
            const valorAtual =
                aliquotasEquivalentes[ano] && typeof aliquotasEquivalentes[ano].valor_atual !== "undefined"
                    ? aliquotasEquivalentes[ano].valor_atual
                    : 0;

            const diferenca = resultado.imposto_devido - valorAtual;
            const percentual = valorAtual !== 0 ? diferenca / valorAtual : 0;

            // Acumular variação total
            variacaoTotal += diferenca;

            // Verificar maior aumento
            if (diferenca > maiorAumento.valor) {
                maiorAumento.valor = diferenca;
                maiorAumento.ano = ano;
            }

            // Verificar maior redução (diferença negativa)
            if (diferenca < maiorReducao.valor) {
                maiorReducao.valor = diferenca;
                maiorReducao.ano = ano;
            }

            // Acumular variação percentual
            variacaoPercentualMedia += percentual;
        });

        // Calcular médias
        variacaoMedia = anos.length > 0 ? variacaoTotal / anos.length : 0;
        variacaoPercentualMedia = anos.length > 0 ? variacaoPercentualMedia / anos.length : 0;

        // Adicionar análises
        resultadosData.push(
            ["2.1. Indicadores Agregados"],
            ["Indicador", "Valor", "Observação"],
            [
                "Variação Total Acumulada",
                variacaoTotal,
                variacaoTotal > 0 ? "Aumento da carga tributária" : "Redução da carga tributária"
            ],
            ["Variação Média Anual", variacaoMedia, ""],
            ["Variação Percentual Média", variacaoPercentualMedia, ""],
            ["Ano de Maior Aumento", `${maiorAumento.ano}`, `R$ ${maiorAumento.valor.toFixed(2)}`],
            ["Ano de Maior Redução", `${maiorReducao.ano}`, `R$ ${maiorReducao.valor.toFixed(2)}`],
            []
        );

        // Título da seção de estrutura do imposto
        resultadosData.push(["2.2. Estrutura do Imposto"], ["Ano", "CBS (%)", "IBS (%)", "Créditos (%)"]);

        // Dados da estrutura do imposto
        anos.forEach((ano) => {
            const resultado = resultados[ano];
            const total = resultado.cbs + resultado.ibs;

            if (total > 0) {
                resultadosData.push([
                    parseInt(ano),
                    resultado.cbs / total,
                    resultado.ibs / total,
                    resultado.creditos / total
                ]);
            } else {
                resultadosData.push([parseInt(ano), 0, 0, 0]);
            }
        });

        resultadosData.push([]);

        // Título da seção de conclusão
        resultadosData.push(["3. CONCLUSÃO"]);

        // Texto de conclusão
        const conclusao =
            variacaoTotal > 0
                ? [
                      `A simulação demonstra um aumento médio de ${(variacaoPercentualMedia * 100).toFixed(2)}% na carga tributária durante o período de transição, `,
                      `com variação total acumulada de R$ ${variacaoTotal.toFixed(2)}. O impacto mais significativo ocorre no ano ${maiorAumento.ano}, `,
                      `com um aumento de R$ ${maiorAumento.valor.toFixed(2)}. Recomenda-se a adoção de estratégias de mitigação para equilibrar o fluxo de caixa.`
                  ].join("")
                : [
                      `A simulação demonstra uma redução média de ${Math.abs(variacaoPercentualMedia * 100).toFixed(2)}% na carga tributária durante o período de transição, `,
                      `com variação total acumulada de R$ ${variacaoTotal.toFixed(2)}. O impacto mais favorável ocorre no ano ${maiorReducao.ano}, `,
                      `com uma redução de R$ ${Math.abs(maiorReducao.valor).toFixed(2)}. Esta economia pode ser direcionada para investimentos estratégicos.`
                  ].join("");

        resultadosData.push(
            [conclusao],
            [],
            [
                'Para uma análise detalhada das estratégias de mitigação recomendadas, consulte a planilha "Estratégias de Mitigação".'
            ],
            [],
            ["© 2025 Expertzy Inteligência Tributária - Relatório gerado pelo Simulador de Split Payment"]
        );

        // Criar planilha
        const ws = XLSX.utils.aoa_to_sheet(resultadosData);

        // Aplicar estilos
        const estilos = [];

        // Título principal
        estilos.push({
            range: { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } },
            style: {
                font: { bold: true, sz: 18, color: { rgb: this.config.excel.colors.primary } },
                alignment: { horizontal: "center", vertical: "center" }
            }
        });

        // Subtítulo
        estilos.push({
            range: { s: { r: 1, c: 0 }, e: { r: 1, c: 8 } },
            style: {
                font: { bold: true, sz: 14, color: { rgb: this.config.excel.colors.neutral } },
                alignment: { horizontal: "center", vertical: "center" }
            }
        });

        // Aplicar estilos aos títulos de seções
        for (let secao of [4, 6 + anos.length + 1, 6 + anos.length + 10 + anos.length + 1]) {
            estilos.push({
                range: { s: { r: secao, c: 0 }, e: { r: secao, c: 8 } },
                style: {
                    font: { bold: true, sz: 14, color: { rgb: this.config.excel.colors.primary } },
                    fill: { fgColor: { rgb: this.config.excel.colors.headerBg } },
                    alignment: { horizontal: "left", vertical: "center" },
                    border: {
                        bottom: { style: "medium", color: { rgb: this.config.excel.colors.primary } }
                    }
                }
            });
        }

        // Cabeçalho da tabela principal
        estilos.push({
            range: { s: { r: 5, c: 0 }, e: { r: 5, c: 8 } },
            style: {
                font: { bold: true, sz: 11, color: { rgb: "FFFFFF" } },
                fill: { fgColor: { rgb: this.config.excel.colors.primary } },
                alignment: { horizontal: "center", vertical: "center" },
                border: {
                    top: { style: "thin", color: { rgb: "000000" } },
                    bottom: { style: "thin", color: { rgb: "000000" } },
                    left: { style: "thin", color: { rgb: "000000" } },
                    right: { style: "thin", color: { rgb: "000000" } }
                }
            }
        });

        // Aplicar estilos às linhas de dados
        for (let r = 6; r < 6 + anos.length; r++) {
            // Formatar valores monetários
            for (let c = 1; c <= 7; c++) {
                estilos.push({
                    range: { s: { r: r, c: c }, e: { r: r, c: c } },
                    style: {
                        numFmt: "#,##0.00"
                    }
                });
            }

            // Formatar coluna de variação percentual
            estilos.push({
                range: { s: { r: r, c: 8 }, e: { r: r, c: 8 } },
                style: {
                    numFmt: "0.00%"
                }
            });

            // Adicionar cores condicionais para diferença e variação
            const index = r - 6;
            const ano = anos[index];
            const resultado = resultados[ano];
            const valorAtual = aliquotasEquivalentes[ano] && typeof aliquotasEquivalentes[ano].valor_atual !== "undefined"
                ? aliquotasEquivalentes[ano].valor_atual
                : 0;
            const diferenca = resultado.imposto_devido - valorAtual;

            // Cor para diferença
            if (diferenca > 0) {
                estilos.push({
                    range: { s: { r: r, c: 7 }, e: { r: r, c: 8 } },
                    style: {
                        fill: { fgColor: { rgb: "FFCCCC" } } // Vermelho claro
                    }
                });
            } else if (diferenca < 0) {
                estilos.push({
                    range: { s: { r: r, c: 7 }, e: { r: r, c: 8 } },
                    style: {
                        fill: { fgColor: { rgb: "CCFFCC" } } // Verde claro
                    }
                });
            }

            // Alternar cores de fundo
            if (r % 2 === 0) {
                estilos.push({
                    range: { s: { r: r, c: 0 }, e: { r: r, c: 6 } },
                    style: {
                        fill: { fgColor: { rgb: this.config.excel.colors.lightBg1 } }
                    }
                });
            }
        }

        // Cabeçalho da seção de indicadores
        const rowIndicadores = 6 + anos.length + 2;
        estilos.push({
            range: { s: { r: rowIndicadores, c: 0 }, e: { r: rowIndicadores, c: 8 } },
            style: {
                font: { bold: true, sz: 12, color: { rgb: this.config.excel.colors.primary } },
                fill: { fgColor: { rgb: this.config.excel.colors.lightBg1 } },
                border: {
                    bottom: { style: "thin", color: { rgb: this.config.excel.colors.primary } }
                }
            }
        });

        // Cabeçalho da tabela de indicadores
        estilos.push({
            range: { s: { r: rowIndicadores + 1, c: 0 }, e: { r: rowIndicadores + 1, c: 2 } },
            style: {
                font: { bold: true, sz: 11, color: { rgb: "FFFFFF" } },
                fill: { fgColor: { rgb: this.config.excel.colors.primary } },
                alignment: { horizontal: "center", vertical: "center" },
                border: {
                    top: { style: "thin", color: { rgb: "000000" } },
                    bottom: { style: "thin", color: { rgb: "000000" } },
                    left: { style: "thin", color: { rgb: "000000" } },
                    right: { style: "thin", color: { rgb: "000000" } }
                }
            }
        });

        // Formatar valores na tabela de indicadores
        for (let r = rowIndicadores + 2; r <= rowIndicadores + 6; r++) {
            estilos.push({
                range: { s: { r: r, c: 1 }, e: { r: r, c: 1 } },
                style: {
                    numFmt: "#,##0.00"
                }
            });

            // Formatar variação percentual média
            if (r === rowIndicadores + 4) {
                estilos.push({
                    range: { s: { r: r, c: 1 }, e: { r: r, c: 1 } },
                    style: {
                        numFmt: "0.00%"
                    }
                });
            }
        }

        // Cabeçalho da seção de estrutura
        const rowEstrutura = rowIndicadores + 8;
        estilos.push({
            range: { s: { r: rowEstrutura, c: 0 }, e: { r: rowEstrutura, c: 8 } },
            style: {
                font: { bold: true, sz: 12, color: { rgb: this.config.excel.colors.primary } },
                fill: { fgColor: { rgb: this.config.excel.colors.lightBg1 } },
                border: {
                    bottom: { style: "thin", color: { rgb: this.config.excel.colors.primary } }
                }
            }
        });

        // Cabeçalho da tabela de estrutura
        estilos.push({
            range: { s: { r: rowEstrutura + 1, c: 0 }, e: { r: rowEstrutura + 1, c: 3 } },
            style: {
                font: { bold: true, sz: 11, color: { rgb: "FFFFFF" } },
                fill: { fgColor: { rgb: this.config.excel.colors.primary } },
                alignment: { horizontal: "center", vertical: "center" },
                border: {
                    top: { style: "thin", color: { rgb: "000000" } },
                    bottom: { style: "thin", color: { rgb: "000000" } },
                    left: { style: "thin", color: { rgb: "000000" } },
                    right: { style: "thin", color: { rgb: "000000" } }
                }
            }
        });

        // Formatar percentuais na tabela de estrutura
        for (let r = rowEstrutura + 2; r < rowEstrutura + 2 + anos.length; r++) {
            for (let c = 1; c <= 3; c++) {
                estilos.push({
                    range: { s: { r: r, c: c }, e: { r: r, c: c } },
                    style: {
                        numFmt: "0.00%"
                    }
                });
            }
        }

        // Mesclar células para títulos
        const mesclagens = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } }, // Título principal
            { s: { r: 1, c: 0 }, e: { r: 1, c: 8 } }, // Subtítulo
            { s: { r: 4, c: 0 }, e: { r: 4, c: 8 } }, // 1. TABELA DE RESULTADOS
            { s: { r: 6 + anos.length + 1, c: 0 }, e: { r: 6 + anos.length + 1, c: 8 } }, // 2. ANÁLISE DOS RESULTADOS
            { s: { r: rowIndicadores, c: 0 }, e: { r: rowIndicadores, c: 8 } }, // 2.1. Indicadores Agregados
            { s: { r: rowEstrutura, c: 0 }, e: { r: rowEstrutura, c: 8 } }, // 2.2. Estrutura do Imposto
            { s: { r: rowEstrutura + 2 + anos.length + 1, c: 0 }, e: { r: rowEstrutura + 2 + anos.length + 1, c: 8 } }, // 3. CONCLUSÃO
            { s: { r: rowEstrutura + 2 + anos.length + 2, c: 0 }, e: { r: rowEstrutura + 2 + anos.length + 2, c: 8 } }, // Texto conclusão
            { s: { r: rowEstrutura + 2 + anos.length + 4, c: 0 }, e: { r: rowEstrutura + 2 + anos.length + 4, c: 8 } }, // Nota estratégias
            { s: { r: rowEstrutura + 2 + anos.length + 6, c: 0 }, e: { r: rowEstrutura + 2 + anos.length + 6, c: 8 } } // Copyright
        ];

        // Adicionar mesclagens à planilha
        ws["!merges"] = mesclagens;

        // Aplicar largura personalizada para colunas
        ws["!cols"] = [
            { wch: 15 }, // Coluna A
            { wch: 15 }, // Coluna B
            { wch: 15 }, // Coluna C
            { wch: 15 }, // Coluna D
            { wch: 15 }, // Coluna E
            { wch: 15 }, // Coluna F
            { wch: 15 }, // Coluna G
            { wch: 15 }, // Coluna H
            { wch: 15 } // Coluna I
        ];

        // Logo (se disponível)
        try {
            if (this.config.logoEnabled && window.location.protocol !== "file:") {
                const logoImg = document.querySelector("img.logo");
                if (logoImg) {
                    // Adicionar logo
                    if (typeof this._adicionarLogo === "function") {
                        this._adicionarLogo(ws, logoImg, { s: { r: 2, c: 1 }, e: { r: 2, c: 8 } });
                    }
                }
            }
        } catch (e) {
            console.warn("Falha ao adicionar logo:", e);
        }

        return ws;
    },

    /**
     * Cria a planilha de análise comparativa
     * @private
     * @param {Object} resultados - Resultados da simulação
     * @param {Object} aliquotasEquivalentes - Alíquotas equivalentes calculadas
     * @returns {Object} Planilha de análise comparativa
     */
    _criarPlanilhaEstrategias: function (dados, resultados) {
        // Organizar anos
        const anos = Object.keys(resultados).sort();

        // Dados da planilha
        const estrategiasData = [
            ["ESTRATÉGIAS DE MITIGAÇÃO DO IMPACTO DO SPLIT PAYMENT"],
            ["Expertzy Inteligência Tributária"],
            ["Data do relatório:", this._formatarData(new Date())],
            [],
            ["1. AVALIAÇÃO DO IMPACTO NO FLUXO DE CAIXA"]
        ];

        // Calcular impacto médio no fluxo de caixa
        let impactoTotalCapitalGiro = 0;
        let mediaImpacto = 0;

        // Cabeçalho da tabela
        estrategiasData.push([
            "Ano",
            "Valor Retido",
            "Prazo Médio de Recebimento (dias)",
            "Prazo de Recolhimento Atual (dias)",
            "Dias de Capital de Giro Perdidos",
            "Impacto no Capital de Giro"
        ]);

        // Dados por ano
        anos.forEach((ano) => {
            const resultado = resultados[ano];
            // Verificação robusta para evitar erro
            const valorAtual =
                aliquotasEquivalentes[ano] && typeof aliquotasEquivalentes[ano].valor_atual !== "undefined"
                    ? aliquotasEquivalentes[ano].valor_atual
                    : 0;

            const diferenca = resultado.imposto_devido - valorAtual;
            const percentual = valorAtual !== 0 ? diferenca / valorAtual : 0;

            // Calcular valores para cada ano
            const valorRetido = resultado.imposto_devido;
            const prazoMedioRecebimento = 30; // Valor médio estimado
            const prazoRecolhimentoAtual = 45; // Valor médio estimado (recolhimento no mês seguinte)
            const diasCapitalGiroPerdidos = Math.max(0, prazoRecolhimentoAtual - prazoMedioRecebimento);
            const impactoCapitalGiro = valorRetido * (diasCapitalGiroPerdidos / 365);

            // Acumular para cálculo da média
            impactoTotalCapitalGiro += impactoCapitalGiro;

            estrategiasData.push([
                parseInt(ano),
                valorRetido,
                prazoMedioRecebimento,
                prazoRecolhimentoAtual,
                diasCapitalGiroPerdidos,
                impactoCapitalGiro
            ]);
        });

        // Calcular média de impacto
        mediaImpacto = anos.length > 0 ? impactoTotalCapitalGiro / anos.length : 0;

        estrategiasData.push(["Média", "", "", "", "", mediaImpacto], []);

        // Seção 2 - Estratégias de Mitigação
        estrategiasData.push(["2. ESTRATÉGIAS DE MITIGAÇÃO"]);

        // 2.1 - Estratégias Financeiras
        estrategiasData.push(
            ["2.1. Estratégias Financeiras"],
            ["Estratégia", "Descrição", "Eficácia Estimada", "Facilidade de Implementação", "Recomendação"]
        );

        // Adicionar as estratégias financeiras
        const estrategiasFinanceiras = [
            [
                "Ajuste de Preços",
                "Repassar parte do impacto do Split Payment aos preços dos produtos/serviços",
                "Alta (70-90%)",
                "Média",
                "Altamente recomendada para empresas com elasticidade-preço favorável"
            ],
            [
                "Antecipação de Recebíveis",
                "Antecipar recebimentos para compensar a perda de capital de giro",
                "Média (40-60%)",
                "Alta",
                "Recomendada com análise do custo financeiro"
            ],
            [
                "Captação de Capital de Giro",
                "Buscar linhas de financiamento específicas para capital de giro",
                "Alta (60-80%)",
                "Média",
                "Recomendada com análise do custo financeiro e condições"
            ],
            [
                "Desconto para Pagamentos à Vista",
                "Oferecer descontos para aumentar o percentual de recebimentos imediatos",
                "Média (30-50%)",
                "Alta",
                "Recomendada para setores com margens adequadas"
            ]
        ];

        // Adicionar estratégias financeiras à planilha
        estrategiasFinanceiras.forEach((estrategia) => {
            estrategiasData.push(estrategia);
        });

        estrategiasData.push([]);

        // 2.2 - Estratégias Operacionais
        estrategiasData.push(
            ["2.2. Estratégias Operacionais"],
            ["Estratégia", "Descrição", "Eficácia Estimada", "Facilidade de Implementação", "Recomendação"]
        );

        // Adicionar as estratégias operacionais
        const estrategiasOperacionais = [
            [
                "Renegociação de Prazos com Fornecedores",
                "Alongar os prazos de pagamento para compensar a redução do ciclo financeiro",
                "Alta (50-70%)",
                "Média",
                "Altamente recomendada para todos os setores"
            ],
            [
                "Ajuste no Mix de Produtos/Serviços",
                "Priorizar produtos/serviços com melhor margem e ciclo financeiro",
                "Média (30-50%)",
                "Baixa",
                "Recomendada para setores com diversidade de ofertas"
            ],
            [
                "Otimização de Estoques",
                "Reduzir níveis de estoque para liberar capital de giro",
                "Média (40-60%)",
                "Média",
                "Recomendada para comércio e indústria"
            ],
            [
                "Incentivo a Meios de Pagamento Favoráveis",
                "Estimular modalidades de pagamento que reduzam o prazo médio de recebimento",
                "Média (30-50%)",
                "Alta",
                "Recomendada para todos os setores"
            ]
        ];

        // Adicionar estratégias operacionais à planilha
        estrategiasOperacionais.forEach((estrategia) => {
            estrategiasData.push(estrategia);
        });

        estrategiasData.push([]);

        // 2.3 - Estratégias Tributárias
        estrategiasData.push(
            ["2.3. Estratégias Tributárias"],
            ["Estratégia", "Descrição", "Eficácia Estimada", "Facilidade de Implementação", "Recomendação"]
        );

        // Adicionar as estratégias tributárias
        const estrategiasTributarias = [
            [
                "Maximização do Aproveitamento de Créditos",
                "Revisão completa da cadeia de custos para mapear créditos potenciais",
                "Alta (50-80%)",
                "Média",
                "Altamente recomendada para todos os setores"
            ],
            [
                "Planejamento Tributário",
                "Revisar a estrutura tributária para otimizar a carga fiscal no novo sistema",
                "Alta (40-70%)",
                "Baixa",
                "Altamente recomendada com acompanhamento especializado"
            ],
            [
                "Aplicação de Incentivos Fiscais",
                "Mapear e implementar incentivos fiscais setoriais e regionais disponíveis",
                "Média (30-60%)",
                "Baixa",
                "Recomendada conforme setor e localização"
            ]
        ];

        // Adicionar estratégias tributárias à planilha
        estrategiasTributarias.forEach((estrategia) => {
            estrategiasData.push(estrategia);
        });

        estrategiasData.push([]);

        // Seção 3 - Plano de Implementação
        estrategiasData.push(
            ["3. PLANO DE IMPLEMENTAÇÃO RECOMENDADO"],
            ["Fase", "Estratégias", "Prazo Recomendado", "Complexidade", "Resultado Esperado"]
        );

        // Adicionar fases de implementação
        const fasesImplementacao = [
            [
                "Fase 1: Ações Imediatas",
                "Ajuste de Preços, Antecipação de Recebíveis, Incentivo a Meios de Pagamento Favoráveis",
                "1-3 meses",
                "Baixa-Média",
                "Mitigação rápida de 30-40% do impacto"
            ],
            [
                "Fase 2: Ações de Médio Prazo",
                "Renegociação com Fornecedores, Otimização de Estoques, Maximização de Créditos",
                "3-6 meses",
                "Média",
                "Mitigação adicional de 20-30% do impacto"
            ],
            [
                "Fase 3: Ações Estruturais",
                "Ajuste no Mix de Produtos, Planejamento Tributário, Aplicação de Incentivos Fiscais",
                "6-12 meses",
                "Alta",
                "Mitigação adicional de 10-20% do impacto e preparação para sustentabilidade de longo prazo"
            ]
        ];

        // Adicionar fases de implementação à planilha
        fasesImplementacao.forEach((fase) => {
            estrategiasData.push(fase);
        });

        estrategiasData.push([]);

        // Seção 4 - Análise de Custo-Benefício
        estrategiasData.push(
            ["4. ANÁLISE DE CUSTO-BENEFÍCIO"],
            ["Tipo de Estratégia", "Economia Potencial", "Custo de Implementação", "ROI Estimado", "Prazo de Retorno"]
        );

        // Adicionar análises de custo-benefício
        const analisesCustoBeneficio = [
            [
                "Estratégias Financeiras",
                mediaImpacto * 0.7, // 70% do impacto médio
                mediaImpacto * 0.1, // 10% do impacto médio como custo
                "7:1",
                "1-3 meses"
            ],
            [
                "Estratégias Operacionais",
                mediaImpacto * 0.5, // 50% do impacto médio
                mediaImpacto * 0.15, // 15% do impacto médio como custo
                "3.3:1",
                "3-6 meses"
            ],
            [
                "Estratégias Tributárias",
                mediaImpacto * 0.6, // 60% do impacto médio
                mediaImpacto * 0.2, // 20% do impacto médio como custo
                "3:1",
                "6-12 meses"
            ],
            [
                "Combinação Ótima de Estratégias",
                mediaImpacto * 0.9, // 90% do impacto médio
                mediaImpacto * 0.25, // 25% do impacto médio como custo
                "3.6:1",
                "3-6 meses"
            ]
        ];

        // Adicionar análises à planilha
        analisesCustoBeneficio.forEach((analise) => {
            estrategiasData.push(analise);
        });

        estrategiasData.push([]);

        // Conclusão
        const conclusao = [
            ["5. CONCLUSÃO E RECOMENDAÇÕES FINAIS"],
            [
                "A implementação do Split Payment terá um impacto significativo no fluxo de caixa das empresas, com redução média anual de capital de giro de R$ " +
                    mediaImpacto.toFixed(2) +
                    ". Recomenda-se a adoção imediata de uma combinação de estratégias financeiras, operacionais e tributárias, " +
                    "priorizando aquelas com maior eficácia e facilidade de implementação."
            ],
            [],
            [
                "Com base na análise realizada, estima-se que a implementação do pacote completo de estratégias recomendadas pode neutralizar até 90% do impacto " +
                    "do Split Payment no fluxo de caixa, com retorno do investimento em implementação em um prazo de 3 a 6 meses."
            ],
            [],
            [
                "Recomenda-se o monitoramento contínuo do impacto durante o período de transição (2026-2033), ajustando as estratégias conforme necessário " +
                    "e aproveitando oportunidades que possam surgir com a evolução do sistema tributário."
            ],
            [],
            ["© 2025 Expertzy Inteligência Tributária - Relatório gerado pelo Simulador de Split Payment"]
        ];

        // Adicionar conclusão à planilha
        conclusao.forEach((linha) => {
            estrategiasData.push(linha);
        });

        // Criar planilha
        const ws = XLSX.utils.aoa_to_sheet(estrategiasData);

        // Aplicar estilos
        const estilos = [];

        // Título principal
        estilos.push({
            range: { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },
            style: {
                font: { bold: true, sz: 18, color: { rgb: this.config.excel.colors.primary } },
                alignment: { horizontal: "center", vertical: "center" }
            }
        });

        // Subtítulo
        estilos.push({
            range: { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } },
            style: {
                font: { bold: true, sz: 14, color: { rgb: this.config.excel.colors.neutral } },
                alignment: { horizontal: "center", vertical: "center" }
            }
        });

        // Data do relatório
        estilos.push({
            range: { s: { r: 2, c: 0 }, e: { r: 2, c: 0 } },
            style: {
                font: { bold: true, sz: 11 },
                alignment: { horizontal: "right", vertical: "center" }
            }
        });

        // Títulos de seções
        const titulosSecoes = [
            4,
            12 + anos.length,
            13 + anos.length,
            19 + anos.length,
            25 + anos.length,
            31 + anos.length,
            38 + anos.length
        ];

        for (const row of titulosSecoes) {
            estilos.push({
                range: { s: { r: row, c: 0 }, e: { r: row, c: 5 } },
                style: {
                    font: { bold: true, sz: 14, color: { rgb: this.config.excel.colors.primary } },
                    fill: { fgColor: { rgb: this.config.excel.colors.headerBg } },
                    alignment: { horizontal: "left", vertical: "center" },
                    border: {
                        bottom: { style: "medium", color: { rgb: this.config.excel.colors.primary } }
                    }
                }
            });
        }

        // Título subseções
        const titulosSubsecoes = [13 + anos.length, 19 + anos.length, 25 + anos.length];

        for (const row of titulosSubsecoes) {
            estilos.push({
                range: { s: { r: row, c: 0 }, e: { r: row, c: 5 } },
                style: {
                    font: { bold: true, sz: 12, color: { rgb: this.config.excel.colors.primary } },
                    fill: { fgColor: { rgb: this.config.excel.colors.lightBg1 } },
                    border: {
                        bottom: { style: "thin", color: { rgb: this.config.excel.colors.primary } }
                    }
                }
            });
        }

        // Cabeçalhos de tabelas
        const cabecalhosTabelas = [
            5,
            14 + anos.length,
            20 + anos.length,
            26 + anos.length,
            32 + anos.length,
            39 + anos.length
        ];

        for (const row of cabecalhosTabelas) {
            estilos.push({
                range: { s: { r: row, c: 0 }, e: { r: row, c: 4 } },
                style: {
                    font: { bold: true, sz: 11, color: { rgb: "FFFFFF" } },
                    fill: { fgColor: { rgb: this.config.excel.colors.primary } },
                    alignment: { horizontal: "center", vertical: "center" },
                    border: {
                        top: { style: "thin", color: { rgb: "000000" } },
                        bottom: { style: "thin", color: { rgb: "000000" } },
                        left: { style: "thin", color: { rgb: "000000" } },
                        right: { style: "thin", color: { rgb: "000000" } }
                    }
                }
            });
        }

        // Formatar células da tabela principal (anos)
        for (let r = 6; r < 6 + anos.length; r++) {
            // Formatar valores monetários
            estilos.push({
                range: { s: { r: r, c: 1 }, e: { r: r, c: 1 } },
                style: {
                    numFmt: "#,##0.00"
                }
            });

            estilos.push({
                range: { s: { r: r, c: 5 }, e: { r: r, c: 5 } },
                style: {
                    numFmt: "#,##0.00"
                }
            });

            // Formatar colunas de prazos
            for (let c = 2; c <= 4; c++) {
                estilos.push({
                    range: { s: { r: r, c: c }, e: { r: r, c: c } },
                    style: {
                        numFmt: "0"
                    }
                });
            }

            // Alternar cores de fundo
            if (r % 2 === 0) {
                estilos.push({
                    range: { s: { r: r, c: 0 }, e: { r: r, c: 5 } },
                    style: {
                        fill: { fgColor: { rgb: this.config.excel.colors.lightBg1 } }
                    }
                });
            }
        }

        // Formatação da linha de média
        estilos.push({
            range: { s: { r: 6 + anos.length, c: 0 }, e: { r: 6 + anos.length, c: 5 } },
            style: {
                font: { bold: true },
                fill: { fgColor: { rgb: this.config.excel.colors.lightBg1 } },
                border: {
                    top: { style: "thin", color: { rgb: "000000" } },
                    bottom: { style: "thin", color: { rgb: "000000" } }
                }
            }
        });

        estilos.push({
            range: { s: { r: 6 + anos.length, c: 5 }, e: { r: 6 + anos.length, c: 5 } },
            style: {
                numFmt: "#,##0.00"
            }
        });

        // Formatar células da tabela de estratégias financeiras
        for (let r = 15 + anos.length; r < 15 + anos.length + estrategiasFinanceiras.length; r++) {
            // Alternar cores de fundo
            if ((r - (15 + anos.length)) % 2 === 0) {
                estilos.push({
                    range: { s: { r: r, c: 0 }, e: { r: r, c: 4 } },
                    style: {
                        fill: { fgColor: { rgb: this.config.excel.colors.lightBg1 } }
                    }
                });
            }
        }

        // Formatar células da tabela de estratégias operacionais
        for (let r = 21 + anos.length; r < 21 + anos.length + estrategiasOperacionais.length; r++) {
            // Alternar cores de fundo
            if ((r - (21 + anos.length)) % 2 === 0) {
                estilos.push({
                    range: { s: { r: r, c: 0 }, e: { r: r, c: 4 } },
                    style: {
                        fill: { fgColor: { rgb: this.config.excel.colors.lightBg1 } }
                    }
                });
            }
        }

        // Formatar células da tabela de estratégias tributárias
        for (let r = 27 + anos.length; r < 27 + anos.length + estrategiasTributarias.length; r++) {
            // Alternar cores de fundo
            if ((r - (27 + anos.length)) % 2 === 0) {
                estilos.push({
                    range: { s: { r: r, c: 0 }, e: { r: r, c: 4 } },
                    style: {
                        fill: { fgColor: { rgb: this.config.excel.colors.lightBg1 } }
                    }
                });
            }
        }

        // Formatar células da tabela de fases de implementação
        for (let r = 33 + anos.length; r < 33 + anos.length + fasesImplementacao.length; r++) {
            // Alternar cores de fundo
            if ((r - (33 + anos.length)) % 2 === 0) {
                estilos.push({
                    range: { s: { r: r, c: 0 }, e: { r: r, c: 4 } },
                    style: {
                        fill: { fgColor: { rgb: this.config.excel.colors.lightBg1 } }
                    }
                });
            }
        }

        // Formatar células da tabela de análise de custo-benefício
        for (let r = 40 + anos.length; r < 40 + anos.length + analisesCustoBeneficio.length; r++) {
            // Formatar valores monetários
            for (let c = 1; c <= 2; c++) {
                estilos.push({
                    range: { s: { r: r, c: c }, e: { r: r, c: c } },
                    style: {
                        numFmt: "#,##0.00"
                    }
                });
            }

            // Alternar cores de fundo
            if ((r - (40 + anos.length)) % 2 === 0) {
                estilos.push({
                    range: { s: { r: r, c: 0 }, e: { r: r, c: 4 } },
                    style: {
                        fill: { fgColor: { rgb: this.config.excel.colors.lightBg1 } }
                    }
                });
            }
        }

        // Formatar conclusão
        const conclusaoInicio = 40 + anos.length + analisesCustoBeneficio.length + 2;

        for (let r = conclusaoInicio + 1; r < conclusaoInicio + 6; r += 2) {
            estilos.push({
                range: { s: { r: r, c: 0 }, e: { r: r, c: 4 } },
                style: {
                    alignment: { wrapText: true }
                }
            });
        }

        // Copyright
        const copyrightRow = conclusaoInicio + 6;
        estilos.push({
            range: { s: { r: copyrightRow, c: 0 }, e: { r: copyrightRow, c: 4 } },
            style: {
                font: { italic: true, sz: 9, color: { rgb: this.config.excel.colors.neutral } },
                alignment: { horizontal: "center", vertical: "center" }
            }
        });

        // Mesclar células para títulos
        const mesclagens = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }, // Título principal
            { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } }, // Subtítulo
            { s: { r: 4, c: 0 }, e: { r: 4, c: 5 } }, // 1. AVALIAÇÃO DO IMPACTO NO FLUXO DE CAIXA
            { s: { r: 12 + anos.length, c: 0 }, e: { r: 12 + anos.length, c: 5 } }, // 2. ESTRATÉGIAS DE MITIGAÇÃO
            { s: { r: 13 + anos.length, c: 0 }, e: { r: 13 + anos.length, c: 5 } }, // 2.1. Estratégias Financeiras
            { s: { r: 19 + anos.length, c: 0 }, e: { r: 19 + anos.length, c: 5 } }, // 2.2. Estratégias Operacionais
            { s: { r: 25 + anos.length, c: 0 }, e: { r: 25 + anos.length, c: 5 } }, // 2.3. Estratégias Tributárias
            { s: { r: 31 + anos.length, c: 0 }, e: { r: 31 + anos.length, c: 5 } }, // 3. PLANO DE IMPLEMENTAÇÃO RECOMENDADO
            { s: { r: 38 + anos.length, c: 0 }, e: { r: 38 + anos.length, c: 5 } }, // 4. ANÁLISE DE CUSTO-BENEFÍCIO
            { s: { r: conclusaoInicio, c: 0 }, e: { r: conclusaoInicio, c: 5 } }, // 5. CONCLUSÃO E RECOMENDAÇÕES FINAIS

            // Mesclar células das conclusões
            { s: { r: conclusaoInicio + 1, c: 0 }, e: { r: conclusaoInicio + 1, c: 5 } },
            { s: { r: conclusaoInicio + 3, c: 0 }, e: { r: conclusaoInicio + 3, c: 5 } },
            { s: { r: conclusaoInicio + 5, c: 0 }, e: { r: conclusaoInicio + 5, c: 5 } },
            { s: { r: copyrightRow, c: 0 }, e: { r: copyrightRow, c: 5 } } // Copyright
        ];

        // Adicionar mesclagens à planilha
        ws["!merges"] = mesclagens;

        // Aplicar largura personalizada para colunas
        ws["!cols"] = [
            { wch: 25 }, // Coluna A
            { wch: 40 }, // Coluna B
            { wch: 20 }, // Coluna C
            { wch: 25 }, // Coluna D
            { wch: 30 }, // Coluna E
            { wch: 20 } // Coluna F
        ];

        // Logo (se disponível)
        try {
            if (this.config.logoEnabled && window.location.protocol !== "file:") {
                const logoImg = document.querySelector("img.logo");
                if (logoImg) {
                    // Adicionar logo
                    if (typeof this._adicionarLogo === "function") {
                        this._adicionarLogo(ws, logoImg, { s: { r: 2, c: 1 }, e: { r: 2, c: 5 } });
                    }
                }
            }
        } catch (e) {
            console.warn("Falha ao adicionar logo:", e);
        }

        return ws;
    },

    /**
     * Cria a planilha de memória de cálculo
     * @private
     * @param {Function} obterMemoriaCalculo - Função para obter a memória de cálculo
     * @returns {Object} Planilha de memória de cálculo
     */
    _criarPlanilhaMemoriaCalculo: function (obterMemoriaCalculo) {
        // Obter memória de cálculo
        let memoriaTexto = "";

        if (typeof obterMemoriaCalculo === "function") {
            try {
                memoriaTexto = obterMemoriaCalculo() || "";
            } catch (e) {
                console.warn("Erro ao obter memória de cálculo:", e);
                memoriaTexto = "Erro ao obter memória de cálculo: " + e.toString();
            }
        } else {
            memoriaTexto = "Função para obter memória de cálculo não fornecida.";
        }

        // Dados da planilha
        const memoriaData = [
            ["MEMÓRIA DE CÁLCULO"],
            ["Expertzy Inteligência Tributária"],
            ["Data do relatório:", this._formatarData(new Date())],
            [],
            ["Relatório detalhado dos cálculos realizados pelo simulador:"],
            []
        ];

        // Dividir a memória de cálculo em linhas
        const linhasMemoria = memoriaTexto.split("\n");

        // Adicionar as linhas à planilha
        linhasMemoria.forEach((linha) => {
            memoriaData.push([linha]);
        });

        // Adicionar rodapé
        memoriaData.push(
            [],
            ["© 2025 Expertzy Inteligência Tributária - Relatório gerado pelo Simulador de Split Payment"]
        );

        // Criar planilha
        const ws = XLSX.utils.aoa_to_sheet(memoriaData);

        // Aplicar estilos
        const estilos = [];

        // Título principal
        estilos.push({
            range: { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
            style: {
                font: { bold: true, sz: 18, color: { rgb: this.config.excel.colors.primary } },
                alignment: { horizontal: "center", vertical: "center" }
            }
        });

        // Subtítulo
        estilos.push({
            range: { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } },
            style: {
                font: { bold: true, sz: 14, color: { rgb: this.config.excel.colors.neutral } },
                alignment: { horizontal: "center", vertical: "center" }
            }
        });

        // Data do relatório
        estilos.push({
            range: { s: { r: 2, c: 0 }, e: { r: 2, c: 0 } },
            style: {
                font: { bold: true, sz: 11 },
                alignment: { horizontal: "right", vertical: "center" }
            }
        });

        // Texto introdutório
        estilos.push({
            range: { s: { r: 4, c: 0 }, e: { r: 4, c: 3 } },
            style: {
                font: { italic: true, sz: 11 },
                alignment: { horizontal: "left", vertical: "center" }
            }
        });

        // Memória de cálculo (fonte monospace)
        for (let r = 6; r < 6 + linhasMemoria.length; r++) {
            estilos.push({
                range: { s: { r: r, c: 0 }, e: { r: r, c: 0 } },
                style: {
                    font: { name: "Courier New", sz: 10 }
                }
            });
        }

        // Copyright
        const copyrightRow = 6 + linhasMemoria.length + 1;
        estilos.push({
            range: { s: { r: copyrightRow, c: 0 }, e: { r: copyrightRow, c: 3 } },
            style: {
                font: { italic: true, sz: 9, color: { rgb: this.config.excel.colors.neutral } },
                alignment: { horizontal: "center", vertical: "center" }
            }
        });

        // Mesclar células para títulos
        const mesclagens = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }, // Título principal
            { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } }, // Subtítulo
            { s: { r: 4, c: 0 }, e: { r: 4, c: 3 } }, // Texto introdutório
            { s: { r: copyrightRow, c: 0 }, e: { r: copyrightRow, c: 3 } } // Copyright
        ];

        // Adicionar mesclagens à planilha
        ws["!merges"] = mesclagens;

        // Aplicar largura personalizada para colunas
        ws["!cols"] = [
            { wch: 120 }, // Coluna A (bem larga para acomodar a memória de cálculo)
            { wch: 15 }, // Coluna B
            { wch: 15 }, // Coluna C
            { wch: 15 } // Coluna D
        ];

        // Logo (se disponível)
        try {
            if (this.config.logoEnabled && window.location.protocol !== "file:") {
                const logoImg = document.querySelector("img.logo");
                if (logoImg) {
                    // Adicionar logo
                    if (typeof this._adicionarLogo === "function") {
                        this._adicionarLogo(ws, logoImg, { s: { r: 2, c: 1 }, e: { r: 2, c: 3 } });
                    }
                }
            }
        } catch (e) {
            console.warn("Falha ao adicionar logo:", e);
        }

        return ws;
    },

    /**
     * Cria a planilha de dashboard
     * @private
     * @param {Object} resultados - Resultados da simulação
     * @param {Object} aliquotasEquivalentes - Alíquotas equivalentes calculadas
     * @returns {Object} Planilha de dashboard
     */
    _criarPlanilhaDashboard: function (resultados, aliquotasEquivalentes) {
        // Organizar anos
        const anos = Object.keys(resultados).sort();

        // Dados da planilha
        const dashboardData = [
            ["DASHBOARD - SPLIT PAYMENT"],
            ["Expertzy Inteligência Tributária"],
            ["Data do relatório:", this._formatarData(new Date())],
            [],
            ["1. INDICADORES-CHAVE DE DESEMPENHO (KPIs)"]
        ];

        // Calcular KPIs
        let variacaoTotal = 0;
        let variacaoPercentualMedia = 0;
        let mediaCreditos = 0;

        // Calcular valores
        anos.forEach((ano) => {
            const resultado = resultados[ano];
            // Verificação robusta para evitar erro
            const valorAtual =
                aliquotasEquivalentes[ano] && typeof aliquotasEquivalentes[ano].valor_atual !== "undefined"
                    ? aliquotasEquivalentes[ano].valor_atual
                    : 0;

            const diferenca = resultado.imposto_devido - valorAtual;
            const percentual = valorAtual !== 0 ? diferenca / valorAtual : 0;

            // Acumular para médias
            variacaoTotal += diferenca;
            variacaoPercentualMedia += percentual;
            mediaCreditos += resultado.creditos;
        });

        // Calcular médias
        const numAnos = anos.length;
        variacaoPercentualMedia = numAnos > 0 ? variacaoPercentualMedia / numAnos : 0;
        mediaCreditos = numAnos > 0 ? mediaCreditos / numAnos : 0;

        // Adicionar KPIs
        dashboardData.push(
            ["KPI", "Valor", "Status", "Variação"],
            ["Variação Total de Carga Tributária", variacaoTotal, variacaoTotal > 0 ? "NEGATIVO" : "POSITIVO", "-"],
            [
                "Variação Percentual Média",
                variacaoPercentualMedia,
                variacaoPercentualMedia > 0 ? "NEGATIVO" : "POSITIVO",
                "-"
            ],
            ["Aproveitamento Médio de Créditos", mediaCreditos, mediaCreditos > 0 ? "POSITIVO" : "NEUTRO", "-"],
            ["Implementação de Estratégias de Mitigação", "0%", "PENDENTE", "-"],
            [],
            ["2. EVOLUÇÃO ANUAL DE INDICADORES"]
        );

        // Cabeçalho da tabela de evolução
        dashboardData.push([
            "Ano",
            "Sistema Atual",
            "Split Payment",
            "Diferença",
            "Variação (%)",
            "Créditos",
            "Eficácia Mitigação (%)"
        ]);

        // Adicionar dados para cada ano
        anos.forEach((ano) => {
            const resultado = resultados[ano];
            // Verificação robusta para evitar erro
            const valorAtual =
                aliquotasEquivalentes[ano] && typeof aliquotasEquivalentes[ano].valor_atual !== "undefined"
                    ? aliquotasEquivalentes[ano].valor_atual
                    : 0;

            const diferenca = resultado.imposto_devido - valorAtual;
            const percentual = valorAtual !== 0 ? diferenca / valorAtual : 0;

            // Eficácia de mitigação (valor simulado - dependerá das estratégias adotadas)
            const eficaciaMitigacao = 0;

            dashboardData.push([
                parseInt(ano),
                valorAtual,
                resultado.imposto_devido,
                diferenca,
                percentual,
                resultado.creditos,
                eficaciaMitigacao
            ]);
        });

        dashboardData.push([]);

        // Seção 3 - Matriz de Impacto
        dashboardData.push(
            ["3. MATRIZ DE IMPACTO"],
            ["Categoria", "Impacto Baixo", "Impacto Médio", "Impacto Alto", "Impacto Crítico"]
        );

        // Adicionar categorias de impacto
        const categoriasImpacto = [
            ["Fluxo de Caixa", "Variação < 5%", "Variação 5-15%", "Variação 15-30%", "Variação > 30%"],
            ["Capital de Giro", "Redução < 5%", "Redução 5-15%", "Redução 15-30%", "Redução > 30%"],
            ["Margens", "Redução < 2%", "Redução 2-5%", "Redução 5-10%", "Redução > 10%"],
            ["Ciclo Financeiro", "Aumento < 5 dias", "Aumento 5-15 dias", "Aumento 15-30 dias", "Aumento > 30 dias"]
        ];

        // Adicionar categorias à planilha
        categoriasImpacto.forEach((categoria) => {
            dashboardData.push(categoria);
        });

        dashboardData.push([]);

        // Seção 4 - Análise de Sensibilidade
        dashboardData.push(["4. ANÁLISE DE SENSIBILIDADE"], ["Variável", "-30%", "-15%", "Base", "+15%", "+30%"]);

        // Valores base para análise de sensibilidade
        const valorBaseCarga = Math.abs(variacaoTotal);
        const valorBaseCreditos = mediaCreditos;

        // Adicionar análises de sensibilidade
        const analisesSensibilidade = [
            [
                "Carga Tributária",
                valorBaseCarga * 0.7,
                valorBaseCarga * 0.85,
                valorBaseCarga,
                valorBaseCarga * 1.15,
                valorBaseCarga * 1.3
            ],
            [
                "Aproveitamento de Créditos",
                valorBaseCreditos * 0.7,
                valorBaseCreditos * 0.85,
                valorBaseCreditos,
                valorBaseCreditos * 1.15,
                valorBaseCreditos * 1.3
            ],
            ["Ciclo Financeiro (dias)", 28, 34, 40, 46, 52]
        ];

        // Adicionar análises à planilha
        analisesSensibilidade.forEach((analise) => {
            dashboardData.push(analise);
        });

        dashboardData.push([]);

        // Seção 5 - Recomendações Prioritárias
        dashboardData.push(
            ["5. RECOMENDAÇÕES PRIORITÁRIAS"],
            ["Categoria", "Ação", "Prioridade", "Impacto Esperado", "Prazo"]
        );

        // Adicionar recomendações
        const recomendacoes = [
            [
                "Financeira",
                "Implementar programa de ajuste de preços",
                "ALTA",
                "Mitigação de 40-60% do impacto",
                "Imediato"
            ],
            [
                "Operacional",
                "Renegociar prazos com fornecedores",
                "ALTA",
                "Mitigação de 20-30% do impacto",
                "1-3 meses"
            ],
            [
                "Tributária",
                "Revisar estrutura de aproveitamento de créditos",
                "MÉDIA",
                "Mitigação de 10-20% do impacto",
                "3-6 meses"
            ],
            ["Financeira", "Estruturar linha de capital de giro", "MÉDIA", "Cobertura para transição", "1-3 meses"],
            [
                "Estratégica",
                "Revisar estrutura de recebimentos e pagamentos",
                "ALTA",
                "Redução do ciclo financeiro",
                "3-6 meses"
            ]
        ];

        // Adicionar recomendações à planilha
        recomendacoes.forEach((recomendacao) => {
            dashboardData.push(recomendacao);
        });

        dashboardData.push(
            [],
            ["© 2025 Expertzy Inteligência Tributária - Relatório gerado pelo Simulador de Split Payment"]
        );

        // Criar planilha
        const ws = XLSX.utils.aoa_to_sheet(dashboardData);

        // Aplicar estilos
        const estilos = [];

        // Título principal
        estilos.push({
            range: { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } },
            style: {
                font: { bold: true, sz: 18, color: { rgb: this.config.excel.colors.primary } },
                alignment: { horizontal: "center", vertical: "center" }
            }
        });

        // Subtítulo
        estilos.push({
            range: { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } },
            style: {
                font: { bold: true, sz: 14, color: { rgb: this.config.excel.colors.neutral } },
                alignment: { horizontal: "center", vertical: "center" }
            }
        });

        // Data do relatório
        estilos.push({
            range: { s: { r: 2, c: 0 }, e: { r: 2, c: 0 } },
            style: {
                font: { bold: true, sz: 11 },
                alignment: { horizontal: "right", vertical: "center" }
            }
        });

        // Títulos de seções
        const titulosSecoes = [4, 11, 13 + anos.length, 20 + anos.length, 26 + anos.length];

        for (const row of titulosSecoes) {
            estilos.push({
                range: { s: { r: row, c: 0 }, e: { r: row, c: 6 } },
                style: {
                    font: { bold: true, sz: 14, color: { rgb: this.config.excel.colors.primary } },
                    fill: { fgColor: { rgb: this.config.excel.colors.headerBg } },
                    alignment: { horizontal: "left", vertical: "center" },
                    border: {
                        bottom: { style: "medium", color: { rgb: this.config.excel.colors.primary } }
                    }
                }
            });
        }

        // Cabeçalhos de tabelas
        const cabecalhosTabelas = [5, 12, 14 + anos.length, 21 + anos.length, 27 + anos.length];

        for (const row of cabecalhosTabelas) {
            const numCols =
                row === 5 ? 3 : row === 12 ? 6 : row === 14 + anos.length ? 4 : row === 21 + anos.length ? 5 : 4;

            estilos.push({
                range: { s: { r: row, c: 0 }, e: { r: row, c: numCols } },
                style: {
                    font: { bold: true, sz: 11, color: { rgb: "FFFFFF" } },
                    fill: { fgColor: { rgb: this.config.excel.colors.primary } },
                    alignment: { horizontal: "center", vertical: "center" },
                    border: {
                        top: { style: "thin", color: { rgb: "000000" } },
                        bottom: { style: "thin", color: { rgb: "000000" } },
                        left: { style: "thin", color: { rgb: "000000" } },
                        right: { style: "thin", color: { rgb: "000000" } }
                    }
                }
            });
        }

        // Formatar KPIs
        for (let r = 6; r <= 9; r++) {
            // Status colorido
            const statusCell = dashboardData[r][2];
            if (statusCell === "POSITIVO") {
                estilos.push({
                    range: { s: { r: r, c: 2 }, e: { r: r, c: 2 } },
                    style: {
                        font: { color: { rgb: "009900" }, bold: true }
                    }
                });
            } else if (statusCell === "NEGATIVO") {
                estilos.push({
                    range: { s: { r: r, c: 2 }, e: { r: r, c: 2 } },
                    style: {
                        font: { color: { rgb: "CC0000" }, bold: true }
                    }
                });
            } else if (statusCell === "NEUTRO") {
                estilos.push({
                    range: { s: { r: r, c: 2 }, e: { r: r, c: 2 } },
                    style: {
                        font: { color: { rgb: "666666" }, bold: true }
                    }
                });
            } else if (statusCell === "PENDENTE") {
                estilos.push({
                    range: { s: { r: r, c: 2 }, e: { r: r, c: 2 } },
                    style: {
                        font: { color: { rgb: "FF9900" }, bold: true }
                    }
                });
            }

            // Formatação de valores
            if (r === 6) {
                // Variação Total
                estilos.push({
                    range: { s: { r: r, c: 1 }, e: { r: r, c: 1 } },
                    style: {
                        numFmt: "#,##0.00"
                    }
                });
            } else if (r === 7) {
                // Variação Percentual
                estilos.push({
                    range: { s: { r: r, c: 1 }, e: { r: r, c: 1 } },
                    style: {
                        numFmt: "0.00%"
                    }
                });
            } else if (r === 8) {
                // Aproveitamento Créditos
                estilos.push({
                    range: { s: { r: r, c: 1 }, e: { r: r, c: 1 } },
                    style: {
                        numFmt: "#,##0.00"
                    }
                });
            } else if (r === 9) {
                // Implementação Estratégias
                estilos.push({
                    range: { s: { r: r, c: 1 }, e: { r: r, c: 1 } },
                    style: {
                        numFmt: "0%"
                    }
                });
            }

            // Alternar cores de fundo
            if (r % 2 === 0) {
                estilos.push({
                    range: { s: { r: r, c: 0 }, e: { r: r, c: 3 } },
                    style: {
                        fill: { fgColor: { rgb: this.config.excel.colors.lightBg1 } }
                    }
                });
            }
        }

        // Formatar tabela de evolução anual
        for (let r = 13; r < 13 + anos.length; r++) {
            // Formatar valores monetários
            for (let c = 1; c <= 3; c++) {
                estilos.push({
                    range: { s: { r: r, c: c }, e: { r: r, c: c } },
                    style: {
                        numFmt: "#,##0.00"
                    }
                });
            }

            // Formatar percentuais
            estilos.push({
                range: { s: { r: r, c: 4 }, e: { r: r, c: 4 } },
                style: {
                    numFmt: "0.00%"
                }
            });

            estilos.push({
                range: { s: { r: r, c: 6 }, e: { r: r, c: 6 } },
                style: {
                    numFmt: "0.00%"
                }
            });

            // Formatar créditos
            estilos.push({
                range: { s: { r: r, c: 5 }, e: { r: r, c: 5 } },
                style: {
                    numFmt: "#,##0.00"
                }
            });

            // Alternar cores de fundo
            if ((r - 13) % 2 === 0) {
                estilos.push({
                    range: { s: { r: r, c: 0 }, e: { r: r, c: 6 } },
                    style: {
                        fill: { fgColor: { rgb: this.config.excel.colors.lightBg1 } }
                    }
                });
            }
        }

        // Formatar matriz de impacto
        for (let r = 15 + anos.length; r < 15 + anos.length + categoriasImpacto.length; r++) {
            // Colorir impactos
            estilos.push({
                range: { s: { r: r, c: 1 }, e: { r: r, c: 1 } },
                style: {
                    fill: { fgColor: { rgb: "66CC66" } }, // Verde
                    font: { bold: true }
                }
            });

            estilos.push({
                range: { s: { r: r, c: 2 }, e: { r: r, c: 2 } },
                style: {
                    fill: { fgColor: { rgb: "FFCC66" } }, // Amarelo
                    font: { bold: true }
                }
            });

            estilos.push({
                range: { s: { r: r, c: 3 }, e: { r: r, c: 3 } },
                style: {
                    fill: { fgColor: { rgb: "FF9966" } }, // Laranja
                    font: { bold: true }
                }
            });

            estilos.push({
                range: { s: { r: r, c: 4 }, e: { r: r, c: 4 } },
                style: {
                    fill: { fgColor: { rgb: "FF6666" } }, // Vermelho
                    font: { bold: true }
                }
            });

            // Destacar categoria
            estilos.push({
                range: { s: { r: r, c: 0 }, e: { r: r, c: 0 } },
                style: {
                    font: { bold: true },
                    fill: { fgColor: { rgb: this.config.excel.colors.lightBg1 } }
                }
            });
        }

        // Formatar análise de sensibilidade
        for (let r = 22 + anos.length; r < 22 + anos.length + analisesSensibilidade.length; r++) {
            // Formatar valores monetários para as duas primeiras linhas
            if (r < 24 + anos.length) {
                for (let c = 1; c <= 5; c++) {
                    estilos.push({
                        range: { s: { r: r, c: c }, e: { r: r, c: c } },
                        style: {
                            numFmt: "#,##0.00"
                        }
                    });
                }
            }

            // Destacar categoria
            estilos.push({
                range: { s: { r: r, c: 0 }, e: { r: r, c: 0 } },
                style: {
                    font: { bold: true },
                    fill: { fgColor: { rgb: this.config.excel.colors.lightBg1 } }
                }
            });

            // Destacar valor base
            estilos.push({
                range: { s: { r: r, c: 3 }, e: { r: r, c: 3 } },
                style: {
                    font: { bold: true },
                    fill: { fgColor: { rgb: "DDDDDD" } }
                }
            });
        }

        // Formatar recomendações prioritárias
        for (let r = 28 + anos.length; r < 28 + anos.length + recomendacoes.length; r++) {
            // Colorir prioridades
            const prioridade = dashboardData[r][2];
            if (prioridade === "ALTA") {
                estilos.push({
                    range: { s: { r: r, c: 2 }, e: { r: r, c: 2 } },
                    style: {
                        font: { color: { rgb: "CC0000" }, bold: true }
                    }
                });
            } else if (prioridade === "MÉDIA") {
                estilos.push({
                    range: { s: { r: r, c: 2 }, e: { r: r, c: 2 } },
                    style: {
                        font: { color: { rgb: "FF9900" }, bold: true }
                    }
                });
            } else if (prioridade === "BAIXA") {
                estilos.push({
                    range: { s: { r: r, c: 2 }, e: { r: r, c: 2 } },
                    style: {
                        font: { color: { rgb: "009900" }, bold: true }
                    }
                });
            }

            // Alternar cores de fundo
            if ((r - (28 + anos.length)) % 2 === 0) {
                estilos.push({
                    range: { s: { r: r, c: 0 }, e: { r: r, c: 4 } },
                    style: {
                        fill: { fgColor: { rgb: this.config.excel.colors.lightBg1 } }
                    }
                });
            }
        }

        // Copyright
        const copyrightRow = 28 + anos.length + recomendacoes.length + 2;
        estilos.push({
            range: { s: { r: copyrightRow, c: 0 }, e: { r: copyrightRow, c: 6 } },
            style: {
                font: { italic: true, sz: 9, color: { rgb: this.config.excel.colors.neutral } },
                alignment: { horizontal: "center", vertical: "center" }
            }
        });

        // Mesclar células para títulos
        const mesclagens = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }, // Título principal
            { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } }, // Subtítulo
            { s: { r: 4, c: 0 }, e: { r: 4, c: 6 } }, // 1. INDICADORES-CHAVE DE DESEMPENHO (KPIs)
            { s: { r: 11, c: 0 }, e: { r: 11, c: 6 } }, // 2. EVOLUÇÃO ANUAL DE INDICADORES
            { s: { r: 13 + anos.length, c: 0 }, e: { r: 13 + anos.length, c: 6 } }, // 3. MATRIZ DE IMPACTO
            { s: { r: 20 + anos.length, c: 0 }, e: { r: 20 + anos.length, c: 6 } }, // 4. ANÁLISE DE SENSIBILIDADE
            { s: { r: 26 + anos.length, c: 0 }, e: { r: 26 + anos.length, c: 6 } }, // 5. RECOMENDAÇÕES PRIORITÁRIAS
            { s: { r: copyrightRow, c: 0 }, e: { r: copyrightRow, c: 6 } } // Copyright
        ];

        // Adicionar mesclagens à planilha
        ws["!merges"] = mesclagens;

        // Aplicar largura personalizada para colunas
        ws["!cols"] = [
            { wch: 25 }, // Coluna A
            { wch: 25 }, // Coluna B
            { wch: 15 }, // Coluna C
            { wch: 25 }, // Coluna D
            { wch: 15 }, // Coluna E
            { wch: 15 }, // Coluna F
            { wch: 15 } // Coluna G
        ];

        // Logo (se disponível)
        try {
            if (this.config.logoEnabled && window.location.protocol !== "file:") {
                const logoImg = document.querySelector("img.logo");
                if (logoImg) {
                    // Adicionar logo
                    if (typeof this._adicionarLogo === "function") {
                        this._adicionarLogo(ws, logoImg, { s: { r: 2, c: 1 }, e: { r: 2, c: 6 } });
                    }
                }
            }
        } catch (e) {
            console.warn("Falha ao adicionar logo:", e);
        }

        return ws;
    },

    /**
     * Cria a planilha de alíquotas
     * @private
     * @param {Object} configuracao - Configuração do simulador
     * @returns {Object} Planilha de alíquotas
     */
    _criarPlanilhaAliquotas: function (configuracao) {
        // Dados da planilha
        const aliquotasData = [
            ["ALÍQUOTAS E CONFIGURAÇÕES TRIBUTÁRIAS"],
            ["Expertzy Inteligência Tributária"],
            ["Data do relatório:", this._formatarData(new Date())],
            [],
            ["1. ALÍQUOTAS BASE DO IVA DUAL"]
        ];

        // Adicionar alíquotas base
        aliquotasData.push(
            ["Imposto", "Alíquota", "Observações"],
            ["CBS (Federal)", configuracao.aliquotas_base.CBS, "Contribuição sobre Bens e Serviços (Federal)"],
            [
                "IBS (Estadual/Municipal)",
                configuracao.aliquotas_base.IBS,
                "Imposto sobre Bens e Serviços (Estadual e Municipal)"
            ],
            ["Total", configuracao.aliquotas_base.CBS + configuracao.aliquotas_base.IBS, "Alíquota total do IVA Dual"],
            []
        );

        // Seção 2 - Alíquotas Setoriais
        aliquotasData.push(
            ["2. ALÍQUOTAS SETORIAIS"],
            ["Setor", "IBS", "Redução CBS", "CBS Efetivo", "Alíquota Total"]
        );

        // Adicionar dados setoriais
        for (const [setor, valores] of Object.entries(configuracao.setores_especiais)) {
            const cbsEfetivo = configuracao.aliquotas_base.CBS * (1 - valores.reducao_CBS);
            const total = valores.IBS + cbsEfetivo;

            aliquotasData.push([
                this._capitalizarPrimeiraLetra(setor),
                valores.IBS,
                valores.reducao_CBS,
                cbsEfetivo,
                total
            ]);
        }

        aliquotasData.push([]);

        // Seção 3 - Regras de Crédito
        aliquotasData.push(
            ["3. REGRAS DE APROVEITAMENTO DE CRÉDITOS"],
            ["Tipo de Operação", "Percentual de Aproveitamento", "Observações"]
        );

        // Adicionar regras de crédito
        const regrasCredito = [
            ["Operações Normais", configuracao.regras_credito.normal, "Crédito integral para operações regulares"],
            [
                "Fornecedores do Simples Nacional",
                configuracao.regras_credito.simples,
                "Limitado a 20% do valor da compra"
            ],
            [
                "Produtores Rurais (CBS)",
                configuracao.regras_credito.rural,
                "Limitado a 60% para a CBS, integral para IBS"
            ],
            ["Importações (CBS)", configuracao.regras_credito.importacoes.CBS, "Limitado a 50% para CBS"],
            ["Importações (IBS)", configuracao.regras_credito.importacoes.IBS, "Crédito integral para IBS"]
        ];

        regrasCredito.forEach((regra) => {
            aliquotasData.push(regra);
        });

        aliquotasData.push([]);

        // Seção 4 - Produtos com Alíquota Zero
        aliquotasData.push(["4. PRODUTOS COM ALÍQUOTA ZERO"], ["Produto", "Fundamentação Legal"]);

        // Adicionar produtos com alíquota zero
        configuracao.produtos_aliquota_zero.forEach((produto) => {
            aliquotasData.push([produto, "Anexos I e XV - LC 214/2025"]);
        });

        aliquotasData.push([]);

        // Seção 5 - Outras Configurações
        aliquotasData.push(["5. OUTRAS CONFIGURAÇÕES TRIBUTÁRIAS"], ["Parâmetro", "Valor", "Observações"]);

        // Adicionar outras configurações
        const outrasConfiguracoes = [
            [
                "Limite Simples Nacional",
                configuracao.limite_simples,
                "Limite anual de faturamento para enquadramento no Simples"
            ],
            ["Prazo de Recolhimento Atual", 45, "Prazo médio estimado para recolhimento no sistema atual (dias)"],
            ["Prazo de Recolhimento Split Payment", 0, "Recolhimento instantâneo no sistema de Split Payment"]
        ];

        outrasConfiguracoes.forEach((config) => {
            aliquotasData.push(config);
        });

        aliquotasData.push(
            [],
            ["© 2025 Expertzy Inteligência Tributária - Relatório gerado pelo Simulador de Split Payment"]
        );

        // Criar planilha
        const ws = XLSX.utils.aoa_to_sheet(aliquotasData);

        // Aplicar estilos
        const estilos = [];

        // Título principal
        estilos.push({
            range: { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
            style: {
                font: { bold: true, sz: 18, color: { rgb: this.config.excel.colors.primary } },
                alignment: { horizontal: "center", vertical: "center" }
            }
        });

        // Subtítulo
        estilos.push({
            range: { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } },
            style: {
                font: { bold: true, sz: 14, color: { rgb: this.config.excel.colors.neutral } },
                alignment: { horizontal: "center", vertical: "center" }
            }
        });

        // Data do relatório
        estilos.push({
            range: { s: { r: 2, c: 0 }, e: { r: 2, c: 0 } },
            style: {
                font: { bold: true, sz: 11 },
                alignment: { horizontal: "right", vertical: "center" }
            }
        });

        // Títulos de seções
        const titulosSecoes = [
            4,
            10,
            19 + Object.keys(configuracao.setores_especiais).length,
            28 + Object.keys(configuracao.setores_especiais).length + regrasCredito.length,
            31 +
                Object.keys(configuracao.setores_especiais).length +
                regrasCredito.length +
                configuracao.produtos_aliquota_zero.length
        ];

        for (const row of titulosSecoes) {
            estilos.push({
                range: { s: { r: row, c: 0 }, e: { r: row, c: 4 } },
                style: {
                    font: { bold: true, sz: 14, color: { rgb: this.config.excel.colors.primary } },
                    fill: { fgColor: { rgb: this.config.excel.colors.headerBg } },
                    alignment: { horizontal: "left", vertical: "center" },
                    border: {
                        bottom: { style: "medium", color: { rgb: this.config.excel.colors.primary } }
                    }
                }
            });
        }

        // Cabeçalhos de tabelas
        const cabecalhosTabelas = [
            5,
            11,
            20 + Object.keys(configuracao.setores_especiais).length,
            29 + Object.keys(configuracao.setores_especiais).length + regrasCredito.length,
            32 +
                Object.keys(configuracao.setores_especiais).length +
                regrasCredito.length +
                configuracao.produtos_aliquota_zero.length
        ];

        for (const row of cabecalhosTabelas) {
            const numCols =
                row === 5
                    ? 2
                    : row === 11
                      ? 4
                      : row === 29 + Object.keys(configuracao.setores_especiais).length + regrasCredito.length
                        ? 1
                        : 2;

            estilos.push({
                range: { s: { r: row, c: 0 }, e: { r: row, c: numCols } },
                style: {
                    font: { bold: true, sz: 11, color: { rgb: "FFFFFF" } },
                    fill: { fgColor: { rgb: this.config.excel.colors.primary } },
                    alignment: { horizontal: "center", vertical: "center" },
                    border: {
                        top: { style: "thin", color: { rgb: "000000" } },
                        bottom: { style: "thin", color: { rgb: "000000" } },
                        left: { style: "thin", color: { rgb: "000000" } },
                        right: { style: "thin", color: { rgb: "000000" } }
                    }
                }
            });
        }

        // Formatar alíquotas base
        for (let r = 6; r <= 8; r++) {
            // Formatar percentuais
            estilos.push({
                range: { s: { r: r, c: 1 }, e: { r: r, c: 1 } },
                style: {
                    numFmt: "0.00%"
                }
            });

            // Alternar cores de fundo
            if (r % 2 === 0) {
                estilos.push({
                    range: { s: { r: r, c: 0 }, e: { r: r, c: 2 } },
                    style: {
                        fill: { fgColor: { rgb: this.config.excel.colors.lightBg1 } }
                    }
                });
            }
        }

        // Formatar alíquotas setoriais
        for (let r = 12; r < 12 + Object.keys(configuracao.setores_especiais).length; r++) {
            // Formatar percentuais
            for (let c = 1; c <= 4; c++) {
                estilos.push({
                    range: { s: { r: r, c: c }, e: { r: r, c: c } },
                    style: {
                        numFmt: "0.00%"
                    }
                });
            }

            // Alternar cores de fundo
            if ((r - 12) % 2 === 0) {
                estilos.push({
                    range: { s: { r: r, c: 0 }, e: { r: r, c: 4 } },
                    style: {
                        fill: { fgColor: { rgb: this.config.excel.colors.lightBg1 } }
                    }
                });
            }
        }

        // Formatar regras de crédito
        for (
            let r = 21 + Object.keys(configuracao.setores_especiais).length;
            r < 21 + Object.keys(configuracao.setores_especiais).length + regrasCredito.length;
            r++
        ) {
            // Formatar percentuais
            estilos.push({
                range: { s: { r: r, c: 1 }, e: { r: r, c: 1 } },
                style: {
                    numFmt: "0.00%"
                }
            });

            // Alternar cores de fundo
            if ((r - (21 + Object.keys(configuracao.setores_especiais).length)) % 2 === 0) {
                estilos.push({
                    range: { s: { r: r, c: 0 }, e: { r: r, c: 2 } },
                    style: {
                        fill: { fgColor: { rgb: this.config.excel.colors.lightBg1 } }
                    }
                });
            }
        }

        // Formatar produtos com alíquota zero
        for (
            let r = 30 + Object.keys(configuracao.setores_especiais).length + regrasCredito.length;
            r <
            30 +
                Object.keys(configuracao.setores_especiais).length +
                regrasCredito.length +
                configuracao.produtos_aliquota_zero.length;
            r++
        ) {
            // Alternar cores de fundo
            if ((r - (30 + Object.keys(configuracao.setores_especiais).length + regrasCredito.length)) % 2 === 0) {
                estilos.push({
                    range: { s: { r: r, c: 0 }, e: { r: r, c: 1 } },
                    style: {
                        fill: { fgColor: { rgb: this.config.excel.colors.lightBg1 } }
                    }
                });
            }
        }

        // Formatar outras configurações
        for (
            let r =
                33 +
                Object.keys(configuracao.setores_especiais).length +
                regrasCredito.length +
                configuracao.produtos_aliquota_zero.length;
            r <
            33 +
                Object.keys(configuracao.setores_especiais).length +
                regrasCredito.length +
                configuracao.produtos_aliquota_zero.length +
                outrasConfiguracoes.length;
            r++
        ) {
            // Formatar valores
            if (
                r ===
                33 +
                    Object.keys(configuracao.setores_especiais).length +
                    regrasCredito.length +
                    configuracao.produtos_aliquota_zero.length
            ) {
                // Limite Simples Nacional (valor monetário)
                estilos.push({
                    range: { s: { r: r, c: 1 }, e: { r: r, c: 1 } },
                    style: {
                        numFmt: "#,##0.00"
                    }
                });
            } else {
                // Prazos (valores inteiros)
                estilos.push({
                    range: { s: { r: r, c: 1 }, e: { r: r, c: 1 } },
                    style: {
                        numFmt: "0"
                    }
                });
            }

            // Alternar cores de fundo
            if (
                (r -
                    (33 +
                        Object.keys(configuracao.setores_especiais).length +
                        regrasCredito.length +
                        configuracao.produtos_aliquota_zero.length)) %
                    2 ===
                0
            ) {
                estilos.push({
                    range: { s: { r: r, c: 0 }, e: { r: r, c: 2 } },
                    style: {
                        fill: { fgColor: { rgb: this.config.excel.colors.lightBg1 } }
                    }
                });
            }
        }

        // Copyright
        const copyrightRow =
            35 +
            Object.keys(configuracao.setores_especiais).length +
            regrasCredito.length +
            configuracao.produtos_aliquota_zero.length +
            outrasConfiguracoes.length;
        estilos.push({
            range: { s: { r: copyrightRow, c: 0 }, e: { r: copyrightRow, c: 4 } },
            style: {
                font: { italic: true, sz: 9, color: { rgb: this.config.excel.colors.neutral } },
                alignment: { horizontal: "center", vertical: "center" }
            }
        });

        // Mesclar células para títulos
        const mesclagens = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }, // Título principal
            { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } }, // Subtítulo
            { s: { r: 4, c: 0 }, e: { r: 4, c: 4 } }, // 1. ALÍQUOTAS BASE DO IVA DUAL
            { s: { r: 10, c: 0 }, e: { r: 10, c: 4 } }, // 2. ALÍQUOTAS SETORIAIS
            {
                s: { r: 19 + Object.keys(configuracao.setores_especiais).length, c: 0 },
                e: { r: 19 + Object.keys(configuracao.setores_especiais).length, c: 4 }
            }, // 3. REGRAS DE APROVEITAMENTO DE CRÉDITOS
            {
                s: { r: 28 + Object.keys(configuracao.setores_especiais).length + regrasCredito.length, c: 0 },
                e: { r: 28 + Object.keys(configuracao.setores_especiais).length + regrasCredito.length, c: 4 }
            }, // 4. PRODUTOS COM ALÍQUOTA ZERO
            {
                s: {
                    r:
                        31 +
                        Object.keys(configuracao.setores_especiais).length +
                        regrasCredito.length +
                        configuracao.produtos_aliquota_zero.length,
                    c: 0
                },
                e: {
                    r:
                        31 +
                        Object.keys(configuracao.setores_especiais).length +
                        regrasCredito.length +
                        configuracao.produtos_aliquota_zero.length,
                    c: 4
                }
            }, // 5. OUTRAS CONFIGURAÇÕES TRIBUTÁRIAS
            { s: { r: copyrightRow, c: 0 }, e: { r: copyrightRow, c: 4 } } // Copyright
        ];

        // Adicionar mesclagens à planilha
        ws["!merges"] = mesclagens;

        // Aplicar largura personalizada para colunas
        ws["!cols"] = [
            { wch: 30 }, // Coluna A
            { wch: 25 }, // Coluna B
            { wch: 25 }, // Coluna C
            { wch: 25 }, // Coluna D
            { wch: 25 } // Coluna E
        ];

        // Logo (se disponível)
        try {
            if (this.config.logoEnabled && window.location.protocol !== "file:") {
                const logoImg = document.querySelector("img.logo");
                if (logoImg) {
                    // Adicionar logo
                    if (typeof this._adicionarLogo === "function") {
                        this._adicionarLogo(ws, logoImg, { s: { r: 2, c: 1 }, e: { r: 2, c: 4 } });
                    }
                }
            }
        } catch (e) {
            console.warn("Falha ao adicionar logo:", e);
        }

        return ws;
    },

    _criarPlanilhaFasesTransicao: function (configuracao) {
        // Dados da planilha
        const fasesData = [
            ["FASES DE TRANSIÇÃO - SPLIT PAYMENT"],
            ["Expertzy Inteligência Tributária"],
            ["Data do relatório:", this._formatarData(new Date())],
            [],
            ["1. CRONOGRAMA DE IMPLEMENTAÇÃO (2026-2033)"]
        ];

        // Adicionar cabeçalho da tabela de fases
        fasesData.push(["Ano", "Percentual de Implementação", "Observações"]);

        // Adicionar dados das fases
        for (const [ano, percentual] of Object.entries(configuracao.fase_transicao)) {
            let observacao = "";
            if (ano === "2026") observacao = "Início da transição - Teste operacional";
            else if (ano === "2029") observacao = "Metade da transição - 60% implementado";
            else if (ano === "2033") observacao = "Implementação completa";

            fasesData.push([parseInt(ano), percentual, observacao]);
        }

        fasesData.push([]);

        // Seção 2 - Redução de Impostos Atuais
        fasesData.push(["2. REDUÇÃO PROGRESSIVA DOS IMPOSTOS ATUAIS"]);

        // Adicionar cabeçalho da tabela de redução
        fasesData.push(["Ano", "PIS/COFINS", "IPI", "ICMS", "ISS", "Observações"]);

        // Adicionar dados de redução
        for (const [ano, reducoes] of Object.entries(configuracao.reducao_impostos_transicao)) {
            let observacao = "";
            if (ano === "2026") observacao = "Nenhuma redução inicial";
            else if (ano === "2027") observacao = "Extinção do PIS/COFINS";
            else if (ano === "2033") observacao = "Extinção completa dos tributos atuais";

            fasesData.push([parseInt(ano), reducoes.PIS, reducoes.IPI, reducoes.ICMS, reducoes.ISS, observacao]);
        }

        fasesData.push([]);

        // Seção 3 - Créditos Cruzados
        fasesData.push(["3. SISTEMA DE CRÉDITOS CRUZADOS"]);

        // Adicionar cabeçalho da tabela de créditos cruzados
        fasesData.push(["Ano", "IBS para ICMS", "Observações"]);

        // Adicionar dados de créditos cruzados
        const anosCreditosCruzados = [2028, 2029, 2030, 2031, 2032];

        for (const ano of anosCreditosCruzados) {
            let percentual = 0;
            let observacao = "";

            if (configuracao.creditos_cruzados[ano]) {
                percentual = configuracao.creditos_cruzados[ano].IBS_para_ICMS || 0;

                if (ano === 2028) observacao = "Início do sistema de créditos cruzados";
                else if (ano === 2032) observacao = "Último ano antes da extinção total dos tributos atuais";
            }

            fasesData.push([ano, percentual, observacao]);
        }

        fasesData.push([]);

        // Seção 4 - Impactos Esperados
        fasesData.push(["4. IMPACTOS ESPERADOS DURANTE A TRANSIÇÃO"]);

        // Adicionar cabeçalho da tabela de impactos
        fasesData.push(["Fase", "Período", "Impactos no Fluxo de Caixa", "Impactos Operacionais", "Recomendações"]);

        // Adicionar dados de impactos
        const impactos = [
            [
                "Fase Inicial",
                "2026-2027",
                "Impacto limitado (10-25%)",
                "Adaptação aos novos sistemas e processos",
                "Mapeamento de mudanças e preparação de sistemas"
            ],
            [
                "Fase Intermediária",
                "2028-2030",
                "Impacto moderado (40-80%)",
                "Convivência de sistemas, complexidade operacional aumentada",
                "Implementação de estratégias de mitigação e ajustes operacionais"
            ],
            [
                "Fase Final",
                "2031-2033",
                "Impacto completo (90-100%)",
                "Migração final para o novo sistema",
                "Adaptação completa e otimização de processos"
            ]
        ];

        impactos.forEach((impacto) => {
            fasesData.push(impacto);
        });

        fasesData.push([]);

        // Adicionar considerações finais
        fasesData.push(
            ["5. CONSIDERAÇÕES SOBRE O PROCESSO DE TRANSIÇÃO"],
            [
                "Durante o período de transição, é essencial que as empresas monitorem continuamente o impacto do Split Payment " +
                    "no fluxo de caixa, ajustando as estratégias de mitigação conforme necessário. A implementação gradual permite " +
                    "que as organizações testem diferentes abordagens e identifiquem as mais eficazes para seu setor e perfil específico."
            ],
            [],
            [
                "Recomenda-se acompanhar também as possíveis atualizações na legislação e regulamentação, que podem trazer ajustes " +
                    "ao cronograma de implementação ou às regras de operação do sistema de Split Payment. A preparação adequada durante " +
                    "as fases iniciais pode mitigar significativamente os impactos nas fases mais avançadas da transição."
            ],
            [],
            ["© 2025 Expertzy Inteligência Tributária - Relatório gerado pelo Simulador de Split Payment"]
        );

        // Criar planilha
        const ws = XLSX.utils.aoa_to_sheet(fasesData);

        // Aplicar estilos
        const estilos = [];

        // Título principal
        estilos.push({
            range: { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
            style: {
                font: { bold: true, sz: 18, color: { rgb: this.config.excel.colors.primary } },
                alignment: { horizontal: "center", vertical: "center" }
            }
        });

        // Subtítulo
        estilos.push({
            range: { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } },
            style: {
                font: { bold: true, sz: 14, color: { rgb: this.config.excel.colors.neutral } },
                alignment: { horizontal: "center", vertical: "center" }
            }
        });

        // Data do relatório
        estilos.push({
            range: { s: { r: 2, c: 0 }, e: { r: 2, c: 0 } },
            style: {
                font: { bold: true, sz: 11 },
                alignment: { horizontal: "right", vertical: "center" }
            }
        });

        // Títulos de seções
        const titulosSecoes = [4, 14, 25, 33, 40];

        for (const row of titulosSecoes) {
            estilos.push({
                range: { s: { r: row, c: 0 }, e: { r: row, c: 4 } },
                style: {
                    font: { bold: true, sz: 14, color: { rgb: this.config.excel.colors.primary } },
                    fill: { fgColor: { rgb: this.config.excel.colors.headerBg } },
                    alignment: { horizontal: "left", vertical: "center" },
                    border: {
                        bottom: { style: "medium", color: { rgb: this.config.excel.colors.primary } }
                    }
                }
            });
        }

        // Cabeçalhos de tabelas
        const cabecalhosTabelas = [5, 15, 26, 34];

        for (const row of cabecalhosTabelas) {
            const numCols = row === 5 ? 2 : row === 15 ? 4 : row === 26 ? 1 : 4;

            estilos.push({
                range: { s: { r: row, c: 0 }, e: { r: row, c: numCols } },
                style: {
                    font: { bold: true, sz: 11, color: { rgb: "FFFFFF" } },
                    fill: { fgColor: { rgb: this.config.excel.colors.primary } },
                    alignment: { horizontal: "center", vertical: "center" },
                    border: {
                        top: { style: "thin", color: { rgb: "000000" } },
                        bottom: { style: "thin", color: { rgb: "000000" } },
                        left: { style: "thin", color: { rgb: "000000" } },
                        right: { style: "thin", color: { rgb: "000000" } }
                    }
                }
            });
        }

        // Formatar tabela de fases
        for (let r = 6; r < 6 + Object.keys(configuracao.fase_transicao).length; r++) {
            // Formatar percentuais
            estilos.push({
                range: { s: { r: r, c: 1 }, e: { r: r, c: 1 } },
                style: {
                    numFmt: "0.00%"
                }
            });

            // Alternar cores de fundo
            if ((r - 6) % 2 === 0) {
                estilos.push({
                    range: { s: { r: r, c: 0 }, e: { r: r, c: 2 } },
                    style: {
                        fill: { fgColor: { rgb: this.config.excel.colors.lightBg1 } }
                    }
                });
            }
        }

        // Formatar tabela de redução
        for (let r = 16; r < 16 + Object.keys(configuracao.reducao_impostos_transicao).length; r++) {
            // Formatar percentuais
            for (let c = 1; c <= 4; c++) {
                estilos.push({
                    range: { s: { r: r, c: c }, e: { r: r, c: c } },
                    style: {
                        numFmt: "0.00%"
                    }
                });
            }

            // Alternar cores de fundo
            if ((r - 16) % 2 === 0) {
                estilos.push({
                    range: { s: { r: r, c: 0 }, e: { r: r, c: 4 } },
                    style: {
                        fill: { fgColor: { rgb: this.config.excel.colors.lightBg1 } }
                    }
                });
            }

            // Formatar tabela de créditos cruzados
            for (let r = 27; r < 27 + anosCreditosCruzados.length; r++) {
                // Formatar percentuais
                estilos.push({
                    range: { s: { r: r, c: 1 }, e: { r: r, c: 1 } },
                    style: {
                        numFmt: "0.00%"
                    }
                });

                // Alternar cores de fundo
                if ((r - 27) % 2 === 0) {
                    estilos.push({
                        range: { s: { r: r, c: 0 }, e: { r: r, c: 2 } },
                        style: {
                            fill: { fgColor: { rgb: this.config.excel.colors.lightBg1 } }
                        }
                    });

                    // Formatar texto de considerações
                    for (let r = 41; r <= 45; r += 2) {
                        if (r <= 44) {
                            estilos.push({
                                range: { s: { r: r, c: 0 }, e: { r: r, c: 4 } },
                                style: {
                                    alignment: { wrapText: true }
                                }
                            });
                        }
                    }

                    // Copyright
                    const copyrightRow = 45;
                    estilos.push({
                        range: { s: { r: copyrightRow, c: 0 }, e: { r: copyrightRow, c: 4 } },
                        style: {
                            font: { italic: true, sz: 9, color: { rgb: this.config.excel.colors.neutral } },
                            alignment: { horizontal: "center", vertical: "center" }
                        }
                    });

                    // Mesclar células para títulos e textos longos
                    const mesclagens = [
                        { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
                        { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } },
                        { s: { r: 4, c: 0 }, e: { r: 4, c: 4 } },
                        { s: { r: 14, c: 0 }, e: { r: 14, c: 4 } },
                        { s: { r: 25, c: 0 }, e: { r: 25, c: 4 } },
                        { s: { r: 33, c: 0 }, e: { r: 33, c: 4 } },
                        { s: { r: 40, c: 0 }, e: { r: 40, c: 4 } },
                        { s: { r: 41, c: 0 }, e: { r: 41, c: 4 } },
                        { s: { r: 43, c: 0 }, e: { r: 43, c: 4 } },
                        { s: { r: copyrightRow, c: 0 }, e: { r: copyrightRow, c: 4 } }
                    ];

                    // Aplicar configurações
                    ws["!merges"] = mesclagens;
                    ws["!cols"] = [{ wch: 20 }, { wch: 25 }, { wch: 25 }, { wch: 25 }, { wch: 40 }];

                    // Adicionar logo
                    try {
                        if (this.config.logoEnabled && window.location.protocol !== "file:") {
                            const logoImg = document.querySelector("img.logo");
                            if (logoImg && typeof this._adicionarLogo === "function") {
                                this._adicionarLogo(ws, logoImg, {
                                    s: { r: 2, c: 1 },
                                    e: { r: 2, c: 4 }
                                });
                            }
                        }
                    } catch (e) {
                        console.warn("Falha ao adicionar logo:", e);
                    }

                    return ws;
                }
            }
        }
    },

    _adicionarLogo: function (ws, logoImg, range) {
        try {
            // Verificar se a biblioteca XLSX suporta imagens
            if (!XLSX.utils || !XLSX.utils.sheet_add_image) {
                console.warn("Versão da biblioteca XLSX não suporta adição de imagens");
                return;
            }

            // Criar um canvas para converter a imagem
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");

            // Definir tamanho do canvas
            canvas.width = this.config.logoSize.width;
            canvas.height = this.config.logoSize.height;

            // Desenhar a imagem no canvas
            ctx.drawImage(logoImg, 0, 0, canvas.width, canvas.height);

            // Converter para base64
            const imgBase64 = canvas.toDataURL("image/png").split(",")[1];

            // Adicionar a imagem à planilha
            const imgOpts = {
                name: "LogoExpertzy",
                data: imgBase64,
                opts: {
                    base64: true,
                    position: {
                        type: "twoCellAnchor",
                        from: { col: range.s.c, row: range.s.r },
                        to: { col: range.e.c, row: range.e.r }
                    }
                }
            };

            // Adicionar a imagem à planilha
            XLSX.utils.sheet_add_image(ws, imgOpts);
        } catch (e) {
            console.warn("Erro ao adicionar logo:", e);
        }
    },

    /**
     * Formata data no padrão brasileiro
     * @private
     * @param {Date} data - Data a ser formatada
     * @returns {string} Data formatada
     */
    _formatarData: function (data) {
        if (!data || !(data instanceof Date)) {
            data = new Date();
        }

        const dia = String(data.getDate()).padStart(2, "0");
        const mes = String(data.getMonth() + 1).padStart(2, "0");
        const ano = data.getFullYear();
        const hora = String(data.getHours()).padStart(2, "0");
        const minuto = String(data.getMinutes()).padStart(2, "0");

        return `${dia}/${mes}/${ano} ${hora}:${minuto}`;
    },

    /**
     * Capitaliza a primeira letra de uma string
     * @private
     * @param {string} texto - Texto a ser capitalizado
     * @returns {string} Texto com a primeira letra maiúscula
     */
    _capitalizarPrimeiraLetra: function (texto) {
        if (!texto || typeof texto !== "string") {
            return "";
        }

        return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
    },

    /**
     * Obtém o nome formatado do regime tributário
     * @private
     * @param {string} regime - Código do regime tributário
     * @returns {string} Nome formatado do regime
     */
    _obterRegimeTributarioFormatado: function (regime) {
        const regimes = {
            real: "Lucro Real",
            presumido: "Lucro Presumido",
            simples: "Simples Nacional",
            mei: "Microempreendedor Individual",
            imune: "Entidade Imune/Isenta"
        };

        return regimes[regime] || regime;
    },

    /**
     * Solicita nome de arquivo ao usuário
     * @private
     * @param {string} extensao - Extensão do arquivo
     * @param {string} nomeDefault - Nome padrão sugerido
     * @returns {string|null} Nome do arquivo com extensão ou null se cancelado
     */
    _solicitarNomeArquivo: function (extensao, nomeDefault) {
        let nomeArquivo = prompt(
            `Digite o nome do arquivo para salvar (sem a extensão .${extensao}):`,
            nomeDefault || `relatorio-${new Date().toISOString().slice(0, 10)}`
        );

        if (nomeArquivo === null) {
            return null;
        }

        // Limpar caracteres inválidos
        nomeArquivo = nomeArquivo.replace(/[<>:"/\\|?*]/g, "-");

        if (!nomeArquivo.trim()) {
            nomeArquivo = nomeDefault || `relatorio-${new Date().toISOString().slice(0, 10)}`;
        }

        return `${nomeArquivo}.${extensao}`;
    },
    /**
     * Exporta a memória de cálculo para um arquivo de texto
     */
    exportarMemoriaCalculo: function () {
        console.log("Iniciando exportação da memória de cálculo");

        if (!window.memoriaCalculoSimulacao) {
            alert("Realize uma simulação antes de exportar a memória de cálculo");
            return;
        }

        try {
            // Obter o ano selecionado no dropdown
            const selectAno = document.getElementById("select-ano-memoria");
            const anoSelecionado = selectAno ? selectAno.value : Object.keys(window.memoriaCalculoSimulacao)[0];

            if (!anoSelecionado || !window.memoriaCalculoSimulacao[anoSelecionado]) {
                alert("Não há memória de cálculo disponível para exportação");
                return;
            }

            // Obter o conteúdo da memória
            const conteudo = window.memoriaCalculoSimulacao[anoSelecionado];

            // Criar um blob com o conteúdo
            const blob = new Blob([conteudo], { type: "text/plain;charset=utf-8" });

            // Criar um elemento de link para download
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);

            // Nome do arquivo
            let nomeEmpresa = "empresa";
            if (window.ultimaSimulacao && window.ultimaSimulacao.dados && window.ultimaSimulacao.dados.empresa) {
                nomeEmpresa = window.ultimaSimulacao.dados.empresa.replace(/\s+/g, "-");
            }

            link.download = `memoria-calculo-${nomeEmpresa}-${anoSelecionado}.txt`;

            // Adicionar à página, clicar e remover
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            console.log("Memória de cálculo exportada com sucesso");
        } catch (error) {
            console.error("Erro ao exportar memória de cálculo:", error);
            alert("Erro ao exportar memória de cálculo. Verifique o console para mais detalhes.");
        }
    },

    /**
     * Exporta os resultados das estratégias de mitigação para PDF
     */
    exportarEstrategiasParaPDF: function () {
        console.log("Iniciando exportação das estratégias para PDF");

        if (!window.resultadosEstrategias) {
            alert("Realize uma simulação de estratégias antes de exportar");
            return;
        }

        try {
            // Inicializar jsPDF
            if (typeof jspdf === "undefined" || typeof jspdf.jsPDF !== "function") {
                console.error("Biblioteca jsPDF não encontrada");
                alert("Erro ao exportar: Biblioteca jsPDF não carregada");
                return;
            }

            const doc = new (window.jspdf?.jsPDF || window.jsPDF || function() {
                throw new Error('jsPDF não está disponível');
            })();

            // Configurações de texto
            doc.setFont("helvetica");
            doc.setFontSize(16);

            // Título
            doc.text("Estratégias de Mitigação do Impacto do Split Payment", 15, 20);

            // Informações da empresa
            doc.setFontSize(12);
            doc.text(`Empresa: ${window.ultimaSimulacao.dados.empresa}`, 15, 30);

            // Obter nome do setor
            let nomeSetor = "Não especificado";
            const selectSetor = document.getElementById("setor");
            if (selectSetor && selectSetor.selectedIndex > 0) {
                nomeSetor = selectSetor.options[selectSetor.selectedIndex].text;
            }

            doc.text(`Setor: ${nomeSetor}`, 15, 38);
            doc.text(`Data da Análise: ${new Date().toLocaleDateString("pt-BR")}`, 15, 46);

            // Linha separadora
            doc.line(15, 52, 195, 52);

            // Impacto Original
            doc.setFontSize(14);
            doc.text("Impacto Original do Split Payment", 15, 60);

            doc.setFontSize(12);
            const impacto = window.resultadosEstrategias.impactoBase;
            const formatMoeda = (val) => `R$ ${val.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
            const formatPercentual = (val) => `${(val * 100).toFixed(2)}%`;

            doc.text(`Diferença no Capital de Giro: ${formatMoeda(impacto.diferencaCapitalGiro)}`, 15, 70);
            doc.text(`Impacto Percentual: ${formatPercentual(impacto.percentualImpacto / 100)}`, 15, 78);
            doc.text(`Necessidade Adicional: ${formatMoeda(impacto.necessidadeAdicionalCapitalGiro)}`, 15, 86);
            doc.text(`Impacto na Margem: ${formatPercentual(impacto.impactoMargem / 100)}`, 15, 94);

            // Linha separadora
            doc.line(15, 100, 195, 100);

            // Estratégias Utilizadas
            doc.setFontSize(14);
            doc.text("Estratégias de Mitigação Utilizadas", 15, 110);
            doc.setFontSize(12);

            let posY = 120;
            const resultadosEstrategias = window.resultadosEstrategias.resultadosEstrategias;

            // Função para obter nome traduzido da estratégia
            const traduzirNomeEstrategia = (codigo) => {
                const nomes = {
                    ajustePrecos: "Ajuste de Preços",
                    renegociacaoPrazos: "Renegociação de Prazos",
                    antecipacaoRecebiveis: "Antecipação de Recebíveis",
                    capitalGiro: "Capital de Giro",
                    mixProdutos: "Mix de Produtos",
                    meiosPagamento: "Meios de Pagamento"
                };
                return nomes[codigo] || codigo;
            };

            // Listar cada estratégia ativa
            Object.entries(resultadosEstrategias).forEach(([codigo, dados]) => {
                if (!dados) return;

                doc.text(`• ${traduzirNomeEstrategia(codigo)}:`, 20, posY);
                posY += 8;

                doc.text(`  - Efetividade: ${formatPercentual(dados.efetividadePercentual / 100)}`, 25, posY);
                posY += 8;

                let impacto = 0;
                let custo = 0;

                // Extrair dados específicos de cada estratégia
                switch (codigo) {
                    case "ajustePrecos":
                        impacto = dados.fluxoCaixaAdicional || 0;
                        custo = dados.custoEstrategia || 0;
                        break;
                    case "renegociacaoPrazos":
                        impacto = dados.impactoFluxoCaixa || 0;
                        custo = dados.custoTotal || 0;
                        break;
                    case "antecipacaoRecebiveis":
                        impacto = dados.impactoFluxoCaixa || 0;
                        custo = dados.custoTotalAntecipacao || 0;
                        break;
                    case "capitalGiro":
                        impacto = dados.valorFinanciamento || 0;
                        custo = dados.custoTotalFinanciamento || 0;
                        break;
                    case "mixProdutos":
                        impacto = dados.impactoFluxoCaixa || 0;
                        custo = dados.custoImplementacao || 0;
                        break;
                    case "meiosPagamento":
                        impacto = dados.impactoLiquido || 0;
                        custo = dados.custoTotalIncentivo || 0;
                        break;
                }

                doc.text(`  - Impacto Positivo: ${formatMoeda(impacto)}`, 25, posY);
                posY += 8;
                doc.text(`  - Custo da Estratégia: ${formatMoeda(custo)}`, 25, posY);
                posY += 12;

                // Verificar se é necessário adicionar nova página
                if (posY > 250) {
                    doc.addPage();
                    posY = 20;
                }
            });

            // Verificar se estamos em uma nova página
            if (posY < 30) posY = 30;

            // Linha separadora
            doc.line(15, posY, 195, posY);
            posY += 10;

            // Resultados Combinados
            doc.setFontSize(14);
            doc.text("Resultados Combinados das Estratégias", 15, posY);
            posY += 10;
            doc.setFontSize(12);

            const combinado = window.resultadosEstrategias.efeitividadeCombinada;

            doc.text(`Efetividade Total: ${formatPercentual(combinado.efetividadePercentual / 100)}`, 15, posY);
            posY += 8;
            doc.text(`Mitigação Total: ${formatMoeda(combinado.mitigacaoTotal)}`, 15, posY);
            posY += 8;
            doc.text(`Custo Total das Estratégias: ${formatMoeda(combinado.custoTotal)}`, 15, posY);
            posY += 8;
            doc.text(`Relação Custo-Benefício: ${combinado.custoBeneficio.toFixed(2)}`, 15, posY);
            posY += 15;

            // Estratégia Ótima
            const otima = window.resultadosEstrategias.combinacaoOtima;

            doc.text("Combinação Ótima de Estratégias:", 15, posY);
            posY += 8;
            doc.text(`${otima.nomeEstrategias.join(", ")}`, 20, posY);
            posY += 8;
            doc.text(`Efetividade: ${formatPercentual(otima.efetividadePercentual / 100)}`, 20, posY);
            posY += 8;
            doc.text(`Custo Total: ${formatMoeda(otima.custoTotal)}`, 20, posY);

            // Rodapé
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(10);
                doc.text("© 2025 Expertzy Inteligência Tributária", 15, 285);
                doc.text(`Página ${i} de ${pageCount}`, 180, 285);
            }

            // Salvar o PDF
            const nomeArquivo = `estrategias-mitigacao-${window.ultimaSimulacao.dados.empresa.replace(/\s+/g, "-")}.pdf`;
            doc.save(nomeArquivo);
            console.log("PDF de estratégias exportado com sucesso:", nomeArquivo);
        } catch (error) {
            console.error("Erro ao exportar estratégias para PDF:", error);
            alert("Erro ao exportar para PDF. Verifique o console para mais detalhes.");
        }
    },

    /**
     * Exporta os resultados das estratégias de mitigação para Excel
     */
    exportarEstrategiasParaExcel: function () {
        console.log("Iniciando exportação das estratégias para Excel");

        if (!window.resultadosEstrategias) {
            alert("Realize uma simulação de estratégias antes de exportar");
            return;
        }

        try {
            // Verificar se a biblioteca está disponível
            if (typeof XLSX === "undefined") {
                console.error("Biblioteca XLSX não encontrada");
                alert("Erro ao exportar: Biblioteca XLSX não carregada");
                return;
            }

            // Criar uma nova pasta de trabalho
            const wb = XLSX.utils.book_new();

            // Função auxiliar para formatação
            const formatMoeda = (val) => val.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
            const formatPercentual = (val) => (val * 100).toFixed(2) + "%";

            // Obter nome do setor
            let nomeSetor = "Não especificado";
            const selectSetor = document.getElementById("setor");
            if (selectSetor && selectSetor.selectedIndex > 0) {
                nomeSetor = selectSetor.options[selectSetor.selectedIndex].text;
            }

            // Dados para a planilha de visão geral
            const dadosVisaoGeral = [
                ["Estratégias de Mitigação do Impacto do Split Payment"],
                [""],
                ["Dados da Empresa"],
                ["Empresa", window.ultimaSimulacao.dados.empresa],
                ["Setor", nomeSetor],
                ["Data da Análise", new Date().toLocaleDateString("pt-BR")],
                [""],
                ["Impacto Original do Split Payment"],
                [
                    "Diferença no Capital de Giro",
                    formatMoeda(window.resultadosEstrategias.impactoBase.diferencaCapitalGiro)
                ],
                ["Impacto Percentual", formatPercentual(window.resultadosEstrategias.impactoBase.percentualImpacto / 100)],
                [
                    "Necessidade Adicional",
                    formatMoeda(window.resultadosEstrategias.impactoBase.necessidadeAdicionalCapitalGiro)
                ],
                ["Impacto na Margem", formatPercentual(window.resultadosEstrategias.impactoBase.impactoMargem / 100)],
                [""],
                ["Resultados Combinados das Estratégias"],
                [
                    "Efetividade Total",
                    formatPercentual(window.resultadosEstrategias.efeitividadeCombinada.efetividadePercentual / 100)
                ],
                ["Mitigação Total", formatMoeda(window.resultadosEstrategias.efeitividadeCombinada.mitigacaoTotal)],
                ["Custo Total", formatMoeda(window.resultadosEstrategias.efeitividadeCombinada.custoTotal)],
                [
                    "Relação Custo-Benefício",
                    window.resultadosEstrategias.efeitividadeCombinada.custoBeneficio.toFixed(2)
                ]
            ];

            // Adicionar informações sobre a combinação ótima
            const otima = window.resultadosEstrategias.combinacaoOtima;
            dadosVisaoGeral.push([""]);
            dadosVisaoGeral.push(["Combinação Ótima de Estratégias"]);
            dadosVisaoGeral.push(["Estratégias Recomendadas", otima.nomeEstrategias.join(", ")]);
            dadosVisaoGeral.push(["Efetividade", formatPercentual(otima.efetividadePercentual / 100)]);
            dadosVisaoGeral.push(["Custo Total", formatMoeda(otima.custoTotal)]);

            // Função para obter nome traduzido da estratégia
            const traduzirNomeEstrategia = (codigo) => {
                const nomes = {
                    ajustePrecos: "Ajuste de Preços",
                    renegociacaoPrazos: "Renegociação de Prazos",
                    antecipacaoRecebiveis: "Antecipação de Recebíveis",
                    capitalGiro: "Capital de Giro",
                    mixProdutos: "Mix de Produtos",
                    meiosPagamento: "Meios de Pagamento"
                };
                return nomes[codigo] || codigo;
            };

            // Criar planilha de visão geral
            const wsVisaoGeral = XLSX.utils.aoa_to_sheet(dadosVisaoGeral);
            XLSX.utils.book_append_sheet(wb, wsVisaoGeral, "Visão Geral");

            // Criar planilha com detalhes de cada estratégia
            const estrategiasAtivas = Object.entries(window.resultadosEstrategias.resultadosEstrategias).filter(
                ([_, dados]) => dados !== null
            );

            if (estrategiasAtivas.length > 0) {
                const dadosDetalhes = [
                    ["Detalhamento das Estratégias de Mitigação"],
                    [""],
                    ["Estratégia", "Efetividade", "Impacto Positivo", "Custo da Estratégia", "Relação Custo-Benefício"]
                ];

                estrategiasAtivas.forEach(([codigo, dados]) => {
                    if (!dados) return;

                    // Extrair impacto e custo específicos de cada estratégia
                    let impacto = 0;
                    let custo = 0;

                    switch (codigo) {
                        case "ajustePrecos":
                            impacto = dados.fluxoCaixaAdicional || 0;
                            custo = dados.custoEstrategia || 0;
                            break;
                        case "renegociacaoPrazos":
                            impacto = dados.impactoFluxoCaixa || 0;
                            custo = dados.custoTotal || 0;
                            break;
                        case "antecipacaoRecebiveis":
                            impacto = dados.impactoFluxoCaixa || 0;
                            custo = dados.custoTotalAntecipacao || 0;
                            break;
                        case "capitalGiro":
                            impacto = dados.valorFinanciamento || 0;
                            custo = dados.custoTotalFinanciamento || 0;
                            break;
                        case "mixProdutos":
                            impacto = dados.impactoFluxoCaixa || 0;
                            custo = dados.custoImplementacao || 0;
                            break;
                        case "meiosPagamento":
                            impacto = dados.impactoLiquido || 0;
                            custo = dados.custoTotalIncentivo || 0;
                            break;
                    }

                    const custoBeneficio = custo > 0 && impacto > 0 ? (custo / impacto).toFixed(2) : "N/A";

                    dadosDetalhes.push([
                        traduzirNomeEstrategia(codigo),
                        formatPercentual(dados.efetividadePercentual / 100),
                        impacto,
                        custo,
                        custoBeneficio
                    ]);
                });

                const wsDetalhes = XLSX.utils.aoa_to_sheet(dadosDetalhes);
                XLSX.utils.book_append_sheet(wb, wsDetalhes, "Detalhes das Estratégias");
            }

            // Criar planilha para cada estratégia ativa
            estrategiasAtivas.forEach(([codigo, dados]) => {
                if (!dados) return;

                const nomeEstrategia = traduzirNomeEstrategia(codigo);
                const dadosEstrategia = [[`Detalhamento da Estratégia: ${nomeEstrategia}`], [""]];

                // Adicionar dados específicos de cada estratégia
                switch (codigo) {
                    case "ajustePrecos":
                        dadosEstrategia.push(["Percentual de Aumento", `${dados.percentualAumento}%`]);
                        dadosEstrategia.push(["Elasticidade-Preço", dados.elasticidade]);
                        dadosEstrategia.push(["Impacto nas Vendas", `${dados.impactoVendas}%`]);
                        dadosEstrategia.push(["Período de Ajuste", `${dados.periodoAjuste} meses`]);
                        dadosEstrategia.push(["Fluxo de Caixa Adicional", formatMoeda(dados.fluxoCaixaAdicional)]);
                        dadosEstrategia.push(["Custo da Estratégia", formatMoeda(dados.custoEstrategia)]);
                        break;

                    case "renegociacaoPrazos":
                        dadosEstrategia.push(["Aumento do Prazo", `${dados.aumentoPrazo} dias`]);
                        dadosEstrategia.push(["Percentual de Fornecedores", `${dados.percentualFornecedores}%`]);
                        dadosEstrategia.push(["Contrapartidas", dados.contrapartidas]);
                        dadosEstrategia.push(["Custo da Contrapartida", `${dados.custoContrapartida}%`]);
                        dadosEstrategia.push(["Impacto no Fluxo de Caixa", formatMoeda(dados.impactoFluxoCaixa)]);
                        dadosEstrategia.push(["Custo Total", formatMoeda(dados.custoTotal)]);
                        break;

                    case "antecipacaoRecebiveis":
                        dadosEstrategia.push(["Percentual de Antecipação", `${dados.percentualAntecipacao}%`]);
                        dadosEstrategia.push(["Taxa de Desconto", `${(dados.taxaDesconto * 100).toFixed(2)}% a.m.`]);
                        dadosEstrategia.push(["Prazo Médio Antecipado", `${dados.prazoAntecipacao} dias`]);
                        dadosEstrategia.push(["Impacto no Fluxo de Caixa", formatMoeda(dados.impactoFluxoCaixa)]);
                        dadosEstrategia.push(["Custo Total da Antecipação", formatMoeda(dados.custoTotalAntecipacao)]);
                        break;

                    case "capitalGiro":
                        dadosEstrategia.push(["Valor de Captação", `${dados.valorCaptacao}%`]);
                        dadosEstrategia.push(["Taxa de Juros", `${(dados.taxaJuros * 100).toFixed(2)}% a.m.`]);
                        dadosEstrategia.push(["Prazo de Pagamento", `${dados.prazoPagamento} meses`]);
                        dadosEstrategia.push(["Carência", `${dados.carencia} meses`]);
                        dadosEstrategia.push(["Valor Financiado", formatMoeda(dados.valorFinanciamento)]);
                        dadosEstrategia.push([
                            "Custo Total do Financiamento",
                            formatMoeda(dados.custoTotalFinanciamento)
                        ]);
                        break;

                    case "mixProdutos":
                        dadosEstrategia.push(["Percentual de Ajuste", `${dados.percentualAjuste}%`]);
                        dadosEstrategia.push(["Foco do Ajuste", dados.focoAjuste]);
                        dadosEstrategia.push(["Impacto na Receita", `${dados.impactoReceita}%`]);
                        dadosEstrategia.push(["Impacto na Margem", `${dados.impactoMargem} p.p.`]);
                        dadosEstrategia.push(["Impacto no Fluxo de Caixa", formatMoeda(dados.impactoFluxoCaixa)]);
                        dadosEstrategia.push(["Custo de Implementação", formatMoeda(dados.custoImplementacao)]);
                        break;

                    case "meiosPagamento":
                        dadosEstrategia.push([
                            "Distribuição Atual",
                            `À Vista: ${dados.distribuicaoAtual.vista}%, A Prazo: ${dados.distribuicaoAtual.prazo}%`
                        ]);
                        dadosEstrategia.push([
                            "Nova Distribuição",
                            `À Vista: ${dados.distribuicaoNova.vista}%, 30 dias: ${dados.distribuicaoNova.dias30}%, 60 dias: ${dados.distribuicaoNova.dias60}%, 90 dias: ${dados.distribuicaoNova.dias90}%`
                        ]);
                        dadosEstrategia.push(["Taxa de Incentivo", `${dados.taxaIncentivo}%`]);
                        dadosEstrategia.push(["Impacto Líquido", formatMoeda(dados.impactoLiquido)]);
                        dadosEstrategia.push(["Custo Total do Incentivo", formatMoeda(dados.custoTotalIncentivo)]);
                        break;
                }

                // Adicionar planilha para a estratégia
                const wsEstrategia = XLSX.utils.aoa_to_sheet(dadosEstrategia);
                XLSX.utils.book_append_sheet(wb, wsEstrategia, nomeEstrategia);
            });

            // Salvar o arquivo Excel
            const nomeArquivo = `estrategias-mitigacao-${window.ultimaSimulacao.dados.empresa.replace(/\s+/g, "-")}.xlsx`;
            XLSX.writeFile(wb, nomeArquivo);
            console.log("Excel de estratégias exportado com sucesso:", nomeArquivo);
        } catch (error) {
            console.error("Erro ao exportar estratégias para Excel:", error);
            alert("Erro ao exportar para Excel. Verifique o console para mais detalhes.");
        }
    }
};
