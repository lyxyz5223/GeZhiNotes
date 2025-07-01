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
        <CanvasWebLink props={props} extraParams={extraParams} />
  );
};

export default CanvasWebLinkModule;
