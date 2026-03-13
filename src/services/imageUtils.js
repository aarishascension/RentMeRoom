import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';

// Compress image with quality and size constraints
export const compressImage = async (uri, options = {}) => {
  try {
    const {
      quality = 0.7,
      maxWidth = 1024,
      maxHeight = 1024,
      format = ImageManipulator.SaveFormat.JPEG
    } = options;

    // Get image info first
    let imageSize = 0;
    try {
      const imageInfo = await FileSystem.getInfoAsync(uri);
      imageSize = imageInfo.size || 0;
      console.log('Original image size:', (imageSize / 1024 / 1024).toFixed(2), 'MB');
    } catch (e) {
      console.log('Could not get original image size');
    }

    // Compress and resize image
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [
        { resize: { width: maxWidth, height: maxHeight } }
      ],
      {
        compress: quality,
        format: format,
        base64: false,
      }
    );

    // Check compressed size
    try {
      const compressedInfo = await FileSystem.getInfoAsync(result.uri);
      console.log('Compressed image size:', ((compressedInfo.size || 0) / 1024 / 1024).toFixed(2), 'MB');
    } catch (e) {
      console.log('Could not get compressed image size');
    }

    return result.uri;
  } catch (error) {
    console.error('Image compression error:', error);
    return uri; // Return original if compression fails
  }
};

// Generate thumbnail
export const generateThumbnail = async (uri, size = 200) => {
  try {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [
        { resize: { width: size, height: size } }
      ],
      {
        compress: 0.5,
        format: ImageManipulator.SaveFormat.JPEG,
        base64: false,
      }
    );

    return result.uri;
  } catch (error) {
    console.error('Thumbnail generation error:', error);
    return uri;
  }
};

// Validate image size and type
export const validateImage = async (uri) => {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    const maxSize = 10 * 1024 * 1024; // 10MB limit
    
    if (info.size && info.size > maxSize) {
      throw new Error('Image size too large. Please select an image under 10MB.');
    }
    
    return true;
  } catch (error) {
    console.error('Image validation error:', error);
    // Don't throw - just return true and let the upload proceed
    return true;
  }
};

// Auto-compress based on file size
export const autoCompressImage = async (uri) => {
  try {
    let sizeInMB = 1; // Default assumption
    
    try {
      const info = await FileSystem.getInfoAsync(uri);
      sizeInMB = (info.size || 1024 * 1024) / 1024 / 1024;
    } catch (e) {
      console.log('Could not get file size, using default compression');
    }
    
    let quality = 0.8;
    let maxWidth = 1024;
    
    // Adjust compression based on file size
    if (sizeInMB > 5) {
      quality = 0.5;
      maxWidth = 800;
    } else if (sizeInMB > 2) {
      quality = 0.6;
      maxWidth = 900;
    } else if (sizeInMB > 1) {
      quality = 0.7;
      maxWidth = 1000;
    }
    
    return await compressImage(uri, { quality, maxWidth, maxHeight: maxWidth });
  } catch (error) {
    console.error('Auto compression error:', error);
    return uri;
  }
};
