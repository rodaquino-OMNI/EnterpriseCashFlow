# EnterpriseCashFlow - UX Improvement Pseudocode Design

## 1. Overview

**Document Purpose:** Testable pseudocode design for UX improvements  
**Version:** 1.0  
**Dependencies:** [`06_ux_improvement_specification.md`](./06_ux_improvement_specification.md)  
**Target Implementation:** Phase-based modular development  

### 1.1 Design Principles
- **Modular Architecture:** Clear component boundaries with single responsibilities
- **Progressive Enhancement:** Graceful degradation for unsupported features
- **Accessibility First:** WCAG 2.1 AA compliance built-in
- **Performance Optimized:** Lazy loading and efficient rendering
- **Testable Design:** TDD anchors for all critical functionality

## 2. Phase 1: Foundation Components

### 2.1 Design System Module

```pseudocode
MODULE DesignSystem {
  // TEST: Design system provides consistent tokens and components
  
  INTERFACE DesignTokens {
    colors: ColorPalette
    typography: TypographyScale
    spacing: SpacingScale
    breakpoints: ResponsiveBreakpoints
    animations: AnimationTokens
  }
  
  INTERFACE ColorPalette {
    primary: ColorScale
    secondary: ColorScale
    semantic: SemanticColors
    neutral: NeutralScale
  }
  
  INTERFACE SemanticColors {
    success: string
    warning: string
    error: string
    info: string
  }
  
  FUNCTION initializeDesignSystem() -> DesignTokens {
    // TEST: Returns valid design tokens with accessibility compliance
    VALIDATE colorContrast(colors) >= 4.5
    VALIDATE typography.sizes.length >= 6
    VALIDATE spacing.scale.length >= 8
    
    RETURN designTokens
  }
  
  FUNCTION validateAccessibility(tokens: DesignTokens) -> ValidationResult {
    // TEST: All color combinations meet WCAG AA standards
    FOR EACH colorCombination IN tokens.colors {
      ASSERT contrastRatio(colorCombination) >= 4.5
    }
    
    // TEST: Typography scale provides readable sizes
    ASSERT tokens.typography.minSize >= 14
    ASSERT tokens.typography.maxSize <= 72
    
    RETURN validationResult
  }
}
```

### 2.2 Responsive Layout System

```pseudocode
MODULE ResponsiveLayout {
  // TEST: Layout adapts correctly across all breakpoints
  
  INTERFACE BreakpointConfig {
    mobile: number    // 320px
    tablet: number    // 768px
    desktop: number   // 1024px
    wide: number      // 1440px
  }
  
  INTERFACE LayoutGrid {
    columns: number
    gutters: number
    margins: number
    maxWidth: number
  }
  
  FUNCTION createResponsiveGrid(breakpoint: string) -> LayoutGrid {
    // TEST: Grid configuration matches design specifications
    SWITCH breakpoint {
      CASE "mobile":
        RETURN { columns: 4, gutters: 16, margins: 16, maxWidth: 320 }
      CASE "tablet":
        RETURN { columns: 8, gutters: 24, margins: 32, maxWidth: 768 }
      CASE "desktop":
        RETURN { columns: 12, gutters: 32, margins: 48, maxWidth: 1200 }
      DEFAULT:
        THROW InvalidBreakpointError
    }
  }
  
  FUNCTION calculateFluidSpacing(minSize: number, maxSize: number, 
                                minViewport: number, maxViewport: number) -> string {
    // TEST: Fluid spacing scales correctly between breakpoints
    VALIDATE minSize > 0 AND maxSize > minSize
    VALIDATE minViewport > 0 AND maxViewport > minViewport
    
    slope = (maxSize - minSize) / (maxViewport - minViewport)
    intercept = minSize - slope * minViewport
    
    RETURN `clamp(${minSize}px, ${intercept}px + ${slope * 100}vw, ${maxSize}px)`
  }
}
```

### 2.3 Accessibility Foundation

