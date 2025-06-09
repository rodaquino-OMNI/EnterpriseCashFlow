# EnterpriseCashFlow - Data Input Processing Pseudocode

## 1. Module Overview

The Data Input Processing module handles multi-modal financial data input through manual entry, Excel file upload, and PDF document processing with AI extraction. It provides unified data validation, normalization, and integration into the financial calculation pipeline.

### 1.1 Module Dependencies
- Domain Models: [`RawFinancialData`](docs/02_domain_model_specification.md:55), [`FinancialPeriod`](docs/02_domain_model_specification.md:40)
- File Processing: Excel parser, PDF text extraction
- AI Services: Document analysis and data extraction
- Validation Engine: Input validation and business rules

### 1.2 Core Responsibilities
- Multi-modal input orchestration (Manual, Excel, PDF)
- File format validation and security scanning
- Data extraction and normalization
- Real-time validation and error reporting
- Progress tracking and user feedback
- Data mapping and transformation

## 2. DataInputManager Class

```typescript
class DataInputManager {
  private excelProcessor: ExcelProcessor
  private pdfProcessor: PdfProcessor
  private manualEntryValidator: ManualEntryValidator
  private dataMapper: DataMapper
  private validationEngine: ValidationEngine
  
  // TEST: Manager initializes with all required processors
  constructor(config: DataInputConfig) {
    this.excelProcessor = new ExcelProcessor(config.excel)
    this.pdfProcessor = new PdfProcessor(config.pdf)
    this.manualEntryValidator = new ManualEntryValidator(config.validation)
    this.dataMapper = new DataMapper(config.mapping)
    this.validationEngine = new ValidationEngine(config.businessRules)
  }
  
  // TEST: Processes manual entry data with real-time validation
  // TEST: Handles partial data entry gracefully
  // TEST: Provides immediate feedback on validation errors
  async processManualEntry(
    periodData: Partial<RawFinancialData>,
    periodInfo: FinancialPeriod
  ): Promise<ProcessingResult> {
    
    // Validate period information
    // TEST: Period validation ensures data consistency
    this.validatePeriodInfo(periodInfo)
    
    // Validate individual fields
    // TEST: Field validation provides specific error messages
    fieldValidationResults = await this.manualEntryValidator.validateFields(periodData)
    
    // Check business rules
    // TEST: Business rule validation catches logical inconsistencies
    businessRuleResults = await this.validationEngine.validateBusinessRules(
      periodData,
      periodInfo
    )
    
    // Normalize and map data
    // TEST: Data normalization handles different input formats
    normalizedData = this.dataMapper.normalizeManualEntry(periodData, periodInfo)
    
    // Calculate derived fields
    // TEST: Derived field calculation maintains data relationships
    enrichedData = this.calculateDerivedFields(normalizedData)
    
    // TEST: Returns complete processing result with validation status
    return new ProcessingResult({
      success: fieldValidationResults.isValid && businessRuleResults.isValid,
      data: enrichedData,
      validationErrors: [...fieldValidationResults.errors, ...businessRuleResults.errors],
      warnings: [...fieldValidationResults.warnings, ...businessRuleResults.warnings],
      dataSource: DataSource.MANUAL,
      processingTime: Date.now()
    })
  }
  
  // TEST: Processes Excel files with comprehensive validation
  // TEST: Handles various Excel formats and structures
  // TEST: Provides detailed error reporting for file issues
  async processExcelFile(
    file: File,
    mappingConfig: ExcelMappingConfig
  ): Promise<ProcessingResult> {
    
    try {
      // Validate file format and security
      // TEST: File validation prevents malicious uploads
      await this.validateFileUpload(file, ALLOWED_EXCEL_FORMATS)
      
      // Extract data from Excel
      // TEST: Excel extraction handles various sheet structures
      extractedData = await this.excelProcessor.extractData(file, mappingConfig)
      
      // Validate extracted data structure
      // TEST: Structure validation ensures data completeness
      structureValidation = this.validateDataStructure(extractedData, DataSource.EXCEL)
      
      if !structureValidation.isValid:
        return new ProcessingResult({
          success: false,
          errors: structureValidation.errors,
          dataSource: DataSource.EXCEL
        })
      
      // Process each period from Excel
      // TEST: Multi-period processing maintains data integrity
      processedPeriods = []
      allErrors = []
      allWarnings = []
      
      for periodData in extractedData.periods:
        // Validate and normalize period data
        periodResult = await this.validateAndNormalizePeriod(
          periodData,
          extractedData.periodInfo,
          DataSource.EXCEL
        )
        
        processedPeriods.push(periodResult.data)
        allErrors.push(...periodResult.errors)
        allWarnings.push(...periodResult.warnings)
      
      // TEST: Returns comprehensive processing result
      return new ProcessingResult({
        success: allErrors.length === 0,
        data: processedPeriods,
        validationErrors: allErrors,
        warnings: allWarnings,
        dataSource: DataSource.EXCEL,
        metadata: extractedData.metadata
      })
      
    } catch (error) {
      // TEST: Error handling provides meaningful user feedback
      return this.handleProcessingError(error, DataSource.EXCEL)
    }
  }
  
  // TEST: Processes PDF files with AI-powered data extraction
  // TEST: Handles various PDF formats and layouts
  // TEST: Provides confidence scores for extracted data
  async processPdfFile(
    file: File,
    extractionOptions: PdfExtractionOptions
  ): Promise<ProcessingResult> {
    
    try {
      // Validate PDF file
      // TEST: PDF validation ensures file integrity
      await this.validateFileUpload(file, ALLOWED_PDF_FORMATS)
      
      // Extract text and structure from PDF
      // TEST: Text extraction handles various PDF encodings
      extractedContent = await this.pdfProcessor.extractContent(file)
      
      // Use AI to identify and extract financial data
      // TEST: AI extraction provides confidence scores
      aiExtractionResult = await this.pdfProcessor.extractFinancialData(
        extractedContent,
        extractionOptions
      )
      
      // Validate AI extraction confidence
      // TEST: Confidence validation ensures data quality
      if aiExtractionResult.averageConfidence < MIN_AI_CONFIDENCE_THRESHOLD:
        return new ProcessingResult({
          success: false,
          errors: [new ValidationError("AI extraction confidence too low")],
          dataSource: DataSource.PDF,
          metadata: { confidence: aiExtractionResult.averageConfidence }
        })
      
      // Map AI-extracted data to standard format
      // TEST: AI data mapping handles various extraction formats
      mappedData = this.dataMapper.mapAiExtractedData(aiExtractionResult)
      
      // Validate mapped data
      // TEST: Mapped data validation ensures business rule compliance
      validationResult = await this.validateAndNormalizePeriod(
        mappedData,
        aiExtractionResult.periodInfo,
        DataSource.PDF
      )
      
      // TEST: Returns AI extraction result with confidence metadata
      return new ProcessingResult({
        success: validationResult.errors.length === 0,
        data: validationResult.data,
        validationErrors: validationResult.errors,
        warnings: validationResult.warnings,
        dataSource: DataSource.PDF,
        metadata: {
          confidence: aiExtractionResult.averageConfidence,
          extractionMethod: aiExtractionResult.method,
          fieldsExtracted: aiExtractionResult.fieldsExtracted
        }
      })
      
    } catch (error) {
      // TEST: PDF processing errors are handled gracefully
      return this.handleProcessingError(error, DataSource.PDF)
    }
  }
}
```

