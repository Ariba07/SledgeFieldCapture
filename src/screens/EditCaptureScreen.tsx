import React from 'react';
import {CaptureForm} from '../components/CaptureForm';
import {useSyncContext} from '../context/SyncContext';
import {RootStackScreenProps} from '../navigation/types';
import {CaptureDraft} from '../types';

export const EditCaptureScreen: React.FC<RootStackScreenProps<'EditCapture'>> = ({
  navigation,
  route,
}) => {
  const {captures, updateCapture} = useSyncContext();
  // Read once: the form owns its state while open, even if sync updates the record.
  const [initial] = React.useState(() => captures.find(c => c.id === route.params.captureId));

  if (!initial) {
    navigation.goBack();
    return null;
  }

  const handleSave = async (draft: CaptureDraft) => {
    navigation.goBack();
    await updateCapture(initial.id, draft);
  };

  return <CaptureForm initial={initial} onSave={handleSave} onCancel={navigation.goBack} />;
};
