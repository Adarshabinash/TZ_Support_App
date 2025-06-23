import React, {useState, useRef, useCallback} from 'react';
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
  useColorScheme,
} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import BottomSheet from '../utils/BottomSheet';
import Feather from 'react-native-vector-icons/Feather';
import Geolocation from '@react-native-community/geolocation';
import ImagePicker from 'react-native-image-crop-picker';
import {getDistrictAndBlock} from '../utils/locationHalper';
import * as window from '../utils/Dimensions';
import axios from 'axios';

const sampleQuestions = [
  // Classroom Culture – Supportive Learning Environment
  {
    questionId: 'q1',
    questionName: 'Did the teacher treat all students respectfully?',
  },
  {
    questionId: 'q2',
    questionName: 'Did the teacher use positive language with students?',
  },
  {
    questionId: 'q3',
    questionName: 'Did the teacher respond to students’ needs?',
  },
  {
    questionId: 'q4',
    questionName: 'Did the teacher avoid bias and challenge stereotypes?',
  },

  // Positive Behavioral Expectations
  {
    questionId: 'q5',
    questionName:
      'Did the teacher set clear expectations for class activities?',
  },
  {
    questionId: 'q6',
    questionName: 'Did the teacher acknowledge positive student behavior?',
  },
  {
    questionId: 'q7',
    questionName:
      'Did the teacher redirect misbehavior calmly and appropriately?',
  },

  // Instruction – Lesson Facilitation
  {
    questionId: 'q8',
    questionName: 'Did the teacher explain the lesson objectives clearly?',
  },
  {
    questionId: 'q9',
    questionName: 'Did the teacher use multiple ways to present content?',
  },
  {
    questionId: 'q10',
    questionName:
      'Did the teacher relate the lesson to students’ lives or prior knowledge?',
  },
  {
    questionId: 'q11',
    questionName: 'Did the teacher model or demonstrate the task/lesson?',
  },

  // Checks for Understanding
  {
    questionId: 'q12',
    questionName: 'Did the teacher ask questions to check understanding?',
  },
  {
    questionId: 'q13',
    questionName: 'Did the teacher monitor most students during activities?',
  },
  {
    questionId: 'q14',
    questionName: 'Did the teacher adjust teaching based on student responses?',
  },

  // Feedback
  {
    questionId: 'q15',
    questionName: 'Did the teacher give feedback to clarify misunderstandings?',
  },
  {
    questionId: 'q16',
    questionName: 'Did the teacher give feedback to help students improve?',
  },

  // Critical Thinking
  {
    questionId: 'q17',
    questionName: 'Did the teacher ask open-ended questions?',
  },
  {
    questionId: 'q18',
    questionName:
      'Did the teacher encourage deeper thinking through tasks/questions?',
  },
];

const TakeQuiz = () => {
  const modalRef = useRef(null);
  const modalHeight = window.WindowHeigth * 0.3;
  const [answers, setAnswers] = useState({});
  const [imageInfo, setImageInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const scheme = useColorScheme();

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
          fallback ? fallback().then(resolve).catch(reject) : reject(error);
        },
        options,
      );
    });
  };

  const handleSubmit = async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Location permission is required.');
      return;
    }

    try {
      const position = await tryGetLocation(
        {enableHighAccuracy: false, timeout: 5000, maximumAge: 60000},
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

      const resp = await axios.post(
        'https://tatvagyan.in/thinkzone/saveTchLocationSurvey',
        finalData,
      );

      console.log('resp------->', resp);
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
        const permission = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
        );
        if (permission !== PermissionsAndroid.RESULTS.GRANTED) {
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
            })
          : await ImagePicker.openPicker({
              width: 300,
              height: 400,
              cropping: true,
            });

      if (!image) {
        setLoading(false);
        return;
      }

      const location = await tryGetLocation(
        {enableHighAccuracy: false, timeout: 5000, maximumAge: 60000},
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

  return (
    <View style={{flex: 1, backgroundColor: colors.background}}>
      <SafeAreaView style={{flex: 1}}>
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

        <ScrollView contentContainerStyle={[styles.container]}>
          <Text style={[styles.title, {color: colors.text}]}>
            📝 Teacher Quiz Form
          </Text>

          {sampleQuestions.map((q, index) => (
            <View
              key={q.questionId}
              style={[styles.questionCard, {backgroundColor: colors.card}]}>
              <Text style={[styles.questionText, {color: colors.subText}]}>
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

          <Pressable
            style={[
              styles.imageButton,
              {backgroundColor: colors.imageButtonBg},
            ]}
            onPress={handleOpenBottomSheet}>
            <Text style={styles.submitButtonText}>
              📷 Capture or Select Image
            </Text>
          </Pressable>

          {imageInfo && (
            <View
              style={[styles.imageContainer, {backgroundColor: colors.card}]}>
              <Image
                source={{uri: imageInfo.uri}}
                style={styles.previewImage}
              />
              <View style={styles.imageMeta}>
                <Text style={[styles.metaText, {color: colors.text}]}>
                  📍 Lat: {imageInfo.latitude}
                </Text>
                <Text style={[styles.metaText, {color: colors.text}]}>
                  📍 Long: {imageInfo.longitude}
                </Text>
                <Text style={[styles.metaText, {color: colors.text}]}>
                  🗺 {imageInfo.district}, {imageInfo.block}, {imageInfo.cluster}
                </Text>
              </View>
            </View>
          )}

          <Pressable
            style={[styles.submitButton, {backgroundColor: colors.buttonBg}]}
            onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>📤 Submit Quiz</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

export default TakeQuiz;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
    marginTop: 50,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'space-evenly',
    alignItems: 'center',
    flexDirection: 'row',
    backgroundColor: '#ffffff',
  },
  modalButtonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 60,
  },
  modalButtonText: {
    fontSize: 13,
    color: '#000',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  questionCard: {
    padding: 15,
    marginBottom: 15,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  checkbox: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#f9f9f9',
  },
  selectedYes: {
    backgroundColor: '#2ecc71',
  },
  selectedNo: {
    backgroundColor: '#e74c3c',
  },
  checkboxText: {
    color: 'black',
    fontWeight: '600',
  },
  submitButton: {
    borderRadius: 10,
    paddingVertical: 15,
    marginTop: 20,
    alignItems: 'center',
  },
  imageButton: {
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
    alignItems: 'center',
    borderRadius: 10,
    padding: 10,
    elevation: 3,
  },
  previewImage: {
    width: 300,
    height: 200,
    borderRadius: 10,
    resizeMode: 'cover',
  },
  imageMeta: {
    marginTop: 10,
  },
  metaText: {
    fontSize: 14,
  },
});
