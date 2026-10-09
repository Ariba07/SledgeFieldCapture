import React from 'react';
import {CaptureForm} from '../components/CaptureForm';
import {useSyncContext} from '../context/SyncContext';
import {RootStackScreenProps} from '../navigation/types';
import {CaptureDraft} from '../types';
import {generateId} from '../utils/helpers';

export const NewCaptureScreen: React.FC<RootStackScreenProps<'NewCapture'>> = ({
  navigation,
}) => {
  const {addCapture} = useSyncContext();

  const handleSave = async (draft: CaptureDraft) => {
    navigation.goBack();
    await addCapture({
      ...draft,
      id: generateId(),
      capturedAt: new Date().toISOString(),
      version: 1,
      syncStatus: 'pending',
      retryCount: 0,
    });
  };

  return <CaptureForm onSave={handleSave} onCancel={navigation.goBack} />;
};
