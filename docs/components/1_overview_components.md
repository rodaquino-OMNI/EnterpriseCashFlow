# Component Documentation Overview

This document provides an overview of the EnterpriseCashFlow component architecture and documentation structure.

## Table of Contents

- [Component Architecture](#component-architecture)
- [Documentation Structure](#documentation-structure)
- [Component Categories](#component-categories)
- [Getting Started](#getting-started)
- [Design System Integration](#design-system-integration)
- [Cross-References](#cross-references)

---

## Component Architecture

The EnterpriseCashFlow application follows a modular component architecture with clear separation of concerns:

### Component Hierarchy

```
src/components/
├── ui/                    # Base UI components
├── Charts/               # Data visualization components
├── InputPanel/           # Data input and upload components
├── ReportPanel/          # Financial report display components
├── AIPanel/              # AI analysis and insights components
├── Debug/                # Development and debugging components
└── demo/                 # Design system demonstration
```

### Design Principles

- **Modularity**: Each component has a single responsibility
- **Reusability**: Components are designed for reuse across the application
- **Accessibility**: All components follow WCAG 2.1 AA guidelines
- **Type Safety**: Full TypeScript support with comprehensive interfaces
- **Design System**: Consistent styling using centralized design tokens

---

## Documentation Structure

Component documentation is organized into the following files:

1. **[1_overview_components.md](1_overview_components.md)** - This overview document
2. **[2_ui_components.md](2_ui_components.md)** - Base UI components (Button, Input, FormField)
3. **[3_chart_components.md](3_chart_components.md)** - Data visualization components
4. **[4_input_components.md](4_input_components.md)** - Data input and upload components
5. **[5_report_components.md](5_report_components.md)** - Financial report components
6. **[6_ai_components.md](6_ai_components.md)** - AI analysis components
7. **[7_design_system.md](7_design_system.md)** - Design system and tokens

---

## Component Categories

### UI Components (`src/components/ui/`)

Base reusable UI components that form the foundation of the design system:

- **[`Button`](../src/components/ui/Button.jsx)** - Primary action component with multiple variants
- **[`Input`](../src/components/ui/Input.jsx)** - Form input component with validation support
- **[`FormField`](../src/components/ui/FormField.jsx)** - Complete form field with label and error handling

### Chart Components (`src/components/Charts/`)

Data visualization components built on Recharts:

- **[`BaseChart`](../src/components/Charts/BaseChart.jsx)** - Foundation chart component with common functionality
- **[`CashFlowComponentsChart`](../src/components/Charts/CashFlowComponentsChart.jsx)** - Cash flow breakdown visualization
- **[`PnlVisualChart`](../src/components/Charts/PnlVisualChart.jsx)** - Profit & Loss visualization
- **[`AssetCompositionChart`](../src/components/Charts/AssetCompositionChart.jsx)** - Asset allocation visualization

### Input Panel Components (`src/components/InputPanel/`)

Components for data input and file processing:

- **[`ExcelUploader`](../src/components/InputPanel/ExcelUploader.jsx)** - Excel file upload and processing
- **[`PdfUploader`](../src/components/InputPanel/PdfUploader.jsx)** - PDF file upload and parsing
- **[`ManualDataEntry`](../src/components/InputPanel/ManualDataEntry.jsx)** - Manual financial data entry
- **[`AiProviderSelector`](../src/components/InputPanel/AiProviderSelector.jsx)** - AI service provider selection

### Report Panel Components (`src/components/ReportPanel/`)

Financial report display and analysis components:

- **[`FinancialTables`](../src/components/ReportPanel/FinancialTables.jsx)** - Tabular financial data display
- **[`KpiCards`](../src/components/ReportPanel/KpiCards.jsx)** - Key performance indicator cards
- **[`ExecutiveSummaryCards`](../src/components/ReportPanel/ExecutiveSummaryCards.jsx)** - High-level summary cards
- **[`PowerOfOneAnalysis`](../src/components/ReportPanel/PowerOfOneAnalysis.jsx)** - Financial sensitivity analysis

### AI Panel Components (`src/components/AIPanel/`)

AI-powered analysis and insights components:

- **[`AIPanel`](../src/components/AIPanel/AIPanel.jsx)** - Main AI analysis container
- **[`AiAnalysisSection`](../src/components/AIPanel/AiAnalysisSection.jsx)** - AI-generated financial analysis
- **[`AiSummarySection`](../src/components/AIPanel/AiSummarySection.jsx)** - Executive summary generation
- **[`AiVarianceSection`](../src/components/AIPanel/AiVarianceSection.jsx)** - Variance analysis insights

---

## Getting Started

### Prerequisites

- React 18+
- Node.js 16+
- Understanding of financial concepts
- Familiarity with TypeScript (recommended)

### Basic Usage

```jsx
import { Button, Input, FormField } from '../components/ui';
import { CashFlowComponentsChart } from '../components/Charts';

function MyComponent() {
  return (
    <div>
      <FormField label="Revenue">
        <Input type="number" placeholder="Enter revenue" />
      </FormField>
      <Button variant="primary">Calculate</Button>
      <CashFlowComponentsChart data={financialData} />
    </div>
  );
}
```

### Component Import Patterns

```jsx
// UI Components
import { Button, Input, FormField } from '../components/ui';

// Chart Components
import { BaseChart, CashFlowComponentsChart } from '../components/Charts';

// Specialized Components
import { ExcelUploader } from '../components/InputPanel';
import { AIPanel } from '../components/AIPanel';
```

---

## Design System Integration

All components integrate with the centralized design system located at [`src/design-system/tokens.js`](../src/design-system/tokens.js).

### Key Design Tokens

- **Colors**: Primary, secondary, semantic, and financial context colors
- **Typography**: Font families, sizes, weights, and line heights
- **Spacing**: 8px grid system for consistent spacing
- **Shadows**: Elevation system for depth and hierarchy
- **Border Radius**: Consistent corner radius values

### Usage Example

```jsx
import { designTokens } from '../design-system/tokens';

const styles = {
  button: {
    backgroundColor: designTokens.colors.primary[500],
    padding: designTokens.spacing[4],
    borderRadius: designTokens.borderRadius.md,
    boxShadow: designTokens.shadows.sm
  }
};
```

---

## Cross-References

### Related Documentation

- **[API Documentation](../api/)** - Backend integration patterns
- **[Hooks Documentation](../hooks/)** - Custom React hooks
- **[Integration Guides](../guides/)** - Component integration patterns
- **[Testing Documentation](../testing/)** - Component testing strategies

### External Dependencies

- **[Recharts](https://recharts.org/)** - Chart library documentation
- **[React Hook Form](https://react-hook-form.com/)** - Form handling library
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework

---

## Next Steps

1. **[Explore UI Components](2_ui_components.md)** - Learn about base UI components
2. **[Chart Components Guide](3_chart_components.md)** - Understand data visualization
3. **[Design System Reference](7_design_system.md)** - Deep dive into design tokens
4. **[Integration Patterns](../guides/)** - Learn component integration best practices

---

*Last updated: January 2025*
*Version: 1.0.0*