```pseudocode
MODULE AccessibilityFoundation {
  // TEST: Accessibility features work correctly across all components
  
  INTERFACE A11yConfig {
    announceChanges: boolean
    keyboardNavigation: boolean
    screenReaderSupport: boolean
    highContrastMode: boolean
  }
  
  INTERFACE FocusManagement {
    currentFocus: HTMLElement | null
    focusHistory: HTMLElement[]
    trapFocus: boolean
  }
  
  FUNCTION initializeA11y(config: A11yConfig) -> A11yManager {
    // TEST: Accessibility manager initializes with correct configuration
    VALIDATE config.announceChanges !== undefined
    VALIDATE config.keyboardNavigation !== undefined
    
    manager = NEW A11yManager(config)
    
    IF config.keyboardNavigation {
      setupKeyboardNavigation()
    }
    
    IF config.screenReaderSupport {
      setupScreenReaderAnnouncements()
    }
    
    RETURN manager
  }
  
  FUNCTION setupKeyboardNavigation() -> void {
    // TEST: Keyboard navigation works for all interactive elements
    LISTEN FOR keydown EVENTS {
      SWITCH event.key {
        CASE "Tab":
          handleTabNavigation(event)
        CASE "Escape":
          handleEscapeKey(event)
        CASE "Enter":
        CASE " ":
          handleActivation(event)
      }
    }
  }
  
  FUNCTION announceToScreenReader(message: string, priority: "polite" | "assertive") -> void {
    // TEST: Screen reader announcements are made with correct priority
    VALIDATE message.length > 0
    VALIDATE priority IN ["polite", "assertive"]
    
    announcer = document.getElementById("sr-announcer")
    announcer.setAttribute("aria-live", priority)
    announcer.textContent = message
    
    // Clear after announcement
    setTimeout(() => announcer.textContent = "", 1000)
  }
  
  FUNCTION trapFocus(container: HTMLElement) -> FocusTrap {
    // TEST: Focus trap contains focus within specified container
    focusableElements = container.querySelectorAll(FOCUSABLE_SELECTORS)
    firstElement = focusableElements[0]
    lastElement = focusableElements[focusableElements.length - 1]
    
    LISTEN FOR keydown ON container {
      IF event.key === "Tab" {
        IF event.shiftKey AND document.activeElement === firstElement {
          event.preventDefault()
          lastElement.focus()
        } ELSE IF NOT event.shiftKey AND document.activeElement === lastElement {
          event.preventDefault()
          firstElement.focus()
        }
      }
    }
    
    RETURN { release: () => removeEventListeners() }
  }
}
```

## 3. Phase 2: Core Workflow Components

### 3.1 Onboarding System

```pseudocode
MODULE OnboardingSystem {
  // TEST: Onboarding guides users through setup efficiently
  
  INTERFACE OnboardingStep {
    id: string
    title: string
    description: string
    component: ReactComponent
    validation?: ValidationFunction
    skippable: boolean
  }
  
  INTERFACE OnboardingState {
    currentStep: number
    completedSteps: string[]
    userProfile: UserProfile
    preferences: UserPreferences
  }
  
  FUNCTION initializeOnboarding(userType: "new" | "returning") -> OnboardingFlow {
    // TEST: Onboarding flow adapts to user type
    IF userType === "new" {
      steps = [
        welcomeStep,
        userTypeSelectionStep,
        basicConfigurationStep,
        aiProviderSetupStep,
        firstAnalysisStep
      ]
    } ELSE {
      steps = [
        welcomeBackStep,
        whatsNewStep,
        preferencesReviewStep
      ]
    }
    
    RETURN NEW OnboardingFlow(steps)
  }
  
  FUNCTION createUserTypeSelectionStep() -> OnboardingStep {
    // TEST: User type selection affects subsequent configuration
    RETURN {
      id: "user-type-selection",
      title: "What describes you best?",
      description: "This helps us customize your experience",
      component: UserTypeSelector,
      validation: (data) => data.userType !== null,
      skippable: false
    }
  }
  
  FUNCTION createSmartDefaults(userType: string) -> DefaultConfiguration {
    // TEST: Smart defaults reduce configuration time by 60%
    SWITCH userType {
      CASE "cfo":
        RETURN {
          defaultPeriods: 4,
          defaultPeriodType: "quarters",
          preferredAnalyses: ["executive-summary", "variance-analysis"],
          aiProvider: "gemini"
        }
      CASE "analyst":
        RETURN {
          defaultPeriods: 6,
          defaultPeriodType: "months",
          preferredAnalyses: ["detailed-audit", "risk-assessment"],
          aiProvider: "claude"
        }
      CASE "controller":
        RETURN {
          defaultPeriods: 12,
          defaultPeriodType: "months",
          preferredAnalyses: ["variance-analysis", "cash-flow-analysis"],
          aiProvider: "gpt-4"
        }
      DEFAULT:
        RETURN defaultConfiguration
    }
  }
  
  FUNCTION progressOnboardingStep(currentState: OnboardingState, 
                                 stepData: any) -> OnboardingState {
    // TEST: Step progression validates data and updates state correctly
    currentStep = currentState.steps[currentState.currentStep]
    
    IF currentStep.validation {
      validationResult = currentStep.validation(stepData)
      IF NOT validationResult.isValid {
        THROW ValidationError(validationResult.errors)
      }
    }
    
    newState = {
      ...currentState,
      currentStep: currentState.currentStep + 1,
      completedSteps: [...currentState.completedSteps, currentStep.id],
      userProfile: mergeUserData(currentState.userProfile, stepData)
    }
    
    // TEST: Progress is persisted for recovery
    persistOnboardingProgress(newState)
    
    RETURN newState
  }
}
```

