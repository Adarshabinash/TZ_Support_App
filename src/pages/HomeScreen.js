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
} from 'react-native';
import {
  ScaledSheet,
  moderateScale,
  scale,
  verticalScale,
} from 'react-native-size-matters';

const HomeScreen = ({navigation}) => {
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4A6FA5" />
      <ImageBackground
        source={require('../assets/img/homepagebg.jpg')}
        style={styles.backgroundImage}
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
            <Text style={styles.appName}>Thinkzone Support App</Text>
            <Text style={styles.subtitle}>
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
              onPress={() => navigation.navigate('About')}
              activeOpacity={0.7}>
              <Text style={styles.primaryButtonText}>Login</Text>
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
    height: '100%',
    justifyContent: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(74, 111, 165, 0.85)',
  },
  contentContainer: {
    flex: 1,
    width: '100%',
    paddingHorizontal: '20@s',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: '30@vs',
  },
  logoContainer: {
    marginBottom: '25@vs',
    alignItems: 'center',
  },
  logo: {
    width: '95@s',
    height: '95@s',
    borderRadius: '60@s',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: '20@vs',
  },
  title: {
    fontSize: '18@ms',
    color: 'rgba(255,255,255,0.9)',
    fontFamily: 'Roboto-Light',
    marginBottom: 5,
    textAlign: 'center',
  },
  appName: {
    fontSize: '24@ms',
    color: '#fff',
    fontFamily: 'Roboto-Bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: '14@ms',
    color: 'rgba(255,255,255,0.85)',
    fontFamily: 'Roboto-Regular',
    textAlign: 'center',
    maxWidth: '90%',
    lineHeight: '18@vs',
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: '10@vs',
  },
  primaryButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: '12@vs',
    paddingHorizontal: '20@s',
    borderRadius: '30@s',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    marginTop: '20@vs',
    width: '90%',
    maxWidth: 300,
  },
  primaryButtonText: {
    color: '#2D3748',
    fontSize: '16@ms',
    fontFamily: 'Roboto-Medium',
    letterSpacing: 0.3,
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
    paddingHorizontal: '15@s',
    paddingVertical: '10@vs',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    borderRadius: '10@s',
    alignSelf: 'center',
    width: '95%',
    marginTop: '10@vs',
    borderWidth: 0.5,
    borderColor: '#ccc',
  },
  footerText: {
    fontSize: '13@ms',
    color: '#555',
    textAlign: 'center',
    lineHeight: '18@vs',
  },
  linkText: {
    color: '#007BFF',
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  footerSubText: {
    marginTop: '5@vs',
    fontSize: '12@ms',
    color: '#777',
    textAlign: 'center',
  },
  circle1: {
    position: 'absolute',
    width: '250@s',
    height: '250@s',
    borderRadius: '125@s',
    backgroundColor: 'rgba(255,255,255,0.03)',
    top: '-60@s',
    right: '-80@s',
  },
  circle2: {
    position: 'absolute',
    width: '180@s',
    height: '180@s',
    borderRadius: '90@s',
    backgroundColor: 'rgba(255,255,255,0.02)',
    bottom: '-70@s',
    left: '-70@s',
  },
});

export default HomeScreen;
