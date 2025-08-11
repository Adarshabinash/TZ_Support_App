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
  TextInput,
  FlatList,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import DocumentScanner from 'react-native-document-scanner-plugin';
import {
  class5Students,
  class4Students,
  class3Students,
  class2Students,
  class1Students,
} from '../utils/StudentsData';

LogBox.ignoreLogs(['ViewPropTypes will be removed']);
const {width, height} = Dimensions.get('window');

const AndroidDocumentScanner = () => {
  const [imageUri, setImageUri] = useState(null);
  const [detectedText, setDetectedText] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const [studentData, setStudentData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [scanCount, setScanCount] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [currentClass, setCurrentClass] = useState('');
  const [showDataModal, setShowDataModal] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({width: 0, height: 0});
  const [processingIndex, setProcessingIndex] = useState(null);

  // Define the order of class data to display
  const classOrder = [
    {data: class5Students, name: 'Class 5'},
    {data: class4Students, name: 'Class 4'},
    {data: class3Students, name: 'Class 3'},
    {data: class2Students, name: 'Class 2'},
    {data: class1Students, name: 'Class 1'},
  ];

  useEffect(() => {
    checkCameraPermission();
  }, []);

  const checkCameraPermission = async () => {
    try {
      const granted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.CAMERA,
      );
      setHasCameraPermission(granted);
    } catch (err) {
      console.log('Permission check error:', err);
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
      setHasCameraPermission(granted === PermissionsAndroid.RESULTS.GRANTED);
      return granted === PermissionsAndroid.RESULTS.GRANTED;
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

  const getImageDimensions = uri => {
    return new Promise(resolve => {
      Image.getSize(uri, (width, height) => {
        resolve({width, height});
      });
    });
  };

  const loadStudentData = classIndex => {
    setIsLoading(true);
    setStudentData([]);
    setProcessingIndex(classIndex);

    // Show loading for 2 seconds
    setTimeout(() => {
      const {data, name} = classOrder[classIndex];

      // Format the data to match expected structure
      const formattedData = data.map(student => ({
        roll_number: student.roll,
        name: student.studentName,
        class: student.class,
      }));

      setStudentData(formattedData);
      setCurrentClass(name);
      setIsLoading(false);
      setProcessingIndex(null);
      setShowDataModal(true);
    }, 2000);
  };

  const scanDocument = async () => {
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
    try {
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
        await detectTextFromImage(uri);
        // Don't automatically load student data - let user choose class
      }
    } catch (error) {
      console.error('Document scan error:', error);
      Alert.alert('Scanner Error', error.message || 'Failed to scan document.');
    } finally {
      setIsScanning(false);
    }
  };

  const updateStudent = (index, field, value) => {
    const updatedData = [...studentData];
    updatedData[index][field] = value;
    setStudentData(updatedData);
  };

  const renderStudentItem = ({item, index}) => (
    <View style={styles.tableRow}>
      <View style={styles.tableCellFixed}>
        <Text style={styles.cellText}>
          {String(item.roll_number).padStart(2, '0')}
        </Text>
      </View>
      {isEditing ? (
        <TextInput
          style={[styles.tableCellFlex, styles.input]}
          value={item.name}
          onChangeText={text => updateStudent(index, 'name', text)}
        />
      ) : (
        <View style={styles.tableCellFlex}>
          <Text style={styles.cellText}>{item.name}</Text>
        </View>
      )}
      <View style={styles.tableCellFixed}>
        <Text style={styles.cellText}>{item.class}</Text>
      </View>
    </View>
  );

  const handleSubmit = () => {
    console.log('Current student data:', studentData);
    setIsEditing(false);
    Alert.alert('Data Saved', 'Changes have been saved!');
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleRecapture = () => {
    setImageUri(null);
    setDetectedText('');
    setStudentData([]);
    setIsEditing(false);
    setShowDataModal(false);
    setImageDimensions({width: 0, height: 0});
  };

  const handleClassSelect = classIndex => {
    loadStudentData(classIndex);
  };

  return (
    <LinearGradient
      colors={['#007d8dff', '#cec7f1ff', '#336fdfff']}
      style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.header}>Student Data Scanner</Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.button,
              styles.scanButton,
              (isScanning || isLoading) && styles.scanButtonDisabled,
            ]}
            onPress={scanDocument}
            disabled={isScanning || isLoading}>
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
            <Text style={styles.sectionTitle}>Scanned Document:</Text>
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

              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'flex-end',
                  paddingHorizontal: 20,
                  marginTop: 9,
                  width: '100%',
                }}>
                {classOrder.map((classItem, index) => (
                  <TouchableOpacity
                    key={index}
                    style={{
                      width: 30,
                      height: 20,
                      justifyContent: 'flex-end',
                      alignItems: 'center',
                      position: 'relative',
                      borderBottomWidth: 3,
                      borderBottomColor: '#dbdbdbff',
                    }}
                    onPress={() => handleClassSelect(index)}
                    disabled={processingIndex !== null}>
                    {processingIndex === index && (
                      <View
                        style={{
                          position: 'absolute',
                          top: -280,
                          justifyContent: 'center',
                        }}>
                        <ActivityIndicator size={90} color="#666" />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {isLoading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#666" />
                <Text style={styles.loadingText}>Loading student data...</Text>
                <Text style={styles.loadingSubText}>Please wait a moment</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Modal with student data */}
      <Modal
        visible={showDataModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDataModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {currentClass} Students ({studentData.length})
              </Text>
            </View>

            {/* Body */}
            <View style={styles.modalBody}>
              <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                <ScrollView>
                  {/* Header Row */}
                  <View style={[styles.tableRow, styles.headerRow]}>
                    <View style={styles.tableHeaderCellFixed}>
                      <Text style={styles.headerText}>Roll No.</Text>
                    </View>
                    <View style={styles.tableHeaderCellFlex}>
                      <Text style={styles.headerText}>Student Name</Text>
                    </View>
                    <View style={styles.tableHeaderCellFixed}>
                      <Text style={styles.headerText}>Class</Text>
                    </View>
                  </View>

                  {/* Table Body */}
                  <FlatList
                    data={studentData}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={renderStudentItem}
                    scrollEnabled={false}
                  />
                </ScrollView>
              </ScrollView>
            </View>

            {/* Footer Buttons */}
            <View style={styles.modalFooter}>
              {isEditing ? (
                <TouchableOpacity
                  style={[styles.modalButton, styles.submitButton]}
                  onPress={handleSubmit}>
                  <Text style={styles.modalButtonText}>Save Changes</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.modalButton, styles.editButton]}
                  onPress={handleEdit}>
                  <Text style={styles.modalButtonText}>Edit Names</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.modalButton, styles.closeButton]}
                onPress={() => setShowDataModal(false)}>
                <Text style={styles.modalButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
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
  detectedText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#2C3E50',
  },
  actionButtonsGrid: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
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
  actionButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    marginVertical: 20,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 18,
    color: '#555',
    fontWeight: '500',
  },
  loadingSubText: {
    marginTop: 5,
    fontSize: 14,
    color: '#777',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '95%',
    maxHeight: '85%',
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 6,
    elevation: 5,
  },
  modalHeader: {
    backgroundColor: '#4a90e2',
    padding: 15,
  },
  modalTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalBody: {
    padding: 10,
    maxHeight: '75%',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 15,
    backgroundColor: '#f5f5f5',
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 6,
    minWidth: 120,
    alignItems: 'center',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
  },
  editButton: {
    backgroundColor: '#FF9800',
  },
  closeButton: {
    backgroundColor: '#607D8B',
  },
  modalButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  // Table styles
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  headerRow: {
    backgroundColor: '#f2f2f2',
    borderBottomWidth: 2,
    borderBottomColor: '#ccc',
  },
  tableHeaderCellFixed: {
    width: 80,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e6e6e6',
    paddingHorizontal: 4,
  },
  tableHeaderCellFlex: {
    width: 200,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e6e6e6',
    paddingHorizontal: 4,
  },
  tableCellFixed: {
    width: 80,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  tableCellFlex: {
    width: 200,
    height: 40,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  headerText: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  cellText: {
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 8,
    backgroundColor: 'white',
  },
  evenRow: {
    backgroundColor: '#fff',
  },
  oddRow: {
    backgroundColor: '#f9f9f9',
  },
});

export default AndroidDocumentScanner;