### 3.2 Input Method Recommendation Engine

```pseudocode
MODULE InputMethodRecommendation {
  // TEST: Recommendation engine suggests optimal input method with >85% accuracy
  
  INTERFACE UserContext {
    hasExistingData: boolean
    dataFormat: "excel" | "pdf" | "manual" | "unknown"
    experienceLevel: "beginner" | "intermediate" | "expert"
    timeConstraints: "low" | "medium" | "high"
    dataComplexity: "simple" | "moderate" | "complex"
  }
  
  INTERFACE RecommendationResult {
    primaryMethod: InputMethod
    alternativeMethods: InputMethod[]
    confidence: number
    reasoning: string[]
  }
  
  FUNCTION analyzeUserContext(userInput: any, sessionHistory: any) -> UserContext {
    // TEST: Context analysis correctly identifies user characteristics
    hasExistingData = detectExistingData(userInput)
    dataFormat = detectDataFormat(userInput)
    experienceLevel = inferExperienceLevel(sessionHistory)
    timeConstraints = inferTimeConstraints(userInput)
    dataComplexity = assessDataComplexity(userInput)
    
    RETURN {
      hasExistingData,
      dataFormat,
      experienceLevel,
      timeConstraints,
      dataComplexity
    }
  }
  
  FUNCTION recommendInputMethod(context: UserContext) -> RecommendationResult {
    // TEST: Recommendations match expected outcomes for known scenarios
    scores = calculateMethodScores(context)
    primaryMethod = getHighestScoredMethod(scores)
    alternatives = getAlternativeMethods(scores, primaryMethod)
    
    confidence = calculateConfidence(scores)
    reasoning = generateReasoning(context, scores)
    
    RETURN {
      primaryMethod,
      alternativeMethods: alternatives,
      confidence,
      reasoning
    }
  }
  
  FUNCTION calculateMethodScores(context: UserContext) -> MethodScores {
    // TEST: Scoring algorithm produces consistent results
    scores = {
      manual: 0,
      excel: 0,
      pdf: 0
    }
    
    // Experience level scoring
    IF context.experienceLevel === "beginner" {
      scores.manual += 30
      scores.excel += 10
      scores.pdf += 5
    } ELSE IF context.experienceLevel === "expert" {
      scores.manual += 10
      scores.excel += 30
      scores.pdf += 25
    }
    
    // Data format scoring
    IF context.dataFormat === "excel" {
      scores.excel += 40
    } ELSE IF context.dataFormat === "pdf" {
      scores.pdf += 40
    } ELSE IF context.dataFormat === "unknown" {
      scores.manual += 20
    }
    
    // Time constraints scoring
    IF context.timeConstraints === "high" {
      scores.pdf += 30
      scores.excel += 20
      scores.manual -= 10
    }
    
    // Data complexity scoring
    IF context.dataComplexity === "complex" {
      scores.excel += 20
      scores.manual -= 15
    }
    
    RETURN scores
  }
  
  FUNCTION generatePreview(method: InputMethod, context: UserContext) -> PreviewData {
    // TEST: Preview accurately represents what user will experience
    SWITCH method {
      CASE "manual":
        RETURN {
          estimatedTime: calculateManualEntryTime(context),
          steps: getManualEntrySteps(context),
          benefits: ["Full control", "No file preparation needed"],
          considerations: ["Time intensive", "Manual validation required"]
        }
      CASE "excel":
        RETURN {
          estimatedTime: "2-5 minutes",
          steps: ["Download template", "Fill data", "Upload file"],
          benefits: ["Fast bulk entry", "Familiar interface"],
          considerations: ["Template preparation", "Format validation"]
        }
      CASE "pdf":
        RETURN {
          estimatedTime: "1-3 minutes",
          steps: ["Upload PDF", "Review extraction", "Confirm data"],
          benefits: ["Fastest option", "AI-powered extraction"],
          considerations: ["Requires AI provider", "May need manual review"]
        }
    }
  }
}
```

