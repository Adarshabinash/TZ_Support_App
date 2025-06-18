import React, {useState, useEffect} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import StackScreen from './src/navigations/StackNavigator';
import AuthStack from './src/navigations/AuthStack';

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(null);

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        // await AsyncStorage.removeItem('isLoggedIn');
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

  console.log('isLoggedIn in app.js---------->', isLoggedIn);

  return (
    <NavigationContainer>
      {isLoggedIn ? (
        <StackScreen setIsLoggedIn={setIsLoggedIn} />
      ) : (
        <AuthStack />
      )}
    </NavigationContainer>
  );
};

export default App;
