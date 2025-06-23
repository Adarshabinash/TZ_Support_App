import React, {useState, useRef, useCallback, useEffect} from 'react';
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
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BottomSheet from '../utils/BottomSheet';
import Feather from 'react-native-vector-icons/Feather';
import Geolocation from '@react-native-community/geolocation';
import ImagePicker from 'react-native-image-crop-picker';
import {getDistrictAndBlock} from '../utils/locationHalper';
import * as window from '../utils/Dimensions';
import axios from 'axios';

const sampleQuestions = [
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
    questionName: 'Did the teacher respond to students needs?',
  },
  {
    questionId: 'q4',
    questionName: 'Did the teacher avoid bias and challenge stereotypes?',
  },
  {
    questionId: 'q5',
    questionName:
      'Did the teacher set clear expectations for class activities?',
  },
  {
    questionId: 'q6',
    questionName: 'Did the teacher acknowledge positive student behavior?',
  },
];

const TakeQuiz = () => {
  const modalRef = useRef(null);
  const modalHeight = window.WindowHeigth * 0.3;
  const [answers, setAnswers] = useState({});
  const [imageInfo, setImageInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [teacherData, setTeacherData] = useState(null);
  const [surveyData, setSurveyData] = useState(null);
  console.log('surveyData------->', surveyData);

  const scheme = useColorScheme();
  const isDarkMode = scheme === 'dark';

  const colors = {
    background: isDarkMode ? '#282828' : '#f4f6f8',
    card: isDarkMode ? '#1e1e1e' : '#ffffff',
    text: isDarkMode ? '#ffffff' : '#2c3e50',
    subText: isDarkMode ? '#cccccc' : '#34495e',
    buttonBg: isDarkMode ? '#3498db' : '#2980b9',
    imageButtonBg: isDarkMode ? '#2ecc71' : '#27ae60',
    modalBg: isDarkMode ? '#1a1a1a' : '#fff',
    modalText: isDarkMode ? '#eaeaea' : '#000',
    borderColor: isDarkMode ? '#444' : '#ccc',
  };

  useEffect(() => {
    const fetchTeacherAndSurveyData = async () => {
      try {
        setFetching(true);

        // Get teacher data from AsyncStorage
        const storedTeacher = await AsyncStorage.getItem('teacherData');

        if (storedTeacher) {
          const teacher = JSON.parse(storedTeacher);

          setTeacherData(teacher);

          // Fetch survey data using teacherId
          const response = await axios.get(
            `https://tatvagyan.in/thinkzone/getTchLocationSurvey/${teacher.teacherId}/${teacher.createdAt}`,
          );
          console.log('response------->', response.data);

          setSurveyData(response.data);

          // Set answers from the fetched data
          if (response.data.questions) {
            const initialAnswers = {};
            response.data.questions.forEach(q => {
              initialAnswers[q.questionId] = q.answer;
            });
            setAnswers(initialAnswers);
          }

          // Set image info if available
          if (response.data.imageInfo) {
            setImageInfo(response.data.imageInfo);
          }
        } else {
          Alert.alert('Error', 'Teacher data not found');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        Alert.alert('Error', 'Failed to fetch survey data');
      } finally {
        setFetching(false);
      }
    };

    fetchTeacherAndSurveyData();
  }, []);

  const allAnswered = sampleQuestions.every(
    q => answers[q.questionId] !== undefined,
  );

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
      setLoading(true);
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
        teacherId: teacherData?.teacherId || 'unknown',
        teacherName: teacherData?.teacherName || 'Unknown Teacher',
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
        ...(imageInfo && {imageInfo}),
      };

      const resp = await axios.post(
        'https://tatvagyan.in/thinkzone/saveTchLocationSurvey',
        finalData,
      );

      console.log('resp------->', resp);
      Alert.alert('Success', 'Quiz submitted with location!', [
        {
          text: 'OK',
          onPress: () => {
            // Clear all records after successful submission
            setAnswers({});
            setImageInfo(null);
            setSurveyData(null);
          },
        },
      ]);
    } catch (err) {
      console.error('Submit failed:', err);
      Alert.alert('Error', err.message || 'Failed to submit survey');
    } finally {
      setLoading(false);
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
      Alert.alert('Error', 'Check Location Service.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <View
        style={[styles.loaderContainer, {backgroundColor: colors.background}]}>
        <ActivityIndicator size="large" color={colors.buttonBg} />
        <Text style={[styles.loaderText, {color: colors.text}]}>
          Loading survey data...
        </Text>
      </View>
    );
  }

  return (
    <View style={{flex: 1, backgroundColor: colors.background}}>
      <SafeAreaView style={{flex: 1}}>
        <BottomSheet modalRef={modalRef} modalHeight={modalHeight}>
          <View
            style={[styles.modalContainer, {backgroundColor: colors.modalBg}]}>
            <TouchableOpacity
              onPress={() => handleSelection('camera')}
              style={styles.modalButtonContainer}>
              <Feather name="camera" size={30} color={colors.buttonBg} />
              <Text style={[styles.modalButtonText, {color: colors.modalText}]}>
                Take Picture
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleSelection('gallery')}
              style={styles.modalButtonContainer}>
              <Feather name="file" size={30} color={colors.imageButtonBg} />
              <Text style={[styles.modalButtonText, {color: colors.modalText}]}>
                Choose from Gallery
              </Text>
            </TouchableOpacity>
          </View>
        </BottomSheet>

        <ScrollView contentContainerStyle={[styles.container]}>
          <Text style={[styles.title, {color: colors.text}]}>
            📝 Teacher Quiz Form
          </Text>
          {teacherData && (
            <Text style={[styles.subtitle, {color: colors.subText}]}>
              Teacher: {teacherData.teacherName}
            </Text>
          )}

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
                  {answers[q.questionId] === true && (
                    <Feather
                      name="check"
                      size={20}
                      color="white"
                      style={styles.checkIcon}
                    />
                  )}
                </Pressable>
                <Pressable
                  style={[
                    styles.checkbox,
                    answers[q.questionId] === false && styles.selectedNo,
                  ]}
                  onPress={() => handleCheckbox(q.questionId, false)}>
                  <Text style={styles.checkboxText}>No</Text>
                  {answers[q.questionId] === false && (
                    <Feather
                      name="check"
                      size={20}
                      color="white"
                      style={styles.checkIcon}
                    />
                  )}
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
            style={[
              styles.submitButton,
              {backgroundColor: allAnswered ? colors.buttonBg : '#bdc3c7'},
            ]}
            onPress={
              allAnswered
                ? handleSubmit
                : () =>
                    Alert.alert('Incomplete', 'Please answer all questions.')
            }
            disabled={!allAnswered || loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>📤 Submit Quiz</Text>
            )}
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
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 20,
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'space-evenly',
    alignItems: 'center',
    flexDirection: 'row',
  },
  modalButtonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 80,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  modalButtonText: {
    fontSize: 13,
    marginTop: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
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
    flexDirection: 'row',
    alignItems: 'center',
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
    marginRight: 5,
  },
  checkIcon: {
    marginLeft: 5,
  },
  submitButton: {
    borderRadius: 10,
    paddingVertical: 15,
    marginTop: 20,
    marginBottom: 20,
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
