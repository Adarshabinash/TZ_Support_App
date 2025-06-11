import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Image,
} from 'react-native';

const HomeScreen = ({navigation}) => {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3E8EDE" />
      <Image
        style={{top: -100, width: 120, height: 120}}
        source={require('../assets/img/new_logo.png')}
      />
      <Text style={styles.title}>Welcome to</Text>
      <Text style={styles.appName}>Thinkzone Support App</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('About')}>
        <Text style={styles.buttonText}>Next</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#3E8EDE', // Thinkzone primary-like blue
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 22,
    color: '#fff',
    fontWeight: '300',
    marginBottom: 5,
  },
  appName: {
    fontSize: 30,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    elevation: 6,
    top: 30,
  },
  buttonText: {
    color: '#3E8EDE',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default HomeScreen;
