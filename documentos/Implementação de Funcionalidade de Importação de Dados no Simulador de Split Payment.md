# Implementação de Funcionalidade de Importação de Dados no Simulador de Split Payment

A automação do processo de importação de dados para o simulador de Split Payment representa uma evolução significativa que potencializará a precisão e eficiência da ferramenta. Após analisar a estrutura atual do projeto, desenvolvi uma proposta completa de implementação que abrange desde a concepção da arquitetura de importação até o detalhamento técnico das alterações necessárias.

## 1. Arquitetura da Solução de Importação

A solução proposta contempla três componentes fundamentais que funcionam de forma integrada:

1. **Interface de importação**: Nova seção na interface do usuário que permitirá o upload, visualização prévia e confirmação dos dados importados.

2. **Parsers especializados**: Conjunto de módulos para interpretação dos diferentes formatos de arquivos fiscais e contábeis (XML de NF-e, EFD ICMS/IPI, EFD Contribuições, ECD).

3. **Adaptadores de dados**: Camada responsável por transformar os dados extraídos em formato compatível com o modelo de dados do simulador.

Esta arquitetura modular facilitará a manutenção e a expansão futura para novos formatos de arquivos.

## 2. Alterações Necessárias na Estrutura de Arquivos

Para implementar esta funcionalidade, serão necessárias modificações em arquivos existentes e a criação de novos componentes:

### 2.1. Novos Arquivos a Serem Criados

```
/simulador-split-payment/
├── js/
│   ├── import/
│   │   ├── import-manager.js        # Gerenciamento central do processo de importação
│   │   ├── file-upload.js           # Manipulação de uploads e validação inicial
│   │   ├── parsers/
│   │   │   ├── nfe-parser.js        # Parser para XML de Notas Fiscais Eletrônicas
│   │   │   ├── sped-efd-parser.js   # Parser para arquivos SPED EFD ICMS/IPI e Contribuições
│   │   │   ├── sped-ecd-parser.js   # Parser para arquivos SPED ECD (contábil)
│   │   │   └── parser-factory.js    # Fábrica para selecionar o parser adequado
│   │   ├── adapters/
│   │   │   ├── data-adapter.js      # Adaptação genérica de dados
│   │   │   ├── fiscal-adapter.js    # Adaptação de dados fiscais
│   │   │   └── financial-adapter.js # Adaptação de dados financeiros
│   │   └── validators/
│   │       ├── schema-validator.js  # Validação de estrutura de dados
│   │       └── business-validator.js # Validação de regras de negócio
└── templates/
    └── import-template.html         # Template para a tela de importação
```

### 2.2. Arquivos Existentes a Serem Modificados

```
/simulador-split-payment/
├── index.html                 # Adicionar tab para importação
├── css/
│   ├── main.css               # Estilos para a nova funcionalidade
│   └── tabs.css               # Adicionar estilo para a nova tab
├── js/
│   ├── main.js                # Inicialização do módulo de importação
│   ├── ui/
│   │   ├── tabs-manager.js    # Gerenciar a nova tab de importação
│   │   └── forms-manager.js   # Integrar dados importados com formulários
│   └── simulation/
│       └── simulator.js       # Utilizar dados importados na simulação
```

## 3. Implementação Detalhada

A seguir, apresento o detalhamento técnico das implementações necessárias em cada componente:

### 3.1. Arquivo: `index.html` (Modificação)

Adicionar a nova tab de importação no HTML principal:

```html
<!-- Adicionar após a linha 45 (exemplo), junto com as outras tabs -->
<button class="tab-button" data-tab="importacao">Importação de Dados</button>

<!-- Adicionar após a linha 120 (exemplo), junto com os outros conteúdos de tabs -->
<div id="importacao" class="tab-content">
    <div class="section-title">
        <h2>Importação de Dados</h2>
        <p>Importe dados fiscais e contábeis diretamente de arquivos eletrônicos.</p>
    </div>

    <div class="import-container">
        <div class="import-tabs">
            <button class="import-tab-button active" data-import-tab="nfe">Notas Fiscais (XML)</button>
            <button class="import-tab-button" data-import-tab="sped-fiscal">SPED EFD</button>
            <button class="import-tab-button" data-import-tab="sped-contabil">SPED ECD</button>
        </div>

        <div class="import-content active" id="import-nfe">
            <div class="file-upload-container">
                <label for="nfe-file-upload" class="file-upload-label">
                    <i class="fas fa-file-upload"></i>
                    <span>Selecione os arquivos XML de NF-e</span>
                </label>
                <input type="file" id="nfe-file-upload" accept=".xml" multiple class="file-upload-input">
                <div class="file-list" id="nfe-file-list"></div>
            </div>
        </div>

        <div class="import-content" id="import-sped-fiscal">
            <div class="file-upload-container">
                <label for="sped-fiscal-file-upload" class="file-upload-label">
                    <i class="fas fa-file-upload"></i>
                    <span>Selecione o arquivo SPED EFD</span>
                </label>
                <input type="file" id="sped-fiscal-file-upload" accept=".txt" class="file-upload-input">
                <div class="file-list" id="sped-fiscal-file-list"></div>
            </div>
        </div>

        <div class="import-content" id="import-sped-contabil">
            <div class="file-upload-container">
                <label for="sped-contabil-file-upload" class="file-upload-label">
                    <i class="fas fa-file-upload"></i>
                    <span>Selecione o arquivo SPED ECD</span>
                </label>
                <input type="file" id="sped-contabil-file-upload" accept=".txt" class="file-upload-input">
                <div class="file-list" id="sped-contabil-file-list"></div>
            </div>
        </div>

        <div class="import-preview">
            <h3>Pré-visualização dos Dados</h3>
            <div id="import-preview-container" class="preview-container"></div>
        </div>

        <div class="import-actions">
            <button id="btn-process-import" class="btn btn-primary">Processar Arquivos</button>
            <button id="btn-apply-import" class="btn btn-secondary" disabled>Aplicar Dados Importados</button>
        </div>
    </div>
</div>
```

### 3.2. Arquivo: `css/main.css` (Modificação)

Adicionar estilos para os componentes de importação:

```css
/* Estilos para a funcionalidade de importação */
.import-container {
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding: 20px;
    background-color: #f9f9f9;
    border-radius: 5px;
}

.import-tabs {
    display: flex;
    gap: 10px;
    border-bottom: 1px solid #ddd;
    padding-bottom: 10px;
}

.import-tab-button {
    padding: 8px 16px;
    background-color: #f0f0f0;
    border: none;
    border-radius: 5px 5px 0 0;
    cursor: pointer;
    transition: background-color 0.3s;
}

.import-tab-button.active {
    background-color: #4285F4;
    color: white;
}

.import-content {
    display: none;
    padding: 20px 0;
}

.import-content.active {
    display: block;
}

.file-upload-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
    border: 2px dashed #ddd;
    border-radius: 5px;
    background-color: #fff;
}

.file-upload-label {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    padding: 20px;
    width: 100%;
    text-align: center;
}

.file-upload-label i {
    font-size: 48px;
    color: #4285F4;
}

.file-upload-input {
    display: none;
}

.file-list {
    margin-top: 20px;
    width: 100%;
}

.file-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
    background-color: #f5f5f5;
    border-radius: 5px;
    margin-bottom: 5px;
}

.file-name {
    flex-grow: 1;
    margin-right: 10px;
}

.file-size {
    color: #777;
    margin-right: 10px;
}

.file-remove {
    cursor: pointer;
    color: #e74c3c;
}

.import-preview {
    background-color: #fff;
    border: 1px solid #ddd;
    border-radius: 5px;
    padding: 20px;
}

.preview-container {
    max-height: 300px;
    overflow-y: auto;
    margin-top: 15px;
}

.import-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 20px;
}

.summary-card {
    background-color: #fff;
    border-left: 4px solid #4285F4;
    padding: 15px;
    margin-bottom: 15px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.data-table {
    width: 100%;
    border-collapse: collapse;
    margin: 15px 0;
}

.data-table th, 
.data-table td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: left;
}

.data-table th {
    background-color: #f2f2f2;
}

.data-table tr:nth-child(even) {
    background-color: #f9f9f9;
}
```

### 3.3. Arquivo: `js/import/import-manager.js` (Novo)

Este será o componente central de gerenciamento do processo de importação:

```javascript
/**
 * Gerenciador de Importação de Dados
 * Coordena o processo completo de importação, desde o upload até a adaptação dos dados
 */
const ImportManager = {
    /**
     * Inicializa o gerenciador de importação
     */
    init: function() {
        console.log('Inicializando gerenciador de importação...');

        // Inicializar componentes
        this.initUploadHandlers();
        this.initImportTabs();
        this.initActionButtons();

        // Dados temporários de importação
        this.importedData = {
            nfe: [],
            spedFiscal: {},
            spedContabil: {}
        };

        this.currentImportType = 'nfe';
    },

    /**
     * Inicializa os manipuladores de upload de arquivos
     */
    initUploadHandlers: function() {
        // Manipulador para XML de NFe
        const nfeInput = document.getElementById('nfe-file-upload');
        if (nfeInput) {
            nfeInput.addEventListener('change', this.handleNFeUpload.bind(this));

            // Adicionar suporte a drag & drop
            const nfeContainer = document.getElementById('import-nfe');
            if (nfeContainer) {
                nfeContainer.addEventListener('dragover', this.handleDragOver);
                nfeContainer.addEventListener('drop', (e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files.length > 0) {
                        nfeInput.files = e.dataTransfer.files;
                        this.handleNFeUpload({target: nfeInput});
                    }
                });
            }
        }

        // Manipulador para SPED EFD
        const spedFiscalInput = document.getElementById('sped-fiscal-file-upload');
        if (spedFiscalInput) {
            spedFiscalInput.addEventListener('change', this.handleSpedFiscalUpload.bind(this));

            // Adicionar suporte a drag & drop
            const spedFiscalContainer = document.getElementById('import-sped-fiscal');
            if (spedFiscalContainer) {
                spedFiscalContainer.addEventListener('dragover', this.handleDragOver);
                spedFiscalContainer.addEventListener('drop', (e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files.length > 0) {
                        spedFiscalInput.files = e.dataTransfer.files;
                        this.handleSpedFiscalUpload({target: spedFiscalInput});
                    }
                });
            }
        }

        // Manipulador para SPED ECD
        const spedContabilInput = document.getElementById('sped-contabil-file-upload');
        if (spedContabilInput) {
            spedContabilInput.addEventListener('change', this.handleSpedContabilUpload.bind(this));

            // Adicionar suporte a drag & drop
            const spedContabilContainer = document.getElementById('import-sped-contabil');
            if (spedContabilContainer) {
                spedContabilContainer.addEventListener('dragover', this.handleDragOver);
                spedContabilContainer.addEventListener('drop', (e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files.length > 0) {
                        spedContabilInput.files = e.dataTransfer.files;
                        this.handleSpedContabilUpload({target: spedContabilInput});
                    }
                });
            }
        }
    },

    /**
     * Manipulador para eventos de arrastar sobre a área de upload
     */
    handleDragOver: function(e) {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.add('drag-over');
    },

    /**
     * Inicializa as abas de importação
     */
    initImportTabs: function() {
        const tabButtons = document.querySelectorAll('.import-tab-button');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Atualizar botões ativos
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                // Atualizar conteúdo ativo
                const tabName = button.getAttribute('data-import-tab');
                this.currentImportType = tabName === 'nfe' ? 'nfe' : 
                                         tabName === 'sped-fiscal' ? 'spedFiscal' : 'spedContabil';

                const tabContents = document.querySelectorAll('.import-content');
                tabContents.forEach(content => content.classList.remove('active'));

                document.getElementById(`import-${tabName}`).classList.add('active');

                // Atualizar visualização
                this.updatePreview();
            });
        });
    },

    /**
     * Inicializa os botões de ação de importação
     */
    initActionButtons: function() {
        // Botão para processar arquivos
        const processButton = document.getElementById('btn-process-import');
        if (processButton) {
            processButton.addEventListener('click', this.processImportedFiles.bind(this));
        }

        // Botão para aplicar dados importados
        const applyButton = document.getElementById('btn-apply-import');
        if (applyButton) {
            applyButton.addEventListener('click', this.applyImportedData.bind(this));
        }
    },

    /**
     * Manipulador para upload de XML de NFe
     */
    handleNFeUpload: function(e) {
        const files = Array.from(e.target.files);
        const fileList = document.getElementById('nfe-file-list');

        if (fileList) {
            fileList.innerHTML = '';

            files.forEach(file => {
                // Validar se é XML
                if (!file.name.endsWith('.xml')) {
                    alert('Por favor, selecione apenas arquivos XML.');
                    return;
                }

                // Adicionar à lista de arquivos
                const fileItem = document.createElement('div');
                fileItem.className = 'file-item';
                fileItem.innerHTML = `
                    <span class="file-name">${file.name}</span>
                    <span class="file-size">${this.formatFileSize(file.size)}</span>
                    <span class="file-remove" data-file="${file.name}">×</span>
                `;
                fileList.appendChild(fileItem);

                // Adicionar evento para remover arquivo
                const removeButton = fileItem.querySelector('.file-remove');
                removeButton.addEventListener('click', () => {
                    fileItem.remove();
                    // Atualizar lista de arquivos
                    // Note: Não é possível modificar o FileList diretamente
                    // Por isso, precisaremos reprocessar os arquivos restantes
                });
            });

            // Habilitar botão de processamento
            const processButton = document.getElementById('btn-process-import');
            if (processButton) {
                processButton.disabled = files.length === 0;
            }
        }
    },

    /**
     * Manipulador para upload de SPED EFD
     */
    handleSpedFiscalUpload: function(e) {
        const file = e.target.files[0];
        const fileList = document.getElementById('sped-fiscal-file-list');

        if (fileList) {
            fileList.innerHTML = '';

            if (file) {
                // Validar se é TXT
                if (!file.name.endsWith('.txt')) {
                    alert('Por favor, selecione apenas arquivos TXT.');
                    return;
                }

                // Adicionar à lista de arquivos
                const fileItem = document.createElement('div');
                fileItem.className = 'file-item';
                fileItem.innerHTML = `
                    <span class="file-name">${file.name}</span>
                    <span class="file-size">${this.formatFileSize(file.size)}</span>
                    <span class="file-remove" data-file="${file.name}">×</span>
                `;
                fileList.appendChild(fileItem);

                // Adicionar evento para remover arquivo
                const removeButton = fileItem.querySelector('.file-remove');
                removeButton.addEventListener('click', () => {
                    fileItem.remove();
                    e.target.value = '';
                });

                // Habilitar botão de processamento
                const processButton = document.getElementById('btn-process-import');
                if (processButton) {
                    processButton.disabled = false;
                }
            }
        }
    },

    /**
     * Manipulador para upload de SPED ECD
     */
    handleSpedContabilUpload: function(e) {
        const file = e.target.files[0];
        const fileList = document.getElementById('sped-contabil-file-list');

        if (fileList) {
            fileList.innerHTML = '';

            if (file) {
                // Validar se é TXT
                if (!file.name.endsWith('.txt')) {
                    alert('Por favor, selecione apenas arquivos TXT.');
                    return;
                }

                // Adicionar à lista de arquivos
                const fileItem = document.createElement('div');
                fileItem.className = 'file-item';
                fileItem.innerHTML = `
                    <span class="file-name">${file.name}</span>
                    <span class="file-size">${this.formatFileSize(file.size)}</span>
                    <span class="file-remove" data-file="${file.name}">×</span>
                `;
                fileList.appendChild(fileItem);

                // Adicionar evento para remover arquivo
                const removeButton = fileItem.querySelector('.file-remove');
                removeButton.addEventListener('click', () => {
                    fileItem.remove();
                    e.target.value = '';
                });

                // Habilitar botão de processamento
                const processButton = document.getElementById('btn-process-import');
                if (processButton) {
                    processButton.disabled = false;
                }
            }
        }
    },

    /**
     * Formata o tamanho do arquivo para exibição
     */
    formatFileSize: function(bytes) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    /**
     * Processa os arquivos importados
     */
    processImportedFiles: function() {
        const processButton = document.getElementById('btn-process-import');
        const applyButton = document.getElementById('btn-apply-import');

        if (processButton) {
            processButton.disabled = true;
            processButton.textContent = 'Processando...';
        }

        // Processar de acordo com o tipo de importação atual
        switch (this.currentImportType) {
            case 'nfe':
                this.processNFeFiles();
                break;
            case 'spedFiscal':
                this.processSpedFiscalFile();
                break;
            case 'spedContabil':
                this.processSpedContabilFile();
                break;
        }

        // Simular processamento (em um cenário real, isto seria assíncrono)
        setTimeout(() => {
            if (processButton) {
                processButton.disabled = false;
                processButton.textContent = 'Processar Arquivos';
            }

            if (applyButton) {
                applyButton.disabled = false;
            }

            alert('Arquivos processados com sucesso!');
            this.updatePreview();
        }, 2000);
    },

    /**
     * Processa arquivos XML de NF-e
     */
    processNFeFiles: function() {
        const fileInput = document.getElementById('nfe-file-upload');
        if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
            alert('Nenhum arquivo selecionado para processamento.');
            return;
        }

        const files = Array.from(fileInput.files);

        // Em um cenário real, usaríamos uma lógica assíncrona para ler os arquivos
        // e processá-los usando o parser adequado
        this.importedData.nfe = [];

        // Simulação de processamento
        files.forEach((file, index) => {
            // Simulando dados extraídos de uma NF-e
            const nfeData = {
                chave: `NFe${31200000000000 + index}`,
                numero: 1000 + index,
                serie: '1',
                dataEmissao: '2025-03-15',
                valorTotal: 1500.00 + (index * 100),
                baseCalculo: 1200.00 + (index * 80),
                valorImposto: 360.00 + (index * 24),
                aliquotaEfetiva: 30.0,
                tipoOperacao: 'Saída',
                emitente: 'Empresa Emitente LTDA',
                destinatario: 'Empresa Destinatária LTDA'
            };

            this.importedData.nfe.push(nfeData);
        });

        console.log('Dados NFe processados:', this.importedData.nfe);
    },

    /**
     * Processa arquivo SPED EFD
     */
    processSpedFiscalFile: function() {
        const fileInput = document.getElementById('sped-fiscal-file-upload');
        if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
            alert('Nenhum arquivo selecionado para processamento.');
            return;
        }

        const file = fileInput.files[0];

        // Em um cenário real, usaríamos uma lógica assíncrona para ler o arquivo
        // e processá-lo usando o parser adequado

        // Simulação de processamento
        this.importedData.spedFiscal = {
            cnpj: '12.345.678/0001-00',
            razaoSocial: 'Empresa Teste LTDA',
            periodo: '01/03/2025 a 31/03/2025',
            regime: 'Lucro Real',
            resumoOperacoes: {
                saidas: {
                    quantidade: 150,
                    valorTotal: 450000.00,
                    baseCalculoTotal: 380000.00,
                    impostoTotal: 114000.00,
                    aliquotaEfetiva: 30.0
                },
                entradas: {
                    quantidade: 75,
                    valorTotal: 250000.00,
                    baseCalculoTotal: 210000.00,
                    impostoTotal: 42000.00,
                    aliquotaEfetiva: 20.0
                }
            },
            creditosAcumulados: 38000.00
        };

        console.log('Dados SPED Fiscal processados:', this.importedData.spedFiscal);
    },

    /**
     * Processa arquivo SPED ECD
     */
    processSpedContabilFile: function() {
        const fileInput = document.getElementById('sped-contabil-file-upload');
        if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
            alert('Nenhum arquivo selecionado para processamento.');
            return;
        }

        const file = fileInput.files[0];

        // Em um cenário real, usaríamos uma lógica assíncrona para ler o arquivo
        // e processá-lo usando o parser adequado

        // Simulação de processamento
        this.importedData.spedContabil = {
            cnpj: '12.345.678/0001-00',
            razaoSocial: 'Empresa Teste LTDA',
            periodo: '01/01/2025 a 31/03/2025',
            balancete: {
                ativo: {
                    circulante: {
                        disponibilidades: 180000.00,
                        clientes: 380000.00,
                        estoques: 250000.00,
                        outrosAtivosCirculantes: 45000.00
                    },
                    naoCirculante: {
                        imobilizado: 520000.00,
                        depreciacao: -120000.00,
                        outrosAtivosNaoCirculantes: 75000.00
                    }
                },
                passivo: {
                    circulante: {
                        fornecedores: 210000.00,
                        emprestimos: 150000.00,
                        obrigacoesFiscais: 85000.00,
                        outrosPassivosCirculantes: 30000.00
                    },
                    naoCirculante: {
                        emprestimosLongoPrazo: 350000.00,
                        outrosPassivosNaoCirculantes: 60000.00
                    },
                    patrimonioLiquido: {
                        capitalSocial: 300000.00,
                        reservas: 95000.00,
                        lucrosPrejuizosAcumulados: 50000.00
                    }
                }
            },
            dre: {
                receitaOperacionalBruta: 950000.00,
                deducoes: -285000.00,
                receitaOperacionalLiquida: 665000.00,
                custosOperacionais: -380000.00,
                lucroOperacionalBruto: 285000.00,
                despesasOperacionais: -175000.00,
                lucroOperacionalLiquido: 110000.00,
                resultadoFinanceiro: -35000.00,
                lucroAntesIR: 75000.00,
                irCsll: -25000.00,
                lucroLiquido: 50000.00
            },
            cicloFinanceiro: {
                prazoMedioEstoque: 45,
                prazoMedioRecebimento: 30,
                prazoMedioPagamento: 25,
                cicloOperacional: 75,
                cicloFinanceiro: 50
            }
        };

        console.log('Dados SPED Contábil processados:', this.importedData.spedContabil);
    },

    /**
     * Atualiza a pré-visualização dos dados importados
     */
    updatePreview: function() {
        const previewContainer = document.getElementById('import-preview-container');
        if (!previewContainer) return;

        // Limpar conteúdo atual
        previewContainer.innerHTML = '';

        // Gerar visualização de acordo com o tipo de importação
        switch (this.currentImportType) {
            case 'nfe':
                this.updateNFePreview(previewContainer);
                break;
            case 'spedFiscal':
                this.updateSpedFiscalPreview(previewContainer);
                break;
            case 'spedContabil':
                this.updateSpedContabilPreview(previewContainer);
                break;
        }
    },

    /**
     * Atualiza a pré-visualização dos dados de NF-e
     */
    updateNFePreview: function(container) {
        if (!this.importedData.nfe || this.importedData.nfe.length === 0) {
            container.innerHTML = '<p>Nenhum dado processado. Selecione arquivos XML e clique em "Processar".</p>';
            return;
        }

        // Resumo dos dados
        const totalNotas = this.importedData.nfe.length;
        const valorTotal = this.importedData.nfe.reduce((sum, nfe) => sum + nfe.valorTotal, 0);
        const impostoTotal = this.importedData.nfe.reduce((sum, nfe) => sum + nfe.valorImposto, 0);
        const aliquotaMedia = (impostoTotal / valorTotal) * 100;

        const resumoHTML = `
            <div class="summary-card">
                <h4>Resumo dos Dados</h4>
                <p><strong>Total de Notas:</strong> ${totalNotas}</p>
                <p><strong>Valor Total:</strong> R$ ${valorTotal.toFixed(2)}</p>
                <p><strong>Imposto Total:</strong> R$ ${impostoTotal.toFixed(2)}</p>
                <p><strong>Alíquota Média:</strong> ${aliquotaMedia.toFixed(2)}%</p>
            </div>
        `;

        // Tabela com detalhes das notas
        let tabelaHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Número</th>
                        <th>Série</th>
                        <th>Data Emissão</th>
                        <th>Valor Total</th>
                        <th>Base de Cálculo</th>
                        <th>Valor Imposto</th>
                        <th>Alíquota</th>
                    </tr>
                </thead>
                <tbody>
        `;

        this.importedData.nfe.forEach(nfe => {
            tabelaHTML += `
                <tr>
                    <td>${nfe.numero}</td>
                    <td>${nfe.serie}</td>
                    <td>${nfe.dataEmissao}</td>
                    <td>R$ ${nfe.valorTotal.toFixed(2)}</td>
                    <td>R$ ${nfe.baseCalculo.toFixed(2)}</td>
                    <td>R$ ${nfe.valorImposto.toFixed(2)}</td>
                    <td>${nfe.aliquotaEfetiva.toFixed(2)}%</td>
                </tr>
            `;
        });

        tabelaHTML += `
                </tbody>
            </table>
        `;

        // Adicionar ao container
        container.innerHTML = resumoHTML + tabelaHTML;
    },

    /**
     * Atualiza a pré-visualização dos dados de SPED Fiscal
     */
    updateSpedFiscalPreview: function(container) {
        if (!this.importedData.spedFiscal || Object.keys(this.importedData.spedFiscal).length === 0) {
            container.innerHTML = '<p>Nenhum dado processado. Selecione um arquivo SPED EFD e clique em "Processar".</p>';
            return;
        }

        const data = this.importedData.spedFiscal;

        // Informações gerais
        const infoGeraisHTML = `
            <div class="summary-card">
                <h4>Informações Gerais</h4>
                <p><strong>CNPJ:</strong> ${data.cnpj}</p>
                <p><strong>Razão Social:</strong> ${data.razaoSocial}</p>
                <p><strong>Período:</strong> ${data.periodo}</p>
                <p><strong>Regime:</strong> ${data.regime}</p>
                <p><strong>Créditos Acumulados:</strong> R$ ${data.creditosAcumulados.toFixed(2)}</p>
            </div>
        `;

        // Resumo de operações
        const operacoesHTML = `
            <div class="summary-card">
                <h4>Resumo de Operações</h4>
                <h5>Saídas</h5>
                <p><strong>Quantidade:</strong> ${data.resumoOperacoes.saidas.quantidade}</p>
                <p><strong>Valor Total:</strong> R$ ${data.resumoOperacoes.saidas.valorTotal.toFixed(2)}</p>
                <p><strong>Base de Cálculo:</strong> R$ ${data.resumoOperacoes.saidas.baseCalculoTotal.toFixed(2)}</p>
                <p><strong>Imposto Total:</strong> R$ ${data.resumoOperacoes.saidas.impostoTotal.toFixed(2)}</p>
                <p><strong>Alíquota Efetiva:</strong> ${data.resumoOperacoes.saidas.aliquotaEfetiva.toFixed(2)}%</p>

                <h5>Entradas</h5>
                <p><strong>Quantidade:</strong> ${data.resumoOperacoes.entradas.quantidade}</p>
                <p><strong>Valor Total:</strong> R$ ${data.resumoOperacoes.entradas.valorTotal.toFixed(2)}</p>
                <p><strong>Base de Cálculo:</strong> R$ ${data.resumoOperacoes.entradas.baseCalculoTotal.toFixed(2)}</p>
                <p><strong>Imposto Total:</strong> R$ ${data.resumoOperacoes.entradas.impostoTotal.toFixed(2)}</p>
                <p><strong>Alíquota Efetiva:</strong> ${data.resumoOperacoes.entradas.aliquotaEfetiva.toFixed(2)}%</p>
            </div>
        `;

        // Adicionar ao container
        container.innerHTML = infoGeraisHTML + operacoesHTML;
    },

    /**
     * Atualiza a pré-visualização dos dados de SPED Contábil
     */
    updateSpedContabilPreview: function(container) {
        if (!this.importedData.spedContabil || Object.keys(this.importedData.spedContabil).length === 0) {
            container.innerHTML = '<p>Nenhum dado processado. Selecione um arquivo SPED ECD e clique em "Processar".</p>';
            return;
        }

        const data = this.importedData.spedContabil;

        // Informações gerais
        const infoGeraisHTML = `
            <div class="summary-card">
                <h4>Informações Gerais</h4>
                <p><strong>CNPJ:</strong> ${data.cnpj}</p>
                <p><strong>Razão Social:</strong> ${data.razaoSocial}</p>
                <p><strong>Período:</strong> ${data.periodo}</p>
            </div>
        `;

        // Ciclo Financeiro
        const cicloHTML = `
            <div class="summary-card">
                <h4>Ciclo Financeiro</h4>
                <p><strong>Prazo Médio de Estoque:</strong> ${data.cicloFinanceiro.prazoMedioEstoque} dias</p>
                <p><strong>Prazo Médio de Recebimento:</strong> ${data.cicloFinanceiro.prazoMedioRecebimento} dias</p>
                <p><strong>Prazo Médio de Pagamento:</strong> ${data.cicloFinanceiro.prazoMedioPagamento} dias</p>
                <p><strong>Ciclo Operacional:</strong> ${data.cicloFinanceiro.cicloOperacional} dias</p>
                <p><strong>Ciclo Financeiro:</strong> ${data.cicloFinanceiro.cicloFinanceiro} dias</p>
            </div>
        `;

        // Balancete Resumido
        const balanceteHTML = `
            <div class="summary-card">
                <h4>Balancete Resumido</h4>
                <h5>Ativo</h5>
                <p><strong>Circulante:</strong> R$ ${(
                    data.balancete.ativo.circulante.disponibilidades + 
                    data.balancete.ativo.circulante.clientes + 
                    data.balancete.ativo.circulante.estoques + 
                    data.balancete.ativo.circulante.outrosAtivosCirculantes
                ).toFixed(2)}</p>
                <p><strong>Não Circulante:</strong> R$ ${(
                    data.balancete.ativo.naoCirculante.imobilizado + 
                    data.balancete.ativo.naoCirculante.depreciacao + 
                    data.balancete.ativo.naoCirculante.outrosAtivosNaoCirculantes
                ).toFixed(2)}</p>

                <h5>Passivo</h5>
                <p><strong>Circulante:</strong> R$ ${(
                    data.balancete.passivo.circulante.fornecedores + 
                    data.balancete.passivo.circulante.emprestimos + 
                    data.balancete.passivo.circulante.obrigacoesFiscais + 
                    data.balancete.passivo.circulante.outrosPassivosCirculantes
                ).toFixed(2)}</p>
                <p><strong>Não Circulante:</strong> R$ ${(
                    data.balancete.passivo.naoCirculante.emprestimosLongoPrazo + 
                    data.balancete.passivo.naoCirculante.outrosPassivosNaoCirculantes
                ).toFixed(2)}</p>
                <p><strong>Patrimônio Líquido:</strong> R$ ${(
                    data.balancete.passivo.patrimonioLiquido.capitalSocial + 
                    data.balancete.passivo.patrimonioLiquido.reservas + 
                    data.balancete.passivo.patrimonioLiquido.lucrosPrejuizosAcumulados
                ).toFixed(2)}</p>
            </div>
        `;

        // DRE Resumida
        const dreHTML = `
            <div class="summary-card">
                <h4>DRE Resumida</h4>
                <p><strong>Receita Operacional Bruta:</strong> R$ ${data.dre.receitaOperacionalBruta.toFixed(2)}</p>
                <p><strong>Deduções:</strong> R$ ${data.dre.deducoes.toFixed(2)}</p>
                <p><strong>Receita Operacional Líquida:</strong> R$ ${data.dre.receitaOperacionalLiquida.toFixed(2)}</p>
                <p><strong>Custos Operacionais:</strong> R$ ${data.dre.custosOperacionais.toFixed(2)}</p>
                <p><strong>Lucro Operacional Bruto:</strong> R$ ${data.dre.lucroOperacionalBruto.toFixed(2)}</p>
                <p><strong>Despesas Operacionais:</strong> R$ ${data.dre.despesasOperacionais.toFixed(2)}</p>
                <p><strong>Lucro Operacional Líquido:</strong> R$ ${data.dre.lucroOperacionalLiquido.toFixed(2)}</p>
                <p><strong>Resultado Financeiro:</strong> R$ ${data.dre.resultadoFinanceiro.toFixed(2)}</p>
                <p><strong>Lucro Antes do IR:</strong> R$ ${data.dre.lucroAntesIR.toFixed(2)}</p>
                <p><strong>IR/CSLL:</strong> R$ ${data.dre.irCsll.toFixed(2)}</p>
                <p><strong>Lucro Líquido:</strong> R$ ${data.dre.lucroLiquido.toFixed(2)}</p>
            </div>
        `;

        // Adicionar ao container
        container.innerHTML = infoGeraisHTML + cicloHTML + balanceteHTML + dreHTML;
    },

    /**
     * Aplica os dados importados ao simulador
     */
    applyImportedData: function() {
        // Transformar dados importados em formato compatível com o simulador
        let dadosSimulador = this.prepararDadosParaSimulador();

        if (!dadosSimulador) {
            alert('Não foi possível preparar os dados para simulação. Verifique se os dados foram processados corretamente.');
            return;
        }

        // Aplicar dados ao formulário do simulador
        this.preencherFormularioSimulador(dadosSimulador);

        // Ativar a aba de simulação
        const tabButtons = document.querySelectorAll('.tab-button');
        tabButtons.forEach(button => {
            if (button.getAttribute('data-tab') === 'simulacao') {
                button.click();
            }
        });

        alert('Dados aplicados com sucesso! Você pode prosseguir com a simulação na aba "Simulação".');
    },

    /**
     * Prepara os dados importados para o formato do simulador
     */
    prepararDadosParaSimulador: function() {
        let dadosSimulador = {};

        // Extrair dados relevantes de acordo com o tipo de importação
        switch (this.currentImportType) {
            case 'nfe':
                if (!this.importedData.nfe || this.importedData.nfe.length === 0) {
                    return null;
                }

                // Calcular valores totais
                const valorTotal = this.importedData.nfe.reduce((sum, nfe) => sum + nfe.valorTotal, 0);
                const impostoTotal = this.importedData.nfe.reduce((sum, nfe) => sum + nfe.valorImposto, 0);
                const aliquotaMedia = (impostoTotal / valorTotal) * 100;

                dadosSimulador = {
                    faturamento: valorTotal * 12 / this.importedData.nfe.length, // Anualizado
                    aliquotaEfetiva: aliquotaMedia,
                    prazoMedioRecebimento: 30, // Valor padrão, seria extraído dos dados reais
                    prazoMedioPagamento: 25, // Valor padrão, seria extraído dos dados reais
                    percentualVendaVista: 20, // Valor padrão, seria extraído dos dados reais
                    percentualVendaPrazo: 80  // Valor padrão, seria extraído dos dados reais
                };
                break;

            case 'spedFiscal':
                if (!this.importedData.spedFiscal || Object.keys(this.importedData.spedFiscal).length === 0) {
                    return null;
                }

                const data = this.importedData.spedFiscal;

                dadosSimulador = {
                    faturamento: data.resumoOperacoes.saidas.valorTotal * 12, // Anualizado
                    aliquotaEfetiva: data.resumoOperacoes.saidas.aliquotaEfetiva,
                    creditosAcumulados: data.creditosAcumulados,
                    prazoMedioRecebimento: 30, // Valor padrão, seria extraído dos dados reais
                    prazoMedioPagamento: 25, // Valor padrão, seria extraído dos dados reais
                    percentualVendaVista: 20, // Valor padrão, seria extraído dos dados reais
                    percentualVendaPrazo: 80  // Valor padrão, seria extraído dos dados reais
                };
                break;

            case 'spedContabil':
                if (!this.importedData.spedContabil || Object.keys(this.importedData.spedContabil).length === 0) {
                    return null;
                }

                const contabData = this.importedData.spedContabil;

                dadosSimulador = {
                    faturamento: contabData.dre.receitaOperacionalBruta * 4, // Anualizado (trimestral)
                    prazoMedioRecebimento: contabData.cicloFinanceiro.prazoMedioRecebimento,
                    prazoMedioPagamento: contabData.cicloFinanceiro.prazoMedioPagamento,
                    prazoMedioEstoque: contabData.cicloFinanceiro.prazoMedioEstoque,
                    margemLiquida: (contabData.dre.lucroLiquido / contabData.dre.receitaOperacionalLiquida) * 100,
                    aliquotaEfetiva: 26.5, // Valor padrão, seria calculado com base em outros dados
                    percentualVendaVista: 20, // Valor padrão, seria extraído dos dados reais
                    percentualVendaPrazo: 80  // Valor padrão, seria extraído dos dados reais
                };
                break;
        }

        return dadosSimulador;
    },

    /**
     * Preenche o formulário do simulador com os dados extraídos
     */
    preencherFormularioSimulador: function(dados) {
        // Identificar campos do formulário
        const faturamentoInput = document.getElementById('faturamento');
        const aliquotaInput = document.getElementById('aliquota');
        const prazoRecebimentoInput = document.getElementById('prazo-recebimento');
        const prazoPagamentoInput = document.getElementById('prazo-pagamento');
        const vendaVistaInput = document.getElementById('perc-venda-vista');
        const vendaPrazoInput = document.getElementById('perc-venda-prazo');

        // Preencher campos se existirem
        if (faturamentoInput && 'faturamento' in dados) {
            faturamentoInput.value = dados.faturamento.toFixed(2);
        }

        if (aliquotaInput && 'aliquotaEfetiva' in dados) {
            aliquotaInput.value = dados.aliquotaEfetiva.toFixed(2);
        }

        if (prazoRecebimentoInput && 'prazoMedioRecebimento' in dados) {
            prazoRecebimentoInput.value = dados.prazoMedioRecebimento;
        }

        if (prazoPagamentoInput && 'prazoMedioPagamento' in dados) {
            prazoPagamentoInput.value = dados.prazoMedioPagamento;
        }

        if (vendaVistaInput && 'percentualVendaVista' in dados) {
            vendaVistaInput.value = dados.percentualVendaVista;
        }

        if (vendaPrazoInput && 'percentualVendaPrazo' in dados) {
            vendaPrazoInput.value = dados.percentualVendaPrazo;
        }

        // Disparar eventos de change para atualizar cálculos dependentes
        if (faturamentoInput) {
            const event = new Event('change');
            faturamentoInput.dispatchEvent(event);
        }
    }
};

