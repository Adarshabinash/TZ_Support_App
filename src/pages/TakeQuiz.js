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
  ActivityIndicator,
  LogBox,
  TextInput,
  FlatList,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import DocumentScanner from 'react-native-document-scanner-plugin';

LogBox.ignoreLogs(['ViewPropTypes will be removed']);

const studentJson = [
  {name: 'ଆଶିଷ କୁମାର', roll_number: 1, class: '6'},
  {name: 'ସୁମିତା ପଟ୍ଟନାୟକ', roll_number: 2, class: '6'},
  {name: 'ଦେବାଶିଷ ଦାଶ', roll_number: 3, class: '6'},
  {name: 'ସ୍ମିତି ରାଣୀ', roll_number: 4, class: '6'},
  {name: 'ଅନୁଜ କୁମାର', roll_number: 5, class: '6'},
  {name: 'ମନୋଜିତ ସାହୁ', roll_number: 6, class: '6'},
  {name: 'ସୋନାଲି ପଣ୍ଡା', roll_number: 7, class: '6'},
  {name: 'ରମେଶ ମହାନ୍ତି', roll_number: 8, class: '6'},
  {name: 'ପ୍ରିୟଦର୍ଶିନୀ ସେନାପତି', roll_number: 9, class: '6'},
  {name: 'ବିବେକାନନ୍ଦ ସାହୁ', roll_number: 10, class: '6'},
  {name: 'ଚନ୍ଦନ କୁମାର', roll_number: 11, class: '6'},
  {name: 'ସୁଧାଂଶୁ ପଣ୍ଡା', roll_number: 12, class: '6'},
  {name: 'ଅନନ୍ୟା ପଟ୍ଟନାୟକ', roll_number: 13, class: '6'},
  {name: 'ପ୍ରତ୍ୟୁଷ ସାହୁ', roll_number: 14, class: '6'},
  {name: 'ମମତା ଦାଶ', roll_number: 15, class: '6'},
  {name: 'ରୋହିତ କୁମାର', roll_number: 16, class: '6'},
  {name: 'ସନ୍ଧ୍ୟା ମହାନ୍ତି', roll_number: 17, class: '6'},
  {name: 'ଜଗନ୍ନାଥ ସେନାପତି', roll_number: 18, class: '6'},
  {name: 'କବିତା ପଟ୍ଟନାୟକ', roll_number: 19, class: '6'},
  {name: 'ସତ୍ୟଜିତ ପଣ୍ଡା', roll_number: 20, class: '6'},
  {name: 'ଦୀପାଳି ପଟ୍ଟନାୟକ', roll_number: 21, class: '6'},
  {name: 'ଶିବାନନ୍ଦ ସାହୁ', roll_number: 22, class: '6'},
  {name: 'ସୁପ୍ରିୟା ସେନାପତି', roll_number: 23, class: '6'},
  {name: 'ତାପସ କୁମାର', roll_number: 24, class: '6'},
  {name: 'ପ୍ରିୟଙ୍କା ପଣ୍ଡା', roll_number: 25, class: '6'},
  {name: 'ବିଶ୍ୱଜିତ ସାହୁ', roll_number: 26, class: '6'},
  {name: 'କାଜଲି ଦାଶ', roll_number: 27, class: '6'},
  {name: 'ଗୋପୀନାଥ ମହାନ୍ତି', roll_number: 28, class: '6'},
  {name: 'ସୁନୀତା ପଟ୍ଟନାୟକ', roll_number: 29, class: '6'},
  {name: 'ରାଜେଶ କୁମାର', roll_number: 30, class: '6'},
  {name: 'ସମୀରାଣୀ ସାହୁ', roll_number: 31, class: '6'},
  {name: 'ବିକାଶ ମହାନ୍ତି', roll_number: 32, class: '6'},
  {name: 'ଯଶୋଦା ପଣ୍ଡା', roll_number: 33, class: '6'},
  {name: 'ସାରଥୀ ସାହୁ', roll_number: 34, class: '6'},
  {name: 'ଲିପିକା ପଟ୍ଟନାୟକ', roll_number: 35, class: '6'},
  {name: 'ବିନୋଦ କୁମାର', roll_number: 36, class: '6'},
  {name: 'ଅନୁପମା ସେନାପତି', roll_number: 37, class: '6'},
  {name: 'ସୁଭଦ୍ରା ପଟ୍ଟନାୟକ', roll_number: 38, class: '6'},
  {name: 'ସଚିନ କୁମାର', roll_number: 39, class: '6'},
  {name: 'ପୂଜା ପଣ୍ଡା', roll_number: 40, class: '6'},
];

