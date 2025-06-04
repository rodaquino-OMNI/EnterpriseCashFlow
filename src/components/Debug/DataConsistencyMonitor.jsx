// src/components/Debug/DataConsistencyMonitor.jsx
import React, { useState } from 'react';
import { formatCurrency, formatDays, formatPercentage } from '../../utils/formatters';

const parseToNumber = (value, defaultValue = 0) => {
  if (value === null || typeof value === 'undefined' || value === '') return defaultValue;
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
};

const PeriodSelector = ({ calculatedData, selectedPeriodIndex, onPeriodChange }) => {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-slate-700 mb-2">
        Período para Análise:
      </label>
      <select
        value={selectedPeriodIndex}
        onChange={(e) => onPeriodChange(parseInt(e.target.value))}
        className="bg-white border border-slate-300 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
      >
        <option value={-1}>Último Período (Período {calculatedData.length})</option>
        {calculatedData.map((_, index) => (
          <option key={index} value={index}>
            Período {index + 1}
          </option>
        ))}
      </select>
    </div>
  );
};

const KeyMetricsPanel = ({ periodData }) => {
  if (!periodData) return <p>Dados do período não disponíveis.</p>;
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
      <div className="bg-slate-50 p-3 rounded border">
        <h5 className="font-semibold text-slate-700 mb-2">Receita & Margens</h5>
        <p>Receita: {formatCurrency(periodData.revenue)}</p>
        <p>Margem Bruta: {formatPercentage(periodData.gmPct)}%</p>
        <p>Margem Líquida: {formatPercentage(periodData.netProfitPct)}%</p>
      </div>
      <div className="bg-slate-50 p-3 rounded border">
        <h5 className="font-semibold text-slate-700 mb-2">Capital de Giro</h5>
        <p>PME: {formatDays(periodData.invDays)}</p>
        <p>PMR: {formatDays(periodData.arDays)}</p>
        <p>PMP: {formatDays(periodData.apDays)}</p>
        <p>Ciclo: {formatDays(periodData.wcDays)}</p>
      </div>
      <div className="bg-slate-50 p-3 rounded border">
        <h5 className="font-semibold text-slate-700 mb-2">Balanço</h5>
        <p>Total Ativos: {formatCurrency(periodData.estimatedTotalAssets)}</p>
        <p>Total Passivos: {formatCurrency(periodData.estimatedTotalLiabilities)}</p>
        <p>Patrimônio Líquido: {formatCurrency(periodData.equity)}</p>
        <p className={`font-bold ${Math.abs(periodData.balanceSheetDifference || 0) > 1.01 ? 'text-red-600' : 'text-green-600'}`}>
          Diff BS: {formatCurrency(periodData.balanceSheetDifference)}
        </p>
      </div>
    </div>
  );
};

