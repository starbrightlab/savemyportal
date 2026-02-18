import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/database.types';

export type Source = Database['public']['Tables']['sources']['Row'];
export type SourceInsert = Database['public']['Tables']['sources']['Insert'];
export type SourceUpdate = Database['public']['Tables']['sources']['Update'];

export const useSources = (feedId: string | null) => {
    return useQuery({
        queryKey: ['sources', feedId],
        queryFn: async () => {
            if (!feedId) return [];
            const { data, error } = await supabase
                .from('sources')
                .select('*')
                .eq('feed_id', feedId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            return data;
        },
        enabled: !!feedId,
    });
};

export const useCreateSource = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (source: SourceInsert) => {
            const { data, error } = await supabase
                .from('sources')
                .insert(source)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['sources', data.feed_id] });
        },
    });
};

export const useUpdateSource = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...updates }: SourceUpdate & { id: string }) => {
            const { data, error } = await supabase
                .from('sources')
                .update(updates)
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['sources', data.feed_id] });
        },
    });
};

export const useDeleteSource = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (sourceId: string) => {
            // First fetch the source to get the feed_id for invalidation
            const { data: source } = await supabase.from('sources').select('feed_id').eq('id', sourceId).single();

            const { error } = await supabase
                .from('sources')
                .delete()
                .eq('id', sourceId);
            if (error) throw error;
            return source?.feed_id;
        },
        onSuccess: (feedId) => {
            if (feedId) {
                queryClient.invalidateQueries({ queryKey: ['sources', feedId] });
            }
        },
    });
};
