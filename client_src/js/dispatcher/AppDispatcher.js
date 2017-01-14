// @flow
import {Dispatcher} from 'flux';
import type {$Action}
from '../types/ActionType'

const AppDispatcher : Dispatcher < $Action > = new Dispatcher();

export default AppDispatcher;