const AuditTrailPanel = ({ auditTrail }) => {
  if (!auditTrail || auditTrail.length === 0) {
    return <p>Nenhum audit trail disponível para este período.</p>;
  }
  return (
    <div className="space-y-2 max-h-96 overflow-y-auto">
      {auditTrail.map((entry, index) => (
        <div key={index} className="bg-slate-50 p-2 rounded text-xs border">
          <div className="flex justify-between items-start">
            <span className="font-medium text-slate-700">{entry.field}</span>
            <span className="text-slate-500 text-xs">{entry.source}</span>
          </div>
          <div className="mt-1">
            <span className="text-green-700">{formatCurrency(entry.value)}</span>
            {entry.calculatedValueIfOverridden !== null && (
              <span className="text-orange-600 ml-2">
                (calc: {formatCurrency(entry.calculatedValueIfOverridden)})
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

const ValidationIssuesPanel = ({ validationIssuesFromEngine }) => {
  if (!validationIssuesFromEngine || (validationIssuesFromEngine.errors.length === 0 && validationIssuesFromEngine.warnings.length === 0 && (validationIssuesFromEngine.infos || []).length === 0)) {
    return (
      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
        <h4 className="font-semibold text-green-800 mb-2">✅ Validação de Constraints OK</h4>
        <p className="text-sm text-green-700">Nenhum erro ou aviso crítico de constraint financeira detectado neste período pela engine.</p>
      </div>
    );
  }
  const { errors, warnings, infos = [] } = validationIssuesFromEngine;
  return (
    <div className="space-y-3">
      {errors.length > 0 && (
        <div className="bg-red-100 p-3 rounded-lg border border-red-300">
          <h5 className="font-semibold text-red-800 mb-2">🚨 Erros de Constraint ({errors.length})</h5>
          <ul className="space-y-1 text-xs text-red-700 list-disc pl-5">
            {errors.map((error, index) => (
              <li key={`err-${index}`}>
                <strong>{error.type}:</strong> {error.message}
              </li>
            ))}
          </ul>
        </div>
      )}
      {warnings.length > 0 && (
        <div className="bg-yellow-100 p-3 rounded-lg border border-yellow-300">
          <h5 className="font-semibold text-yellow-800 mb-2">⚠️ Avisos de Constraint ({warnings.length})</h5>
          <ul className="space-y-1 text-xs text-yellow-700 list-disc pl-5">
            {warnings.map((warning, index) => (
              <li key={`warn-${index}`}>
                <strong>{warning.type}:</strong> {warning.message}
              </li>
            ))}
          </ul>
        </div>
      )}
      {infos.length > 0 && (
        <div className="bg-blue-100 p-3 rounded-lg border border-blue-300">
          <h5 className="font-semibold text-blue-800 mb-2">ℹ️ Informações ({infos.length})</h5>
          <ul className="space-y-1 text-xs text-blue-700 list-disc pl-5">
            {infos.map((info, index) => (
              <li key={`info-${index}`}>
                <strong>{info.type}:</strong> {info.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// Enhanced Diagnosis Panel focusing on Cash Flow and BS Difference
const DiagnosisPanelForMonitor = ({ periodData }) => {
    if (!periodData) return <p>Selecione um período para diagnóstico.</p>;

    const { 
        calculatedOpeningCash, netChangeInCash, closingCash, 
        cashReconciliationDifference,
        override_closingCash, // Raw override input from spread rawInput
        estimatedTotalAssets, estimatedTotalLiabilities, equity, balanceSheetDifference
    } = periodData;

    const rawOverrideClosingCash = override_closingCash;
    const dfcCalculatedInternalClosingCash = (calculatedOpeningCash || 0) + (netChangeInCash || 0);
    const isCashOverridden = rawOverrideClosingCash !== null && typeof rawOverrideClosingCash !== 'undefined' && String(rawOverrideClosingCash).trim() !== '';

    return (
        <div className="space-y-4 text-xs">
            <div className="p-3 bg-sky-50 border border-sky-200 rounded-md shadow-sm">
                <h5 className="font-semibold text-sky-800 mb-2 text-sm">Diagnóstico do Fluxo de Caixa (DFC)</h5>
                <table className="w-full text-left">
                    <tbody>
                        <tr className="border-b"><td className="py-1 pr-2 text-slate-600">Caixa Inicial (Usado no DFC):</td><td className="py-1 font-medium text-slate-700">{formatCurrency(calculatedOpeningCash)}</td></tr>
                        <tr className="border-b"><td className="py-1 pr-2 text-slate-600">Variação Líquida de Caixa (Calculada DFC):</td><td className="py-1 font-medium text-slate-700">{formatCurrency(netChangeInCash)}</td></tr>
                        <tr className="border-b"><td className="py-1 pr-2 font-semibold text-slate-800">Subtotal (Caixa Final Calculado pelo DFC):</td><td className="py-1 font-bold text-slate-900">{formatCurrency(dfcCalculatedInternalClosingCash)}</td></tr>
                        <tr><td colSpan="2" className="pt-2"></td></tr>
                        <tr className="border-b"><td className="py-1 pr-2 text-slate-600">Input de Override para Caixa Final:</td><td className="py-1 font-medium text-orange-600">{isCashOverridden ? formatCurrency(parseToNumber(rawOverrideClosingCash)) : <span className="italic text-slate-500">Não fornecido</span>}</td></tr>
                        <tr className="border-b"><td className="py-1 pr-2 font-bold text-blue-700">Caixa Final (Final, Usado no Balanço):</td><td className="py-1 font-extrabold text-blue-700">{formatCurrency(closingCash)}</td></tr>
                        <tr>
                            <td className="py-1 pr-2 font-semibold text-purple-700">Diferença de Reconciliação de Caixa <br/>(Final - DFC Calc):</td>
                            <td className={`py-1 font-bold ${Math.abs(cashReconciliationDifference || 0) > 0.015 ? 'text-orange-700' : 'text-green-700'}`}>
                                {formatCurrency(cashReconciliationDifference)}
                            </td>
                        </tr>
                    </tbody>
                </table>
                {Math.abs(cashReconciliationDifference || 0) > 0.015 && <p className="text-xs italic text-orange-600 mt-2">Esta diferença mostra o impacto do override de caixa final nos cálculos do balanço.</p>}
            </div>

            <div className="p-3 bg-lime-50 border border-lime-200 rounded-md shadow-sm">
                <h5 className="font-semibold text-lime-800 mb-2 text-sm">Diagnóstico do Balanço Patrimonial</h5>
                <table className="w-full text-left">
                     <tbody>
                        <tr className="border-b"><td className="py-1 pr-2 text-slate-600">Total Ativos (Estimado SSOT):</td><td className="py-1 font-medium text-slate-700">{formatCurrency(estimatedTotalAssets)}</td></tr>
                        <tr className="border-b"><td className="py-1 pr-2 text-slate-600">Total Passivos (Estimado SSOT):</td><td className="py-1 font-medium text-slate-700">{formatCurrency(estimatedTotalLiabilities)}</td></tr>
                        <tr className="border-b"><td className="py-1 pr-2 text-slate-600">Patrimônio Líquido (Final SSOT):</td><td className="py-1 font-medium text-slate-700">{formatCurrency(equity)}</td></tr>
                        <tr className="border-b"><td className="py-1 pr-2 font-semibold text-slate-800">Subtotal (Passivos + PL):</td><td className="py-1 font-bold text-slate-900">{formatCurrency((estimatedTotalLiabilities || 0) + (equity || 0))}</td></tr>
                        <tr>
                            <td className="py-1 pr-2 font-bold text-purple-700">Diferença de Balanço (A - (L+E) SSOT):</td>
                            <td className={`py-1 font-extrabold ${Math.abs(balanceSheetDifference || 0) > 1.01 ? 'text-red-700' : 'text-green-700'}`}>
                                {formatCurrency(balanceSheetDifference)}
                            </td>
                        </tr>
                    </tbody>
                </table>
                {Math.abs(balanceSheetDifference || 0) > 1.01 && <p className="text-xs italic text-red-600 mt-2">Diferença no balanço pode ser causada por overrides (especialmente de Caixa Final) ou simplificações no modelo de passivos.</p>}
            </div>
        </div>
    );
};

export default function DataConsistencyMonitor({ calculatedData, isVisible = false, onClose }) {
  const [selectedPeriodIndex, setSelectedPeriodIndex] = useState(-1); 
  const [activeTab, setActiveTab] = useState('diagnosis'); 

  const isDevelopment = process.env.NODE_ENV === 'development';
  if (!isVisible || !isDevelopment || !calculatedData || calculatedData.length === 0) return null;

  const currentPeriodIdx = selectedPeriodIndex === -1 ? calculatedData.length - 1 : selectedPeriodIndex;
  const selectedPeriodData = calculatedData[currentPeriodIdx];
  const periodLabel = selectedPeriodIndex === -1 ? `Último Período (${calculatedData.length})` : `Período ${currentPeriodIdx + 1}`;
  
  const validationIssuesForSelectedPeriod = selectedPeriodData?._validationIssues || { errors: [], warnings: [], infos: [], successes: [] };
  const auditTrailForSelectedPeriod = selectedPeriodData?._auditTrail || [];

  if (!selectedPeriodData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-[200] p-2 no-print">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
          <h3 className="text-lg font-semibold text-red-600 mb-2">Erro no Monitor</h3>
          <p className="text-slate-700">Dados do período selecionado não encontrados.</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-700">
            Fechar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-[200] p-2 no-print">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-4 border-b bg-slate-50">
          <div>
            <h2 className="text-lg font-bold text-slate-700">Monitor de Consistência e Auditoria (DEV)</h2>
            <p className="text-xs text-slate-500">Analisando: {periodLabel}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl">&times;</button>
        </div>
        <div className="p-3 border-b bg-slate-50">
          <PeriodSelector calculatedData={calculatedData} selectedPeriodIndex={selectedPeriodIndex} onPeriodChange={setSelectedPeriodIndex} />
        </div>
        <div className="flex border-b bg-slate-50 text-sm">
          {['diagnosis', 'validation', 'audit', 'overview'].map((tabId) => (
            <button key={tabId} onClick={() => setActiveTab(tabId)}
              className={`px-3 py-2 font-medium border-b-2 whitespace-nowrap ${activeTab === tabId ? 'border-blue-500 text-blue-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
            >
              {tabId === 'diagnosis' ? '🩺 Diagnóstico' : tabId === 'validation' ? '✅ Validação Interna' : tabId === 'audit' ? '🔍 Trilha Auditoria' : '📊 Métricas'}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeTab === 'diagnosis' && <DiagnosisPanelForMonitor periodData={selectedPeriodData} />}
          {activeTab === 'validation' && <ValidationIssuesPanel validationIssuesFromEngine={validationIssuesForSelectedPeriod} />}
          {activeTab === 'audit' && <AuditTrailPanel auditTrail={auditTrailForSelectedPeriod} />}
          {activeTab === 'overview' && <KeyMetricsPanel periodData={selectedPeriodData} />}
        </div>
        <div className="p-3 border-t bg-slate-50 text-right">
          <button onClick={() => console.log('Selected Period SSOT Data:', selectedPeriodData)}
            className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700">
            Log Dados do Período no Console
          </button>
        </div>
      </div>
    </div>
  );
}