/**
 * @fileoverview Session Recovery Component
 * Displays a modal prompting the user to recover a previous session
 */

import React from 'react';

/**
 * SessionRecovery Component
 * Shows a modal with options to recover or discard a previous session
 *
 * @param {Object} props
 * @param {Object} props.sessionData - The recovered session data
 * @param {Function} props.onRecover - Callback when user chooses to recover
 * @param {Function} props.onDiscard - Callback when user chooses to discard
 */
const SessionRecovery = ({ sessionData, onRecover, onDiscard }) => {
  if (!sessionData) return null;

  // Calculate how long ago the session was saved
  const getTimeSince = (timestamp) => {
    if (!timestamp) return 'Unknown time';

    const now = Date.now();
    const diff = now - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;

    const days = Math.floor(hours / 24);
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  };

  // Extract info about what was saved
  const hasInputData = sessionData.currentInputData && sessionData.currentInputData.length > 0;
  const hasCalculatedData = sessionData.calculatedData && sessionData.calculatedData.length > 0;
  const hasCompanyInfo = sessionData.companyInfo && sessionData.companyInfo.companyName;

  const timeSince = sessionData.lastSaved ? getTimeSince(sessionData.lastSaved) : 'Unknown time';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-fadeIn">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 animate-slideUp">
        {/* Header */}
        <div className="bg-blue-600 text-white px-6 py-4 rounded-t-lg">
          <h2 className="text-xl font-bold flex items-center">
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Recover Previous Session?
          </h2>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-gray-700 mb-4">
            We found a previous session that was saved <strong>{timeSince}</strong>.
            Would you like to recover your work?
          </p>

          {/* Session details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Session Contents:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              {hasCompanyInfo && (
                <li className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Company Information: {sessionData.companyInfo?.companyName || 'Unnamed'}
                </li>
              )}
              {hasInputData && (
                <li className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Input Data: {sessionData.currentInputData.length} period{sessionData.currentInputData.length !== 1 ? 's' : ''}
                </li>
              )}
              {hasCalculatedData && (
                <li className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Calculated Results: {sessionData.calculatedData.length} period{sessionData.calculatedData.length !== 1 ? 's' : ''}
                </li>
              )}
              {!hasCompanyInfo && !hasInputData && !hasCalculatedData && (
                <li className="flex items-center text-gray-400">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  No data found
                </li>
              )}
            </ul>
          </div>

          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-4">
            <p className="text-sm text-yellow-700">
              <strong>Note:</strong> Choosing "Start Fresh" will discard the previous session permanently.
            </p>
          </div>
        </div>

        {/* Footer with action buttons */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-end space-x-3">
          <button
            onClick={onDiscard}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors"
          >
            Start Fresh
          </button>
          <button
            onClick={onRecover}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Recover Session
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default SessionRecovery;