// Exportar o gerenciador para uso global
window.ImportManager = ImportManager;

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    ImportManager.init();
});
```

### 3.4. Arquivo: `js/import/parsers/nfe-parser.js` (Novo)

Este módulo será responsável por processar os arquivos XML de NF-e:

```javascript
/**
 * Parser para XML de Notas Fiscais Eletrônicas (NF-e)
 * Extrai informações relevantes para o simulador de Split Payment
 */
const NFeParser = {
    /**
     * Processa um arquivo XML de NF-e
     * @param {string} xmlContent - Conteúdo do arquivo XML
     * @returns {object} Objeto com informações estruturadas da NF-e
     */
    parse: function(xmlContent) {
        // Criar um parser de XML
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlContent, "text/xml");

        // Verificar se o XML é realmente uma NF-e
        if (!this.isValidNFe(xmlDoc)) {
            throw new Error("O arquivo XML não parece ser uma NF-e válida.");
        }

        try {
            // Extrair informações gerais
            const chave = this.extractChaveNFe(xmlDoc);
            const info = this.extractInfoNFe(xmlDoc);
            const valores = this.extractValoresNFe(xmlDoc);
            const emitente = this.extractEmitenteNFe(xmlDoc);
            const destinatario = this.extractDestinatarioNFe(xmlDoc);
            const itens = this.extractItensNFe(xmlDoc);

            // Construir objeto de retorno
            return {
                chave: chave,
                numero: info.numero,
                serie: info.serie,
                dataEmissao: info.dataEmissao,
                naturezaOperacao: info.naturezaOperacao,
                tipoOperacao: info.tipoOperacao,
                valores: valores,
                emitente: emitente,
                destinatario: destinatario,
                itens: itens
            };
        } catch (error) {
            throw new Error(`Erro ao processar NF-e: ${error.message}`);
        }
    },

    /**
     * Verifica se o XML é realmente uma NF-e válida
     * @param {Document} xmlDoc - Documento XML
     * @returns {boolean} Verdadeiro se for uma NF-e válida
     */
    isValidNFe: function(xmlDoc) {
        // Verificar se possui elementos essenciais de uma NF-e
        const nfeNode = xmlDoc.getElementsByTagName('NFe')[0] || xmlDoc.getElementsByTagName('nfeProc')[0];
        return !!nfeNode;
    },

    /**
     * Extrai a chave da NF-e
     * @param {Document} xmlDoc - Documento XML
     * @returns {string} Chave da NF-e
     */
    extractChaveNFe: function(xmlDoc) {
        // Procurar chave em diferentes locais dependendo do layout
        const infNFe = xmlDoc.getElementsByTagName('infNFe')[0];
        if (infNFe && infNFe.getAttribute('Id')) {
            // A chave geralmente está no atributo Id precedida por "NFe"
            return infNFe.getAttribute('Id').replace('NFe', '');
        }

        // Alternativa: procurar elemento específico da chave
        const chaveAcesso = xmlDoc.getElementsByTagName('chNFe')[0];
        if (chaveAcesso) {
            return chaveAcesso.textContent;
        }

        return "Chave não encontrada";
    },

    /**
     * Extrai informações gerais da NF-e
     * @param {Document} xmlDoc - Documento XML
     * @returns {object} Informações gerais
     */
    extractInfoNFe: function(xmlDoc) {
        const ide = xmlDoc.getElementsByTagName('ide')[0];
        if (!ide) {
            throw new Error("Elemento 'ide' não encontrado no XML.");
        }

        // Extrair número da NF-e
        const numeroNF = ide.getElementsByTagName('nNF')[0]?.textContent || "";

        // Extrair série
        const serie = ide.getElementsByTagName('serie')[0]?.textContent || "";

        // Extrair data de emissão
        const dhEmi = ide.getElementsByTagName('dhEmi')[0]?.textContent || 
                      ide.getElementsByTagName('dEmi')[0]?.textContent || "";

        // Formatar data para padrão ISO
        const dataEmissao = dhEmi ? this.formatDate(dhEmi) : "";

        // Extrair natureza da operação
        const naturezaOperacao = ide.getElementsByTagName('natOp')[0]?.textContent || "";

        // Extrair tipo de operação (entrada/saída)
        const tipoOperacao = ide.getElementsByTagName('tpNF')[0]?.textContent === "1" ? "Saída" : "Entrada";

        return {
            numero: numeroNF,
            serie: serie,
            dataEmissao: dataEmissao,
            naturezaOperacao: naturezaOperacao,
            tipoOperacao: tipoOperacao
        };
    },

    /**
     * Extrai valores monetários da NF-e
     * @param {Document} xmlDoc - Documento XML
     * @returns {object} Valores monetários
     */
    extractValoresNFe: function(xmlDoc) {
        const total = xmlDoc.getElementsByTagName('total')[0];
        if (!total) {
            throw new Error("Elemento 'total' não encontrado no XML.");
        }

        const icmsTot = total.getElementsByTagName('ICMSTot')[0];
        if (!icmsTot) {
            throw new Error("Elemento 'ICMSTot' não encontrado no XML.");
        }

        // Extrair valores totais
        const valorTotal = parseFloat(icmsTot.getElementsByTagName('vNF')[0]?.textContent || "0");
        const baseCalculoICMS = parseFloat(icmsTot.getElementsByTagName('vBC')[0]?.textContent || "0");
        const valorICMS = parseFloat(icmsTot.getElementsByTagName('vICMS')[0]?.textContent || "0");
        const baseCalculoPIS = parseFloat(icmsTot.getElementsByTagName('vPIS')[0]?.textContent || "0");
        const valorPIS = parseFloat(icmsTot.getElementsByTagName('vPIS')[0]?.textContent || "0");
        const baseCalculoCOFINS = parseFloat(icmsTot.getElementsByTagName('vCOFINS')[0]?.textContent || "0");
        const valorCOFINS = parseFloat(icmsTot.getElementsByTagName('vCOFINS')[0]?.textContent || "0");

        // Calcular alíquota efetiva total
        const valorImpostoTotal = valorICMS + valorPIS + valorCOFINS;
        const aliquotaEfetiva = valorTotal > 0 ? (valorImpostoTotal / valorTotal) * 100 : 0;

        return {
            valorTotal: valorTotal,
            baseCalculoICMS: baseCalculoICMS,
            valorICMS: valorICMS,
            valorPIS: valorPIS,
            valorCOFINS: valorCOFINS,
            valorImpostoTotal: valorImpostoTotal,
            aliquotaEfetiva: aliquotaEfetiva
        };
    },

    /**
     * Extrai informações do emitente da NF-e
     * @param {Document} xmlDoc - Documento XML
     * @returns {object} Informações do emitente
     */
    extractEmitenteNFe: function(xmlDoc) {
        const emit = xmlDoc.getElementsByTagName('emit')[0];
        if (!emit) {
            throw new Error("Elemento 'emit' não encontrado no XML.");
        }

        // Extrair CNPJ ou CPF
        const cnpj = emit.getElementsByTagName('CNPJ')[0]?.textContent || "";
        const cpf = emit.getElementsByTagName('CPF')[0]?.textContent || "";

        // Extrair nome/razão social
        const nome = emit.getElementsByTagName('xNome')[0]?.textContent || "";

        // Extrair nome fantasia
        const fantasia = emit.getElementsByTagName('xFant')[0]?.textContent || "";

        return {
            cnpjCpf: cnpj || cpf,
            nome: nome,
            fantasia: fantasia
        };
    },

    /**
     * Extrai informações do destinatário da NF-e
     * @param {Document} xmlDoc - Documento XML
     * @returns {object} Informações do destinatário
     */
    extractDestinatarioNFe: function(xmlDoc) {
        const dest = xmlDoc.getElementsByTagName('dest')[0];
        if (!dest) {
            throw new Error("Elemento 'dest' não encontrado no XML.");
        }

        // Extrair CNPJ ou CPF
        const cnpj = dest.getElementsByTagName('CNPJ')[0]?.textContent || "";
        const cpf = dest.getElementsByTagName('CPF')[0]?.textContent || "";

        // Extrair nome/razão social
        const nome = dest.getElementsByTagName('xNome')[0]?.textContent || "";

        return {
            cnpjCpf: cnpj || cpf,
            nome: nome
        };
    },

    /**
     * Extrai itens da NF-e
     * @param {Document} xmlDoc - Documento XML
     * @returns {Array} Lista de itens da NF-e
     */
    extractItensNFe: function(xmlDoc) {
        const itens = [];
        const detNodes = xmlDoc.getElementsByTagName('det');

        for (let i = 0; i < detNodes.length; i++) {
            const det = detNodes[i];
            const nItem = det.getAttribute('nItem') || (i + 1).toString();

            // Extrair informações do produto
            const prod = det.getElementsByTagName('prod')[0];
            if (!prod) continue;

            const codigo = prod.getElementsByTagName('cProd')[0]?.textContent || "";
            const descricao = prod.getElementsByTagName('xProd')[0]?.textContent || "";
            const quantidade = parseFloat(prod.getElementsByTagName('qCom')[0]?.textContent || "0");
            const valorUnitario = parseFloat(prod.getElementsByTagName('vUnCom')[0]?.textContent || "0");
            const valorTotal = parseFloat(prod.getElementsByTagName('vProd')[0]?.textContent || "0");

            // Extrair informações fiscais
            const imposto = det.getElementsByTagName('imposto')[0];
            let valorImposto = 0;
            let aliquota = 0;

            if (imposto) {
                // ICMS
                const icms = imposto.getElementsByTagName('ICMS')[0];
                if (icms) {
                    // Procurar diferentes tipos de ICMS (ICMS00, ICMS10, etc.)
                    const icmsTypes = ['ICMS00', 'ICMS10', 'ICMS20', 'ICMS30', 'ICMS40', 'ICMS51', 'ICMS60', 'ICMS70', 'ICMS90'];
                    let icmsNode = null;

                    for (const type of icmsTypes) {
                        const node = icms.getElementsByTagName(type)[0];
                        if (node) {
                            icmsNode = node;
                            break;
                        }
                    }

                    if (icmsNode) {
                        const vICMS = icmsNode.getElementsByTagName('vICMS')[0]?.textContent || "0";
                        const pICMS = icmsNode.getElementsByTagName('pICMS')[0]?.textContent || "0";
                        valorImposto += parseFloat(vICMS);
                        aliquota = parseFloat(pICMS);
                    }
                }

                // PIS
                const pis = imposto.getElementsByTagName('PIS')[0];
                if (pis) {
                    const vPIS = pis.getElementsByTagName('vPIS')[0]?.textContent || "0";
                    valorImposto += parseFloat(vPIS);
                }

                // COFINS
                const cofins = imposto.getElementsByTagName('COFINS')[0];
                if (cofins) {
                    const vCOFINS = cofins.getElementsByTagName('vCOFINS')[0]?.textContent || "0";
                    valorImposto += parseFloat(vCOFINS);
                }
            }

            itens.push({
                numeroItem: nItem,
                codigo: codigo,
                descricao: descricao,
                quantidade: quantidade,
                valorUnitario: valorUnitario,
                valorTotal: valorTotal,
                valorImposto: valorImposto,
                aliquota: aliquota
            });
        }

        return itens;
    },

    /**
     * Formata data para padrão ISO (YYYY-MM-DD)
     * @param {string} dateString - String de data em formato XML
     * @returns {string} Data formatada
     */
    formatDate: function(dateString) {
        try {
            // Verificar formato: com timezone (YYYY-MM-DDThh:mm:ssTZD) ou sem (YYYY-MM-DD)
            if (dateString.includes('T')) {
                return dateString.split('T')[0];
            }

            // Formato DD/MM/YYYY para YYYY-MM-DD
            if (dateString.includes('/')) {
                const parts = dateString.split('/');
                return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            }

            return dateString;
        } catch (e) {
            return dateString;
        }
    }
};

