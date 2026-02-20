import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/database.types';

export type Feed = Database['public']['Tables']['feeds']['Row'];
export type FeedInsert = Database['public']['Tables']['feeds']['Insert'];
export type FeedUpdate = Database['public']['Tables']['feeds']['Update'];

export const useFeeds = (userId: string | undefined) => {
    return useQuery({
        queryKey: ['feeds', userId],
        queryFn: async () => {
            if (!userId) return [];
            const { data, error } = await supabase
                .from('feeds')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        },
        enabled: !!userId,
    });
};

export const useFeed = (feedId: string | null) => {
    return useQuery({
        queryKey: ['feed', feedId],
        queryFn: async () => {
            if (!feedId) return null;
            const { data, error } = await supabase
                .from('feeds')
                .select('*')
                .eq('id', feedId)
                .single();

            if (error) throw error;
            return data;
        },
        enabled: !!feedId,
    });
};

export const useCreateFeed = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (feed: FeedInsert) => {
            const { data, error } = await supabase
                .from('feeds')
                .insert(feed)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['feeds'] });
        },
    });
};

export const useUpdateFeed = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...updates }: FeedUpdate & { id: string }) => {
            const { data, error } = await supabase
                .from('feeds')
                .update(updates)
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['feeds'] });
            queryClient.invalidateQueries({ queryKey: ['feed', data.id] });
        },
    });
};

export const useDeleteFeed = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (feedId: string) => {
            const { error } = await supabase
                .from('feeds')
                .delete()
                .eq('id', feedId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['feeds'] });
        },
    });
};