### 3.3 Real-time Validation System

```pseudocode
MODULE RealTimeValidation {
  // TEST: Validation prevents 80% of submission errors
  
  INTERFACE ValidationRule {
    field: string
    type: "required" | "numeric" | "range" | "custom"
    params?: any
    message: string
    severity: "error" | "warning" | "info"
  }
  
  INTERFACE ValidationResult {
    isValid: boolean
    errors: ValidationError[]
    warnings: ValidationWarning[]
    suggestions: ValidationSuggestion[]
  }
  
  FUNCTION createValidationEngine(rules: ValidationRule[]) -> ValidationEngine {
    // TEST: Validation engine correctly processes all rule types
    engine = NEW ValidationEngine()
    
    FOR EACH rule IN rules {
      engine.addRule(rule)
    }
    
    RETURN engine
  }
  
  FUNCTION validateField(fieldName: string, value: any, 
                        context: ValidationContext) -> ValidationResult {
    // TEST: Field validation provides immediate feedback within 500ms
    startTime = performance.now()
    
    rules = getFieldRules(fieldName)
    result = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    }
    
    FOR EACH rule IN rules {
      ruleResult = executeValidationRule(rule, value, context)
      
      IF ruleResult.severity === "error" {
        result.isValid = false
        result.errors.push(ruleResult)
      } ELSE IF ruleResult.severity === "warning" {
        result.warnings.push(ruleResult)
      }
    }
    
    // Add smart suggestions
    suggestions = generateSmartSuggestions(fieldName, value, context)
    result.suggestions = suggestions
    
    // TEST: Validation completes within performance budget
    endTime = performance.now()
    ASSERT (endTime - startTime) < 500
    
    RETURN result
  }
  
  FUNCTION generateSmartSuggestions(fieldName: string, value: any, 
                                   context: ValidationContext) -> ValidationSuggestion[] {
    // TEST: Suggestions improve data quality and user experience
    suggestions = []
    
    IF fieldName === "revenue" AND value > 0 {
      previousPeriodRevenue = context.previousPeriods?.revenue
      IF previousPeriodRevenue {
        growthRate = ((value - previousPeriodRevenue) / previousPeriodRevenue) * 100
        
        IF Math.abs(growthRate) > 50 {
          suggestions.push({
            type: "unusual-variance",
            message: `Revenue change of ${growthRate.toFixed(1)}% seems unusual. Please verify.`,
            action: "review-calculation"
          })
        }
      }
    }
    
    IF fieldName === "expenses" AND value > context.revenue {
      suggestions.push({
        type: "logical-inconsistency",
        message: "Expenses exceed revenue. This may indicate a loss period.",
        action: "confirm-values"
      })
    }
    
    RETURN suggestions
  }
  
  FUNCTION createInlineValidationUI(fieldName: string, 
                                   validationResult: ValidationResult) -> ValidationUI {
    // TEST: Validation UI provides clear, actionable feedback
    ui = {
      status: validationResult.isValid ? "valid" : "invalid",
      messages: [],
      actions: []
    }
    
    // Add error messages
    FOR EACH error IN validationResult.errors {
      ui.messages.push({
        type: "error",
        text: error.message,
        icon: "error-circle"
      })
    }
    
    // Add warning messages
    FOR EACH warning IN validationResult.warnings {
      ui.messages.push({
        type: "warning",
        text: warning.message,
        icon: "warning-triangle"
      })
    }
    
    // Add suggestions with actions
    FOR EACH suggestion IN validationResult.suggestions {
      ui.messages.push({
        type: "suggestion",
        text: suggestion.message,
        icon: "lightbulb"
      })
      
      IF suggestion.action {
        ui.actions.push({
          label: getActionLabel(suggestion.action),
          handler: getActionHandler(suggestion.action)
        })
      }
    }
    
    RETURN ui
  }
}
```