// Exportar o parser para uso global
window.NFeParser = NFeParser;
```

### 3.5. Arquivo: `js/import/parsers/sped-efd-parser.js` (Novo)

Este módulo processará os arquivos SPED EFD:

```javascript
/**
 * Parser para arquivos SPED EFD (ICMS/IPI e Contribuições)
 * Extrai informações relevantes para o simulador de Split Payment
 */
const SpedEfdParser = {
    /**
     * Processa um arquivo SPED EFD
     * @param {string} fileContent - Conteúdo do arquivo SPED
     * @returns {object} Objeto com informações estruturadas do SPED
     */
    parse: function(fileContent) {
        try {
            // Dividir o conteúdo em linhas
            const lines = fileContent.split(/\r?\n/);

            // Identificar o tipo de arquivo (ICMS/IPI ou Contribuições)
            const fileType = this.identifyFileType(lines);

            // Extrair informações conforme o tipo
            const headerInfo = this.extractHeaderInfo(lines);
            const companyInfo = this.extractCompanyInfo(lines);
            const operationsInfo = this.extractOperationsInfo(lines, fileType);
            const taxCreditsInfo = this.extractTaxCreditsInfo(lines, fileType);

            // Construir objeto de retorno
            return {
                fileType: fileType,
                headerInfo: headerInfo,
                companyInfo: companyInfo,
                operationsInfo: operationsInfo,
                taxCreditsInfo: taxCreditsInfo
            };
        } catch (error) {
            throw new Error(`Erro ao processar arquivo SPED EFD: ${error.message}`);
        }
    },

    /**
     * Identifica o tipo de arquivo SPED EFD
     * @param {Array} lines - Linhas do arquivo
     * @returns {string} Tipo do arquivo ('ICMS_IPI' ou 'CONTRIBUICOES')
     */
    identifyFileType: function(lines) {
        for (const line of lines) {
            if (line.startsWith('|0000|')) {
                const fields = line.split('|');
                if (fields.length > 9) {
                    // Campo 9 contém o código do tipo de arquivo
                    const codFin = fields[9].trim();
                    if (['1', '2', '3'].includes(codFin)) {
                        return 'ICMS_IPI';
                    } else if (['1', '2', '9'].includes(codFin)) {
                        return 'CONTRIBUICOES';
                    }
                }
            }
        }

        // Análise alternativa baseada em registros específicos
        for (const line of lines) {
            if (line.startsWith('|C')) {
                return 'ICMS_IPI';
            } else if (line.startsWith('|M')) {
                return 'CONTRIBUICOES';
            }
        }

        throw new Error("Não foi possível identificar o tipo de arquivo SPED EFD.");
    },

    /**
     * Extrai informações do cabeçalho do arquivo
     * @param {Array} lines - Linhas do arquivo
     * @returns {object} Informações do cabeçalho
     */
    extractHeaderInfo: function(lines) {
        let periodo = "";
        let versaoLeiaute = "";
        let finalidadeArquivo = "";

        for (const line of lines) {
            if (line.startsWith('|0000|')) {
                const fields = line.split('|');

                if (fields.length > 7) {
                    // Extrair data inicial e final
                    const dtIni = fields[4].trim();
                    const dtFin = fields[5].trim();

                    if (dtIni && dtFin) {
                        periodo = this.formatPeriod(dtIni, dtFin);
                    }

                    // Extrair versão do layout
                    versaoLeiaute = fields[3].trim();

                    // Extrair finalidade do arquivo
                    if (fields.length > 9) {
                        const codFin = fields[9].trim();
                        finalidadeArquivo = this.mapFileFinality(codFin);
                    }
                }

                break;
            }
        }

        return {
            periodo: periodo,
            versaoLeiaute: versaoLeiaute,
            finalidadeArquivo: finalidadeArquivo
        };
    },

    /**
     * Formata período para exibição
     * @param {string} dtIni - Data inicial no formato AAAAMMDD
     * @param {string} dtFin - Data final no formato AAAAMMDD
     * @returns {string} Período formatado
     */
    formatPeriod: function(dtIni, dtFin) {
        try {
            const dtIniFormatted = `${dtIni.substr(6, 2)}/${dtIni.substr(4, 2)}/${dtIni.substr(0, 4)}`;
            const dtFinFormatted = `${dtFin.substr(6, 2)}/${dtFin.substr(4, 2)}/${dtFin.substr(0, 4)}`;
            return `${dtIniFormatted} a ${dtFinFormatted}`;
        } catch (e) {
            return `${dtIni} a ${dtFin}`;
        }
    },

    /**
     * Mapeia código de finalidade para descrição
     * @param {string} codFin - Código de finalidade
     * @returns {string} Descrição da finalidade
     */
    mapFileFinality: function(codFin) {
        const finalityMap = {
            '0': 'Original',
            '1': 'Retificadora',
            '2': 'Complementar',
            '3': 'Desfazimento',
            '9': 'Substituição'
        };

        return finalityMap[codFin] || 'Desconhecida';
    },

    /**
     * Extrai informações da empresa
     * @param {Array} lines - Linhas do arquivo
     * @returns {object} Informações da empresa
     */
    extractCompanyInfo: function(lines) {
        let cnpj = "";
        let ie = "";
        let nome = "";
        let uf = "";
        let codMun = "";
        let suframa = "";
        let regimeTributario = "";

        for (const line of lines) {
            if (line.startsWith('|0000|')) {
                const fields = line.split('|');
                if (fields.length > 11) {
                    // Extrair CNPJ
                    cnpj = fields[10].trim();

                    // Extrair nome
                    nome = fields[6].trim();

                    // Extrair UF
                    uf = fields[8].trim();

                    // Extrair IE
                    ie = fields[11].trim();
                }
            } else if (line.startsWith('|0001|')) {
                const fields = line.split('|');
                if (fields.length > 2) {
                    // Extrair indicador de movimento
                    const indMov = fields[2].trim();
                    if (indMov === '0') {
                        regimeTributario = 'Com Movimento';
                    } else if (indMov === '1') {
                        regimeTributario = 'Sem Movimento';
                    }
                }
            } else if (line.startsWith('|0100|')) {
                const fields = line.split('|');
                if (fields.length > 8) {
                    // Extrair município
                    codMun = fields[8].trim();
                }
            } else if (line.startsWith('|0005|')) {
                const fields = line.split('|');
                if (fields.length > 3) {
                    // Extrair nome fantasia
                    const fantasia = fields[3].trim();
                    if (fantasia) {
                        nome += ` (${fantasia})`;
                    }
                }
            } else if (line.startsWith('|0007|')) {
                const fields = line.split('|');
                if (fields.length > 2) {
                    // Extrair código SUFRAMA
                    suframa = fields[2].trim();
                }
            } else if (line.startsWith('|0010|')) {
                const fields = line.split('|');
                if (fields.length > 2) {
                    // Extrair indicador de tipo de contribuinte para ICMS/IPI
                    const indTipoCont = fields[2].trim();
                    regimeTributario = this.mapTaxRegime(indTipoCont);
                }
            } else if (line.startsWith('|0110|')) {
                const fields = line.split('|');
                if (fields.length > 2) {
                    // Extrair indicador de incidência tributária para PIS/COFINS
                    const codIncTrib = fields[2].trim();
                    const regimePisCofins = this.mapPisCofinsRegime(codIncTrib);
                    if (regimePisCofins) {
                        regimeTributario = regimeTributario ? `${regimeTributario}, ${regimePisCofins}` : regimePisCofins;
                    }
                }
            }
        }

        return {
            cnpj: this.formatCnpj(cnpj),
            ie: ie,
            nome: nome,
            uf: uf,
            codMun: codMun,
            suframa: suframa,
            regimeTributario: regimeTributario
        };
    },

    /**
     * Formata CNPJ para exibição
     * @param {string} cnpj - CNPJ sem formatação
     * @returns {string} CNPJ formatado
     */
    formatCnpj: function(cnpj) {
        if (cnpj.length !== 14) return cnpj;

        return `${cnpj.substr(0, 2)}.${cnpj.substr(2, 3)}.${cnpj.substr(5, 3)}/${cnpj.substr(8, 4)}-${cnpj.substr(12, 2)}`;
    },

    /**
     * Mapeia código de regime tributário para descrição
     * @param {string} indTipoCont - Código do regime
     * @returns {string} Descrição do regime
     */
    mapTaxRegime: function(indTipoCont) {
        const regimeMap = {
            '1': 'Simples Nacional',
            '2': 'Simples Nacional - Excesso de Sublimite',
            '3': 'Regime Normal'
        };

        return regimeMap[indTipoCont] || 'Regime desconhecido';
    },

    /**
     * Mapeia código de regime de PIS/COFINS para descrição
     * @param {string} codIncTrib - Código do regime
     * @returns {string} Descrição do regime
     */
    mapPisCofinsRegime: function(codIncTrib) {
        const regimeMap = {
            '1': 'Lucro Real',
            '2': 'Lucro Presumido',
            '3': 'Lucro Arbitrado',
            '4': 'Entidade Imune/Isenta',
            '5': 'Demais Entidades',
            '6': 'Lucro Presumido e Real (por atividade)',
            '7': 'Lucro Presumido e Real (períodos)',
            '8': 'Tributação pelo Lucro Real',
            '9': 'Tributação pelo Lucro Arbitrado'
        };

        return regimeMap[codIncTrib] || '';
    },

    /**
     * Extrai informações de operações (entradas e saídas)
     * @param {Array} lines - Linhas do arquivo
     * @param {string} fileType - Tipo do arquivo
     * @returns {object} Informações de operações
     */
    extractOperationsInfo: function(lines, fileType) {
        if (fileType === 'ICMS_IPI') {
            return this.extractOperationsIcmsIpi(lines);
        } else {
            return this.extractOperationsContribuicoes(lines);
        }
    },

    /**
     * Extrai informações de operações de ICMS/IPI
     * @param {Array} lines - Linhas do arquivo
     * @returns {object} Informações de operações de ICMS/IPI
     */
    extractOperationsIcmsIpi: function(lines) {
        const resultado = {
            saidas: {
                quantidade: 0,
                valorTotal: 0,
                baseCalculoTotal: 0,
                impostoTotal: 0,
                aliquotaEfetiva: 0
            },
            entradas: {
                quantidade: 0,
                valorTotal: 0,
                baseCalculoTotal: 0,
                impostoTotal: 0,
                aliquotaEfetiva: 0
            }
        };

        // Processar notas fiscais de saída (C100 com indOper = 1)
        // e notas fiscais de entrada (C100 com indOper = 0)
        for (const line of lines) {
            if (line.startsWith('|C100|')) {
                const fields = line.split('|');

                if (fields.length > 12) {
                    const indOper = fields[2].trim();
                    const valorOperacao = parseFloat(fields[12].replace(',', '.') || 0);

                    // 0 = Entrada, 1 = Saída
                    if (indOper === '1') {
                        resultado.saidas.quantidade++;
                        resultado.saidas.valorTotal += valorOperacao;
                    } else if (indOper === '0') {
                        resultado.entradas.quantidade++;
                        resultado.entradas.valorTotal += valorOperacao;
                    }
                }
            } else if (line.startsWith('|C190|')) {
                // Analítica por CST do ICMS
                const fields = line.split('|');

                if (fields.length > 7) {
                    const cstIcms = fields[3].trim();
                    const valorOperacao = parseFloat(fields[5].replace(',', '.') || 0);
                    const valorBaseCalculo = parseFloat(fields[6].replace(',', '.') || 0);
                    const valorIcms = parseFloat(fields[7].replace(',', '.') || 0);

                    // CST de saída geralmente começam com 5 ou 6
                    // CST de entrada geralmente começam com 0, 1, 2, 3 ou 7
                    if (cstIcms.startsWith('5') || cstIcms.startsWith('6')) {
                        resultado.saidas.baseCalculoTotal += valorBaseCalculo;
                        resultado.saidas.impostoTotal += valorIcms;
                    } else {
                        resultado.entradas.baseCalculoTotal += valorBaseCalculo;
                        resultado.entradas.impostoTotal += valorIcms;
                    }
                }
            }
        }

        // Calcular alíquotas efetivas
        if (resultado.saidas.valorTotal > 0) {
            resultado.saidas.aliquotaEfetiva = (resultado.saidas.impostoTotal / resultado.saidas.valorTotal) * 100;
        }

        if (resultado.entradas.valorTotal > 0) {
            resultado.entradas.aliquotaEfetiva = (resultado.entradas.impostoTotal / resultado.entradas.valorTotal) * 100;
        }

        return resultado;
    },

    /**
     * Extrai informações de operações de PIS/COFINS
     * @param {Array} lines - Linhas do arquivo
     * @returns {object} Informações de operações de PIS/COFINS
     */
    extractOperationsContribuicoes: function(lines) {
        const resultado = {
            saidas: {
                quantidade: 0,
                valorTotal: 0,
                baseCalculoTotal: 0,
                impostoTotal: 0,
                aliquotaEfetiva: 0
            },
            entradas: {
                quantidade: 0,
                valorTotal: 0,
                baseCalculoTotal: 0,
                impostoTotal: 0,
                aliquotaEfetiva: 0
            }
        };

        // Processar notas fiscais (registros de documentos)
        // Documentos de saída: D100, D300, C100 (indOper=1), etc.
        // Documentos de entrada: C100 (indOper=0)
        for (const line of lines) {
            if (line.startsWith('|C100|')) {
                const fields = line.split('|');

                if (fields.length > 12) {
                    const indOper = fields[2].trim();
                    const valorOperacao = parseFloat(fields[12].replace(',', '.') || 0);

                    // 0 = Entrada, 1 = Saída
                    if (indOper === '1') {
                        resultado.saidas.quantidade++;
                        resultado.saidas.valorTotal += valorOperacao;
                    } else if (indOper === '0') {
                        resultado.entradas.quantidade++;
                        resultado.entradas.valorTotal += valorOperacao;
                    }
                }
            } else if (line.startsWith('|D100|')) {
                // Documento de transporte (geralmente saída)
                const fields = line.split('|');

                if (fields.length > 14) {
                    const indOper = fields[2].trim();
                    const valorOperacao = parseFloat(fields[14].replace(',', '.') || 0);

                    resultado.saidas.quantidade++;
                    resultado.saidas.valorTotal += valorOperacao;
                }
            } else if (line.startsWith('|M210|') || line.startsWith('|M610|')) {
                // Resumo da contribuição para PIS ou COFINS
                const fields = line.split('|');

                if (fields.length > 10) {
                    const valorBaseCalculo = parseFloat(fields[4].replace(',', '.') || 0);
                    const aliquota = parseFloat(fields[5].replace(',', '.') || 0);
                    const valorContribuicao = parseFloat(fields[10].replace(',', '.') || 0);

                    resultado.saidas.baseCalculoTotal += valorBaseCalculo;
                    resultado.saidas.impostoTotal += valorContribuicao;
                }
            }
        }

        // Calcular alíquotas efetivas
        if (resultado.saidas.valorTotal > 0) {
            resultado.saidas.aliquotaEfetiva = (resultado.saidas.impostoTotal / resultado.saidas.valorTotal) * 100;
        }

        if (resultado.entradas.valorTotal > 0) {
            resultado.entradas.aliquotaEfetiva = (resultado.entradas.impostoTotal / resultado.entradas.valorTotal) * 100;
        }

        return resultado;
    },

    /**
     * Extrai informações de créditos tributários
     * @param {Array} lines - Linhas do arquivo
     * @param {string} fileType - Tipo do arquivo
     * @returns {object} Informações de créditos tributários
     */
    extractTaxCreditsInfo: function(lines, fileType) {
        if (fileType === 'ICMS_IPI') {
            return this.extractTaxCreditsIcmsIpi(lines);
        } else {
            return this.extractTaxCreditsContribuicoes(lines);
        }
    },

    /**
     * Extrai informações de créditos de ICMS/IPI
     * @param {Array} lines - Linhas do arquivo
     * @returns {object} Informações de créditos de ICMS/IPI
     */
    extractTaxCreditsIcmsIpi: function(lines) {
        let saldoCredorAnterior = 0;
        let creditosApurados = 0;
        let debitosApurados = 0;
        let saldoDevedorApurado = 0;
        let saldoCredorTransportar = 0;

        // Processar registros de apuração de ICMS
        for (const line of lines) {
            if (line.startsWith('|E110|')) {
                const fields = line.split('|');

                if (fields.length > 14) {
                    saldoCredorAnterior = parseFloat(fields[2].replace(',', '.') || 0);
                    creditosApurados = parseFloat(fields[6].replace(',', '.') || 0);
                    debitosApurados = parseFloat(fields[7].replace(',', '.') || 0);
                    saldoDevedorApurado = parseFloat(fields[11].replace(',', '.') || 0);
                    saldoCredorTransportar = parseFloat(fields[14].replace(',', '.') || 0);
                }

                break;
            }
        }

        return {
            saldoCredorAnterior: saldoCredorAnterior,
            creditosApurados: creditosApurados,
            debitosApurados: debitosApurados,
            saldoDevedorApurado: saldoDevedorApurado,
            saldoCredorTransportar: saldoCredorTransportar,
            creditosPendentes: saldoCredorTransportar > 0 ? saldoCredorTransportar : 0
        };
    },

    /**
     * Extrai informações de créditos de PIS/COFINS
     * @param {Array} lines - Linhas do arquivo
     * @returns {object} Informações de créditos de PIS/COFINS
     */
    extractTaxCreditsContribuicoes: function(lines) {
        let creditosPisDisponivel = 0;
        let creditosCofinsDisponivel = 0;
        let creditosPisUtilizado = 0;
        let creditosCofinsUtilizado = 0;

        // Processar registros de controle de créditos de PIS
        for (const line of lines) {
            if (line.startsWith('|M500|')) {
                const fields = line.split('|');

                if (fields.length > 8) {
                    const valorCredito = parseFloat(fields[8].replace(',', '.') || 0);
                    creditosPisDisponivel += valorCredito;
                }
            } else if (line.startsWith('|M600|')) {
                const fields = line.split('|');

                if (fields.length > 8) {
                    const valorCredito = parseFloat(fields[8].replace(',', '.') || 0);
                    creditosPisUtilizado += valorCredito;
                }
            } else if (line.startsWith('|M900|')) {
                const fields = line.split('|');

                if (fields.length > 8) {
                    const valorCredito = parseFloat(fields[8].replace(',', '.') || 0);
                    creditosCofinsDisponivel += valorCredito;
                }
            } else if (line.startsWith('|M990|')) {
                const fields = line.split('|');

                if (fields.length > 8) {
                    const valorCredito = parseFloat(fields[8].replace(',', '.') || 0);
                    creditosCofinsUtilizado += valorCredito;
                }
            }
        }

        const creditosPisPendentes = creditosPisDisponivel - creditosPisUtilizado;
        const creditosCofinsPendentes = creditosCofinsDisponivel - creditosCofinsUtilizado;

        return {
            creditosPisDisponivel: creditosPisDisponivel,
            creditosCofinsDisponivel: creditosCofinsDisponivel,
            creditosPisUtilizado: creditosPisUtilizado,
            creditosCofinsUtilizado: creditosCofinsUtilizado,
            creditosPisPendentes: creditosPisPendentes > 0 ? creditosPisPendentes : 0,
            creditosCofinsPendentes: creditosCofinsPendentes > 0 ? creditosCofinsPendentes : 0,
            creditosPendentesTotal: (creditosPisPendentes > 0 ? creditosPisPendentes : 0) + 
                                    (creditosCofinsPendentes > 0 ? creditosCofinsPendentes : 0)
        };
    }
};

