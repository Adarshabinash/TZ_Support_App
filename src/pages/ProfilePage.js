import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {useEffect} from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  BackHandler,
  Alert,
  useColorScheme,
} from 'react-native';

const ProfilePage = ({navigation}) => {
  const scheme = useColorScheme();

  const isDarkMode = scheme === 'dark';

  const colors = {
    background: isDarkMode ? '#282828' : '#f4f6f8',
    card: isDarkMode ? '#1e1e1e' : '#ffffff',
    text: isDarkMode ? '#ffffff' : '#2c3e50',
    subText: isDarkMode ? '#cccccc' : '#34495e',
    buttonBg: isDarkMode ? '#3498db' : '#2980b9',
    imageButtonBg: isDarkMode ? '#2ecc71' : '#27ae60',
  };

  const onLogOut = () => {
    Alert.alert('Are you sure?', 'Do you want to log out?', [
      {text: 'Cancel', onPress: () => null},
      {
        text: 'Yes',
        onPress: () => {
          AsyncStorage.removeItem('isLoggedIn');
          navigation.navigate('Landing');
        },
      },
    ]);
  };

  useEffect(() => {
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

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <Image
        source={require('../assets/img/user.png')}
        style={styles.profileImage}
      />

      <Text style={[styles.name, {color: colors.text}]}>Adarsh Mishra</Text>
      <Text style={[styles.email, {color: colors.subText}]}>
        adarsh@example.com
      </Text>
      <Text style={[styles.phone, {color: colors.subText}]}>
        +91 9876543210
      </Text>

      <TouchableOpacity
        style={[
          styles.editButton,
          {backgroundColor: isDarkMode ? '#007FFF' : 'red'},
        ]}
        onPress={onLogOut}>
        <Text style={styles.editButtonText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ProfilePage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f4f6fc',
    padding: 20,
  },
  profileImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 6,
  },
  email: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  phone: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  editButton: {
    // backgroundColor: 'red',
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 20,
    top: '7%',
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
