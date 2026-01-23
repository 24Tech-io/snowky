
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function useConversations(projectId: string) {
    const { data, error, mutate } = useSWR(
        projectId ? `/api/projects/${projectId}/conversations` : null,
        fetcher,
        { refreshInterval: 5000 } // Poll every 5s
    );

    return {
        conversations: data,
        isLoading: !error && !data,
        isError: error,
        mutate
    };
}

export function useMessages(projectId: string, sessionId: string | null) {
    const { data, error, mutate } = useSWR(
        projectId && sessionId ? `/api/projects/${projectId}/conversations/${sessionId}/messages` : null,
        fetcher,
        { refreshInterval: 3000 } // Poll every 3s for active chat
    );

    return {
        messages: data,
        isLoading: !error && !data,
        isError: error,
        mutate
    };
}
