import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Trash2 } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

const APP_STORAGE_KEYS = [
  'khmer_rbac_users_v1',
  'khmer_rbac_session_v1',
  'khmer_rbac_lessons_v1',
  'khmer_rbac_audit_v1',
  'khmer_quiz_lesson_best_v1',
  'khmer_quiz_total_stars',
  'khmer_quiz_lesson_best',
];

/**
 * Production ErrorBoundary Component
 * Gracefully catches rendering or state errors (such as corrupted LocalStorage data)
 * and provides child-friendly recovery actions without exposing raw stack traces.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: '',
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || 'Unexpected rendering error occurred.',
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[KhmerKidsQuiz ErrorBoundary]:', error, errorInfo);
  }

  handleSoftRetry = (): void => {
    this.setState({ hasError: false, errorMessage: '' });
  };

  handleHardResetStorage = (): void => {
    try {
      APP_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
    } catch {
      // Ignore storage access errors in private browsing
    }
    this.setState({ hasError: false, errorMessage: '' });
    window.location.href = '/student';
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FFFDF7] text-slate-900 font-khmer flex items-center justify-center p-4 sm:p-8">
          <div className="max-w-xl w-full bg-white rounded-3xl border-2 border-amber-300 shadow-sm p-6 sm:p-10 text-center">
            <div className="w-20 h-20 rounded-full bg-amber-100 border-2 border-amber-300 text-amber-600 flex items-center justify-center mx-auto mb-5">
              <AlertTriangle className="w-10 h-10" />
            </div>

            <p className="text-xs font-bold text-amber-700 mb-1">
              ប្រព័ន្ធការពារកំហុស · Automatic State Recovery
            </p>
            <h1 className="font-khmer-title text-2xl sm:text-3xl text-slate-900 mb-3">
              សូមអភ័យទោស! មានបញ្ហាបច្ចេកទេសតូចមួយ
            </h1>
            <p className="text-sm sm:text-base text-slate-600 mb-6 leading-relaxed">
              កម្មវិធីបានជួបបញ្ហាទិន្នន័យក្នុងឧបករណ៍។ សូមចុចប៊ូតុងខាងក្រោមដើម្បីស្តារកម្មវិធីឡើងវិញដោយសុវត្ថិភាព។
            </p>

            {this.state.errorMessage && (
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-3.5 mb-6 text-xs font-mono text-slate-600 break-words">
                Diagnostic: {this.state.errorMessage}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={this.handleSoftRetry}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:translate-y-0.5 text-white font-bold text-sm inline-flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_0_#065f46]"
              >
                <RotateCcw className="w-4 h-4" />
                <span>សាកល្បងម្តងទៀត (Try Again)</span>
              </button>

              <button
                type="button"
                onClick={this.handleHardResetStorage}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-500 active:translate-y-0.5 text-slate-950 font-bold text-sm inline-flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_0_#b45309]"
              >
                <Trash2 className="w-4 h-4" />
                <span>សម្អាតទិន្នន័យខូច (Reset Corrupted Data)</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
