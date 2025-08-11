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
  Modal,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import DocumentScanner from 'react-native-document-scanner-plugin';
import demo3 from '../components/demo3.json';
import demo1 from '../components/demo1.json';
import demo2 from '../components/demo2.json';

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
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [activeData, setActiveData] = useState(null); // <- NEW STATE
  const [processingIndex, setProcessingIndex] = useState(null);

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
      const {scannedImages} = await DocumentScanner.scanDocument({
        responseType: 'uri',
        quality: 1.0,
        letUserAdjustCrop: true,
        maxNumDocuments: 1,
      });

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
      }
    } catch (error) {
      console.error('Document scan error:', error);
      Alert.alert('Scanner Error', error.message || 'Failed to scan document.');
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
      const percentageStart = Math.round((i / 30) * 100);
      const percentageEnd = Math.round(((i + 1) / 30) * 100);

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
        label: `Strip ${i + 1} (${percentageStart}%-${percentageEnd}%)`,
      });
    }

    return pieces;
  };

  const handlePiecePress = index => {
    setSelectedPiece(selectedPiece === index ? null : index);
  };

  const handleRecapture = () => {
    setImageUri(null);
    setImagePieces([]);
    setDetectedText('');
    setSelectedPiece(null);
    setActiveData(null);
    setProcessingIndex(null);
    setShowSuccessModal(false);
    setImageDimensions({width: 0, height: 0});
    setShowSuccessModal(false);
  };

  const handleConfirm = (dataSource, index) => {
    setProcessingIndex(index); // track the clicked button
    setActiveData(null);

    setTimeout(() => {
      setProcessingIndex(null); // stop loader
      setActiveData(dataSource);
      setShowSuccessModal(true);
    }, 15000); // 15 seconds
  };

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
  };

  const symbolMap = {
    star: '⭐',
    plus: '➕',
    triangle: '🔺',
  };

  return (
    <LinearGradient colors={['#e0f7fa', '#ffffff']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.header}>Sikhyana sopana symbol Detector</Text>

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

            <View style={styles.actionButtonsGrid}>
              <TouchableOpacity
                style={[styles.actionButton, styles.recaptureButton]}
                onPress={handleRecapture}>
                <Text style={styles.actionButtonText}>Retake</Text>
              </TouchableOpacity>

              <View style={styles.numberButtonsRow}>
                {[demo1, demo2, demo3].map((demo, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.smallButton}
                    onPress={() => handleConfirm(demo, index)}
                    disabled={processingIndex !== null}>
                    {processingIndex === index ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.actionButtonText}>{index + 1}</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Modal with selected data */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={closeSuccessModal}>
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 10,
          }}>
          <View
            style={{
              width: '95%',
              maxHeight: '85%',
              backgroundColor: '#fff',
              borderRadius: 12,
              overflow: 'hidden',
              shadowColor: '#000',
              shadowOpacity: 0.2,
              shadowOffset: {width: 0, height: 2},
              shadowRadius: 6,
              elevation: 5,
            }}>
            {/* Header */}
            <View
              style={{
                paddingVertical: 16,
                paddingHorizontal: 16,
                backgroundColor: '#4a90e2',
              }}>
              <Text
                style={{
                  color: '#fff',
                  fontSize: 18,
                  fontWeight: 'bold',
                  textAlign: 'center',
                }}>
                Scan Results
              </Text>
            </View>

            {/* Body */}
            <View
              style={{
                padding: 10,
                maxHeight: '75%',
              }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                <ScrollView>
                  {/* Header Row */}
                  {/* Table Header */}
                  <View
                    style={{flexDirection: 'row', backgroundColor: '#f5f5f5'}}>
                    <View style={styles.tableHeaderCellFixed}>
                      <Text style={styles.headerText}>Sl. No.</Text>
                    </View>
                    <View style={[styles.tableHeaderCellFixed, {width: 140}]}>
                      <Text style={[styles.headerText, {width: 140}]}>
                        Skill
                      </Text>
                    </View>
                    {Array.from({length: 30}).map((_, i) => (
                      <View key={`header-${i}`} style={styles.tableHeaderCell}>
                        <Text style={styles.headerText}>{i + 1}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Table Body */}
                  {activeData?.result
                    ?.flatMap(category => category.output)
                    ?.map((skillRow, rowIndex) => (
                      <View
                        key={`row-${rowIndex}`}
                        style={[
                          styles.tableRow,
                          rowIndex % 2 === 0 ? styles.evenRow : styles.oddRow,
                        ]}>
                        <View style={styles.tableCellFixed}>
                          <Text style={styles.cellText}>{rowIndex + 1}</Text>
                        </View>
                        <View style={[styles.tableCellFixed, {width: 140}]}>
                          <Text
                            numberOfLines={2}
                            ellipsizeMode="tail"
                            style={styles.cellText}>
                            {skillRow.skill || `Skill ${rowIndex + 1}`}
                          </Text>
                        </View>
                        {skillRow.roll.map(([index, value], colIndex) => (
                          <View
                            key={`cell-${rowIndex}-${colIndex}`}
                            style={styles.tableCell}>
                            <Text style={styles.cellText}>
                              {symbolMap[value]}
                            </Text>
                          </View>
                        ))}
                      </View>
                    ))}
                </ScrollView>
              </ScrollView>
            </View>

            {/* Footer Button */}
            <TouchableOpacity
              style={{
                padding: 14,
                backgroundColor: '#4a90e2',
                alignItems: 'center',
              }}
              onPress={closeSuccessModal}
              activeOpacity={0.7}>
              <Text
                style={{
                  color: '#fff',
                  fontWeight: 'bold',
                  fontSize: 16,
                }}>
                OK
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    marginRight: 5,
    alignItems: 'center',
  },
  pieceImageWrapper: {
    overflow: 'hidden',
    borderRadius: 2,
  },
  pieceImage: {
    position: 'absolute',
  },
  pieceLabel: {
    fontSize: 8,
    color: '#555',
    textAlign: 'center',
    marginTop: 3,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 15,
    gap: 10, // Optional spacing between buttons if supported
  },
  actionButton: {
    backgroundColor: '#00BCD4',
    paddingVertical: 12,
    borderRadius: 8,
    width: '30%',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    height: '80%', // Increased modal height
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalHeader: {
    backgroundColor: '#00BCD4',
    padding: 15,
  },
  modalTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalBody: {
    padding: 20,
    alignItems: 'center',
    flex: 1, 
  },
  successIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4CD964',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  successIconText: {
    color: 'white',
    fontSize: 30,
    fontWeight: 'bold',
  },
  modalText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#333',
    lineHeight: 22,
  },
  modalButton: {
    backgroundColor: '#00BCD4',
    padding: 15,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tableContainer: {
    flex: 1, // Takes all available space in modal body
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
  },
  horizontalScroll: {
    flexDirection: 'row',
  },
  tableWrapper: {
    flex: 1,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 40, // Minimum row height
  },
  headerRow: {
    backgroundColor: '#f2f2f2',
  },
  tableHeaderCell: {
    width: 50,
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e6e6e6',
  },
  tableCell: {
    width: 50,
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  firstColumn: {
    backgroundColor: '#d9edf7',
  },
  headerText: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  cellText: {
    textAlign: 'center',
  },
  evenRow: {
    backgroundColor: '#fff',
  },
  oddRow: {
    backgroundColor: '#f9f9f9',
  },
  modalButton: {
    backgroundColor: '#00BCD4',
    padding: 15,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionButtonsGrid: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  numberButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  smallButton: {
    backgroundColor: '#00BCD4',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  tableHeaderCellFixed: {
    width: 100,
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e6e6e6',
  },
  tableCellFixed: {
    width: 100,
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
});

export default AndroidDocumentScanner;