## 3. Excel Processing System

```typescript
class ExcelProcessor {
  private workbookParser: WorkbookParser
  private sheetAnalyzer: SheetAnalyzer
  private dataExtractor: DataExtractor
  
  // TEST: Excel extraction handles various file formats
  // TEST: Supports multiple sheets and complex layouts
  // TEST: Provides detailed extraction metadata
  async extractData(
    file: File,
    mappingConfig: ExcelMappingConfig
  ): Promise<ExcelExtractionResult> {
    
    // Parse Excel workbook
    // TEST: Workbook parsing handles corrupted files gracefully
    workbook = await this.workbookParser.parse(file)
    
    // Analyze sheet structure
    // TEST: Sheet analysis identifies data regions correctly
    sheetAnalysis = await this.sheetAnalyzer.analyzeSheets(
      workbook,
      mappingConfig.targetSheets
    )
    
    // Extract financial data based on mapping
    // TEST: Data extraction follows mapping configuration accurately
    extractedPeriods = []
    
    for sheetInfo in sheetAnalysis.dataSheets:
      // Extract periods from sheet
      // TEST: Period extraction handles various date formats
      periodData = await this.dataExtractor.extractPeriods(
        sheetInfo,
        mappingConfig
      )
      
      extractedPeriods.push(...periodData)
    
    // Validate extraction completeness
    // TEST: Extraction validation ensures data quality
    extractionValidation = this.validateExtraction(extractedPeriods, mappingConfig)
    
    // TEST: Returns comprehensive extraction result
    return new ExcelExtractionResult({
      periods: extractedPeriods,
      periodInfo: this.derivePeriodInfo(extractedPeriods),
      metadata: {
        sheetsProcessed: sheetAnalysis.dataSheets.length,
        periodsFound: extractedPeriods.length,
        extractionQuality: extractionValidation.qualityScore,
        mappingUsed: mappingConfig.name
      },
      warnings: extractionValidation.warnings
    })
  }
  
  // TEST: Sheet analysis identifies financial data patterns
  // TEST: Handles merged cells and complex formatting
  private async analyzeSheets(
    workbook: Workbook,
    targetSheets: string[]
  ): Promise<SheetAnalysis> {
    
    dataSheets = []
    
    for sheetName in targetSheets:
      sheet = workbook.getSheet(sheetName)
      
      if !sheet:
        continue
      
      // Analyze sheet structure
      // TEST: Structure analysis identifies headers and data regions
      structure = this.analyzeSheetStructure(sheet)
      
      // Identify financial data patterns
      // TEST: Pattern recognition finds financial statement sections
      patterns = this.identifyFinancialPatterns(sheet, structure)
      
      if patterns.hasFinancialData:
        dataSheets.push({
          sheet: sheet,
          structure: structure,
          patterns: patterns,
          confidence: patterns.confidence
        })
    
    // TEST: Returns analysis with confidence scores
    return new SheetAnalysis({
      dataSheets: dataSheets,
      totalSheets: workbook.sheetCount,
      analysisConfidence: this.calculateOverallConfidence(dataSheets)
    })
  }
  
  // TEST: Data extraction handles various cell formats
  // TEST: Manages formula evaluation and error handling
  private async extractPeriods(
    sheetInfo: SheetInfo,
    mappingConfig: ExcelMappingConfig
  ): Promise<RawFinancialData[]> {
    
    periods = []
    sheet = sheetInfo.sheet
    
    // Find period columns/rows
    // TEST: Period identification handles various layouts
    periodLocations = this.findPeriodLocations(sheet, mappingConfig)
    
    for location in periodLocations:
      periodData = new RawFinancialData()
      periodData.periodIndex = location.periodIndex
      
      // Extract financial fields based on mapping
      // TEST: Field extraction handles missing values appropriately
      for fieldMapping in mappingConfig.fieldMappings:
        cellValue = this.extractCellValue(
          sheet,
          location,
          fieldMapping
        )
        
        // Convert and validate cell value
        // TEST: Cell value conversion handles various formats
        convertedValue = this.convertCellValue(
          cellValue,
          fieldMapping.dataType,
          fieldMapping.format
        )
        
        // Set field value
        this.setFieldValue(periodData, fieldMapping.fieldName, convertedValue)
      
      periods.push(periodData)
    
    // TEST: Returns extracted periods with proper data types
    return periods
  }
}
```

