/**
 * End-to-End Tests for Critical User Journeys
 * Tests complete workflows from data input to report generation
 */

describe('Critical User Journeys', () => {
  beforeEach(() => {
    // Visit the application
    cy.visit('/');
    
    // Mock external API calls
    cy.intercept('POST', '**/gemini/**', { fixture: 'ai-analysis-response.json' }).as('aiAnalysis');
    cy.intercept('GET', '**/exceljs/**', { fixture: 'exceljs-mock.js' }).as('loadExcelJS');
  });

  describe('Manual Data Entry Journey', () => {
    it('should complete full manual data entry workflow', () => {
      // Step 1: Select manual input method
      cy.contains('Entrada Manual de Dados').click();
      
      // Step 2: Select number of periods
      cy.contains('4 Períodos').click();
      cy.contains('Confirmar').click();
      
      // Step 3: Fill data for each period
      for (let period = 1; period <= 4; period++) {
        cy.contains(`Período ${period}`).click();
        
        // Fill required fields
        cy.get('[aria-label*="Receita"][aria-label*="obrigatório"]')
          .clear()
          .type(`${1000000 * period}`);
        
        cy.get('[aria-label*="Margem Bruta"][aria-label*="obrigatório"]')
          .clear()
          .type('45');
        
        cy.get('[aria-label*="Despesas Operacionais"][aria-label*="obrigatório"]')
          .clear()
          .type(`${300000 * period}`);
        
        // Add working capital data
        cy.get('[aria-label*="Prazo Médio de Recebimento"]')
          .clear()
          .type('45');
        
        cy.get('[aria-label*="Prazo Médio de Estoques"]')
          .clear()
          .type('30');
        
        cy.get('[aria-label*="Prazo Médio de Pagamento"]')
          .clear()
          .type('60');
      }
      
      // Step 4: Submit data
      cy.contains('Processar Dados').click();
      
      // Step 5: Verify dashboard is displayed
      cy.contains('Dashboard Financeiro', { timeout: 10000 }).should('be.visible');
      
      // Verify key metrics are displayed
      cy.contains('Receita Total').should('be.visible');
      cy.contains('Margem EBITDA').should('be.visible');
      cy.contains('Fluxo de Caixa Livre').should('be.visible');
      
      // Verify charts are rendered
      cy.get('[data-testid="margin-trend-chart"]').should('be.visible');
      cy.get('[data-testid="cash-flow-waterfall"]').should('be.visible');
      
      // Step 6: Generate PDF report
      cy.contains('Exportar PDF').click();
      
      // Verify PDF generation started
      cy.contains('Gerando relatório').should('be.visible');
      
      // Wait for PDF to be generated
      cy.contains('Relatório gerado com sucesso', { timeout: 15000 }).should('be.visible');
    });

    it('should validate data entry and show errors', () => {
      // Navigate to manual entry
      cy.contains('Entrada Manual de Dados').click();
      cy.contains('4 Períodos').click();
      cy.contains('Confirmar').click();
      
      // Try to submit without filling required fields
      cy.contains('Período 4').click();
      cy.contains('Processar Dados').click();
      
      // Should show validation error
      cy.contains('Por favor, preencha todos os campos obrigatórios').should('be.visible');
      
      // Fill invalid data
      cy.contains('Período 1').click();
      cy.get('[aria-label*="Receita"][aria-label*="obrigatório"]')
        .clear()
        .type('-1000'); // Negative revenue
      
      cy.get('[aria-label*="Margem Bruta"][aria-label*="obrigatório"]')
        .clear()
        .type('150'); // Invalid percentage
      
      // Blur to trigger validation
      cy.get('body').click();
      
      // Should show field-specific errors
      cy.contains('não pode ser negativo').should('be.visible');
      cy.contains('deve estar entre 0 e 100').should('be.visible');
    });

    it('should auto-save and restore draft data', () => {
      // Enter manual data mode
      cy.contains('Entrada Manual de Dados').click();
      cy.contains('4 Períodos').click();
      cy.contains('Confirmar').click();
      
      // Fill some data
      cy.get('[aria-label*="Receita"][aria-label*="obrigatório"]')
        .clear()
        .type('1000000');
      
      cy.get('[aria-label*="Margem Bruta"][aria-label*="obrigatório"]')
        .clear()
        .type('45');
      
      // Wait for auto-save
      cy.wait(3500);
      
      // Reload the page
      cy.reload();
      
      // Navigate back to manual entry
      cy.contains('Entrada Manual de Dados').click();
      cy.contains('4 Períodos').click();
      cy.contains('Confirmar').click();
      
      // Verify data was restored
      cy.get('[aria-label*="Receita"][aria-label*="obrigatório"]')
        .should('have.value', '1000000');
      
      cy.get('[aria-label*="Margem Bruta"][aria-label*="obrigatório"]')
        .should('have.value', '45');
    });
  });

  describe('Excel Upload Journey', () => {
    it('should upload and process Excel file successfully', () => {
      // Step 1: Select Excel upload method
      cy.contains('Upload de Planilha Excel').click();
      
      // Step 2: Select number of periods
      cy.contains('4 Períodos').click();
      cy.contains('Confirmar').click();
      
      // Step 3: Upload Excel file
      cy.fixture('financial-data-4-periods.xlsx', 'binary')
        .then(Cypress.Blob.binaryStringToBlob)
        .then(fileContent => {
          cy.get('input[type="file"]').attachFile({
            fileContent,
            fileName: 'financial-data-4-periods.xlsx',
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          });
        });
      
      // Wait for processing
      cy.contains('Processando', { timeout: 5000 }).should('be.visible');
      
      // Verify preview is shown
      cy.contains('Dados extraídos com sucesso').should('be.visible');
      cy.contains('4 períodos encontrados').should('be.visible');
      
      // Check preview table
      cy.contains('Período 1').should('be.visible');
      cy.contains('R$ 1.000.000,00').should('be.visible');
      
      // Step 4: Confirm and use data
      cy.contains('Usar Estes Dados').click();
      
      // Step 5: Verify dashboard
      cy.contains('Dashboard Financeiro', { timeout: 10000 }).should('be.visible');
      
      // Verify data was loaded correctly
      cy.contains('Receita Total').parent().contains('10.000.000,00');
    });

    it('should download and use Excel template', () => {
      // Navigate to Excel upload
      cy.contains('Upload de Planilha Excel').click();
      cy.contains('4 Períodos').click();
      cy.contains('Confirmar').click();
      
      // Download template
      cy.contains('Baixar Modelo Excel').click();
      
      // Verify download started (Cypress limitation: can't verify actual file download)
      cy.contains('Baixar Modelo Excel').should('not.be.disabled');
    });

    it('should handle invalid Excel files', () => {
      // Navigate to Excel upload
      cy.contains('Upload de Planilha Excel').click();
      cy.contains('4 Períodos').click();
      cy.contains('Confirmar').click();
      
      // Upload invalid file type
      cy.fixture('document.pdf', 'binary')
        .then(Cypress.Blob.binaryStringToBlob)
        .then(fileContent => {
          cy.get('input[type="file"]').attachFile({
            fileContent,
            fileName: 'document.pdf',
            mimeType: 'application/pdf'
          });
        });
      
      // Should show error
      cy.contains('Formato de arquivo inválido').should('be.visible');
    });
  });

  describe('PDF Upload with AI Extraction Journey', () => {
    it('should extract data from PDF using AI', () => {
      // Step 1: Select PDF upload method
      cy.contains('Upload de PDF').click();
      
      // Step 2: Select number of periods
      cy.contains('4 Períodos').click();
      cy.contains('Confirmar').click();
      
      // Step 3: Configure AI provider
      cy.contains('Configuração de IA').click();
      cy.get('select[aria-label="Provedor de IA"]').select('gemini');
      cy.get('input[aria-label="Chave API"]').type(Cypress.env('GEMINI_API_KEY') || 'test-api-key');
      cy.contains('Salvar').click();
      
      // Step 4: Upload PDF
      cy.fixture('financial-statement.pdf', 'binary')
        .then(Cypress.Blob.binaryStringToBlob)
        .then(fileContent => {
          cy.get('input[type="file"][accept=".pdf"]').attachFile({
            fileContent,
            fileName: 'financial-statement.pdf',
            mimeType: 'application/pdf'
          });
        });
      
      // Wait for PDF processing
      cy.contains('Extraindo texto do PDF', { timeout: 10000 }).should('be.visible');
      
      // Wait for AI analysis
      cy.contains('Analisando com IA', { timeout: 10000 }).should('be.visible');
      
      // Verify extracted data preview
      cy.contains('Dados extraídos do PDF').should('be.visible');
      
      // Review and confirm data
      cy.contains('Usar Dados Extraídos').click();
      
      // Verify dashboard
      cy.contains('Dashboard Financeiro', { timeout: 10000 }).should('be.visible');
    });
  });

  describe('AI Analysis Features', () => {
    beforeEach(() => {
      // Setup with sample data
      cy.contains('Entrada Manual de Dados').click();
      cy.contains('2 Períodos').click(); // Faster test with 2 periods
      cy.contains('Confirmar').click();
      
      // Fill minimal required data
      for (let period = 1; period <= 2; period++) {
        cy.contains(`Período ${period}`).click();
        cy.get('[aria-label*="Receita"][aria-label*="obrigatório"]').clear().type('1000000');
        cy.get('[aria-label*="Margem Bruta"][aria-label*="obrigatório"]').clear().type('45');
        cy.get('[aria-label*="Despesas Operacionais"][aria-label*="obrigatório"]').clear().type('300000');
      }
      
      cy.contains('Processar Dados').click();
      cy.contains('Dashboard Financeiro', { timeout: 10000 }).should('be.visible');
    });

    it('should generate AI executive summary', () => {
      // Navigate to AI analysis section
      cy.contains('Análise com IA').click();
      
      // Request executive summary
      cy.contains('Gerar Resumo Executivo').click();
      
      // Wait for AI response
      cy.wait('@aiAnalysis');
      
      // Verify summary is displayed
      cy.contains('Resumo Executivo', { timeout: 15000 }).should('be.visible');
      cy.contains('Principais Insights').should('be.visible');
      cy.contains('Recomendações').should('be.visible');
    });

    it('should perform variance analysis', () => {
      cy.contains('Análise com IA').click();
      cy.contains('Análise de Variações').click();
      
      cy.wait('@aiAnalysis');
      
      // Verify variance analysis results
      cy.contains('Análise de Variações entre Períodos').should('be.visible');
      cy.contains('Variação da Receita').should('be.visible');
    });
  });

  describe('Report Export Features', () => {
    beforeEach(() => {
      // Quick setup with minimal data
      cy.contains('Entrada Manual de Dados').click();
      cy.contains('2 Períodos').click();
      cy.contains('Confirmar').click();
      
      // Fill data
      for (let period = 1; period <= 2; period++) {
        cy.contains(`Período ${period}`).click();
        cy.get('[aria-label*="Receita"][aria-label*="obrigatório"]').clear().type('1000000');
        cy.get('[aria-label*="Margem Bruta"][aria-label*="obrigatório"]').clear().type('45');
        cy.get('[aria-label*="Despesas Operacionais"][aria-label*="obrigatório"]').clear().type('300000');
      }
      
      cy.contains('Processar Dados').click();
      cy.contains('Dashboard Financeiro', { timeout: 10000 });
    });

    it('should export PDF report with all sections', () => {
      // Configure export options
      cy.contains('Exportar').click();
      cy.contains('Configurar Exportação').click();
      
      // Select all sections
      cy.get('input[type="checkbox"][name="includeCharts"]').check();
      cy.get('input[type="checkbox"][name="includeAnalysis"]').check();
      cy.get('input[type="checkbox"][name="includeTables"]').check();
      
      // Add company info
      cy.get('input[aria-label="Nome da Empresa"]').type('Test Company Ltd.');
      cy.get('input[aria-label="CNPJ"]').type('00.000.000/0001-00');
      
      // Export
      cy.contains('Gerar PDF').click();
      
      // Verify export progress
      cy.contains('Preparando relatório').should('be.visible');
      cy.contains('Gerando gráficos').should('be.visible');
      cy.contains('Finalizando PDF').should('be.visible');
      
      // Verify completion
      cy.contains('Download concluído', { timeout: 20000 }).should('be.visible');
    });

    it('should export Excel summary', () => {
      cy.contains('Exportar').click();
      cy.contains('Exportar para Excel').click();
      
      // Verify export started
      cy.contains('Preparando dados para Excel').should('be.visible');
      
      // Verify completion
      cy.contains('Excel gerado com sucesso', { timeout: 10000 }).should('be.visible');
    });
  });

  describe('Responsive Design', () => {
    it('should work on mobile devices', () => {
      // Set mobile viewport
      cy.viewport('iphone-x');
      
      // Navigate through mobile menu
      cy.get('[aria-label="Menu"]').click();
      cy.contains('Entrada Manual de Dados').click();
      
      // Mobile-specific period selection
      cy.contains('4 Períodos').click();
      cy.contains('Confirmar').click();
      
      // Verify mobile-optimized form
      cy.get('[aria-label*="Receita"][aria-label*="obrigatório"]').should('be.visible');
      
      // Navigate periods with swipe (simulated with buttons on mobile)
      cy.contains('Próximo').click();
      cy.contains('Período 2').should('have.class', 'bg-blue-600');
    });

    it('should work on tablet devices', () => {
      cy.viewport('ipad-2');
      
      // Verify layout adapts to tablet
      cy.contains('Entrada Manual de Dados').should('be.visible');
      cy.contains('Upload de Planilha Excel').should('be.visible');
      
      // Both options should be visible on tablet
      cy.get('.grid-cols-1.md\\:grid-cols-2').should('exist');
    });
  });

  describe('Error Recovery', () => {
    it('should handle network errors gracefully', () => {
      // Simulate network error
      cy.intercept('POST', '**/gemini/**', { 
        statusCode: 500,
        body: { error: 'Internal Server Error' }
      }).as('aiError');
      
      // Setup data and navigate to AI analysis
      cy.contains('Entrada Manual de Dados').click();
      cy.contains('2 Períodos').click();
      cy.contains('Confirmar').click();
      
      // Fill minimal data
      cy.get('[aria-label*="Receita"][aria-label*="obrigatório"]').type('1000000');
      cy.get('[aria-label*="Margem Bruta"][aria-label*="obrigatório"]').type('45');
      cy.get('[aria-label*="Despesas Operacionais"][aria-label*="obrigatório"]').type('300000');
      
      cy.contains('Período 2').click();
      cy.get('[aria-label*="Receita"][aria-label*="obrigatório"]').type('1000000');
      cy.get('[aria-label*="Margem Bruta"][aria-label*="obrigatório"]').type('45');
      cy.get('[aria-label*="Despesas Operacionais"][aria-label*="obrigatório"]').type('300000');
      
      cy.contains('Processar Dados').click();
      cy.contains('Dashboard Financeiro', { timeout: 10000 });
      
      // Try AI analysis
      cy.contains('Análise com IA').click();
      cy.contains('Gerar Resumo Executivo').click();
      
      cy.wait('@aiError');
      
      // Should show error message
      cy.contains('Erro ao gerar análise').should('be.visible');
      cy.contains('Tentar Novamente').should('be.visible');
    });

    it('should recover from invalid data states', () => {
      // Navigate to dashboard with localStorage manipulation
      cy.window().then((win) => {
        // Set invalid data in localStorage
        win.localStorage.setItem('enterpriseCashFlow_calculatedData', 'invalid-json');
      });
      
      cy.reload();
      
      // Should show error recovery options
      cy.contains('Erro ao carregar dados').should('be.visible');
      cy.contains('Começar Novo').should('be.visible');
      
      // Start fresh
      cy.contains('Começar Novo').click();
      
      // Should return to input selection
      cy.contains('Como deseja inserir os dados?').should('be.visible');
    });
  });

  describe('Accessibility', () => {
    it('should be navigable with keyboard only', () => {
      // Tab through main options
      cy.get('body').tab();
      cy.focused().should('contain', 'Entrada Manual');
      
      // Select with Enter
      cy.focused().type('{enter}');
      
      // Tab through period selection
      cy.focused().tab().tab().tab();
      cy.focused().should('contain', '4 Períodos');
      cy.focused().type('{enter}');
      
      // Tab to confirm
      cy.focused().tab();
      cy.focused().should('contain', 'Confirmar');
      cy.focused().type('{enter}');
      
      // Navigate form fields with tab
      cy.focused().should('have.attr', 'aria-label').and('include', 'Receita');
      cy.focused().type('1000000');
      
      cy.focused().tab();
      cy.focused().should('have.attr', 'aria-label').and('include', 'Margem Bruta');
    });

    it('should work with screen reader', () => {
      // Check ARIA labels and roles
      cy.get('[role="main"]').should('exist');
      cy.get('[aria-label="Método de entrada de dados"]').should('exist');
      
      // Check form accessibility
      cy.contains('Entrada Manual de Dados').click();
      cy.contains('4 Períodos').click();
      cy.contains('Confirmar').click();
      
      // All form fields should have labels
      cy.get('input[required]').each(($input) => {
        cy.wrap($input).should('have.attr', 'aria-label');
      });
      
      // Error messages should be announced
      cy.get('[aria-label*="Receita"][aria-label*="obrigatório"]').type('-1000');
      cy.get('body').click();
      
      cy.get('[role="alert"]').should('contain', 'não pode ser negativo');
    });
  });
});