## 4. Phase 3: Progress and Feedback Systems

### 4.1 Unified Progress System

```pseudocode
MODULE UnifiedProgressSystem {
  // TEST: Progress system provides consistent feedback across all workflows
  
  INTERFACE ProgressState {
    id: string
    stage: string
    progress: number  // 0-100
    estimatedTimeRemaining?: number
    currentOperation: string
    canCancel: boolean
    canPause: boolean
  }
  
  INTERFACE ProgressConfig {
    showEstimatedTime: boolean
    showDetailedSteps: boolean
    allowCancellation: boolean
    allowPause: boolean
    updateInterval: number
  }
  
  FUNCTION createProgressTracker(operationId: string, 
                                config: ProgressConfig) -> ProgressTracker {
    // TEST: Progress tracker initializes with correct configuration
    tracker = NEW ProgressTracker(operationId, config)
    
    IF config.showEstimatedTime {
      tracker.enableTimeEstimation()
    }
    
    IF config.allowCancellation {
      tracker.enableCancellation()
    }
    
    RETURN tracker
  }
  
  FUNCTION updateProgress(trackerId: string, stage: string, 
                         progress: number, details?: string) -> void {
    // TEST: Progress updates are reflected in UI within 100ms
    VALIDATE progress >= 0 AND progress <= 100
    VALIDATE stage.length > 0
    
    tracker = getTracker(trackerId)
    previousProgress = tracker.progress
    
    tracker.update({
      stage,
      progress,
      currentOperation: details || stage,
      timestamp: Date.now()
    })
    
    // Calculate estimated time remaining
    IF tracker.config.showEstimatedTime {
      estimatedTime = calculateEstimatedTime(tracker)
      tracker.estimatedTimeRemaining = estimatedTime
    }
    
    // Notify UI of progress change
    notifyProgressChange(trackerId, tracker.state)
    
    // TEST: Progress never decreases unless explicitly reset
    ASSERT progress >= previousProgress OR tracker.wasReset
  }
  
  FUNCTION calculateEstimatedTime(tracker: ProgressTracker) -> number {
    // TEST: Time estimation accuracy improves over time
    progressHistory = tracker.getProgressHistory()
    
    IF progressHistory.length < 2 {
      RETURN null
    }
    
    recentProgress = progressHistory.slice(-5)
    timeDeltas = []
    progressDeltas = []
    
    FOR i = 1 TO recentProgress.length - 1 {
      timeDelta = recentProgress[i].timestamp - recentProgress[i-1].timestamp
      progressDelta = recentProgress[i].progress - recentProgress[i-1].progress
      
      IF progressDelta > 0 {
        timeDeltas.push(timeDelta)
        progressDeltas.push(progressDelta)
      }
    }
    
    IF timeDeltas.length === 0 {
      RETURN null
    }
    
    averageTimePerPercent = average(timeDeltas) / average(progressDeltas)
    remainingProgress = 100 - tracker.progress
    estimatedTime = remainingProgress * averageTimePerPercent
    
    RETURN Math.round(estimatedTime / 1000) // Convert to seconds
  }
  
  FUNCTION createProgressUI(trackerId: string) -> ProgressComponent {
    // TEST: Progress UI updates smoothly and provides clear information
    tracker = getTracker(trackerId)
    
    component = {
      progressBar: createProgressBar(tracker.progress),
      stageLabel: createStageLabel(tracker.stage),
      timeRemaining: null,
      cancelButton: null,
      pauseButton: null
    }
    
    IF tracker.config.showEstimatedTime AND tracker.estimatedTimeRemaining {
      component.timeRemaining = createTimeRemainingDisplay(tracker.estimatedTimeRemaining)
    }
    
    IF tracker.config.allowCancellation {
      component.cancelButton = createCancelButton(() => cancelOperation(trackerId))
    }
    
    IF tracker.config.allowPause {
      component.pauseButton = createPauseButton(() => pauseOperation(trackerId))
    }
    
    RETURN component
  }
  
  FUNCTION handleOperationCancellation(trackerId: string) -> void {
    // TEST: Cancellation properly cleans up resources and notifies user
    tracker = getTracker(trackerId)
    
    IF NOT tracker.config.allowCancellation {
      THROW OperationNotCancellableError
    }
    
    // Attempt to cancel the underlying operation
    cancellationResult = cancelUnderlyingOperation(tracker.operationId)
    
    IF cancellationResult.success {
      tracker.setState("cancelled")
      notifyOperationCancelled(trackerId)
      cleanupTracker(trackerId)
    } ELSE {
      // Handle cancellation failure
      tracker.setState("cancellation-failed")
      notifyOperationError(trackerId, cancellationResult.error)
    }
  }
}
```

