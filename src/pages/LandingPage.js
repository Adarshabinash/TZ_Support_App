import {useFocusEffect} from '@react-navigation/native';
import React, {useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Image,
  SafeAreaView,
  Animated,
  Easing,
  ImageBackground,
  Linking,
  StyleSheet,
  Dimensions,
  BackHandler,
  Alert,
} from 'react-native';
import {
  ScaledSheet,
  moderateScale,
  scale,
  verticalScale,
} from 'react-native-size-matters';

const {width, height} = Dimensions.get('window');

const LandingPage = ({navigation}) => {
  const scaleValue = new Animated.Value(0);
  const fadeValue = new Animated.Value(0);
  const slideUpValue = new Animated.Value(verticalScale(20));

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleValue, {
        toValue: 1,
        friction: 5,
        tension: 30,
        useNativeDriver: true,
      }),
      Animated.timing(fadeValue, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(slideUpValue, {
        toValue: 0,
        duration: 1000,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    const backAction = () => {
      Alert.alert('Hold on!', 'Are you sure you want to go back?', [
        {
          text: 'Cancel',
          onPress: () => null,
          style: 'cancel',
        },
        {text: 'YES', onPress: () => BackHandler.exitApp()},
      ]);
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4A6FA5" />
      <ImageBackground
        source={require('../assets/img/homepagebg.jpg')}
        style={styles.backgroundImage}
        resizeMode="cover"
        blurRadius={2}>
        <View style={styles.overlay} />
        <View style={styles.circle1} />
        <View style={styles.circle2} />

        <View style={styles.contentContainer}>
          <Animated.View
            style={[
              styles.logoContainer,
              {
                transform: [{scale: scaleValue}],
                opacity: fadeValue,
              },
            ]}>
            <Image
              style={styles.logo}
              source={require('../assets/img/new_logo.png')}
              resizeMode="contain"
            />
          </Animated.View>

          <Animated.View
            style={[
              styles.textContainer,
              {
                opacity: fadeValue,
                transform: [{translateY: slideUpValue}],
              },
            ]}>
            <Text style={styles.title}>Welcome to</Text>
            <Text style={styles.appName}>Thinkzone Support</Text>
            <Text style={styles.subtitle} numberOfLines={3}>
              Empowering educators and students through innovative technology
            </Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.buttonContainer,
              {
                opacity: fadeValue,
                transform: [{translateY: slideUpValue}],
              },
            ]}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.7}>
              <Text style={styles.primaryButtonText}>START</Text>
              <View style={styles.buttonIcon}>
                <Image
                  source={require('../assets/Image/arrow-square-right.png')}
                  style={styles.iconImage}
                />
              </View>
            </TouchableOpacity>
          </Animated.View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By continuing, you agree to our{' '}
            <Text
              style={styles.linkText}
              onPress={() =>
                Linking.openURL(
                  'https://sites.google.com/view/thinkzoneapp/home',
                )
              }>
              Terms and Conditions
            </Text>{' '}
            and{' '}
            <Text
              style={styles.linkText}
              onPress={() =>
                Linking.openURL(
                  'https://sites.google.com/view/thinkzoneapp/home',
                )
              }>
              Privacy Policy
            </Text>
            .
          </Text>
          <Text style={styles.footerSubText}>
            This app is currently available for use in India 🇮🇳
          </Text>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
};

const styles = ScaledSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(74, 111, 165, 0.85)',
  },
  contentContainer: {
    flex: 1,
    width: '100%',
    paddingHorizontal: width < 350 ? '10@s' : '20@s',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: '30@vs',
  },
  logoContainer: {
    marginBottom: height < 600 ? '15@vs' : '25@vs',
    alignItems: 'center',
  },
  logo: {
    width: width < 350 ? '80@s' : '95@s',
    height: width < 350 ? '80@s' : '95@s',
    borderRadius: '60@s',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: height < 600 ? '15@vs' : '20@vs',
    width: '100%',
  },
  title: {
    fontSize: width < 350 ? '16@ms' : '18@ms',
    color: 'rgba(255,255,255,0.9)',
    fontFamily: 'Roboto-Light',
    marginBottom: 5,
    textAlign: 'center',
  },
  appName: {
    fontSize: width < 350 ? '20@ms' : '24@ms',
    color: '#fff',
    fontFamily: 'Roboto-Bold',
    marginBottom: height < 600 ? 5 : 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: width < 350 ? '12@ms' : '14@ms',
    color: 'rgba(255,255,255,0.85)',
    fontFamily: 'Roboto-Regular',
    textAlign: 'center',
    maxWidth: '90%',
    lineHeight: height < 600 ? '16@vs' : '18@vs',
    paddingHorizontal: width < 350 ? '5@s' : 0,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: height < 600 ? '5@vs' : '10@vs',
  },
  primaryButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: height < 600 ? '10@vs' : '12@vs',
    paddingHorizontal: '20@s',
    borderRadius: '30@s',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    marginTop: height < 600 ? '15@vs' : '20@vs',
    width: '50%',
    maxWidth: 300,
    minHeight: height < 600 ? verticalScale(45) : verticalScale(50),
  },
  primaryButtonText: {
    color: '#2D3748',
    fontSize: width < 350 ? '14@ms' : '16@ms',
    fontFamily: 'Roboto-Medium',
    letterSpacing: 0.3,
    fontWeight: 550,
  },
  buttonIcon: {
    marginLeft: '12@s',
    borderRadius: '15@s',
    width: '28@s',
    height: '28@s',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconImage: {
    width: '30@s',
    height: '30@s',
  },
  footer: {
    paddingHorizontal: width < 350 ? '10@s' : '15@s',
    paddingVertical: '11@vs',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    borderRadius: '10@s',
    alignSelf: 'center',
    width: '105%',
    marginTop: '12@vs',
    borderWidth: 0.5,
    borderColor: '#ccc',
    // marginBottom: height < 600 ? '5@vs' : '10@vs',
  },
  footerText: {
    fontSize: width < 350 ? '11@ms' : '13@ms',
    color: '#555',
    textAlign: 'center',
    lineHeight: height < 600 ? '16@vs' : '18@vs',
  },
  linkText: {
    color: '#007BFF',
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  footerSubText: {
    marginTop: '5@vs',
    fontSize: width < 350 ? '10@ms' : '12@ms',
    color: '#777',
    textAlign: 'center',
  },
  circle1: {
    position: 'absolute',
    width: width < 350 ? '200@s' : '250@s',
    height: width < 350 ? '200@s' : '250@s',
    borderRadius: width < 350 ? '100@s' : '125@s',
    backgroundColor: 'rgba(255,255,255,0.03)',
    top: '-60@s',
    right: '-80@s',
  },
  circle2: {
    position: 'absolute',
    width: width < 350 ? '150@s' : '180@s',
    height: width < 350 ? '150@s' : '180@s',
    borderRadius: width < 350 ? '75@s' : '90@s',
    backgroundColor: 'rgba(255,255,255,0.02)',
    bottom: '-70@s',
    left: '-70@s',
  },
});

export default LandingPage;
