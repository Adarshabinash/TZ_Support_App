import React, {useState, useRef, useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import {Alert, Linking, Dimensions} from 'react-native';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Animated,
  useColorScheme,
  StatusBar,
  Image,
  ActivityIndicator,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const {width} = Dimensions.get('window');

const LoginPage = () => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({userId: '', password: ''});
  const [loading, setLoading] = useState(false);
  const [secureEntry, setSecureEntry] = useState(true);
  const navigation = useNavigation();

  const slideAnim = useRef(new Animated.Value(300)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const colors = {
    background: isDark ? '#121212' : '#f8f9fa',
    card: isDark ? '#1e1e1e' : '#ffffff',
    text: isDark ? '#f5f6fa' : '#2c3e50',
    subText: isDark ? '#aaaaaa' : '#555',
    button: isDark ? '#1976d2' : '#1565c0',
    error: '#d32f2f',
    inputBg: isDark ? '#2c2c2c' : '#f0f0f0',
    placeholder: isDark ? '#999' : '#888',
    border: isDark ? '#333' : '#ddd',
    icon: isDark ? '#757575' : '#616161',
    headerBg: isDark ? '#0d47a1' : '#1e88e5',
    footerBg: isDark ? '#1e1e1e' : '#fff',
    footerBorder: isDark ? '#333' : '#ccc',
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, [slideAnim, fadeAnim]);

  const validate = () => {
    let valid = true;
    const newErrors = {userId: '', password: ''};

    if (!userId) {
      newErrors.userId = 'Official ID is required';
      valid = false;
    } else if (userId.length < 4) {
      newErrors.userId = 'ID must be at least 4 characters';
      valid = false;
    }

    if (!password) {
      newErrors.password = 'Password is required';
      valid = false;
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSignIn = async () => {
    navigation.replace('Home');
    // const isValid = validate();
    // if (!isValid) return;
    // setLoading(true);
    // try {
    //   const response = await axios.post(
    //     'https://tatvagyan.in/thinkzone/authTeacher',
    //     {
    //       teacherId: userId,
    //       password: password,
    //     },
    //   );
    //   if (response.status === 200 && response.data.msg === 'login success') {
    //     console.log('Login successful:', response.data);
    //     await AsyncStorage.setItem(
    //       'teacherData',
    //       JSON.stringify(response?.data?.teacher),
    //     );
    //     await AsyncStorage.setItem('isLoggedIn', 'true');
    //     navigation.replace('Home');
    //   } else {
    //     Alert.alert(
    //       'Authentication Failed',
    //       'Please check your credentials and try again.',
    //     );
    //   }
    // } catch (error) {
    //   const status = error?.response?.status;
    //   const serverMsg = error?.response?.data?.msg;
    //   let alertTitle = 'Login Error';
    //   let alertMessage =
    //     'Unable to connect to the server. Please try again later.';
    //   if (status === 400 || status === 401) {
    //     alertMessage =
    //       serverMsg ||
    //       'Invalid official ID or password. Please verify your credentials.';
    //   } else if (status === 500) {
    //     alertMessage =
    //       'Server maintenance in progress. Please try after some time.';
    //   } else if (error.message === 'Network Error') {
    //     alertMessage =
    //       'Network unavailable. Please check your internet connection.';
    //   }
    //   Alert.alert(alertTitle, alertMessage, [{text: 'OK'}]);
    // } finally {
    //   setLoading(false);
    // }
  };

  return (
    <ImageBackground
      source={
        isDark
          ? require('../assets/img/login.jpg')
          : require('../assets/img/login.jpg')
      }
      style={styles.background}
      resizeMode="cover">
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.headerBg}
        translucent
      />
      <View
        style={[
          styles.overlay,
          {
            backgroundColor: isDark
              ? 'rgba(0,0,0,0.7)'
              : 'rgba(255,255,255,0.2)',
          },
        ]}
      />

      <Animated.View style={[styles.header, {opacity: fadeAnim}]}>
        <Image
          source={require('../assets/Image/tzicon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={[styles.headerText, {color: '#fff'}]}>
          Education Monitoring System
        </Text>
        {/* <Text style={[styles.subHeaderText, {color: 'rgba(255,255,255,0.8)'}]}>
          Cluster Resource Coordinator Portal
        </Text> */}
      </Animated.View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.screen}>
        <Animated.View
          style={[
            styles.card,
            {
              transform: [{translateY: slideAnim}],
              backgroundColor: colors.card,
              shadowColor: isDark ? '#000' : '#aaa',
              borderColor: colors.border,
            },
          ]}>
          <View style={styles.cardHeader}>
            <Icon name="account-key" size={28} color={colors.button} />
            <Text style={[styles.cardHeaderText, {color: colors.text}]}>
              Official Login
            </Text>
          </View>

          <Text style={[styles.inputLabel, {color: colors.subText}]}>
            User ID
          </Text>
          <View
            style={[
              styles.inputContainer,
              {
                backgroundColor: colors.inputBg,
                borderColor: errors.userId ? colors.error : colors.border,
              },
            ]}>
            <Icon
              name="badge-account"
              size={20}
              color={colors.icon}
              style={styles.inputIcon}
            />
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.text,
                },
              ]}
              placeholder="Enter your user ID"
              placeholderTextColor={colors.placeholder}
              value={userId}
              onChangeText={text => {
                setUserId(text);
                if (errors.userId) {
                  setErrors(prev => ({...prev, userId: ''}));
                }
              }}
              keyboardType="default"
              autoCapitalize="none"
              autoComplete="username"
              textContentType="username"
              importantForAutofill="yes"
            />
          </View>
          {errors.userId ? (
            <View style={styles.errorContainer}>
              <Icon name="alert-circle" size={14} color={colors.error} />
              <Text style={[styles.error, {color: colors.error}]}>
                {errors.userId}
              </Text>
            </View>
          ) : null}

          <Text style={[styles.inputLabel, {color: colors.subText}]}>
            Password
          </Text>
          <View
            style={[
              styles.inputContainer,
              {
                backgroundColor: colors.inputBg,
                borderColor: errors.password ? colors.error : colors.border,
              },
            ]}>
            <Icon
              name="lock"
              size={20}
              color={colors.icon}
              style={styles.inputIcon}
            />
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.text,
                },
              ]}
              placeholder="Enter your password"
              placeholderTextColor={colors.placeholder}
              value={password}
              onChangeText={text => {
                setPassword(text);
                if (errors.password) {
                  setErrors(prev => ({...prev, password: ''}));
                }
              }}
              secureTextEntry={secureEntry}
              autoComplete="password"
              textContentType="password"
              importantForAutofill="yes"
            />
            <TouchableOpacity
              onPress={() => setSecureEntry(!secureEntry)}
              style={styles.eyeIcon}>
              <Icon
                name={secureEntry ? 'eye-off' : 'eye'}
                size={20}
                color={colors.icon}
              />
            </TouchableOpacity>
          </View>
          {errors.password ? (
            <View style={styles.errorContainer}>
              <Icon name="alert-circle" size={14} color={colors.error} />
              <Text style={[styles.error, {color: colors.error}]}>
                {errors.password}
              </Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.button, {backgroundColor: colors.button}]}
            onPress={handleSignIn}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <View style={styles.buttonContent}>
                <Icon name="login" size={20} color="#fff" />
                <Text style={styles.buttonText}>Sign In</Text>
              </View>
            )}
          </TouchableOpacity>
          <View style={styles.footerNote}>
            <Text style={[styles.footerNoteText, {color: colors.subText}]}>
              Forgot credentials? Contact Admin
            </Text>
            <Text style={[styles.footerNoteText, {color: colors.subText}]}>
              © 2025 Thinkzone
            </Text>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
      {/* Added Footer Section */}
      <Animated.View
        style={[
          styles.footer,
          {
            backgroundColor: colors.footerBg,
            borderColor: colors.footerBorder,
            opacity: fadeAnim,
          },
        ]}>
        <Text style={[styles.footerText, {color: colors.subText}]}>
          By continuing, you agree to our{' '}
          <Text
            style={styles.linkText}
            onPress={() =>
              Linking.openURL('https://sites.google.com/view/thinkzoneapp/home')
            }>
            Terms and Conditions
          </Text>{' '}
          and{' '}
          <Text
            style={styles.linkText}
            onPress={() =>
              Linking.openURL('https://sites.google.com/view/thinkzoneapp/home')
            }>
            Privacy Policy
          </Text>
          .
        </Text>
        <Text style={[styles.footerSubText, {color: colors.subText}]}>
          This app is currently available for use in India 🇮🇳
        </Text>
      </Animated.View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 20 : 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(30, 136, 229, 0.9)',
  },
  logo: {
    width: 60,
    height: 60,
    marginBottom: 10,
  },
  headerText: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  subHeaderText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  screen: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: {width: 0, height: 6},
    elevation: 8,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  cardHeaderText: {
    fontSize: 20,
    fontWeight: '600',
    marginLeft: 10,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 4,
  },
  inputIcon: {
    marginLeft: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 10,
    marginRight: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginLeft: 4,
  },
  error: {
    fontSize: 13,
    marginLeft: 4,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 4,
    elevation: 3,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  footerNote: {
    marginTop: 12,
    alignItems: 'center',
  },
  footerNoteText: {
    fontSize: 12,
    marginVertical: 2,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: width < 350 ? 10 : 15,
    paddingVertical: 25,
    borderRadius: 10,
    borderWidth: 0.5,
    // marginHorizontal: 20,
    // marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  footerText: {
    fontSize: width < 350 ? 11 : 13,
    textAlign: 'center',
    lineHeight: width < 350 ? 16 : 18,
  },
  linkText: {
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  footerSubText: {
    marginTop: 5,
    fontSize: width < 350 ? 10 : 12,
    textAlign: 'center',
  },
});

export default LoginPage;