// Exportar o parser para uso global
window.SpedEfdParser = SpedEfdParser;
```

### 3.6. Arquivo: `js/import/parsers/sped-ecd-parser.js` (Novo)

Este módulo processará os arquivos SPED ECD:

```javascript
/**
 * Parser para arquivos SPED ECD (Escrituração Contábil Digital)
 * Extrai informações relevantes para o simulador de Split Payment
 */
const SpedEcdParser = {
    /**
     * Processa um arquivo SPED ECD
     * @param {string} fileContent - Conteúdo do arquivo SPED
     * @returns {object} Objeto com informações estruturadas do SPED
     */
    parse: function(fileContent) {
        try {
            // Dividir o conteúdo em linhas
            const lines = fileContent.split(/\r?\n/);

            // Dados extraídos
            const dados = {
                empresa: {},
                contasPagar: {},
                contasReceber: {},
                cicloOperacional: {},
                estruturaFinanceira: {}
            };

            // Extrair informações da empresa
            dados.empresa = this.extrairDadosEmpresa(lines);

            // Extrair contas a pagar
            dados.contasPagar = this.extrairContasPagar(lines);

            // Extrair contas a receber
            dados.contasReceber = this.extrairContasReceber(lines);

            // Calcular ciclo operacional
            dados.cicloOperacional = this.calcularCicloOperacional(dados.contasPagar, dados.contasReceber, lines);

            // Extrair estrutura financeira
            dados.estruturaFinanceira = this.extrairEstruturaFinanceira(lines);

            return dados;
        } catch (error) {
            console.error('Erro ao processar arquivo SPED ECD:', error);
            throw new Error('Falha ao analisar o arquivo SPED ECD: ' + error.message);
        }
    },

    /**
     * Extrai informações básicas da empresa do arquivo SPED
     * @param {array} lines - Linhas do arquivo SPED
     * @returns {object} Dados da empresa
     */
    extrairDadosEmpresa: function(lines) {
        const empresa = {
            nome: '',
            cnpj: '',
            atividade: '',
            regimeTributario: ''
        };

        // Processar cabeçalho para informações da empresa
        for (const line of lines) {
            if (line.startsWith('|0000|')) {
                const campos = line.split('|');
                // Índices dos campos conforme layout SPED ECD
                if (campos.length > 5) {
                    empresa.cnpj = campos[4];
                }
            } else if (line.startsWith('|0010|')) {
                const campos = line.split('|');
                if (campos.length > 3) {
                    // Determinar regime tributário
                    empresa.regimeTributario = campos[3] === '1' ? 'Lucro Real' : 
                                              campos[3] === '2' ? 'Lucro Presumido' : 
                                              campos[3] === '3' ? 'Simples Nacional' : 'Outros';
                }
            } else if (line.startsWith('|0020|')) {
                const campos = line.split('|');
                if (campos.length > 3) {
                    empresa.nome = campos[3];
                }
            } else if (line.startsWith('|0030|')) {
                const campos = line.split('|');
                if (campos.length > 5) {
                    empresa.atividade = campos[5];
                }
            }
        }

        return empresa;
    },

    /**
     * Extrai informações sobre contas a pagar
     * @param {array} lines - Linhas do arquivo SPED
     * @returns {object} Dados estruturados de contas a pagar
     */
    extrairContasPagar: function(lines) {
        const contasPagar = {
            total: 0,
            prazos: {
                ate30Dias: 0,
                de31a60Dias: 0,
                de61a90Dias: 0,
                acimaDe90Dias: 0
            },
            prazoMedio: 0
        };

        let totalPonderado = 0;

        // Localizar registros de contas a pagar (fornecedores)
        for (const line of lines) {
            if (line.startsWith('|I050|') && line.includes('FORNECEDORES')) {
                // Extrair código da conta
                const codigoConta = line.split('|')[3];

                // Processar lançamentos desta conta
                for (const lancamento of lines) {
                    if (lancamento.startsWith('|I200|') && lancamento.includes(codigoConta)) {
                        const campos = lancamento.split('|');
                        if (campos.length > 6) {
                            const valor = parseFloat(campos[5].replace(',', '.'));
                            const prazo = parseInt(campos[6]);

                            contasPagar.total += valor;

                            // Classificar por prazo
                            if (prazo <= 30) {
                                contasPagar.prazos.ate30Dias += valor;
                                totalPonderado += valor * prazo;
                            } else if (prazo <= 60) {
                                contasPagar.prazos.de31a60Dias += valor;
                                totalPonderado += valor * prazo;
                            } else if (prazo <= 90) {
                                contasPagar.prazos.de61a90Dias += valor;
                                totalPonderado += valor * prazo;
                            } else {
                                contasPagar.prazos.acimaDe90Dias += valor;
                                totalPonderado += valor * prazo;
                            }
                        }
                    }
                }
            }
        }

        // Calcular prazo médio ponderado
        if (contasPagar.total > 0) {
            contasPagar.prazoMedio = Math.round(totalPonderado / contasPagar.total);
        }

        return contasPagar;
    },

    /**
     * Extrai informações sobre contas a receber
     * @param {array} lines - Linhas do arquivo SPED
     * @returns {object} Dados estruturados de contas a receber
     */
    extrairContasReceber: function(lines) {
        const contasReceber = {
            total: 0,
            prazos: {
                aVista: 0,
                ate30Dias: 0,
                de31a60Dias: 0,
                de61a90Dias: 0,
                acimaDe90Dias: 0
            },
            prazoMedio: 0
        };

        let totalPonderado = 0;

        // Localizar registros de contas a receber (clientes)
        for (const line of lines) {
            if (line.startsWith('|I050|') && line.includes('CLIENTES')) {
                // Extrair código da conta
                const codigoConta = line.split('|')[3];

                // Processar lançamentos desta conta
                for (const lancamento of lines) {
                    if (lancamento.startsWith('|I200|') && lancamento.includes(codigoConta)) {
                        const campos = lancamento.split('|');
                        if (campos.length > 6) {
                            const valor = parseFloat(campos[5].replace(',', '.'));
                            const prazo = parseInt(campos[6]);

                            contasReceber.total += valor;

                            // Classificar por prazo
                            if (prazo === 0) {
                                contasReceber.prazos.aVista += valor;
                            } else if (prazo <= 30) {
                                contasReceber.prazos.ate30Dias += valor;
                                totalPonderado += valor * prazo;
                            } else if (prazo <= 60) {
                                contasReceber.prazos.de31a60Dias += valor;
                                totalPonderado += valor * prazo;
                            } else if (prazo <= 90) {
                                contasReceber.prazos.de61a90Dias += valor;
                                totalPonderado += valor * prazo;
                            } else {
                                contasReceber.prazos.acimaDe90Dias += valor;
                                totalPonderado += valor * prazo;
                            }
                        }
                    }
                }
            }
        }

        // Calcular prazo médio ponderado (excluindo à vista)
        const totalPrazo = contasReceber.total - contasReceber.prazos.aVista;
        if (totalPrazo > 0) {
            contasReceber.prazoMedio = Math.round(totalPonderado / totalPrazo);
        }

        return contasReceber;
    },

    /**
     * Calcula o ciclo operacional com base nos dados extraídos
     * @param {object} contasPagar - Dados de contas a pagar
     * @param {object} contasReceber - Dados de contas a receber
     * @param {array} lines - Linhas do arquivo SPED
     * @returns {object} Dados do ciclo operacional
     */
    calcularCicloOperacional: function(contasPagar, contasReceber, lines) {
        const ciclo = {
            prazoMedioEstoque: 0,
            prazoMedioRecebimento: contasReceber.prazoMedio,
            prazoMedioPagamento: contasPagar.prazoMedio,
            cicloFinanceiro: 0,
            cicloOperacional: 0
        };

        // Calcular prazo médio de estoque
        ciclo.prazoMedioEstoque = this.calcularPrazoMedioEstoque(lines);

        // Calcular ciclo operacional (PME + PMR)
        ciclo.cicloOperacional = ciclo.prazoMedioEstoque + ciclo.prazoMedioRecebimento;

        // Calcular ciclo financeiro (PME + PMR - PMP)
        ciclo.cicloFinanceiro = ciclo.cicloOperacional - ciclo.prazoMedioPagamento;

        return ciclo;
    },

    /**
     * Calcula o prazo médio de estoque com base nos lançamentos
     * @param {array} lines - Linhas do arquivo SPED
     * @returns {number} Prazo médio de estoque em dias
     */
    calcularPrazoMedioEstoque: function(lines) {
        let custoMercadoriasVendidas = 0;
        let estoqueInicial = 0;
        let estoqueFinal = 0;

        // Localizar valores de CMV e estoques
        for (const line of lines) {
            if (line.startsWith('|I050|') && line.includes('CUSTO MERCADORIAS VENDIDAS')) {
                const codigoConta = line.split('|')[3];

                for (const lancamento of lines) {
                    if (lancamento.startsWith('|I200|') && lancamento.includes(codigoConta)) {
                        const campos = lancamento.split('|');
                        if (campos.length > 5) {
                            custoMercadoriasVendidas += parseFloat(campos[5].replace(',', '.'));
                        }
                    }
                }
            } else if (line.startsWith('|I050|') && line.includes('ESTOQUES')) {
                const codigoConta = line.split('|')[3];

                // Identificar saldo inicial
                for (const saldo of lines) {
                    if (saldo.startsWith('|I155|') && saldo.includes(codigoConta) && saldo.includes('INICIAL')) {
                        const campos = saldo.split('|');
                        if (campos.length > 5) {
                            estoqueInicial = parseFloat(campos[5].replace(',', '.'));
                        }
                    }
                }

                // Identificar saldo final
                for (const saldo of lines) {
                    if (saldo.startsWith('|I155|') && saldo.includes(codigoConta) && saldo.includes('FINAL')) {
                        const campos = saldo.split('|');
                        if (campos.length > 5) {
                            estoqueFinal = parseFloat(campos[5].replace(',', '.'));
                        }
                    }
                }
            }
        }

        // Calcular prazo médio de estoque
        if (custoMercadoriasVendidas > 0) {
            const estoqueMediano = (estoqueInicial + estoqueFinal) / 2;
            return Math.round((estoqueMediano / custoMercadoriasVendidas) * 365);
        }

        return 0;
    },

    /**
     * Extrai informações sobre a estrutura financeira da empresa
     * @param {array} lines - Linhas do arquivo SPED
     * @returns {object} Dados da estrutura financeira
     */
    extrairEstruturaFinanceira: function(lines) {
        const estrutura = {
            ativoCirculante: 0,
            ativoTotal: 0,
            passivoCirculante: 0,
            passivoTotal: 0,
            patrimonioLiquido: 0,
            receitas: 0,
            lucroLiquido: 0,
            obrigacoesFiscais: {
                ibs: 0,
                cbs: 0,
                outros: 0,
                total: 0
            }
        };

        // Processar balancete para estrutura financeira
        for (const line of lines) {
            if (line.startsWith('|I050|')) {
                const campos = line.split('|');
                const codigoConta = campos[3];
                const nomeConta = campos[4];

                // Identificar classificação da conta
                for (const saldo of lines) {
                    if (saldo.startsWith('|I155|') && saldo.includes(codigoConta) && saldo.includes('FINAL')) {
                        const camposSaldo = saldo.split('|');
                        if (camposSaldo.length > 5) {
                            const valor = parseFloat(camposSaldo[5].replace(',', '.'));

                            // Classificar em grupos de contas
                            if (nomeConta.includes('ATIVO CIRCULANTE')) {
                                estrutura.ativoCirculante += valor;
                            }

                            if (nomeConta.includes('ATIVO')) {
                                estrutura.ativoTotal += valor;
                            }

                            if (nomeConta.includes('PASSIVO CIRCULANTE')) {
                                estrutura.passivoCirculante += valor;
                            }

                            if (nomeConta.includes('PASSIVO')) {
                                estrutura.passivoTotal += valor;
                            }

                            if (nomeConta.includes('PATRIMONIO LIQUIDO')) {
                                estrutura.patrimonioLiquido += valor;
                            }

                            if (nomeConta.includes('RECEITA')) {
                                estrutura.receitas += valor;
                            }

                            if (nomeConta.includes('LUCRO LIQUIDO')) {
                                estrutura.lucroLiquido += valor;
                            }

                            // Obrigações fiscais
                            if (nomeConta.includes('TRIBUTOS A RECOLHER') || nomeConta.includes('OBRIGACOES FISCAIS')) {
                                if (nomeConta.includes('IBS')) {
                                    estrutura.obrigacoesFiscais.ibs += valor;
                                } else if (nomeConta.includes('CBS')) {
                                    estrutura.obrigacoesFiscais.cbs += valor;
                                } else {
                                    estrutura.obrigacoesFiscais.outros += valor;
                                }

                                estrutura.obrigacoesFiscais.total += valor;
                            }
                        }
                    }
                }
            }
        }

        return estrutura;
    }
};

