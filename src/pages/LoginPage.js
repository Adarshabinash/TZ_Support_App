import React, {useState, useRef, useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import {Alert} from 'react-native';
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
} from 'react-native';
import {useNavigation} from '@react-navigation/native';

const LoginPage = () => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({userId: '', password: ''});
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  const slideAnim = useRef(new Animated.Value(300)).current;
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const colors = {
    background: isDark ? '#121212' : '#f5f6fa',
    card: isDark ? '#1e1e1e' : '#ffffff',
    text: isDark ? '#f5f6fa' : '#2c3e50',
    subText: isDark ? '#aaaaaa' : '#555',
    button: isDark ? '#4aa9ff' : '#3E8EDE',
    error: '#ff4d4f',
    inputBg: isDark ? '#2c2c2c' : '#f0f0f0',
    placeholder: isDark ? '#999' : '#888',
  };

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [slideAnim]);

  const validate = () => {
    let valid = true;
    const newErrors = {userId: '', password: ''};

    if (!userId) {
      newErrors.userId = 'User ID is required';
      valid = false;
    }

    if (!password) {
      newErrors.password = 'Password is required';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSignIn = async () => {
    const isValid = validate();
    if (!isValid) return;

    setLoading(true);

    try {
      const response = await axios.post(
        'https://tatvagyan.in/thinkzone/authTeacher',
        {
          teacherId: userId,
          password: password,
        },
      );

      if (response.status === 200 && response.data.msg === 'login success') {
        await AsyncStorage.setItem('isLoggedIn', 'true');
        navigation.replace('Home');
      } else {
        Alert.alert('Login Failed', 'Invalid credentials from server');
      }
    } catch (error) {
      const status = error?.response?.status;
      const serverMsg = error?.response?.data?.msg;

      console.log('Response from server:', serverMsg);
      console.error('Login error:', error);

      let alertTitle = 'Login Error';
      let alertMessage = 'Something went wrong. Please try again.';

      if (status === 400 || status === 401) {
        alertMessage =
          serverMsg || 'Invalid credentials. Please check and try again.';
      } else if (status === 500) {
        alertMessage = 'Server error. Please try again later.';
      } else if (serverMsg) {
        alertMessage = serverMsg;
      }

      Alert.alert(alertTitle, alertMessage, [{text: 'OK'}]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require('../assets/img/login.jpg')}
      style={styles.background}
      resizeMode="cover">
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      <View
        style={[
          styles.overlay,
          {backgroundColor: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.3)'},
        ]}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.screen}>
        <Animated.View
          style={[
            styles.card,
            {
              transform: [{translateY: slideAnim}],
              backgroundColor: colors.card,
              shadowColor: isDark ? '#000' : '#ccc',
            },
          ]}>
          <Text style={[styles.subtitle, {color: colors.subText}]}>
            Sign in to your account
          </Text>

          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.inputBg,
                color: colors.text,
                borderColor: colors.subText,
              },
            ]}
            placeholder="User ID"
            placeholderTextColor={colors.placeholder}
            value={userId}
            onChangeText={text => {
              setUserId(text);
              if (errors.userId) {
                setErrors(prev => ({...prev, userId: ''}));
              }
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="username"
            textContentType="username"
            importantForAutofill="yes"
          />
          {errors.userId ? (
            <Text style={[styles.error, {color: colors.error}]}>
              {errors.userId}
            </Text>
          ) : null}

          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.inputBg,
                color: colors.text,
                borderColor: colors.subText,
              },
            ]}
            placeholder="Password"
            placeholderTextColor={colors.placeholder}
            value={password}
            onChangeText={text => {
              setPassword(text);
              if (errors.password) {
                setErrors(prev => ({...prev, password: ''}));
              }
            }}
            secureTextEntry
            autoComplete="password"
            textContentType="password"
            importantForAutofill="yes"
          />
          {errors.password ? (
            <Text style={[styles.error, {color: colors.error}]}>
              {errors.password}
            </Text>
          ) : null}

          <TouchableOpacity
            style={[styles.button, {backgroundColor: colors.button}]}
            onPress={handleSignIn}
            disabled={loading}>
            {loading ? (
              <Text style={styles.buttonText}>Signing In...</Text>
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
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
  screen: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    padding: 28,
    borderRadius: 20,
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: 5},
    elevation: 10,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '500',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 0.6,
  },
  error: {
    fontSize: 13,
    marginBottom: 8,
    marginLeft: 4,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default LoginPage;
