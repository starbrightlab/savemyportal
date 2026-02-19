import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/database.types';

export type Source = Database['public']['Tables']['sources']['Row'];
export type SourceInsert = Database['public']['Tables']['sources']['Insert'];
export type SourceUpdate = Database['public']['Tables']['sources']['Update'];

/**
 * Fetch sources linked to a specific feed via the feed_sources junction table.
 */
export const useSources = (feedId: string | null) => {
    return useQuery({
        queryKey: ['sources', 'feed', feedId],
        queryFn: async () => {
            if (!feedId) return [];

            const { data: links, error: linkError } = await supabase
                .from('feed_sources')
                .select('source_id')
                .eq('feed_id', feedId);

            if (linkError) throw linkError;
            if (!links || links.length === 0) return [];

            const sourceIds = links.map(l => l.source_id);

            const { data, error } = await supabase
                .from('sources')
                .select('*')
                .in('id', sourceIds)
                .order('created_at', { ascending: true });

            if (error) throw error;
            return data;
        },
        enabled: !!feedId,
    });
};

/**
 * Fetch all sources for the current user (not scoped to a feed).
 */
export const useAllSources = (userId: string | undefined) => {
    return useQuery({
        queryKey: ['sources'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('sources')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        },
        enabled: !!userId,
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
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sources'] });
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
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sources'] });
        },
    });
};

export const useDeleteSource = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (sourceId: string) => {
            const { error } = await supabase
                .from('sources')
                .delete()
                .eq('id', sourceId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sources'] });
        },
    });
};