const AndroidDocumentScanner = () => {
  const [imageUri, setImageUri] = useState(null);
  const [detectedText, setDetectedText] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const [studentData, setStudentData] = useState(studentJson);
  const [isSubmitted, setIsSubmitted] = useState(false); // Fixed state name
  const [hasScanned, setHasScanned] = useState(false);

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
      setHasScanned(true);
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
        await detectTextFromImage(uri);
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
      {isSubmitted ? (
        <Text style={[styles.inputRoll, styles.readOnlyText]}>
          {String(item.roll_number).padStart(2, '0')}
        </Text>
      ) : (
        <TextInput
          style={styles.inputRoll}
          value={String(item.roll_number)}
          keyboardType="numeric"
          maxLength={2}
          onChangeText={text => updateStudent(index, 'roll_number', text)}
        />
      )}
      {isSubmitted ? (
        <Text style={[styles.input, styles.readOnlyText]}>{item.name}</Text>
      ) : (
        <TextInput
          style={styles.input}
          value={item.name}
          onChangeText={text => updateStudent(index, 'name', text)}
        />
      )}
      {isSubmitted ? (
        <Text style={[styles.inputRoll, styles.readOnlyText]}>
          {item.class}
        </Text>
      ) : (
        <TextInput
          style={styles.inputRoll}
          value={item.class}
          onChangeText={text => updateStudent(index, 'class', text)}
        />
      )}
    </View>
  );

  const handleSubmit = () => {
    console.log('Submitted student data:', studentData);
    setIsSubmitted(true);
    Alert.alert('Data Submitted', 'Student data has been saved successfully!', [
      {text: 'OK'},
    ]);
  };

  const handleEdit = () => {
    setIsSubmitted(false);
  };

  return (
    <LinearGradient colors={['#e0f7fa', '#ffffff']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.header}>Document Scanner + Student List</Text>

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

        {hasScanned && imageUri && (
          <View style={styles.resultContainer}>
            <Text style={styles.sectionTitle}>Scanned Document:</Text>
            <Image
              source={{uri: imageUri}}
              style={styles.scannedImage}
              resizeMode="contain"
            />
            <Text style={styles.sectionTitle}>Detected Text:</Text>
            <ScrollView style={styles.textScrollContainer}>
              <Text style={styles.detectedText}>{detectedText}</Text>
            </ScrollView>
          </View>
        )}

        {hasScanned && (
          <>
            <Text style={styles.sectionTitle}>Student List</Text>

            <View style={[styles.studentRow, styles.headerRow]}>
              <Text style={styles.headerText}>Roll No.</Text>
              <Text style={styles.headerText}>Name</Text>
              <Text style={styles.headerText}>Class</Text>
            </View>

            <FlatList
              data={studentData}
              renderItem={renderStudentItem}
              keyExtractor={(item, index) => index.toString()}
            />

            {!isSubmitted ? (
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.submitButton]}
                  onPress={handleSubmit}>
                  <Text style={styles.buttonText}>Submit Student Data</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.editButton]}
                  onPress={handleEdit}>
                  <Text style={styles.buttonText}>Edit Student Data</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1},
  scrollContent: {padding: 20, paddingBottom: 40},
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
    color: '#333',
  },
  buttonContainer: {width: '100%', marginBottom: 20},
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 3,
    marginVertical: 5,
  },
  scanButton: {backgroundColor: '#00BCD4'},
  scanButtonDisabled: {backgroundColor: '#B2EBF2'},
  submitButton: {backgroundColor: '#4CAF50'},
  editButton: {backgroundColor: '#FF9800'},
  buttonText: {color: 'white', fontWeight: '600', fontSize: 16},
  resultContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    elevation: 2,
  },
  scannedImage: {width: '100%', height: 300, borderRadius: 8, marginBottom: 15},
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#444',
  },
  textScrollContainer: {maxHeight: 150},
  detectedText: {fontSize: 14, color: '#555'},
  studentRow: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 8,
    marginHorizontal: 5,
    fontSize: 14,
    backgroundColor: 'white',
  },
  inputRoll: {
    width: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 8,
    marginHorizontal: 5,
    fontSize: 14,
    textAlign: 'center',
    backgroundColor: 'white',
  },
  readOnlyText: {
    color: '#333',
    paddingVertical: 8,
    backgroundColor: '#f9f9f9',
  },
  headerRow: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    borderRadius: 6,
    marginBottom: 5,
  },
  headerText: {
    flex: 1,
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
    marginHorizontal: 5,
    color: '#333',
  },
});

export default AndroidDocumentScanner;
