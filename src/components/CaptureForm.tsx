import React, {useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
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
import {
  Attachment,
  FieldCapture,
  CaptureType,
  Priority,
  CAPTURE_TYPE_LABELS,
  PRIORITY_LABELS,
} from '../types';
import {generateId} from '../utils/helpers';
import {
  MAX_ATTACHMENTS,
  MediaService,
  MediaSource,
} from '../services/MediaService';
import {AttachmentThumb} from './AttachmentThumb';

interface Props {
  onSave: (capture: FieldCapture) => void;
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

const MEDIA_BUTTONS: {source: MediaSource; label: string}[] = [
  {source: 'camera_photo', label: '📷 Photo'},
  {source: 'camera_video', label: '🎥 Video'},
  {source: 'library', label: '🖼️ Library'},
];

const WEATHER_OPTIONS = ['☀️ Clear', '⛅ Cloudy', '🌧️ Rain', '💨 Windy', '🌡️ Extreme Heat', '❄️ Cold'];

export const CaptureForm: React.FC<Props> = ({onSave, onCancel}) => {
  const [captureType, setCaptureType] = useState<CaptureType>('daily_log');
  const [projectName, setProjectName] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [workerCount, setWorkerCount] = useState('');
  const [weather, setWeather] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [importing, setImporting] = useState(false);

  // Media is copied into app storage as soon as it's picked. If the form is
  // closed without saving (Cancel or swipe-down), delete those copies.
  const savedRef = useRef(false);
  const attachmentsRef = useRef(attachments);
  attachmentsRef.current = attachments;
  useEffect(
    () => () => {
      if (!savedRef.current) {
        MediaService.remove(attachmentsRef.current);
      }
    },
    [],
  );

  const addMedia = async (source: MediaSource) => {
    const remaining = MAX_ATTACHMENTS - attachments.length;
    if (remaining <= 0) {
      Alert.alert('Limit reached', `Up to ${MAX_ATTACHMENTS} photos or videos per capture.`);
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
    MediaService.remove([attachment]);
  };

  const handleSave = () => {
    if (!projectName.trim()) {
      Alert.alert('Required', 'Project name is required.');
      return;
    }
    if (!location.trim()) {
      Alert.alert('Required', 'Location / section is required.');
      return;
    }

    const capture: FieldCapture = {
      id: generateId(),
      captureType,
      projectName: projectName.trim(),
      location: location.trim(),
      notes: notes.trim(),
      priority,
      workerCount: workerCount ? parseInt(workerCount, 10) : undefined,
      weather: weather || undefined,
      attachments,
      capturedAt: new Date().toISOString(),
      syncStatus: 'pending',
      retryCount: 0,
    };

    savedRef.current = true;
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

        {/* ── Capture Type ── */}
        <View style={styles.field}>
          <Text style={styles.label}>Type *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipRow}>
              {CAPTURE_TYPES.map(t => (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.chip,
                    captureType === t && styles.chipActive,
                  ]}
                  onPress={() => setCaptureType(t)}
                  accessibilityLabel={CAPTURE_TYPE_LABELS[t]}>
                  <Text
                    style={[
                      styles.chipText,
                      captureType === t && styles.chipTextActive,
                    ]}>
                    {CAPTURE_TYPE_LABELS[t]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* ── Priority ── */}
        <View style={styles.field}>
          <Text style={styles.label}>Priority *</Text>
          <View style={styles.chipRow}>
            {PRIORITIES.map(p => {
              const cfg = PRIORITY_LABELS[p];
              const isActive = priority === p;
              return (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.chip,
                    isActive && {backgroundColor: cfg.color + '30', borderColor: cfg.color},
                  ]}
                  onPress={() => setPriority(p)}
                  accessibilityLabel={cfg.label}>
                  <Text
                    style={[
                      styles.chipText,
                      isActive && {color: cfg.color},
                      isActive && styles.chipTextPriorityActive,
                    ]}>
                    {cfg.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Project Name ── */}
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

        {/* ── Location / Section ── */}
        <View style={styles.field}>
          <Text style={styles.label}>Location / Section *</Text>
          <TextInput
            style={styles.input}
            value={location}
            onChangeText={setLocation}
            placeholder="e.g. Level 3 – Grid B4, Roof Section C"
            placeholderTextColor="#4B5563"
            autoCorrect={false}
            returnKeyType="next"
          />
        </View>

        {/* ── Daily Log extras ── */}
        {captureType === 'daily_log' && (
          <>
            <View style={styles.row}>
              <View style={[styles.field, styles.workerCountField]}>
                <Text style={styles.label}>Workers on Site</Text>
                <TextInput
                  style={styles.input}
                  value={workerCount}
                  onChangeText={setWorkerCount}
                  placeholder="e.g. 12"
                  placeholderTextColor="#4B5563"
                  keyboardType="number-pad"
                />
              </View>
              <View style={[styles.field, styles.weatherField]}>
                <Text style={styles.label}>Weather</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.chipRow}>
                    {WEATHER_OPTIONS.map(w => (
                      <TouchableOpacity
                        key={w}
                        style={[
                          styles.chip,
                          weather === w && styles.chipActive,
                          styles.weatherChip,
                        ]}
                        onPress={() => setWeather(weather === w ? '' : w)}>
                        <Text style={[styles.chipText, styles.weatherChipText, weather === w && styles.chipTextActive]}>
                          {w}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            </View>
          </>
        )}

        {/* ── Notes ── */}
        <View style={styles.field}>
          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            value={notes}
            onChangeText={setNotes}
            placeholder={
              captureType === 'rfi'
                ? 'Describe the information being requested…'
                : captureType === 'punchlist'
                ? 'Describe the deficiency and required correction…'
                : captureType === 'inspection'
                ? 'Inspection findings and pass/fail status…'
                : 'Describe the issue or observation…'
            }
            placeholderTextColor="#4B5563"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* ── Photos & Videos ── */}
        <View style={styles.field}>
          <Text style={styles.label}>
            Photos & Videos{attachments.length ? ` (${attachments.length})` : ''}
          </Text>
          <View style={styles.mediaButtonRow}>
            {MEDIA_BUTTONS.map(b => (
              <TouchableOpacity
                key={b.source}
                style={[styles.mediaBtn, importing && styles.mediaBtnDisabled]}
                onPress={() => addMedia(b.source)}
                disabled={importing}
                accessibilityLabel={b.label}>
                <Text style={styles.mediaBtnText}>{b.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {attachments.length > 0 || importing ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.thumbRow}>
              {attachments.map(a => (
                <AttachmentThumb key={a.id} attachment={a} size={76} onRemove={removeMedia} />
              ))}
              {importing ? (
                <View style={styles.importingTile}>
                  <ActivityIndicator color="#94A3B8" />
                </View>
              ) : null}
            </ScrollView>
          ) : null}
        </View>

        {/* ── Offline indicator ── */}
        <View style={styles.offlineBadge}>
          <Text style={styles.offlineBadgeText}>
            💾 Captured locally — will sync when online
          </Text>
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
            disabled={importing}
            accessibilityLabel="Save capture">
            <Text style={styles.saveBtnText}>Save Capture</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#0F172A'},
  scroll: {padding: 20, paddingBottom: 48},
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#334155',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F1F5F9',
    marginBottom: 20,
  },
  field: {marginBottom: 16},
  row: {flexDirection: 'row', marginBottom: 16},
  label: {
    fontSize: 11,
    fontWeight: '700',
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
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  multiline: {height: 96, paddingTop: 12},
  chipRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 6},
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  chipActive: {
    backgroundColor: '#1D4ED830',
    borderColor: '#3B82F6',
  },
  chipText: {fontSize: 12, color: '#94A3B8', fontWeight: '500'},
  chipTextPriorityActive: {fontWeight: '700'},
  chipTextActive: {color: '#60A5FA', fontWeight: '700'},
  workerCountField: {flex: 1, marginRight: 8},
  weatherField: {flex: 1},
  weatherChip: {paddingHorizontal: 8},
  weatherChipText: {fontSize: 11},
  mediaButtonRow: {flexDirection: 'row', gap: 8},
  mediaBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  mediaBtnDisabled: {opacity: 0.5},
  mediaBtnText: {color: '#E2E8F0', fontWeight: '700', fontSize: 13},
  thumbRow: {gap: 8, paddingTop: 10},
  importingTile: {
    width: 76,
    height: 76,
    borderRadius: 10,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  offlineBadge: {
    backgroundColor: '#1E293B',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
    flexDirection: 'row',
    alignItems: 'center',
  },
  offlineBadgeText: {fontSize: 12, color: '#64748B'},
  buttonRow: {flexDirection: 'row', gap: 12},
  btn: {flex: 1, paddingVertical: 15, borderRadius: 14, alignItems: 'center'},
  cancelBtn: {backgroundColor: '#1E293B', borderWidth: 1, borderColor: '#334155'},
  cancelBtnText: {color: '#94A3B8', fontWeight: '700', fontSize: 15},
  saveBtn: {
    backgroundColor: '#E3B02F',
    shadowColor: '#E3B02F',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnText: {color: '#0F172A', fontWeight: '800', fontSize: 15},
});
