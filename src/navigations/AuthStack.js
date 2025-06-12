import {StyleSheet, Text, View, Button} from 'react-native';
import React from 'react';

const AuthStack = ({navigation}) => {
  const handleLogin = async () => {
    await AsyncStorage.setItem('isLoggedIn', 'true');
    navigation.replace('StackScreen');
  };

  const buttonPressOnLandingScreen=()=>{

    navigation.naigate("")
  }

  return (
    <View style={styles.button}>
      <Button title="Login" onPress={handleLogin} />
    </View>
  );
};

export default AuthStack;

const styles = StyleSheet.create({
  button: {
    margin: '20%',
    width: '50%',
  },
});