// Exportar o módulo
export default SpedEcdParser;
```

# Análise da Implementação de Importação de Dados para o Simulador de Split Payment

Após avaliar detalhadamente a implementação proposta para a funcionalidade de importação de dados no simulador de Split Payment, posso afirmar que a arquitetura está bem estruturada e abrange os principais componentes necessários. No entanto, existem alguns pontos que poderiam ser aprimorados ou adicionados para tornar a solução mais robusta, segura e amigável ao usuário.

## Pontos Fortes da Implementação Atual

A implementação apresenta várias características positivas que merecem destaque:

- **Arquitetura modular bem definida**: com separação clara entre interface, parsers e adaptadores
- **Suporte a múltiplos formatos** (XML NFe, SPED EFD, SPED ECD)
- **Interface intuitiva** com suporte a drag & drop
- **Pré-visualização dos dados** antes da aplicação
- **Integração com o formulário existente** do simulador

## Sugestões de Aprimoramento

### 1. Segurança e Validação

A implementação atual carece de alguns mecanismos de segurança importantes:

```javascript
// Adicionar ao arquivo import-manager.js, dentro da função initUploadHandlers

// Definir tamanho máximo de arquivo (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Validação de tamanho ao processar arquivos
if (file.size > MAX_FILE_SIZE) {
    alert(`O arquivo ${file.name} excede o tamanho máximo permitido (10MB).`);
    return;
}