### 4.2 Background Processing System

```pseudocode
MODULE BackgroundProcessing {
  // TEST: Background processing doesn't block UI and provides notifications
  
  INTERFACE BackgroundTask {
    id: string
    type: "calculation" | "ai-analysis" | "file-processing"
    priority: "low" | "normal" | "high"
    payload: any
    onProgress?: ProgressCallback
    onComplete?: CompletionCallback
    onError?: ErrorCallback
  }
  
  INTERFACE TaskQueue {
    pending: BackgroundTask[]
    running: BackgroundTask[]
    completed: BackgroundTask[]
    failed: BackgroundTask[]
  }
  
  FUNCTION createBackgroundProcessor(maxConcurrentTasks: number) -> BackgroundProcessor {
    // TEST: Background processor manages task queue efficiently
    processor = NEW BackgroundProcessor({
      maxConcurrentTasks,
      taskQueue: createTaskQueue(),
      workers: createWorkerPool()
    })
    
    processor.start()
    RETURN processor
  }
  
  FUNCTION queueBackgroundTask(task: BackgroundTask) -> string {
    // TEST: Tasks are queued and processed in correct priority order
    VALIDATE task.id.length > 0
    VALIDATE task.type IN ["calculation", "ai-analysis", "file-processing"]
    
    taskQueue.pending.push(task)
    sortTasksByPriority(taskQueue.pending)
    
    // Notify processor of new task
    notifyTaskQueued(task.id)
    
    // Start processing if capacity available
    IF taskQueue.running.length < maxConcurrentTasks {
      processNextTask()
    }
    
    RETURN task.id
  }
  
  FUNCTION processNextTask() -> void {
    // TEST: Task processing handles errors gracefully and updates progress
    IF taskQueue.pending.length === 0 {
      RETURN
    }
    
    task = taskQueue.pending.shift()
    taskQueue.running.push(task)
    
    TRY {
      worker = assignWorker(task.type)
      
      worker.execute(task, {
        onProgress: (progress) => {
          IF task.onProgress {
            task.onProgress(progress)
          }
          notifyTaskProgress(task.id, progress)
        },
        onComplete: (result) => {
          moveTaskToCompleted(task, result)
          IF task.onComplete {
            task.onComplete(result)
          }
          notifyTaskCompleted(task.id, result)
          processNextTask() // Process next task in queue
        },
        onError: (error) => {
          moveTaskToFailed(task, error)
          IF task.onError {
            task.onError(error)
          }
          notifyTaskFailed(task.id, error)
          processNextTask() // Continue with next task
        }
      })
    } CATCH error {
      moveTaskToFailed(task, error)
      notifyTaskFailed(task.id, error)
      processNextTask()
    }
  }
  
  FUNCTION createNotificationSystem() -> NotificationSystem {
    // TEST: Notifications appear at appropriate times and are dismissible
    system = NEW NotificationSystem({
      maxNotifications: 5,
      defaultDuration: 5000,
      position: "top-right"
    })
    
    RETURN system
  }
  
  FUNCTION showTaskNotification(taskId: string, type: "progress" | "complete" | "error", 
                               data: any) -> void {
    // TEST: Task notifications provide clear status and actions
    task = getTask(taskId)
    
    SWITCH type {
      CASE "progress":
        IF data.progress % 25 === 0 { // Show notifications at 25% intervals
          showNotification({
            title: `${task.type} in progress`,
            message: `${data.stage} - ${data.progress}% complete`,
            type: "info",
            duration: 3000
          })
        }
        
      CASE "complete":
        showNotification({
          title: `${task.type} completed`,
          message: "Click to view results",
          type: "success",
          duration: 8000,
          actions: [{
            label: "View Results",
            handler: () => navigateToResults(taskId)
          }]
        })
        
      CASE "error":
        showNotification({
          title: `${task.type} failed`,
          message: data.error.message,
          type: "error",
          duration: 0, // Persistent until dismissed
          actions: [{
            label: "Retry",
            handler: () => retryTask(taskId)
          }, {
            label: "Report Issue",
            handler: () => reportIssue(taskId, data.error)
          }]
        })
    }
  }
}
```

