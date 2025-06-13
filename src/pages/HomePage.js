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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useFocusEffect, useNavigation} from '@react-navigation/native';

const HomePage = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const scheme = useColorScheme();
  const isDarkMode = scheme === 'dark';
  const navigation = useNavigation();

  var colors = {
    background: isDarkMode ? '#282828' : '#f4f6f8',
    card: isDarkMode ? '#1e1e1e' : '#ffffff',
    text: isDarkMode ? '#ffffff' : '#2c3e50',
    subText: isDarkMode ? '#cccccc' : '#34495e',
    buttonBg: isDarkMode ? '#3498db' : '#2980b9',
    imageButtonBg: isDarkMode ? '#2ecc71' : '#27ae60',
  };

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const value = await AsyncStorage.getItem('isLoggedIn');
        console.log('AsyncStorage isLoggedIn value:', value);
        setIsLoggedIn(value === 'true');
      } catch (error) {
        console.error('Error checking login status:', error);
        setIsLoggedIn(false);
      }
    };
    checkLoginStatus();
  }, []);

  if (isLoggedIn === null) {
    return null;
  }

  useFocusEffect(
    React.useCallback(() => {
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
    }, []),
  );

  console.log('isLoggedIn in homepage---------->', isLoggedIn);

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        {backgroundColor: colors.background},
      ]}>
      <Text style={[styles.greeting, {color: colors.text}]}>
        Hello, Adarsh 👋
      </Text>
      <Text style={[styles.subHeading, {color: colors.text}]}>
        Welcome back to your dashboard
      </Text>

      <View style={styles.cardRow}>
        <TouchableOpacity
          style={[
            styles.card,
            {backgroundColor: colors.background, borderColor: colors.text},
          ]}>
          <Text style={[styles.cardTitle, {color: colors.text}]}>
            📊 Reports
          </Text>
          <Text style={[styles.cardText, {color: colors.text}]}>
            View your stats
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.card,
            {backgroundColor: colors.background, borderColor: colors.text},
          ]}>
          <Text style={[styles.cardTitle, {color: colors.text}]}>
            👤 Profile
          </Text>
          <Text style={[styles.cardText, {color: colors.text}]}>
            Manage your info
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.cardRow}>
        <TouchableOpacity
          style={[
            styles.card,
            {backgroundColor: colors.background, borderColor: colors.text},
          ]}>
          <Text style={[styles.cardTitle, {color: colors.text}]}>
            ⚙️ Settings
          </Text>
          <Text style={[styles.cardText, {color: colors.text}]}>
            App preferences
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.card,
            {backgroundColor: colors.background, borderColor: colors.text},
          ]}>
          <Text style={[styles.cardTitle, {color: colors.text}]}>📝 Tasks</Text>
          <Text style={[styles.cardText, {color: colors.text}]}>
            Check your to-do
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default HomePage;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f7f9fc',
    flex: 1,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 6,
    color: '#333',
    top: 90,
  },
  subHeading: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    top: 90,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    top: 160,
  },
  card: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    width: '48%',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
});
