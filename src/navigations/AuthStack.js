import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {enableScreens} from 'react-native-screens';
import LandingPage from '../pages/LandingPage';
import LoginPage from '../pages/LoginPage';
import BottomTabsNavigator from './BottomNavigator';
import ProfilePage from '../pages/ProfilePage';

enableScreens();

const Stack = createNativeStackNavigator();

const AuthStack = () => {
  return (
    <Stack.Navigator initialRouteName="Landing">
      <Stack.Screen
        name="Landing"
        component={LandingPage}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="Login"
        component={LoginPage}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="Home"
        component={BottomTabsNavigator}
        options={{headerShown: false}}
      />

      <Stack.Screen name="Profile" component={ProfilePage} />
    </Stack.Navigator>
  );
};

export default AuthStack;