## 4. PDF Processing System

```typescript
class PdfProcessor {
  private textExtractor: PdfTextExtractor
  private layoutAnalyzer: PdfLayoutAnalyzer
  private aiExtractor: AiDataExtractor
  
  // TEST: PDF content extraction handles various encodings
  // TEST: Preserves layout information for analysis
  async extractContent(file: File): Promise<PdfContent> {
    
    // Extract raw text
    // TEST: Text extraction handles encrypted PDFs
    rawText = await this.textExtractor.extractText(file)
    
    // Analyze document layout
    // TEST: Layout analysis identifies tables and sections
    layoutInfo = await this.layoutAnalyzer.analyzeLayout(file)
    
    // Extract structured content
    // TEST: Structured extraction preserves data relationships
    structuredContent = this.combineTextAndLayout(rawText, layoutInfo)
    
    // TEST: Returns comprehensive PDF content
    return new PdfContent({
      rawText: rawText,
      structuredContent: structuredContent,
      layoutInfo: layoutInfo,
      pageCount: layoutInfo.pageCount,
      extractionQuality: this.assessExtractionQuality(structuredContent)
    })
  }
  
  // TEST: AI extraction identifies financial data accurately
  // TEST: Provides confidence scores for each extracted field
  // TEST: Handles various financial statement formats
  async extractFinancialData(
    content: PdfContent,
    options: PdfExtractionOptions
  ): Promise<AiExtractionResult> {
    
    // Prepare content for AI analysis
    // TEST: Content preparation optimizes AI processing
    preparedContent = this.prepareContentForAi(content, options)
    
    // Use AI to identify financial data
    // TEST: AI analysis handles various document formats
    aiAnalysisResult = await this.aiExtractor.analyzeFinancialDocument(
      preparedContent,
      options
    )
    
    // Extract specific financial fields
    // TEST: Field extraction maps to standard data model
    extractedFields = await this.aiExtractor.extractFinancialFields(
      aiAnalysisResult,
      STANDARD_FINANCIAL_FIELDS
    )
    
    // Validate extraction confidence
    // TEST: Confidence validation ensures data reliability
    confidenceAssessment = this.assessExtractionConfidence(extractedFields)
    
    // Map to period structure
    // TEST: Period mapping handles multi-period documents
    periodData = this.mapToPeriodStructure(extractedFields, options)
    
    // TEST: Returns AI extraction with confidence metrics
    return new AiExtractionResult({
      extractedData: periodData,
      fieldsExtracted: extractedFields.length,
      averageConfidence: confidenceAssessment.average,
      method: aiAnalysisResult.method,
      periodInfo: this.derivePeriodInfo(periodData),
      confidenceByField: confidenceAssessment.byField
    })
  }
  
  // TEST: Content preparation optimizes AI analysis
  // TEST: Handles large documents efficiently
  private prepareContentForAi(
    content: PdfContent,
    options: PdfExtractionOptions
  ): string {
    
    // Focus on relevant sections
    // TEST: Section filtering improves AI accuracy
    relevantSections = this.identifyRelevantSections(
      content.structuredContent,
      options.focusAreas
    )
    
    // Clean and format text
    // TEST: Text cleaning preserves important formatting
    cleanedText = this.cleanTextForAi(relevantSections)
    
    // Add context information
    // TEST: Context addition guides AI analysis
    contextualizedText = this.addAnalysisContext(cleanedText, options)
    
    // Ensure appropriate length
    // TEST: Length management prevents token limit issues
    if contextualizedText.length > MAX_AI_INPUT_LENGTH:
      contextualizedText = this.truncateIntelligently(
        contextualizedText,
        MAX_AI_INPUT_LENGTH
      )
    
    return contextualizedText
  }
}
```

