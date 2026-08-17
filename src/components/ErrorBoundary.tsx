import React, { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(_error: Error, _errorInfo: React.ErrorInfo) {
    // Intercept error silently without polluting browser console
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 max-w-lg shadow-2xl">
            <div className="w-16 h-16 bg-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
              BU
            </div>
            <h2 className="text-xl font-bold text-white mb-2">
              ระบบศูนย์จัดรายการและยืมคืนอุปกรณ์
            </h2>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              กำลังรีเฟรชหรือเชื่อมต่อระบบ กรุณากดปุ่มด้านล่างเพื่อกลับสู่หน้าหลัก
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-blue-600/30"
            >
              รีเฟรชหน้าต่างระบบ
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

