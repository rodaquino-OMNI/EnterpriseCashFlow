// src/components/InputPanel/PeriodTypeConfirmation.jsx
import React from 'react';
import { PERIOD_TYPES } from '../../utils/constants';

/**
 * @param {{
 * detectedPeriodType: import('../../types/financial').PeriodTypeOption | null;
 * expectedPeriodType: import('../../types/financial').PeriodTypeOption;
 * onConfirm: (confirmedPeriodType: import('../../types/financial').PeriodTypeOption) => void;
 * onCancel: () => void;
 * isVisible: boolean;
 * }} props
 */
export default function PeriodTypeConfirmation({
  detectedPeriodType,
  expectedPeriodType,
  onConfirm,
  onCancel,
  isVisible,
}) {
  if (!isVisible || !detectedPeriodType || detectedPeriodType === expectedPeriodType) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 no-print">
      <div className="bg-white rounded-xl shadow-2xl p-6 md:p-8 max-w-md w-full transform transition-all scale-100 opacity-100">
        <div className="flex items-start mb-4">
          <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 sm:mx-0 sm:h-10 sm:w-10">
            <svg className="h-6 w-6 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="ml-4 text-left">
            <h3 className="text-lg font-semibold text-slate-800" id="modal-title">
                    ⚠️ Divergência no Tipo de Período
            </h3>
          </div>
        </div>
        
        <div className="mb-6 text-sm text-slate-600 space-y-3">
          <p>O tipo de período configurado na aplicação difere do que foi possivelmente detectado no arquivo Excel (ou não foi detectado explicitamente).</p>
          <div className="bg-slate-50 p-3 rounded-md border border-slate-200">
            <p><strong>Configuração Atual da App:</strong> <span className="font-medium text-blue-600">{PERIOD_TYPES[expectedPeriodType]?.label || expectedPeriodType}</span></p>
            <p><strong>Sugerido/Detectado no Excel:</strong> <span className="font-medium text-orange-600">{PERIOD_TYPES[detectedPeriodType]?.label || detectedPeriodType}</span></p>
          </div>
          <p>
            Usar o tipo de período incorreto pode afetar significativamente os cálculos de dias (PMR, PME, PMP) e outras métricas anualizadas. Como deseja proceder?
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row-reverse gap-3">
          <button
            onClick={() => onConfirm(detectedPeriodType)} // Use detected from Excel
            className="w-full sm:w-auto btn-primary"
          >
            Usar Detectado do Excel ({PERIOD_TYPES[detectedPeriodType]?.label})
          </button>
          <button
            onClick={() => onConfirm(expectedPeriodType)} // Keep App's current setting
            className="w-full sm:w-auto btn-secondary bg-slate-600 hover:bg-slate-700 focus:ring-slate-500"
          >
            Manter da App ({PERIOD_TYPES[expectedPeriodType]?.label})
          </button>
          <button
            onClick={onCancel}
            className="w-full sm:w-auto px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50"
          >
            Cancelar Upload
          </button>
        </div>
      </div>
    </div>
  );
}