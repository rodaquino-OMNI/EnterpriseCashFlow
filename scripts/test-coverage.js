#!/usr/bin/env node

/**
 * Test Coverage Script
 * Runs all tests and generates comprehensive coverage report
 */

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Coverage thresholds
const COVERAGE_THRESHOLDS = {
  global: {
    branches: 80,
    functions: 80,
    lines: 80,
    statements: 80
  },
  critical: {
    // Critical paths requiring 100% coverage
    'src/utils/calculations.js': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    },
    'src/utils/financialValidators.js': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    },
    'src/utils/dataValidation.js': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95
    }
  }
};

// Test suites to run
const TEST_SUITES = [
  {
    name: 'Unit Tests',
    pattern: 'src/**/*.test.js',
    exclude: ['integration', 'e2e', 'performance']
  },
  {
    name: 'Integration Tests',
    pattern: 'src/**/*.integration.test.js'
  },
  {
    name: 'Component Tests',
    pattern: 'src/components/**/*.test.js'
  },
  {
    name: 'Performance Tests',
    pattern: 'src/**/*.performance.test.js',
    env: { NODE_ENV: 'production' }
  }
];

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'bright');
  console.log('='.repeat(60));
}

async function runCommand(command, options = {}) {
  return new Promise((resolve, reject) => {
    exec(command, options, (error, stdout, stderr) => {
      if (error) {
        reject({ error, stdout, stderr });
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

async function runTests() {
  logSection('🧪 Enterprise CashFlow - Comprehensive Test Coverage');
  
  try {
    // Clean previous coverage
    log('\n📦 Cleaning previous coverage reports...', 'cyan');
    await runCommand('rm -rf coverage');
    
    // Run all test suites
    for (const suite of TEST_SUITES) {
      log(`\n🏃 Running ${suite.name}...`, 'blue');
      
      const env = {
        ...process.env,
        ...suite.env,
        CI: 'true'
      };
      
      try {
        const result = await runCommand(
          `npm test -- --coverage --testMatch="**/${suite.pattern}" --coverageDirectory=coverage/${suite.name.toLowerCase().replace(' ', '-')}`,
          { env }
        );
        
        log(`✅ ${suite.name} completed successfully`, 'green');
        
        // Parse and display key metrics
        const coverageMatch = result.stdout.match(/All files\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)/);
        if (coverageMatch) {
          const [, stmts, branch, funcs, lines] = coverageMatch;
          log(`   Coverage: Statements: ${stmts}% | Branches: ${branch}% | Functions: ${funcs}% | Lines: ${lines}%`, 'cyan');
        }
      } catch (error) {
        log(`❌ ${suite.name} failed`, 'red');
        console.error(error.stderr);
      }
    }
    
    // Merge coverage reports
    log('\n📊 Merging coverage reports...', 'cyan');
    await runCommand('npx nyc merge coverage coverage/merged.json');
    await runCommand('npx nyc report --reporter=html --reporter=lcov --reporter=text-summary --temp-dir=coverage');
    
    // Check coverage thresholds
    logSection('📈 Coverage Threshold Check');
    
    const coverageSummary = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'coverage', 'coverage-final.json'), 'utf8')
    );
    
    let allThresholdsMet = true;
    
    // Check global thresholds
    const totalCoverage = calculateTotalCoverage(coverageSummary);
    log('\nGlobal Coverage:', 'bright');
    
    Object.entries(COVERAGE_THRESHOLDS.global).forEach(([metric, threshold]) => {
      const value = totalCoverage[metric];
      const passed = value >= threshold;
      
      log(
        `  ${metric}: ${value.toFixed(2)}% (threshold: ${threshold}%) ${passed ? '✅' : '❌'}`,
        passed ? 'green' : 'red'
      );
      
      if (!passed) allThresholdsMet = false;
    });
    
    // Check critical path coverage
    log('\nCritical Path Coverage:', 'bright');
    
    Object.entries(COVERAGE_THRESHOLDS.critical).forEach(([file, thresholds]) => {
      const fileCoverage = Object.entries(coverageSummary).find(([path]) => 
        path.includes(file.replace('src/', ''))
      );
      
      if (fileCoverage) {
        const [filePath, coverage] = fileCoverage;
        log(`\n  ${file}:`, 'cyan');
        
        Object.entries(thresholds).forEach(([metric, threshold]) => {
          const metricKey = metric === 'branches' ? 'b' : 
                           metric === 'functions' ? 'f' : 
                           metric === 'lines' ? 'l' : 's';
          
          const value = (coverage[metricKey].pct || 0);
          const passed = value >= threshold;
          
          log(
            `    ${metric}: ${value.toFixed(2)}% (threshold: ${threshold}%) ${passed ? '✅' : '❌'}`,
            passed ? 'green' : 'red'
          );
          
          if (!passed) allThresholdsMet = false;
        });
      } else {
        log(`  ${file}: NOT FOUND ❌`, 'red');
        allThresholdsMet = false;
      }
    });
    
    // Generate detailed report
    logSection('📄 Generating Detailed Reports');
    
    log('HTML Report: coverage/index.html', 'cyan');
    log('LCOV Report: coverage/lcov.info', 'cyan');
    
    // Run E2E tests separately (if Cypress is installed)
    try {
      await runCommand('which cypress');
      log('\n🌐 Running E2E Tests...', 'blue');
      await runCommand('npm run cypress:run');
      log('✅ E2E Tests completed', 'green');
    } catch {
      log('\n⚠️  Cypress not installed - skipping E2E tests', 'yellow');
    }
    
    // Final summary
    logSection('📋 Test Summary');
    
    if (allThresholdsMet) {
      log('✅ All coverage thresholds met!', 'green');
      log('\n🎉 Test suite passed with excellent coverage!', 'bright');
    } else {
      log('❌ Some coverage thresholds not met', 'red');
      log('\n⚠️  Please improve test coverage for the failing areas', 'yellow');
      process.exit(1);
    }
    
  } catch (error) {
    log('\n❌ Test execution failed', 'red');
    console.error(error);
    process.exit(1);
  }
}

function calculateTotalCoverage(coverageSummary) {
  const totals = {
    statements: { total: 0, covered: 0 },
    branches: { total: 0, covered: 0 },
    functions: { total: 0, covered: 0 },
    lines: { total: 0, covered: 0 }
  };
  
  Object.values(coverageSummary).forEach(file => {
    totals.statements.total += file.s ? Object.keys(file.s).length : 0;
    totals.statements.covered += file.s ? Object.values(file.s).filter(v => v > 0).length : 0;
    
    totals.branches.total += file.b ? Object.values(file.b).flat().length : 0;
    totals.branches.covered += file.b ? Object.values(file.b).flat().filter(v => v > 0).length : 0;
    
    totals.functions.total += file.f ? Object.keys(file.f).length : 0;
    totals.functions.covered += file.f ? Object.values(file.f).filter(v => v > 0).length : 0;
    
    totals.lines.total += file.l ? Object.keys(file.l).length : 0;
    totals.lines.covered += file.l ? Object.values(file.l).filter(v => v > 0).length : 0;
  });
  
  return {
    statements: (totals.statements.covered / totals.statements.total) * 100 || 0,
    branches: (totals.branches.covered / totals.branches.total) * 100 || 0,
    functions: (totals.functions.covered / totals.functions.total) * 100 || 0,
    lines: (totals.lines.covered / totals.lines.total) * 100 || 0
  };
}

// Run the tests
runTests().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});