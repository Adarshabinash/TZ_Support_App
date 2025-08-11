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
import demo1 from '../utils/demo1.json';
import demo2 from '../utils/demo2.json';
import demo3 from '../utils/demo3.json';

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
  const [activeData, setActiveData] = useState(null);
  const [processingIndex, setProcessingIndex] = useState(null);
  const [editOptionsVisible, setEditOptionsVisible] = useState(false);
  const [editTarget, setEditTarget] = useState(null);

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
    setProcessingIndex(index);
    setActiveData(null);

    setTimeout(() => {
      setProcessingIndex(null);
      setActiveData(dataSource);
      setShowSuccessModal(true);
    }, 150);
  };

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
  };

  const symbolMap = {
    star: '⭐',
    plus: '➕',
    triangle: '🔺',
  };

  const getOtherSymbols = currentSymbol => {
    const allSymbols = ['star', 'plus', 'triangle'];
    return allSymbols.filter(sym => sym !== currentSymbol);
  };

  const onCellPress = (rowIndex, colIndex, value) => {
    setEditTarget({rowIndex, colIndex, oldValue: value});
    setEditOptionsVisible(true);
  };

  const confirmChange = newValue => {
    if (!editTarget) return;
    const oldSym = symbolMap[editTarget.oldValue] || editTarget.oldValue;
    const newSym = symbolMap[newValue] || newValue;

    Alert.alert(
      'Confirm change',
      `Change ${oldSym} to ${newSym}?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Yes',
          onPress: () => applyChange(newValue),
        },
      ],
      {cancelable: true},
    );
  };

  const applyChange = newValue => {
    if (!activeData || !editTarget) {
      setEditOptionsVisible(false);
      setEditTarget(null);
      return;
    }

    try {
      const updated = JSON.parse(JSON.stringify(activeData));
      let counter = 0;
      let modified = false;

      for (let catIdx = 0; catIdx < (updated.result || []).length; catIdx++) {
        const category = updated.result[catIdx];
        if (!category || !Array.isArray(category.output)) continue;

        for (let outIdx = 0; outIdx < category.output.length; outIdx++) {
          if (counter === editTarget.rowIndex) {
            const row = category.output[outIdx];
            if (Array.isArray(row.roll) && row.roll[editTarget.colIndex]) {
              row.roll[editTarget.colIndex][1] = newValue;
              modified = true;
            } else {
              console.warn(
                'applyChange: target column not present in row.roll, skipping',
              );
            }
            break;
          }
          counter++;
        }
        if (modified) break;
      }

      if (modified) {
        setActiveData(updated);
      } else {
        Alert.alert(
          'Update failed',
          'Could not locate target cell to update. No changes were made.',
        );
      }
    } catch (err) {
      console.error('applyChange error:', err);
      Alert.alert('Error', 'Failed to apply change.');
    } finally {
      setEditOptionsVisible(false);
      setEditTarget(null);
    }
  };

  return (
    <LinearGradient
      colors={['#007d8dff', '#cec7f1ff', '#336fdfff']}
      style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.header}>Sikhyana Sopana symbol Detector</Text>

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
            <View style={styles.imageContainer}>
              <Image
                source={{uri: imageUri}}
                style={[
                  styles.scannedImage,
                  {aspectRatio: imageDimensions.width / imageDimensions.height},
                ]}
                resizeMode="contain"
              />
              {processingIndex !== null && (
                <View style={styles.loaderOverlay}>
                  <ActivityIndicator size={90} color="#666" />
                </View>
              )}
            </View>

            <View style={styles.actionButtonsGrid}>
              <TouchableOpacity
                style={[styles.actionButton, styles.recaptureButton]}
                onPress={handleRecapture}>
                <Text style={styles.actionButtonText}>Retake</Text>
              </TouchableOpacity>

              <View style={styles.demoButtonsContainer}>
                {[demo1, demo2, demo3, demo1, demo2, demo3, demo1, demo2].map(
                  (demo, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.demoButton}
                      onPress={() => handleConfirm(demo, index)}
                      disabled={processingIndex !== null}></TouchableOpacity>
                  ),
                )}
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={closeSuccessModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Scan Results</Text>
            </View>

            <View style={styles.modalBody}>
              <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                <ScrollView>
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
                            <TouchableOpacity
                              activeOpacity={0.6}
                              onPress={() =>
                                onCellPress(rowIndex, colIndex, value)
                              }>
                              <Text
                                style={[
                                  styles.cellText,
                                  styles.editableCellText,
                                  {
                                    fontSize:
                                      symbolMap[value] === '🔺' ? 29 : 18,
                                  },
                                ]}>
                                {symbolMap[value] || value}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    ))}
                </ScrollView>
              </ScrollView>
            </View>

            <TouchableOpacity
              style={styles.modalFooter}
              onPress={closeSuccessModal}
              activeOpacity={0.7}>
              <Text style={styles.modalFooterText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={editOptionsVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setEditOptionsVisible(false);
          setEditTarget(null);
        }}>
        <View style={styles.editModalOverlay}>
          <View style={styles.editModalContainer}>
            <Text style={styles.editModalTitle}>Change symbol</Text>

            <View style={styles.editOptionsRow}>
              {editTarget &&
                getOtherSymbols(editTarget.oldValue).map(symbol => (
                  <TouchableOpacity
                    key={symbol}
                    style={styles.editOptionButton}
                    onPress={() => confirmChange(symbol)}>
                    <Text style={styles.editOptionText}>
                      {symbolMap[symbol]}{' '}
                      {symbol.charAt(0).toUpperCase() + symbol.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
            </View>

            <TouchableOpacity
              style={styles.editCancelButton}
              onPress={() => {
                setEditOptionsVisible(false);
                setEditTarget(null);
              }}>
              <Text style={styles.editCancelText}>Cancel</Text>
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
    color: '#e7e8e9ff',
    textAlign: 'center',
    marginVertical: 20,
    top: '30%',
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 20,
    top: '30%',
    paddingBottom: 20,
    borderBottomColor: '#e2e1e1ff',
    borderBottomWidth: 1,
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
  imageContainer: {
    position: 'relative',
  },
  scannedImage: {
    width: '100%',
    maxHeight: 300,
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: '#f5f5f5',
  },
  loaderOverlay: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{translateY: -45}], // Half of loader size (90/2)
    zIndex: 10,
  },
  actionButtonsGrid: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  demoButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    marginTop: 9,
    width: '100%',
  },
  demoButton: {
    width: 30,
    height: 20,
    justifyContent: 'flex-end',
    alignItems: 'center',
    position: 'relative',
    borderBottomWidth: 3,
    borderBottomColor: '#dbdbdbff',
  },
  recaptureButton: {
    backgroundColor: '#FF3A30',
    paddingVertical: 12,
    borderRadius: 8,
    width: '30%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  modalContainer: {
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
  },
  modalHeader: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#4a90e2',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalBody: {
    padding: 10,
    maxHeight: '75%',
  },
  modalFooter: {
    padding: 14,
    backgroundColor: '#4a90e2',
    alignItems: 'center',
  },
  modalFooterText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
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
  tableHeaderCell: {
    width: 50,
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e6e6e6',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 40,
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
  tableCell: {
    width: 50,
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
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
  editableCellText: {
    fontSize: 18,
  },
  editModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  editModalContainer: {
    backgroundColor: '#fff',
    padding: 18,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    minHeight: 160,
    alignItems: 'center',
  },
  editModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  editOptionsRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  editOptionButton: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editOptionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  editCancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 30,
    marginTop: 6,
  },
  editCancelText: {
    fontSize: 16,
    color: '#777',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#34495E',
  },
});

export default AndroidDocumentScanner;
