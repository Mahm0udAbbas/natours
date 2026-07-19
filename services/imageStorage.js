const AppError = require('../utils/appError');

const configured = () =>
  Boolean(
    process.env.IMAGEKIT_PRIVATE_KEY && process.env.IMAGEKIT_URL_ENDPOINT,
  );

const upload = async ({ buffer, fileName, folder }) => {
  if (!configured()) throw new AppError('ImageKit is not configured', 503);
  const form = new FormData();
  form.set('file', new Blob([buffer]), fileName);
  form.set('fileName', fileName);
  form.set('folder', folder);
  form.set('useUniqueFileName', 'false');
  const authorization = Buffer.from(
    `${process.env.IMAGEKIT_PRIVATE_KEY}:`,
  ).toString('base64');
  const response = await fetch(
    'https://upload.imagekit.io/api/v1/files/upload',
    {
      method: 'POST',
      headers: { Authorization: `Basic ${authorization}` },
      body: form,
    },
  );
  if (!response.ok) throw new AppError('Remote image upload failed', 502);
  const result = await response.json();
  return { fileId: result.fileId, path: result.filePath, url: result.url };
};

const remove = async (fileId) => {
  if (!fileId || !configured()) return;
  const authorization = Buffer.from(
    `${process.env.IMAGEKIT_PRIVATE_KEY}:`,
  ).toString('base64');
  const response = await fetch(`https://api.imagekit.io/v1/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Basic ${authorization}` },
  });
  if (!response.ok && response.status !== 404) {
    throw new AppError('Remote image cleanup failed', 502);
  }
};

exports.isStorageEnabled = () => process.env.IMAGE_STORAGE !== 'disabled';
exports.isRemoteStorage = () =>
  process.env.IMAGE_STORAGE === 'imagekit' ||
  (!process.env.IMAGE_STORAGE && process.env.NODE_ENV === 'production');
exports.uploadImage = upload;
exports.deleteImage = remove;
