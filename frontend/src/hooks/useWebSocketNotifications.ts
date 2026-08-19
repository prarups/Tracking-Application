import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { addNotification } from '@/store/slices/notificationSlice';

export const useWebSocketNotifications = () => {
  const dispatch = useDispatch();
  const { user, accessToken } = useSelector((state: RootState) => state.auth);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!user || !accessToken) return;

    const isSecure = window.location.protocol === 'https:' || (import.meta.env.VITE_API_BASE_URL && import.meta.env.VITE_API_BASE_URL.startsWith('https'));
    const protocol = isSecure ? 'wss:' : 'ws:';
    const backendHost = import.meta.env.VITE_API_BASE_URL
      ? import.meta.env.VITE_API_BASE_URL.replace(/^https?:\/\//, '').replace(/\/.*$/, '')
      : window.location.host;
    const wsUrl = `${protocol}//${backendHost}/ws/notifications/?token=${accessToken}`;

    try {
      const socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        console.log('📡 Real-Time WebSockets Connected for notifications');
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          dispatch(
            addNotification({
              id: data.id || Date.now(),
              recipient: user.id,
              actor: 0,
              verb: data.verb || 'NOTIFICATION',
              message: data.message,
              ticket: data.ticket_id,
              ticket_number: data.ticket_number,
              is_read: false,
              created_at: data.created_at || new Date().toISOString(),
            })
          );
        } catch (e) {
          console.error('Error parsing WebSocket message:', e);
        }
      };

      socket.onerror = (err) => {
        console.warn('WebSocket notification error:', err);
      };

      socket.onclose = () => {
        console.log('WebSocket connection closed');
      };

      return () => {
        socket.close();
      };
    } catch (e) {
      console.warn('Could not establish WebSocket connection:', e);
    }
  }, [user, accessToken, dispatch]);
};
