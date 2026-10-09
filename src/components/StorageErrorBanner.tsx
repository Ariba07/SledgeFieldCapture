import React from 'react';
import {TriangleAlert} from 'lucide-react-native';
import {Banner} from './ui';

export const StorageErrorBanner: React.FC<{error: string | null}> = ({error}) =>
  error ? (
    <Banner
      tone="danger"
      icon={TriangleAlert}
      title="Couldn't save to this device"
      detail="Recent changes are kept while the app is open and saved on your next change. Free up storage, and avoid closing the app until this goes away."
    />
  ) : null;
