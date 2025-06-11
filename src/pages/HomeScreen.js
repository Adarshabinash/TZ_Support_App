import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Image,
  Dimensions,
} from 'react-native';

const {width, height} = Dimensions.get('window');

const HomeScreen = ({navigation}) => {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3E8EDE" />

      <Image
        style={styles.logo}
        source={require('../assets/img/new_logo.png')}
        resizeMode="contain"
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
    backgroundColor: '#3E8EDE',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  logo: {
    width: width * 0.3,
    height: width * 0.3,
    marginBottom: height * 0.05,
  },
  title: {
    fontSize: width * 0.05,
    color: '#fff',
    fontWeight: '300',
    marginBottom: 5,
  },
  appName: {
    fontSize: width * 0.07,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: height * 0.05,
  },
  button: {
    backgroundColor: '#fff',
    paddingVertical: height * 0.015,
    paddingHorizontal: width * 0.1,
    borderRadius: 25,
    elevation: 6,
  },
  buttonText: {
    color: '#3E8EDE',
    fontSize: width * 0.045,
    fontWeight: '600',
  },
});

export default HomeScreen;