## 5. Data Validation and Normalization

```typescript
class ManualEntryValidator {
  private fieldValidators: Map<string, FieldValidator>
  private businessRuleEngine: BusinessRuleEngine
  
  // TEST: Field validation provides immediate feedback
  // TEST: Handles various input formats and edge cases
  async validateFields(
    periodData: Partial<RawFinancialData>
  ): Promise<FieldValidationResult> {
    
    validationResults = []
    
    for [fieldName, value] in Object.entries(periodData):
      if value === undefined || value === null:
        continue
      
      // Get field validator
      // TEST: Field validator selection works for all fields
      validator = this.fieldValidators.get(fieldName)
      
      if !validator:
        continue
      
      // Validate field value
      // TEST: Field validation catches format and range errors
      fieldResult = await validator.validate(value, fieldName)
      validationResults.push(fieldResult)
    
    // Aggregate results
    // TEST: Result aggregation provides comprehensive feedback
    return this.aggregateValidationResults(validationResults)
  }
  
  // TEST: Business rule validation ensures data consistency
  // TEST: Provides specific error messages for rule violations
  async validateBusinessRules(
    periodData: Partial<RawFinancialData>,
    periodInfo: FinancialPeriod
  ): Promise<BusinessRuleValidationResult> {
    
    ruleResults = []
    
    // Revenue consistency rules
    // TEST: Revenue rules validate gross vs net revenue relationship
    if periodData.grossRevenue && periodData.netRevenue:
      revenueRule = this.businessRuleEngine.validateRevenueConsistency(
        periodData.grossRevenue,
        periodData.netRevenue,
        periodData.salesDeductions
      )
      ruleResults.push(revenueRule)
    
    // Profit calculation rules
    // TEST: Profit rules validate calculation consistency
    if periodData.netRevenue && periodData.costOfGoodsSold && periodData.grossProfit:
      profitRule = this.businessRuleEngine.validateProfitCalculation(
        periodData.netRevenue,
        periodData.costOfGoodsSold,
        periodData.grossProfit
      )
      ruleResults.push(profitRule)
    
    // Balance sheet rules
    // TEST: Balance sheet rules validate accounting equation
    if this.hasBalanceSheetData(periodData):
      balanceRule = this.businessRuleEngine.validateBalanceSheetEquation(
        periodData.totalAssets,
        periodData.totalLiabilities,
        periodData.equity
      )
      ruleResults.push(balanceRule)
    
    // Period-specific rules
    // TEST: Period rules validate date ranges and sequences
    periodRule = this.businessRuleEngine.validatePeriodConsistency(
      periodData,
      periodInfo
    )
    ruleResults.push(periodRule)
    
    // TEST: Returns comprehensive business rule validation
    return this.aggregateBusinessRuleResults(ruleResults)
  }
}

class DataMapper {
  private fieldMappings: Map<string, FieldMapping>
  private formatters: Map<string, DataFormatter>
  
  // TEST: Manual entry normalization handles various formats
  // TEST: Preserves data precision and relationships
  normalizeManualEntry(
    periodData: Partial<RawFinancialData>,
    periodInfo: FinancialPeriod
  ): RawFinancialData {
    
    normalizedData = new RawFinancialData()
    normalizedData.periodIndex = periodInfo.periodIndex
    
    // Normalize each field
    for [fieldName, value] in Object.entries(periodData):
      if value === undefined || value === null:
        continue
      
      // Get field mapping
      // TEST: Field mapping handles all supported fields
      mapping = this.fieldMappings.get(fieldName)
      
      if !mapping:
        continue
      
      // Apply normalization
      // TEST: Normalization preserves data accuracy
      normalizedValue = this.normalizeFieldValue(value, mapping)
      
      // Set normalized value
      this.setFieldValue(normalizedData, fieldName, normalizedValue)
    
    // Add metadata
    normalizedData.dataSource = DataSource.MANUAL
    normalizedData.lastModified = new Date()
    
    // TEST: Returns properly normalized data
    return normalizedData
  }
  
  // TEST: AI data mapping handles extraction uncertainties
  // TEST: Provides confidence tracking for mapped fields
  mapAiExtractedData(
    aiResult: AiExtractionResult
  ): RawFinancialData {
    
    mappedData = new RawFinancialData()
    
    // Map extracted fields to standard model
    for extractedField in aiResult.extractedFields:
      // Find corresponding standard field
      // TEST: Field correspondence mapping is accurate
      standardField = this.findStandardField(extractedField.name)
      
      if !standardField:
        continue
      
      // Convert extracted value
      // TEST: Value conversion handles AI extraction formats
      convertedValue = this.convertAiExtractedValue(
        extractedField.value,
        extractedField.confidence,
        standardField.dataType
      )
      
      // Set field value with confidence tracking
      this.setFieldValue(mappedData, standardField.name, convertedValue)
    
    // Add AI-specific metadata
    mappedData.dataSource = DataSource.PDF
    mappedData.aiConfidence = aiResult.averageConfidence
    mappedData.extractionMethod = aiResult.method
    
    // TEST: Returns mapped data with confidence metadata
    return mappedData
  }
}
```

