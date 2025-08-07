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
    const pieceWidth = imgWidth / 6;
    const pieces = [];

    for (let i = 0; i < 6; i++) {
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
        label: `Strip ${i + 1} (${Math.round(i * 16.66)}%-${Math.round(
          (i + 1) * 16.66,
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
      </TouchableOpacity>
    );
  };

  const handleRecapture = () => {
    setImageUri(null);
    setImagePieces([]);
    setDetectedText('');
    setSelectedPiece(null);
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
              isScanning && styles.scanButtonDisabled,
            ]}
            onPress={scanDocument}
            disabled={isScanning}>
            {isScanning ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.buttonText}>
                {imageUri ? 'Scan New Document' : '📷 Scan Document'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

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
              Document Strips (6 Equal Vertical Sections):
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
                onPress={() =>
                  Alert.alert('Success', 'Document scanned successfully!')
                }>
                <Text style={styles.actionButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>

            {/* <View style={styles.textResultContainer}>
              <Text style={styles.sectionTitle}>Extracted Text:</Text>
              <View style={styles.textScrollContainer}>
                <ScrollView
                  style={styles.textScrollView}
                  nestedScrollEnabled={true}>
                  <Text style={styles.detectedText}>
                    {detectedText || 'Processing text...'}
                  </Text>
                </ScrollView>
              </View>
            </View> */}
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
  textResultContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
  },
  textScrollContainer: {
    maxHeight: 200,
  },
  textScrollView: {
    flexGrow: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#34495E',
  },
  detectedText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#2C3E50',
  },
});

export default AndroidDocumentScanner;
