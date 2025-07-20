import '@testing-library/jest-dom';
import { chrome } from 'jest-webextension-mock';

Object.assign(global, { chrome }); 