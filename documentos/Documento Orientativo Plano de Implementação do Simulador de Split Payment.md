# Documento Orientativo: Plano de Implementação do Simulador de Split Payment

Este documento estabelece um plano estruturado para a implementação do Simulador de Split Payment em etapas modulares, cada uma adequada para um prompt separado. Esta abordagem permitirá manter a continuidade do desenvolvimento enquanto divide o trabalho em partes gerenciáveis.

## 1. Estrutura de Divisão do Trabalho

### Fase 1: Fundação do Sistema (Prompts 1-3)

- **Prompt 1**: Estrutura de dados e módulos core do sistema
- **Prompt 2**: Interface básica e sistema de navegação
- **Prompt 3**: Módulo de cálculos fundamentais

### Fase 2: Funcionalidades Principais (Prompts 4-6)

- **Prompt 4**: Visualização de resultados e gráficos
- **Prompt 5**: Memória de cálculo e auditoria
- **Prompt 6**: Estratégias de mitigação

### Fase 3: Funcionalidades de Exportação e Refinamento (Prompts 7-8)

- **Prompt 7**: Exportação para PDF e Excel
- **Prompt 8**: Testes, validação e otimizações finais

## 2. Detalhamento dos Prompts

### Prompt 1: Estrutura de Dados e Módulos Core

**Objetivo**: Estabelecer a fundação do sistema. **Entregáveis**:

- Definição das estruturas de dados principais
- Esqueleto dos módulos fundamentais
- Sistema de gerenciamento de estado
- Mecanismo para persistência de dados (localStorage)

**Formato da Solicitação**:

```
Com base no documento orientativo, implemente a estrutura de dados e módulos core para o simulador de Split Payment. Utilize JavaScript modular e mantenha a compatibilidade com as bibliotecas Chart.js, jsPDF e XLSX.
```

### Prompt 2: Interface Básica e Sistema de Navegação

**Objetivo**: Criar a estrutura visual e o sistema de navegação. **Entregáveis**:

- HTML base para todas as abas
- CSS para estilização
- Sistema de navegação entre abas
- Formulários de entrada para todas as seções

**Formato da Solicitação**:

```
Continuando o desenvolvimento do simulador de Split Payment, implemente a interface básica e o sistema de navegação. Utilize o HTML e CSS fornecidos no arquivo modelo e adapte conforme necessário para nosso sistema modular.
```

### Prompt 3: Módulo de Cálculos Fundamentais

**Objetivo**: Implementar os cálculos essenciais do simulador. **Entregáveis**:

- Função para cálculo do fluxo de caixa atual
- Função para cálculo do fluxo de caixa com Split Payment
- Função para cálculo do impacto no capital de giro
- Função para projeção temporal

**Formato da Solicitação**:

```
Baseado nos módulos core já implementados, desenvolva o módulo de cálculos fundamentais para o simulador de Split Payment. Implemente as funções necessárias para calcular o impacto no fluxo de caixa e capital de giro.
```

### Prompt 4: Visualização de Resultados e Gráficos

**Objetivo**: Implementar a visualização dos resultados e gráficos. **Entregáveis**:

- Função para exibição dos resultados em tabelas
- Implementação dos quatro gráficos principais
- Sistema de atualização dinâmica dos gráficos

**Formato da Solicitação**:

```
Continuando o desenvolvimento do simulador, implemente a visualização de resultados e os gráficos conforme especificado no documento orientativo. Utilize a biblioteca Chart.js e integre com os módulos de cálculo já desenvolvidos.
```

### Prompt 5: Memória de Cálculo e Auditoria

**Objetivo**: Implementar a geração da memória de cálculo detalhada. **Entregáveis**:

- Função para geração da memória de cálculo por ano
- Sistema de visualização da memória de cálculo
- Mecanismo de auditoria e validação dos cálculos

**Formato da Solicitação**:

```
Com base nos módulos já desenvolvidos, implemente a funcionalidade de memória de cálculo e auditoria para o simulador de Split Payment, permitindo visualizar todos os cálculos detalhados por ano.
```

### Prompt 6: Estratégias de Mitigação

**Objetivo**: Implementar os cálculos e visualizações das estratégias de mitigação. **Entregáveis**:

- Implementação de todas as estratégias de mitigação
- Cálculos específicos para cada estratégia
- Visualização comparativa das estratégias
- Gráfico de eficácia das estratégias

**Formato da Solicitação**:

```
Continuando o desenvolvimento do simulador, implemente o módulo de estratégias de mitigação conforme especificado no documento orientativo, integrando-o com os módulos de cálculo e visualização já desenvolvidos.
```

### Prompt 7: Exportação para PDF e Excel

**Objetivo**: Implementar as funcionalidades de exportação. **Entregáveis**:

- Exportação completa para PDF
- Exportação para Excel com múltiplas abas
- Exportação da memória de cálculo em texto
- Exportação do relatório de estratégias

**Formato da Solicitação**:

```
Com base nos módulos já desenvolvidos, implemente as funcionalidades de exportação para PDF, Excel e texto para o simulador de Split Payment, seguindo o formato especificado no documento orientativo.
```

### Prompt 8: Testes, Validação e Otimizações

**Objetivo**: Refinar e otimizar o simulador. **Entregáveis**:

- Testes de validação para todos os cálculos
- Otimizações de performance
- Adaptações responsivas
- Ajustes finais

**Formato da Solicitação**:

```
Para finalizar o desenvolvimento do simulador de Split Payment, implemente testes, validações e otimizações conforme especificado no documento orientativo, garantindo a precisão dos cálculos e a performance do sistema.
```

## 3. Sistema de Continuidade

Para manter a continuidade entre os prompts, utilizaremos o seguinte sistema:

1. **Referências ao Código Anterior**: Ao iniciar um novo prompt, faremos referência ao prompt anterior e especificaremos quais componentes estamos estendendo.

2. **Versionamento Coerente**: Cada arquivo terá um número de versão (v1, v2, etc.) que será incrementado a cada modificação.

3. **Entrega Incremental**: Cada prompt entregará componentes funcionais que podem ser testados individualmente.

4. **Definição Clara de Interfaces**: As interfaces entre módulos serão claramente definidas para garantir a integração.

5. **Documentação Inline**: Cada componente terá documentação inline suficiente para contextualizar seu funcionamento.

## 4. Estrutura de Arquivos Recomendada

```
/simulador-split-payment/
├── index.html                  # Arquivo HTML principal
├── css/
│   ├── main.css                # Estilos principais
│   ├── forms.css               # Estilos específicos para formulários
│   ├── tabs.css                # Estilos relacionados ao sistema de abas
│   ├── charts.css              # Estilos para área de gráficos
│   └── modals.css              # Estilos para janelas modais
├── js/
│   ├── main.js                 # Script principal e inicialização
│   ├── config/
│   │   ├── config-manager.js   # Gerenciamento das configurações
│   │   └── setores-config.js   # Configurações setoriais
│   ├── simulation/
│   │   ├── simulator.js        # Núcleo do simulador
│   │   ├── calculation.js      # Funções de cálculo financeiro
│   │   └── strategies.js       # Implementação das estratégias
│   ├── ui/
│   │   ├── tabs-manager.js     # Gerenciamento de abas
│   │   ├── forms-manager.js    # Manipulação de formulários
│   │   ├── charts-manager.js   # Gerenciamento de gráficos
│   │   └── modal-manager.js    # Gerenciamento de modais
│   ├── export/
│   │   ├── pdf-export.js       # Exportação para PDF
│   │   ├── excel-export.js     # Exportação para Excel
│   │   └── memory-export.js    # Exportação da memória de cálculo
│   └── utils/
│       ├── formatters.js       # Formatadores (moeda, percentual, etc.)
│       ├── validators.js       # Validadores de campos
│       └── storage.js          # Utilitários de armazenamento
└── assets/
    └── images/                 # Imagens do simulador
        └── expertzy-it.png     # Logo da empresa
```

## 5. Dicas para Manter a Continuidade

1. **Iniciar Cada Prompt com Contexto**: Comece cada prompt relembrando o que já foi feito e o que será implementado agora.

2. **Priorizar Coesão**: Ao solicitar cada módulo, certifique-se de que ele se integra perfeitamente com os anteriores.

3. **Pedir Demonstrações de Uso**: Solicite exemplos de como o novo código se integra com os módulos existentes.

4. **Solicitar Comentários Claros**: Peça que o código gerado tenha comentários detalhados para facilitar a compreensão.

5. **Revisar Antes de Avançar**: Antes de passar para o próximo prompt, revise o código recebido para garantir que está alinhado com a visão geral.

Seguindo este plano estruturado, será possível desenvolver o simulador de Split Payment de forma modular, mantendo a continuidade entre os diferentes prompts e garantindo que o resultado final seja um sistema coeso e funcional.
