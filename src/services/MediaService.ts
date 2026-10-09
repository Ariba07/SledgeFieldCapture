/**
 * MediaService – take / pick photos and videos and keep them on the device.
 *
 * The picker hands back files in a temporary/cache directory that the OS may
 * purge, so every asset is copied into <Documents>/attachments straight away.
 * A capture's media is then as durable as the capture itself while offline.
 */
import {
  Asset,
  ImagePickerResponse,
  launchCamera,
  launchImageLibrary,
} from 'react-native-image-picker';
import {
  DocumentDirectoryPath,
  copyFile,
  mkdir,
  stat,
  unlink,
} from '@dr.pogodin/react-native-fs';
import {Attachment} from '../types';
import {generateId} from '../utils/helpers';

export type MediaSource = 'camera_photo' | 'camera_video' | 'library';

export const MAX_ATTACHMENTS = 10;
export const MAX_VIDEO_SECONDS = 60;

const ATTACHMENTS_DIR = `${DocumentDirectoryPath}/attachments`;

/** Thrown for picker failures the user should see (no camera, permission denied). */
export class MediaError extends Error {}

export const attachmentPath = (a: Attachment) => `${ATTACHMENTS_DIR}/${a.fileName}`;
export const attachmentUri = (a: Attachment) => `file://${attachmentPath(a)}`;

const launch = (source: MediaSource, limit: number): Promise<ImagePickerResponse> => {
  switch (source) {
    case 'camera_photo':
      return launchCamera({mediaType: 'photo', quality: 0.8, maxWidth: 2048, maxHeight: 2048});
    case 'camera_video':
      return launchCamera({
        mediaType: 'video',
        videoQuality: 'medium',
        durationLimit: MAX_VIDEO_SECONDS,
        formatAsMp4: true,
      });
    case 'library':
      return launchImageLibrary({
        mediaType: 'mixed',
        selectionLimit: limit,
        quality: 0.8,
        maxWidth: 2048,
        maxHeight: 2048,
        videoQuality: 'medium',
        formatAsMp4: true,
      });
  }
};

const extensionOf = (asset: Asset, isVideo: boolean) => {
  const fromName = asset.fileName?.split('.').pop();
  if (fromName && fromName !== asset.fileName) {
    return fromName.toLowerCase();
  }
  return isVideo ? 'mp4' : 'jpg';
};

const importAsset = async (asset: Asset): Promise<Attachment> => {
  if (!asset.uri) {
    throw new MediaError('The selected file could not be read.');
  }
  const isVideo = !!asset.type?.startsWith('video') || asset.duration != null;
  const id = generateId();
  const fileName = `${id}.${extensionOf(asset, isVideo)}`;
  const attachment: Attachment = {
    id,
    kind: isVideo ? 'video' : 'photo',
    fileName,
    mimeType: asset.type ?? (isVideo ? 'video/mp4' : 'image/jpeg'),
    sizeBytes: asset.fileSize ?? 0,
    width: asset.width,
    height: asset.height,
    durationSec: isVideo ? asset.duration : undefined,
  };

  await copyFile(decodeURI(asset.uri.replace('file://', '')), attachmentPath(attachment));
  if (!attachment.sizeBytes) {
    attachment.sizeBytes = Number((await stat(attachmentPath(attachment))).size);
  }
  return attachment;
};

export const MediaService = {
  /**
   * Opens the camera or library and returns the chosen media, already copied
   * into app storage. Returns [] if the user cancels.
   */
  async pick(source: MediaSource, limit = MAX_ATTACHMENTS): Promise<Attachment[]> {
    const res = await launch(source, limit);
    if (res.didCancel) {
      return [];
    }
    if (res.errorCode === 'camera_unavailable') {
      throw new MediaError('No camera is available on this device. Use the library instead.');
    }
    if (res.errorCode === 'permission') {
      throw new MediaError('Camera or photo access is turned off. Enable it in Settings.');
    }
    if (res.errorCode) {
      throw new MediaError(res.errorMessage ?? 'Could not open the camera or library.');
    }

    await mkdir(ATTACHMENTS_DIR);
    return Promise.all((res.assets ?? []).slice(0, limit).map(importAsset));
  },

  /** Best-effort delete; a missing file is not an error. */
  async remove(attachments: Attachment[] = []): Promise<void> {
    await Promise.all(attachments.map(a => unlink(attachmentPath(a)).catch(() => {})));
  },
};