## 6. File Upload Security and Validation

```typescript
class FileUploadValidator {
  private virusScanner: VirusScanner
  private formatValidator: FormatValidator
  
  // TEST: File validation prevents malicious uploads
  // TEST: Handles various file formats and sizes
  async validateFileUpload(
    file: File,
    allowedFormats: string[]
  ): Promise<FileValidationResult> {
    
    validationResults = []
    
    // Check file size
    // TEST: Size validation prevents oversized uploads
    if file.size > MAX_FILE_SIZE:
      validationResults.push(new ValidationError("File size exceeds maximum limit"))
    
    // Check file format
    // TEST: Format validation uses both extension and content
    formatCheck = await this.formatValidator.validateFormat(file, allowedFormats)
    if !formatCheck.isValid:
      validationResults.push(...formatCheck.errors)
    
    // Virus scan
    // TEST: Virus scanning protects against malware
    virusScanResult = await this.virusScanner.scanFile(file)
    if !virusScanResult.isClean:
      validationResults.push(new SecurityError("File failed security scan"))
    
    // Content validation
    // TEST: Content validation ensures file integrity
    contentValidation = await this.validateFileContent(file)
    if !contentValidation.isValid:
      validationResults.push(...contentValidation.errors)
    
    // TEST: Returns comprehensive validation result
    return new FileValidationResult({
      isValid: validationResults.length === 0,
      errors: validationResults,
      fileInfo: {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      }
    })
  }
}
```

