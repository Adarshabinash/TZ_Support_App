import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import HomeScreen from '../pages/HomeScreen';
import AboutScreen from '../pages/AboutScreen';
import TakeQuiz from '../pages/TakeQuiz';
import {enableScreens} from 'react-native-screens';
import BottomTabsNavigator from './BottomNavigator';

enableScreens();

const Stack = createNativeStackNavigator();

const StackScreen = () => {
  return (
    <Stack.Navigator initialRouteName="BottomScreens">
      <Stack.Screen
        name="BottomScreens"
        component={BottomTabsNavigator}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="About"
        component={AboutScreen}
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
