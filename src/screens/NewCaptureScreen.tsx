import React from 'react';
import {Alert} from 'react-native';
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
    try {
      await addCapture({
        ...draft,
        id: generateId(),
        capturedAt: new Date().toISOString(),
        version: 1,
        syncStatus: 'pending',
        retryCount: 0,
      });
    } catch (err) {
      Alert.alert(
        "Couldn't save capture",
        err instanceof Error ? err.message : 'Something went wrong. Please try again.',
      );
    }
  };

  return <CaptureForm onSave={handleSave} onCancel={navigation.goBack} />;
};
