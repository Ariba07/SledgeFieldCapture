/* global jest */
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('@react-native-community/netinfo', () =>
  require('@react-native-community/netinfo/jest/netinfo-mock.js'),
);
jest.mock('react-native-image-picker', () => ({
  launchCamera: jest.fn(async () => ({didCancel: true})),
  launchImageLibrary: jest.fn(async () => ({didCancel: true})),
}));
jest.mock('@dr.pogodin/react-native-fs', () => ({
  DocumentDirectoryPath: '/docs',
  copyFile: jest.fn(async () => {}),
  mkdir: jest.fn(async () => {}),
  stat: jest.fn(async () => ({size: 0})),
  unlink: jest.fn(async () => {}),
}));
jest.mock('react-native-video', () => 'Video');
