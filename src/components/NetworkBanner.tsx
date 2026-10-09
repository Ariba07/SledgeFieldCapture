import React from 'react';
import {CloudOff} from 'lucide-react-native';
import {Banner} from './ui';
import {plural} from '../utils/helpers';

export const NetworkBanner: React.FC<{
  isOnline: boolean;
  pendingCount: number;
}> = ({isOnline, pendingCount}) =>
  isOnline ? null : (
    <Banner
      tone="neutral"
      icon={CloudOff}
      title="You're offline"
      detail={
        pendingCount > 0
          ? `${plural(pendingCount, 'capture')} will upload when you reconnect.`
          : 'New captures are saved on this device and upload when you reconnect.'
      }
    />
  );
