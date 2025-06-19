import 'react-native-gesture-handler'; // must be top-most import
import {AppRegistry, SafeAreaView} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import React from 'react';
import {GestureHandlerRootView} from 'react-native-gesture-handler';

const Root = () => (
  <SafeAreaView style={{flex: 1}}>
    <App />
  </SafeAreaView>
);

AppRegistry.registerComponent(appName, () => Root);
