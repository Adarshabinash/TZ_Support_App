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
  // Helpers: integer-piece math
  // ---------------------------
  const build30VerticalPieces = (uri, imgWidth, imgHeight) => {
    const pieces = [];
    const base = Math.floor(imgWidth / 30);
    const remainder = imgWidth - base * 30; // 0..29

    for (let i = 0; i < 30; i++) {
      const extra = i === 29 ? remainder : 0; // add remainder to last piece
      const pieceWidth = base + extra;
      const x = i * base; // for last: x will be correct since previous were base
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
        label: `Strip ${i + 1} (${Math.round((i * 100) / 30)}%-${Math.round(
          ((i + 1) * 100) / 30,
        )}%)`,
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
  // Crop + upload per piece (worker)
  // ---------------------------
  const cropAndUploadPiece = async (piece, index, sourceUri) => {
    // piece.crop: { x, y, width, height } in pixels (integers)
    try {
      // Crop with PhotoManipulator
      const cropRegion = {
        x: Math.round(piece.crop.x),
        y: Math.round(piece.crop.y),
        width: Math.round(piece.crop.width),
        height: Math.round(piece.crop.height),
      };

      // PhotoManipulator.crop returns a file path in cache dir (string)
      const croppedPath = await PhotoManipulator.crop(sourceUri, cropRegion);

      // Normalize to file://
      const normalized = croppedPath.startsWith('file://')
        ? croppedPath
        : `file://${croppedPath}`;

      // Build file object expected by UploadFileToCloud
      const fileObj = {
        uri: normalized,
        name: `strip_${index + 1}.jpg`,
        type: 'image/jpeg',
      };

      console.log(`Cropped strip ${index + 1} -> ${normalized}`);

      // Upload - ensure your UploadFileToCloud accepts { file, fileName }
      const uploadResult = await UploadFileToCloud({
        file: fileObj,
        fileName: fileObj.name,
      });

      // Optionally delete temp file (success or failure) to save space
      try {
        const pathToDelete = normalized.replace('file://', '');
        const exists = await RNFS.exists(pathToDelete);
        if (exists) {
          await RNFS.unlink(pathToDelete);
          // console.log('Deleted temp file:', pathToDelete);
        }
      } catch (delErr) {
        console.warn('Failed to delete temp file:', delErr);
      }

      if (uploadResult && uploadResult.success) {
        console.log(`Upload success [${index + 1}] -> ${uploadResult.url}`);
        return uploadResult.url;
      } else {
        console.warn(`Upload failed for strip ${index + 1}`, uploadResult);
        return null;
      }
    } catch (err) {
      console.error(`cropAndUploadPiece error for index ${index + 1}:`, err);
      return null;
    }
  };

  // ---------------------------
  // Main upload flow
  // ---------------------------
  const uploadImageStripsReal = async (pieces, sourceUri) => {
    setUploading(true);
    try {
      // We'll crop+upload with limited concurrency so we don't hold 30 files in memory/disk
      const urls = await runWithConcurrency(
        pieces,
        async (piece, idx) => {
          return await cropAndUploadPiece(piece, idx, sourceUri);
        },
        3, // concurrency (adjust if needed)
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
  // scanDocument flow (uses new upload)
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
        const uri = scannedImages[0];
        setImageUri(uri);

        // get accurate dimensions
        const dimensions = await getImageDimensions(uri);
        setImageDimensions(dimensions);

        // build 30 pieces (pixel-accurate)
        const pieces = build30VerticalPieces(
          uri,
          dimensions.width,
          dimensions.height,
        );
        setImagePieces(pieces);

        // Now crop & upload real strip files
        await uploadImageStripsReal(pieces, uri);

        // Full-document OCR (if you want)
        await detectTextFromImage(uri);
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
  // Utility: getImageDimensions (works for file://, content://, http)
  // ---------------------------
  const getImageDimensions = uri => {
    return new Promise((resolve, reject) => {
      Image.getSize(
        uri,
        (w, h) => resolve({width: w, height: h}),
        err => {
          console.warn('Image.getSize failed, trying fallback', err);
          // as a fallback, try to read with RNFS (may not work for content://)
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
        style={{marginRight: 10, alignItems: 'center', position: 'relative'}}
        onPress={() => handlePiecePress(index)}
        activeOpacity={0.7}>
        <View
          style={{
            overflow: 'hidden',
            borderRadius: 4,
            width: displayWidth,
            height: displayHeight,
            borderColor: isSelected ? '#00BCD4' : '#ddd',
            borderWidth: isSelected ? 2 : 1,
          }}>
          <Image
            source={{uri: piece.uri}}
            style={{
              position: 'absolute',
              width:
                piece.originalWidth * (displayHeight / piece.originalHeight),
              height: displayHeight,
              left: -piece.crop.x * (displayHeight / piece.originalHeight),
            }}
            resizeMode="cover"
          />
        </View>

        <Text
          style={{
            fontSize: 10,
            color: '#555',
            textAlign: 'center',
            marginTop: 5,
          }}>
          {piece.label}
        </Text>

        {uploadedUrls[index] && (
          <Text
            style={{
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
            }}>
            ✓
          </Text>
        )}
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
    <LinearGradient colors={['#e0f7fa', '#ffffff']} style={{flex: 1}}>
      <ScrollView
        contentContainerStyle={{
          padding: 20,
          paddingBottom: 40,
          minHeight: height,
        }}>
        <Text
          style={{
            fontSize: 24,
            fontWeight: 'bold',
            color: '#2C3E50',
            textAlign: 'center',
            marginVertical: 20,
          }}>
          Android Document Scanner
        </Text>

        <View style={{width: '100%', marginBottom: 20}}>
          <TouchableOpacity
            style={{
              padding: 15,
              borderRadius: 8,
              marginVertical: 10,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#00BCD4',
            }}
            onPress={scanDocument}
            disabled={isScanning || uploading}>
            {isScanning || uploading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={{color: 'white', fontWeight: '600', fontSize: 16}}>
                {imageUri ? 'Scan New Document' : '📷 Scan Document'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {uploading && (
          <View
            style={{
              backgroundColor: 'white',
              padding: 15,
              borderRadius: 8,
              marginBottom: 15,
              alignItems: 'center',
            }}>
            <Text style={{fontSize: 16, color: '#2C3E50', marginBottom: 10}}>
              Uploading image strips...
            </Text>
            <ActivityIndicator size="large" color="#00BCD4" />
          </View>
        )}

        {imageUri && (
          <View
            style={{
              width: '100%',
              backgroundColor: 'white',
              borderRadius: 12,
              padding: 15,
            }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                marginBottom: 8,
                color: '#34495E',
              }}>
              Full Document:
            </Text>
            <Image
              source={{uri: imageUri}}
              style={{
                width: '100%',
                maxHeight: 300,
                borderRadius: 8,
                marginBottom: 15,
                backgroundColor: '#f5f5f5',
                aspectRatio: imageDimensions.width / imageDimensions.height,
              }}
              resizeMode="contain"
            />

            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                marginBottom: 8,
                color: '#34495E',
              }}>
              Document Strips (30 Equal Vertical Sections):
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator
              contentContainerStyle={{paddingVertical: 10}}>
              <View style={{flexDirection: 'row', alignItems: 'flex-start'}}>
                {imagePieces.map((piece, index) =>
                  renderImagePiece(piece, index),
                )}
              </View>
            </ScrollView>

            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: 15,
              }}>
              <TouchableOpacity
                style={{
                  padding: 12,
                  borderRadius: 8,
                  width: '48%',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#FF3A30',
                }}
                onPress={handleRecapture}>
                <Text style={{color: 'white', fontWeight: '600'}}>Retake</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  padding: 12,
                  borderRadius: 8,
                  width: '48%',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#4CD964',
                }}
                onPress={() => {
                  Alert.alert(
                    'Upload Complete',
                    `Uploaded ${
                      uploadedUrls.filter(url => url).length
                    }/30 strips successfully`,
                  );
                  console.log('Uploaded strip URLs:', uploadedUrls);
                }}>
                <Text style={{color: 'white', fontWeight: '600'}}>Confirm</Text>
              </TouchableOpacity>
            </View>
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
    minHeight: height,
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
    marginRight: 10,
    alignItems: 'center',
    position: 'relative',
  },
  pieceImageWrapper: {
    overflow: 'hidden',
    borderRadius: 4,
  },
  pieceImage: {
    position: 'absolute',
  },
  pieceLabel: {
    fontSize: 10,
    color: '#555',
    textAlign: 'center',
    marginTop: 5,
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#34495E',
  },
});

export default AndroidDocumentScanner;
