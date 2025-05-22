// src/components/ErrorBoundary.jsx
import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error('Erro capturado pelo ErrorBoundary:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  handleRetry = () => {
    // Attempt to re-render children by resetting error state
    // This might not always work if the underlying error persists
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    // Optionally, you could call a prop function here to trigger a more specific reset action in the parent
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-red-50 p-4 md:p-8 flex items-center justify-center font-sans">
          <div className="bg-white rounded-lg shadow-xl p-6 md:p-8 max-w-2xl w-full">
            <div className="text-center mb-6">
              <svg className="mx-auto h-16 w-16 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h1 className="text-2xl font-bold text-red-600 mt-4 mb-2">
                Oops! Algo deu errado.
              </h1>
              <p className="text-gray-600">
                Ocorreu um erro inesperado na aplicação. Pedimos desculpas pelo inconveniente.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md" role="alert">
                <p className="font-bold">Detalhes do Erro:</p>
                <p className="text-sm break-all">{this.state.error.message || 'Erro desconhecido'}</p>
                {/* For development, you might want to show more info:
                {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                  <details className="mt-2 text-xs">
                    <summary>Stack Trace</summary>
                    <pre className="whitespace-pre-wrap">{this.state.errorInfo.componentStack}</pre>
                  </details>
                )} 
                */}
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
              <button
                onClick={this.handleRetry}
                className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition"
              >
                Tentar Novamente
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2.5 bg-gray-200 text-gray-700 font-semibold rounded-lg shadow-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-75 transition"
              >
                Recarregar Página
              </button>
            </div>
            <p className="text-xs text-gray-500 text-center mt-6">
              Se o problema persistir, por favor, entre em contato com o suporte.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}