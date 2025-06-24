import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {useEffect, useState} from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  BackHandler,
  Alert,
  useColorScheme,
  Animated,
  Easing,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';

const ProfilePage = ({navigation}) => {
  const scheme = useColorScheme();
  const isDarkMode = scheme === 'dark';
  const [scaleValue] = useState(new Animated.Value(0));
  const [opacityValue] = useState(new Animated.Value(0));
  const [translateYValue] = useState(new Animated.Value(30));

  const colors = {
    background: isDarkMode ? '#121212' : '#f8f9fa',
    card: isDarkMode ? '#1e1e1e' : '#ffffff',
    text: isDarkMode ? '#ffffff' : '#2c3e50',
    subText: isDarkMode ? '#b0b0b0' : '#7f8c8d',
    buttonBg: isDarkMode ? '#4a6fa5' : '#3f51b5',
    accent: isDarkMode ? '#bb86fc' : '#6200ee',
    divider: isDarkMode ? '#333333' : '#e0e0e0',
  };

  useEffect(() => {
    // Animation sequence
    Animated.parallel([
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: 800,
        easing: Easing.bezier(0.2, 0.8, 0.2, 1),
        useNativeDriver: true,
      }),
      Animated.timing(opacityValue, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(translateYValue, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();

    const backAction = () => {
      navigation.goBack();
      return true;
    };
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove();
  }, []);

  const onLogOut = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          try {
            await AsyncStorage.multiRemove([
              'isLoggedIn',
              'teacherData',
              'userToken',
            ]);
            navigation.navigate('Login');
            // if (route.params?.setIsLoggedIn) {
            //   route.params.setIsLoggedIn(false);
            // }
          } catch (error) {
            console.error('Logout error:', error);
          }
        },
      },
    ]);
  };

  const profileItems = [
    {
      icon: 'email',
      title: 'Email',
      value: 'tzedubridge@thinkzone.in',
    },
    {
      icon: 'phone',
      title: 'Phone',
      value: '+91 9178198947',
    },
    {
      icon: 'location-on',
      title: 'Location',
      value: 'Cuttack, Odisha',
    },
    {
      icon: 'business',
      title: 'Organization',
      value: 'ThinkZone Edubridge',
    },
  ];

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <LinearGradient
        colors={isDarkMode ? ['#121212', '#1e1e1e'] : ['#f8f9fa', '#ffffff']}
        style={styles.gradientBackground}
      />

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Animated.View
          style={[
            styles.profileHeader,
            {
              opacity: opacityValue,
              transform: [{scale: scaleValue}],
            },
          ]}>
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={
                isDarkMode ? ['#bb86fc', '#3700b3'] : ['#6200ee', '#3700b3']
              }
              style={styles.avatarGradient}>
              <Image
                source={require('../assets/img/user.png')}
                style={styles.profileImage}
              />
            </LinearGradient>
            <View style={styles.verifiedBadge}>
              <Icon name="verified" size={24} color="#4CAF50" />
            </View>
          </View>

          <Text style={[styles.name, {color: colors.text}]}>
            ThinkZone Edubridge
          </Text>
          <Text style={[styles.title, {color: colors.accent}]}>
            Education Partner
          </Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.profileCard,
            {
              backgroundColor: colors.card,
              opacity: opacityValue,
              transform: [{translateY: translateYValue}],
            },
          ]}>
          {profileItems.map((item, index) => (
            <View key={index}>
              <View style={styles.profileItem}>
                <View style={styles.iconContainer}>
                  <Icon
                    name={item.icon}
                    size={24}
                    color={colors.accent}
                    style={styles.icon}
                  />
                </View>
                <View style={styles.profileTextContainer}>
                  <Text style={[styles.itemTitle, {color: colors.subText}]}>
                    {item.title}
                  </Text>
                  <Text style={[styles.itemValue, {color: colors.text}]}>
                    {item.value}
                  </Text>
                </View>
              </View>
              {index < profileItems.length - 1 && (
                <View
                  style={[styles.divider, {backgroundColor: colors.divider}]}
                />
              )}
            </View>
          ))}
        </Animated.View>

        <Animated.View
          style={[
            styles.actionsContainer,
            {
              opacity: opacityValue,
              transform: [{translateY: translateYValue}],
            },
          ]}>
          {/* <View
            style={[
              styles.actionButton,
              {backgroundColor: colors.card, borderColor: colors.divider},
            ]}>
            <Icon name="edit" size={20} color={colors.accent} />
            <Text style={[styles.actionButtonText, {color: colors.text}]}>
              Edit Profile
            </Text>
          </View>

          <View
            style={[
              styles.actionButton,
              {backgroundColor: colors.card, borderColor: colors.divider},
            ]}>
            <Icon name="settings" size={20} color={colors.accent} />
            <Text style={[styles.actionButtonText, {color: colors.text}]}>
              Settings
            </Text>
          </View> */}
        </Animated.View>

        <Animated.View
          style={[
            styles.logoutContainer,
            {
              opacity: opacityValue,
              transform: [{translateY: translateYValue}],
            },
          ]}>
          <TouchableOpacity
            style={[styles.logoutButton, {backgroundColor: colors.card}]}
            onPress={onLogOut}>
            <Icon name="logout" size={20} color="#f44336" />
            <Text style={[styles.logoutButtonText, {color: '#f44336'}]}>
              Log out
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
  },
  scrollContainer: {
    paddingBottom: 40,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  avatarGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  profileImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 2,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 5,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 10,
  },
  profileCard: {
    borderRadius: 16,
    marginHorizontal: 20,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  iconContainer: {
    width: 40,
    alignItems: 'center',
  },
  profileTextContainer: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 12,
    marginBottom: 2,
  },
  itemValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    marginLeft: 70,
    marginRight: 20,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginTop: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginHorizontal: 5,
  },
  actionButtonText: {
    marginLeft: 8,
    fontWeight: '500',
  },
  logoutContainer: {
    marginHorizontal: 20,
    marginTop: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(244, 67, 54, 0.3)',
  },
  logoutButtonText: {
    marginLeft: 8,
    fontWeight: '500',
  },
});

export default ProfilePage;