## 5. Phase 4: Advanced Features

### 5.1 Customizable Dashboard System

```pseudocode
MODULE CustomizableDashboard {
  // TEST: Dashboard customization persists and improves user productivity
  
  INTERFACE DashboardWidget {
    id: string
    type: "kpi" | "chart" | "table" | "summary"
    title: string
    size: "small" | "medium" | "large"
    position: { x: number, y: number }
    config: WidgetConfig
    data?: any
  }
  
  INTERFACE DashboardLayout {
    id: string
    name: string
    widgets: DashboardWidget[]
    gridConfig: GridConfig
    isDefault: boolean
  }
  
  FUNCTION createDashboardManager(userId: string) -> DashboardManager {
    // TEST: Dashboard manager loads user preferences correctly
    manager = NEW DashboardManager(userId)
    
    // Load saved layouts
    savedLayouts = loadUserLayouts(userId)
    manager.layouts = savedLayouts
    
    // Set default layout if none exists
    IF savedLayouts.length === 0 {
      defaultLayout = createDefaultLayout(userId)
      manager.layouts.push(defaultLayout)
      manager.activeLayout = defaultLayout
    } ELSE {
      manager.activeLayout = savedLayouts.find(l => l.isDefault) || savedLayouts[0]
    }
    
    RETURN manager
  }
  
  FUNCTION createDefaultLayout(userId: string) -> DashboardLayout {
    // TEST: Default layout provides useful widgets for new users
    RETURN {
      id: generateId(),
      name: "Default Dashboard",
      isDefault: true,
      gridConfig: {
        columns: 12,
        rowHeight: 100,
        margin: [16, 16]
      },
      widgets: [
        {
          id: "revenue-kpi",
          type: "kpi",
          title: "Total Revenue",
          size: "medium",
          position: { x: 0, y: 0 },
          config: { metric: "revenue", format: "currency" }
        },
        {
          id: "profit-margin-kpi",
          type: "kpi", 
          title: "Profit Margin",
          size: "medium",
          position: { x: 4, y: 0 },
          config: { metric: "profitMargin", format: "percentage" }
        },
        {
          id: "revenue-trend",
          type: "chart",
          title: "Revenue Trend",
          size: "large",
          position: { x: 0, y: 2 },
          config: { chartType: "line", metric: "revenue", periods: 6 }
        }
      ]
    }
  }
  
  FUNCTION addWidget(layoutId: string, widgetType: string, 
                    position: Position) -> DashboardWidget {
    // TEST: Widget addition updates layout and persists changes
    layout = getLayout(layoutId)
    
    widget = createWidget(widgetType, position)
    
    // Find available position if collision detected
    IF detectCollision(widget, layout.widgets) {
      widget.position = findAvailablePosition(widget.size, layout)
    }
    
    layout.widgets.push(widget)
    
    // Persist layout changes
    saveLayout(layout)
    
    // Notify UI of