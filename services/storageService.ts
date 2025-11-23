import { supabase } from './supabase';

const BUCKET_NAME = 'profile-assets';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_AUDIO_TYPES = ['audio/webm', 'audio/mpeg', 'audio/wav', 'audio/ogg'];

/**
 * Upload a profile photo to Supabase Storage
 * @param userId - The user ID
 * @param file - The image file to upload
 * @returns The public URL of the uploaded file
 */
export const uploadProfilePhoto = async (userId: string, file: File | Blob): Promise<string> => {
  // Validate file type
  const fileType = file instanceof File ? file.type : 'image/jpeg';
  if (!ALLOWED_IMAGE_TYPES.includes(fileType)) {
    throw new Error(`Invalid file type. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`);
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }

  // Generate unique filename
  const fileExt = file instanceof File 
    ? file.name.split('.').pop() || 'jpg'
    : 'jpg';
  const fileName = `${userId}/photos/${Date.now()}.${fileExt}`;

  // Upload file
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload profile photo: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(data.path);

  return urlData.publicUrl;
};

/**
 * Upload pronunciation audio to Supabase Storage
 * @param userId - The user ID
 * @param file - The audio file to upload
 * @returns The public URL of the uploaded file
 */
export const uploadPronunciationAudio = async (userId: string, file: File | Blob): Promise<string> => {
  // Validate file type
  const fileType = file instanceof File ? file.type : 'audio/webm';
  if (!ALLOWED_AUDIO_TYPES.includes(fileType)) {
    throw new Error(`Invalid file type. Allowed types: ${ALLOWED_AUDIO_TYPES.join(', ')}`);
  }

  // Validate file size (audio can be larger)
  const maxAudioSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxAudioSize) {
    throw new Error(`File size exceeds maximum of ${maxAudioSize / 1024 / 1024}MB`);
  }

  // Generate unique filename
  const fileExt = file instanceof File 
    ? file.name.split('.').pop() || 'webm'
    : 'webm';
  const fileName = `${userId}/audio/${Date.now()}.${fileExt}`;

  // Upload file
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload pronunciation audio: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(data.path);

  return urlData.publicUrl;
};

/**
 * Convert base64 data URL to Blob
 * @param dataUrl - Base64 data URL
 * @returns Blob object
 */
export const dataUrlToBlob = (dataUrl: string): Blob => {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
};

/**
 * Delete a file from Supabase Storage
 * @param fileUrl - The public URL of the file to delete
 */
export const deleteFile = async (fileUrl: string): Promise<void> => {
  try {
    // Extract path from URL
    const url = new URL(fileUrl);
    const pathParts = url.pathname.split('/');
    const bucketIndex = pathParts.findIndex(part => part === BUCKET_NAME);
    
    if (bucketIndex === -1) {
      throw new Error('Invalid file URL');
    }

    const filePath = pathParts.slice(bucketIndex + 1).join('/');

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      console.warn('Failed to delete file:', error.message);
      // Don't throw - file deletion is not critical
    }
  } catch (error) {
    console.warn('Error deleting file:', error);
    // Don't throw - file deletion is not critical
  }
};

