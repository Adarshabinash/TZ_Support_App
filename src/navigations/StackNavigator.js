import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import TakeQuiz from '../pages/TakeQuiz';
import {enableScreens} from 'react-native-screens';
import BottomTabsNavigator from './BottomNavigator';
import LandingPage from '../pages/LandingPage';
import LoginPage from '../pages/LoginPage';

enableScreens();

const Stack = createNativeStackNavigator();

const StackScreen = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="BottomScreens"
        component={BottomTabsNavigator}
        options={{headerShown: false}}
      />
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
        name="TakeQuiz"
        component={TakeQuiz}
        options={{headerShown: false}}
      />
    </Stack.Navigator>
  );
};

export default StackScreen;