// Adicionar validação de estrutura para XML de NFe
function validarEstruturaXML(xmlContent) {
    // Verificar elementos mínimos obrigatórios
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, "text/xml");

    // Verificar se não é um documento XML inválido
    if (xmlDoc.getElementsByTagName('parsererror').length > 0) {
        return {
            valido: false,
            mensagem: "O arquivo não é um XML válido."
        };
    }

    // Verificar se possui elemento NFe ou nfeProc
    const nfeNode = xmlDoc.getElementsByTagName('NFe')[0] || 
                   xmlDoc.getElementsByTagName('nfeProc')[0];

    if (!nfeNode) {
        return {
            valido: false,
            mensagem: "O arquivo XML não contém um documento NFe válido."
        };
    }

    return { valido: true };
}
```

### 2. Feedback Visual e Usabilidade

O feedback durante o processamento e upload poderia ser melhorado:

```javascript
// Adicionar ao CSS
```css
.upload-progress {
    width: 100%;
    height: 4px;
    background-color: #f0f0f0;
    margin-top: 10px;
    position: relative;
    overflow: hidden;
}

.upload-progress-bar {
    height: 100%;
    background-color: #4285F4;
    width: 0%;
    transition: width 0.3s ease;
}

.drag-active {
    background-color: rgba(66, 133, 244, 0.1);
    border-color: #4285F4;
}

.file-item {
    animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}

.clear-all-button {
    margin-top: 10px;
    font-size: 14px;
    color: #e74c3c;
    background: none;
    border: none;
    cursor: pointer;
    padding: 5px 10px;
    display: inline-flex;
    align-items: center;
}

.clear-all-button:hover {
    text-decoration: underline;
}
```