## 7. Progress Tracking and User Feedback

```typescript
class ProcessingProgressTracker {
  private progressCallbacks: Map<string, ProgressCallback>
  
  // TEST: Progress tracking provides accurate status updates
  // TEST: Handles concurrent processing operations
  trackProcessing(
    operationId: string,
    totalSteps: number,
    callback: ProgressCallback
  ): void {
    
    this.progressCallbacks.set(operationId, callback)
    
    // Initialize progress
    // TEST: Progress initialization sets correct baseline
    this.updateProgress(operationId, {
      currentStep: 0,
      totalSteps: totalSteps,
      status: ProcessingStatus.STARTED,
      message: "Processing started"
    })
  }
  
  // TEST: Progress updates are delivered reliably
  // TEST: Error states are properly communicated
  updateProgress(
    operationId: string,
    progress: ProcessingProgress
  ): void {
    
    callback = this.progressCallbacks.get(operationId)
    
    if !callback:
      return
    
    // Calculate percentage
    // TEST: Percentage calculation is accurate
    percentage = progress.totalSteps > 0 
      ? (progress.currentStep / progress.totalSteps) * 100 
      : 0
    
    // Update progress
    callback({
      ...progress,
      percentage: percentage,
      timestamp: Date.now()
    })
    
    // Cleanup completed operations
    // TEST: Cleanup prevents memory leaks
    if progress.status === ProcessingStatus.COMPLETED || 
       progress.status === ProcessingStatus.FAILED:
      this.progressCallbacks.delete(operationId)
  }
}
```

## 8. Constants and Configuration

```typescript
// File upload limits
const MAX_FILE_SIZE = 50 * 1024 * 1024  // 50MB
const ALLOWED_EXCEL_FORMATS = ['.xlsx', '.xls', '.csv']
const ALLOWED_PDF_FORMATS = ['.pdf']

// AI extraction thresholds
const MIN_AI_CONFIDENCE_THRESHOLD = 0.7
const MAX_AI_INPUT_LENGTH = 50000  // characters

// Processing timeouts
const EXCEL_PROCESSING_TIMEOUT = 30000   // 30 seconds
const PDF_PROCESSING_TIMEOUT = 60000     // 60 seconds
const AI_EXTRACTION_TIMEOUT = 120000     // 2 minutes

// Validation tolerances
const CALCULATION_TOLERANCE = 0.01
const BALANCE_SHEET_TOLERANCE = 0.01

// Standard financial fields for AI extraction
const STANDARD_FINANCIAL_FIELDS = [
  'grossRevenue', 'netRevenue', 'costOfGoodsSold', 'grossProfit',
  'operatingExpenses', 'ebitda', 'netIncome', 'totalAssets',
  'currentAssets', 'totalLiabilities', 'currentLiabilities', 'equity'
]

// Processing status enumeration
enum ProcessingStatus {
  STARTED = "STARTED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED"
}
```

---

**Document Version:** 1.0  
**Dependencies:** [`02_domain_model_specification.md`](docs/02_domain_model_specification.md), [`04_ai_service_integration_pseudocode.md`](docs/04_ai_service_integration_pseudocode.md)  
**Next Phase:** Validation and Integration Testing  
**TDD Coverage:** 55+ test anchors covering multi-modal input processing, validation, and error handling