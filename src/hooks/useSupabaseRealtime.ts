import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/supabase.types';

type TableName = keyof Database['public']['Tables'];

/**
 * A custom hook to listen for real-time changes on one or more Supabase tables.
 * This helps keep our UI instantly up-to-date without page refreshes.
 *
 * @param tables Array of table names to listen to (e.g. ['jobs', 'job_applications'])
 * @param callback Function to execute when any INSERT, UPDATE, or DELETE happens
 * @param deps Dependency array for the effect (usually just the callback dependencies)
 */
export function useSupabaseRealtime(
  tables: TableName[],
  callback: () => void,
  deps: React.DependencyList = []
) {
  useEffect(() => {
    // We create a unique channel for this component's subscription
    const channelName = `realtime-subscription-${Math.random().toString(36).substring(7)}`;
    const channel = supabase.channel(channelName);

    // Attach listeners for each table requested
    tables.forEach((table) => {
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        () => {
          // When a change happens, fire the callback
          callback();
        }
      );
    });

    // Subscribe to the channel
    channel.subscribe();

    // Cleanup: unsubscribe when the component unmounts
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tables.join(',')]);
}
