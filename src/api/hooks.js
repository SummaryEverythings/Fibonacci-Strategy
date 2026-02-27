import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { scanService } from './client';

// Query Keys
export const queryKeys = {
    scans: ['scans'],
    scan: (id) => ['scans', id],
};

/**
 * Hook to fetch all scans
 */
export const useScans = () => {
    return useQuery({
        queryKey: queryKeys.scans,
        queryFn: scanService.getScans,
    });
};

/**
 * Hook to fetch a single scan by ID
 */
export const useScan = (id) => {
    return useQuery({
        queryKey: queryKeys.scan(id),
        queryFn: () => scanService.getScanById(id),
        enabled: !!id, // Only run if ID is truthy
    });
};

/**
 * Hook to create a new scan
 */
export const useCreateScan = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: scanService.createScan,
        onSuccess: () => {
            // Invalidate the scans query so it refetches
            queryClient.invalidateQueries({ queryKey: queryKeys.scans });
        },
    });
};

/**
 * Hook to delete a scan
 */
export const useDeleteScan = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: scanService.deleteScan,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.scans });
        },
    });
};
