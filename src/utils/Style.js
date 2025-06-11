import {Platform} from 'react-native';

import Colors from './Colors';

export default {
  Colors,
  text: {
    color: Colors.lightDark,
    fontSize: 18,
    fontFamily: Platform.OS === 'android' ? 'Roboto' : 'Avenir',
  },
};
