import React, {useState, useRef, useCallback, useEffect} from 'react';
import {database} from '../databse';
import {
  View,
  Text,
  Alert,
  ScrollView,
  Pressable,
  PermissionsAndroid,
  Platform,
  Image,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
} from 'react-native';

import BottomSheet from '../components/BottomSheet';
import Feather from 'react-native-vector-icons/Feather';
import Geolocation from '@react-native-community/geolocation';
import ImagePicker from 'react-native-image-crop-picker';
import {getDistrictAndBlock} from '../utils/locationHelper';
import * as window from '../utils/Dimensions';
import axios from 'axios';

const sampleQuestions = [
  {questionId: 'q1', questionName: 'Is React Native cross-platform?'},
  {questionId: 'q2', questionName: 'Does React Native use JavaScript?'},
  {questionId: 'q3', questionName: 'Can React Native build iOS apps?'},
];

const GpsMap = () => {
  const modalRef = useRef(null);
  const modalHeight = window.WindowHeigth * 0.3;
  const [answers, setAnswers] = useState({});
  const [imageInfo, setImageInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const scheme = useColorScheme();

    const [savedSurveys, setSavedSurveys] = useState([]);
  console.log('savedSurveys------->', savedSurveys);
  const fetchSavedSurveys = async () => {
    try {
      const surveysCollection = database.get('surveys');
      const surveys = await surveysCollection.query().fetch();
      console.log('surveys', surveys);

      setSavedSurveys(surveys);
    } catch (error) {
      console.error('📛 Error loading saved surveys:', error);
    }
  };

  useEffect(() => {
    fetchSavedSurveys();
  }, []);

  const isDarkMode = scheme === 'dark';

  const colors = {
    background: isDarkMode ? '#282828' : '#f4f6f8',
    card: isDarkMode ? '#1e1e1e' : '#ffffff',
    text: isDarkMode ? '#ffffff' : '#2c3e50',
    subText: isDarkMode ? '#cccccc' : '#34495e',
    buttonBg: isDarkMode ? '#3498db' : '#2980b9',
    imageButtonBg: isDarkMode ? '#2ecc71' : '#27ae60',
  };

  const handleCheckbox = (qid, value) => {
    setAnswers(prev => ({
      ...prev,
      [qid]: value,
    }));
  };

  const requestLocationPermission = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'This app needs access to your location.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
      return true;
    } catch (err) {
      console.warn('Permission error:', err);
      return false;
    }
  };

  const tryGetLocation = (options, fallback = null) => {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        position => resolve(position),
        error => {
          console.warn('❌ Location error:', error);
          if (fallback) {
            fallback().then(resolve).catch(reject);
          } else {
            reject(error);
          }
        },
        options,
      );
    });
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length !== sampleQuestions.length) {
      Alert.alert('Incomplete', 'Please answer all questions.');
      return;
    }

    if (!imageInfo) {
      Alert.alert('Missing Image', 'Please capture or select an image.');
      return;
    }

    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Location permission is required.');
      return;
    }

    try {
      const position = await tryGetLocation(
        {
          enableHighAccuracy: false,
          timeout: 5000,
          maximumAge: 60000,
        },
        () =>
          tryGetLocation({
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 10000,
          }),
      );

      const {latitude, longitude} = position.coords;
      const {district, block, cluster} = await getDistrictAndBlock(
        latitude,
        longitude,
      );

      const finalData = {
        teacherId: 'teacher_123',
        teacherName: 'John Doe',
        questions: sampleQuestions.map(q => ({
          questionId: q.questionId,
          questionName: q.questionName,
          answer: answers[q.questionId] ?? null,
        })),
        geolocation: {
          coordinates: [latitude, longitude],
          area: `${district}, ${block}, ${cluster}`,
          district,
          block,
          cluster,
        },
      };

      const surveyCollection = database.get('surveys');

      const result = await database.write(async () => {
        const row = await surveyCollection.create(survey => {
          survey.name = 'New Baseline Survey';
          survey.status = 'draft';
        });
        return row;
      });

      console.log('Created survey:', result);
      Alert.alert('Survey Created');

      Alert.alert('Success', 'Quiz submitted with location!');
    } catch (err) {
      console.error('Location fetch failed:', err);
      Alert.alert('Location Error', err.message || 'Could not fetch location');
    }
  };

  const handleOpenBottomSheet = useCallback(() => {
    modalRef.current?.open();
  }, []);

  const handleSelection = async flag => {
    modalRef.current?.close();
    setLoading(true);

    try {
      if (flag === 'camera') {
        const cameraPermission = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'App needs access to your camera.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );

        if (cameraPermission !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Permission Denied', 'Camera permission not granted');
          setLoading(false);
          return;
        }
      }

      const image =
        flag === 'camera'
          ? await ImagePicker.openCamera({
              width: 300,
              height: 400,
              cropping: true,
              includeBase64: false,
            })
          : await ImagePicker.openPicker({
              width: 300,
              height: 400,
              cropping: true,
              includeBase64: false,
            });

      if (!image) {
        setLoading(false);
        return;
      }

      const location = await tryGetLocation(
        {
          enableHighAccuracy: false,
          timeout: 5000,
          maximumAge: 60000,
        },
        () =>
          tryGetLocation({
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 10000,
          }),
      );

      const {latitude, longitude} = location.coords;
      const {district, block, cluster} = await getDistrictAndBlock(
        latitude,
        longitude,
      );

      setImageInfo({
        uri: image.path,
        latitude,
        longitude,
        district,
        block,
        cluster,
      });
    } catch (error) {
      console.error('Image/Location Error:', error);
      Alert.alert('Error', 'Something went wrong while capturing image.');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid =
    Object.keys(answers).length === sampleQuestions.length && imageInfo;

  return (
    <View style={{flex: 1}}>
      <SafeAreaView style={{flex: 1, backgroundColor: '#F4F6F8'}}>
        <StatusBar barStyle="dark-content" backgroundColor="#F4F6F8" />

        <BottomSheet modalRef={modalRef} modalHeight={modalHeight}>
          <View style={styles.modalContainer}>
            <TouchableOpacity
              onPress={() => handleSelection('camera')}
              style={styles.modalButtonContainer}>
              <Feather name="camera" size={30} color="#2980b9" />
              <Text style={styles.modalButtonText}>Take Picture</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleSelection('gallery')}
              style={styles.modalButtonContainer}>
              <Feather name="file" size={30} color="#16a085" />
              <Text style={styles.modalButtonText}>Choose from Gallery</Text>
            </TouchableOpacity>
          </View>
        </BottomSheet>

        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.headerText}>👋 Welcome, John Doe</Text>
          <Text style={styles.subTitle}>
            Please answer the quiz and capture your location.
          </Text>

          {sampleQuestions.map((q, index) => (
            <View key={q.questionId} style={styles.questionCard}>
              <Text style={styles.questionText}>
                {index + 1}. {q.questionName}
              </Text>
              <View style={styles.optionsContainer}>
                <Pressable
                  style={[
                    styles.checkbox,
                    answers[q.questionId] === true && styles.selectedYes,
                  ]}
                  onPress={() => handleCheckbox(q.questionId, true)}>
                  <Text style={styles.checkboxText}>Yes</Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.checkbox,
                    answers[q.questionId] === false && styles.selectedNo,
                  ]}
                  onPress={() => handleCheckbox(q.questionId, false)}>
                  <Text style={styles.checkboxText}>No</Text>
                </Pressable>
              </View>
            </View>
          ))}

          <Pressable style={styles.imageButton} onPress={handleOpenBottomSheet}>
            <Text style={styles.submitButtonText}>
              📷 Capture or Select Image
            </Text>
          </Pressable>

          {imageInfo && (
            <View style={styles.imageContainer}>
              <Image
                source={{uri: imageInfo.uri}}
                style={styles.previewImage}
              />
              <View style={styles.imageMeta}>
                <Text style={styles.metaText}>
                  📍 Lat: {imageInfo.latitude}
                </Text>
                <Text style={styles.metaText}>
                  📍 Long: {imageInfo.longitude}
                </Text>
                <Text style={styles.metaText}>
                  🗺 Location: {imageInfo.district}, {imageInfo.block},{' '}
                  {imageInfo.cluster}
                </Text>
              </View>
            </View>
          )}

          <Pressable
            style={[
              styles.submitButton,
              {backgroundColor: isFormValid ? '#2980b9' : '#bdc3c7'},
            ]}
            onPress={handleSubmit}
            disabled={!isFormValid}>
            <Text style={styles.submitButtonText}>📤 Submit Quiz</Text>
          </Pressable>
        </ScrollView>

        {loading && (
          <View style={styles.loaderOverlay}>
            <ActivityIndicator size="large" color="#ffffff" />
            <Text style={styles.loadingText}>Processing...</Text>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
};

export default GpsMap;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 20,
    backgroundColor: '#f4f6f8',
  },
  headerText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#34495e',
    marginBottom: 10,
    textAlign: 'center',
  },
  subTitle: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalContainer: {
    height: window.WindowHeigth * 0.3,
    backgroundColor: '#ffffff',
    elevation: 5,
    flex: 1,
    justifyContent: 'space-evenly',
    alignItems: 'center',
    flexDirection: 'row',
  },
  modalButtonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 60,
  },
  modalButtonText: {
    fontSize: 13,
    color: '#000000',
    marginTop: 5,
  },
  questionCard: {
    backgroundColor: '#ffffff',
    borderLeftWidth: 5,
    borderLeftColor: '#2980b9',
    padding: 20,
    marginBottom: 15,
    borderRadius: 12,
    elevation: 3,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#34495e',
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  checkbox: {
    borderWidth: 2,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 25,
    backgroundColor: '#ecf0f1',
    marginHorizontal: 10,
  },
  selectedYes: {
    backgroundColor: '#2ecc71',
    borderColor: '#27ae60',
  },
  selectedNo: {
    backgroundColor: '#e74c3c',
    borderColor: '#c0392b',
  },
  checkboxText: {
    color: '#fff',
    fontWeight: '600',
  },
  submitButton: {
    borderRadius: 10,
    paddingVertical: 15,
    marginTop: 20,
    alignItems: 'center',
  },
  imageButton: {
    backgroundColor: '#27ae60',
    borderRadius: 10,
    paddingVertical: 15,
    marginTop: 10,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  imageContainer: {
    marginTop: 20,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 15,
    elevation: 4,
    alignItems: 'center',
  },
  previewImage: {
    width: 300,
    height: 200,
    borderRadius: 10,
  },
  imageMeta: {
    marginTop: 10,
  },
  metaText: {
    fontSize: 14,
    color: '#2c3e50',
  },
  loaderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  loadingText: {
    fontSize: 16,
    color: '#ffffff',
    marginTop: 10,
    fontWeight: '600',
  },
});
