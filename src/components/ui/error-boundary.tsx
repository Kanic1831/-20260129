'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
                    <Card className="max-w-md w-full shadow-lg border-red-200 dark:border-red-900/50">
                        <CardHeader className="text-center">
                            <div className="mx-auto bg-red-100 dark:bg-red-900/30 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                            </div>
                            <CardTitle className="text-xl text-red-700 dark:text-red-400">
                                出错了
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-center space-y-6">
                            <p className="text-gray-600 dark:text-gray-300">
                                应用程序遇到了一些问题，无法继续运行。请尝试刷新页面重试。
                            </p>

                            {process.env.NODE_ENV === 'development' && this.state.error && (
                                <div className="text-left bg-gray-100 dark:bg-gray-800 p-3 rounded-md text-xs font-mono overflow-auto max-h-48">
                                    {this.state.error.toString()}
                                </div>
                            )}

                            <Button
                                onClick={() => window.location.reload()}
                                className="w-full bg-red-600 hover:bg-red-700 text-white"
                            >
                                <RefreshCw className="mr-2 h-4 w-4" />
                                刷新页面
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            );
        }

        return this.props.children;
    }
}
