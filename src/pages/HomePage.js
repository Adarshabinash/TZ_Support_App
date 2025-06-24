import React, {useState, useEffect} from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
  Alert,
  BackHandler,
  Image,
  Dimensions,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const {width} = Dimensions.get('window');

const HomePage = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [teacher, setTeacher] = useState({});
  const scheme = useColorScheme();
  const isDarkMode = scheme === 'dark';
  const navigation = useNavigation();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const storedTeacher = await AsyncStorage.getItem('teacherData');

        if (storedTeacher) {
          const teacher = JSON.parse(storedTeacher);
          setTeacher(teacher);
          console.log('Teacher:', teacher);
        } else {
          console.warn('No teacher data found');
        }
      } catch (error) {
        console.error('Error reading teacher data:', error);
      }
    };

    fetchData();
  }, []);

  const colors = {
    background: isDarkMode ? '#121212' : '#f8f9fa',
    card: isDarkMode ? '#1e1e1e' : '#ffffff',
    text: isDarkMode ? '#ffffff' : '#2c3e50',
    subText: isDarkMode ? '#b0b0b0' : '#7f8c8d',
    primary: isDarkMode ? '#BB86FC' : '#6200EE',
    secondary: isDarkMode ? '#03DAC6' : '#03DAC6',
    accent: isDarkMode ? '#FF7597' : '#FF7597',
    divider: isDarkMode ? '#333333' : '#e0e0e0',
  };

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const value = await AsyncStorage.getItem('isLoggedIn');
        setIsLoggedIn(value === 'true');
      } catch (error) {
        console.error('Error checking login status:', error);
        setIsLoggedIn(false);
      }
    };
    checkLoginStatus();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      const backAction = () => {
        Alert.alert('Hold on!', 'Are you sure you want to exit the app?', [
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
    }, []),
  );

  const features = [
    {
      id: 1,
      title: 'Live Monitoring',
      icon: 'visibility',
      description: 'View ongoing classes',
      color: colors.primary,
    },
    {
      id: 2,
      title: 'Observation Logs',
      icon: 'list-alt',
      description: 'Recorded teacher observations',
      color: colors.accent,
    },
    {
      id: 3,
      title: 'Teacher Profiles',
      icon: 'person-search',
      description: 'View and manage teacher info',
      color: colors.secondary,
    },
    {
      id: 4,
      title: 'Attendance',
      icon: 'event-available',
      description: 'Check teacher attendance',
      color: '#FF9E3F',
    },
  ];

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header Section */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, {color: colors.text}]}>
              Hello, {teacher.teacherName} !
            </Text>
            <Text style={[styles.subHeading, {color: colors.subText}]}>
              Welcome back to your dashboard
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.profileButton, {backgroundColor: colors.card}]}>
            <Icon name="notifications" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View
            style={[styles.statCard, {backgroundColor: colors.primary + '20'}]}>
            <Icon name="people" size={24} color={colors.primary} />
            <Text style={[styles.statValue, {color: colors.text}]}>56</Text>
            <Text style={[styles.statLabel, {color: colors.subText}]}>
              Total Teachers
            </Text>
          </View>
          <View
            style={[
              styles.statCard,
              {backgroundColor: colors.secondary + '20'},
            ]}>
            <Icon name="wifi" size={24} color={colors.secondary} />
            <Text style={[styles.statValue, {color: colors.text}]}>13</Text>
            <Text style={[styles.statLabel, {color: colors.subText}]}>
              Active Now
            </Text>
          </View>
          <View
            style={[styles.statCard, {backgroundColor: colors.accent + '20'}]}>
            <Icon name="rate-review" size={24} color={colors.accent} />
            <Text style={[styles.statValue, {color: colors.text}]}>89</Text>
            <Text style={[styles.statLabel, {color: colors.subText}]}>
              Classes Observed
            </Text>
          </View>
        </View>

        {/* Quick Actions Title */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, {color: colors.text}]}>
            Quick Actions
          </Text>
          {/* <TouchableOpacity>
            <Text style={[styles.seeAll, {color: colors.primary}]}>
              See All
            </Text>
          </TouchableOpacity> */}
        </View>

        {/* Features Grid */}
        <View style={styles.featuresGrid}>
          {features.map(feature => (
            <View
              key={feature.id}
              style={[
                styles.featureCard,
                {backgroundColor: colors.card, borderColor: colors.divider},
              ]}
              onPress={() => navigation.navigate(feature.title)}>
              <View
                style={[
                  styles.featureIconContainer,
                  {backgroundColor: feature.color + '20'},
                ]}>
                <Icon name={feature.icon} size={24} color={feature.color} />
              </View>
              <Text style={[styles.featureTitle, {color: colors.text}]}>
                {feature.title}
              </Text>
              <Text style={[styles.featureDesc, {color: colors.subText}]}>
                {feature.description}
              </Text>
            </View>
          ))}
        </View>

        {/* Recent Activity */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, {color: colors.text}]}>
            Recent Activity
          </Text>
          {/* <TouchableOpacity>
            <Text style={[styles.seeAll, {color: colors.primary}]}>
              See All
            </Text>
          </TouchableOpacity> */}
        </View>

        <View style={[styles.activityCard, {backgroundColor: colors.card}]}>
          <View style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <Icon name="file-upload" size={20} color={colors.primary} />
            </View>
            <View style={styles.activityText}>
              <Text style={[styles.activityTitle, {color: colors.text}]}>
                Report Generated
              </Text>
              <Text style={[styles.activityTime, {color: colors.subText}]}>
                2 hours ago
              </Text>
            </View>
            {/* <Icon
              name="chevron-right"
              size={20}
              color={colors.subText}
              style={styles.activityArrow}
            /> */}
          </View>
          <View style={[styles.divider, {backgroundColor: colors.divider}]} />
          <View style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <Icon name="security" size={20} color={colors.secondary} />
            </View>
            <View style={styles.activityText}>
              <Text style={[styles.activityTitle, {color: colors.text}]}>
                Password Updated
              </Text>
              <Text style={[styles.activityTime, {color: colors.subText}]}>
                Yesterday
              </Text>
            </View>
            {/* <Icon
              name="chevron-right"
              size={20}
              color={colors.subText}
              style={styles.activityArrow}
            /> */}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: {
    padding: 20,
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  subHeading: {
    fontSize: 16,
    opacity: 0.8,
  },
  profileButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  statCard: {
    width: (width - 60) / 3,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '600',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  featureCard: {
    width: (width - 60) / 2,
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 12,
    opacity: 0.8,
  },
  activityCard: {
    borderRadius: 12,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(98, 0, 238, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  activityText: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    opacity: 0.7,
  },
  activityArrow: {
    marginLeft: 8,
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
});

export default HomePage;
