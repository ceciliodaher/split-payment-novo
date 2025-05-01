/**
 * Ferramentas de Exportação de Dados
 * Módulo para exportação dos resultados de simulação em diferentes formatos
 */
const ExportTools = {
    /**
     * Exporta os resultados da simulação para PDF
     */
    exportarParaPDF: function() {
        console.log('Iniciando exportação para PDF');
        
        if (!window.ultimaSimulacao) {
            alert('Realize uma simulação antes de exportar');
            return;
        }

        try {
            // Inicializar jsPDF (garantir que a biblioteca está carregada)
            if (typeof jspdf === 'undefined' || typeof jspdf.jsPDF !== 'function') {
                console.error('Biblioteca jsPDF não encontrada');
                alert('Erro ao exportar: Biblioteca jsPDF não carregada');
                return;
            }

            // Inicializar jsPDF
            const doc = new jspdf.jsPDF();

            // Configurações de texto
            doc.setFont('helvetica');
            doc.setFontSize(16);

            // Título
            doc.text('Simulação de Impacto do Split Payment no Fluxo de Caixa', 15, 20);

            // Informações da empresa
            doc.setFontSize(12);
            doc.text(`Empresa: ${window.ultimaSimulacao.dados.empresa}`, 15, 30);
            
            // Obter nome do setor
            let nomeSetor = 'Não especificado';
            const selectSetor = document.getElementById('setor');
            if (selectSetor && selectSetor.selectedIndex > 0) {
                nomeSetor = selectSetor.options[selectSetor.selectedIndex].text;
            }
            
            doc.text(`Setor: ${nomeSetor}`, 15, 38);
            
            // Regime tributário formatado
            let regimeTributario = 'Não especificado';
            switch(window.ultimaSimulacao.dados.regime) {
                case 'simples': regimeTributario = 'SIMPLES NACIONAL'; break;
                case 'presumido': regimeTributario = 'LUCRO PRESUMIDO'; break;
                case 'real': regimeTributario = 'LUCRO REAL'; break;
                default: regimeTributario = window.ultimaSimulacao.dados.regime.toUpperCase();
            }
            
            doc.text(`Regime Tributário: ${regimeTributario}`, 15, 46);
            doc.text(`Data da Simulação: ${new Date().toLocaleDateString('pt-BR')}`, 15, 54);

            // Linha separadora
            doc.line(15, 60, 195, 60);

            // Resultados principais
            doc.setFontSize(14);
            doc.text('Resultados da Simulação', 15, 70);

            doc.setFontSize(12);
            const imp = window.ultimaSimulacao.resultados.impactoBase;
            const formatMoeda = (val) => `R$ ${val.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
            const formatPerc = (val) => `${(val * 100).toFixed(2)}%`;

            doc.text(`Faturamento Mensal: ${formatMoeda(window.ultimaSimulacao.dados.faturamento)}`, 15, 80);
            doc.text(`Alíquota Efetiva: ${formatPerc(window.ultimaSimulacao.dados.aliquota)}`, 15, 88);
            doc.text(`Impacto no Capital de Giro: ${formatMoeda(imp.diferencaCapitalGiro)}`, 15, 96);
            doc.text(`Impacto Percentual: ${formatPerc(imp.percentualImpacto/100)}`, 15, 104);
            doc.text(`Necessidade Adicional: ${formatMoeda(imp.necessidadeAdicionalCapitalGiro)}`, 15, 112);
            doc.text(`Impacto na Margem: De ${formatPerc(imp.margemOperacionalOriginal)} para ${formatPerc(imp.margemOperacionalAjustada)}`, 15, 120);

            // Projeção
            const proj = window.ultimaSimulacao.resultados.projecaoTemporal;
            doc.text(`Projeção ${proj.parametros.anoInicial}-${proj.parametros.anoFinal}:`, 15, 136);
            doc.text(`Necessidade Total: ${formatMoeda(proj.impactoAcumulado.totalNecessidadeCapitalGiro)}`, 15, 144);
            doc.text(`Custo Financeiro: ${formatMoeda(proj.impactoAcumulado.custoFinanceiroTotal)}`, 15, 152);
            doc.text(`Impacto Médio na Margem: ${formatPerc(proj.impactoAcumulado.impactoMedioMargem/100)}`, 15, 160);

            // Rodapé
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(10);
                doc.text('© 2025 Expertzy Inteligência Tributária', 15, 285);
                doc.text(`Página ${i} de ${pageCount}`, 180, 285);
            }

            // Salvar o PDF
            const nomeArquivo = `simulacao-split-payment-${window.ultimaSimulacao.dados.empresa.replace(/\s+/g, '-')}.pdf`;
            doc.save(nomeArquivo);
            console.log('PDF exportado com sucesso:', nomeArquivo);
        } catch (error) {
            console.error('Erro ao exportar para PDF:', error);
            alert('Erro ao exportar para PDF. Verifique o console para mais detalhes.');
        }
    },

    /**
     * Exporta os resultados da simulação para Excel
     */
    exportarParaExcel: function() {
        console.log('Iniciando exportação para Excel');
        
        if (!window.ultimaSimulacao) {
            alert('Realize uma simulação antes de exportar');
            return;
        }

        try {
            // Verificar se a biblioteca está disponível
            if (typeof XLSX === 'undefined') {
                console.error('Biblioteca XLSX não encontrada');
                alert('Erro ao exportar: Biblioteca XLSX não carregada');
                return;
            }

            // Criar uma nova pasta de trabalho
            const wb = XLSX.utils.book_new();

            // Dados para a planilha de resultados
            const formatMoeda = (val) => val.toLocaleString('pt-BR', {minimumFractionDigits: 2});
            const formatPerc = (val) => (val * 100).toFixed(2) + '%';

            // Obter nome do setor
            let nomeSetor = 'Não especificado';
            const selectSetor = document.getElementById('setor');
            if (selectSetor && selectSetor.selectedIndex > 0) {
                nomeSetor = selectSetor.options[selectSetor.selectedIndex].text;
            }

            const dadosResultados = [
                ['Simulação de Impacto do Split Payment no Fluxo de Caixa'],
                [''],
                ['Dados da Empresa'],
                ['Empresa', window.ultimaSimulacao.dados.empresa],
                ['Setor', nomeSetor],
                ['Regime Tributário', window.ultimaSimulacao.dados.regime ? window.ultimaSimulacao.dados.regime.toUpperCase() : 'Não especificado'],
                ['Data da Simulação', new Date().toLocaleDateString('pt-BR')],
                [''],
                ['Parâmetros da Simulação'],
                ['Faturamento Mensal', formatMoeda(window.ultimaSimulacao.dados.faturamento)],
                ['Alíquota Efetiva', formatPerc(window.ultimaSimulacao.dados.aliquota)],
                ['Prazo Médio de Recebimento', window.ultimaSimulacao.dados.pmr + ' dias'],
                ['Prazo Médio de Pagamento', window.ultimaSimulacao.dados.pmp + ' dias'],
                ['Prazo Médio de Estoque', window.ultimaSimulacao.dados.pme + ' dias'],
                ['Percentual Vendas à Vista', formatPerc(window.ultimaSimulacao.dados.percVista)],
                ['Percentual Vendas a Prazo', formatPerc(window.ultimaSimulacao.dados.percPrazo)],
                [''],
                ['Resultados Principais'],
                ['Parâmetro', 'Valor'],
                ['Percentual de Implementação', formatPerc(window.ultimaSimulacao.resultados.impactoBase.resultadoSplitPayment.percentualImplementacao)],
                ['Impacto no Capital de Giro', window.ultimaSimulacao.resultados.impactoBase.diferencaCapitalGiro],
                ['Impacto Percentual', window.ultimaSimulacao.resultados.impactoBase.percentualImpacto/100],
                ['Necessidade Adicional', window.ultimaSimulacao.resultados.impactoBase.necessidadeAdicionalCapitalGiro],
                ['Margem Original', window.ultimaSimulacao.resultados.impactoBase.margemOperacionalOriginal],
                ['Margem Ajustada', window.ultimaSimulacao.resultados.impactoBase.margemOperacionalAjustada]
            ];

            // Adicionar dados da projeção
            dadosResultados.push(['']);
            dadosResultados.push(['Projeção Temporal']);
            const proj = window.ultimaSimulacao.resultados.projecaoTemporal;
            dadosResultados.push(['Período', `${proj.parametros.anoInicial}-${proj.parametros.anoFinal}`]);
            dadosResultados.push(['Necessidade Total', proj.impactoAcumulado.totalNecessidadeCapitalGiro]);
            dadosResultados.push(['Custo Financeiro Total', proj.impactoAcumulado.custoFinanceiroTotal]);
            dadosResultados.push(['Impacto Médio na Margem', proj.impactoAcumulado.impactoMedioMargem/100]);

            // Criar planilha de resultados
            const wsResultados = XLSX.utils.aoa_to_sheet(dadosResultados);
            XLSX.utils.book_append_sheet(wb, wsResultados, 'Resultados');

            // Criar planilha para cada ano da projeção
            const anos = Object.keys(proj.resultadosAnuais);
            anos.forEach(ano => {
                const dadosAno = [
                    [`Impacto Detalhado - Ano ${ano}`],
                    [''],
                    ['Parâmetro', 'Valor'],
                    ['Diferença Capital de Giro', proj.resultadosAnuais[ano].diferencaCapitalGiro],
                    ['Percentual de Impacto', proj.resultadosAnuais[ano].percentualImpacto/100],
                    ['Necessidade Adicional', proj.resultadosAnuais[ano].necessidadeAdicionalCapitalGiro],
                    ['Margem Ajustada', proj.resultadosAnuais[ano].margemOperacionalAjustada]
                ];

                const wsAno = XLSX.utils.aoa_to_sheet(dadosAno);
                XLSX.utils.book_append_sheet(wb, wsAno, `Ano ${ano}`);
            });

            // Criar planilha de memória de cálculo
            if (window.memoriaCalculoSimulacao) {
                const anoInicial = window.ultimaSimulacao.resultados.projecaoTemporal.parametros.anoInicial;
                const memoriaTexto = window.memoriaCalculoSimulacao[anoInicial] || '';
                
                const memoriaLinhas = memoriaTexto.split('\n').map(linha => [linha]);
                const wsMemoria = XLSX.utils.aoa_to_sheet(memoriaLinhas);
                XLSX.utils.book_append_sheet(wb, wsMemoria, 'Memória de Cálculo');
            }

            // Salvar o arquivo Excel
            const nomeArquivo = `simulacao-split-payment-${window.ultimaSimulacao.dados.empresa.replace(/\s+/g, '-')}.xlsx`;
            XLSX.writeFile(wb, nomeArquivo);
            console.log('Excel exportado com sucesso:', nomeArquivo);
        } catch (error) {
            console.error('Erro ao exportar para Excel:', error);
            alert('Erro ao exportar para Excel. Verifique o console para mais detalhes.');
        }
    },

    /**
     * Exporta a memória de cálculo para um arquivo de texto
     */
    exportarMemoriaCalculo: function() {
        console.log('Iniciando exportação da memória de cálculo');
        
        if (!window.memoriaCalculoSimulacao) {
            alert('Realize uma simulação antes de exportar a memória de cálculo');
            return;
        }

        try {
            // Obter o ano selecionado no dropdown
            const selectAno = document.getElementById('select-ano-memoria');
            const anoSelecionado = selectAno ? selectAno.value : Object.keys(window.memoriaCalculoSimulacao)[0];
            
            if (!anoSelecionado || !window.memoriaCalculoSimulacao[anoSelecionado]) {
                alert('Não há memória de cálculo disponível para exportação');
                return;
            }
            
            // Obter o conteúdo da memória
            const conteudo = window.memoriaCalculoSimulacao[anoSelecionado];
            
            // Criar um blob com o conteúdo
            const blob = new Blob([conteudo], { type: 'text/plain;charset=utf-8' });
            
            // Criar um elemento de link para download
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            
            // Nome do arquivo
            let nomeEmpresa = 'empresa';
            if (window.ultimaSimulacao && window.ultimaSimulacao.dados && window.ultimaSimulacao.dados.empresa) {
                nomeEmpresa = window.ultimaSimulacao.dados.empresa.replace(/\s+/g, '-');
            }
            
            link.download = `memoria-calculo-${nomeEmpresa}-${anoSelecionado}.txt`;
            
            // Adicionar à página, clicar e remover
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            console.log('Memória de cálculo exportada com sucesso');
        } catch (error) {
            console.error('Erro ao exportar memória de cálculo:', error);
            alert('Erro ao exportar memória de cálculo. Verifique o console para mais detalhes.');
        }
    }
};