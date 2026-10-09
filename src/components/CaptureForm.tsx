import React, {useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  Camera,
  Cloud,
  CloudRain,
  Images,
  LucideIcon,
  Snowflake,
  Sun,
  Thermometer,
  Video,
  Wind,
  X,
} from 'lucide-react-native';
import {
  Attachment,
  CAPTURE_TYPE_LABELS,
  CaptureDraft,
  CaptureType,
  FieldCapture,
  PRIORITY_LABELS,
  Priority,
} from '../types';
import {
  MAX_ATTACHMENTS,
  MediaService,
  MediaSource,
} from '../services/MediaService';
import {AttachmentThumb} from './AttachmentThumb';
import {
  Button,
  CAPTURE_TYPE_ICONS,
  Chip,
  IconButton,
  SegmentedControl,
} from './ui';
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

const WEATHER: {label: string; icon: LucideIcon}[] = [
  {label: 'Clear', icon: Sun},
  {label: 'Cloudy', icon: Cloud},
  {label: 'Rain', icon: CloudRain},
  {label: 'Windy', icon: Wind},
  {label: 'Hot', icon: Thermometer},
  {label: 'Cold', icon: Snowflake},
];

const MEDIA_BUTTONS: {source: MediaSource; label: string; icon: LucideIcon}[] =
  [
    {source: 'camera_photo', label: 'Photo', icon: Camera},
    {source: 'camera_video', label: 'Video', icon: Video},
    {source: 'library', label: 'Library', icon: Images},
  ];

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
  const [attachments, setAttachments] = useState<Attachment[]>(
    initial?.attachments ?? [],
  );
  const [importing, setImporting] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  // Media is copied into app storage as soon as it's picked. If the form is
  // closed without saving (Cancel or swipe-down), delete the copies added in
  // this session — never the files the capture already had.
  const savedRef = useRef(false);
  const attachmentsRef = useRef(attachments);
  attachmentsRef.current = attachments;
  const originalIds = useRef(
    new Set((initial?.attachments ?? []).map(a => a.id)),
  );
  useEffect(
    () => () => {
      if (!savedRef.current) {
        MediaService.remove(
          attachmentsRef.current.filter(a => !originalIds.current.has(a.id)),
        );
      }
    },
    [],
  );

  const addMedia = async (source: MediaSource) => {
    const remaining = MAX_ATTACHMENTS - attachments.length;
    if (remaining <= 0) {
      Alert.alert(
        'Limit reached',
        `You can attach up to ${MAX_ATTACHMENTS} photos or videos.`,
      );
      return;
    }
    setImporting(true);
    try {
      const added = await MediaService.pick(source, remaining);
      setAttachments(prev => [...prev, ...added]);
    } catch (err) {
      Alert.alert(
        "Couldn't add media",
        err instanceof Error ? err.message : 'Something went wrong.',
      );
    } finally {
      setImporting(false);
    }
  };

  const removeMedia = (attachment: Attachment) => {
    setAttachments(prev => prev.filter(a => a.id !== attachment.id));
    // Files the capture already had are deleted only once the edit is saved.
    if (!originalIds.current.has(attachment.id)) {
      MediaService.remove([attachment]);
    }
  };

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
    savedRef.current = true;
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
            <>
              <Field
                label="Workers on site"
                value={workerCount}
                onChangeText={t => setWorkerCount(t.replace(/[^0-9]/g, ''))}
                placeholder="0"
                keyboardType="number-pad"
                containerStyle={styles.workersField}
              />
              <FieldLabel text="Weather" />
              <View style={styles.wrapRow}>
                {WEATHER.map(w => (
                  <Chip
                    key={w.label}
                    label={w.label}
                    icon={w.icon}
                    selected={weather === w.label}
                    onPress={() =>
                      setWeather(weather === w.label ? '' : w.label)
                    }
                  />
                ))}
              </View>
            </>
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

          <FieldLabel
            text={`Photos & videos${
              attachments.length ? ` · ${attachments.length}` : ''
            }`}
          />
          <View style={styles.mediaButtons}>
            {MEDIA_BUTTONS.map(b => (
              <Button
                key={b.source}
                title={b.label}
                icon={b.icon}
                variant="secondary"
                onPress={() => addMedia(b.source)}
                disabled={importing}
                style={styles.flex}
              />
            ))}
          </View>
          {attachments.length > 0 || importing ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.thumbRow}
              style={styles.bleed}>
              {attachments.map(a => (
                <AttachmentThumb
                  key={a.id}
                  attachment={a}
                  size={80}
                  onRemove={removeMedia}
                />
              ))}
              {importing ? (
                <View style={styles.importingTile}>
                  <ActivityIndicator color={colors.textSecondary} />
                </View>
              ) : null}
            </ScrollView>
          ) : null}

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

const FieldLabel: React.FC<{text: string; first?: boolean}> = ({
  text,
  first,
}) => {
  const styles = useCaptureFormStyles();
  return <Text style={[styles.label, first && styles.labelFirst]}>{text}</Text>;
};

const Field: React.FC<
  TextInputProps & {
    label: string;
    error?: string;
    containerStyle?: object;
    inputStyle?: object;
  }
> = ({label, error, containerStyle, inputStyle, ...input}) => {
  const styles = useCaptureFormStyles();
  const {colors} = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View style={containerStyle}>
      <FieldLabel text={label} />
      <TextInput
        {...input}
        onFocus={e => {
          setFocused(true);
          input.onFocus?.(e);
        }}
        onBlur={e => {
          setFocused(false);
          input.onBlur?.(e);
        }}
        placeholderTextColor={colors.textTertiary}
        accessibilityLabel={label}
        style={[
          styles.input,
          focused && styles.inputFocused,
          error ? styles.inputError : null,
          inputStyle,
        ]}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};
