import React, {useState, useEffect} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import StackScreen from '../TZ_Support_App/src/navigations/StackNavigator';
import AuthStack from './src/navigations/AuthStack';
import LandingPage from './src/pages/LandingPage';

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(null);

  useEffect(() => {
    const checkLoginStatus = async () => {
      const value = await AsyncStorage.getItem('isLoggedIn');
      setIsLoggedIn(value);
    };
    checkLoginStatus();
  }, []);

  console.log('loggin in app------>', isLoggedIn);

  return (
    <NavigationContainer>
      <StackScreen />
    </NavigationContainer>
  );
};

export default App;
