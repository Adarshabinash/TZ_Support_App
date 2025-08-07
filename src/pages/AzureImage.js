// src/components/AzureImage.js

import axios from 'axios';

const AzureImage = async fileUri => {
  try {
    const pathSegments = fileUri.split('/');
    const filename = pathSegments[pathSegments.length - 1];

    const generateNewFilename = original => {
      const firstFour = original.slice(0, 4);
      const timestamp = new Date()
        .toISOString()
        .replace(/[:.-]/g, '')
        .slice(0, 12);
      return `profilePic_${firstFour}_${timestamp}.jpg`;
    };

    const getFileExtension = name => {
      return name.slice(((name.lastIndexOf('.') - 1) >>> 0) + 2);
    };

    const fileExtension = getFileExtension(filename);
    const mimeType =
      fileExtension === 'png'
        ? 'image/png'
        : fileExtension === 'jpg' || fileExtension === 'jpeg'
        ? 'image/jpeg'
        : 'image/jpeg';

    const newFilename = generateNewFilename(filename);

    const formData = new FormData();
    formData.append('file', {
      uri: fileUri,
      type: mimeType,
      name: newFilename,
    });

    const response = await axios.post(
      `https://thinkzone.co/cloud-storage/uploadFile/${newFilename}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );
    console.log('image response---->', response);
    const remoteUrl = response?.data?.url;
    if (!remoteUrl) throw new Error('Upload failed: No URL returned');

    // Skip download - just return remote URL
    return {
      success: true,
      remoteUrl,
      localPath: remoteUrl,
    };
  } catch (error) {
    console.error('AzureImage Error:', error);
    return {success: false, remoteUrl: null, localPath: null};
  }
};

export default AzureImage;
