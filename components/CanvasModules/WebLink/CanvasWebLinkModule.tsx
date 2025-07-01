import {
  CanvasMode,
  CustomCanvasProps,
  StateUpdater,
  WebLinkBlockInfo,
} from '@/types/CanvasTypes';
import React, { useCallback, useState } from 'react';
import { Alert, Linking, Text, TouchableOpacity, View } from 'react-native';
import CanvasWebLink from './CanvasWebLink';
import Draggable from 'react-native-draggable';

const CanvasWebLinkModule = ({
  props,
  extraParams,
}: {
  props: CustomCanvasProps;
  extraParams: any;
}) => {
  return (
    <View style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Draggable>
        <CanvasWebLink props={props} extraParams={extraParams} />
      </Draggable>
    </View>
  );
};

export default CanvasWebLinkModule;
