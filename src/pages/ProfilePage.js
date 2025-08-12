import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  PermissionsAndroid,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  LogBox,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import DocumentScanner from 'react-native-document-scanner-plugin';
import RNBlobUtil from 'react-native-blob-util';
import axios from 'axios';
import {Image as ImageJS} from 'image-js';

// Initialize Buffer polyfill properly
if (typeof global.Buffer === 'undefined') {
  global.Buffer = require('buffer').Buffer;
}

LogBox.ignoreLogs(['ViewPropTypes will be removed']);

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

const AndroidDocumentScanner = () => {
  const [imageUri, setImageUri] = useState(null);
  const [imagePieces, setImagePieces] = useState([]);
  const [detectedText, setDetectedText] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrls, setUploadedUrls] = useState([]);
  const [processedImages, setProcessedImages] = useState([]);
  const [allUploadedUrls, setAllUploadedUrls] = useState([]);
  console.log('allUploadedUrls', allUploadedUrls);
  const [showUrlList, setShowUrlList] = useState(false); // Toggle URL list visibility

  const BATCH_SIZE = 5;
  const NUM_STRIPS = 30;

  useEffect(() => {
    console.log('Component mounted - checking camera permission');
    checkCameraPermission();
    return () => {
      console.log('Component unmounting - cleaning up temp files');
      cleanupTempFiles();
    };
  }, []);

  const cleanupTempFiles = async () => {
    try {
      console.log('Starting cleanup of temp files');
      let cleanedCount = 0;
      for (const uri of processedImages) {
        try {
          const path = uri.replace('file://', '');
          if (await RNBlobUtil.fs.exists(path)) {
            await RNBlobUtil.fs.unlink(path);
            cleanedCount++;
          }
        } catch (error) {
          console.warn('Error cleaning up file:', uri, error);
        }
      }
      console.log(`Cleaned up ${cleanedCount} temporary files`);
    } catch (error) {
      console.warn('Overall cleanup error:', error);
    }
  };

  const checkCameraPermission = async () => {
    try {
      console.log('Checking camera permission');
      const granted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.CAMERA,
      );
      console.log('Camera permission status:', granted ? 'GRANTED' : 'DENIED');
      setHasCameraPermission(granted);
      return granted;
    } catch (err) {
      console.log('Permission check error:', err);
      return false;
    }
  };

  const requestCameraPermission = async () => {
    try {
      console.log('Requesting camera permission');
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Camera Permission',
          message: 'This app needs camera access to scan documents',
          buttonPositive: 'OK',
          buttonNegative: 'Cancel',
        },
      );
      const isGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
      console.log(
        'Permission request result:',
        isGranted ? 'GRANTED' : 'DENIED',
      );
      setHasCameraPermission(isGranted);
      return isGranted;
    } catch (err) {
      console.log('Permission request error:', err);
      return false;
    }
  };

  const detectTextFromImage = async uri => {
    try {
      console.log('Starting text detection for image:', uri);
      const result = await TextRecognition.recognize(uri);
      console.log(
        'Text detection completed. Found text:',
        result?.text?.length > 0,
      );
      setDetectedText(result?.text || 'No text detected');
    } catch (error) {
      console.error('OCR error:', error);
      setDetectedText('Text detection failed');
    }
  };

  const loadImageForProcessing = async uri => {
    try {
      console.log('Loading image for processing:', uri);
      const imagePath = uri.replace('file://', '');
      const base64Data = await RNBlobUtil.fs.readFile(imagePath, 'base64');
      const image = await ImageJS.load(`data:image/jpeg;base64,${base64Data}`);
      console.log(
        'Image loaded successfully. Dimensions:',
        image.width,
        'x',
        image.height,
      );
      return image;
    } catch (error) {
      console.error('Error loading image:', error);
      throw error;
    }
  };

  const processAndSplitImage = async uri => {
    try {
      console.log(
        `Starting to process and split image into ${NUM_STRIPS} strips`,
      );
      const image = await loadImageForProcessing(uri);
      const stripWidth = Math.floor(image.width / NUM_STRIPS);
      const strips = [];
      const processedUris = [];

      console.log(`Original image dimensions: ${image.width}x${image.height}`);
      console.log(`Calculated strip width: ${stripWidth}px`);

      for (let i = 0; i < NUM_STRIPS; i++) {
        const x = i * stripWidth;
        const width = i === NUM_STRIPS - 1 ? image.width - x : stripWidth;

        console.log(
          `Processing strip ${i + 1}/${NUM_STRIPS} - x: ${x}, width: ${width}`,
        );

        const strip = image.crop({
          x,
          y: 0,
          width,
          height: image.height,
        });

        const stripBase64 = await strip.toBase64('image/jpeg');
        const stripPath = `${
          RNBlobUtil.fs.dirs.CacheDir
        }/strip_${i}_${Date.now()}.jpg`;
        await RNBlobUtil.fs.writeFile(stripPath, stripBase64, 'base64');

        strips.push({
          uri: `file://${stripPath}`,
          originalWidth: image.width,
          originalHeight: image.height,
          width: strip.width,
          height: strip.height,
          crop: {x, y: 0, width: strip.width, height: strip.height},
          label: `Strip ${i + 1}`,
          uniquePath: stripPath,
        });
        processedUris.push(`file://${stripPath}`);

        console.log(`Created strip ${i + 1} at path: ${stripPath}`);
      }

      setProcessedImages(processedUris);
      console.log(`Successfully created ${strips.length} image strips`);
      return strips;
    } catch (error) {
      console.error('Error processing image:', error);
      throw error;
    }
  };

  const uploadImageStrips = async strips => {
    setUploading(true);
    const urls = Array(strips.length).fill(null);
    setUploadedUrls(urls);
    setAllUploadedUrls([]); // Reset all URLs when starting new upload

    console.log(
      `Starting upload of ${strips.length} image strips in batches of ${BATCH_SIZE}`,
    );

    try {
      for (let i = 0; i < strips.length; i += BATCH_SIZE) {
        const batchStartTime = Date.now();
        const batch = strips.slice(i, i + BATCH_SIZE);
        console.log(
          `Processing batch ${Math.floor(i / BATCH_SIZE) + 1} (strips ${
            i + 1
          }-${Math.min(i + BATCH_SIZE, strips.length)})`,
        );

        const batchResults = await Promise.all(
          batch.map(async (strip, batchIndex) => {
            const globalIndex = i + batchIndex;
            console.log(`Starting upload for strip ${globalIndex + 1}`);

            try {
              const fileName = `strip_${globalIndex}_${Date.now()}.jpg`;
              const file = {
                uri: strip.uri,
                type: 'image/jpeg',
                name: fileName,
              };

              console.log(`Uploading strip ${globalIndex + 1} as ${fileName}`);
              const uploadStartTime = Date.now();
              const uploadResult = await UploadFileToCloud({file, fileName});
              const uploadTime = Date.now() - uploadStartTime;

              if (uploadResult.success) {
                console.log(
                  `Upload successful for strip ${
                    globalIndex + 1
                  } in ${uploadTime}ms. URL: ${uploadResult.url}`,
                );
                return {
                  url: uploadResult.url,
                  path: strip.uri,
                  index: globalIndex,
                };
              } else {
                console.log(
                  `Upload failed for strip ${
                    globalIndex + 1
                  } after ${uploadTime}ms`,
                );
                return null;
              }
            } catch (error) {
              console.error(`Error uploading strip ${globalIndex + 1}:`, error);
              return null;
            }
          }),
        );

        const newUrls = [...urls];
        const successfulUploads = batchResults.filter(r => r !== null);

        // Update the allUploadedUrls state with the new successful uploads
        setAllUploadedUrls(prev => [
          ...prev,
          ...successfulUploads.map(upload => ({
            url: upload.url,
            index: upload.index,
          })),
        ]);

        batchResults.forEach((result, batchIndex) => {
          if (result) {
            newUrls[i + batchIndex] = result;
          }
        });
        setUploadedUrls(newUrls);

        const batchEndTime = Date.now();
        console.log(
          `Batch ${Math.floor(i / BATCH_SIZE) + 1} completed in ${
            batchEndTime - batchStartTime
          }ms. Successfully uploaded ${successfulUploads.length}/${
            batch.length
          } strips`,
        );

        if (i + BATCH_SIZE < strips.length) {
          console.log(`Waiting 500ms before next batch...`);
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      const successfulUploads = uploadedUrls.filter(url => url !== null).length;
      console.log(
        `Upload process completed. Successfully uploaded ${successfulUploads}/${strips.length} strips`,
      );
      return urls;
    } catch (error) {
      console.error('Error in upload process:', error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const scanDocument = async () => {
    try {
      console.log('Starting document scan process');
      if (!hasCameraPermission) {
        console.log('No camera permission - requesting...');
        const permissionGranted = await requestCameraPermission();
        if (!permissionGranted) {
          console.log('Camera permission denied');
          Alert.alert(
            'Permission Required',
            'Camera permission is needed to scan documents',
          );
          return;
        }
      }

      setIsScanning(true);
      setImageUri(null);
      setImagePieces([]);
      setDetectedText('');
      setSelectedPiece(null);
      setUploadedUrls([]);
      setAllUploadedUrls([]);
      setShowUrlList(false);
      await cleanupTempFiles();
      setProcessedImages([]);

      console.log('Opening document scanner');
      const {scannedImages} = await DocumentScanner.scanDocument({
        responseType: 'uri',
        quality: 1.0,
        letUserAdjustCrop: true,
        maxNumDocuments: 1,
      });

      if (scannedImages?.length > 0) {
        const uri = scannedImages[0];
        console.log('Document scanned successfully. URI:', uri);
        setImageUri(uri);

        const dimensions = await getImageDimensions(uri);
        console.log('Scanned image dimensions:', dimensions);
        setImageDimensions(dimensions);

        console.log('Processing scanned image into strips...');
        const pieces = await processAndSplitImage(uri);
        setImagePieces(pieces);

        console.log('Starting upload of image strips...');
        await uploadImageStrips(pieces);

        console.log('Starting text detection...');
        await detectTextFromImage(uri);
      } else {
        console.log('Document scan was cancelled');
      }
    } catch (error) {
      console.error('Scan error:', error);
      Alert.alert('Error', 'Failed to scan document: ' + error.message);
    } finally {
      setIsScanning(false);
      console.log('Scan process completed');
    }
  };

  const getImageDimensions = uri => {
    return new Promise(resolve => {
      console.log('Getting image dimensions for:', uri);
      Image.getSize(
        uri,
        (width, height) => {
          console.log('Image dimensions retrieved:', width, height);
          resolve({width, height});
        },
        error => {
          console.warn('Failed to get image dimensions:', error);
          resolve({width: 300, height: 400});
        },
      );
    });
  };

  const handlePiecePress = index => {
    console.log('Piece pressed:', index);
    setSelectedPiece(selectedPiece === index ? null : index);
  };

  const renderImagePiece = (piece, index) => {
    const isSelected = selectedPiece === index;
    const normalHeight = 150;
    const selectedHeight = 300;
    const displayHeight = isSelected ? selectedHeight : normalHeight;
    const aspectRatio = piece.width / piece.height;
    const displayWidth = displayHeight * aspectRatio;
    const uploadedInfo = uploadedUrls[index];

    return (
      <TouchableOpacity
        key={index}
        style={styles.pieceContainer}
        onPress={() => handlePiecePress(index)}
        activeOpacity={0.7}>
        <View
          style={[
            styles.pieceImageWrapper,
            {
              width: displayWidth,
              height: displayHeight,
              borderColor: isSelected ? '#00BCD4' : '#ddd',
              borderWidth: isSelected ? 2 : 1,
            },
          ]}>
          <Image
            source={{uri: piece.uri}}
            style={{
              width: '100%',
              height: '100%',
            }}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.pieceLabel}>{piece.label}</Text>
        {uploadedInfo && (
          <>
            <Text style={styles.uploadSuccess}>✓</Text>
            {isSelected && (
              <Text
                style={styles.pathText}
                numberOfLines={1}
                ellipsizeMode="middle">
                {uploadedInfo.url}
              </Text>
            )}
          </>
        )}
      </TouchableOpacity>
    );
  };

  const handleRecapture = async () => {
    console.log('User requested to recapture document');
    await cleanupTempFiles();
    setImageUri(null);
    setImagePieces([]);
    setDetectedText('');
    setSelectedPiece(null);
    setUploadedUrls([]);
    setAllUploadedUrls([]);
    setShowUrlList(false);
    setProcessedImages([]);
    console.log('State reset for recapture');
  };

  const toggleUrlList = () => {
    setShowUrlList(!showUrlList);
  };

  return (
    <LinearGradient colors={['#e0f7fa', '#ffffff']} style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.header}>Document Scanner</Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.button,
              styles.scanButton,
              (isScanning || uploading) && styles.scanButtonDisabled,
            ]}
            onPress={scanDocument}
            disabled={isScanning || uploading}>
            {isScanning || uploading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.buttonText}>
                {imageUri ? 'Scan New Document' : 'Scan Document'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {uploading && (
          <View style={styles.uploadingContainer}>
            <Text style={styles.uploadingText}>Uploading image strips...</Text>
            <ActivityIndicator size="large" color="#00BCD4" />
            <Text style={styles.uploadProgress}>
              {uploadedUrls.filter(url => url).length} / {NUM_STRIPS} uploaded
            </Text>
          </View>
        )}

        {imageUri && (
          <View style={styles.resultContainer}>
            <Text style={styles.sectionTitle}>Scanned Document:</Text>
            <Image
              source={{uri: imageUri}}
              style={[
                styles.scannedImage,
                {aspectRatio: imageDimensions.width / imageDimensions.height},
              ]}
              resizeMode="contain"
            />

            <Text style={styles.sectionTitle}>
              Document Strips ({NUM_STRIPS}):
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={true}
              contentContainerStyle={styles.piecesScrollContent}>
              <View style={styles.piecesRow}>
                {imagePieces.map((piece, index) =>
                  renderImagePiece(piece, index),
                )}
              </View>
            </ScrollView>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.recaptureButton]}
                onPress={handleRecapture}>
                <Text style={styles.actionButtonText}>Retake</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.confirmButton]}
                onPress={() => {
                  const successfulUploads = allUploadedUrls.length;
                  console.log(
                    'User confirmed upload. Successful uploads:',
                    successfulUploads,
                  );
                  Alert.alert(
                    'Upload Complete',
                    `Uploaded ${successfulUploads}/${NUM_STRIPS} strips successfully`,
                    [
                      {
                        text: 'View URLs',
                        onPress: toggleUrlList,
                      },
                      {text: 'OK'},
                    ],
                  );
                }}>
                <Text style={styles.actionButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>

            {showUrlList && (
              <View style={styles.urlListContainer}>
                <Text style={styles.urlListTitle}>Uploaded URLs:</Text>
                <ScrollView style={styles.urlScrollView}>
                  {allUploadedUrls
                    .sort((a, b) => a.index - b.index)
                    .map((item, idx) => (
                      <View key={idx} style={styles.urlItem}>
                        <Text style={styles.urlIndex}>
                          Strip {item.index + 1}:
                        </Text>
                        <Text style={styles.urlText} selectable={true}>
                          {item.url}
                        </Text>
                      </View>
                    ))}
                </ScrollView>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={toggleUrlList}>
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    textAlign: 'center',
    marginVertical: 20,
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 20,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    marginVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scanButton: {
    backgroundColor: '#00BCD4',
  },
  scanButtonDisabled: {
    backgroundColor: '#B2EBF2',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  resultContainer: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 20,
  },
  scannedImage: {
    width: '100%',
    maxHeight: 300,
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: '#f5f5f5',
  },
  piecesScrollContent: {
    paddingVertical: 10,
  },
  piecesRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  pieceContainer: {
    marginRight: 15,
    alignItems: 'center',
    position: 'relative',
  },
  pieceImageWrapper: {
    overflow: 'hidden',
    borderRadius: 4,
    backgroundColor: '#f9f9f9',
  },
  pieceImage: {
    width: '100%',
    height: '100%',
  },
  pieceLabel: {
    fontSize: 12,
    color: '#555',
    textAlign: 'center',
    marginTop: 5,
    fontWeight: '500',
  },
  uploadSuccess: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: '#4CD964',
    color: 'white',
    borderRadius: 10,
    width: 20,
    height: 20,
    textAlign: 'center',
    lineHeight: 20,
    fontSize: 12,
  },
  pathText: {
    fontSize: 10,
    color: '#888',
    textAlign: 'center',
    marginTop: 2,
    maxWidth: 120,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  actionButton: {
    padding: 12,
    borderRadius: 8,
    width: '48%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recaptureButton: {
    backgroundColor: '#FF3A30',
  },
  confirmButton: {
    backgroundColor: '#4CD964',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  uploadingContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    alignItems: 'center',
  },
  uploadingText: {
    fontSize: 16,
    color: '#2C3E50',
    marginBottom: 10,
  },
  uploadProgress: {
    fontSize: 14,
    color: '#7F8C8D',
    marginTop: 5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#34495E',
  },
  urlListContainer: {
    marginTop: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
  },
  urlListTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#2C3E50',
  },
  urlScrollView: {
    maxHeight: 200,
    marginBottom: 10,
  },
  urlItem: {
    marginBottom: 8,
  },
  urlIndex: {
    fontWeight: '600',
    color: '#3498db',
  },
  urlText: {
    color: '#7f8c8d',
    fontSize: 12,
  },
  closeButton: {
    backgroundColor: '#e74c3c',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});

export const UploadFileToCloud = async ({file, fileName}) => {
  console.log(`Starting upload for file: ${fileName}`);
  console.log('File details:', {
    uri: file.uri,
    type: file.type,
    size: (await RNBlobUtil.fs.stat(file.uri.replace('file://', ''))).size,
  });

  try {
    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      type: file.type,
      name: fileName,
    });

    console.log('FormData created. Starting upload request...');
    const uploadStartTime = Date.now();

    const response = await axios.post(
      `https://thinkzone.co/cloud-storage/uploadFile/${fileName}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000,
      },
    );

    const uploadTime = Date.now() - uploadStartTime;
    console.log(
      `Upload completed in ${uploadTime}ms. Response status: ${response.status}`,
    );
    console.log('Response data:', response.data);

    return {
      success: response?.status === 200,
      url: response?.data?.url,
    };
  } catch (error) {
    console.error('Error uploading file:', {
      error: error.message,
      response: error.response?.data,
      fileName,
    });
    return {success: false, url: null};
  }
};

export default AndroidDocumentScanner;
