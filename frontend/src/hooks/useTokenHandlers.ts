import { useCallback } from 'react';
import type { Token } from '../types';

interface UseTokenHandlersProps {
    setTokens: React.Dispatch<React.SetStateAction<Token[]>>;
}

export function useTokenHandlers({ setTokens }: UseTokenHandlersProps) {
    const handleTokenMove = useCallback((id: string, x: number, y: number) => {
        setTokens(prev => {
            return prev.map(token => {
                if (token.id === id) {
                    return { ...token, x, y };
                }
                return token;
            });
        });
    }, [setTokens]);

    return {
        handleTokenMove,
    };
}
