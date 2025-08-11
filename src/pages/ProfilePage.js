// AndroidDocumentScanner.js
import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  PermissionsAndroid,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  LogBox,
  Platform,
  StyleSheet,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import DocumentScanner from 'react-native-document-scanner-plugin';
import {UploadFileToCloud} from '../components/CloudUpload';
import RNFS from 'react-native-fs';
import PhotoManipulator from 'react-native-photo-manipulator';
import Exif from 'react-native-exif';

LogBox.ignoreLogs(['ViewPropTypes will be removed']);

const {width, height} = Dimensions.get('window');

const AndroidDocumentScanner = () => {
  const [imageUri, setImageUri] = useState(null);
  const [imagePieces, setImagePieces] = useState([]);
  const [detectedText, setDetectedText] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({width: 0, height: 0});
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrls, setUploadedUrls] = useState([]);

  useEffect(() => {
    checkCameraPermission();
  }, []);

  const checkCameraPermission = async () => {
    try {
      const granted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.CAMERA,
      );
      setHasCameraPermission(granted);
      return granted;
    } catch (err) {
      console.log('Permission check error:', err);
      return false;
    }
  };

  const requestCameraPermission = async () => {
    try {
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
      setHasCameraPermission(isGranted);
      return isGranted;
    } catch (err) {
      console.log('Permission request error:', err);
      return false;
    }
  };

  const detectTextFromImage = async uri => {
    try {
      const result = await TextRecognition.recognize(uri);
      setDetectedText(result?.text || 'No text detected');
    } catch (error) {
      console.error('OCR error:', error);
      setDetectedText('Text detection failed');
    }
  };

  // ---------------------------
  // Ensure we have a file:// uri (best-effort)
  // ---------------------------
  const ensureFileUri = async uri => {
    if (!uri) throw new Error('No uri supplied to ensureFileUri');
    try {
      // If already file://, return
      if (uri.startsWith('file://')) return uri;

      // If data: (base64 data URI), write to cache
      if (uri.startsWith('data:')) {
        const base64 = uri.split(',')[1];
        const tmpPath = `${
          RNFS.CachesDirectoryPath
        }/scan_tmp_${Date.now()}.jpg`;
        await RNFS.writeFile(tmpPath, base64, 'base64');
        return `file://${tmpPath}`;
      }

      // Try to read with RNFS (sometimes works for content:// on some devices)
      try {
        const base64 = await RNFS.readFile(uri, 'base64');
        const tmpPath = `${
          RNFS.CachesDirectoryPath
        }/scan_tmp_${Date.now()}.jpg`;
        await RNFS.writeFile(tmpPath, base64, 'base64');
        return `file://${tmpPath}`;
      } catch (err) {
        // RNFS may fail on content:// on some Android versions
        console.warn(
          'ensureFileUri: RNFS.readFile failed, falling back to original uri',
          err,
        );
        return uri; // fallback, maybe PhotoManipulator can handle content://
      }
    } catch (err) {
      console.warn('ensureFileUri unexpected error', err);
      return uri;
    }
  };

  // ---------------------------
  // EXIF orientation helpers
  // ---------------------------
  const getExifOrientation = async uri => {
    try {
      // Exif.getExif expects a filesystem path (no file://)
      const path = uri.startsWith('file://') ? uri.replace('file://', '') : uri;
      const exif = await Exif.getExif(path);
      const o = exif?.Orientation || exif?.orientation || exif?.OrientationTag;
      if (!o) return null;
      return parseInt(o, 10);
    } catch (err) {
      console.warn('getExifOrientation failed', err);
      return null;
    }
  };

  const ensureUprightImage = async originalUri => {
    try {
      const fileUri = await ensureFileUri(originalUri);
      const orientation = await getExifOrientation(fileUri);
      console.log('EXIF orientation:', orientation);

      if (!orientation || orientation === 1) {
        // treat as upright
        return fileUri;
      }

      let angle = 0;
      if (orientation === 3) angle = 180;
      else if (orientation === 6) angle = 90;
      else if (orientation === 8) angle = 270;
      else angle = 0;

      if (angle === 0) return fileUri;

      // PhotoManipulator.rotate often expects a plain path (no file://) on some versions
      const srcForRotate = fileUri.startsWith('file://')
        ? fileUri.replace('file://', '')
        : fileUri;
      const rotatedPath = await PhotoManipulator.rotate(srcForRotate, angle);
      const normalized = rotatedPath.startsWith('file://')
        ? rotatedPath
        : `file://${rotatedPath}`;

      console.log('Rotated image path:', normalized);
      return normalized;
    } catch (err) {
      console.warn('ensureUprightImage failed, returning original uri', err);
      return originalUri;
    }
  };

  // ---------------------------
  // Build pieces with cumulative integer math
  // ---------------------------
  const build30VerticalPieces = (uri, imgWidth, imgHeight) => {
    const pieces = [];
    const base = Math.floor(imgWidth / 30);
    const remainder = imgWidth - base * 30;
    let x = 0;

    for (let i = 0; i < 30; i++) {
      const extra = i === 29 ? remainder : 0;
      const pieceWidth = base + extra;
      pieces.push({
        uri,
        originalWidth: imgWidth,
        originalHeight: imgHeight,
        width: pieceWidth,
        height: imgHeight,
        crop: {
          x: x,
          y: 0,
          width: pieceWidth,
          height: imgHeight,
        },
        label: `Strip ${i + 1}`,
      });
      x += pieceWidth;
    }

    if (x !== imgWidth) {
      console.warn('build30VerticalPieces: widths sum mismatch', {
        sum: x,
        imgWidth,
      });
    }

    return pieces;
  };

  // ---------------------------
  // Concurrency runner
  // ---------------------------
  const runWithConcurrency = async (items, workerFn, concurrency = 3) => {
    const results = new Array(items.length);
    let idx = 0;

    const runners = new Array(concurrency).fill(null).map(async () => {
      while (true) {
        const current = idx++;
        if (current >= items.length) break;
        try {
          results[current] = await workerFn(items[current], current);
        } catch (err) {
          console.error('Worker error at index', current, err);
          results[current] = null;
        }
      }
    });

    await Promise.all(runners);
    return results;
  };

  // ---------------------------
  // Crop + upload worker
  // ---------------------------
  const cropAndUploadPiece = async (piece, index, sourceUri) => {
    try {
      // Ensure sourceUri is a usable file path for PhotoManipulator (strip file:// if needed)
      const srcCandidate =
        sourceUri && sourceUri.startsWith('file://')
          ? sourceUri.replace('file://', '')
          : sourceUri;

      const cropRegion = {
        x: Math.round(piece.crop.x),
        y: Math.round(piece.crop.y),
        width: Math.round(piece.crop.width),
        height: Math.round(piece.crop.height),
      };

      console.log(`Cropping strip ${index + 1}:`, cropRegion);

      // Crop - PhotoManipulator.crop returns a path (sometimes without file://)
      const croppedPath = await PhotoManipulator.crop(srcCandidate, cropRegion);
      const normalized = croppedPath.startsWith('file://')
        ? croppedPath
        : `file://${croppedPath}`;

      console.log(`Cropped path [${index + 1}]:`, normalized);

      const fileObj = {
        uri: normalized,
        name: `strip_${index + 1}.jpg`,
        type: 'image/jpeg',
      };

      // Upload - ensure UploadFileToCloud supports file objects like this
      const uploadResult = await UploadFileToCloud({
        file: fileObj,
        fileName: fileObj.name,
      });
      console.log(`Upload result [${index + 1}]:`, uploadResult);

      // Delete temp cropped file to save space (best-effort)
      try {
        const pathToDelete = normalized.replace('file://', '');
        const exists = await RNFS.exists(pathToDelete);
        if (exists) {
          await RNFS.unlink(pathToDelete);
          // console.log('Deleted temp cropped file:', pathToDelete);
        }
      } catch (delErr) {
        console.warn('Failed to delete temp cropped file', delErr);
      }

      if (uploadResult && uploadResult.success) {
        console.log(`Uploaded strip ${index + 1} -> ${uploadResult.url}`);
        return uploadResult.url;
      } else {
        console.warn(`Upload failed for strip ${index + 1}`);
        return null;
      }
    } catch (err) {
      console.error(`cropAndUploadPiece error for index ${index + 1}:`, err);
      return null;
    }
  };

  // ---------------------------
  // Main upload flow (crop+upload)
  // ---------------------------
  const uploadImageStripsReal = async (pieces, sourceUri) => {
    setUploading(true);
    try {
      const urls = await runWithConcurrency(
        pieces,
        async (piece, idx) => {
          return await cropAndUploadPiece(piece, idx, sourceUri);
        },
        3,
      );

      setUploadedUrls(urls);
      console.log('All strip URLs:', urls);
      return urls;
    } catch (err) {
      console.error('Error uploading strips:', err);
      throw err;
    } finally {
      setUploading(false);
    }
  };

  // ---------------------------
  // scanDocument flow
  // ---------------------------
  const scanDocument = async () => {
    try {
      if (!hasCameraPermission) {
        const permissionGranted = await requestCameraPermission();
        if (!permissionGranted) {
          Alert.alert(
            'Permission Required',
            'You need to grant camera permissions to scan documents',
          );
          return;
        }
      }

      setIsScanning(true);
      console.log('Opening Android document scanner...');

      const {scannedImages} = await DocumentScanner.scanDocument({
        responseType: 'uri',
        quality: 1.0,
        letUserAdjustCrop: true,
        maxNumDocuments: 1,
      });

      console.log('Scanner completed with results:', scannedImages);

      if (scannedImages && scannedImages.length > 0) {
        const rawUri = scannedImages[0];
        setImageUri(rawUri);

        // Ensure file uri and upright orientation
        const fileUri = await ensureFileUri(rawUri);
        const uprightUri = await ensureUprightImage(fileUri);

        // get accurate dimensions for the rotated/upright image
        const dimensions = await getImageDimensions(uprightUri);
        setImageDimensions(dimensions);

        // build pieces and set preview
        const pieces = build30VerticalPieces(
          uprightUri,
          dimensions.width,
          dimensions.height,
        );
        setImagePieces(pieces);

        // crop & upload from uprightUri
        await uploadImageStripsReal(pieces, uprightUri);

        // Full-document OCR (if desired)
        await detectTextFromImage(uprightUri);
      } else {
        console.log('User cancelled document scan');
      }
    } catch (error) {
      console.error('Document scan error:', error);
      Alert.alert(
        'Scanner Error',
        error.message || 'Failed to open document scanner. Please try again.',
      );
    } finally {
      setIsScanning(false);
    }
  };

  // ---------------------------
  // Utility: getImageDimensions (works for file:// or http; may fail for content://)
  // ---------------------------
  const getImageDimensions = uri => {
    return new Promise((resolve, reject) => {
      Image.getSize(
        uri,
        (w, h) => resolve({width: w, height: h}),
        err => {
          console.warn('Image.getSize failed for uri:', uri, err);
          reject(err);
        },
      );
    });
  };

  const handlePiecePress = index => {
    setSelectedPiece(selectedPiece === index ? null : index);
  };

  const renderImagePiece = (piece, index) => {
    const isSelected = selectedPiece === index;
    const normalHeight = 150;
    const selectedHeight = 300;
    const displayHeight = isSelected ? selectedHeight : normalHeight;
    const aspectRatio = piece.width / piece.originalHeight;
    const displayWidth = displayHeight * aspectRatio;

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
            style={[
              styles.pieceImage,
              {
                width:
                  piece.originalWidth * (displayHeight / piece.originalHeight),
                height: displayHeight,
                left: -piece.crop.x * (displayHeight / piece.originalHeight),
              },
            ]}
            resizeMode="cover"
          />
        </View>
        <Text style={styles.pieceLabel}>{piece.label}</Text>
        {uploadedUrls[index] && <Text style={styles.uploadSuccess}>✓</Text>}
      </TouchableOpacity>
    );
  };

  const handleRecapture = () => {
    setImageUri(null);
    setImagePieces([]);
    setDetectedText('');
    setSelectedPiece(null);
    setUploadedUrls([]);
  };

  return (
    <LinearGradient colors={['#e0f7fa', '#ffffff']} style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.header}>Android Document Scanner</Text>

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
                {imageUri ? 'Scan New Document' : '📷 Scan Document'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {uploading && (
          <View style={styles.uploadingContainer}>
            <Text style={styles.uploadingText}>Uploading image strips...</Text>
            <ActivityIndicator size="large" color="#00BCD4" />
          </View>
        )}

        {imageUri && (
          <View style={styles.resultContainer}>
            <Text style={styles.sectionTitle}>Full Document:</Text>
            <Image
              source={{uri: imageUri}}
              style={[
                styles.scannedImage,
                {aspectRatio: imageDimensions.width / imageDimensions.height},
              ]}
              resizeMode="contain"
            />

            <Text style={styles.sectionTitle}>
              Document Strips (30 Equal Vertical Sections):
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
                  Alert.alert(
                    'Upload Complete',
                    `Uploaded ${
                      uploadedUrls.filter(url => url).length
                    }/30 strips successfully`,
                  );
                  console.log('Uploaded strip URLs:', uploadedUrls);
                }}>
                <Text style={styles.actionButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  // left intentionally minimal — paste your styles here
  container: {flex: 1},
  scrollContent: {padding: 20, paddingBottom: 40, minHeight: height},
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    textAlign: 'center',
    marginVertical: 20,
  },
  buttonContainer: {width: '100%', marginBottom: 20},
  button: {
    padding: 15,
    borderRadius: 8,
    marginVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanButton: {backgroundColor: '#00BCD4'},
  scanButtonDisabled: {backgroundColor: '#B2EBF2'},
  buttonText: {color: 'white', fontWeight: '600', fontSize: 16},
  uploadingContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    alignItems: 'center',
  },
  uploadingText: {fontSize: 16, color: '#2C3E50', marginBottom: 10},
  resultContainer: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
  },
  scannedImage: {
    width: '100%',
    maxHeight: 300,
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: '#f5f5f5',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#34495E',
  },
  piecesScrollContent: {paddingVertical: 10},
  piecesRow: {flexDirection: 'row', alignItems: 'flex-start'},
  pieceContainer: {marginRight: 10, alignItems: 'center', position: 'relative'},
  pieceImageWrapper: {overflow: 'hidden', borderRadius: 4},
  pieceImage: {position: 'absolute'},
  pieceLabel: {fontSize: 10, color: '#555', textAlign: 'center', marginTop: 5},
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
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  actionButton: {
    padding: 12,
    borderRadius: 8,
    width: '48%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recaptureButton: {backgroundColor: '#FF3A30'},
  confirmButton: {backgroundColor: '#4CD964'},
  actionButtonText: {color: 'white', fontWeight: '600'},
});

export default AndroidDocumentScanner;