E no JavaScript:

```javascript
// Adicionar eventos para melhorar o feedback de drag & drop
const dropZones = document.querySelectorAll('.file-upload-container');
dropZones.forEach(zone => {
    zone.addEventListener('dragenter', function(e) {
        e.preventDefault();
        e.stopPropagation();
        this.classList.add('drag-active');
    });

    zone.addEventListener('dragleave', function(e) {
        e.preventDefault();
        e.stopPropagation();
        this.classList.remove('drag-active');
    });

    zone.addEventListener('drop', function(e) {
        this.classList.remove('drag-active');
    });
});

// Adicionar botão para limpar todos os arquivos
function addClearAllButton(fileListElement) {
    const clearButton = document.createElement('button');
    clearButton.className = 'clear-all-button';
    clearButton.innerHTML = '<i class="fas fa-trash"></i> Limpar todos';
    clearButton.addEventListener('click', function() {
        fileListElement.innerHTML = '';
        // Limpar input file correspondente
        const fileInput = fileListElement.parentElement.querySelector('input[type="file"]');
        if (fileInput) {
            fileInput.value = '';
        }
    });

    if (fileListElement.children.length > 0) {
        fileListElement.parentElement.appendChild(clearButton);
    }
}
```

### 3. Tratamento de Erros Mais Robusto

Implementação de um sistema de logs e tratamento de erros mais detalhado:

```javascript
// Adicionar ao arquivo import-manager.js

const ImportLogger = {
    logLevel: 'info', // 'debug', 'info', 'warn', 'error'

    debug: function(message, data) {
        if (['debug'].includes(this.logLevel)) {
            console.debug(`[Import Debug] ${message}`, data || '');
        }
    },

    info: function(message, data) {
        if (['debug', 'info'].includes(this.logLevel)) {
            console.info(`[Import Info] ${message}`, data || '');
        }
    },

    warn: function(message, data) {
        if (['debug', 'info', 'warn'].includes(this.logLevel)) {
            console.warn(`[Import Warning] ${message}`, data || '');
        }
    },

    error: function(message, error) {
        if (['debug', 'info', 'warn', 'error'].includes(this.logLevel)) {
            console.error(`[Import Error] ${message}`, error || '');
        }

        // Exibir mensagem amigável para o usuário
        const errorMessage = error && error.message ? error.message : 'Erro desconhecido';
        this.showUserError(message, errorMessage);
    },

    showUserError: function(title, details) {
        // Criar um elemento de alerta para o usuário
        const alertElement = document.createElement('div');
        alertElement.className = 'import-error-alert';
        alertElement.innerHTML = `
            <div class="error-title">${title}</div>
            <div class="error-details">${details}</div>
            <button class="error-close">×</button>
        `;

        // Adicionar ao DOM
        document.body.appendChild(alertElement);

        // Adicionar evento para fechar
        alertElement.querySelector('.error-close').addEventListener('click', function() {
            alertElement.remove();
        });

        // Auto-remover após 10 segundos
        setTimeout(() => {
            if (document.body.contains(alertElement)) {
                alertElement.remove();
            }
        }, 10000);
    }
};

// Exemplo de uso nos parsers
try {
    // Código de parsing
} catch (error) {
    ImportLogger.error('Falha ao processar arquivo', error);
    throw error; // Re-throw para tratamento acima
}
```

### 4. Persistência e Histórico de Importações

```javascript
// Adicionar ao arquivo import-manager.js

const ImportStorage = {
    storageKey: 'splitpayment_import_history',

    saveImportHistory: function(importData) {
        try {
            // Obter histórico existente
            const history = this.getImportHistory();

            // Adicionar nova importação com timestamp
            const newImport = {
                timestamp: new Date().toISOString(),
                type: importData.type,
                summary: this.generateSummary(importData),
                data: importData
            };

            // Limitar a 10 importações mais recentes
            history.unshift(newImport);
            if (history.length > 10) {
                history.pop();
            }

            // Salvar
            localStorage.setItem(this.storageKey, JSON.stringify(history));

            return true;
        } catch (error) {
            ImportLogger.error('Falha ao salvar histórico de importação', error);
            return false;
        }
    },

    getImportHistory: function() {
        try {
            const historyJson = localStorage.getItem(this.storageKey);
            return historyJson ? JSON.parse(historyJson) : [];
        } catch (error) {
            ImportLogger.error('Falha ao recuperar histórico de importação', error);
            return [];
        }
    },

    clearImportHistory: function() {
        localStorage.removeItem(this.storageKey);
    },

    generateSummary: function(importData) {
        // Gerar um resumo dos dados importados
        switch (importData.type) {
            case 'nfe':
                return `${importData.data.length} Notas Fiscais - Total: R$ ${this.formatNumber(importData.totalValue)}`;
            case 'spedFiscal':
                return `SPED Fiscal - Período: ${importData.data.period}`;
            case 'spedContabil':
                return `SPED Contábil - Período: ${importData.data.period}`;
            default:
                return 'Importação realizada';
        }
    },

    formatNumber: function(number) {
        return number.toFixed(2).replace('.', ',');
    }
};

// Adicionar interface de histórico no HTML
```

### 5. Suporte a Formatos Adicionais

```javascript
// Adicionar ao arquivo import-manager.js, dentro do método init

// Adicionar suporte a CSV e Excel
const csvInput = document.getElementById('csv-file-upload');
if (csvInput) {
    csvInput.addEventListener('change', this.handleCsvUpload.bind(this));
}

const excelInput = document.getElementById('excel-file-upload');
if (excelInput) {
    excelInput.addEventListener('change', this.handleExcelUpload.bind(this));
}

// Implementar os métodos de handler para CSV e Excel
handleCsvUpload: function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const csvContent = event.target.result;
            // Processar CSV usando biblioteca como PapaParse
            Papa.parse(csvContent, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    if (results.data && results.data.length > 0) {
                        // Processar dados CSV
                        this.importedData.csv = results.data;
                        this.updatePreview();
                    }
                },
                error: (error) => {
                    ImportLogger.error('Erro ao processar CSV', error);
                }
            });
        } catch (error) {
            ImportLogger.error('Falha ao ler arquivo CSV', error);
        }
    };
    reader.readAsText(file);
}

handleExcelUpload: function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const data = new Uint8Array(event.target.result);
            const workbook = XLSX.read(data, { type: 'array' });

            // Processar a primeira planilha
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet);

            if (jsonData && jsonData.length > 0) {
                // Processar dados Excel
                this.importedData.excel = jsonData;
                this.updatePreview();
            }
        } catch (error) {
            ImportLogger.error('Falha ao ler arquivo Excel', error);
        }
    };
    reader.readAsArrayBuffer(file);
}
```

### 6. Documentação e Ajuda

Adicionar uma seção de ajuda para orientar os usuários:

```html
<!-- Adicionar ao HTML da tela de importação -->
<div class="import-help-section">
    <h3>Ajuda para Importação</h3>
    <div class="import-help-content">
        <div class="import-help-item">
            <h4>XML de Notas Fiscais (NF-e)</h4>
            <p>Arquivos XML de Notas Fiscais Eletrônicas. Você pode importar múltiplos arquivos de uma só vez.</p>
            <p><strong>Dados extraídos:</strong> Informações fiscais, valores, alíquotas, prazos de pagamento.</p>
        </div>

        <div class="import-help-item">
            <h4>SPED EFD (ICMS/IPI e Contribuições)</h4>
            <p>Arquivos de Escrituração Fiscal Digital no formato TXT.</p>
            <p><strong>Dados extraídos:</strong> Resumo de operações fiscais, créditos acumulados, alíquotas efetivas.</p>
        </div>

        <div class="import-help-item">
            <h4>SPED ECD (Contábil)</h4>
            <p>Arquivos de Escrituração Contábil Digital no formato TXT.</p>
            <p><strong>Dados extraídos:</strong> Ciclo financeiro, prazos médios, estrutura financeira.</p>
        </div>
    </div>
</div>
```

### 7. Implementação de Testes

```javascript
// Criar um arquivo js/import/tests/test-runner.js

const ImportTester = {
    runTests: function() {
        console.group('Testes de Importação');
        this.testNFeParser();
        this.testSpedEfdParser();
        this.testSpedEcdParser();
        this.testDataAdapter();
        console.groupEnd();
    },

    testNFeParser: function() {
        console.group('Teste de NFeParser');

        // Dados de teste
        const xmlSample = `<?xml version="1.0" encoding="UTF-8"?>
        <nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
            <NFe>
                <infNFe Id="NFe31200000000000">
                    <!-- Conteúdo de teste -->
                </infNFe>
            </NFe>
        </nfeProc>`;

        try {
            // Testar validação
            const validationResult = NFeParser.isValidNFe(
                new DOMParser().parseFromString(xmlSample, "text/xml")
            );
            console.assert(validationResult === true, 'Validação de XML NFe');

            console.log('✓ Todos os testes de NFeParser passaram');
        } catch (error) {
            console.error('✗ Falha nos testes de NFeParser', error);
        }

        console.groupEnd();
    },

    // Implementar testes para os outros parsers...

    testDataAdapter: function() {
        // Testes para adaptadores de dados
    }
};

// Executar testes em ambiente de desenvolvimento
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    document.addEventListener('DOMContentLoaded', function() {
        // Adicionar botão de teste ao painel de desenvolvedor
        const devPanel = document.createElement('div');
        devPanel.style.position = 'fixed';
        devPanel.style.bottom = '10px';
        devPanel.style.right = '10px';
        devPanel.style.zIndex = '9999';
        devPanel.innerHTML = `
            <button id="run-import-tests" style="padding: 5px 10px; background: #333; color: white; border: none; border-radius: 4px;">
                Executar Testes de Importação
            </button>
        `;
        document.body.appendChild(devPanel);

        document.getElementById('run-import-tests').addEventListener('click', function() {
            ImportTester.runTests();
        });
    });
}
```

## Monitoramento e Analytics

Para acompanhar o uso da funcionalidade e identificar possíveis problemas, seria útil implementar um sistema de analytics:

```javascript
// Adicionar ao arquivo import-manager.js

const ImportAnalytics = {
    trackEvent: function(category, action, label, value) {
        if (typeof gtag !== 'undefined') {
            gtag('event', action, {
                'event_category': category,
                'event_label': label,
                'value': value
            });
        }

        // Log interno
        ImportLogger.debug('Analytics Event', { category, action, label, value });
    },

    trackImportAttempt: function(fileType) {
        this.trackEvent('Import', 'Attempt', fileType);
    },

    trackImportSuccess: function(fileType, fileCount, dataSize) {
        this.trackEvent('Import', 'Success', fileType, dataSize);
    },

    trackImportError: function(fileType, errorType) {
        this.trackEvent('Import', 'Error', `${fileType} - ${errorType}`);
    },

    trackDataApplication: function(dataSource) {
        this.trackEvent('Import', 'Apply', dataSource);
    }
};

// Exemplo de uso:
// ImportAnalytics.trackImportAttempt('nfe');
```

## Conclusão

A implementação da funcionalidade de importação de dados para o simulador de Split Payment está bem estruturada e cobre os principais cenários de uso. As sugestões apresentadas acima visam aprimorar a solução em aspectos como segurança, usabilidade, robustez e manutenibilidade.

Principais pontos a considerar para a implementação:

1. **Melhorar segurança** com validação de arquivos e tratamento adequado de entrada
2. **Aprimorar feedback visual** durante o upload e processamento
3. **Implementar tratamento de erros** mais detalhado e amigável
4. **Adicionar persistência** de dados e histórico de importações
5. **Expandir suporte** para formatos adicionais como CSV e Excel
6. **Incluir documentação** e ajuda contextual para os usuários
7. **Implementar testes** para garantir a qualidade da funcionalidade

Estas melhorias garantirão uma experiência mais fluida e confiável para os usuários, além de facilitar a manutenção e evolução futura da funcionalidade.
