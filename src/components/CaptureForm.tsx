import React, {useState} from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {X} from 'lucide-react-native';
import {
  CAPTURE_TYPE_LABELS,
  CaptureDraft,
  CaptureType,
  FieldCapture,
  PRIORITY_LABELS,
  Priority,
} from '../types';
import {
  Button,
  CAPTURE_TYPE_ICONS,
  Chip,
  IconButton,
  SegmentedControl,
} from './ui';
import {Field, FieldLabel} from './captureForm/FormField';
import {DailyLogFields} from './captureForm/DailyLogFields';
import {MediaSection} from './captureForm/MediaSection';
import {useDraftAttachments} from '../hooks/useDraftAttachments';
import {useTheme} from '../theme';
import {useCaptureFormStyles} from '../styles/components/CaptureForm.styles';

interface Props {
  /** Existing capture to edit; omit to create a new one. */
  initial?: FieldCapture;
  onSave: (draft: CaptureDraft) => void;
  onCancel: () => void;
}

const CAPTURE_TYPES: CaptureType[] = [
  'daily_log',
  'rfi',
  'punchlist',
  'issue',
  'inspection',
];
const PRIORITIES: Priority[] = ['low', 'medium', 'high'];

const NOTES_PLACEHOLDER: Record<CaptureType, string> = {
  daily_log: 'Work completed, deliveries, visitors, delays…',
  rfi: 'What information do you need, and from whom?',
  punchlist: 'Describe the deficiency and the correction required.',
  issue: 'What happened, and what is affected?',
  inspection: 'Findings and pass / fail result.',
};

export const CaptureForm: React.FC<Props> = ({initial, onSave, onCancel}) => {
  const styles = useCaptureFormStyles();
  const {colors} = useTheme();
  const editing = !!initial;
  const [captureType, setCaptureType] = useState<CaptureType>(
    initial?.captureType ?? 'daily_log',
  );
  const [projectName, setProjectName] = useState(initial?.projectName ?? '');
  const [location, setLocation] = useState(initial?.location ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [priority, setPriority] = useState<Priority>(
    initial?.priority ?? 'medium',
  );
  const [workerCount, setWorkerCount] = useState(
    initial?.workerCount != null ? String(initial.workerCount) : '',
  );
  const [weather, setWeather] = useState(initial?.weather ?? '');
  const {attachments, importing, addMedia, removeMedia, markSaved} =
    useDraftAttachments(initial?.attachments);
  const [showErrors, setShowErrors] = useState(false);

  const projectError =
    showErrors && !projectName.trim() ? 'Enter the project name.' : undefined;
  const locationError =
    showErrors && !location.trim() ? 'Enter where on site this is.' : undefined;

  const handleSave = () => {
    if (!projectName.trim() || !location.trim()) {
      setShowErrors(true);
      return;
    }
    const isDailyLog = captureType === 'daily_log';
    markSaved();
    onSave({
      captureType,
      projectName: projectName.trim(),
      location: location.trim(),
      notes: notes.trim(),
      priority,
      workerCount:
        isDailyLog && workerCount ? parseInt(workerCount, 10) : undefined,
      weather: isDailyLog && weather ? weather : undefined,
      attachments,
    });
  };

  return (
    <SafeAreaView
      style={styles.safe}
      edges={
        Platform.OS === 'ios'
          ? ['bottom', 'left', 'right']
          : ['top', 'bottom', 'left', 'right']
      }>
      <View style={styles.navBar}>
        <IconButton icon={X} onPress={onCancel} accessibilityLabel="Cancel" />
        <Text style={styles.navTitle}>
          {editing ? 'Edit capture' : 'New capture'}
        </Text>
        <View style={styles.navSpacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.flex}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled">
          <FieldLabel text="Type" first />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
            style={styles.bleed}>
            {CAPTURE_TYPES.map(t => (
              <Chip
                key={t}
                label={CAPTURE_TYPE_LABELS[t]}
                icon={CAPTURE_TYPE_ICONS[t]}
                selected={captureType === t}
                onPress={() => setCaptureType(t)}
              />
            ))}
          </ScrollView>

          <Field
            label="Project"
            value={projectName}
            onChangeText={setProjectName}
            placeholder="e.g. Main Street Office"
            error={projectError}
            returnKeyType="next"
          />
          <Field
            label="Location"
            value={location}
            onChangeText={setLocation}
            placeholder="e.g. Level 3, Grid B4"
            error={locationError}
            returnKeyType="next"
          />

          <FieldLabel text="Priority" />
          <SegmentedControl<Priority>
            value={priority}
            onChange={setPriority}
            segments={PRIORITIES.map(p => ({
              value: p,
              label: PRIORITY_LABELS[p],
              color: p === 'low' ? undefined : colors.priority[p],
            }))}
          />

          {captureType === 'daily_log' ? (
            <DailyLogFields
              workerCount={workerCount}
              onWorkerCountChange={setWorkerCount}
              weather={weather}
              onWeatherChange={setWeather}
            />
          ) : null}

          <Field
            label="Notes"
            value={notes}
            onChangeText={setNotes}
            placeholder={NOTES_PLACEHOLDER[captureType]}
            multiline
            textAlignVertical="top"
            inputStyle={styles.notesInput}
          />

          <MediaSection
            attachments={attachments}
            importing={importing}
            onAdd={addMedia}
            onRemove={removeMedia}
          />

          <Text style={styles.footnote}>
            Saved to this device first, then uploaded automatically when you’re
            online.
          </Text>
        </ScrollView>

        <View style={styles.footer}>
          <View style={styles.footerInner}>
            <Button
              title={editing ? 'Save changes' : 'Save capture'}
              onPress={handleSave}
              disabled={importing}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
