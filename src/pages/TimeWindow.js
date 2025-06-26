import React, {useCallback, useEffect, useState} from 'react';
import {
  StyleSheet,
  Text,
  View,
  Button,
  Alert,
  Modal,
  StatusBar,
  TouchableOpacity,
  BackHandler,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {ScrollView} from 'react-native-gesture-handler';

const userId = 'user_123';
const examId = 'demo_exam_001';
const getKey = suffix => `${examId}_${userId}_${suffix}`;

const EXAM_START = new Date('2025-06-26T14:00:00');
const EXAM_END = new Date('2025-06-26T16:00:00');

const TimeWindow = () => {
  const [status, setStatus] = useState('loading');
  const [remainingSeconds, setRemainingSeconds] = useState(null);
  const [openTestModal, setOpenTestModal] = useState(false);

  const handleOpenTest = () => {
    setOpenTestModal(true);
  };

  const handleCloseTest = () => {
    if (openTestModal) {
      Alert.alert(
        'Are you sure?',
        'Do you want to go back? The timer will be still running.',
        [
          {
            text: 'Cancel',
            onPress: () => null,
            style: 'cancel',
          },
          {
            text: 'Yes',
            onPress: () => setOpenTestModal(false),
          },
        ],
      );
      return true;
    }
  };

  useFocusEffect(
    useCallback(() => {
      const backAction = () => {
        if (openTestModal) {
          Alert.alert(
            'Are you sure?',
            'Do you want to go back? The timer will be still running.',
            [
              {
                text: 'Cancel',
                onPress: () => null,
                style: 'cancel',
              },
              {
                text: 'Yes',
                onPress: () => setOpenTestModal(false),
              },
            ],
          );
          return true;
        }
      };

      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        backAction,
      );

      return () => backHandler.remove();
    }, []),
  );

  useFocusEffect(
    useCallback(() => {
      let timerUntilStart = null;
      const init = async () => {
        const now = new Date();
        const submitted = await AsyncStorage.getItem(getKey('submitted'));
        if (submitted === 'true') {
          setStatus('submitted');
          return;
        }
        if (now < EXAM_START) {
          setStatus('before');
          const msUntilStart = EXAM_START - now;
          if (msUntilStart > 0) {
            timerUntilStart = setTimeout(() => {
              init();
            }, msUntilStart);
          }
          return;
        }
        if (now > EXAM_END) {
          setStatus('over');
          return;
        }
        let joinedAtStr = await AsyncStorage.getItem(getKey('joinedAt'));
        let joinedAt = joinedAtStr ? new Date(joinedAtStr) : now;
        if (!joinedAtStr) {
          await AsyncStorage.setItem(
            getKey('joinedAt'),
            joinedAt.toISOString(),
          );
        }
        const timeLeft = Math.floor((EXAM_END - now) / 1000);
        setRemainingSeconds(Math.max(timeLeft, 0));
        setStatus('active');
      };
      init();
      return () => {
        if (timerUntilStart) {
          clearTimeout(timerUntilStart);
        }
      };
      // AsyncStorage.setItem(getKey('submitted'), 'false');
    }, []),
  );

  const handleAutoSubmitTest = () => {
    AsyncStorage.setItem(getKey('submitted'), 'true');
    setOpenTestModal(false);
    setStatus('submitted');
    Alert.alert('Your time is over now. Thank you.');
  };

  useEffect(() => {
    if (status === 'active' && remainingSeconds > 0) {
      const interval = setInterval(() => {
        setRemainingSeconds(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            if (openTestModal) {
              setStatus('submitted');
              handleAutoSubmitTest();
            } else {
              setStatus('over');
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    } else if (status === 'active' && remainingSeconds < 0) {
      setOpenTestModal(false);
    }
  }, [status, remainingSeconds]);

  const handleSubmit = async () => {
    await AsyncStorage.setItem(getKey('submitted'), 'true');
    setStatus('submitted');
    Alert.alert(
      '✅ Exam Submitted',
      'You have successfully submitted the exam.',
    );
  };

  const formatTime = sec => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;

    return [
      h.toString().padStart(2, '0'),
      m.toString().padStart(2, '0'),
      s.toString().padStart(2, '0'),
    ].join(':');
  };

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return <Text style={styles.statusText}>⏳ Loading...</Text>;

      case 'before':
        return (
          <Text style={styles.statusText}>
            🕒 Exam starts at {EXAM_START.toLocaleTimeString()}. Please wait...
          </Text>
        );

      case 'submitted':
        return (
          <Text style={styles.statusText}>
            ✅ You have already submitted the exam.
          </Text>
        );

      case 'over':
        return (
          <Text style={styles.statusText}>
            ⏰ Exam is over. You can't enter now.
          </Text>
        );

      case 'active':
        return (
          <View style={styles.examBox}>
            <Text style={styles.timer}>
              ⏳ Time Left: {formatTime(remainingSeconds)}
            </Text>

            <Button
              title="Open Test"
              onPress={handleOpenTest}
              color="#d9534f"
            />
          </View>
        );

      default:
        return <Text style={styles.statusText}>Something went wrong.</Text>;
    }
  };

  return (
    <View
      style={[
        styles.container,
        {backgroundColor: status === 'over' ? '#fff0ee' : 'd2d2f9'},
      ]}>
      <Text style={styles.titleText}>Hello User!</Text>
      <Text style={styles.subTitleText}>You can attend your tests here</Text>
      <View style={styles.secondContainer}>{renderContent()}</View>
      <Modal
        animationType="slide"
        transparent={false}
        onRequestClose={handleCloseTest}
        statusBarTranslucent={true}
        visible={openTestModal}>
        <StatusBar hidden />
        {openTestModal && (
          <View style={styles.modalOverlay}>
            <View style={styles.statusHeader}>
              <View style={styles.statusBarHeader}>
                {/* <Text style={styles.statusBarText}>Time Remaining:</Text> */}
                <Text
                  style={[
                    styles.timerText,
                    {color: remainingSeconds < 300 ? '#ff2601' : 'black'},
                  ]}>
                  {formatTime(remainingSeconds)}
                </Text>
              </View>
            </View>
            <ScrollView style={styles.modalBox}>
              <Text style={styles.question}>Q1: What is React Native?</Text>
              <Text style={styles.question}>Q1: What is React Native?</Text>
              <Text style={styles.question}>Q1: What is React Native?</Text>
              <Text style={styles.question}>Q1: What is React Native?</Text>
              <Text style={styles.question}>Q1: What is React Native?</Text>
              <Text style={styles.question}>Q1: What is React Native?</Text>
              <Text style={styles.question}>Q1: What is React Native?</Text>

              <TouchableOpacity
                style={styles.submitButtonStyle}
                onPress={handleSubmit}>
                <Text style={styles.submitButtontext}>Submit</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}
      </Modal>
    </View>
  );
};

export default TimeWindow;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  titleText: {
    fontSize: 28,
    fontWeight: 'bold',
    fontFamily: 'Roboto',
    marginBottom: 8,
    color: '#333',
  },
  subTitleText: {
    fontFamily: 'Roboto',
    fontWeight: '500',
    fontSize: 16,
    marginBottom: 30,
    color: '#666',
  },
  secondContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    elevation: 3,
  },
  examBox: {
    alignItems: 'flex-start',
    gap: 20,
  },
  statusText: {
    fontSize: 16,
    color: '#444',
  },
  timer: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#007bff',
  },
  question: {
    fontSize: 18,
    marginBottom: 12,
    color: '#222',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#f0fcff',
  },
  question: {
    fontFamily: 'Roboto',
    fontSize: 21,
    marginTop: '25%',
    marginLeft: '3%',
  },
  submitButtonStyle: {
    width: '50%',
    borderWidth: 2,
    padding: 10,
    borderRadius: 20,
    backgroundColor: '#326be6',
    left: '26%',
    bottom: '0%',
    marginBottom: 40,
    marginTop: '7%',
  },
  submitButtontext: {
    fontFamily: 'Roboto',
    color: 'white',
    fontSize: 20,
    textAlign: 'center',
  },
  statusHeader: {
    backgroundColor: '#326be6',
  },
  statusBarHeader: {
    backgroundColor: '#326be6',
    padding: '5%',
    flexDirection: 'row',
  },
  statusBarText: {
    color: 'white',
    fontSize: 18,
    marginLeft: '-10%',
  },
  timerText: {
    fontSize: 24,
    left: '230',
    borderWidth: 1.5,
    padding: 8,
    backgroundColor: 'white',
    borderRadius: 8,
  },
  topText: {
    color: 'white',
    fontSize: 18,
    marginRight: 70,
  },
});
