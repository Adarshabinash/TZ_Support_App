import React from 'react';
import {Modalize} from 'react-native-modalize';

const BottomSheet = ({modalRef, children, modalHeight, top, width, height}) => {
  return (
    <>
      <Modalize
        ref={modalRef}
        modalHeight={modalHeight}
        style={{width: width, height: height, top: top}}>
        {children}
      </Modalize>
    </>
  );
};

export default BottomSheet;
