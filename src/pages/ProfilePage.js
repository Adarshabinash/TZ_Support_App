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
import {UploadFileToCloud} from '../components/CloudUpload';

LogBox.ignoreLogs(['ViewPropTypes will be removed']);

const {width, height} = Dimensions.get('window');

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

  const cropImage = async (uri, cropData) => {
    // In a real implementation, you would use a library like react-native-image-crop-tools
    // to actually crop the image. This is a placeholder for that functionality.
    // For now, we'll just return the original URI since we can't actually crop in this example.
    return uri;

    // The actual implementation would look something like:
    // return await ImageCropper.cropImage(uri, {
    //   ...cropData,
    //   includeBase64: true,
    // });
  };

  const uploadImageStrips = async strips => {
    setUploading(true);
    const urls = [];

    try {
      for (let i = 0; i < strips.length; i++) {
        const strip = strips[i];

        // First crop the strip from the original image
        const croppedUri = await cropImage(strip.uri, strip.crop);

        const fileName = `strip_${i}_${Date.now()}.jpg`;
        const file = {
          uri: croppedUri,
          type: 'image/jpeg',
          name: fileName,
        };

        console.log(`Uploading strip ${i + 1}/${strips.length}...`);
        const uploadResult = await UploadFileToCloud({file, fileName});

        console.log('API Response:', uploadResult);

        if (uploadResult.success) {
          urls.push(uploadResult.url);
          console.log(`Upload successful: ${uploadResult.url}`);
        } else {
          console.warn(`Upload failed for strip ${i + 1}`);
          urls.push(null);
        }
      }

      setUploadedUrls(urls);
      console.log('All strip URLs:', urls);
    } catch (error) {
      console.error('Error uploading strips:', error);
    } finally {
      setUploading(false);
    }
  };

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

        const dimensions = await getImageDimensions(uri);
        setImageDimensions(dimensions);

        const pieces = splitImageIntoPieces(
          uri,
          dimensions.width,
          dimensions.height,
        );
        setImagePieces(pieces);

        // Upload the cropped strips
        await uploadImageStrips(pieces);

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

  const getImageDimensions = uri => {
    return new Promise(resolve => {
      Image.getSize(uri, (width, height) => {
        resolve({width, height});
      });
    });
  };

  const splitImageIntoPieces = (uri, imgWidth, imgHeight) => {
    const pieceWidth = imgWidth / 30;
    const pieces = [];

    for (let i = 0; i < 30; i++) {
      pieces.push({
        uri,
        originalWidth: imgWidth,
        originalHeight: imgHeight,
        width: pieceWidth,
        height: imgHeight,
        crop: {
          x: i * pieceWidth,
          y: 0,
          width: pieceWidth,
          height: imgHeight,
        },
        label: `Strip ${i + 1} (${Math.round(i * 3.33)}%-${Math.round(
          (i + 1) * 3.33,
        )}%)`,
      });
    }

    return pieces;
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
