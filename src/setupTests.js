// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// The whole App renders in these tests; under parallel load the default 1s async wait is too tight.
import { configure } from '@testing-library/react';
configure({ asyncUtilTimeout: 5000 });
