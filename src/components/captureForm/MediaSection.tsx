import React from 'react';
import {ActivityIndicator, ScrollView, View} from 'react-native';
import {Camera, Images, LucideIcon, Video} from 'lucide-react-native';
import {Attachment} from '../../types';
import {MediaSource} from '../../services/MediaService';
import {AttachmentThumb} from '../AttachmentThumb';
import {Button} from '../ui';
import {FieldLabel} from './FormField';
import {useTheme} from '../../theme';
import {useCaptureFormStyles} from '../../styles/components/CaptureForm.styles';

const MEDIA_BUTTONS: {source: MediaSource; label: string; icon: LucideIcon}[] =
  [
    {source: 'camera_photo', label: 'Photo', icon: Camera},
    {source: 'camera_video', label: 'Video', icon: Video},
    {source: 'library', label: 'Library', icon: Images},
  ];

interface Props {
  attachments: Attachment[];
  importing: boolean;
  onAdd: (source: MediaSource) => void;
  onRemove: (attachment: Attachment) => void;
}

/** "Photos & videos": add buttons plus a scrolling row of thumbnails. */
export const MediaSection: React.FC<Props> = ({
  attachments,
  importing,
  onAdd,
  onRemove,
}) => {
  const styles = useCaptureFormStyles();
  const {colors} = useTheme();
  return (
    <>
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
            onPress={() => onAdd(b.source)}
            disabled={importing}
            style={styles.flex}
          />
        ))}
      </View>
      {attachments.length > 0 || importing ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.thumbRow}
          style={styles.bleed}>
          {attachments.map(a => (
            <AttachmentThumb
              key={a.id}
              attachment={a}
              size={80}
              onRemove={onRemove}
            />
          ))}
          {importing ? (
            <View style={styles.importingTile}>
              <ActivityIndicator color={colors.textSecondary} />
            </View>
          ) : null}
        </ScrollView>
      ) : null}
    </>
  );
};
