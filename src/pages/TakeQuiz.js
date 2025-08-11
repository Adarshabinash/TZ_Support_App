import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  PermissionsAndroid,
  ActivityIndicator,
  LogBox,
  TextInput,
  FlatList,
  ScrollView,
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

  const loadStudentData = () => {
    setIsLoading(true);
    setStudentData([]);

    // Show loading for 10 seconds
    setTimeout(() => {
      const currentClassIndex = scanCount % classOrder.length;
      const {data, name} = classOrder[currentClassIndex];

      // Format the data to match expected structure
      const formattedData = data.map(student => ({
        roll_number: student.roll,
        name: student.studentName,
        class: student.class,
      }));

      setStudentData(formattedData);
      setCurrentClass(name);
      setIsLoading(false);
      setScanCount(prev => prev + 1);
    }, 10000);
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
        await detectTextFromImage(uri);
        loadStudentData();
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
    <View style={styles.studentRow}>
      <Text style={[styles.inputRoll, !isEditing && styles.readOnlyText]}>
        {String(item.roll_number).padStart(2, '0')}
      </Text>

      {isEditing ? (
        <TextInput
          style={styles.input}
          value={item.name}
          onChangeText={text => updateStudent(index, 'name', text)}
        />
      ) : (
        <Text style={[styles.input, styles.readOnlyText]}>{item.name}</Text>
      )}

      <Text style={[styles.inputRoll, !isEditing && styles.readOnlyText]}>
        {item.class}
      </Text>
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

  const handleReset = () => {
    setImageUri(null);
    setDetectedText('');
    setStudentData([]);
    setIsEditing(false);
  };

  return (
    <LinearGradient colors={['#e0f7fa', '#ffffff']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.header}>Document Scanner + Student List</Text>

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

        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#00BCD4" />
            <Text style={styles.loadingText}>Loading student data...</Text>
            <Text style={styles.loadingSubText}>Please wait 10 seconds</Text>
          </View>
        )}

        {imageUri && (
          <View style={styles.resultContainer}>
            <Text style={styles.sectionTitle}>Scanned Document:</Text>
            <Image
              source={{uri: imageUri}}
              style={styles.scannedImage}
              resizeMode="contain"
            />
            <Text style={styles.sectionTitle}>Detected Text:</Text>
            <Text style={styles.detectedText}>{detectedText}</Text>
          </View>
        )}

        {studentData.length > 0 && (
          <>
            <Text style={styles.classHeader}>{currentClass} Students</Text>
            <View style={[styles.studentRow, styles.headerRow]}>
              <Text style={styles.headerText}>Roll</Text>
              <Text style={styles.headerText}>Name</Text>
              <Text style={styles.headerText}>Class</Text>
            </View>

            <FlatList
              data={studentData}
              keyExtractor={(item, index) => index.toString()}
              renderItem={renderStudentItem}
              scrollEnabled={false}
              style={styles.studentList}
            />
          </>
        )}

        {studentData.length > 0 && (
          <View style={styles.buttonContainer}>
            {isEditing ? (
              <TouchableOpacity
                style={[styles.button, styles.submitButton]}
                onPress={handleSubmit}>
                <Text style={styles.buttonText}>Save Changes</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.button, styles.editButton]}
                onPress={handleEdit}>
                <Text style={styles.buttonText}>Edit Student Names</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.button, styles.resetButton]}
              onPress={handleReset}>
              <Text style={styles.buttonText}>Reset Scanner</Text>
            </TouchableOpacity>
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
  scrollContainer: {
    paddingBottom: 30,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
    color: '#333',
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 10,
    marginHorizontal: 20,
    elevation: 3,
  },
  scanButton: {
    backgroundColor: '#00BCD4',
  },
  scanButtonDisabled: {
    backgroundColor: '#B2EBF2',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
  },
  editButton: {
    backgroundColor: '#FF9800',
  },
  resetButton: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  buttonContainer: {
    marginTop: 20,
  },
  resultContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    margin: 20,
    marginBottom: 20,
    elevation: 2,
  },
  scannedImage: {
    width: '100%',
    height: 250,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#444',
  },
  detectedText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  studentRow: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  studentList: {
    marginHorizontal: 15,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
    marginHorizontal: 5,
    fontSize: 14,
    backgroundColor: 'white',
    elevation: 1,
  },
  inputRoll: {
    width: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
    marginHorizontal: 5,
    fontSize: 14,
    textAlign: 'center',
    backgroundColor: 'white',
    elevation: 1,
  },
  readOnlyText: {
    color: '#333',
    paddingVertical: 8,
    backgroundColor: 'transparent',
    borderWidth: 0,
    elevation: 0,
  },
  headerRow: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    borderRadius: 6,
    marginBottom: 10,
    marginTop: 15,
    marginHorizontal: 15,
  },
  headerText: {
    flex: 1,
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
    marginHorizontal: 5,
    color: '#333',
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
  classHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginLeft: 20,
    marginBottom: 10,
  },
});

export default AndroidDocumentScanner;
