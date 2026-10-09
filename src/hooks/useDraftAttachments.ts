import {useEffect, useRef, useState} from 'react';
import {Alert} from 'react-native';
import {Attachment} from '../types';
import {
  MAX_ATTACHMENTS,
  MediaService,
  MediaSource,
} from '../services/MediaService';

/**
 * The photos and videos on a capture form. Media is copied into app storage
 * as soon as it's picked. If the form is closed without saving (Cancel or
 * swipe-down), the copies added in this session are deleted, never the files
 * the capture already had. Call `markSaved` before handing the draft over.
 */
export function useDraftAttachments(initial: Attachment[] = []) {
  const [attachments, setAttachments] = useState<Attachment[]>(initial);
  const [importing, setImporting] = useState(false);

  const savedRef = useRef(false);
  const attachmentsRef = useRef(attachments);
  attachmentsRef.current = attachments;
  const originalIds = useRef(new Set(initial.map(a => a.id)));
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

  const markSaved = () => {
    savedRef.current = true;
  };

  return {attachments, importing, addMedia, removeMedia, markSaved};
}
