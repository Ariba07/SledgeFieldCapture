import React from 'react';
import {CaptureForm} from '../components/CaptureForm';
import {useSyncContext} from '../context/SyncContext';
import {RootStackScreenProps} from '../navigation/types';
import {FieldCapture} from '../types';

export const NewCaptureScreen: React.FC<RootStackScreenProps<'NewCapture'>> = ({
  navigation,
}) => {
  const {addCapture} = useSyncContext();

  const handleSave = async (capture: FieldCapture) => {
    navigation.goBack();
    await addCapture(capture);
  };

  return <CaptureForm onSave={handleSave} onCancel={navigation.goBack} />;
};
