import React from 'react';
import {View, Text, Button, StyleSheet, Alert} from 'react-native';

const HomeScreen = () => {
  const handlePress = () => {
    Alert.alert('Hello!', 'You pressed the button.');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Thinkzone Support App!</Text>
      <Button title="Press Me" onPress={handlePress} />
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F2',
    padding: 20,
  },
  title: {
    fontSize: 20,
    marginBottom: 20,
    color: '#333',
    fontWeight: 'bold',
  },
});
