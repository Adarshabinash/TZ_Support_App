import React, {useState, useEffect} from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

const HomePage = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

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

  console.log('isLoggedIn in homepage---------->', isLoggedIn);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.greeting}>Hello, Adarsh 👋</Text>
      <Text style={styles.subHeading}>Welcome back to your dashboard</Text>

      <View style={styles.cardRow}>
        <TouchableOpacity style={styles.card}>
          <Text style={styles.cardTitle}>📊 Reports</Text>
          <Text style={styles.cardText}>View your stats</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card}>
          <Text style={styles.cardTitle}>👤 Profile</Text>
          <Text style={styles.cardText}>Manage your info</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.cardRow}>
        <TouchableOpacity style={styles.card}>
          <Text style={styles.cardTitle}>⚙️ Settings</Text>
          <Text style={styles.cardText}>App preferences</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card}>
          <Text style={styles.cardTitle}>📝 Tasks</Text>
          <Text style={styles.cardText}>Check your to-do</Text>
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
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
});
