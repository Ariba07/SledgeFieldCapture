import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import {FieldCapture} from '../types';
import {generateId} from '../utils/helpers';

interface Props {
  onSave: (capture: FieldCapture) => void;
  onCancel: () => void;
}

export const CaptureForm: React.FC<Props> = ({onSave, onCancel}) => {
  const [projectName, setProjectName] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');

  const handleSave = () => {
    if (!projectName.trim()) {
      Alert.alert('Validation', 'Project name is required.');
      return;
    }
    if (!location.trim()) {
      Alert.alert('Validation', 'Location is required.');
      return;
    }

    const capture: FieldCapture = {
      id: generateId(),
      projectName: projectName.trim(),
      location: location.trim(),
      notes: notes.trim(),
      capturedAt: new Date().toISOString(),
      syncStatus: 'pending',
      retryCount: 0,
    };

    onSave(capture);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled">
        {/* Sheet handle */}
        <View style={styles.handle} />

        <Text style={styles.title}>New Field Capture</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Project Name *</Text>
          <TextInput
            style={styles.input}
            value={projectName}
            onChangeText={setProjectName}
            placeholder="e.g. Main Street Office Build"
            placeholderTextColor="#4B5563"
            autoCorrect={false}
            returnKeyType="next"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Location *</Text>
          <TextInput
            style={styles.input}
            value={location}
            onChangeText={setLocation}
            placeholder="e.g. Level 3 – Section B"
            placeholderTextColor="#4B5563"
            autoCorrect={false}
            returnKeyType="next"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Describe the issue or observation…"
            placeholderTextColor="#4B5563"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.btn, styles.cancelBtn]}
            onPress={onCancel}
            accessibilityLabel="Cancel">
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, styles.saveBtn]}
            onPress={handleSave}
            accessibilityLabel="Save capture">
            <Text style={styles.saveBtnText}>Save Capture</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  scroll: {
    padding: 24,
    paddingBottom: 48,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#334155',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F1F5F9',
    marginBottom: 24,
  },
  field: {marginBottom: 18},
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  input: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    color: '#F1F5F9',
    fontSize: 15,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  multiline: {height: 100, paddingTop: 14},
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  btn: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
  },
  cancelBtn: {backgroundColor: '#1E293B', borderWidth: 1, borderColor: '#334155'},
  cancelBtnText: {color: '#94A3B8', fontWeight: '700', fontSize: 15},
  saveBtn: {
    backgroundColor: '#3B82F6',
    shadowColor: '#3B82F6',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnText: {color: '#fff', fontWeight: '700', fontSize: 15},
});
