import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {enableScreens} from 'react-native-screens';
import BottomTabsNavigator from './BottomNavigator';
import TakeQuiz from '../pages/TakeQuiz';
import ProfilePage from '../pages/ProfilePage';
import LandingPage from '../pages/LandingPage';
import LoginPage from '../pages/LoginPage'; // Import your LoginPage component
import AsyncStorage from '@react-native-async-storage/async-storage';

enableScreens();

const Stack = createNativeStackNavigator();

const StackScreen = ({setIsLoggedIn}) => {
  // const handleLogout = async navigation => {
  //   try {
  //     await AsyncStorage.multiRemove([
  //       'isLoggedIn',
  //       'teacherData',
  //       'userToken',
  //     ]);
  //     setIsLoggedIn(false);
  //     navigation.navigate('Login'); // Navigate to Login instead of Landing
  //   } catch (error) {
  //     console.error('Logout error:', error);
  //   }
  // };

  return (
    <Stack.Navigator initialRouteName="Home">
      <Stack.Screen
        name="Login"
        component={LoginPage}
        options={{headerShown: false}}
        initialParams={{setIsLoggedIn}}
      />
      <Stack.Screen
        name="Home"
        component={BottomTabsNavigator}
        options={{headerShown: false}}
        initialParams={{setIsLoggedIn}}
      />
      <Stack.Screen
        name="TakeQuiz"
        component={TakeQuiz}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="Profile"
        component={ProfilePage}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="Landing"
        component={LandingPage}
        options={{headerShown: false}}
      />
    </Stack.Navigator>
  );
};

export default StackScreen;
